# consumers.py

import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
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
        game_state = self.game_states[self.game_id]
        ball = game_state['ball']['ball']
        paddle1 = game_state['paddles']['paddle1']
        paddle2 = game_state['paddles']['paddle2']

        # Vitesse horizontale de base lorsque la balle touche les côtés de la raquette
        base_horizontal_speed = 0.5  # Ajustez cette valeur selon vos besoins

        # Mettre à jour la position de la balle
        ball['x'] += ball['dx']
        ball['z'] += ball['dz']

        # Vérifier les collisions avec les raquettes
        paddles_positions = [(paddle1, -14), (paddle2, 14)]
        for paddle, z_position in paddles_positions:
            if abs(ball['z'] - z_position) < 1:  # Seuil de collision
                distance_x = ball['x'] - paddle['x']
                if abs(distance_x) < 3:  # Largeur de la raquette est 6, donc 3 de chaque côté
                    ball['dz'] *= -1  # Inverser la direction verticale

                    # Ajuster la direction horizontale selon la zone de collision
                    if distance_x < -1:  # Tiers gauche
                        ball['dx'] = -base_horizontal_speed
                    elif distance_x > 1:  # Tiers droit
                        ball['dx'] = base_horizontal_speed
                    else:  # Tiers central
                        ball['dx'] = 0

        # Vérifier les collisions avec les murs
        if ball['x'] >= 9.8 or ball['x'] <= -9.8:
            ball['dx'] *= -1  # Inverser la direction horizontale

        # Mettre à jour l'état de la balle dans le dictionnaire de l'état du jeu
        game_state['ball']['ball'] = ball



    def get_paddles_state(self):
        if self.game_id in self.game_states:
            game_state = self.game_states[self.game_id]
            return game_state['paddles']
        else:
            # Retourner un état par défaut ou gérer l'erreur
            return {'paddle1': {'x': 0}, 'paddle2': {'x': 0}}

    def get_ball_state(self):
        if self.game_id in self.game_states:
            game_state = self.game_states[self.game_id]
            return game_state['ball']
        else:
            # Retourner un état par défaut ou gérer l'erreur
            return {'ball': {'x': 0, 'z': 0, 'dx': 0, 'dz': 0.2}}

    
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
                    'ball': {'x': 0, 'z': 0, 'dx': 0, 'dz': 1}
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

