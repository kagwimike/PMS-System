# leases/serializers.py
from rest_framework import serializers
from .models import Lease
from units.models import Unit

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
            raise serializers.ValidationError("Start date must be before end date.")

        # Check overlapping leases
        overlapping = Lease.objects.filter(
            unit=unit,
            status="ACTIVE",
            start_date__lte=end,
            end_date__gte=start
        )
        if self.instance:
            overlapping = overlapping.exclude(pk=self.instance.pk)

        if overlapping.exists():
            raise serializers.ValidationError("This unit has an overlapping active lease.")
        return data
