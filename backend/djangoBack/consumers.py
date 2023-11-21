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
        # Extrait l'identifiant du jeu de l'URL (assurez-vous que cela correspond à votre routage URL)
        self.game_id = self.scope['url_route']['kwargs']['game_id']

        # Rejoindre le groupe de jeu spécifique
        await self.channel_layer.group_add(
            f'pong_game_{self.game_id}',
            self.channel_name
        )

        await self.accept()
        await self.send(text_data=json.dumps({"GameSocket_id": self.channel_name}))

    async def disconnect(self, close_code):
        # Quitter le groupe lors de la déconnexion
        await self.channel_layer.group_discard(
            f'pong_game_{self.game_id}',
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        # Traiter les données reçues pour le jeu

    async def game_start(self, event):
        # Envoyer un message aux clients pour démarrer la partie
        await self.send(text_data=json.dumps({
            'type': 'game_start',
            'game_id': event['game_id']
        }))

    # Vous pouvez ajouter d'autres méthodes utiles pour le jeu ici
