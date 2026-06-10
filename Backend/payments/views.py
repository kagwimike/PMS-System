from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Invoice, Payment
from .serializers import InvoiceSerializer, PaymentSerializer

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
        if hasattr(user, 'role') and user.role == 'TENANT':
            return Invoice.objects.filter(lease__tenant=user)
        elif hasattr(user, 'is_staff') and user.is_staff:
            return Invoice.objects.all()
        
        # Fallback security filtering based on your user schema
        return Invoice.objects.filter(lease__tenant=user)

    @action(detail=True, methods=['post'], url_path='pay')
    def process_payment(self, request, pk=None):
        """
        💳 CHECKOUT EXECUTION GATEWAY
        Endpoint: POST /api/payments/invoices/<id>/pay/
        """
        invoice = self.get_object()
        user = request.user

        if invoice.status == 'PAID':
            return Response({'error': 'This invoice has already been fully cleared.'}, status=status.HTTP_400_BAD_REQUEST)

        amount_to_pay = request.data.get('amount', invoice.balance_due)
        payment_method = request.data.get('payment_method', 'MPESA')
        phone_number = request.data.get('phone_number') # Crucial if dispatching Safaricom STK Push

        # Ensure value is converted accurately
        try:
            amount_to_pay = float(amount_to_pay)
        except (ValueError, TypeError):
            return Response({'error': 'Invalid financial payment amount string.'}, status=status.HTTP_400_BAD_REQUEST)

        if amount_to_pay <= 0 or amount_to_pay > float(invoice.balance_due):
            return Response({'error': f'Amount must be between $0.01 and remaining balance: ${invoice.balance_due}'}, status=status.HTTP_400_BAD_REQUEST)

        # Generate mock transaction receipt reference layout for now
        import uuid
        mock_transaction_ref = f"REF-{uuid.uuid4().hex[:10].upper()}"

        # Setup draft payment record
        payment = Payment.objects.create(
            invoice=invoice,
            tenant=user,
            amount=amount_to_pay,
            payment_method=payment_method,
            transaction_reference=mock_transaction_ref,
            gateway_response={"status": "initiated", "phone_provided": phone_number},
            is_confirmed=True # Directly setting to true for now to confirm flow mechanics
        )

        return Response({
            'message': 'Payment transaction approved successfully.',
            'reference': payment.transaction_reference,
            'invoice_status': invoice.status,
            'balance_remaining': float(invoice.balance_due)
        }, status=status.HTTP_200_OK)


class PaymentViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Provides a read-only list view history tracking ledger for audits.
    """
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'role') and user.role == 'TENANT':
            return Payment.objects.filter(tenant=user)
        return Payment.objects.all()