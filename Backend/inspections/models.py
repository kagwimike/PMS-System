from django.db import models
from django.conf import settings
from django.utils import timezone
from properties.models import Property
from units.models import Unit
from leases.models import Lease

class Inspection(models.Model):
    CHECKIN = 'CHECKIN'
    CHECKOUT = 'CHECKOUT'
    ROUTINE = 'ROUTINE'
    
    INSPECTION_TYPE_CHOICES = [
        (CHECKIN, 'Check-in Baseline'),
        (CHECKOUT, 'Check-out Assessment'),
        (ROUTINE, 'Routine Maintenance Check')
    ]

    STATUS_CHOICES = [
        ('PASSED', 'Passed Cleanly'),
        ('ISSUES_FOUND', 'Actionable Issues Found'),
        ('RECONCILED', 'Financials Settled / Closed')
    ]

    lease = models.ForeignKey(Lease, on_delete=models.CASCADE, related_name='inspections')
    inspection_type = models.CharField(max_length=15, choices=INSPECTION_TYPE_CHOICES, default=ROUTINE)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='PASSED')
    
    # Billing Timeline Logs
    date = models.DateField(auto_now_add=True)
    notes = models.TextField(blank=True, null=True)
    
    # Track the active user performing the operational audit
    inspector = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='conducted_inspections'
    )
    
    condition_score = models.IntegerField(default=100)  # 0-100 scale layout (100 = Brand New Condition)

    class Meta:
        ordering = ['-date']

    def update_condition_status(self):
        """Automatically flips status structures if score dropping indicates structural issues"""
        if self.condition_score < 90 or self.damages.filter(resolved=False).exists():
            self.status = 'ISSUES_FOUND'
        else:
            self.status = 'PASSED'
        self.save()

    def __str__(self):
        return f"Inspection #{self.id} ({self.get_inspection_type_display()}) - Unit: {self.lease.unit.unit_number} - {self.status}"


class Damage(models.Model):
    CHARGE_TARGET_CHOICES = [
        ('TENANT_DEPOSIT', 'Deduct from Security Deposit'),
        ('LANDLORD_ACC', 'Landlord Expense (Wear & Tear)'),
        ('DIRECT_BILL', 'Invoice Tenant Directly')
    ]

    inspection = models.ForeignKey(Inspection, on_delete=models.CASCADE, related_name='damages')
    description = models.TextField()
    photo = models.ImageField(upload_to='damage_photos/', null=True, blank=True)
    cost = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    
    charge_target = models.CharField(max_length=20, choices=CHARGE_TARGET_CHOICES, default='TENANT_DEPOSIT')
    resolved = models.BooleanField(default=False)
    
    # 👇 Migrated safely with a programmatic timezone default and null support for old table records
    created_at = models.DateTimeField(default=timezone.now, null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        """Overridden save execution block to recalculate the parent structural inspection scores"""
        super().save(*args, **kwargs)
        if self.inspection:
            self.inspection.update_condition_status()

    def __str__(self):
        return f"Damage #{self.id} - KES {self.cost} ({self.get_charge_target_display()})"