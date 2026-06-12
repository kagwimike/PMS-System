from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.apps import apps

from .models import MaintenanceRequest, Vendor
from .serializers import MaintenanceRequestSerializer, VendorSerializer
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from notifications.models import Notification


# ----------------- VENDOR VIEWSET -----------------
class VendorViewSet(viewsets.ModelViewSet):
    """
    Handles Vendor Profiles:
    - Landlords/Admins have full read-write privileges.
    - Tenants can read ('GET') vendor info so they display on the dashboard.
    """
    queryset = Vendor.objects.all().order_by('name')
    serializer_class = VendorSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        # Prevent tenants from creating vendor profiles
        if getattr(request.user, "role", None) not in ["OWNER", "ADMIN"]:
            return Response(
                {"error": "Access Denied: Only landlords or administrators can register new vendors."},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().create(request, *args, **kwargs)


# ----------------- MAINTENANCE REQUEST VIEWSET -----------------
class MaintenanceRequestViewSet(viewsets.ModelViewSet):
    """
    Handles maintenance requests with role boundaries:
    - ONLY tenants can create maintenance requests.
    - Landlords (Owners) view property-specific requests and assign vendors.
    - Automatically discovers Property and Unit info based on the tenant's active lease.
    - Dispatches WebSocket and internal DB notifications upon changes.
    """
    queryset = MaintenanceRequest.objects.all()
    serializer_class = MaintenanceRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    # ----------------- 1. QUERYSET BOUNDARIES -----------------
    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()
        user_role = getattr(user, "role", None)

        if user_role == "TENANT":
            return queryset.filter(tenant=user).order_by('-created_at')

        if user_role == "OWNER":
            return queryset.filter(property__owner=user).order_by('-created_at')

        if user_role == "ADMIN":
            return queryset.order_by('-created_at')

        return queryset.none()

    # ----------------- 2. ROLE-BASED CREATION BLOCK -----------------
    def create(self, request, *args, **kwargs):
        if getattr(request.user, "role", None) != "TENANT":
            return Response(
                {"error": "Access Denied: Only tenants are permitted to create maintenance requests."},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        user = self.request.user
        Lease = apps.get_model('leases', 'Lease')
        active_lease = Lease.objects.filter(tenant=user, status="ACTIVE").first()
        
        if active_lease:
            serializer.save(
                tenant=user,
                unit=active_lease.unit,
                property=active_lease.unit.property if active_lease.unit else None
            )
        else:
            serializer.save(tenant=user)

    # ----------------- 3. UPDATE LOGIC -----------------
    def perform_update(self, serializer):
        old_instance = self.get_object()
        old_vendor = old_instance.assigned_vendor
        old_status = old_instance.status
        
        instance = serializer.save()

        # 1. Fallback tracking if landlord updates vendor via standard form
        if instance.assigned_vendor and (old_vendor != instance.assigned_vendor):
            self._dispatch_vendor_notifications(instance)

        # 2. Fallback notification if state progress changes outside the custom endpoints
        if old_status != instance.status:
            self._dispatch_status_change_notifications(instance, old_status)

    # Helper method to keep vendor assignment notifications DRY
    def _dispatch_vendor_notifications(self, instance):
        channel_layer = get_channel_layer()
        if channel_layer:
            try:
                async_to_sync(channel_layer.group_send)(
                    "maintenance_updates",
                    {
                        "type": "maintenance_update",
                        "data": {
                            "id": instance.id,
                            "status": instance.status,
                            "vendor": instance.assigned_vendor.name if instance.assigned_vendor else "Unassigned",
                        },
                    }
                )
            except Exception:
                pass

        Notification.objects.create(
            recipient=instance.tenant,
            message=f"Vendor '{instance.assigned_vendor.name}' has been assigned to your request: '{instance.title}'.",
            link=f"/maintenance/{instance.id}"
        )

        if hasattr(instance.assigned_vendor, "user") and instance.assigned_vendor.user:
            Notification.objects.create(
                recipient=instance.assigned_vendor.user,
                message=f"New Assignment: You have a work order for Unit {instance.unit.unit_number if instance.unit else 'N/A'}.",
                link=f"/maintenance/{instance.id}"
            )

    # Helper method to alert management and broadcast progress over WebSockets
    def _dispatch_status_change_notifications(self, instance, old_status):
        channel_layer = get_channel_layer()
        if channel_layer:
            try:
                async_to_sync(channel_layer.group_send)(
                    "maintenance_updates",
                    {
                        "type": "maintenance_update",
                        "data": {
                            "id": instance.id,
                            "status": instance.status,
                            "vendor": instance.assigned_vendor.name if instance.assigned_vendor else "Unassigned",
                        },
                    }
                )
            except Exception:
                pass

        # Notify Landlord/Property Manager
        if instance.property and instance.property.owner:
            Notification.objects.create(
                recipient=instance.property.owner,
                message=f"Tenant shifted progress of '{instance.title}' from {old_status} to {instance.status} at Unit {instance.unit.unit_number if instance.unit else 'N/A'}.",
                link=f"/maintenance/{instance.id}"
            )

    # ----------------- 4. EXPLICIT VENDOR ASSIGNMENT ENDPOINT -----------------
    @action(detail=True, methods=["post"], url_path="assign")
    def assign_vendor(self, request, pk=None):
        if getattr(request.user, "role", None) not in ["OWNER", "ADMIN"]:
            return Response(
                {"error": "Access Denied: Only property managers or admins can assign vendors."},
                status=status.HTTP_403_FORBIDDEN
            )

        maintenance_request = self.get_object()
        vendor_id = request.data.get("vendor")

        if not vendor_id:
            return Response({"error": "Vendor ID is required field."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            vendor = Vendor.objects.get(id=vendor_id)
        except Vendor.DoesNotExist:
            return Response({"error": "Vendor not found."}, status=status.HTTP_404_NOT_FOUND)

        if maintenance_request.assigned_vendor != vendor:
            maintenance_request.assigned_vendor = vendor
            if maintenance_request.status == "PENDING":
                maintenance_request.status = "ASSIGNED"
            
            maintenance_request.save()
            self._dispatch_vendor_notifications(maintenance_request)

        return Response(
            {
                "message": "Vendor assigned successfully.",
                "status": maintenance_request.status,
                "vendor": vendor.name
            },
            status=status.HTTP_200_OK
        )

    # ----------------- 5. FLEXIBLE TENANT DYNAMIC PROGRESS CONTROL -----------------
    # This overrides partial_update (PATCH) to intercept calls from `API.patch('/maintenance/requests/${id}/', {status: ...})`
    def partial_update(self, request, *args, **kwargs):
        user = request.user
        instance = self.get_object()
        target_status = request.data.get("status")

        # If a tenant is attempting to update status, enforce pipeline safety constraints
        if getattr(user, "role", None) == "TENANT":
            if instance.tenant != user:
                return Response(
                    {"error": "Access Denied: You cannot track maintenance updates on another tenant's unit."},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            if target_status:
                valid_tenant_stages = ["IN_PROGRESS", "COMPLETED", "VERIFIED"]
                if target_status not in valid_tenant_stages:
                    return Response(
                        {"error": f"Invalid Pipeline Mutation. Tenants can only set targets to: {valid_tenant_stages}"},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # Optional validation: Prevent jumping straight to VERIFIED from PENDING
                if target_status == "VERIFIED" and instance.status not in ["COMPLETED", "COMPLETED_BY_VENDOR"]:
                    return Response(
                        {"error": "Validation Rule: You cannot verify a task before it has been marked completed."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                old_status = instance.status
                instance.status = target_status
                instance.save()
                
                # Fire alerts to the landlord and dispatch to client UI
                self._dispatch_status_change_notifications(instance, old_status)
                
                serializer = self.get_serializer(instance)
                return Response(serializer.data, status=status.HTTP_200_OK)

        return super().partial_update(request, *args, **kwargs)

    @action(detail=True, methods=["post"])
    def confirm_completion(self, request, pk=None):
        """
        Maintained as a legacy backward-compatible fallback endpoint. 
        Forces status directly into 'COMPLETED'.
        """
        user = request.user
        maintenance = self.get_object()

        if maintenance.tenant != user:
            return Response(
                {"error": "You are not allowed to confirm completion for this request."},
                status=status.HTTP_403_FORBIDDEN
            )

        if maintenance.status == "COMPLETED":
            return Response(
                {"status": "Request is already marked completed."},
                status=status.HTTP_400_BAD_REQUEST
            )

        old_status = maintenance.status
        maintenance.status = "COMPLETED"
        maintenance.save()

        self._dispatch_status_change_notifications(maintenance, old_status)
        return Response({"status": "Maintenance marked as completed."})