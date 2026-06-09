from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import transaction

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

        if user_role == "TENANT":
            return base_queryset.filter(tenant=user)
        if user_role == "OWNER":
            return base_queryset.filter(unit__property__owner=user)
        if user_role == "ADMIN":
            return base_queryset
        return base_queryset.none()

    # =============================
    # Create Lease
    # =============================
    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        tenant_email = data.get("tenant_email")

        if tenant_email:
            try:
                tenant_user = User.objects.get(email__iexact=tenant_email.strip())
                data["tenant"] = tenant_user.id
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
        status_value = self.request.data.get("status", "ACTIVE")
        serializer.save(status=status_value)

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
    # Terminate Lease (Mid-Month Relocation & Deposit Settlement)
    # =============================
    @action(detail=True, methods=["post"], url_path="terminate")
    def terminate(self, request, pk=None):
        lease = self.get_object()

        # 1. Core Safety & State Verifications
        if lease.status == "TERMINATED":
            return Response({"error": "Lease is already terminated."}, status=status.HTTP_400_BAD_REQUEST)

        user_role = getattr(request.user, "role", None)
        if user_role not in ["OWNER", "ADMIN"]:
            return Response({"error": "You do not have permission to terminate this lease."}, status=status.HTTP_403_FORBIDDEN)

        if user_role == "OWNER" and lease.unit.property.owner != request.user:
            return Response({"error": "You can only terminate leases of your own properties."}, status=status.HTTP_403_FORBIDDEN)

        # 2. Extract Mid-Month Financial Settings from Request Body
        # Frontend can optionally send custom refund numbers based on move-out inspections
        deposit_refund_amount = request.data.get("deposit_refund_amount")
        deduction_reason = request.data.get("deduction_reason", "Mid-month lease termination adjustments.")
        prorate_rent = request.data.get("prorate_rent", True)

        today = timezone.now().date()

        # Use an atomic transaction block so everything succeeds together or rolls back cleanly
        with transaction.atomic():
            
            # 3. Address Chronological Date Validation Error
            if lease.start_date > today:
                lease.start_date = today

            # 4. Perform Mid-Month Rent Proration Calculation (Optional)
            if prorate_rent and lease.start_date < today and today.day < 28:
                # Calculate days occupied in the final month
                days_occupied = today.day
                import calendar
                days_in_month = calendar.monthrange(today.year, today.month)[1]
                
                original_monthly_rent = float(lease.rent_amount or lease.unit.rent_price or 0)
                prorated_rent_value = (original_monthly_rent / days_in_month) * days_occupied
                
                # Update final lease billing amount records for history logs
                lease.rent_amount = round(prorated_rent_value, 2)

            # 5. Handle Deposit Accounting Integration
            # Updates fields if they exist on your Lease model, or tracks them for dynamic receipt payloads
            if deposit_refund_amount is not None:
                try:
                    # Explicitly logging settlement context attributes
                    lease.deposit_refunded = float(deposit_refund_amount)
                    lease.termination_notes = deduction_reason
                except AttributeError:
                    # Fallback if your lease schema doesn't hold columns for historical settlements yet
                    pass

            # 6. Execute State Transformations
            lease.status = "TERMINATED"
            lease.end_date = today
            
            # Manually force the child property unit to become VACANT immediately
            if lease.unit:
                lease.unit.availability_status = "VACANT"
                lease.unit.save()

            try:
                lease.full_clean()
                lease.save()
            except ValidationError as e:
                return Response({"error": e.message_dict}, status=status.HTTP_400_BAD_REQUEST)

        # 7. Success Output Structure
        return Response({
            "message": "Lease terminated mid-month successfully. Unit status set to VACANT.",
            "settlement_summary": {
                "final_end_date": str(today),
                "adjusted_rent_charge": f"${float(lease.rent_amount):.2f}",
                "deposit_refunded": f"${float(deposit_refund_amount or 0):.2f}",
                "inspection_notes": deduction_reason
            }
        }, status=status.HTTP_200_OK)