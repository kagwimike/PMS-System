import requests
from requests.auth import HTTPBasicAuth
from django.conf import settings
from datetime import datetime
import base64
import logging

logger = logging.getLogger(__name__)

def generate_mpesa_token():
    """Generates an OAuth access token from Safaricom Daraja"""
    # Dynamically toggles between Sandbox and Production gateway links based on your settings
    base_url = "https://api.safaricom.co.ke" if getattr(settings, 'MPESA_ENVIRONMENT', 'sandbox') == 'production' else "https://sandbox.safaricom.co.ke"
    api_url = f"{base_url}/oauth/v1/generate?grant_type=client_credentials"
    
    try:
        res = requests.get(
            api_url, 
            auth=HTTPBasicAuth(settings.MPESA_CONSUMER_KEY, settings.MPESA_CONSUMER_SECRET),
            timeout=10
        )
        res.raise_for_status()
        return res.json().get("access_token")
    except Exception as e:
        logger.error(f"Failed to generate M-Pesa access token: {str(e)}")
        return None

def initiate_stk_push(phone, amount, invoice_id):
    """Triggers an STK Push prompt to the tenant's phone"""
    access_token = generate_mpesa_token()
    if not access_token:
        return {"ResponseCode": "1", "CustomerMessage": "Could not authenticate with Safaricom."}

    base_url = "https://api.safaricom.co.ke" if getattr(settings, 'MPESA_ENVIRONMENT', 'sandbox') == 'production' else "https://sandbox.safaricom.co.ke"
    api_url = f"{base_url}/mpesa/stkpush/v1/processrequest"
    
    headers = {"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"}
    
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    password_str = f"{settings.MPESA_SHORTCODE}{settings.MPESA_PASSKEY}{timestamp}"
    password = base64.b64encode(password_str.encode()).decode('utf-8')

    # Format phone number to 2547XXXXXXXX or 2541XXXXXXXX layout standard safely
    phone = str(phone).strip().replace(" ", "")
    if phone.startswith("0"):
        phone = "254" + phone[1:]
    elif phone.startswith("+"):
        phone = phone.replace("+", "")
    elif phone.startswith("7") or phone.startswith("1"):
        phone = "254" + phone

    payload = {
        "BusinessShortCode": settings.MPESA_SHORTCODE,
        "Password": password,
        "Timestamp": timestamp,
        "TransactionType": "CustomerPayBillOnline",
        "Amount": int(float(amount)),  # M-Pesa API expects an integer value for whole currencies
        "PartyA": phone,
        "PartyB": settings.MPESA_SHORTCODE,
        "PhoneNumber": phone,
        # ✅ Read dynamically from settings instead of hardcoding a transient URL string
        "CallBackURL": settings.MPESA_CALLBACK_URL,
        "AccountReference": f"INV-{invoice_id}",
        "TransactionDesc": f"Rent Payment Invoice #{invoice_id}"
    }

    try:
        res = requests.post(api_url, json=payload, headers=headers, timeout=15)
        return res.json()
    except Exception as e:
        logger.error(f"STK Push network request failed: {str(e)}")
        return {"ResponseCode": "1", "CustomerMessage": "Safaricom gateway timed out."}