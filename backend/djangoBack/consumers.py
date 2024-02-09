
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
import json

from djangoBack.models import Match, Player, PongGame, User
from asgiref.sync import sync_to_async, async_to_sync



class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()
        await self.send(text_data=json.dumps({"socket_id": self.channel_name}))
    

    async def disconnect(self, close_code):


        pass

    async def receive(self, text_data):
        pass 
    async def websocket_send(self, event):
        await self.send(event["text"])


class GameConsumer(AsyncWebsocketConsumer):

    players_connected = {} 
    players_connected_tournament = {}
    game_states = {}
    received_responses_per_tournament = {}

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
                    del self.players_connected_tournament[self.game_id]
            print("discard ok.........")

    async def game_loop(self):
        while self.game_active:
            print("game loop ok")
            print("groupName: ", f'pong_game_{self.game_id}')
            await self.update_ball_position()
            print('game_active_loop?', self.game_active)
            await self.channel_layer.group_send(
                f'pong_game_{self.game_id}',
                {
                    'type': 'send_ball_update',
                    'ball_state': self.get_ball_state()
                }
            )
            await asyncio.sleep(0.10)
        print('game loop ended!!!!!!!!!!!!!!!!!!!')

    async def game_loop_tournament(self):
        while self.game_active:
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
            await asyncio.sleep(1)

            if self.four_players_joined(self.game_id):
                print("le tournoi est complet")
                print("websocket send tournament full")
                await self.channel_layer.group_send(
                    f'pong_tournament_{self.game_id}',
                    {
                        'type': 'send_tournament_full',
                        'message': 'Veuillez confirmer votre presence'
                    }
                )

        if data.get('type') == 'paddle_move':
            move_amount = 2
            game_state = self.game_states[self.game_id]

            if data['action'] == 'move_right_paddle1':
                if game_state['paddles']['paddle1']['x'] == 10:
                    game_state['paddles']['paddle1']['x'] = game_state['paddles']['paddle1']['x']
                else:
                    game_state['paddles']['paddle1']['x'] += move_amount
            elif data['action'] == 'move_left_paddle1':
                if game_state['paddles']['paddle1']['x'] == -10:
                    game_state['paddles']['paddle1']['x'] = game_state['paddles']['paddle1']['x']
                else:
                    game_state['paddles']['paddle1']['x'] -= move_amount
            elif data['action'] == 'move_right_paddle2':
                if game_state['paddles']['paddle2']['x'] == 10:
                    game_state['paddles']['paddle2']['x'] = game_state['paddles']['paddle2']['x']
                else:
                    game_state['paddles']['paddle2']['x'] += move_amount            
            elif data['action'] == 'move_left_paddle2':
                if game_state['paddles']['paddle2']['x'] == -10:
                    game_state['paddles']['paddle2']['x'] = game_state['paddles']['paddle2']['x']
                else:
                    game_state['paddles']['paddle2']['x'] -= move_amount
            await self.channel_layer.group_send(
                f'pong_game_{self.game_id}',
                {
                    'type': 'send_paddles_update',
                    'paddles_state': self.get_paddles_state()
                }
            )

        if data.get('type') == 'paddle_move_tournament':
            move_amount = 2
            game_state = self.game_states[self.game_id]

            if data['action'] == 'move_right_paddle12':
                if game_state['paddles']['paddle1']['x'] == 10 or game_state['paddles']['paddle1']['x'] == -10:
                    game_state['paddles']['paddle1']['x'] = game_state['paddles']['paddle1']['x']
                else:
                    game_state['paddles']['paddle1']['x'] += move_amount
            elif data['action'] == 'move_left_paddle12':
                if game_state['paddles']['paddle1']['x'] == 10 or game_state['paddles']['paddle1']['x'] == -10:
                    game_state['paddles']['paddle1']['x'] = game_state['paddles']['paddle1']['x']
                else:
                    game_state['paddles']['paddle1']['x'] -= move_amount
            elif data['action'] == 'move_right_paddle22':
                if game_state['paddles']['paddle2']['x'] == 10 or game_state['paddles']['paddle2']['x'] == -10:
                    game_state['paddles']['paddle2']['x'] = game_state['paddles']['paddle2']['x']
                else:
                    game_state['paddles']['paddle2']['x'] += move_amount            
            elif data['action'] == 'move_left_paddle22':
                if game_state['paddles']['paddle2']['x'] == 10 or game_state['paddles']['paddle2']['x'] == -10:
                    game_state['paddles']['paddle2']['x'] = game_state['paddles']['paddle2']['x']
                else:
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

        print("channel name 4: ", channel_name)

        if game_id not in self.players_connected_tournament:
            self.players_connected_tournament[game_id] = set()
        self.players_connected_tournament[game_id].add(channel_name)

    def four_players_joined(self, game_id):
        print("four players")
        return game_id in self.players_connected_tournament and len(self.players_connected_tournament[game_id]) == 4

    async def send_tournament_full(self, event):
        print("Sending tournament full message to group:", f'pong_tournament_{self.game_id}')
        message = {
            'type': 'tournament_full',
            'message': 'Le tournoi est complet. Veuillez confirmer votre présence.',
            'tournament_id': self.game_id,

        }
        await self.send(text_data=json.dumps(message))



    async def send_paddles_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'paddles_update',
            'paddles_state': event['paddles_state']
        }))

    async def send_ping(self, event):
        await self.send(text_data=json.dumps({
            'type': 'ping',
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
                if abs(ball['z'] - z_position) < 1: 
                    distance_x = ball['x'] - paddle['x']
                    if abs(distance_x) < 3: 
                        ball['dz'] *= -1  

                        if distance_x < -1: 
                            ball['dx'] = -base_horizontal_speed
                        elif distance_x > 1:
                            ball['dx'] = base_horizontal_speed
                        else:
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
                if abs(ball['z'] - z_position) < 1:
                    distance_x = ball['x'] - paddle['x']
                    if abs(distance_x) < 3:
                        ball['dz'] *= -1

                        if distance_x < -1:
                            ball['dx'] = -base_horizontal_speed
                        elif distance_x > 1: 
                            ball['dx'] = base_horizontal_speed
                        else:
                            ball['dx'] = 0

            if ball['x'] >= 9.8 or ball['x'] <= -9.8:
                ball['dx'] *= -1
        game_state['ball']['ball'] = ball
        game_state['paddles']['paddle1'] = paddle1
        game_state['paddles']['paddle2'] = paddle2
        if game_state['score']['player1'] >= 3 or game_state['score']['player2'] >= 3:
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

        self.game_active = True
        self.game_id = game_id
        asyncio.create_task(self.game_loop())
        await self.send(text_data=json.dumps({
            'type': 'game_start',
            'game_id': event['game_id']
        }))

    async def send_game_start_tournament(self, event):
        game_id = event['game_id']
        self.initialize_game_state(game_id)

        print("gameState: ", self.game_states)

        self.game_active = True
        self.game_id = game_id

        match = await sync_to_async(Match.objects.get)(id=game_id)

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
        winner_id = event.get('winner', None)
        await self.send(text_data=json.dumps({
            'type': 'game_over',
            'scores': self.game_states[self.game_id]['score'],
            'winner_id': winner_id
        }))

    async def send_game_over_tournament(self, event):
        winner_id = event.get('winner', None)
        await self.send(text_data=json.dumps({
            'type': 'game_over_tournament',
            'winner_id': winner_id,
            'round': event.get('round', None)
        }))


    async def send_game_start_final(self, event):
        await self.send(text_data=json.dumps({
            'type': 'game_start_final',
            'game_id': event['game_id']
        }))

    async def end_game(self, event):
        print('end game ok')

        await self.update_game_in_database()
        if self.game_id in self.game_states:
            await self.channel_layer.group_send(
                f'pong_game_{self.game_id}',
                {
                    'type': 'send_score_update',
                    'score_state': self.game_states[self.game_id]['score']
                }
            )
        self.game_active = False
        print('game_active?', self.game_active)
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

        await self.update_game_in_database_tournament()
        if self.game_id in self.game_states:
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
        game_id = self.game_id
        print("game id = ", game_id)
        current_match = await sync_to_async(lambda: Match.objects.get(id=game_id))()
        winner_user_id = await sync_to_async(lambda: Player.objects.get(id=winner_channel_name).user.id)()
        await self.channel_layer.group_send(
            f'tournament_{self.game_id}',
            {
                'type': 'send_game_over_tournament',
                'winner': winner_user_id,
                'round': current_match.round
            }
        )

        if current_match.round == 'Semifinal':
            print("c etait une demi-finale.....")
            await self.handle_final_match(self.game_id)


    async def handle_final_match(self, game_id):
        await sync_to_async(self._handle_final_match)(game_id)

    def _handle_final_match(self, game_id):
        try:
            match = Match.objects.get(id=game_id)
            print("le match est :.......", match)
            final_match = Match.objects.filter(tournament=match.tournament, round='Final').first()
            print("la finale est :......", final_match, "avec l id:...", final_match.id)
            if final_match and final_match.player_one and final_match.player_two and not final_match.winner:


                final_group_name = f"tournament_{final_match.id}"
                async_to_sync(self.channel_layer.group_add)(final_group_name, final_match.player_one.user.game_socket_id)
                async_to_sync(self.channel_layer.group_add)(final_group_name, final_match.player_two.user.game_socket_id)

                if final_match.player_one.user.game_socket_id and final_match.player_two.user.game_socket_id:
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


    async def update_game_in_database(self):
        await sync_to_async(self._update_game_in_database)()


    def _update_game_in_database(self):
        try:
            game = PongGame.objects.get(id=self.game_id)
            game_state = self.game_states[self.game_id]
            
            game.score_player_one = game_state['score']['player1']
            game.score_player_two = game_state['score']['player2']
            print('scores:', game.score_player_one, game.score_player_two)
            
            user_p1 = User.objects.get(game_socket_id=game_state['player1_channel'])
            user_p2 = User.objects.get(game_socket_id=game_state['player2_channel'])
            user_p1.status = User.ONLINE
            user_p2.status = User.ONLINE
            if not game.winner:
                winner_user = user_p1 if game.score_player_one > game.score_player_two else user_p2
                game.winner = winner_user
                winner_user.won_game += 1
            user_p1.save()
            user_p2.save()

            game.status = 'complete'
            game.save()
            game.refresh_from_db()
        except User.DoesNotExist:
            print(f"User with game_socket_id not found")
        except PongGame.DoesNotExist:
            print(f"PongGame with id {self.game_id} not found")
        except Exception as e:
            print(f"Erreur lors de l'enregistrement : {e}")

    async def update_game_in_database_tournament(self):
        await sync_to_async(self._update_game_in_database_tournament)()


    def _update_game_in_database_tournament(self):
        try:
            game = Match.objects.get(id=self.game_id)
            game_state = self.game_states[self.game_id]

            game.score_player_one = game_state['score']['player1']
            game.score_player_two = game_state['score']['player2']
            print('scores:', game.score_player_one, game.score_player_two)

            player_1 = Player.objects.get(id=game_state['player1_channel'])
            player_2 = Player.objects.get(id=game_state['player2_channel'])
            player_1.user.status = User.ONLINE
            player_2.user.status = User.ONLINE
            if not game.winner:
                winner_player = player_1 if game.score_player_one > game.score_player_two else player_2
                winner_player.user.won_game += 1
                game.winner = winner_player

                if game.round == 'Semifinal':
                    final_match = Match.objects.filter(tournament=game.tournament, round='Final').first()
                    if final_match:
                        if not final_match.player_one:
                            final_match.player_one = winner_player
                        elif not final_match.player_two:
                            final_match.player_two = winner_player
                        final_match.save()
            player_1.user.save()
            player_2.user.save()

            game.save()
        except User.DoesNotExist:
            print(f"User with game_socket_id not found")
        except Player.DoesNotExist:
            print(f"Player for User with game_socket_id not found")
        except Match.DoesNotExist:
            print(f"Match with id {self.game_id} not found")
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
            pass

    async def send_tournament_update(self, event):
        print("websocket send tournament update")
        await self.send(text_data=json.dumps({
                    "type": "tournament_update",
                    "tournamentId": event["message"]["tournamentId"],
                }))

    async def send_tournament_deleted(self, event):
        await self.send(text_data=json.dumps({
            'type': 'tournament_deleted'
        }))
