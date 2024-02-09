# Standard library imports
from django.db.models import Q
import json
from django.forms import ValidationError
from django.http import JsonResponse
from django.shortcuts import render
from django.contrib.auth import authenticate, update_session_auth_hash
from django.views.decorators.csrf import csrf_exempt
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.contrib.auth import get_user_model
from django.views.decorators.csrf import csrf_protect

from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync


# Third-party imports
import pyotp
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.db import IntegrityError, transaction
from django.db.models import Q
# Importez directement les modèles nécessaires
from djangoBack.models import User, PongGame
from djangoBack import settings

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

# Local application imports
from djangoBack.models import Player, Tournament, User, FriendRequest, PongGame, Match, TournamentParticipation
from djangoBack.helpers import (
    get_tokens_for_user, send_two_factor_email, generate_qr_code,
    retrieve_stored_2fa_code
)

import logging
from django.middleware.csrf import get_token


# At the top of your file
logger = logging.getLogger(__name__)
# from django.db.models import F

@api_view(['GET'])
@csrf_exempt
def health_check(request):
    return JsonResponse({"status": "healthy"})

@api_view(['GET'])
def get_csrf_token(request):
    csrf_token = get_token(request)
    return JsonResponse({'csrf_token': csrf_token})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_games_history(request):
    users_data = []
    for user in User.objects.all():
        games = PongGame.objects.filter(player_one=user) | PongGame.objects.filter(player_two=user)
        games_data = [{
            "opponent": game.player_two.username if game.player_one == user else game.player_one.username,
            "result": "win" if game.winner == user else "lose",
            "date": game.date.strftime('%Y-%m-%d %H:%M:%S') if game.date else 'Date not available'
        } for game in games]
        users_data.append({"username": user.username, "games": games_data})
    return JsonResponse(users_data, safe=False)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def game_info(request, game_id):
    game = PongGame.objects.get(id=game_id)
    print('game_info', game)
    data = {
            "players": [game.player_one.username, game.player_two.username],
            "winner": game.winner.username,
            "score": [game.score_player_one, game.score_player_two]
        }
    return JsonResponse(data, safe=False)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_game_players(request, game_id):
    try:
        game = PongGame.objects.get(id=game_id)
        data = {
            'player_one': game.player_one.username if game.player_one else "En attente",
            'player_two': game.player_two.username if game.player_two else "En attente"
        }
        return JsonResponse(data)
    except PongGame.DoesNotExist:
        return JsonResponse({'error': 'Jeu non trouvé'}, status=404)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_game_players_tournament(request, game_id):
    try:
        match = Match.objects.get(id=game_id)
        data = {
            'player_one': match.player_one.nick_name if match.player_one else "En attente",
            'player_two': match.player_two.nick_name if match.player_two else "En attente"
        }
        return JsonResponse(data)
    except PongGame.DoesNotExist:
        return JsonResponse({'error': 'Jeu non trouvé'}, status=404)

@api_view(['POST'])
@csrf_protect
@permission_classes([IsAuthenticated])
def verify_token(request):
    return JsonResponse({"message": "Token valide"})

@api_view(['GET'])
@csrf_exempt
def check_user_exists(request):
    username = request.GET.get('username', None)
    email = request.GET.get('email', None)

    if username and User.objects.filter(username=username).exists():
        return JsonResponse({'exists': True, 'type': 'username'})

    if email and User.objects.filter(email=email).exists():
        return JsonResponse({'exists': True, 'type': 'email'})

    return JsonResponse({'exists': False})


@api_view(['POST'])
@csrf_protect
@permission_classes([IsAuthenticated])
def join_game_queue(request):
    current_user = request.user
    game_waiting = PongGame.objects.filter(status='waiting').first()
    if game_waiting:
        if game_waiting.player_one == current_user:
            return JsonResponse({'error': 'Vous ne pouvez pas jouer contre vous-même'}, status=200)

    current_user.status = User.IN_GAME
    current_user.save()

    game_socket_id = request.data.get('game_socket_id')

    if game_waiting:
        game_waiting.player_two = current_user
        game_waiting.player_two_socket_id = game_socket_id
        game_waiting.status = 'playing'
        game_waiting.save()

        return JsonResponse({'message': 'Partie en cours', 'game_id': game_waiting.id, 'status': 'playing', 'player_role': 2})
    else:
        new_game = PongGame.objects.create(
            player_one=current_user,
            player_one_socket_id=game_socket_id,
            status='waiting'
        )

        return JsonResponse({'message': 'waitingRoomAccess', 'game_id': new_game.id, 'player_role': 1})


