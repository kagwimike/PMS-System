import logging
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.conf import settings
from .serializers import RegisterSerializer
from .models import User
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from .jwt_serializers import CustomTokenObtainPairSerializer

# Import Google token verification utilities
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

# Set up logging to output validation details directly to your terminal
logger = logging.getLogger(__name__)

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

class GoogleTokenSignInView(generics.GenericAPIView):
    """
    Handles secure Google JSON Web Tokens directly from React:
    - Verifies integrity via Google's public key matrix
    - Provisions or returns user profile mapping
    - Returns system JWT & role info
    """
    permission_classes = [AllowAny]

    def post(self, request):
        # Expecting {"token": "eyJhbG..."} payload from React frontend
        token = request.data.get('token')
        if not token:
            return Response({'error': 'OAuth credential token is missing.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # 1. Safely pull your Client ID string out of settings.py
            client_id = getattr(settings, 'SOCIAL_AUTH_GOOGLE_OAUTH2_KEY', None)
            
            # Defensive check: if settings key is missing or unconfigured template string, apply backup
            if not client_id or "<YOUR_GOOGLE_CLIENT_ID>" in client_id:
                client_id = "239105933863-uarm1uqc28mk9us460kr0tm9r3fv46po.apps.googleusercontent.com"

            # 2. Verify token signature natively using Google public verification handshakes
            idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), client_id)

            email = idinfo.get('email')
            first_name = idinfo.get('given_name', '')
            last_name = idinfo.get('family_name', '')

            if not email:
                return Response({'error': 'Failed to resolve email from signature payload.'}, status=status.HTTP_400_BAD_REQUEST)

            # 3. Get or Create user profile mappings inside your localized database
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    "username": email.split("@")[0],
                    "first_name": first_name,
                    "last_name": last_name,
                    "role": "LANDLORD",  # Landlords manage properties and dispatch vendors
                }
            )

            # 4. Generate system access and refresh verification tokens (SimpleJWT)
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
            }, status=status.HTTP_200_OK)

        except ValueError as e:
            # Logs structural issues like token expiration or mismatched audience string (aud)
            logger.error(f"Google Token verification exception: {str(e)}")
            return Response({
                'error': 'Invalid or compromised token payload authentication validation.',
                'details': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            logger.error(f"Unexpected error encountered during login handshake: {str(e)}")
            return Response({'error': 'An internal processing error occurred.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)