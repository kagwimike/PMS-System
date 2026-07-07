from rest_framework import serializers
from .models import Invoice, Payment

class OwnerInvoiceSerializer(serializers.ModelSerializer):
    # Traverses the foreign keys: Invoice -> Lease -> Tenant (User)
    tenant_name = serializers.CharField(source='lease.tenant.username', read_only=True)
    # Traverses: Invoice -> Lease -> Property
    property_title = serializers.CharField(source='lease.property.title', read_only=True) 
    invoice_type_display = serializers.CharField(source='get_invoice_type_display', read_only=True)
    balance_due = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = Invoice
        fields = [
            'id', 
            'invoice_type', 
            'invoice_type_display', 
            'amount', 
            'amount_paid', 
            'balance_due', 
            'status', 
            'due_date', 
            'tenant_name', 
            'property_title'
        ]


class PaymentHistorySerializer(serializers.ModelSerializer):
    invoice_id = serializers.IntegerField(source='invoice.id', read_only=True)
    invoice_type = serializers.CharField(source='invoice.get_invoice_type_display', read_only=True)
    tenant_username = serializers.CharField(source='tenant.username', read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id', 
            'invoice_id', 
            'invoice_type', 
            'tenant_username', 
            'amount', 
            'payment_method', 
            'transaction_reference', 
            'is_confirmed', 
            'paid_at'
        ]