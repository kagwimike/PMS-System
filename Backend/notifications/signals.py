from django.db.models.signals import post_save
from django.dispatch import receiver
from django.apps import apps
from .notifications import send_tenant_email, send_tenant_sms

@receiver(post_save, sender='leases.Lease')
def dispatch_lease_lifecycle_notifications(sender, instance, created, **kwargs):
    """
    Automatic listener that triggers notifications upon Lease assignment or termination.
    """
    tenant = instance.tenant
    if not tenant:
        return

    tenant_email = tenant.email
    # Safely look for a phone_number field on your custom User/Tenant model
    tenant_phone = getattr(tenant, 'phone_number', None)
    
    unit_number = instance.unit.unit_number if instance.unit else "N/A"
    property_name = instance.unit.property.name if (instance.unit and instance.unit.property) else "Cisco Apartments"

    # CASE 1: NEW LEASE ASSIGNED (Created flag is True)
    if created:
        subject = f"Your Lease Agreement: Unit {unit_number} at {property_name}"
        message = (
            f"Hello {tenant.first_name or 'Tenant'},\n\n"
            f"An active lease profile has been established for you at {property_name}.\n\n"
            f"🔹 Unit: {unit_number}\n"
            f"🔹 Start Date: {instance.start_date}\n"
            f"🔹 Rent Obligation: ${float(instance.rent_amount):.2f} / month\n\n"
            f"You can now access your individual tenant portal dashboard to monitor records."
        )
        
        # Dispatch notifications
        send_tenant_email(subject, message, tenant_email)
        if tenant_phone:
            sms_msg = f"Hi {tenant.first_name or 'Tenant'}, you have been assigned to Unit {unit_number} at {property_name}. Check your email for full lease details!"
            send_tenant_sms(sms_msg, tenant_phone)

    # CASE 2: EXISTING LEASE TERMINATED
    elif instance.status == "TERMINATED":
        subject = f"Lease Termination Update - Unit {unit_number}"
        message = (
            f"Hello {tenant.first_name or 'Tenant'},\n\n"
            f"This is an official update confirming that your lease agreement for Unit {unit_number} "
            f"at {property_name} has been processed as TERMINATED.\n\n"
            f"If you have questions regarding move-out parameters or final statements, please contact management."
        )
        
        # Dispatch notifications
        send_tenant_email(subject, message, tenant_email)
        if tenant_phone:
            sms_msg = f"Notice: Your lease status for Unit {unit_number} at {property_name} has been updated to TERMINATED."
            send_tenant_sms(sms_msg, tenant_phone)