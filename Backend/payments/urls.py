# backend/payments/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InvoiceViewSet, PaymentViewSet, DepositRefundViewSet, mpesa_callback

router = DefaultRouter()
router.register(r'invoices', InvoiceViewSet, basename='invoice')
router.register(r'history', PaymentViewSet, basename='payment-history')
router.register(r'deposit-refunds', DepositRefundViewSet, basename='deposit-refund')

urlpatterns = [
    # Router endpoints
    path('', include(router.urls)),
    
    # 🚨 Public Webhook Callback Endpoint for Safaricom Daraja API
    # Maps directly to: POST http://<your-domain>/api/payments/mpesa-callback/
    path('mpesa-callback/', mpesa_callback, name='mpesa_callback'),
]