from rest_framework import viewsets, permissions, status
from django.core.mail import send_mail
from django.conf import settings
from .models import Inspection, Damage
from .serializers import InspectionSerializer, DamageSerializer

class InspectionViewSet(viewsets.ModelViewSet):
    """
    Handles viewing and managing property walkthrough records.
    Safely handles router initialization and limits access based on user roles.
    """
    # Baseline fallback queryset required by DRF DefaultRouter initialization
    queryset = Inspection.objects.none()
    serializer_class = InspectionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Dynamically filters data logs by user system role:
        - Landlords/Staff see all registered property walk-through items.
        - Tenants see only logs bound strictly to their active lease history.
        """
        user = self.request.user
        if getattr(user, 'is_staff', False): 
            return Inspection.objects.all()
        
        return Inspection.objects.filter(lease__tenant=user)

    def perform_create(self, serializer):
        # Automatically save the current user instance context into the audit trail
        inspection = serializer.save(inspector=self.request.user)
        
        # Check transient payload flag from frontend to issue alerts
        if self.request.data.get('trigger_tenant_notification', False):
            self.send_inspection_email(inspection)

    def send_inspection_email(self, inspection):
        try:
            tenant = inspection.lease.tenant
            if tenant.email:
                subject = f"Property Inspection Report: Unit {inspection.lease.unit.unit_number}"
                message = (
                    f"Hello {tenant.first_name or 'Tenant'},\n\n"
                    f"An official property walkthrough has been recorded for your unit.\n\n"
                    f"Type: {inspection.get_inspection_type_display()}\n"
                    f"Score: {inspection.condition_score}/100\n"
                    f"Auditor: {inspection.inspector.username}\n\n"
                    f"Notes:\n{inspection.notes}\n\n"
                    f"Regards,\nProperty Management Team"
                )
                send_mail(
                    subject, 
                    message, 
                    settings.DEFAULT_FROM_EMAIL, 
                    [tenant.email], 
                    fail_silently=False
                )
        except Exception as e:
            print(f"Automated notification transmission failure: {str(e)}")


class DamageViewSet(viewsets.ModelViewSet):
    """
    Handles CRUD operations for itemized property asset structural damage entries.
    """
    queryset = Damage.objects.all()
    serializer_class = DamageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save()