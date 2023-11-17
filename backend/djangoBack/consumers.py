# consumers.py

from channels.generic.websocket import AsyncWebsocketConsumer
# from django.contrib.auth import get_user_model
import json


class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()
        await self.send(text_data=json.dumps({"socket_id": self.channel_name}))

    async def disconnect(self, close_code):
        pass

    async def receive(self, text_data):
        pass  # Traitez les données reçues ici

        # Gestionnaire pour les messages 'websocket.send'
    async def websocket_send(self, event):
        # Envoyer le message au client WebSocket
        await self.send(event["text"])

    # async def send_friend_request_notification(self, request_id, sender_username):
    #     # Envoyer une notification à l'utilisateur
    #     await self.send(text_data=json.dumps({
    #         'type': 'friend_request',
    #         'request_id': request_id,
    #         'sender': sender_username
    #     }))
