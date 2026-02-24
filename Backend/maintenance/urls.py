from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MaintenanceRequestViewSet, VendorViewSet

router = DefaultRouter()
router.register(r"requests", MaintenanceRequestViewSet)
router.register(r"vendors", VendorViewSet)

urlpatterns = [
    path("", include(router.urls)),
]
