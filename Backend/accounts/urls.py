from django.urls import path
from .views import (
    RegisterView,
    CustomTokenObtainPairView,
    GoogleTokenSignInView  # ✅ Imported our new streamlined verification view
)

urlpatterns = [
    # ---------------------------
    # Standard JWT endpoints
    # ---------------------------
    path('register/', RegisterView.as_view(), name='register'),  # Public user registration
    path('login/', CustomTokenObtainPairView.as_view(), name='login'),  # Standard login (JWT)

    # ---------------------------
    # Google OAuth2 Endpoint
    # ---------------------------
    # ✅ Processes the direct JSON Web Token (ID token) received from the React frontend wrapper
    path('auth/google/', GoogleTokenSignInView.as_view(), name='google-token-signin'),
]