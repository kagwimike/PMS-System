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
    - Dispatches WebSocket and internal DB notifications upon vendor assignment.
    """
    queryset = MaintenanceRequest.objects.all()
    serializer_class = MaintenanceRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    # ----------------- 1. QUERYSET BOUNDARIES -----------------
    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()
        user_role = getattr(user, "role", None)

        # Tenants: Only see requests they created
        if user_role == "TENANT":
            return queryset.filter(tenant=user).order_by('-created_at')

        # Owners (Landlords): Only see requests for properties they own
        if user_role == "OWNER":
            return queryset.filter(property__owner=user).order_by('-created_at')

        # Admin: Full global view
        if user_role == "ADMIN":
            return queryset.order_by('-created_at')

        return queryset.none()

    # ----------------- 2. ROLE-BASED CREATION BLOCK -----------------
    def create(self, request, *args, **kwargs):
        """
        Overridden to ensure ONLY tenants can submit requests.
        Landlords and Admins are restricted.
        """
        if getattr(request.user, "role", None) != "TENANT":
            return Response(
                {"error": "Access Denied: Only tenants are permitted to create maintenance requests."},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        """
        Intercepts creation to auto-bind the tenant's current Property and Unit.
        """
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

    # ----------------- 3. UPDATE & VENDOR ASSIGNMENT DISPATCH -----------------
    def perform_update(self, serializer):
        # Track what the vendor was BEFORE the update to catch new assignments
        old_instance = self.get_object()
        old_vendor = old_instance.assigned_vendor
        
        instance = serializer.save()

        # Check if a vendor was just newly assigned or swapped
        if instance.assigned_vendor and (old_vendor != instance.assigned_vendor):
            
            # --- WebSocket Broadcast to Group ---
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
                                "vendor": instance.assigned_vendor.name,
                            },
                        }
                    )
                except Exception:
                    pass

            # --- DB Notification: Alert the Tenant ---
            Notification.objects.create(
                recipient=instance.tenant,
                message=f"Vendor '{instance.assigned_vendor.name}' has been assigned to your request: '{instance.title}'.",
                link=f"/maintenance/{instance.id}"
            )

            # --- DB Notification: Alert the Vendor (if account linked) ---
            if hasattr(instance.assigned_vendor, "user") and instance.assigned_vendor.user:
                Notification.objects.create(
                    recipient=instance.assigned_vendor.user,
                    message=f"New Assignment: You have a work order for Unit {instance.unit.unit_number if instance.unit else 'N/A'}.",
                    link=f"/maintenance/{instance.id}"
                )

    # ----------------- 4. TENANT CONFIRM COMPLETION -----------------
    @action(detail=True, methods=["post"])
    def confirm_completion(self, request, pk=None):
        user = request.user
        maintenance = self.get_object()

        # Only the tenant who opened the ticket can close it out
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

        maintenance.status = "COMPLETED"
        maintenance.save()

        # Notify the property owner that the tenant verified the job is done
        if maintenance.property and maintenance.property.owner:
            Notification.objects.create(
                recipient=maintenance.property.owner,
                message=f"Tenant confirmed completion of maintenance request '{maintenance.title}' at Unit {maintenance.unit.unit_number if maintenance.unit else 'N/A'}.",
                link=f"/maintenance/{maintenance.id}"
            )

        return Response({"status": "Maintenance marked as completed."})