from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from django.core.mail import send_mail
from maintenance.models import MaintenanceRequest, Vendor  

from .notifications import send_tenant_email, send_tenant_sms

# =========================================================================
# 🛠️ 1. MAINTENANCE REQUEST SIGNAL (Pre-Save for Vendor State Comparison)
# =========================================================================
@receiver(pre_save, sender=MaintenanceRequest)
def notify_vendor_on_assignment(sender, instance, **kwargs):
    """
    Compares database state to intercept exactly when an owner updates 
    or assigns a vendor profile to an active maintenance ticket.
    """
    # If the instance is new, it doesn't have an old state to check against
    if not instance.pk:
        return

    try:
        # Pull the record straight from the DB before changes are saved
        old_instance = MaintenanceRequest.objects.get(pk=instance.pk)
    except MaintenanceRequest.DoesNotExist:
        return

    # Check if a vendor was just newly linked or swapped out
    if instance.assigned_vendor and (old_instance.assigned_vendor != instance.assigned_vendor):
        vendor = instance.assigned_vendor
        
        print(f"\n📢 [DISPATCH SIGNAL] Triggered! Sending work docket to vendor: {vendor.email}")
        
        subject = f"🚨 New Maintenance Dispatch: {instance.title} (Priority: {instance.priority})"
        message_body = (
            f"Hello {vendor.name},\n\n"
            f"You have been dispatched to handle a new maintenance service request.\n\n"
            f"🔧 Job Details:\n"
            f"-------------\n"
            f"Task Title: {instance.title}\n"
            f"Description: {instance.description}\n"
            f"Urgency Level: {instance.priority}\n\n"
            f"📍 Location Assignment:\n"
            f"---------------------\n"
            f"Property: {instance.property.name}\n"
            f"Unit Number: {instance.unit.unit_number}\n\n"
            f"Please log into your portal panel to provide status updates and field notes upon inspection/completion.\n\n"
            f"Regards,\n"
            f"Property Management Automation System"
        )

        try:
            send_mail(
                subject=subject,
                message=message_body,
                from_email='noreply@yourpmsapp.com',
                recipient_list=[vendor.email],
                fail_silently=False,
            )
            print(f"✅ Email dispatch packet transmitted successfully to {vendor.email}")
        except Exception as e:
            print(f"❌ Failed to transmit email payload to vendor {vendor.email}: {str(e)}")


# =========================================================================
# 📋 2. LEASE AGREEMENT LIFECYCLE SIGNAL (Post-Save for Global Changes)
# =========================================================================
@receiver(post_save, sender='leases.Lease')
def dispatch_lease_lifecycle_notifications(sender, instance, created, **kwargs):
    """
    Automatic listener that triggers notifications upon Lease assignment or termination.
    """
    print(f"\n📋 [LEASE SIGNAL] Detected! Lease ID: {instance.id}, Status: {instance.status}, Created: {created}")
    
    tenant = instance.tenant
    if not tenant:
        print("!!! SIGNAL EXIT !!! No tenant attached to this lease record.")
        return

    tenant_email = tenant.email
    tenant_phone = getattr(tenant, 'phone_number', None)
    
    unit_number = instance.unit.unit_number if instance.unit else "N/A"
    property_name = instance.unit.property.name if (instance.unit and instance.unit.property) else "Cisco Apartments"

    # CASE 2.1: NEW LEASE ASSIGNED
    if created:
        print(f"-> Processing Case 1: Broadcasting to new tenant: {tenant_email}")
        subject = f"Your Lease Agreement: Unit {unit_number} at {property_name}"
        message = (
            f"Hello {tenant.first_name or 'Tenant'},\n\n"
            f"An active lease profile has been established for you at {property_name}.\n\n"
            f"🔹 Unit: {unit_number}\n"
            f"🔹 Start Date: {instance.start_date}\n"
            f"🔹 Rent Obligation: ${float(instance.rent_amount):.2f} / month\n\n"
            f"You can now access your individual tenant portal dashboard to monitor records."
        )
        
        send_tenant_email(subject, message, tenant_email)
        if tenant_phone:
            sms_msg = f"Hi {tenant.first_name or 'Tenant'}, you have been assigned to Unit {unit_number} at {property_name}. Check your email for full lease details!"
            send_tenant_sms(sms_msg, tenant_phone)

    # CASE 2.2: EXISTING LEASE TERMINATED
    elif instance.status == "TERMINATED":
        print(f"-> Processing Case 2: Broadcasting termination warning to tenant: {tenant_email}")
        subject = f"Lease Termination Update - Unit {unit_number}"
        message = (
            f"Hello {tenant.first_name or 'Tenant'},\n\n"
            f"This is an official update confirming that your lease agreement for Unit {unit_number} "
            f"at {property_name} has been processed as TERMINATED.\n\n"
            f"If you have questions regarding move-out parameters or final statements, please contact management."
        )
        
        send_tenant_email(subject, message, tenant_email)
        if tenant_phone:
            sms_msg = f"Notice: Your lease status for Unit {unit_number} at {property_name} has been updated to TERMINATED."
            send_tenant_sms(sms_msg, tenant_phone)