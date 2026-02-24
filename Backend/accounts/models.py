from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = (
        ('ADMIN', 'Admin'),
        ('OWNER', 'Owner'),
        ('TENANT', 'Tenant'),
        ('GUEST', 'Guest'),
    )

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='GUEST')
    phone = models.CharField(max_length=20, blank=True, null=True)

    def __str__(self):
        return f"{self.username} - {self.role}"
