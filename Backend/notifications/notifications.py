import logging
from django.core.mail import send_mail
from django.conf import settings
from twilio.rest import Client

logger = logging.getLogger(__name__)

def send_tenant_email(subject, message, recipient_email):
    """
    Sends an email notification to the tenant using system settings SMTP configuration.
    """
    try:
        if not recipient_email:
            logger.warning("Notification blocked: Recipient email is missing.")
            return False
            
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient_email],
            fail_silently=False,
        )
        logger.info(f"Notification Email successfully sent to {recipient_email}")
        return True
    except Exception as e:
        logger.error(f"Email delivery engine failed: {str(e)}")
        return False

def send_tenant_sms(message, recipient_phone):
    """
    Sends a cellular text notification via the Twilio API network gateway.
    """
    try:
        if not recipient_phone:
            logger.warning("Notification blocked: Recipient phone number is missing.")
            return False
            
        # Initializes the Twilio client using values set in settings.py
        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        
        client.messages.create(
            body=message,
            from_=settings.TWILIO_PHONE_NUMBER,
            to=recipient_phone
        )
        logger.info(f"SMS cellular alert successfully sent to {recipient_phone}")
        return True
    except Exception as e:
        logger.error(f"Twilio cellular gateway failure: {str(e)}")
        return False