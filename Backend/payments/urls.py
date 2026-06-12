from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InvoiceViewSet, PaymentViewSet, mpesa_callback

# 1. Initialize the REST Framework Router for Model ViewSets
router = DefaultRouter()
router.register(r'invoices', InvoiceViewSet, basename='invoice')
router.register(r'history', PaymentViewSet, basename='payment-history')

# 2. Wire Up URL Patterns
urlpatterns = [
    # Mapped App Endpoints: 
    # GET/POST           -> /api/payments/invoices/
    # POST (STK Trigger) -> /api/payments/invoices/<id>/pay/
    # GET (History)      -> /api/payments/history/
    path('', include(router.urls)),

    # 🚨 THE SAFARICOM WEBHOOK RECEIVER:
    # Target Endpoint: POST /api/payments/mpesa-callback/
    path('mpesa-callback/', mpesa_callback, name='mpesa_callback'),
]