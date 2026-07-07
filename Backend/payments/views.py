import logging
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Sum
from django.db import transaction
from .models import Invoice, Payment, DepositRefund
from .serializers import OwnerInvoiceSerializer, PaymentHistorySerializer
from .mpesa import initiate_stk_push  # Safaricom integration layer

logger = logging.getLogger(__name__)

class InvoiceViewSet(viewsets.ModelViewSet):
    serializer_class = OwnerInvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        🔒 ROLE ISOLATION: 
        Tenants only see unpaid or partial invoices linked to their lease profile.
        Owners/Admins pull global records matching their managed portfolio.
        """
        user = self.request.user
        role = getattr(user, 'role', '').upper() if hasattr(user, 'role') else ''
        is_staff = getattr(user, 'is_staff', False)

        if role == 'TENANT':
            return Invoice.objects.filter(lease__tenant=user).exclude(status='PAID')
        elif role in ['OWNER', 'ADMIN'] or is_staff:
            return Invoice.objects.filter(lease__property__owner=user) if role == 'OWNER' else Invoice.objects.all()
        
        return Invoice.objects.filter(lease__tenant=user).exclude(status='PAID')

    @action(detail=False, methods=['get'], url_path='owner_global')
    def owner_global(self):
        """
        📊 OWNER DASHBOARD AGGREGATIONS
        Endpoint: GET /api/invoices/owner_global/
        """
        user = self.request.user
        role = getattr(user, 'role', '').upper() if hasattr(user, 'role') else ''
        is_staff = getattr(user, 'is_staff', False)
        
        if role not in ['OWNER', 'ADMIN'] and not is_staff:
            return Response({"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

        if role == 'OWNER':
            base_queryset = Invoice.objects.filter(lease__property__owner=user)
        else:
            base_queryset = Invoice.objects.all()
        
        total_collected = base_queryset.filter(status='PAID').aggregate(Sum('amount_paid'))['amount_paid__sum'] or 0.00
        total_amount = base_queryset.exclude(status='CANCELLED').aggregate(Sum('amount'))['amount__sum'] or 0.00
        actual_paid = base_queryset.exclude(status='CANCELLED').aggregate(Sum('amount_paid'))['amount_paid__sum'] or 0.00
        pending_amount = max(0.00, float(total_amount) - float(actual_paid))

        serializer = self.get_serializer(self.get_queryset(), many=True)
        return Response({
            "invoices": serializer.data,
            "total_collected": float(total_collected),
            "pending_amount": float(pending_amount)
        })

    @action(detail=True, methods=['post'], url_path='pay')
    def process_payment(self, request, pk=None):
        """
        💳 LIVE SAFARICOM STK PUSH GATEWAY INITIATOR
        """
        invoice = self.get_object()
        user = request.user

        if invoice.status == 'PAID':
            return Response({'error': 'This invoice has already been fully cleared.'}, status=status.HTTP_400_BAD_REQUEST)

        amount_to_pay = request.data.get('amount', invoice.balance_due)
        phone_number = request.data.get('phone_number')

        if not phone_number:
            return Response({'error': 'Please provide a valid M-Pesa phone number for STK Push.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            amount_to_pay = float(amount_to_pay)
        except (ValueError, TypeError):
            return Response({'error': 'Invalid financial payment amount string.'}, status=status.HTTP_400_BAD_REQUEST)

        if amount_to_pay <= 0 or amount_to_pay > float(invoice.balance_due):
            return Response({'error': f'Amount must be between 0.01 and remaining balance: {invoice.balance_due}'}, status=status.HTTP_400_BAD_REQUEST)

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
    serializer_class = PaymentHistorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        role = getattr(user, 'role', '').upper() if hasattr(user, 'role') else ''
        is_staff = getattr(user, 'is_staff', False)
        
        base_query = Payment.objects.filter(is_confirmed=True).order_by('-paid_at')

        if role == 'TENANT':
            return base_query.filter(tenant=user)
        elif role in ['OWNER', 'ADMIN'] or is_staff:
            return base_query.filter(invoice__lease__property__owner=user) if role == 'OWNER' else base_query
            
        return base_query.filter(tenant=user)


class DepositRefundViewSet(viewsets.ModelViewSet):
    """
    🔐 ESCROW ENGINE VIEWS
    Handles calculating available deposit balances and executing secure cash-back refunds.
    """
    queryset = DepositRefund.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        role = getattr(user, 'role', '').upper() if hasattr(user, 'role') else ''
        if role == 'TENANT':
            return DepositRefund.objects.filter(lease__tenant=user)
        return DepositRefund.objects.filter(lease__property__owner=user) if role == 'OWNER' else DepositRefund.objects.all()

    # 🚨 FIX APPLIED: Changed to detail=True to map cleanly to detail endpoints (/api/deposit_refunds/<lease_id>/calculate_balance/)
    @action(detail=True, methods=['get'], url_path='calculate_balance')
    def calculate_balance(self, request, pk=None):
        """
        💸 Computes current escrow ledger profile status for a lease.
        Calculates: Total Paid Deposits minus Past Issued Refunds.
        """
        lease_id = pk

        total_deposited = Payment.objects.filter(
            invoice__lease_id=lease_id,
            invoice__invoice_type='DEPOSIT',
            is_confirmed=True
        ).aggregate(Sum('amount'))['amount__sum'] or 0.00

        total_refunded = DepositRefund.objects.filter(lease_id=lease_id).aggregate(
            Sum('amount_refunded')
        )['amount_refunded__sum'] or 0.00

        total_deductions = DepositRefund.objects.filter(lease_id=lease_id).aggregate(
            Sum('deductions_retained')
        )['deductions_retained__sum'] or 0.00

        available_escrow = float(total_deposited) - (float(total_refunded) + float(total_deductions))

        return Response({
            "lease_id": lease_id,
            "total_deposited": float(total_deposited),
            "total_refunded": float(total_refunded),
            "total_deductions": float(total_deductions),
            "available_escrow": float(available_escrow)
        }, status=status.HTTP_200_OK)

    def create(self, request, *args, **kwargs):
        """
        💳 EXECUTES SECURE ESCROW DISBURSEMENT REFUND
        """
        user = request.user
        role = getattr(user, 'role', '').upper() if hasattr(user, 'role') else ''
        
        if role == 'TENANT':
            return Response({"error": "Tenants are authorized to request, not execute disbursements."}, status=status.HTTP_403_FORBIDDEN)

        lease_id = request.data.get('lease')
        amount_refunded = float(request.data.get('amount_refunded', 0))
        deductions_retained = float(request.data.get('deductions_retained', 0))
        
        if amount_refunded <= 0:
            return Response({"error": "Refund amount must be greater than 0."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            total_deposited = Payment.objects.filter(
                invoice__lease_id=lease_id, invoice__invoice_type='DEPOSIT', is_confirmed=True
            ).select_for_update().aggregate(Sum('amount'))['amount__sum'] or 0.00

            historical_payouts = DepositRefund.objects.filter(lease_id=lease_id).select_for_update().aggregate(
                total_ref=Sum('amount_refunded'), total_ded=Sum('deductions_retained')
            )
            total_refunded = (historical_payouts['total_ref'] or 0.00) + (historical_payouts['total_ded'] or 0.00)
            
            available_escrow = float(total_deposited) - float(total_refunded)

            if (amount_refunded + deductions_retained) > available_escrow:
                return Response({
                    "error": f"Insufficient escrow. Max available limit is KES {available_escrow:.2f}"
                }, status=status.HTTP_400_BAD_REQUEST)

            refund = DepositRefund.objects.create(
                lease_id=lease_id,
                amount_refunded=amount_refunded,
                deductions_retained=deductions_retained,
                payment_method=request.data.get('payment_method', 'BANK_TRANSFER'),
                transaction_reference=request.data.get('transaction_reference'),
                notes=request.data.get('notes'),
                processed_by=user
            )

        return Response({"message": "Refund processed successfully!", "id": refund.id}, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def mpesa_callback(request):
    """
    Safaricom Webhook Receiver
    """
    callback_data = request.data.get("Body", {}).get("stkCallback", {})
    result_code = callback_data.get("ResultCode")
    merchant_request_id = callback_data.get("MerchantRequestID")

    logger.info(f"Incoming M-Pesa Hook - Request ID: {merchant_request_id} | Result Code: {result_code}")

    if result_code == 0:
        meta_items = callback_data.get("CallbackMetadata", {}).get("Item", [])
        
        receipt_number = None
        for item in meta_items:
            if item.get("Name") == "MpesaReceiptNumber":
                receipt_number = item.get("Value")
                break

        try:
            with transaction.atomic():
                payment = Payment.objects.select_for_update().get(transaction_reference=merchant_request_id)
                invoice = Invoice.objects.select_for_update().get(id=payment.invoice_id)
                lease = invoice.lease

                payment.transaction_reference = receipt_number or merchant_request_id
                payment.is_confirmed = True
                payment.gateway_response = callback_data
                payment.save() 
                
                confirmed_payments_sum = Payment.objects.filter(
                    invoice=invoice, is_confirmed=True
                ).aggregate(Sum('amount'))['amount__sum'] or 0.00
                
                invoice.amount_paid = confirmed_payments_sum
                
                if float(invoice.amount_paid) >= float(invoice.amount):
                    invoice.status = 'PAID'
                elif float(invoice.amount_paid) > 0:
                    invoice.status = 'PARTIALLY_PAID'
                invoice.save()

                if lease and lease.status == "PENDING":
                    lease.status = "ACTIVE"
                    lease.save()
                    logger.info(f"🎉 Lease #{lease.id} activated cleanly via receipt token: {receipt_number}")
                
                logger.info(f"🎉 Payment verified and matched: Invoice #{invoice.id}")
                
        except Payment.DoesNotExist:
            logger.error(f"⚠️ Payment mismatch: Record for MerchantRequestID {merchant_request_id} not found.")
        except Invoice.DoesNotExist:
            logger.error(f"⚠️ Invoice mismatch: Associated invoice record not found.")
    else:
        logger.warning(f"❌ M-Pesa payload flagged cancelled or failed transaction. Code: {result_code}")
        try:
            payment = Payment.objects.get(transaction_reference=merchant_request_id)
            payment.gateway_response = callback_data
            payment.save()
        except Payment.DoesNotExist:
            pass

    return Response({"ResultCode": 0, "ResultDesc": "Callback processed safely by PMS Engine"}, status=status.HTTP_200_OK)