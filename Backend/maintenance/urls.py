from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MaintenanceRequestViewSet, VendorViewSet

# Using DefaultRouter creates a clean root API view for your maintenance app
router = DefaultRouter()
router.register(r"requests", MaintenanceRequestViewSet, basename="maintenance-request")
router.register(r"vendors", VendorViewSet, basename="vendor")

urlpatterns = [
    # Explicitly mapping the router's includes to avoid empty string root collisions
    path("", include(router.urls)),
]