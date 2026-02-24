from rest_framework import serializers
from .models import Tenant

class TenantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tenant
        fields = ["id", "name", "email", "phone", "id_number", "created_at", "updated_at"]
        read_only_fields = ["created_at", "updated_at"]
