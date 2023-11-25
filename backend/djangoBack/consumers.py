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
    game_id = None  # Initialisé à None

    async def connect(self):
        await self.accept()
        await self.send(text_data=json.dumps({"game_socket_id": self.channel_name}))

    async def disconnect(self, close_code):
        if self.game_id:
            await self.channel_layer.group_discard(
                f'pong_game_{self.game_id}',
                self.channel_name
            )

    async def receive(self, text_data):
        data = json.loads(text_data)

        # Si le message contient un game_id, rejoindre le groupe de jeu
        if 'game_id' in data:
            self.game_id = data['game_id']
            await self.channel_layer.group_add(
                f'pong_game_{self.game_id}',
                self.channel_name
            )
            # Confirmer l'ajout au groupe
            await self.send(text_data=json.dumps({
                "status": "added_to_game",
                "game_id": self.game_id
            }))

    async def game_start(self, event):
        # Envoyer un message aux clients pour démarrer la partie
        await self.send(text_data=json.dumps({
            'type': 'game_start',
            'game_id': event['game_id']
        }))


    # Vous pouvez ajouter d'autres méthodes utiles pour le jeu ici
