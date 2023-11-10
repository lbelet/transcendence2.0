"""
ASGI config for django project.

It exposes the ASGI callable as a module-level variable named ``application``.
"""

import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from django.urls import path
from backend.djangoBack.consumers import MyConsumer

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'djangoBack.settings')

django_asgi_app = get_asgi_application()

websocket_urlpatterns = [
    path('ws/', MyConsumer.as_asgi()),
]

application = ProtocolTypeRouter({
    "http": django_asgi_app,  # Pour les requêtes HTTP standard
    "websocket": AuthMiddlewareStack(
        URLRouter(
            websocket_urlpatterns  # Pour les WebSockets
        )
    ),
})
