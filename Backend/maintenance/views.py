# maintenance/views.py
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import MaintenanceRequest, Vendor
from .serializers import MaintenanceRequestSerializer, VendorSerializer
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from notifications.models import Notification


# ----------------- VENDOR VIEWSET -----------------
class VendorViewSet(viewsets.ModelViewSet):
    queryset = Vendor.objects.all()
    serializer_class = VendorSerializer
    permission_classes = [permissions.IsAuthenticated]


# ----------------- MAINTENANCE REQUEST VIEWSET -----------------
class MaintenanceRequestViewSet(viewsets.ModelViewSet):
    """
    Handles maintenance requests:
    - Tenants see only their requests
    - Admin/Owner can see all
    - Optional filtering by status or vendor for Admin/Owner
    - WebSocket notifications on updates
    - Tenant can confirm completion
    """
    queryset = MaintenanceRequest.objects.all()
    serializer_class = MaintenanceRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    # ----------------- QUERYSET -----------------
    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()

        # Tenants: only see their own requests
        if user.role not in ["ADMIN", "OWNER"]:
            queryset = queryset.filter(tenant=user)

        # Optional filtering for admin/owner
        status_param = self.request.query_params.get('status')
        vendor_param = self.request.query_params.get('vendor')

        if status_param:
            queryset = queryset.filter(status=status_param)
        if vendor_param:
            queryset = queryset.filter(assigned_vendor_id=vendor_param)

        return queryset.order_by('-created_at')  # latest first

    # ----------------- UPDATE -----------------
    def perform_update(self, serializer):
        instance = serializer.save()

        # --- WebSocket Broadcast ---
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            "maintenance_updates",
            {
                "type": "maintenance_update",
                "data": {
                    "id": instance.id,
                    "status": instance.status,
                    "vendor": instance.assigned_vendor.name if instance.assigned_vendor else None,
                },
            }
        )

        # --- Notifications ---
        # Notify Tenant if vendor assigned or status changed
        if instance.assigned_vendor:
            Notification.objects.create(
                recipient=instance.tenant,
                message=f"Vendor {instance.assigned_vendor.name} has been assigned to your request.",
                link=f"/maintenance/{instance.id}"
            )

            # Notify Vendor if linked to a user account
            if hasattr(instance.assigned_vendor, "user") and instance.assigned_vendor.user:
                Notification.objects.create(
                    recipient=instance.assigned_vendor.user,
                    message=f"You have been assigned a maintenance request.",
                    link=f"/maintenance/{instance.id}"
                )

    # ----------------- TENANT CONFIRM COMPLETION -----------------
    @action(detail=True, methods=["post"])
    def confirm_completion(self, request, pk=None):
        user = request.user
        maintenance = self.get_object()

        # Only tenant who owns this request can confirm
        if maintenance.tenant != user:
            return Response(
                {"error": "You are not allowed to confirm this request."},
                status=status.HTTP_403_FORBIDDEN
            )

        if maintenance.status == "COMPLETED":
            return Response(
                {"status": "Request already completed."},
                status=status.HTTP_400_BAD_REQUEST
            )

        maintenance.status = "COMPLETED"
        maintenance.save()

        # Optional: Notify Admin/Owner that tenant confirmed completion
        Notification.objects.create(
            recipient=None,  # Replace with admin/owner if needed
            message=f"Tenant {user.username} confirmed completion of maintenance request '{maintenance.title}'.",
            link=f"/maintenance/{maintenance.id}"
        )

        return Response({"status": "Maintenance marked as completed."})