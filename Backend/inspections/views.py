# inspections/views.py
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from django.core.mail import send_mail
from django.conf import settings
from .models import Inspection, Damage
from .serializers import InspectionSerializer, DamageSerializer

class InspectionViewSet(viewsets.ModelViewSet):
    queryset = Inspection.objects.all()
    serializer_class = InspectionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        # 1. Grab the current logged-in landlord user profile details automatically
        user = self.request.user
        inspector_display_name = user.get_full_name() or user.username

        # 2. Save the inspection instance with the auto-detected inspector name
        inspection = serializer.save(inspector_name=inspector_display_name)
        
        # 3. Intercept the transient boolean flag from the React frontend payload
        trigger_notification = self.request.data.get('trigger_tenant_notification', False)
        
        if trigger_notification:
            try:
                # Follow relationships up to the tenant profile
                lease = inspection.lease
                tenant = lease.tenant
                tenant_email = getattr(tenant, 'email', None)
                
                if tenant_email:
                    subject = f"Property Inspection Report: Unit {lease.unit.unit_number}"
                    message = (
                        f"Hello {tenant.first_name or 'Tenant'},\n\n"
                        f"An official property walkthrough has been recorded for your unit.\n\n"
                        f"Phase: {inspection.inspection_type}\n"
                        f"Calculated Condition Score: {inspection.condition_score}/100\n"
                        f"Assigned Auditor: {inspector_display_name}\n\n"
                        f"Manager Breakdown Notes:\n{inspection.notes}\n\n"
                        f"If you have any questions regarding this breakdown, please contact management.\n\n"
                        f"Best regards,\nProperty Management Support Team"
                    )
                    
                    send_mail(
                        subject=subject,
                        message=message,
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        recipient_list=[tenant_email],
                        fail_silently=False,
                    )
            except Exception as e:
                # Log the failure in terminal but don't break the client's HTTP response window
                print(f"Automated notification transmission failure: {str(e)}")

class DamageViewSet(viewsets.ModelViewSet):
    queryset = Damage.objects.all()
    serializer_class = DamageSerializer
    permission_classes = [permissions.IsAuthenticated]