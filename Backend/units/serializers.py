from rest_framework import serializers
from .models import Unit


class UnitSerializer(serializers.ModelSerializer):
    property_name = serializers.ReadOnlyField(source="property.name")

    class Meta:
        model = Unit
        fields = [
            "id",
            "property",
            "property_name",
            "unit_number",
            "floor",
            "bedrooms",
            "window_panes",
            "bulbs",
            "rent_price",
            "status",
            "description",
        ]
        read_only_fields = ["status"]  # Controlled by system logic

    def validate(self, data):
        property_obj = data.get("property") or self.instance.property

        # Enforce total_units limit
        if self.instance is None:
            if property_obj.units.count() >= property_obj.total_units:
                raise serializers.ValidationError(
                    "Maximum unit limit reached for this property."
                )

        # Unique unit number per property
        unit_number = data.get("unit_number")
        if unit_number:
            existing = Unit.objects.filter(
                property=property_obj,
                unit_number=unit_number
            )
            if self.instance:
                existing = existing.exclude(id=self.instance.id)
            if existing.exists():
                raise serializers.ValidationError(
                    "This unit number already exists for this property."
                )

        return data
