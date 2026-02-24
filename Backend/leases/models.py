# leases/models.py
from django.db import models
from django.conf import settings
from units.models import Unit

User = settings.AUTH_USER_MODEL

LEASE_STATUS = (
    ("PENDING", "Pending"),
    ("ACTIVE", "Active"),
    ("TERMINATED", "Terminated"),
)

class Lease(models.Model):
    unit = models.ForeignKey(Unit, on_delete=models.CASCADE, related_name="leases")
    tenant = models.ForeignKey(User, on_delete=models.CASCADE, related_name="leases")
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(max_length=20, choices=LEASE_STATUS, default="PENDING")
    rent_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    deposit_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    notes = models.TextField(blank=True)

    def save(self, *args, **kwargs):
        from django.core.exceptions import ValidationError
        # Check overlapping leases
        overlapping = Lease.objects.filter(
            unit=self.unit,
            status="ACTIVE",
            start_date__lte=self.end_date,
            end_date__gte=self.start_date
        ).exclude(pk=self.pk)

        if overlapping.exists():
            raise ValidationError("This unit already has an overlapping lease.")

        super().save(*args, **kwargs)

        # Auto-update unit status
        if self.status == "ACTIVE":
            self.unit.status = "OCCUPIED"
            self.unit.save()
        elif self.status == "TERMINATED":
            self.unit.status = "VACANT"
            self.unit.save()
