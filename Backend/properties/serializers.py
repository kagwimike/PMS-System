from rest_framework import serializers
from django.db import transaction
from .models import Property, Amenity, PropertyImage, PropertyPricing
from units.models import Unit


class AmenitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Amenity
        fields = "__all__"


class PropertyImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyImage
        fields = ["id", "image"]


class PropertyPricingSerializer(serializers.ModelSerializer):
    total_price = serializers.ReadOnlyField()

    class Meta:
        model = PropertyPricing
        fields = "__all__"


class PropertySerializer(serializers.ModelSerializer):
    amenities = AmenitySerializer(many=True, read_only=True)
    images = PropertyImageSerializer(many=True, read_only=True)
    pricing = PropertyPricingSerializer(read_only=True)

    class Meta:
        model = Property
        fields = "__all__"
        read_only_fields = ("owner",)

    def create(self, validated_data):
        request = self.context.get("request")

        with transaction.atomic():

            # 1️⃣ Auto-assign owner
            validated_data["owner"] = request.user

            # 2️⃣ Create Property
            property_instance = super().create(validated_data)

            # 3️⃣ Auto-generate Units
            total_units = property_instance.total_units

            units_to_create = []

            for i in range(1, total_units + 1):
                units_to_create.append(
                    Unit(
                        property=property_instance,
                        unit_number=str(i),
                        floor=1,  # default value (editable later)
                        bedrooms=1,
                        window_panes=0,
                        bulbs=0,
                        rent_price=0,
                        status=Unit.UnitStatus.VACANT,
                    )
                )

            Unit.objects.bulk_create(units_to_create)

            return property_instance
