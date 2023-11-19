from django.urls import path
from .consumers import NotificationConsumer, GameConsumer

websocket_urlpatterns = [
    path('ws/notifications/', NotificationConsumer.as_asgi()),
    path('ws/game/', GameConsumer.as_asgi()),
]


