from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InvoiceViewSet, PaymentViewSet

router = DefaultRouter()
router.register(r'invoices', InvoiceViewSet, basename='invoice')
router.register(r'history', PaymentViewSet, basename='payment-history')

urlpatterns = [
    path('', include(router.urls)),
]