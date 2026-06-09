from rest_framework import serializers
from .models import MaintenanceRequest, Vendor

class VendorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vendor
        fields = '__all__'

class MaintenanceRequestSerializer(serializers.ModelSerializer):
    # Read-only field lookups for frontend rendering templates
    tenant_name = serializers.CharField(source='tenant.username', read_only=True)
    property_name = serializers.CharField(source='property.name', read_only=True)
    unit_number = serializers.CharField(source='unit.unit_number', read_only=True)
    assigned_vendor_name = serializers.CharField(source='assigned_vendor.name', read_only=True)

    class Meta:
        model = MaintenanceRequest
        fields = [
            'id',
            'title',
            'description',  # Added: Vital for tracking issue details
            'category',     # Added: (e.g., Plumbing, Electrical)
            'status',
            'priority',
            'tenant',       # Added: To support clean relationship mappings
            'tenant_name',
            'property',     # Added: Direct foreign key reference ID
            'property_name',
            'unit',         # Added: Direct foreign key reference ID
            'unit_number',
            'assigned_vendor', # Added: For landlord assignment updates
            'assigned_vendor_name',
            'created_at',
            'updated_at'
        ]
        # Crucial adjustments to prevent payload parsing failures
        extra_kwargs = {
            'tenant': {'required': False, 'allow_null': True},
            'property': {'required': False, 'allow_null': True},
            'unit': {'required': False, 'allow_null': True},
            'assigned_vendor': {'required': False, 'allow_null': True},
        }