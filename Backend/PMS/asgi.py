import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter

from notifications.routing import websocket_urlpatterns as notification_ws
from maintenance.routing import websocket_urlpatterns as maintenance_ws

# MUST be first
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "PMS.settings")

# Debug confirmation (remove in production if you want)
print("🔥 ASGI FILE IS ACTIVE")

# Django ASGI app
django_asgi_app = get_asgi_application()

# Combine websocket routes safely
websocket_urlpatterns = []
websocket_urlpatterns += notification_ws
websocket_urlpatterns += maintenance_ws

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": URLRouter(websocket_urlpatterns),
})