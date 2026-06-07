from django.core.management.base import BaseCommand
from django.apps import apps
from notifications.notifications import send_tenant_email, send_tenant_sms

class Command(BaseCommand):
    help = 'Dispatches automated invoice due notices and SMS text alerts to active tenants across all properties'

    def handle(self, *args, **options):
        self.stdout.write("Initializing automated rent notification cycle...")
        
        try:
            # Dynamically resolve the Lease model to avoid circular import patterns
            Lease = apps.get_model('leases', 'Lease')
        except LookupError:
            self.stdout.write(self.style.ERROR("System Failure: Could not resolve 'leases.Lease' model component."))
            return

        # Gather active leases across the system
        active_leases = Lease.objects.filter(status="ACTIVE")
        
        if not active_leases.exists():
            self.stdout.write(self.style.WARNING("Cycle completed: Zero active tenant lease profiles found in database."))
            return

        success_count = 0
        
        for lease in active_leases:
            tenant = lease.tenant
            if not tenant or not tenant.email:
                continue
                
            unit_number = lease.unit.unit_number if lease.unit else "N/A"
            property_name = lease.unit.property.name if (lease.unit and lease.unit.property) else "your residential unit"
            rent_amount = float(lease.rent_amount or lease.unit.rent_price or 0)
            
            # --- EMAIL PAYLOAD CONSTRUCTION ---
            subject = f"Rent Due Reminder: Unit {unit_number} at {property_name}"
            email_message = (
                f"Dear {tenant.first_name or 'Tenant'},\n\n"
                f"This is a friendly automated reminder from your property management portal that your monthly "
                f"rent obligation of ${rent_amount:.2f} for Unit {unit_number} is due.\n\n"
                f"Please log into your dashboard portal to review outstanding balances and complete your payment transaction layout smoothly.\n\n"
                f"Thank you,\n"
                f"Management Office"
            )
            
            # --- SMS PAYLOAD CONSTRUCTION ---
            sms_message = (
                f"Hi {tenant.first_name or 'Tenant'}, friendly reminder that monthly rent (${rent_amount:.2f}) "
                f"is due for Unit {unit_number} at {property_name}. Please check your online portal dashboard to process payment."
            )
            
            # Dispatch messages using your core notifications helper engine
            email_sent = send_tenant_email(subject, email_message, tenant.email)
            
            tenant_phone = getattr(tenant, 'phone_number', None)
            if tenant_phone:
                send_tenant_sms(sms_message, tenant_phone)
                
            if email_sent:
                success_count += 1

        self.stdout.write(self.style.SUCCESS(f"Successfully processed and dispatched reminders to {success_count} tenants."))