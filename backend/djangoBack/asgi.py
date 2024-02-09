import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'djangoBack.settings')
import django
django.setup()

from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
import djangoBack.routing
from django.core.asgi import get_asgi_application


application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(
            djangoBack.routing.websocket_urlpatterns
        )
    ),
})


