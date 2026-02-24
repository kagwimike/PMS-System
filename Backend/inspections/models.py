# inspections/models.py
from django.db import models
from tenants.models import Tenant
from properties.models import Property
from units.models import Unit
from leases.models import Lease

class Inspection(models.Model):
    CHECKIN = 'CHECKIN'
    CHECKOUT = 'CHECKOUT'
    INSPECTION_TYPE_CHOICES = [
        (CHECKIN, 'Check-in'),
        (CHECKOUT, 'Check-out')
    ]

    lease = models.ForeignKey(Lease, on_delete=models.CASCADE, related_name='inspections')
    inspection_type = models.CharField(max_length=10, choices=INSPECTION_TYPE_CHOICES)
    date = models.DateField(auto_now_add=True)
    notes = models.TextField(blank=True, null=True)
    inspector_name = models.CharField(max_length=100)
    condition_score = models.IntegerField(default=100)  # 0-100, 100 = perfect condition

    def __str__(self):
        return f"{self.lease.unit.unit_number} - {self.inspection_type} - {self.date}"

class Damage(models.Model):
    inspection = models.ForeignKey(Inspection, on_delete=models.CASCADE, related_name='damages')
    description = models.TextField()
    photo = models.ImageField(upload_to='damage_photos/', null=True, blank=True)
    cost = models.DecimalField(max_digits=10, decimal_places=2)
    resolved = models.BooleanField(default=False)

    def __str__(self):
        return f"Damage for {self.inspection.lease.unit.unit_number} - {self.description[:20]}"
