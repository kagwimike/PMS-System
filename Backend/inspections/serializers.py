# inspections/serializers.py
from rest_framework import serializers
from .models import Inspection, Damage

class DamageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Damage
        fields = '__all__'

class InspectionSerializer(serializers.ModelSerializer):
    damages = DamageSerializer(many=True, read_only=True)

    class Meta:
        model = Inspection
        fields = '__all__'
