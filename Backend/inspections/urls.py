# inspections/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InspectionViewSet, DamageViewSet

router = DefaultRouter()
router.register(r'inspections', InspectionViewSet)
router.register(r'damages', DamageViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
