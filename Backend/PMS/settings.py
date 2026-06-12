import os
from pathlib import Path
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent

# -----------------------------
# CORE SETTINGS
# -----------------------------
SECRET_KEY = 'django-insecure-change-this-in-production'
DEBUG = True

# ✅ UPDATED: Added your live localtunnel proxy domain link along with generic handlers
ALLOWED_HOSTS = [
    '127.0.0.1', 
    'localhost',
    'huge-pandas-fry.loca.lt',  # 🚀 Active LocalTunnel Bridge
    '.ngrok-free.app',         # Fallback handler for ngrok
    '.localtunnel.me',         # Fallback handler for standard localtunnel.me top levels
]

# CHANGE THIS: Match your actual project folder name (the directory containing urls.py and wsgi.py)
ROOT_URLCONF = 'PMS.urls'
WSGI_APPLICATION = 'PMS.wsgi.application'

# -----------------------------
# CORS SETTINGS (Crucial for React Frontend)
# -----------------------------
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# Optional: If your React app tests directly via the proxy tunnel domain link
CORS_ALLOW_ALL_ORIGINS = True  

# -----------------------------
# CUSTOM USER MODEL (Crucial for Foreign Keys)
# -----------------------------
AUTH_USER_MODEL = "accounts.User"
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# -----------------------------
# APPLICATIONS
# -----------------------------
INSTALLED_APPS = [
    # 1. Custom User App MUST be at the top to avoid Migration Errors
    'accounts', 
    
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third-party
    'rest_framework',
    'rest_framework.authtoken',
    'django_filters',
    'corsheaders',
    'channels',
    'social_django',

    # Local apps
    'properties',
    'units',
    'bookings',
    'payments',
    'core',
    'leases',
    'tenants',
    'inspections',
    'maintenance',
    'notifications',  
]

# -----------------------------
# MIDDLEWARE
# -----------------------------
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware', # Placed at the top for preflights
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'social_django.middleware.SocialAuthExceptionMiddleware', 
]

# -----------------------------
# DATABASE (MySQL / MariaDB Fix)
# -----------------------------
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'pms_db',
        'USER': 'root',
        'PASSWORD': '',
        'HOST': '127.0.0.1',
        'PORT': '3306',
        'OPTIONS': {
            'init_command': "SET sql_mode='STRICT_TRANS_TABLES', default_storage_engine=InnoDB",
            'charset': 'utf8mb4',
        },
    }
}

# -----------------------------
# DJANGO REST FRAMEWORK
# -----------------------------
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication', 
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend'
    ],
}

# -----------------------------
# SOCIAL AUTH (GOOGLE)
# -----------------------------
AUTHENTICATION_BACKENDS = (
    'social_core.backends.google.GoogleOAuth2',
    'django.contrib.auth.backends.ModelBackend',
)

SOCIAL_AUTH_GOOGLE_OAUTH2_KEY = "<YOUR_GOOGLE_CLIENT_ID>"
SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET = "<YOUR_GOOGLE_CLIENT_SECRET>"

SOCIAL_AUTH_USER_MODEL = 'accounts.User' 
SOCIAL_AUTH_JSONFIELD_ENABLED = True

LOGIN_REDIRECT_URL = '/'
LOGOUT_REDIRECT_URL = '/'

# -----------------------------
# TEMPLATES
# -----------------------------
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'], 
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'social_django.context_processors.backends',
                'social_django.context_processors.login_redirect',
            ],
        },
    },
]

# -----------------------------
# STATIC FILES
# -----------------------------
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [
    BASE_DIR / 'static',
]

# -----------------------------
# MEDIA FILES
# -----------------------------
MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / 'media'

# -----------------------------
# EMAIL NOTIFICATION CONFIGURATION
# -----------------------------
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'myke50994@gmail.com'       
EMAIL_HOST_PASSWORD = 'jfsv jdvy mgat ghva'          
DEFAULT_FROM_EMAIL = f"Property Manager <{EMAIL_HOST_USER}>"

# -----------------------------
# TWILIO SMS CONFIGURATION
# -----------------------------
TWILIO_ACCOUNT_SID = 'ACxxxxxxxxxxxxxxxxxxxxxxxx'     
TWILIO_AUTH_TOKEN = 'your_actual_auth_token_here'     
TWILIO_PHONE_NUMBER = '+1XXXXXXXXXX'                  

# -----------------------------
# 💳 SAFARICOM DARAJA M-PESA CONFIGURATION
# -----------------------------
MPESA_ENVIRONMENT = "sandbox"
MPESA_SHORTCODE = "174379"  
MPESA_PASSKEY = "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919"

# ✅ Real credentials pasted from your Daraja Portal App profile
MPESA_CONSUMER_KEY = "djUKwYy0R29fupiQ4qQ5AmPa2jgeAHRtSifh8bi5IvG4w1FX"
MPESA_CONSUMER_SECRET = "hro13qz8ThQ22sOFGfjBioxuoMIZb15rNksdBsMoWqxUOWG3vvnEO9gydNRTKdYQ"

# ✅ Configured dynamically with your active LocalTunnel link
MPESA_CALLBACK_URL = "https://huge-pandas-fry.loca.lt/api/payments/mpesa-callback/"