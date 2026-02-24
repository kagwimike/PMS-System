from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.conf import settings
from django.shortcuts import redirect
from .serializers import RegisterSerializer
from .models import User
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from .jwt_serializers import CustomTokenObtainPairSerializer
import requests

# ---------------------------
# JWT / Standard Views
# ---------------------------

class RegisterView(generics.CreateAPIView):
    """
    Public endpoint to register new users.
    """
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]  # ✅ Public access

class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Public endpoint for standard username/password login.
    """
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [AllowAny]  # ✅ Public access

# ---------------------------
# Google OAuth2 Views
# ---------------------------

class GoogleLoginView(generics.GenericAPIView):
    """
    Redirects user to Google OAuth2 consent screen.
    Public endpoint.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        google_auth_url = (
            "https://accounts.google.com/o/oauth2/v2/auth"
            "?response_type=code"
            f"&client_id={settings.SOCIAL_AUTH_GOOGLE_OAUTH2_KEY}"
            f"&redirect_uri={settings.SOCIAL_AUTH_REDIRECT_URI}"
            "&scope=openid%20email%20profile"
        )
        return redirect(google_auth_url)


class GoogleOAuthCallbackView(generics.GenericAPIView):
    """
    Handles Google OAuth2 callback:
    - Exchanges code for Google access token
    - Fetches user info
    - Creates PMS user if new
    - Returns JWT & user info
    """
    permission_classes = [AllowAny]

    def get(self, request):
        code = request.GET.get('code')
        if not code:
            return Response({'error': 'No code provided'}, status=status.HTTP_400_BAD_REQUEST)

        # Exchange code for Google access token
        token_url = "https://oauth2.googleapis.com/token"
        data = {
            "code": code,
            "client_id": settings.SOCIAL_AUTH_GOOGLE_OAUTH2_KEY,
            "client_secret": settings.SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET,
            "redirect_uri": settings.SOCIAL_AUTH_REDIRECT_URI,
            "grant_type": "authorization_code",
        }
        token_response = requests.post(token_url, data=data).json()
        access_token = token_response.get("access_token")
        if not access_token:
            return Response({'error': 'Failed to get access token'}, status=status.HTTP_400_BAD_REQUEST)

        # Get user info from Google
        user_info_response = requests.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"}
        ).json()

        email = user_info_response.get("email")
        first_name = user_info_response.get("given_name", "")
        last_name = user_info_response.get("family_name", "")

        if not email:
            return Response({'error': 'Failed to get email from Google'}, status=status.HTTP_400_BAD_REQUEST)

        # Create or get PMS user
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "username": email.split("@")[0],
                "first_name": first_name,
                "last_name": last_name,
                "role": "TENANT",  # default role for new users
            }
        )

        # Generate JWT token for frontend
        refresh = RefreshToken.for_user(user)
        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": user.role,
                "first_name": user.first_name,
                "last_name": user.last_name,
            }
        })