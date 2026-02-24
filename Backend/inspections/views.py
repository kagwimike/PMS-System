# inspections/views.py
from rest_framework import viewsets, permissions
from .models import Inspection, Damage
from .serializers import InspectionSerializer, DamageSerializer

class InspectionViewSet(viewsets.ModelViewSet):
    queryset = Inspection.objects.all()
    serializer_class = InspectionSerializer
    permission_classes = [permissions.IsAuthenticated]

class DamageViewSet(viewsets.ModelViewSet):
    queryset = Damage.objects.all()
    serializer_class = DamageSerializer
    permission_classes = [permissions.IsAuthenticated]
