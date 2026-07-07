from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InspectionViewSet, DamageViewSet

router = DefaultRouter()

# Explicitly passing 'basename' protects endpoints using dynamic get_queryset lookups
router.register(r'inspections', InspectionViewSet, basename='inspection')
router.register(r'damages', DamageViewSet, basename='damage')

urlpatterns = [
    path('', include(router.urls)),
]