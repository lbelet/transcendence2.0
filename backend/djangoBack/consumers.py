# consumers.py

import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
import json

from djangoBack.models import Match, Player, PongGame, User
from asgiref.sync import sync_to_async, async_to_sync



class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()
        await self.send(text_data=json.dumps({"socket_id": self.channel_name}))
        # await self.channel_layer.group_add("tournament_updates", self.channel_name)

    async def disconnect(self, close_code):
        # await self.channel_layer.group_discard("tournament_updates", self.channel_name)
        # await self.channel_layer.group_discard("tournament_is_full", self.channel_name)


        pass

    async def receive(self, text_data):
        pass  # Traitez les données reçues ici

    async def websocket_send(self, event):
        await self.send(event["text"])

    # async def send_tournament_update(self, event):
    # # Envoie le message à tous les clients WebSocket connectés
    #     print("websocket send tournament")
    #     await self.send(text_data=json.dumps({
    #                 "type": "tournament_update",
    #                 "message": event["message"]
    #             }))
        
    # async def tournament_full(self, event):
    #     print("websocket send tournament full")
    #     await self.send(text_data=json.dumps({
    #                 "type": "tournament_full",
    #                 "message": event["message"]
    #             }))

class GameConsumer(AsyncWebsocketConsumer):

    # tournament_full_sent = False  # Initialisation de la variable de contrôle

    players_connected = {}  # Dictionnaire pour suivre les joueurs connectés
    players_connected_tournament = {}  # Dictionnaire pour suivre les joueurs connectés d'un tournoi
    game_states = {}  # Dictionnaire pour stocker l'état de chaque partie

    async def connect(self):
        await self.accept()
        await self.send(text_data=json.dumps({"game_socket_id": self.channel_name}))

    async def disconnect(self, close_code):
        self.game_active = False
        print('disconnect gamesocket: ', self.channel_name)
        if self.game_id:
            await self.channel_layer.group_discard(
                f'pong_game_{self.game_id}',
                self.channel_name
            )
            await self.channel_layer.group_discard(
                f'tournament_{self.game_id}',
                self.channel_name
            )
            await self.channel_layer.group_discard(
                f'pong_tournament_{self.game_id}',
                self.channel_name
            )

            if self.game_id in self.players_connected_tournament and self.channel_name in self.players_connected_tournament[self.game_id]:
                print(f"User {self.channel_name} was part of the tournament {self.game_id}")
                self.players_connected_tournament[self.game_id].discard(self.channel_name)
                if len(self.players_connected_tournament[self.game_id]) == 0:
                    del self.players_connected_tournament[self.game_id]  # Supprimer l'entrée du dictionnaire si vide
            print("discard ok.........")

    async def game_loop(self):
        while self.game_active:
            print("game loop ok")
            print("groupName: ", f'pong_game_{self.game_id}')
            await self.update_ball_position()
            await self.channel_layer.group_send(
                f'pong_game_{self.game_id}',
                {
                    'type': 'send_ball_update',
                    'ball_state': self.get_ball_state()
                }
            )
            await asyncio.sleep(0.10)

    async def game_loop_tournament(self):
        while self.game_active:
            # print("game loop tournament ok")
            # print("groupName: ", f'tournament_{self.game_id}')
            await self.update_ball_position_tournament()
            await self.channel_layer.group_send(
                f'tournament_{self.game_id}',
                {
                    'type': 'send_ball_update_tournament',
                    'ball_state': self.get_ball_state()
                }
            )
            await asyncio.sleep(0.10)

    async def receive(self, text_data):
        data = json.loads(text_data)
        print("Message reçu dans GameConsumer: ", data)

        if 'game_id' in data:
            print("received game_id............")
            self.game_id = data['game_id']
            await self.channel_layer.group_add(
                f'pong_game_{self.game_id}',
                self.channel_name
            )
            print(
                f"Utilisateur ajouté au groupe: pong_game_{self.game_id}, channel_name: {self.channel_name}")

            await self.send(text_data=json.dumps({
                "status": "added_to_game",
                "game_id": self.game_id
            }))
            self.mark_player_joined(self.game_id, self.channel_name)
            if self.both_players_joined(self.game_id):
                await self.send_game_start()

        if 'tournament_id' in data:
            print("received tournament_id............")
            self.game_id = data['tournament_id']
            await self.channel_layer.group_add(
                f'pong_tournament_{self.game_id}',
                self.channel_name
            )
            print(
                f"Utilisateur ajouté au groupe: pong_tournament_{self.game_id}, channel_name: {self.channel_name}")

            # await self.send(text_data=json.dumps({
            #     "status": "added_to_tournament",
            #     "game_id": self.game_id
            # }))
            self.mark_player_joined_tournament(self.game_id, self.channel_name)
            await self.channel_layer.group_send(
                f'pong_tournament_{self.game_id}',
                {
                    "type": "send_tournament_update",
                    "message": {
                        "tournamentId": self.game_id,
                    },
                }
            )
            await asyncio.sleep(1)  # 1 seconde de pause, ajustez selon le besoin
            
            if self.four_players_joined(self.game_id):
                print("le tournoi est complet")
                # if not GameConsumer.tournament_full_sent:
                print("websocket send tournament full")
                await self.channel_layer.group_send(
                    f'pong_tournament_{self.game_id}',
                    {
                        'type': 'send_tournament_full',
                        'message': 'Veuillez confirmer votre presence'
                    }        
                )
                    # GameConsumer.tournament_full_sent = True
                # else:
                #     print('elseeeeeeee')
        
        # if data.get('type') == 'join_match_channel':
        #     match_id = data['match_id']
        #     self.match_group_name = f"match_{match_id}"
        #     await self.channel_layer.group_add(self.match_group_name, self.channel_name)

        #     # Envoyer confirmation de connexion au groupe de match
        #     await self.send(text_data=json.dumps({
        #         'type': 'match_channel_joined',
        #         'match_id': match_id
        #     }))

        if data.get('type') == 'paddle_move':
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
            await self.channel_layer.group_send(
                f'pong_game_{self.game_id}',
                {
                    'type': 'send_paddles_update',
                    'paddles_state': self.get_paddles_state()
                }
            )
        
        if data.get('type') == 'paddle_move_tournament':
            move_amount = 2  # Ajustez selon les besoins
            game_state = self.game_states[self.game_id]

            if data['action'] == 'move_right_paddle12':
                game_state['paddles']['paddle1']['x'] += move_amount
            elif data['action'] == 'move_left_paddle12':
                game_state['paddles']['paddle1']['x'] -= move_amount
            elif data['action'] == 'move_right_paddle22':
                game_state['paddles']['paddle2']['x'] += move_amount
            elif data['action'] == 'move_left_paddle22':
                game_state['paddles']['paddle2']['x'] -= move_amount
            await self.channel_layer.group_send(
                f'tournament_{self.game_id}',
                {
                    'type': 'send_paddles_update_tournament',
                    'paddles_state': self.get_paddles_state()
                }
            )

    def mark_player_joined(self, game_id, channel_name):
        self.initialize_game_state(game_id)

        print("channel name 2: ", channel_name)

        if self.game_states[game_id]['player1_channel'] is None:
            self.game_states[game_id]['player1_channel'] = channel_name
        elif self.game_states[game_id]['player2_channel'] is None and self.game_states[game_id]['player1_channel'] != channel_name:
            self.game_states[game_id]['player2_channel'] = channel_name

        if game_id not in self.players_connected:
            self.players_connected[game_id] = set()
        self.players_connected[game_id].add(channel_name)

    def both_players_joined(self, game_id):
        return game_id in self.players_connected and len(self.players_connected[game_id]) == 2

    def mark_player_joined_tournament(self, game_id, channel_name):
        # self.initialize_game_state(game_id)

        print("channel name 4: ", channel_name)

        # if self.game_states[game_id]['player1_channel'] is None:
        #     self.game_states[game_id]['player1_channel'] = channel_name
        # elif self.game_states[game_id]['player2_channel'] is None and self.game_states[game_id]['player1_channel'] != channel_name:
        #     self.game_states[game_id]['player2_channel'] = channel_name

        if game_id not in self.players_connected_tournament:
            self.players_connected_tournament[game_id] = set()
        self.players_connected_tournament[game_id].add(channel_name)

    def four_players_joined(self, game_id):
        print("four players")
        return game_id in self.players_connected_tournament and len(self.players_connected_tournament[game_id]) == 4

    # async def send_tournament_full(self, event):
    #     if not GameConsumer.tournament_full_sent:
    #         print("websocket send tournament full")
    #         await self.channel_layer.group_send(
    #             f'pong_tournament_{self.game_id}',
    #             {
    #                 'type': 'tournament_full',
    #                 'message': 'Veuillez confirmer votre presence'
    #             }        
    #         )
    #         GameConsumer.tournament_full_sent = True
    #     else:
    #         print('elseeeeeeee')

    async def send_tournament_full(self, event):
        print("Sending tournament full message to group:", f'pong_tournament_{self.game_id}')
        # Construct the message to be sent to all clients in the group
        message = {
            'type': 'tournament_full',
            'message': 'Le tournoi est complet. Veuillez confirmer votre présence.',
            'tournament_id': self.game_id,  # Inclure l'ID du tournoi ici

        }
        # Convert the message to JSON format and send
        await self.send(text_data=json.dumps(message))



    async def send_paddles_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'paddles_update',  
            'paddles_state': event['paddles_state']
        }))

    async def send_paddles_update_tournament(self, event):
        await self.send(text_data=json.dumps({
            'type': 'paddles_update_tournament',  
            'paddles_state': event['paddles_state']
        }))

    async def send_ball_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'ball_update', 
            'ball_state': event['ball_state']
        }))

    async def send_ball_update_tournament(self, event):
        await self.send(text_data=json.dumps({
            'type': 'ball_update_tournament', 
            'ball_state': event['ball_state']
        }))

    async def update_ball_position(self):
        game_state = self.game_states[self.game_id]
        ball = game_state['ball']['ball']
        paddle1 = game_state['paddles']['paddle1']
        paddle2 = game_state['paddles']['paddle2']

        base_horizontal_speed = 0.5  

        ball['x'] += ball['dx']
        ball['z'] += ball['dz']

        # print('ball z: ', ball['z'])

        if ball['z'] < -15 or ball['z'] > 15:
            print('out')

            if ball['z'] < -15:
                print("AVANT scoreState Player 2: ", game_state['score']['player2'])
                game_state['score']['player2'] += 1
                print("APRES scoreState Player 2: ", game_state['score']['player2'])
            elif ball['z'] > 15:
                print("AVANT scoreState Player 1: ", game_state['score']['player1'])
                game_state['score']['player1'] += 1
                print("APRES scoreState Player 1: ", game_state['score']['player1'])

            print('score send: ', game_state['score'])
            await self.channel_layer.group_send(
                f'pong_game_{self.game_id}',
                {
                    'type': 'send_score_update',
                    'score_state': game_state['score']
                }
            )
            ball['x'], ball['z'] = 0, 0
            ball['dx'], ball['dz'] = 0, 1
            paddle1['x'], paddle2['x'] = 0, 0
            await self.channel_layer.group_send(
                f'pong_game_{self.game_id}',
                {
                    'type': 'send_paddles_update',
                    'paddles_state': self.get_paddles_state()
                }
            )
        else:
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

            if ball['x'] >= 9.8 or ball['x'] <= -9.8:
                ball['dx'] *= -1
        game_state['ball']['ball'] = ball
        game_state['paddles']['paddle1'] = paddle1
        game_state['paddles']['paddle2'] = paddle2
        if game_state['score']['player1'] >= 3 or game_state['score']['player2'] >= 3:
            await self.end_game({'game_id': self.game_id})

    async def update_ball_position_tournament(self):
        game_state = self.game_states[self.game_id]
        ball = game_state['ball']['ball']
        paddle1 = game_state['paddles']['paddle1']
        paddle2 = game_state['paddles']['paddle2']

        base_horizontal_speed = 0.5  

        ball['x'] += ball['dx']
        ball['z'] += ball['dz']

        # print('ball z: ', ball['z'])

        if ball['z'] < -15 or ball['z'] > 15:
            print('out')

            if ball['z'] < -15:
                print("AVANT scoreState Player 2: ", game_state['score']['player2'])
                game_state['score']['player2'] += 1
                print("APRES scoreState Player 2: ", game_state['score']['player2'])
            elif ball['z'] > 15:
                print("AVANT scoreState Player 1: ", game_state['score']['player1'])
                game_state['score']['player1'] += 1
                print("APRES scoreState Player 1: ", game_state['score']['player1'])
                
            print('score send: ', game_state['score'])
            await self.channel_layer.group_send(
                f'tournament_{self.game_id}',
                {
                    'type': 'send_score_update_tournament',
                    'score_state': game_state['score']
                }
            )
            ball['x'], ball['z'] = 0, 0
            ball['dx'], ball['dz'] = 0, 1
            paddle1['x'], paddle2['x'] = 0, 0
            await self.channel_layer.group_send(
                f'tournament_{self.game_id}',
                {
                    'type': 'send_paddles_update_tournament',
                    'paddles_state': self.get_paddles_state()
                }
            )
        else:
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

            if ball['x'] >= 9.8 or ball['x'] <= -9.8:
                ball['dx'] *= -1
        game_state['ball']['ball'] = ball
        game_state['paddles']['paddle1'] = paddle1
        game_state['paddles']['paddle2'] = paddle2
        if game_state['score']['player1'] == 3 or game_state['score']['player2'] == 3:
            await self.end_game_tournament({'game_id': self.game_id})

    def get_paddles_state(self):
        if self.game_id in self.game_states:
            game_state = self.game_states[self.game_id]
            return game_state['paddles']
        else:
            return {'paddle1': {'x': 0}, 'paddle2': {'x': 0}}

    def get_ball_state(self):
        if self.game_id in self.game_states:
            game_state = self.game_states[self.game_id]
            return game_state['ball']
        else:
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
        self.initialize_game_state(game_id)

        # match = await sync_to_async(Match.objects.get)(id=game_id)
        # player_one = match.player_one
        # player_two = match.player_two
        # self.game_states[self.game_id]['player1_channel'] = player_one
        # self.game_states[self.game_id]['player2_channel'] = player_two

        self.game_active = True
        self.game_id = game_id
        asyncio.create_task(self.game_loop())
        await self.send(text_data=json.dumps({
            'type': 'game_start',
            'game_id': event['game_id']
        }))

    async def game_start_tournament(self, event):
        game_id = event['game_id']
        self.initialize_game_state(game_id)

        print("gameState: ", self.game_states)

        self.game_active = True
        self.game_id = game_id

        match = await sync_to_async(Match.objects.get)(id=game_id)

        # Enveloppez les appels pour obtenir les joueurs dans sync_to_async
        player1_id = await sync_to_async(lambda: match.player_one.id)()
        player2_id = await sync_to_async(lambda: match.player_two.id)()

        if self.game_id in self.game_states:
            self.game_states[self.game_id]['player1_channel'] = player1_id
            self.game_states[self.game_id]['player2_channel'] = player2_id

        asyncio.create_task(self.game_loop_tournament())
        await self.send(text_data=json.dumps({
            'type': 'game_start_tournament',
            'game_id': event['game_id']
        }))

    async def send_game_start_tournament_final(self, event):
        game_id = event['game_id']
        self.initialize_game_state(game_id)

        print("gameState: ", self.game_states)

        self.game_active = True
        self.game_id = game_id

        match = await sync_to_async(Match.objects.get)(id=game_id)

        # Enveloppez les appels pour obtenir les joueurs dans sync_to_async
        player1_id = await sync_to_async(lambda: match.player_one.id)()
        player2_id = await sync_to_async(lambda: match.player_two.id)()

        if self.game_id in self.game_states:
            self.game_states[self.game_id]['player1_channel'] = player1_id
            self.game_states[self.game_id]['player2_channel'] = player2_id

        asyncio.create_task(self.game_loop_tournament())
        await self.send(text_data=json.dumps({
            'type': 'game_start_tournament_final',
            'game_id': event['game_id']
        }))

    async def send_players_roles(self, event):
        player_one_username = event['player_one_username']
        player_two_username = event['player_two_username']
        await self.send(text_data=json.dumps({
            "type": "player_roles",
            "player_one_username": player_one_username,
            "player_two_username": player_two_username
        }))

    async def send_score_update(self, event):
        print('sendScoreUpdate: ', event['score_state'])
        await self.send(text_data=json.dumps({
            'type': 'score_update',
            'score_state': event['score_state']
        }))

    async def send_score_update_tournament(self, event):
        print('sendScoreUpdate: ', event['score_state'])
        await self.send(text_data=json.dumps({
            'type': 'score_update_tournament',
            'score_state': event['score_state']
        }))

    async def send_game_over(self, event):
        await self.send(text_data=json.dumps({
            'type': 'game_over',
        }))

    async def send_game_over_tournament(self, event):
        winner_id = event.get('winner', None)  # Obtenez l'ID du gagnant, ou None si non présent
        await self.send(text_data=json.dumps({
            'type': 'game_over_tournament',
            'winner_id': winner_id
        }))


    async def send_game_start_final(self, event):
        await self.send(text_data=json.dumps({
            'type': 'game_start_final',
            'game_id': event['game_id']
        }))

    async def end_game(self, event):
        print('end game ok')

        score_player_one = self.game_states[self.game_id]['score']['player1']
        score_player_two = self.game_states[self.game_id]['score']['player2']
        game_state = self.game_states[self.game_id]
        winner_channel_name = game_state['player1_channel'] if score_player_one > score_player_two else game_state['player2_channel']

        await self.update_game_in_database(self.game_id, score_player_one, score_player_two, winner_channel_name)
        if self.game_id in self.game_states:
            self.game_states[self.game_id]['score']['player1'] = 0
            self.game_states[self.game_id]['score']['player2'] = 0
            await self.channel_layer.group_send(
                f'pong_game_{self.game_id}',
                {
                    'type': 'send_score_update',
                    'score_state': self.game_states[self.game_id]['score']
                }
            ) 
        self.game_active = False
        await self.channel_layer.group_send(
            f'pong_game_{self.game_id}',
            {
                'type': 'send_game_over',
            }
        )

    async def end_game_tournament(self, event):
        print('end game tournament ok')

        print("LE GAME ID est : ", self.game_id)

        score_player_one = self.game_states[self.game_id]['score']['player1']
        score_player_two = self.game_states[self.game_id]['score']['player2']
        game_state = self.game_states[self.game_id]
        winner_channel_name = game_state['player1_channel'] if score_player_one > score_player_two else game_state['player2_channel']

        await self.update_game_in_database_tournament(self.game_id, score_player_one, score_player_two, winner_channel_name)
        if self.game_id in self.game_states:
            self.game_states[self.game_id]['score']['player1'] = 0
            self.game_states[self.game_id]['score']['player2'] = 0
            await self.channel_layer.group_send(
                f'tournament_{self.game_id}',
                {
                    'type': 'send_score_update_tournament',
                    'score_state': self.game_states[self.game_id]['score'],
                    'player1_state': self.game_states[self.game_id]['player1_channel'],
                    'player2_state': self.game_states[self.game_id]['player2_channel']
                }
            ) 
        self.game_active = False
        print('is active ? ', self.game_active)
        await self.channel_layer.group_send(
            f'tournament_{self.game_id}',
            {
                'type': 'send_game_over_tournament',
                'winner': winner_channel_name,
            }
        )

        game_id = self.game_id
        print("game id = ", game_id)
        current_match = await sync_to_async(lambda: Match.objects.get(id=game_id))()
        if current_match.round == 'Semifinal':
            print("c etait une demi-finale.....")
            await self.handle_final_match(self.game_id)

        # current_match_id  = self.game_id

        # current_match = await sync_to_async(lambda: Match.objects.get(id=current_match_id))()
        # print("current_match:....", current_match)
        #     # Obtenez l'ID du tournoi
        # tournament_id = current_match.tournament.id
        # print("tournament_id:.......", tournament_id)
        # # Obtenez l'objet Match final de manière asynchrone
        # final_match = await sync_to_async(lambda: Match.objects.filter(tournament__id=tournament_id, round='Final').first())()
        # print("final_match:........", final_match)
        # # Vérifiez si final_match existe et si les conditions sont remplies pour commencer la finale
        # if final_match:
        #     player_one_id = await sync_to_async(lambda: final_match.player_one.id if final_match.player_one else None)()
        #     player_two_id = await sync_to_async(lambda: final_match.player_two.id if final_match.player_two else None)()
        #     winner_id = await sync_to_async(lambda: final_match.winner.id if final_match.winner else None)()

        #     if player_one_id and player_two_id and not winner_id:
        #         # Créer un groupe de canaux pour la finale
        #         final_group_name = f"tournament_final_{final_match.id}"
        #         await self.channel_layer.group_add(final_group_name, player_one_id)
        #         await self.channel_layer.group_add(final_group_name, player_two_id)

        #         print("ajouter a la finale......................")

        #         # Envoyer un message pour démarrer la finale
        #         await self.channel_layer.group_send(
        #             final_group_name,
        #             {
        #                 'type': 'game_start_final',
        #                 'game_id': final_match.id
        #             }
        #         )
    async def handle_final_match(self, game_id):
        await sync_to_async(self._handle_final_match)(game_id)

    def _handle_final_match(self, game_id):
        try:
            match = Match.objects.get(id=game_id)
            print("le match est :.......", match)
            final_match = Match.objects.filter(tournament=match.tournament, round='Final').first()
            print("la finale est :......", final_match, "avec l id:...", final_match.id)
            if final_match and final_match.player_one and final_match.player_two and not final_match.winner:
            # Créer un groupe de canaux pour la finale
                # tournament_id = final_match.tournament.id

                final_group_name = f"tournament_{final_match.id}"
                async_to_sync(self.channel_layer.group_add)(final_group_name, final_match.player_one.user.game_socket_id)
                async_to_sync(self.channel_layer.group_add)(final_group_name, final_match.player_two.user.game_socket_id)

                if final_match.player_one.user.game_socket_id and final_match.player_two.user.game_socket_id:
                        # Envoyer les rôles des joueurs
                    async_to_sync(self.channel_layer.group_send)(
                        final_group_name,
                        {
                            "type": "send_players_roles",
                            "game_id": final_match.id,
                            "player_one_username": final_match.player_one.user.username,
                            "player_two_username": final_match.player_two.user.username
                        }
                    )

                    async_to_sync(self.channel_layer.group_send)(
                        final_group_name,
                        {
                            'type': 'send_game_start_tournament_final',
                            'game_id': final_match.id
                        }
                    )
        except Exception as e:
            print(f"Erreur lors de la gestion de la finale : {e}")


    async def update_game_in_database(self, game_id, score_player_one, score_player_two, winner_channel_name):
        await sync_to_async(self._update_game_in_database)(game_id, score_player_one, score_player_two, winner_channel_name)


    def _update_game_in_database(self, game_id, score_player_one, score_player_two, winner_channel_name):
        try:
            game = PongGame.objects.get(id=game_id)
            game.score_player_one = score_player_one
            game.score_player_two = score_player_two
            # Vérifier si le gagnant a déjà été déterminé pour ce jeu
            if winner_channel_name and not game.winner:
                winner_user = User.objects.get(game_socket_id=winner_channel_name)
                game.winner = winner_user

                # Mise à jour du nombre de victoires seulement si le gagnant vient d'être déterminé
                winner_user.won_game += 1
                winner_user.save()

            game.status = 'complete'
            game.save()
        except User.DoesNotExist:
            print(f"User with game_socket_id {winner_channel_name} not found")
        except PongGame.DoesNotExist:
            print(f"PongGame with id {game_id} not found")
        except Exception as e:
            print(f"Erreur lors de l'enregistrement : {e}")

    async def update_game_in_database_tournament(self, game_id, score_player_one, score_player_two, winner_channel_name):
        await sync_to_async(self._update_game_in_database_tournament)(game_id, score_player_one, score_player_two, winner_channel_name)


    def _update_game_in_database_tournament(self, game_id, score_player_one, score_player_two, winner_channel_name):
        try:
            match = Match.objects.get(id=game_id)
            match.score_player_one = score_player_one
            match.score_player_two = score_player_two

            print("le winner est: ", winner_channel_name)

            # Vérifier si le gagnant a déjà été déterminé pour ce jeu
            if winner_channel_name and not match.winner:
                print("dans le if")
                winner_user = User.objects.get(id=winner_channel_name)
                winner_player = Player.objects.get(user=winner_user)
                match.winner = winner_player

                # Mise à jour du nombre de victoires seulement si le gagnant vient d'être déterminé
                winner_user.won_game += 1
                winner_user.save()

                if match.round == 'Semifinal':
                    final_match = Match.objects.filter(tournament=match.tournament, round='Final').first()
                    if final_match:
                        if not final_match.player_one:
                            final_match.player_one = winner_player
                        elif not final_match.player_two:
                            final_match.player_two = winner_player
                        final_match.save()

            match.save()
        except User.DoesNotExist:
            print(f"User with game_socket_id {winner_channel_name} not found")
        except Player.DoesNotExist:
            print(f"Player for User with game_socket_id {winner_channel_name} not found")
        except Match.DoesNotExist:
            print(f"Match with id {game_id} not found")
        except Exception as e:
            print(f"Erreur lors de l'enregistrement : {e}")



    def initialize_game_state(self, game_id):
        if game_id not in self.game_states:
            self.game_states[game_id] = {
                'player1_channel': None,
                'player2_channel': None,
                'paddles': {'paddle1': {'x': 0}, 'paddle2': {'x': 0}},
                'ball': {'ball': {'x': 0, 'z': 0, 'dx': 0, 'dz': 1}},
                'score': {'player1': 0, 'player2': 0}
            }
        else:
            # Ajoutez ici la logique pour compléter ou mettre à jour l'état si nécessaire
            pass

    async def send_tournament_update(self, event):
        # Envoie le message à tous les clients WebSocket connectés
        print("websocket send tournament update")
        await self.send(text_data=json.dumps({
                    "type": "tournament_update",
                    "tournamentId": event["message"]["tournamentId"],
                }))
        
    async def send_tournament_deleted(self, event):
        # Vous pouvez personnaliser le message ici si nécessaire
        # Envoyez le message personnalisé au client WebSocket
        await self.send(text_data=json.dumps({
            'type': 'tournament_deleted'
        }))
