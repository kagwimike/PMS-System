from django.urls import path
from .views import (
    RegisterView,
    CustomTokenObtainPairView,
    GoogleLoginView,
    GoogleOAuthCallbackView
)

urlpatterns = [
    # ---------------------------
    # Standard JWT endpoints
    # ---------------------------
    path('register/', RegisterView.as_view(), name='register'),  # Public user registration
    path('login/', CustomTokenObtainPairView.as_view(), name='login'),  # Standard login (JWT)

    # ---------------------------
    # Google OAuth2 endpoints
    # ---------------------------
    path('login/google/', GoogleLoginView.as_view(), name='google-login'),  # Redirects user to Google consent screen
    path('oauth/callback/google/', GoogleOAuthCallbackView.as_view(), name='google-callback'),  # Google redirect URI after login
]