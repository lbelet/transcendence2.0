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


class GameConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Accepter la connexion WebSocket pour le jeu
        await self.accept()
        await self.send(text_data=json.dumps({"GameSocket_id": self.channel_name}))


    async def disconnect(self, close_code):
        # Gérer la déconnexion du jeu
        pass

    async def receive(self, text_data):
        data = json.loads(text_data)
        # Traiter les données reçues pour le jeu (par exemple, mouvements des raquettes)
    
    async def websocket_send(self, event):
        # Envoyer le message au client WebSocket
        await self.send(event["text"])

    # Vous pouvez ajouter d'autres méthodes utiles pour le jeu ici