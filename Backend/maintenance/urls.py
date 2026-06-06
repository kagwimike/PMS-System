# maintenance/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MaintenanceRequestViewSet, VendorViewSet

router = DefaultRouter()
router.register(r"requests", MaintenanceRequestViewSet, basename="maintenance-request")
router.register(r"vendors", VendorViewSet, basename="vendor")

urlpatterns = [
    # Include all router URLs
    path("", include(router.urls)),
]