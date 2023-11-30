# consumers.py

import asyncio
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


# import asyncio
# from channels.generic.websocket import AsyncWebsocketConsumer
# import json

class GameConsumer(AsyncWebsocketConsumer):
    game_id = None  # Initialisé à None

    ball_position_x = 0
    ball_position_y = 0
    ball_position_z = 0
    ball_speed = 0.1
    ball_direction = [0, 0, -1]

    opponent_paddle_position_x = 0  # Position initiale du paddle adverse
    opponent_paddle_position_y = 0  # Position initiale du paddle adverse
    opponent_paddle_position_z = 0  # Position initiale du paddle adverse


    async def connect(self):
        await self.accept()
        await self.send(text_data=json.dumps({"game_socket_id": self.channel_name}))

    async def disconnect(self, close_code):
        if self.game_id:
            await self.channel_layer.group_discard(
                f'pong_game_{self.game_id}',
                self.channel_name
            )
        self.game_active = False

    async def game_loop(self):
        while self.game_active:
            self.update_ball_position()
            await self.update_game_state()
            await asyncio.sleep(0.05)  # Attente de 100ms entre chaque mise à jour

    async def receive(self, text_data):
        data = json.loads(text_data)
        print("Message reçu dans GameConsumer: ", data)

        if 'game_id' in data:
            self.game_id = data['game_id']
            await self.channel_layer.group_add(
                f'pong_game_{self.game_id}',
                self.channel_name
            )
            await self.send(text_data=json.dumps({
                "status": "added_to_game",
                "game_id": self.game_id
            }))

        if data.get('type') == 'paddle_move':
            if 'x' in data:
                await self.channel_layer.group_send(
                    f'pong_game_{self.game_id}',
                    {
                        'type': 'paddle_position',
                        'x': data['x'],
                        'sender_channel_name': self.channel_name
                    }
                )

    async def game_start(self, event):
        await self.send(text_data=json.dumps({
            'type': 'game_start',
            'game_id': event['game_id']
        }))
        self.game_active = True
        asyncio.create_task(self.game_loop())

    async def paddle_position(self, event):
        if self.channel_name != event['sender_channel_name']:
            await self.send(text_data=json.dumps({
                'type': 'paddle_position',
                'x': event['x']
            }))

    async def update_game_state(self):
        await self.channel_layer.group_send(
            f'pong_game_{self.game_id}',
            {
                'type': 'ball_position',
                'ball': {
                    'x': self.ball_position_x,
                    'y': self.ball_position_y,
                    'z': self.ball_position_z
                }
            }
        )

    def update_ball_position(self):
        self.ball_position_x += self.ball_speed * self.ball_direction[0]
        self.ball_position_y += self.ball_speed * self.ball_direction[1]
        self.ball_position_z += self.ball_speed * self.ball_direction[2]

        # Vérifier la collision avec le paddle adverse
        if self.check_collision_with_opponent_paddle():
            self.ball_direction[2] *= -1  # Inverser la direction de la balle en z

    async def ball_position(self, event):
        # Cette méthode traite les messages de type 'ball_position' envoyés par group_send
        await self.send(text_data=json.dumps({
            'type': 'ball_position',
            'ball': event['ball']
        }))

    def check_collision_with_opponent_paddle(self):
        # Ici, vous devez implémenter la logique pour vérifier si la balle touche le paddle adverse
        # Cette logique dépendra de la taille de votre paddle et de la balle, et de leur position relative
        # Par exemple :
        paddle_range = 1.0  # À ajuster en fonction de la taille de votre paddle
        return abs(self.ball_position_x - self.opponent_paddle_position_x) < paddle_range and \
               self.ball_position_z == -7  # Supposer que -7 est la position en z du paddle adverse


    # Vous pouvez ajouter d'autres méthodes utiles pour le jeu ici
