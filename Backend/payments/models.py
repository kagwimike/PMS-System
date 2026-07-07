from django.db import models
from django.conf import settings
from django.utils import timezone

INVOICE_TYPE_CHOICES = [
    ('RENT', 'Monthly Rent'),
    ('UTILITY', 'Water/Electricity/Amenities'),
    ('DEPOSIT', 'Security Deposit'),
    ('LATE_FEE', 'Late Payment Penalty'),
    ('MAINTENANCE', 'Damage/Repair Charge'),
]

STATUS_CHOICES = [
    ('PENDING', 'Unpaid / Pending'),
    ('PARTIAL', 'Partially Paid'),
    ('PAID', 'Fully Paid'),
    ('OVERDUE', 'Overdue'),
    ('CANCELLED', 'Cancelled / Void'),
]

PAYMENT_METHOD_CHOICES = [
    ('MPESA', 'M-Pesa Mobile Money'),
    ('CARD', 'Credit/Debit Card'),
    ('BANK_TRANSFER', 'Direct Bank Deposit'),
    ('CASH', 'Physical Cash Receipt'),
]


class Invoice(models.Model):
    """
    Tracks bills generated for a tenant's lease obligation.
    """
    lease = models.ForeignKey(
        'leases.Lease', 
        on_delete=models.PROTECT, 
        related_name='invoices'
    )
    invoice_type = models.CharField(max_length=20, choices=INVOICE_TYPE_CHOICES, default='RENT')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    # Billing Timeline
    due_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-due_date']

    @property
    def balance_due(self):
        """Dynamically computes the remaining outstanding liability wallet matrix"""
        return self.amount - self.amount_paid

    def update_status(self):
        """Automatically updates lifecycle flags based on payment margins"""
        if self.amount_paid >= self.amount:
            self.status = 'PAID'
        elif self.amount_paid > 0:
            self.status = 'PARTIAL'
        self.save()

    def __str__(self):
        return f"Invoice #{self.id} - {self.get_invoice_type_display()} (KES {self.amount}) - {self.status}"


class Payment(models.Model):
    """
    Tracks transaction settlement allocations mapping directly back to an invoice.
    """
    invoice = models.ForeignKey(
        Invoice, 
        on_delete=models.CASCADE, 
        related_name='payments'
    )
    tenant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='tenant_payments'
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default='MPESA')
    transaction_reference = models.CharField(max_length=100, unique=True, blank=True, null=True)
    gateway_response = models.JSONField(blank=True, null=True)
    is_confirmed = models.BooleanField(default=False)
    paid_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-paid_at']

    def save(self, *args, **kwargs):
        """
        When a payment is successfully confirmed, it auto-increments 
        the associated Invoice paid margins.
        """
        super().save(*args, **kwargs)
        
        if self.is_confirmed and self.invoice:
            total_paid = sum(p.amount for p in self.invoice.payments.filter(is_confirmed=True))
            self.invoice.amount_paid = total_paid
            self.invoice.update_status()

    def __str__(self):
        ref = self.transaction_reference or f"Draft-{self.id}"
        return f"Payment {ref} (KES {self.amount}) for Invoice #{self.invoice.id}"


class DepositRefund(models.Model):
    """
    Tracks safety margins and outward financial payloads for escrow deposit paybacks.
    Calculates moving balances and checks against outstanding tenant damages.
    """
    lease = models.ForeignKey(
        'leases.Lease',
        on_delete=models.PROTECT,
        related_name='deposit_refunds'
    )
    amount_refunded = models.DecimalField(max_digits=12, decimal_places=2)
    deductions_retained = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        default=0.00,
        help_text="Amount withheld to settle damage invoices or unpaid utility/rent balances."
    )
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default='BANK_TRANSFER')
    transaction_reference = models.CharField(max_length=100, unique=True, blank=True, null=True)
    notes = models.TextField(blank=True, null=True, help_text="Reasoning for partial deductions or refund metadata.")
    
    processed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='processed_refunds'
    )
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Refund #{self.id} for Lease #{self.lease.id} - Net: KES {self.amount_refunded}"