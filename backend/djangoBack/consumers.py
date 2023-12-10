# consumers.py

import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
import json
# from asgiref.sync import sync_to_async

# from djangoBack.models import PongGame


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

    players_connected = {}  # Dictionnaire pour suivre les joueurs connectés
    game_states = {}  # Dictionnaire pour stocker l'état de chaque partie

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

    async def game_loop(self):
        while self.game_active:
            print("game loop ok")
            self.update_ball_position()
            # Envoyer l'état mis à jour à tous les clients dans le groupe
            await self.channel_layer.group_send(
                f'pong_game_{self.game_id}',
                {
                    'type': 'send_ball_update',
                    'ball_state': self.get_ball_state()
                }
            )
            await asyncio.sleep(0.10) 

    async def receive(self, text_data):
        data = json.loads(text_data)
        print("Message reçu dans GameConsumer: ", data)

        if 'game_id' in data:
            self.game_id = data['game_id']
            await self.channel_layer.group_add(
                f'pong_game_{self.game_id}',
                self.channel_name
            )
            print(f"Utilisateur ajouté au groupe: pong_game_{self.game_id}, channel_name: {self.channel_name}")
            # await self.check_and_send_game_start(self.game_id)

            await self.send(text_data=json.dumps({
                "status": "added_to_game",
                "game_id": self.game_id
            }))
            self.mark_player_joined(self.game_id, self.channel_name)
            if self.both_players_joined(self.game_id):
                # Envoyer game_start si les deux joueurs ont rejoint
                await self.send_game_start()
        
        if data.get('type') == 'paddle_move':
        # Exemple de mouvement simple : déplacement horizontal
            move_amount = 2  # Ajustez selon les besoins
            game_state = self.game_states[self.game_id]

            if data['action'] == 'move_right_paddle1':
                game_state['paddles']['paddle1']['x'] += move_amount
            elif data['action'] == 'move_left_paddle1':
                game_state['paddles']['paddle1']['x'] -= move_amount
            elif data['action'] == 'move_right_paddle2':
                game_state['paddles']['paddle2']['x'] += move_amount
            elif data['action'] == 'move_left_paddle2':
                game_state['paddles']['paddle2']['x'] -= move_amount
        # Envoyer l'état mis à jour
        await self.channel_layer.group_send(
            f'pong_game_{self.game_id}',
            {
                'type': 'send_paddles_update',
                'paddles_state': self.get_paddles_state()
            }
        )

    def mark_player_joined(self, game_id, channel_name):
        if game_id not in self.players_connected:
            self.players_connected[game_id] = set()
        self.players_connected[game_id].add(channel_name)

    def both_players_joined(self, game_id):
        return game_id in self.players_connected and len(self.players_connected[game_id]) == 2

    async def send_paddles_update(self, event):
        # Envoi de l'état mis à jour du jeu aux clients
        await self.send(text_data=json.dumps({
            'type': 'paddles_update',  # Indiquer le type de message
            'paddles_state': event['paddles_state']  # Ajouter l'état du jeu
        }))

    async def send_ball_update(self, event):
        # Envoi de l'état mis à jour du jeu aux clients
        await self.send(text_data=json.dumps({
            'type': 'ball_update',  # Indiquer le type de message
            'ball_state': event['ball_state']  # Ajouter l'état du jeu
        }))
        
    def update_ball_position(self):
        # Utilisez l'état de la partie spécifique
        game_state = self.game_states[self.game_id]
        game_state['ball']['z'] += game_state['ball']['dz']

    def get_paddles_state(self):
        if self.game_id in self.game_states:
            game_state = self.game_states[self.game_id]
            return game_state['paddles']
        else:
            # Retourner un état par défaut ou gérer l'erreur
            return {'paddle1': {'x': 5}, 'paddle2': {'x': 0}}

    def get_ball_state(self):
        if self.game_id in self.game_states:
            game_state = self.game_states[self.game_id]
            return game_state['ball']
        else:
            # Retourner un état par défaut ou gérer l'erreur
            return {'ball': {'x': -5, 'z': 0, 'dx': 0, 'dz': 1}}

    
    async def send_game_start(self):

        await self.channel_layer.group_send(
            f'pong_game_{self.game_id}',
            {
                'type': 'game_start',
                'game_id': self.game_id
            }
        )
        print("Game start sent to group.")

    async def game_start(self, event):
        game_id = event['game_id']
        if game_id not in self.game_states:
            self.game_states[game_id] = {
                'paddles': {
                    'paddle1': {'x': 0},
                    'paddle2': {'x': 0}
                },
                'ball': {
                    'x': 0, 'z': 0, 'dx': 0, 'dz': 1
                }
            
        }
        self.game_active = True
        self.game_id = game_id
        asyncio.create_task(self.game_loop())
        await self.send(text_data=json.dumps({
            'type': 'game_start',
            'game_id': event['game_id']
        }))

    async def end_game(self, event):
        # Arrêter la boucle de jeu
        self.game_active = False

