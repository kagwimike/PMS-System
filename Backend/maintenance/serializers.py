from rest_framework import serializers
from .models import MaintenanceRequest, Vendor

class VendorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vendor
        fields = '__all__'

class MaintenanceRequestSerializer(serializers.ModelSerializer):
    tenant_name = serializers.CharField(source='tenant.username', read_only=True)
    property_name = serializers.CharField(source='property.name', read_only=True)
    unit_number = serializers.CharField(source='unit.unit_number', read_only=True)
    assigned_vendor_name = serializers.CharField(source='assigned_vendor.name', read_only=True)

    class Meta:
        model = MaintenanceRequest
        fields = '__all__'
