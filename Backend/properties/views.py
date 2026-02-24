from rest_framework import viewsets, permissions
from django_filters.rest_framework import DjangoFilterBackend
from .models import Property, Amenity, PropertyImage
from .serializers import PropertySerializer, AmenitySerializer

class AmenityViewSet(viewsets.ModelViewSet):
    queryset = Amenity.objects.all()
    serializer_class = AmenitySerializer
    permission_classes = [permissions.IsAuthenticated]

class PropertyViewSet(viewsets.ModelViewSet):
    serializer_class = PropertySerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["city", "country", "property_type"]

    def get_queryset(self):
        user = self.request.user
        if user.role == "ADMIN":
            return Property.objects.all()
        elif user.role == "OWNER":
            return Property.objects.filter(owner=user)
        return Property.objects.none()

    def perform_create(self, serializer):
        property_obj = serializer.save(owner=self.request.user)

        # Existing amenities (IDs)
        amenities_ids = self.request.data.getlist("amenities")
        if amenities_ids:
            valid_ids = [i for i in amenities_ids if not str(i).startswith("new-")]
            if valid_ids:
                property_obj.amenities.add(*valid_ids)

        # New amenities (names)
        new_amenities = self.request.data.getlist("new_amenities")
        for name in new_amenities:
            if name.strip():
                amenity_obj, _ = Amenity.objects.get_or_create(name=name.strip())
                property_obj.amenities.add(amenity_obj)

        # Images
        images = self.request.FILES.getlist("images")
        for img in images:
            PropertyImage.objects.create(property=property_obj, image=img)
