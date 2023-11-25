from django.urls import re_path, path
from .consumers import NotificationConsumer, GameConsumer

websocket_urlpatterns = [
    path('ws/notifications/', NotificationConsumer.as_asgi()),
    # re_path(r'^ws/game/(?P<game_id>\w+)/$', GameConsumer.as_asgi()),
    path('ws/game/', GameConsumer.as_asgi()),
]


