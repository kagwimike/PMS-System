from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
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

    def clean(self):
        """
        Put validation logic in clean() instead of save(). 
        This allows Django REST Framework serializers to catch errors 
        and return a clean '400 Bad Request' response to React.
        """
        super().clean()
        
        if self.start_date and self.end_date and self.start_date > self.end_date:
            raise ValidationError({"start_date": "Start date cannot be after end date."})

        # Check overlapping active/pending leases safely
        if self.status in ["ACTIVE", "PENDING"]:
            overlapping = Lease.objects.filter(
                unit=self.unit,
                status__in=["ACTIVE", "PENDING"],
                start_date__lte=self.end_date,
                end_date__gte=self.start_date
            ).exclude(pk=self.pk)

            if overlapping.exists():
                raise ValidationError("This unit already has an active or pending lease scheduled for these dates.")

    def save(self, *args, **kwargs):
        # 1. Run the clean validation checks before saving
        self.full_clean()

        # 2. Auto-fill rent from Unit if left blank by Landlord
        if not self.rent_amount and self.unit and hasattr(self.unit, 'rent_price'):
            self.rent_amount = self.unit.rent_price

        # 3. Save the Lease instance first
        super().save(*args, **kwargs)

        # 4. Comprehensive Unit Status management
        if self.status == "ACTIVE":
            if self.unit.status != "OCCUPIED":
                self.unit.status = "OCCUPIED"
                self.unit.save(update_fields=["status"])
        else:
            # If status is TERMINATED or PENDING, the space remains open
            if self.unit.status != "VACANT":
                self.unit.status = "VACANT"
                self.unit.save(update_fields=["status"])

    def __str__(self):
        return f"{self.tenant.email} - Unit {self.unit.unit_number} ({self.status})"