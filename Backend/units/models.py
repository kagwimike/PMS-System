from django.db import models
from properties.models import Property


class Unit(models.Model):

    class UnitStatus(models.TextChoices):
        VACANT = "VACANT", "Vacant"
        OCCUPIED = "OCCUPIED", "Occupied"
        MAINTENANCE = "MAINTENANCE", "Maintenance"
        RESERVED = "RESERVED", "Reserved"

    property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name="units"
    )

    unit_number = models.CharField(max_length=50)
    floor = models.IntegerField()
    bedrooms = models.IntegerField(default=1)
    window_panes = models.IntegerField(default=0)
    bulbs = models.IntegerField(default=0)
    rent_price = models.DecimalField(max_digits=10, decimal_places=2)

    status = models.CharField(
        max_length=20,
        choices=UnitStatus.choices,
        default=UnitStatus.VACANT
    )

    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.property.name} - {self.unit_number}"
