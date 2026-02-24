from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.conf.urls.static import static
from django.conf import settings # <--- ADD THIS LINE

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/accounts/', include('accounts.urls')),
    path("api/", include("properties.urls")),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/', include('units.urls')), 
    path("api/", include("tenants.urls")),
    path("api/", include("leases.urls")),
    path("api/", include("inspections.urls")),
    path("api/maintenance/", include("maintenance.urls")),
    path("api/notifications/", include("notifications.urls")),

]

# This is the correct way to serve media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)