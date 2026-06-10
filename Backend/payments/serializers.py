from rest_framework import serializers
from .models import Invoice, Payment

class PaymentSerializer(serializers.ModelSerializer):
    tenant_email = serializers.ReadOnlyField(source='tenant.email')

    class Meta:
        model = Payment
        fields = [
            'id', 'invoice', 'tenant', 'tenant_email', 'amount', 
            'payment_method', 'transaction_reference', 'is_confirmed', 'paid_at'
        ]
        read_only_fields = ['id', 'tenant', 'is_confirmed', 'paid_at']


class InvoiceSerializer(serializers.ModelSerializer):
    payments = PaymentSerializer(many=True, read_only=True)
    balance_due = serializers.ReadOnlyField()
    property_name = serializers.ReadOnlyField(source='lease.unit.property.name')
    unit_number = serializers.ReadOnlyField(source='lease.unit.unit_number')
    tenant_email = serializers.ReadOnlyField(source='lease.tenant.email')

    class Meta:
        model = Invoice
        fields = [
            'id', 'lease', 'property_name', 'unit_number', 'tenant_email',
            'invoice_type', 'amount', 'amount_paid', 'balance_due', 
            'status', 'due_date', 'created_at', 'updated_at', 'payments'
        ]
        read_only_fields = ['id', 'amount_paid', 'balance_due', 'status', 'created_at', 'updated_at']