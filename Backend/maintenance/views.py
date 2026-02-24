from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import MaintenanceRequest, Vendor
from .serializers import MaintenanceRequestSerializer, VendorSerializer
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from notifications.models import Notification


class VendorViewSet(viewsets.ModelViewSet):
    queryset = Vendor.objects.all()
    serializer_class = VendorSerializer
    permission_classes = [permissions.IsAuthenticated]


class MaintenanceRequestViewSet(viewsets.ModelViewSet):
    queryset = MaintenanceRequest.objects.all()
    serializer_class = MaintenanceRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    # Optional filtering
    def get_queryset(self):
        queryset = super().get_queryset()
        status = self.request.query_params.get('status')
        vendor = self.request.query_params.get('vendor')

        if status:
            queryset = queryset.filter(status=status)

        if vendor:
            queryset = queryset.filter(assigned_vendor_id=vendor)

        return queryset

    # ✅ When request is updated (e.g. vendor assigned or status changed)
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

        # --- Notifications Logic ---
        # If vendor assigned
        if instance.assigned_vendor:

            # Notify Tenant
            Notification.objects.create(
                recipient=instance.tenant,
                message=f"Vendor {instance.assigned_vendor.name} has been assigned to your request.",
                link=f"/maintenance/{instance.id}"
            )

            # Notify Vendor (if vendor linked to user)
            if hasattr(instance.assigned_vendor, "user") and instance.assigned_vendor.user:
                Notification.objects.create(
                    recipient=instance.assigned_vendor.user,
                    message=f"You have been assigned a maintenance request.",
                    link=f"/maintenance/{instance.id}"
                )

    # ✅ Tenant confirms completion
    @action(detail=True, methods=["post"])
    def confirm_completion(self, request, pk=None):
        maintenance = self.get_object()
        maintenance.status = "COMPLETED"
        maintenance.save()

        return Response({"status": "Maintenance marked as completed"})
