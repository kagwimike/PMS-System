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
        """
        DRF serialization intercept engine. Ensures payload structure matches
        strict database rules prior to executing model .save() handlers.
        """
        # Note: self.instance exists if this is a PUT/PATCH update operation
        start = data.get('start_date', getattr(self.instance, 'start_date', None))
        end = data.get('end_date', getattr(self.instance, 'end_date', None))
        unit = data.get('unit', getattr(self.instance, 'unit', None))
        status = data.get('status', getattr(self.instance, 'status', 'PENDING'))

        print(f"⚙️ [SERIALIZER VALIDATION] Processing request data bounds for Unit: {unit} | Target Status: {status}")

        if start and end and start > end:
            raise serializers.ValidationError({
                'start_date': 'Start date must be before end date.',
                'end_date': 'End date must be after start date.'
            })

        # 🔥 CHECK OVERLAPS FOR BOTH ACTIVE AND PENDING LEASES
        if unit and status in ["ACTIVE", "PENDING"]:
            overlapping = Lease.objects.filter(
                unit=unit,
                status__in=["ACTIVE", "PENDING"],  
                start_date__lte=end,
                end_date__gte=start
            )

            if self.instance:
                overlapping = overlapping.exclude(pk=self.instance.pk)

            if overlapping.exists():
                print(f"❌ [SERIALIZER BLOCKED] Overlap detected for Unit ID {unit.id} during date interval.")
                raise serializers.ValidationError({
                    'unit': 'This unit already has an active or pending lease scheduled for these dates.'
                })

        return data

    def create(self, validated_data):
        """
        🛠️ BACKEND SAFEGUARD OVERRIDE
        Forces all brand-new lease records created via the API interface
        to initialize strictly as PENDING, bypassing frontend payload anomalies.
        """
        print("🛠️ [SERIALIZER CREATE] Overriding incoming status to secure PENDING pipeline initialization.")
        validated_data['status'] = 'PENDING'
        
        # This calls Lease.save() under the hood, running your custom onboarding logic!
        return super().create(validated_data)