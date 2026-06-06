from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from django.contrib.auth import get_user_model

from .models import Lease
from .serializers import LeaseSerializer

User = get_user_model()

class LeaseViewSet(viewsets.ModelViewSet):
    serializer_class = LeaseSerializer
    permission_classes = [IsAuthenticated]

    # =============================
    # Queryset Control (SECURE)
    # =============================
    def get_queryset(self):
        user = self.request.user

        base_queryset = Lease.objects.select_related(
            "unit",
            "unit__property",
            "tenant"
        )

        user_role = getattr(user, "role", None)

        # Tenant → only see their leases
        if user_role == "TENANT":
            return base_queryset.filter(tenant=user)

        # Owner → see leases of their properties
        if user_role == "OWNER":
            return base_queryset.filter(unit__property__owner=user)

        # Admin → see everything
        if user_role == "ADMIN":
            return base_queryset

        # Default fallback (secure)
        return base_queryset.none()

    # =============================
    # Create Lease (Overridden for Option B Integration)
    # =============================
    def create(self, request, *args, **kwargs):
        """
        Allows Owners to send a 'tenant_email' from the frontend instead of an ID.
        Locates the public user account and maps it directly to the lease payload.
        """
        data = request.data.copy()
        tenant_email = data.get("tenant_email")

        if tenant_email:
            try:
                tenant_user = User.objects.get(email__iexact=tenant_email.strip())
                data["tenant"] = tenant_user.id  # Assign the discovered ID back to standard field
            except User.DoesNotExist:
                return Response(
                    {"error": f"No user account found with the email '{tenant_email}'. Please have the tenant register on the website first."},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        # Respect whatever status (ACTIVE or PENDING) is assigned by the owner on the client side
        # Defaults to PENDING if not specified
        status_value = self.request.data.get("status", "PENDING")
        serializer.save(status=status_value)

    # =============================
    # Update Lease
    # =============================
    def perform_update(self, serializer):
        serializer.save()

    # =============================
    # Tenant-Specific Endpoint
    # =============================
    @action(detail=False, methods=["get"], url_path="tenant")
    def tenant_leases(self, request):
        leases = self.get_queryset().filter(tenant=request.user)
        serializer = self.get_serializer(leases, many=True)
        return Response(serializer.data)

    # =============================
    # Terminate Lease
    # =============================
    @action(detail=True, methods=["post"], url_path="terminate")
    def terminate(self, request, pk=None):
        lease = self.get_object()

        # Prevent double termination
        if lease.status == "TERMINATED":
            return Response(
                {"error": "Lease is already terminated."},
                status=status.HTTP_400_BAD_REQUEST
            )

        user_role = getattr(request.user, "role", None)

        # Only OWNER or ADMIN can terminate
        if user_role not in ["OWNER", "ADMIN"]:
            return Response(
                {"error": "You do not have permission to terminate this lease."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Extra security: Owner can only terminate leases of their own properties
        if user_role == "OWNER" and lease.unit.property.owner != request.user:
            return Response(
                {"error": "You can only terminate leases of your own properties."},
                status=status.HTTP_403_FORBIDDEN
            )

        lease.status = "TERMINATED"
        lease.end_date = timezone.now().date()
        lease.save()  # Your model save() automatically updates unit to VACANT here

        return Response(
            {"message": "Lease terminated successfully."},
            status=status.HTTP_200_OK
        )