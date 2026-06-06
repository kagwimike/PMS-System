from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Tenant
from .serializers import TenantSerializer

class TenantViewSet(viewsets.ModelViewSet):
    """
    A viewset for viewing and editing tenant instances.
    Provides query filtering by email for the Option B move-in workflow.
    """
    serializer_class = TenantSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Dynamically filters the tenants queryset.
        Ensures everything stays ordered by creation date, and supports email query parsing.
        """
        # 1. Base queryset with consistent chronological ordering
        queryset = Tenant.objects.all().order_by("-created_at")
        
        # 2. Extract the 'email' query parameter from the URL if present (e.g., /api/tenants/?email=mike@test.com)
        email = self.request.query_params.get('email')

        if email:
            # Using __iexact ensures search is case-insensitive (e.g., 'Mike@Test.com' matches 'mike@test.com')
            queryset = queryset.filter(email__iexact=email.strip())

        return queryset