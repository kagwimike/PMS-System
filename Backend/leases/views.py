# leases/views.py
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Lease
from .serializers import LeaseSerializer
from django.utils import timezone
from rest_framework import status

class LeaseViewSet(viewsets.ModelViewSet):
    queryset = Lease.objects.all()
    serializer_class = LeaseSerializer
    permission_classes = [IsAuthenticated]  # ✅ class-based permission

    def perform_create(self, serializer):
        # Auto set lease active on creation
        lease = serializer.save(status="ACTIVE")
        lease.unit.status = "OCCUPIED"
        lease.unit.save()

    def perform_update(self, serializer):
        lease = serializer.save()
        # Update unit status if lease terminated
        if lease.status == "TERMINATED":
            lease.unit.status = "VACANT"
            lease.unit.save()

    # Custom endpoint for tenant-specific leases
    @action(detail=False, methods=['get'], url_path='tenant')
    def tenant_leases(self, request):
        leases = Lease.objects.filter(tenant=request.user)
        serializer = self.get_serializer(leases, many=True)
        return Response(serializer.data)

    # ✅ Terminate Lease Endpoint
    @action(detail=True, methods=['post'], url_path='terminate')
    def terminate(self, request, pk=None):
        lease = self.get_object()

        # Prevent double termination
        if lease.status == "TERMINATED":
            return Response(
                {"error": "Lease is already terminated."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Optional: Only owner or admin can terminate
        if request.user.role not in ["OWNER", "ADMIN"]:
            return Response(
                {"error": "You do not have permission to terminate this lease."},
                status=status.HTTP_403_FORBIDDEN
            )

        lease.status = "TERMINATED"
        lease.end_date = timezone.now().date()
        lease.save()  # 🔥 This will auto-set unit VACANT from model

        return Response(
            {"message": "Lease terminated successfully."},
            status=status.HTTP_200_OK
        )