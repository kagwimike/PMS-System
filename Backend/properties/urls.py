from rest_framework.routers import DefaultRouter
from .views import PropertyViewSet, AmenityViewSet

router = DefaultRouter()
router.register(r'properties', PropertyViewSet, basename='property')
router.register(r'amenities', AmenityViewSet, basename='amenity')

urlpatterns = router.urls
