from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Tenant
from .serializers import TenantSerializer

class TenantViewSet(viewsets.ModelViewSet):
    queryset = Tenant.objects.all().order_by("-created_at")
    serializer_class = TenantSerializer
    permission_classes = [IsAuthenticated]  # Only logged-in users can manage tenants

    # Optional: override create to add custom validation or logging
    # def perform_create(self, serializer):
    #     serializer.save()
def get_queryset(self):
    queryset = Tenant.objects.all()
    email = self.request.query_params.get('email')

    if email:
        queryset = queryset.filter(email=email)

    return queryset
