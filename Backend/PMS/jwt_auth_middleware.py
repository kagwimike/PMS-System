from urllib.parse import parse_qs
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from channels.db import database_sync_to_async

User = get_user_model()

@database_sync_to_async
def get_user(user_id):
    try:
        return User.objects.get(id=user_id)
    except User.DoesNotExist:
        return AnonymousUser()

class TokenAuthMiddleware:
    def __init__(self, inner):
        self.inner = inner

    def __call__(self, scope):
        return TokenAuthMiddlewareInstance(scope, self.inner)

class TokenAuthMiddlewareInstance:
    def __init__(self, scope, inner):
        self.scope = dict(scope)
        self.inner = inner

    async def __call__(self, receive, send):
        query_string = self.scope.get("query_string", b"")
        if isinstance(query_string, bytes):
            query_string = query_string.decode()

        query_params = parse_qs(query_string)
        token = query_params.get("token", [None])[0]
        self.scope["user"] = AnonymousUser()

        if token:
            try:
                access_token = AccessToken(token)
                user_id = access_token.get("user_id")
                if user_id:
                    self.scope["user"] = await get_user(user_id)
            except Exception:
                self.scope["user"] = AnonymousUser()

        inner = self.inner(self.scope)
        return await inner(receive, send)
