from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.conf.urls.static import static
from django.conf import settings 

urlpatterns = [
    # Admin Interface
    path('admin/', admin.site.urls),
    
    # Authentication & Accounts
    path('api/accounts/', include('accounts.urls')),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Core Domain Features
    path("api/", include("properties.urls")),
    path('api/', include('units.urls')), 
    path("api/", include("tenants.urls")),
    path("api/", include("leases.urls")),
    path("api/", include("inspections.urls")),
    path("api/maintenance/", include("maintenance.urls")),
    path("api/notifications/", include("notifications.urls")),
    
    # ✅ FIX: Register your financial billing engine route right here
    path("api/payments/", include("payments.urls")),
]

# Serving media files securely during local development iterations
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)