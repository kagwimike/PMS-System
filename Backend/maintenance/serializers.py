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
    vendor = VendorSerializer(source='assigned_vendor', read_only=True)

    # Automatically converts image files to absolute URLs for React <img> tags
    damage_photo = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = MaintenanceRequest
        fields = [
            'id',
            'title',
            'description',  # Vital for tracking issue details
            'status',
            'priority',
            
            # Media uploads
            'damage_photo',  # ✅ Added: For tenant photo attachments
            
            # Relationship tracking mappings
            'tenant',       # Direct foreign key reference ID
            'tenant_name',
            'property',     # Direct foreign key reference ID
            'property_name',
            'unit',         # Direct foreign key reference ID
            'unit_number',
            
            # Vendor metrics updates
            'assigned_vendor', 
            'assigned_vendor_name',
            'vendor',
            'vendor_notes',         # ✅ Added: For closing notes
            'vendor_completed_at',  # ✅ Added: Timestamp tracking
            
            'created_at',
            'updated_at'
        ]
        
        # Crucial adjustments to prevent payload parsing failures during POST requests
        extra_kwargs = {
            'tenant': {'required': False, 'allow_null': True},
            'property': {'required': False, 'allow_null': True},
            'unit': {'required': False, 'allow_null': True},
            'assigned_vendor': {'required': False, 'allow_null': True},
        }