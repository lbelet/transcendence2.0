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
    # game_id = None  # Initialisé à None
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.game_state = {
            'paddle1': {'x': 0},
            'paddle2': {'x': 0},
            'ball': {'x': 0, 'z': 0, 'dx': 0, 'dz': 0}
        }
        print("game state: ", self.game_state)

    async def connect(self):
        await self.accept()
        await self.send(text_data=json.dumps({"game_socket_id": self.channel_name}))

    async def disconnect(self, close_code):
        self.game_active = False
        if self.game_id:
            await self.channel_layer.group_discard(
                f'pong_game_{self.game_id}',
                self.channel_name
            )
        # self.game_active = False

    async def game_loop(self):
        while self.game_active:
            print("game loop ok")
            # self.update_ball_position()
            # await self.update_game_state()
            await asyncio.sleep(0.05)  # Attente de 100ms entre chaque mise à jour

    async def receive(self, text_data):
        data = json.loads(text_data)
        print("Message reçu dans GameConsumer: ", data)

        # if data.get('type') == 'game_start':
        #     await self.game_start(data)

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
        # Exemple de mouvement simple : déplacement horizontal
            move_amount = 2  # Ajustez selon les besoins

            if data['action'] == 'move_right_paddle1':
                self.game_state['paddle1']['x'] += move_amount
            elif data['action'] == 'move_left_paddle1':
                self.game_state['paddle1']['x'] -= move_amount
            elif data['action'] == 'move_right_paddle2':
                self.game_state['paddle2']['x'] += move_amount
            elif data['action'] == 'move_left_paddle2':
                self.game_state['paddle2']['x'] -= move_amount
        # Envoyer l'état mis à jour
        await self.channel_layer.group_send(
            f'pong_game_{self.game_id}',
            {
                'type': 'send_game_update',
                'game_state': self.get_game_state()
            }
        )

    async def send_game_update(self, event):
        # Envoi de l'état mis à jour du jeu aux clients
        await self.send(text_data=json.dumps({
            'type': 'game_update',  # Indiquer le type de message
            'game_state': event['game_state']  # Ajouter l'état du jeu
        }))

    def get_game_state(self):
        return self.game_state


    async def game_start(self, event):
        await self.send(text_data=json.dumps({
            'type': 'game_start',
            'game_id': event['game_id']
        }))
        self.game_active = True
        asyncio.create_task(self.game_loop())

    async def end_game(self, event):
        # Arrêter la boucle de jeu
        self.game_active = False

