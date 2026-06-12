import logging
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Invoice, Payment
from .serializers import InvoiceSerializer, PaymentSerializer
from .mpesa import initiate_stk_push # Imports the Safaricom connection engine

logger = logging.getLogger(__name__)

class InvoiceViewSet(viewsets.ModelViewSet):
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        🔒 ROLE ISOLATION: 
        Tenants only see invoices linked to their lease profile.
        Owners/Admins pull global records.
        """
        user = self.request.user
        role = getattr(user, 'role', '').upper() if hasattr(user, 'role') else ''
        is_staff = getattr(user, 'is_staff', False)

        if role == 'TENANT':
            # Returns unpaid invoices for the tenant (including the newly generated onboarding one)
            return Invoice.objects.filter(lease__tenant=user).exclude(status='PAID')
        elif role in ['OWNER', 'ADMIN'] or is_staff:
            return Invoice.objects.all()
        
        return Invoice.objects.filter(lease__tenant=user).exclude(status='PAID')

    @action(detail=True, methods=['post'], url_path='pay')
    def process_payment(self, request, pk=None):
        """
        💳 LIVE SAFARICOM STK PUSH GATEWAY
        Endpoint: POST /api/payments/invoices/<id>/pay/
        """
        invoice = self.get_object()
        user = request.user

        if invoice.status == 'PAID':
            return Response({'error': 'This invoice has already been fully cleared.'}, status=status.HTTP_400_BAD_REQUEST)

        amount_to_pay = request.data.get('amount', invoice.balance_due)
        phone_number = request.data.get('phone_number')

        # 1. Validate that an M-Pesa phone target exists
        if not phone_number:
            return Response({'error': 'Please provide a valid M-Pesa phone number for STK Push.'}, status=status.HTTP_400_BAD_REQUEST)

        # 2. Format check and float conversions
        try:
            amount_to_pay = float(amount_to_pay)
        except (ValueError, TypeError):
            return Response({'error': 'Invalid financial payment amount string.'}, status=status.HTTP_400_BAD_REQUEST)

        if amount_to_pay <= 0 or amount_to_pay > float(invoice.balance_due):
            return Response({'error': f'Amount must be between $0.01 and remaining balance: ${invoice.balance_due}'}, status=status.HTTP_400_BAD_REQUEST)

        # 🚀 3. Dispatch Live API handshake request straight to Safaricom Core
        logger.info(f"Initiating M-Pesa STK push for user {user.username} - Amount: {amount_to_pay}")
        mpesa_res = initiate_stk_push(phone_number, amount_to_pay, invoice.id)

        if mpesa_res.get("ResponseCode") == "0":
            merchant_request_id = mpesa_res.get("MerchantRequestID")
            
            Payment.objects.create(
                invoice=invoice,
                tenant=user,
                amount=amount_to_pay,
                payment_method='MPESA',
                transaction_reference=merchant_request_id,
                gateway_response=mpesa_res,
                is_confirmed=False
            )

            return Response({
                'message': 'STK Push initialized successfully! Please check your phone to enter your M-Pesa PIN.',
                'status': 'PENDING_PIN',
                'merchant_request_id': merchant_request_id
            }, status=status.HTTP_200_OK)
        else:
            logger.error(f"Safaricom STK initialization rejected: {mpesa_res}")
            return Response({
                'error': mpesa_res.get("CustomerMessage", "Safaricom gateway initialization failed.")
            }, status=status.HTTP_400_BAD_REQUEST)


class PaymentViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Provides a read-only list view history tracking ledger for audits.
    """
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        role = getattr(user, 'role', '').upper() if hasattr(user, 'role') else ''
        is_staff = getattr(user, 'is_staff', False)

        if role == 'TENANT':
            return Payment.objects.filter(tenant=user)
        elif role in ['OWNER', 'ADMIN'] or is_staff:
            return Payment.objects.all()
            
        return Payment.objects.filter(tenant=user)


# =====================================================================
# 🚨 PUBLIC WEBHOOK ASYNC CALLBACK RECEIVER
# =====================================================================
@api_view(['POST'])
@permission_classes([AllowAny])
def mpesa_callback(request):
    """
    Safaricom Webhook Receiver
    POST /api/payments/mpesa-callback/
    
    Handles secure background ledger reconciliation after users submit PIN entries.
    Auto-activates pending leases immediately upon verified transaction clearance.
    """
    callback_data = request.data.get("Body", {}).get("stkCallback", {})
    result_code = callback_data.get("ResultCode")
    merchant_request_id = callback_data.get("MerchantRequestID")

    logger.info(f"Incoming M-Pesa Hook - Request ID: {merchant_request_id} | Result Code: {result_code}")

    # ResultCode 0 means transaction processed completely and successfully!
    if result_code == 0:
        meta_items = callback_data.get("CallbackMetadata", {}).get("Item", [])
        
        receipt_number = None
        for item in meta_items:
            if item.get("Name") == "MpesaReceiptNumber":
                receipt_number = item.get("Value")
                break

        try:
            # 1. Fetch our pending record using the mapped reference
            payment = Payment.objects.get(transaction_reference=merchant_request_id)
            invoice = payment.invoice
            lease = invoice.lease  # 🔗 Follow the foreign key relationship back to the lease app

            # 2. Re-map verification values permanently
            payment.transaction_reference = receipt_number 
            payment.is_confirmed = True
            payment.gateway_response = callback_data
            payment.save() 
            
            # 3. Clear the invoice balance due
            invoice.balance_due = 0
            invoice.status = 'PAID'
            invoice.save()
            
            # 4. 🚀 THE AUTOMATION ENGINE LINK: Activate the Lease right now!
            if lease and lease.status == "PENDING":
                lease.status = "ACTIVE"
                # Executing .save() here runs Lease's internal logic, switching Unit to 'OCCUPIED'
                lease.save()
                logger.info(f"🎉 Lease #{lease.id} activated and Unit {lease.unit.unit_number} status set to OCCUPIED via M-Pesa tracking token: {receipt_number}")
            
            logger.info(f"🎉 Payment Verified: Invoice #{invoice.id} updated via receipt {receipt_number}")
            
        except Payment.DoesNotExist:
            logger.error(f"⚠️ Payment mismatch: Record for MerchantRequestID {merchant_request_id} not found.")
    else:
        # User explicitly cancelled, timeout occurred, or insufficient funds
        logger.warning(f"❌ M-Pesa payload flagged unsuccessful transaction or cancellation. Code: {result_code}")
        try:
            payment = Payment.objects.get(transaction_reference=merchant_request_id)
            payment.gateway_response = callback_data
            payment.save()
        except Payment.DoesNotExist:
            pass

    return Response({"ResultCode": 0, "ResultDesc": "Callback processed safely by PMS Engine"}, status=status.HTTP_200_OK)