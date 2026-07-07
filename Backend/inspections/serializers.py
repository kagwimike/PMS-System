from rest_framework import serializers
from .models import Inspection, Damage

class DamageSerializer(serializers.ModelSerializer):
    charge_target_display = serializers.CharField(source='get_charge_target_display', read_only=True)

    class Meta:
        model = Damage
        fields = [
            'id', 
            'inspection', 
            'description', 
            'photo', 
            'cost', 
            'charge_target', 
            'charge_target_display', 
            'resolved', 
            'created_at'
        ]


class InspectionSerializer(serializers.ModelSerializer):
    # Nesting the updated damages array
    damages = DamageSerializer(many=True, read_only=True)
    
    # Human-readable choice translations
    inspection_type_display = serializers.CharField(source='get_inspection_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    # 🔗 Relational fields pulled across app lookups for frontend rendering
    unit_number = serializers.CharField(source='lease.unit.unit_number', read_only=True)
    
    # FIX: Trailing relationship path goes Lease -> Unit -> Property -> Title/Name
    property_title = serializers.SerializerMethodField()
    
    tenant_name = serializers.CharField(source='lease.tenant.username', read_only=True)
    inspector_username = serializers.CharField(source='inspector.username', read_only=True)

    class Meta:
        model = Inspection
        fields = [
            'id',
            'lease',
            'inspection_type',
            'inspection_type_display',
            'status',
            'status_display',
            'date',
            'notes',
            'inspector',
            'inspector_username',
            'condition_score',
            'unit_number',
            'property_title',
            'tenant_name',
            'damages'
        ]
        read_only_fields = ['inspector', 'status']

    def get_property_title(self, obj):
        """
        Safely extracts the property title/name down the relational dependency chain
        without risking runtime attribute crashes.
        """
        try:
            unit = obj.lease.unit
            property_obj = unit.property
            # Gracefully fall back if your field is named 'name' instead of 'title'
            return getattr(property_obj, 'title', getattr(property_obj, 'name', 'N/A'))
        except AttributeError:
            return "N/A"