@api_view(['POST'])
@csrf_protect
@permission_classes([IsAuthenticated])
def join_tournament_queue(request):
    current_user = request.user
    current_user.status = User.IN_GAME
    current_user.save()

    return JsonResponse({'message': 'tournament_in'})


@api_view(['POST'])
@csrf_protect
@permission_classes([IsAuthenticated])
def update_nbre_games(request):
    user = request.user

    try:
        user.nbre_games += 1
        user.save()
        return JsonResponse({'status': 'success', 'message': 'Nombre de jeux mis à jour avec succès.', 'nbre_games': user.nbre_games})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': 'Erreur lors de la mise à jour du nombre de jeux.'}, status=500)


@api_view(['POST'])
@csrf_protect
@permission_classes([IsAuthenticated])
def update_socket_id(request):
    user = request.user
    socket_id = request.data.get('socket_id')
    if socket_id:
        user.socket_id = socket_id
        user.save()
        return JsonResponse({'status': 'success', 'message': 'Socket ID updated successfully.'})
    else:
        return JsonResponse({'status': 'error', 'message': 'No socket ID provided.'})


@api_view(['POST'])
@csrf_protect
@permission_classes([IsAuthenticated])
def update_GameSocket_id(request):
    user = request.user
    game_socket_id = request.data.get('game_socket_id')
    if game_socket_id:
        user.game_socket_id = game_socket_id
        user.save()
        return JsonResponse({'status': 'success', 'message': 'Game Socket ID updated successfully.'})
    else:
        return JsonResponse({'status': 'error', 'message': 'No  game socket ID provided.'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_avatar(request):
    user = request.user
    if user.avatar:
        avatar_url = 'https://' + request.get_host() + user.avatar.url
    else:
        avatar_url = 'https://' + request.get_host() + settings.MEDIA_URL + 'avatars/default.png'
    return JsonResponse({'avatarUrl': avatar_url})


@csrf_protect
def register(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST method is accepted'}, status=405)

    username = request.POST.get('username')
    first_name = request.POST.get('first_name')
    last_name = request.POST.get('last_name')
    email = request.POST.get('email')
    password = request.POST.get('password')
    avatar = request.FILES.get('avatar')

    if not all([username, first_name, last_name, email, password]):
        return JsonResponse({'error': 'All fields are required'}, status=409)

    if (User.objects.filter(username=username).exists()) or (User.objects.filter(email=email)) :
        return JsonResponse({'error': 'Username or email already exists'}, status=409)

    try:
        user = User.objects.create_user(
            username=username,
            first_name=first_name,
            last_name=last_name,
            email=email,
            password=password
        )
        if avatar:
            file_path = f'avatars/{username}/{avatar.name}'
            saved_path = default_storage.save(file_path, ContentFile(avatar.read()))
            user.avatar = saved_path
            user.save()

        return JsonResponse({'success': 'User created successfully'}, status=201)
    except IntegrityError:
        return JsonResponse({'error': 'A database error occurred. User could not be created.'}, status=400)
    except ValidationError as e:
        return JsonResponse({'error': str(e.messages)}, status=409)
    except Exception as e:
        return JsonResponse({'error': 'An unexpected error occurred'}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_nickname_exists(request, nickName):
    logger.info(nickName)

    User = get_user_model()

    if nickName == request.user.username:
        return JsonResponse({'exists': False})

    nickname_exists = Player.objects.filter(nick_name=nickName).exists()

    username_exists = User.objects.exclude(id=request.user.id).filter(username=nickName).exists()

    exists = nickname_exists or username_exists

    return JsonResponse({'exists': exists})


@csrf_protect
def api_login(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST method is accepted'}, status=405)

    data = json.loads(request.body)
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return JsonResponse({'error': 'Username and password are required'}, status=400)

    user = authenticate(username=username, password=password)
    if user:
        user.status = User.ONLINE
        user.save()

        if user.is_two_factor_enabled:
            if user.two_factor_method == 'email':
                send_two_factor_email(user.email, user)
                return JsonResponse({'2fa_required': True, '2fa_method': 'email'})
            elif user.two_factor_method == 'qr':
                qr_code_img = generate_qr_code(user)
                return JsonResponse({'2fa_required': True, '2fa_method': 'qr', 'qr_code_img': qr_code_img})

        tokens = get_tokens_for_user(user)
        tokens['language'] = user.language
        tokens['login_successful'] = True
        tokens['avatar_url'] = 'https://' + request.get_host() + user.avatar.url if user.avatar else 'https://' + request.get_host() + settings.MEDIA_URL + 'avatars/default.png',
        tokens['id'] = user.id
        return JsonResponse(tokens, status=200)

    return JsonResponse({'login_successful': False, 'message': 'Nom d utilisateur ou mot de passe incorrect. Veuillez réessayer.'}, status=200)

@api_view(['POST'])
@csrf_protect
@permission_classes([IsAuthenticated])
def update_user(request):
    two_factor_method = request.data.get('twoFactorMethod')
    language = request.data.get('language', 'fr')
    email = request.data.get('email')
    username = request.data.get('username')
    firstname = request.data.get('firstname')
    old_password = request.data.get('oldPassword')
    new_password = request.data.get('newPassword')
    avatar = request.FILES.get('avatar')

    print("le vieux mot de passe est: ", old_password)
    print("la langue dans le back est: ", language)

    user = request.user
    user.two_factor_method = two_factor_method
    user.language = language 
    if email:
        if email and User.objects.filter(email=email).exclude(id=user.id).exists():
            return JsonResponse({'message': 'Message test'}, status=200)
        user.email = email
    if username:
        if username and User.objects.filter(username=username).exclude(id=user.id).exists():
            return JsonResponse({'message': 'Message test'}, status=200)
        user.username = username
    if firstname:
        user.first_name = firstname

    if new_password and not old_password:
        return JsonResponse({'message': 'Message test'}, status=200)
    if old_password and not new_password:
        return JsonResponse({'message': 'Message test'}, status=200)
    if old_password and new_password:
        if not user.check_password(old_password):
            return JsonResponse({'message': 'Message test'}, status=200)
        user.set_password(new_password)
        user.save()
        update_session_auth_hash(request, user)  

    if avatar:
        file_path = f'avatars/{username}/{avatar.name}'
        saved_path = default_storage.save(file_path, ContentFile(avatar.read()))
        user.avatar = saved_path
        user.save()

    if two_factor_method == 'qr':
        if not user.totp_secret:
            user.totp_secret = pyotp.random_base32()
        user.is_two_factor_enabled = True
        user.save()

        qr_code_img = generate_qr_code(user)

    elif two_factor_method == 'email':
        user.is_two_factor_enabled = True
        user.save()


    else:
        user.is_two_factor_enabled = False
        user.save()

    return JsonResponse({'success': 'Profil mis à jour avec succès', 'language': language}, status=200)


@csrf_protect
def verify_two_factor_code(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST method is accepted'}, status=405)

    data = json.loads(request.body)
    username = data.get('username')
    two_factor_code = data.get('two_factor_code')

    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return JsonResponse({'error': 'Invalid username'}, status=400)

    if user.is_two_factor_enabled:
        if user.two_factor_method == 'email':
            stored_code = retrieve_stored_2fa_code(user)
            if two_factor_code == stored_code:
                tokens = get_tokens_for_user(user)
                tokens['language'] = user.language
                tokens['login_successful'] = True
                tokens['avatar_url'] = 'https://' + request.get_host() + user.avatar.url if user.avatar else 'https://' + request.get_host() + settings.MEDIA_URL + 'avatars/default.png',
                tokens['id'] = user.id
                return JsonResponse(tokens, status=200)
            else:
                return JsonResponse({'error': 'Invalid 2FA code'}, status=200)
        elif user.two_factor_method == 'qr':
            totp = pyotp.TOTP(user.totp_secret)
            if totp.verify(two_factor_code):
                tokens = get_tokens_for_user(user)
                tokens['language'] = user.language
                tokens['login_successful'] = True
                tokens['avatar_url'] = 'https://' + request.get_host() + user.avatar.url if user.avatar else 'https://' + request.get_host() + settings.MEDIA_URL + 'avatars/default.png',
                tokens['id'] = user.id
                return JsonResponse(tokens, status=200)
            else:
                return JsonResponse({'error': 'Invalid QR code'}, status=200)

    return JsonResponse({'error': '2FA is not enabled for this user'}, status=200)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_users(request):
    query = request.GET.get('username', '')
    User = get_user_model()
    users = User.objects.filter(username__icontains=query).exclude(id=request.user.id)  

    users_data = []
    for user in users:
        friend_request_sent = FriendRequest.objects.filter(sender=request.user, receiver=user, is_accepted=False).exists()
        friend_request_received = FriendRequest.objects.filter(sender=user, receiver=request.user, is_accepted=False).exists()
        is_friend = request.user.friends.filter(id=user.id).exists()

        friend_status = "none"
        if friend_request_sent:
            friend_status = "envoyée"
        elif friend_request_received:
            friend_status = "reçue"
        elif is_friend:
            friend_status = "ami"

        user_data = {
            'id': user.id,
            'username': user.username,
            'avatarUrl': ('https://' + request.get_host() + user.avatar.url) if user.avatar else None,
            'nbreGames': user.nbre_games,
            'victories': user.won_game,
            'friendStatus': friend_status,
        }
        users_data.append(user_data)

    return JsonResponse(users_data, safe=False)


@api_view(['POST'])
@csrf_protect
@permission_classes([IsAuthenticated])
def send_friend_request(request):
    receiver_username = request.data.get('receiver_username')
    User = get_user_model()
    try:
        receiver = User.objects.get(username=receiver_username)

        if FriendRequest.objects.filter(
            Q(sender=request.user, receiver=receiver) |
            Q(sender=receiver, receiver=request.user)
        ).exists():
            return JsonResponse({'success': False, 'message': 'Une demande d\'ami existe déjà pour: '})

        friend_request = FriendRequest.objects.create(
            sender=request.user, receiver=receiver)

        send_friend_request_notification(
            receiver.id, friend_request.id, request.user.username)

        return JsonResponse({'success': True, 'message': 'Demande d\'ami envoyée avec succès'})
    except User.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Utilisateur non trouvé'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_pending_friend_requests(request):
    pending_requests = FriendRequest.objects.filter(
        receiver=request.user, is_accepted=False)
    requests_data = [{
        'id': fr.id,
        'sender': fr.sender.username,
    } for fr in pending_requests]

    return JsonResponse(requests_data, safe=False)


@api_view(['POST'])
@csrf_protect
@permission_classes([IsAuthenticated])
def accept_friend_request(request, request_id):
    try:
        friend_request = FriendRequest.objects.get(
            id=request_id, receiver=request.user)
        friend_request.is_accepted = True
        friend_request.save()

        request.user.friends.add(friend_request.sender)
        friend_request.sender.friends.add(request.user)

        return JsonResponse({'message': 'Demande d\'ami acceptée'}, status=200)
    except FriendRequest.DoesNotExist:
        return JsonResponse({'error': 'Demande d\'ami non trouvée'}, status=404)


@api_view(['POST'])
@csrf_protect
@permission_classes([IsAuthenticated])
def decline_friend_request(request, request_id):
    try:
        friend_request = FriendRequest.objects.get(
            id=request_id, receiver=request.user)
        friend_request.delete()

        return JsonResponse({'message': 'Demande d\'ami refusée'}, status=200)
    except FriendRequest.DoesNotExist:
        return JsonResponse({'error': 'Demande d\'ami non trouvée'}, status=404)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_friends(request):
    user = request.user
    friends = user.friends.all()

    games_played = PongGame.objects.filter(
        Q(player_one=user) | Q(player_two=user))

    games_data = []
    for game in games_played:
        if game.player_one == user:
            opponent = game.player_two
            user_score = game.score_player_one
            opponent_score = game.score_player_two
        else:
            opponent = game.player_one
            user_score = game.score_player_two
            opponent_score = game.score_player_one

        games_data.append({
            'date': game.date.strftime('%d-%m-%Y'),
            'opponent_username': opponent.username if opponent else 'Unknown',
            'user_score': user_score,
            'opponent_score': opponent_score,
        })

    friends_data = [{
        'username': friend.username,
        'avatarUrl': ('https://' + request.get_host() + friend.avatar.url) if friend.avatar else None,
        'status': friend.status,
        'nbreGames': friend.nbre_games,
        'victories': friend.won_game,
        'recent_games': games_data
    } for friend in friends]

    return JsonResponse(friends_data, safe=False)


@api_view(['POST'])
@csrf_protect
@permission_classes([IsAuthenticated])
def api_logout(request):
    user = request.user
    user.status = User.OFFLINE
    user.socket_id = "NONE"
    user.game_socket_id = "NONE"
    user.save()

    game_to_delete = PongGame.objects.filter(
        status='waiting',
        player_one=user,
        player_two__isnull=True
    ).first()

    if game_to_delete:
        game_to_delete.delete()

    return JsonResponse({'message': 'Déconnexion réussie'}, status=200)


@api_view(['POST'])
@csrf_protect
@permission_classes([IsAuthenticated])
def api_inGame(request):
    user = request.user
    user.status = User.IN_GAME
    user.save()

    return JsonResponse({'message': 'en jeu réussie'}, status=200)


@api_view(['POST'])
@csrf_protect
@permission_classes([IsAuthenticated])
def api_outGame(request):
    user = request.user
    user.status = User.ONLINE
    user.game_socket_id = "NONE"
    user.save()

    game_id = request.data.get('game_id')
    group_name = f'pong_game_{game_id}'

    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        group_name,
        {
            'type': 'end_game',  
            'game_id': game_id
        }
    )
    return JsonResponse({'message': 'quitter le jeu réussie'}, status=200)

@api_view(['POST'])
@csrf_protect
@permission_classes([IsAuthenticated])
def api_outGame_tournament(request):
    user = request.user
    user.status = User.ONLINE
    user.game_socket_id = "NONE"
    user.save()

    game_id = request.data.get('game_id')
    group_name = f'tournament_{game_id}'

    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        group_name,
        {
            'type': 'end_game_tournament',
            'game_id': game_id
        }
    )
    return JsonResponse({'message': 'quitter le tournoi réussie'}, status=200)


def index(request):
    return render(request, 'index.html')


def send_friend_request_notification(receiver_user_id, request_id, sender_username):
    User = get_user_model()
    try:
        receiver_user = User.objects.get(id=receiver_user_id)
        if receiver_user.socket_id:
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.send)(receiver_user.socket_id, {
                "type": "websocket.send",
                "text": json.dumps({
                    'type': 'friend_request',
                    'request_id': request_id,
                    'sender': sender_username
                })
            })
    except User.DoesNotExist:
        pass 


@api_view(['POST'])
@csrf_protect
@permission_classes([IsAuthenticated])
def update_language(request):
    data = request.data
    print("data update: ", data)
    user = request.user

    language = data.get('language')
    if language:
        user.language = language
        user.save()
        return JsonResponse({'success': 'Language updated successfully'}, status=200)
    else:
        return JsonResponse({'error': 'No language provided'}, status=400)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_tournament_exists(request, tournament_name):
    logger.info(tournament_name)
    exists = Tournament.objects.filter(name=tournament_name).exists()
    return JsonResponse({'exists': exists})

@api_view(['POST'])
@csrf_protect
@permission_classes([IsAuthenticated])
def create_tournament(request):
    name = request.data.get('name')
    number_of_players = int(request.data.get('number_of_players'))
    start_date_option = request.data.get('start_date_option')
    specific_start_date = request.data.get('specific_start_date')

    if not all([name, number_of_players, start_date_option]):
        return JsonResponse({'error': 'Missing required fields'}, status=400)

    start_date = None
    if start_date_option == 'specificTime' and specific_start_date:
        start_date = specific_start_date

    try:
        with transaction.atomic():
            tournament = Tournament.objects.create(
                name=name,
                number_of_players=number_of_players,
                start_date=start_date
            )
            if number_of_players == 4:
                for i in range(1, 3):
                    Match.objects.create(
                        tournament=tournament, round="Semifinal")
                Match.objects.create(tournament=tournament, round="Final")
            return JsonResponse({'success': 'Tournament created successfully', 'tournament_id': tournament.id}, status=201)
    except IntegrityError as e:
            if 'tournament_name_key' in str(e):
                return JsonResponse({'error': 'A tournament with this name already exists'}, status=400)
            else:
                return JsonResponse({'error': 'An error occurred while creating the tournament'}, status=500)

    except Exception as e:
        logger.error('Error creating tournament', exc_info=True)
        return JsonResponse({'error': str(e)}, status=500)


@api_view(['POST'])
@csrf_protect
@permission_classes([IsAuthenticated])
def register_to_tournament(request, tournament_id):
    
    nickname = request.data.get('nickname', '').strip()
    if not nickname:
        nickname = request.user.username 

    try:
        tournament = Tournament.objects.get(id=tournament_id)
        tournament = Tournament.objects.get(id=tournament_id)
        player, created = Player.objects.get_or_create(user=request.user, defaults={'nick_name': nickname})
        if not created and nickname:
            player.nick_name = nickname
            player.save()

        current_user = request.user
        current_user.status = User.IN_GAME
        current_user.save()
        if tournament.participants.count() > tournament.number_of_players:
            return JsonResponse({'error': 'Le tournoi est complet'}, status=400)

        print("player:..........", player)
        tournament.participants.add(player)
        tournament.participants_count = tournament.participants.count()
        tournament.save()

     
        print("nbre participant = ", tournament.participants_count)

        if tournament.participants_count > tournament.number_of_players:
            return({'message': 'Too late sry'})

        else:
            print("on est dans le else pour :", f'pong_tournament_{tournament_id}')

        return JsonResponse({'message': 'Inscription réussie', 'tournament_id': tournament.id, 'tournamentName': tournament.name, 'username': request.user.username, 'current_participants': tournament.participants.count()}, status=200)
    except Tournament.DoesNotExist:
        return JsonResponse({'error': 'Tournoi non trouvé'}, status=404)


@api_view(['POST'])
@csrf_protect
@permission_classes([IsAuthenticated])
def unregister_from_tournament(request, tournament_id):
    try:
        tournament = Tournament.objects.get(id=tournament_id)
        player = Player.objects.get(user=request.user)

        if tournament.participants.count() >= tournament.number_of_players:
            return JsonResponse({'error': 'Le tournoi est complet'}, status=400)

        print("player unregister:..........", player)
        tournament.participants.remove(player)
        tournament.participants_count = tournament.participants.count()
        tournament.save()

        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            "tournament_updates",
            {
                "type": "tournament_update",
                "message": {
                    "name": tournament.name,
                    "tournament_id": tournament.id,
                    "username": request.user.username,
                    "current_participants": tournament.participants.count(),
                },
            }
        )

        return JsonResponse({'message': 'Inscription réussie', 'current_participants': tournament.participants.count()}, status=200)
    except Tournament.DoesNotExist:
        return JsonResponse({'error': 'Tournoi non trouvé'}, status=404)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def available_tournaments(request):
    try:
        tournaments = Tournament.objects.filter().prefetch_related('participants__user')
        data = [{
            'id': tournament.id,
            'name': tournament.name,
            'start_date': tournament.start_date,
            'number_of_players': tournament.number_of_players,
            'current_participants': tournament.participants.count(),
            'participants': [
                {
                    'id': player.id,
                    'username': player.user.username,
                }
                for player in tournament.participants.all()
            ],
            # ...
        } for tournament in tournaments]

        return JsonResponse(data, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def tournament_details(request, tournament_id):
    try:
        tournament = Tournament.objects.filter(
            id=tournament_id).prefetch_related('participants__user').first()
        print("tournament: ", tournament)
        if not tournament:
            return JsonResponse({'error': 'Tournoi non trouvé'}, status=404)

        final_match = Match.objects.filter(tournament=tournament, round='Final').first()
        print("final match: ", final_match)
        data = {
            'id': tournament.id,
            'name': tournament.name,
            'start_date': tournament.start_date,
            'number_of_players': tournament.number_of_players,
            'current_participants': tournament.participants.count(),
            'participants': [
                {
                    'id': player.id,
                    'username': player.nick_name,
                }
                for player in tournament.participants.all()
            ],
            'final_players': [
                {'id': final_match.player_one.id, 'username': final_match.player_one.nick_name} if final_match and final_match.player_one else {},
                {'id': final_match.player_two.id, 'username': final_match.player_two.nick_name} if final_match and final_match.player_two else {},
            ],

            'final_winner': final_match.winner.nick_name if final_match and final_match.winner else None,
            # ...
        }

        return JsonResponse(data, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@api_view(['POST'])
@csrf_protect
@permission_classes([IsAuthenticated])
def set_player_ready(request, tournament_id):
    try:
        print("inside setPlayerReady")
        player = Player.objects.get(user=request.user)
        tournament = Tournament.objects.get(id=tournament_id)
        participation = TournamentParticipation.objects.get(player=player, tournament=tournament)

        # Mettre à jour le statut 'is_ready' du joueur dans le tournoi
        participation.is_ready = True
        participation.save()

        all_ready = all(participant.is_ready for participant in TournamentParticipation.objects.filter(tournament=tournament))

        if all_ready:
            print("all Ready")
            fill_tournament_matches(tournament)
            tournament.is_active = False
            tournament.save()
            return JsonResponse({'message': 'all ready'}, status=200)


        return JsonResponse({'message': 'Statut Ready mis à jour avec succès'}, status=200)
    except Tournament.DoesNotExist:
        return JsonResponse({'error': 'Tournoi non trouvé'}, status=404)
    except Player.DoesNotExist:
        return JsonResponse({'error': 'Joueur non trouvé'}, status=404)
    except TournamentParticipation.DoesNotExist:
        return JsonResponse({'error': 'Participation au tournoi non trouvée'}, status=404)

@api_view(['DELETE'])
@csrf_protect
@permission_classes([IsAuthenticated])
def delete_tournament(request, tournament_id):
    try:
        print("Inside delete_tournament")
        tournament = Tournament.objects.get(id=tournament_id)
        send_delete_tournament(tournament_id)

        tournament.delete()

        return JsonResponse({'message': 'Tournament deleted'}, status=200)
    except Tournament.DoesNotExist:
        return JsonResponse({'message': 'Tournoi non trouvé'}, status=200)

def send_delete_tournament(tournament_id):
    channel_layer = get_channel_layer()

    group_name = f'pong_tournament_{tournament_id}'

    message_data = {
        'type': 'send_tournament_deleted',
    }

    async_to_sync(channel_layer.group_send)(group_name, message_data)



def fill_tournament_matches(tournament):
    print("Remplissage des matches pour le tournoi:", tournament.name)

    ready_participations = TournamentParticipation.objects.filter(
        tournament=tournament,
        is_ready=True
    ).order_by('id')

    ready_players = [participation.player for participation in ready_participations]
    matches = list(tournament.matches.order_by('id'))

    print("nbre de joueurs prets: ", len(ready_players))
    print("nbre de matches a remplir: ", len(matches))

    if len(ready_players) == 4:
        round_type = 'Semifinal'
    elif len(ready_players) == 2:
        round_type = 'Final'
    else:
        print("Nombre de joueurs ou de matches inattendu")
        return

    player_iterator = iter(ready_players)
    for match in matches:
        if match.round == round_type:
            print("roundType: ", round_type)
            try:
                match.player_one = next(player_iterator)
                match.player_two = next(player_iterator)
                match.save()
                group_name = f"tournament_{match.id}"
                print("groupNAME in views: ", group_name)
                channel_layer = get_channel_layer()

                if match.player_one.user.game_socket_id:
                    async_to_sync(channel_layer.group_add)(group_name, match.player_one.user.game_socket_id)
                    print("player1, match: ", match.player_one.user.get_username(), match.id)
                if match.player_two.user.game_socket_id:
                    async_to_sync(channel_layer.group_add)(group_name, match.player_two.user.game_socket_id)
                    print("player2, match: ",match.player_two.user.get_username(), match.id)

                if match.player_one.user.game_socket_id and match.player_two.user.game_socket_id:
                    async_to_sync(channel_layer.group_send)(
                        group_name,
                        {
                            "type": "send_players_roles",
                            "game_id": match.id,
                            "player_one_username": match.player_one.user.username,
                            "player_two_username": match.player_two.user.username
                        }
                    )

                if match.player_one.user.game_socket_id and match.player_two.user.game_socket_id:
                    print("send gameStart to: ", group_name)
                    async_to_sync(channel_layer.group_send)(
                        group_name,
                    {
                        "type": "send_game_start_tournament",
                        "game_id": match.id
                    }
                )

            except StopIteration:
                break

    print("Matches du tournoi remplis avec succès")
