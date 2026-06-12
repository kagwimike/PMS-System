# # payments/signals.py (or leases/signals.py)
# import logging
# from django.db.models.signals import post_save
# from django.dispatch import receiver
# from django.utils import timezone
# from leases.models import Lease
# from .models import Invoice, Payment
# from .mpesa import initiate_stk_push

# logger = logging.getLogger(__name__)

# @receiver(post_save, sender=Lease)
# def trigger_onboarding_payment(sender, instance, created, **kwargs):
#     """
#     ⚡ EVENT TRIGGER: Executes immediately after a Landlord saves a new Lease.
#     Automatically generates the first invoice and dispatches a live M-Pesa STK Push.
#     """
#     print("\n--- 🔍 [BACKEND SIGNAL TRACE START] ---")
#     print(f"📋 [LEASE SIGNAL] Detected! Lease ID: {instance.id}, Status: {instance.status}, Created: {created}")

#     if created and instance.status == 'PENDING':
#         tenant = instance.tenant
#         print(f"👤 Linked Tenant Account Object: {tenant}")
        
#         # 1. Fetch phone target from user profile mapping
#         # Trying common model field name permutations ('phone' vs 'phone_number')
#         raw_phone = getattr(tenant, 'phone', None) or getattr(tenant, 'phone_number', None)
#         print(f"📱 Extracted Database Phone String token: '{raw_phone}'")
        
#         if not raw_phone:
#             print(f"❌ [AUTOMATION ABORTED]: Tenant profile has no phone attribute recorded.")
#             print("--- 🔍 [BACKEND SIGNAL TRACE END] ---\n")
#             return

#         # 🔄 AUTOMATED NORMALIZATION FOR SAFARICOM DARAJA RULES
#         cleaned_phone = str(raw_phone).strip().replace("+", "")
#         if cleaned_phone.startswith("0"):
#             cleaned_phone = "254" + cleaned_phone[1:]
#         elif cleaned_phone.startswith("7") or cleaned_phone.startswith("1"):
#             cleaned_phone = "254" + cleaned_phone
            
#         print(f"⚙️ Formatted Phone targeting Safaricom rules: '{cleaned_phone}'")

#         # 2. Automatically generate the first billing invoice record
#         invoice = Invoice.objects.create(
#             lease=instance,
#             amount=instance.rent_amount, 
#             balance_due=instance.rent_amount,
#             status='UNPAID',
#             due_date=timezone.now().date(),
#             description=f"Initial Rent Settlement for Lease #{instance.id}"
#         )
        
#         print(f"⚡ Automated Invoice #{invoice.id} built for Lease #{instance.id}")
        
#         # Cast rent amount safely to a strict rounded Integer for STK compatibility
#         stk_amount = int(float(invoice.balance_due))
#         print(f"💰 Rent Amount target integer formatting check: {stk_amount}")

#         # 3. Fire the Live API handshake to Safaricom Daraja core
#         try:
#             print(f"📡 Dispatching network session payload thread directly to Safaricom Daraja Gateway...")
#             mpesa_res = initiate_stk_push(cleaned_phone, stk_amount, invoice.id)
            
#             print(f"🛰️ [DARAJA GATEWAY RESPONSE OBJECT]: {mpesa_res}")
            
#             if mpesa_res and mpesa_res.get("ResponseCode") == "0":
#                 merchant_request_id = mpesa_res.get("MerchantRequestID")
                
#                 # 4. Generate the pending transaction tracking log entry
#                 payment = Payment.objects.create(
#                     invoice=invoice,
#                     tenant=tenant,
#                     amount=invoice.balance_due,
#                     payment_method='MPESA',
#                     transaction_reference=merchant_request_id,
#                     gateway_response=mpesa_res,
#                     is_confirmed=False
#                 )
#                 print(f"🚀 [SUCCESS] Automated STK Push popup fired safely to device handset. Payment Tracking ID: #{payment.id}")
#             else:
#                 print(f"❌ [GATEWAY REFUSAL] Safaricom rejected request parameters: {mpesa_res.get('CustomerMessage', 'No message provided')}")
                
#         except Exception as e:
#             print(f"💥 [CRITICAL EXCEPTION] Handshake with Safaricom failed heavily!")
#             print(f"📝 Exception Details Trace: {str(e)}")
            
#     else:
#         print("⏭️ Signal passed: Condition skipped because lease is not new or status is not 'PENDING'.")
        
#     print("--- 🔍 [BACKEND SIGNAL TRACE END] ---\n")