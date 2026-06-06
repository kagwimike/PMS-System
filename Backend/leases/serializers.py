# leases/serializers.py
from rest_framework import serializers
from .models import Lease
from units.models import Unit

# ======================= TENANT VIEW SERIALIZER =======================
class TenantLeaseSerializer(serializers.ModelSerializer):
    property = serializers.CharField(source='unit.property.name', read_only=True)
    unit = serializers.CharField(source='unit.name', read_only=True)
    tenant_name = serializers.CharField(source='tenant.username', read_only=True)

    class Meta:
        model = Lease
        fields = [
            'id',
            'property',
            'unit',
            'tenant_name',
            'start_date',
            'end_date',
            'status'
        ]
        read_only_fields = fields  # fully read-only for tenants

# ======================= ADMIN / OWNER SERIALIZER =======================
class LeaseSerializer(serializers.ModelSerializer):
    unit_number = serializers.ReadOnlyField(source='unit.unit_number')
    property_name = serializers.ReadOnlyField(source='unit.property.name')
    tenant_name = serializers.ReadOnlyField(source='tenant.username')

    class Meta:
        model = Lease
        fields = "__all__"

    def validate(self, data):
        start = data.get('start_date')
        end = data.get('end_date')
        unit = data.get('unit')

        if start > end:
            raise serializers.ValidationError({
                'start_date': 'Start date must be before end date.',
                'end_date': 'End date must be after start date.'
            })

        # Check for overlapping ACTIVE leases
        overlapping = Lease.objects.filter(
            unit=unit,
            status="ACTIVE",
            start_date__lte=end,
            end_date__gte=start
        )

        if self.instance:
            overlapping = overlapping.exclude(pk=self.instance.pk)

        if overlapping.exists():
            raise serializers.ValidationError({
                'unit': 'This unit has an overlapping active lease.'
            })

        return data