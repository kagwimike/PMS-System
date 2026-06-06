from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    id = models.BigAutoField(primary_key=True)

    ROLE_CHOICES = (
        ('ADMIN', 'Admin'),
        ('OWNER', 'Owner'),
        ('TENANT', 'Tenant'),
        ('GUEST', 'Guest'),
    )

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='GUEST')

    phone = models.CharField(max_length=20, blank=True, null=True)

    # ✅ New useful fields
    profile_picture = models.ImageField(upload_to='profiles/', blank=True, null=True)
    is_verified = models.BooleanField(default=False)

    # ✅ Override email to make it unique (important for auth systems)
    email = models.EmailField(unique=True)

    # ✅ Timestamps (very important for tracking users)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.username} ({self.role})"

    class Meta:
        ordering = ['-created_at']