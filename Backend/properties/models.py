from django.db import models
from django.conf import settings
from django.utils.text import slugify

class Amenity(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name


class Property(models.Model):

    PROPERTY_TYPES = (
        ("APARTMENT", "Apartment"),
        ("HOTEL", "Hotel"),
        ("AIRBNB", "Airbnb"),
    )

    STATUS_CHOICES = (
        ("ACTIVE", "Active"),
        ("INACTIVE", "Inactive"),
        ("MAINTENANCE", "Under Maintenance"),
    )

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="properties"
    )

    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True, blank=True)

    property_type = models.CharField(
        max_length=20,
        choices=PROPERTY_TYPES
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="ACTIVE"
    )

    address = models.CharField(max_length=500)
    city = models.CharField(max_length=100)
    country = models.CharField(max_length=100)

    total_units = models.PositiveIntegerField(default=1)
    description = models.TextField(blank=True)

    amenities = models.ManyToManyField(
        Amenity,
        blank=True,
        related_name="properties"
    )

    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class PropertyImage(models.Model):
    property = models.ForeignKey(
        "Property",  # lazy reference works since Property is defined above
        on_delete=models.CASCADE,
        related_name="images"
    )
    image = models.ImageField(upload_to="property_images/")
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Image for {self.property.name}"


class PropertyPricing(models.Model):
    property = models.OneToOneField(
        "Property",
        on_delete=models.CASCADE,
        related_name="pricing"
    )

    base_price = models.DecimalField(max_digits=10, decimal_places=2)
    cleaning_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    service_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    currency = models.CharField(max_length=10, default="Ksh")

    def total_price(self):
        return self.base_price + self.cleaning_fee + self.service_fee

    def __str__(self):
        return f"Pricing for {self.property.name}"
