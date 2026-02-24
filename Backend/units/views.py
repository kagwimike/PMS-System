from rest_framework import viewsets, permissions
from .models import Unit
from .serializers import UnitSerializer

class UnitViewSet(viewsets.ModelViewSet):
    queryset = Unit.objects.all()
    serializer_class = UnitSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Optionally filter units by property ID via query params:
        /api/units/?property=1
        """
        queryset = super().get_queryset()
        property_id = self.request.query_params.get('property')
        if property_id:
            queryset = queryset.filter(property_id=property_id)
        return queryset
