# Standard library imports
from django.db.models import Q
import json
from django.http import JsonResponse
from django.shortcuts import render
from django.contrib.auth import authenticate, update_session_auth_hash
from django.views.decorators.csrf import csrf_exempt
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.contrib.auth import get_user_model

from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync


# Third-party imports
import pyotp
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.db.models import Q
# Importez directement les modèles nécessaires
from djangoBack.models import User, PongGame
from djangoBack import settings

# Local application imports
from djangoBack.models import Player, Tournament, User, FriendRequest, PongGame, Match, TournamentParticipation
from djangoBack.helpers import (
    get_tokens_for_user, send_two_factor_email, generate_qr_code,
    retrieve_stored_2fa_code
)

# from django.db.models import F


# import time


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_token(request):
    # Si le code atteint ce point, le token est valide
    return JsonResponse({"message": "Token valide"})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def join_game_queue(request):
    # Récupérer l'utilisateur actuel
    current_user = request.user
    current_user.status = User.IN_GAME
    current_user.save()

    game_socket_id = request.data.get('game_socket_id')

    # Chercher une partie en attente
    game_waiting = PongGame.objects.filter(status='waiting').first()

    if game_waiting:
        # S'il y a déjà une partie en attente, ajouter l'utilisateur actuel comme joueur deux
        game_waiting.player_two = current_user
        game_waiting.player_two_socket_id = game_socket_id
        game_waiting.status = 'playing'
        game_waiting.save()

        return JsonResponse({'message': 'Partie en cours', 'game_id': game_waiting.id, 'status': 'playing', 'player_role': 2})
    else:
        # S'il n'y a pas de partie en attente, créer une nouvelle partie
        new_game = PongGame.objects.create(
            player_one=current_user,
            player_one_socket_id=game_socket_id,
            status='waiting'
        )

        return JsonResponse({'message': 'Vous êtes en file d attente pour une nouvelle partie', 'game_id': new_game.id, 'player_role': 1})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_nbre_games(request):
    user = request.user

    try:
        # Incrémenter le nombre de jeux
        user.nbre_games += 1
        user.save()
        return JsonResponse({'status': 'success', 'message': 'Nombre de jeux mis à jour avec succès.', 'nbre_games': user.nbre_games})
    except Exception as e:
        # En cas d'erreur, retourner une réponse JSON avec les détails de l'erreur
        return JsonResponse({'status': 'error', 'message': 'Erreur lors de la mise à jour du nombre de jeux.'}, status=500)


@api_view(['POST'])
@csrf_exempt
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
@csrf_exempt
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
        # Construction de l'URL en HTTPS si nécessaire
        avatar_url = request.build_absolute_uri(user.avatar.url)
        if request.is_secure():
            avatar_url = avatar_url.replace('http://', 'https://')
    else:
        # URL de l'avatar par défaut
        avatar_url = request.build_absolute_uri(
            settings.MEDIA_URL + 'avatars/default.png')
        if request.is_secure():
            avatar_url = avatar_url.replace('http://', 'https://')
    return JsonResponse({'avatarUrl': avatar_url})


@csrf_exempt
def register(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST method is accepted'}, status=405)

    # Use Django's request.POST and request.FILES for form data and file uploads
    username = request.POST.get('username')
    first_name = request.POST.get('first_name')
    last_name = request.POST.get('last_name')
    email = request.POST.get('email')
    password = request.POST.get('password')
    avatar = request.FILES.get('avatar')  # Access the uploaded file

    if not all([username, first_name, last_name, email, password]):
        return JsonResponse({'error': 'All fields are required'}, status=400)

    try:
        user = User.objects.create_user(
            username=username,
            first_name=first_name,
            last_name=last_name,
            email=email,
            password=password
        )
        # Save avatar if provided
        if avatar:
            # Save the file under 'avatars/username/filename'
            file_path = f'avatars/{username}/{avatar.name}'
            saved_path = default_storage.save(
                file_path, ContentFile(avatar.read()))
            user.avatar = saved_path  # Link the saved file path to the user's avatar field
            user.save()

        return JsonResponse({'success': 'User created successfully'}, status=201)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
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
        # Ajouter la langue de l'utilisateur à la réponse
        tokens['language'] = user.language
        return JsonResponse(tokens, status=200)

    return JsonResponse({'error': 'Invalid username or password'}, status=400)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_user(request):
    data = json.loads(request.body)
    two_factor_method = data.get('twoFactorMethod')
    language = data.get('language', 'fr')  # Default to English if not provided
    email = data.get('email')
    username = data.get('username')
    firstname = data.get('firstname')

    old_password = data.get('oldPassword')
    new_password = data.get('newPassword')

    user = request.user
    user.two_factor_method = two_factor_method
    user.language = language  # Update the user's language preference
    if email:
        user.email = email
    if username:
        user.username = username
    if firstname:
        user.first_name = firstname

    if old_password and new_password:
        # Vérifiez d'abord que l'ancien mot de passe est correct
        if not user.check_password(old_password):
            return JsonResponse({'error': 'L’ancien mot de passe est incorrect'}, status=400)

        # Mettre à jour vers le nouveau mot de passe
        user.set_password(new_password)
        # user.save()

        # Mettez à jour la session d'authentification pour ne pas déconnecter l'utilisateur
        update_session_auth_hash(request, user)

        # Vous pouvez ajouter une réponse pour indiquer la réussite de la mise à jour du mot de passe
        return JsonResponse({'success': 'Mot de passe mis à jour avec succès'}, status=200)

    if two_factor_method == 'qr':
        if not user.totp_secret:
            user.totp_secret = pyotp.random_base32()
        user.is_two_factor_enabled = True
        user.save()

        qr_code_img = generate_qr_code(user)
        return JsonResponse({'success': 'Profile updated successfully', 'qr_code_data': qr_code_img}, status=200)

    elif two_factor_method == 'email':
        user.is_two_factor_enabled = True
        user.save()

        # send_two_factor_email(user.email, user)
        return JsonResponse({'success': 'Profile updated successfully'}, status=200)

    else:
        user.is_two_factor_enabled = False
        user.save()
        return JsonResponse({'success': 'Two-factor authentication disabled'}, status=200)


@csrf_exempt
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
                return JsonResponse(tokens, status=200)
            else:
                return JsonResponse({'error': 'Invalid 2FA code'}, status=400)
        elif user.two_factor_method == 'qr':
            totp = pyotp.TOTP(user.totp_secret)
            if totp.verify(two_factor_code):
                tokens = get_tokens_for_user(user)
                return JsonResponse(tokens, status=200)
            else:
                return JsonResponse({'error': 'Invalid QR code'}, status=400)

    return JsonResponse({'error': '2FA is not enabled for this user'}, status=400)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_users(request):
    query = request.GET.get('username', '')
    User = get_user_model()
    users = User.objects.filter(username__icontains=query)

    users_data = []
    for user in users:
        user_data = {
            'id': user.id,
            'username': user.username,
            'avatarUrl': request.build_absolute_uri(user.avatar.url) if user.avatar else None,
            'nbreGames': user.nbre_games,
            'victories': user.won_game
        }
        users_data.append(user_data)

    return JsonResponse(users_data, safe=False)


@api_view(['POST'])
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
            return JsonResponse({'error': 'Une demande d\'ami existe déjà'}, status=400)

        # Créer la demande d'ami
        friend_request = FriendRequest.objects.create(
            sender=request.user, receiver=receiver)

        # Envoyer la notification WebSocket
        send_friend_request_notification(
            receiver.id, friend_request.id, request.user.username)

        return JsonResponse({'message': 'Demande d\'ami envoyée avec succès'}, status=200)
    except User.DoesNotExist:
        return JsonResponse({'error': 'Utilisateur non trouvé'}, status=404)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_pending_friend_requests(request):
    pending_requests = FriendRequest.objects.filter(
        receiver=request.user, is_accepted=False)
    requests_data = [{
        'id': fr.id,
        'sender': fr.sender.username,
        # Ajoutez d'autres informations si nécessaire
    } for fr in pending_requests]

    return JsonResponse(requests_data, safe=False)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def accept_friend_request(request, request_id):
    try:
        friend_request = FriendRequest.objects.get(
            id=request_id, receiver=request.user)
        friend_request.is_accepted = True
        friend_request.save()

        # Ajouter les amis dans la table User
        request.user.friends.add(friend_request.sender)
        friend_request.sender.friends.add(request.user)

        return JsonResponse({'message': 'Demande d\'ami acceptée'}, status=200)
    except FriendRequest.DoesNotExist:
        return JsonResponse({'error': 'Demande d\'ami non trouvée'}, status=404)


@api_view(['POST'])
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
        'avatarUrl': request.build_absolute_uri(friend.avatar.url) if friend.avatar else None,
        'status': friend.status,
        'nbreGames': friend.nbre_games,
        'victories': friend.won_game,
        # Assurez-vous que cela reflète ce que vous souhaitez envoyer
        'recent_games': games_data
    } for friend in friends]

    return JsonResponse(friends_data, safe=False)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_logout(request):
    user = request.user
    user.status = User.OFFLINE
    user.socket_id = "NONE"
    user.game_socket_id = "NONE"
    user.save()

    # Vérifier et supprimer une partie de Pong en attente si nécessaire
    game_to_delete = PongGame.objects.filter(
        status='waiting',
        player_one=user,
        player_two__isnull=True
    ).first()

    if game_to_delete:
        game_to_delete.delete()

    return JsonResponse({'message': 'Déconnexion réussie'}, status=200)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_inGame(request):
    user = request.user
    user.status = User.IN_GAME
    user.save()

    return JsonResponse({'message': 'en jeu réussie'}, status=200)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_outGame(request):
    user = request.user
    user.status = User.ONLINE
    user.game_socket_id = "NONE"
    user.save()

    # Récupérer l'ID de la partie de la requête
    game_id = request.data.get('game_id')
    group_name = f'pong_game_{game_id}'

    # Envoyer un message au groupe pour arrêter la partie
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        group_name,
        {
            'type': 'end_game',  # Vous devrez gérer ce type dans GameConsumer
            'game_id': game_id
        }
    )
    return JsonResponse({'message': 'quitter le jeu réussie'}, status=200)


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
        pass  # L'utilisateur destinataire n'existe pas ou n'est pas connecté

    # from django.http import JsonResponse


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_language(request):
    user = request.user
    data = json.loads(request.body)

    language = data.get('language')
    if language:
        user.language = language
        user.save()
        return JsonResponse({'success': 'Language updated successfully'}, status=200)
    else:
        return JsonResponse({'error': 'No language provided'}, status=400)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_tournament(request):
    # Récupérer les données de la requête
    name = request.data.get('name')
    number_of_players = int(request.data.get('number_of_players'))
    start_date_option = request.data.get('start_date_option')
    specific_start_date = request.data.get('specific_start_date')

    # Valider les données
    if not all([name, number_of_players, start_date_option]):
        return JsonResponse({'error': 'Missing required fields'}, status=400)

    # Gérer l'option de la date de début
    start_date = None
    if start_date_option == 'specificTime' and specific_start_date:
        start_date = specific_start_date

    try:
        with transaction.atomic():  # S'assurer que toutes les opérations sont atomiques
            tournament = Tournament.objects.create(
                name=name,
                number_of_players=number_of_players,
                start_date=start_date
            )

            # Créer les matches initiaux pour le tournoi selon le nombre de joueurs
            if number_of_players == 4:
                # Créer les demi-finales et la finale
                for i in range(1, 3):
                    Match.objects.create(
                        tournament=tournament, round="Demi-finale")
                Match.objects.create(tournament=tournament, round="Finale")
            elif number_of_players == 8:
                # Créer les quarts de finale, les demi-finales et la finale
                for i in range(1, 5):
                    Match.objects.create(
                        tournament=tournament, round="Quart de finale")
                for i in range(1, 3):
                    Match.objects.create(
                        tournament=tournament, round="Demi-finale")
                Match.objects.create(tournament=tournament, round="Finale")
            elif number_of_players == 16:
                # Créer les huitièmes de finale, les quarts de finale, les demi-finales et la finale
                for i in range(1, 9):
                    Match.objects.create(
                        tournament=tournament, round="Huitième de finale")
                for i in range(1, 5):
                    Match.objects.create(
                        tournament=tournament, round="Quart de finale")
                for i in range(1, 3):
                    Match.objects.create(
                        tournament=tournament, round="Demi-finale")
                Match.objects.create(tournament=tournament, round="Finale")

            return JsonResponse({'success': 'Tournament created successfully', 'tournament_id': tournament.id}, status=201)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def register_to_tournament(request, tournament_id):
    try:
        tournament = Tournament.objects.get(id=tournament_id)
        player, created = Player.objects.get_or_create(user=request.user)

        # Vérifier si le tournoi a atteint son nombre maximum de joueurs
        if tournament.participants.count() > tournament.number_of_players:
            return JsonResponse({'error': 'Le tournoi est complet'}, status=400)

        print("player:..........", player)
        tournament.participants.add(player)
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
        print("nbre participant = ", tournament.participants_count)

        if tournament.participants_count == tournament.number_of_players:
            channel_layer = get_channel_layer()
            for participant in tournament.participants.all():
                if participant.user.socket_id:  # Assurez-vous que l'utilisateur a un ID de socket valide
                    async_to_sync(channel_layer.send)(participant.user.socket_id, {
                        "type": "websocket.send",
                        "text": json.dumps({
                            "type": "tournament_full",
                            "message": f"Le tournoi '{tournament.name}' est maintenant complet. Confirmez votre participation.",
                            "tournament_id": tournament.id
                        })
                    })

        return JsonResponse({'message': 'Inscription réussie', 'current_participants': tournament.participants.count()}, status=200)
    except Tournament.DoesNotExist:
        return JsonResponse({'error': 'Tournoi non trouvé'}, status=404)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def unregister_from_tournament(request, tournament_id):
    try:
        tournament = Tournament.objects.get(id=tournament_id)
        player = Player.objects.get(user=request.user)

        # Vérifier si le tournoi a atteint son nombre maximum de joueurs
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
        tournaments = Tournament.objects.filter(
            is_active=True).prefetch_related('participants__user')
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
                    # Ajoutez d'autres détails du joueur si nécessaire
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
        if not tournament:
            return JsonResponse({'error': 'Tournoi non trouvé'}, status=404)

        data = {
            'id': tournament.id,
            'name': tournament.name,
            'start_date': tournament.start_date,
            'number_of_players': tournament.number_of_players,
            'current_participants': tournament.participants.count(),
            'participants': [
                {
                    'id': player.id,
                    'username': player.user.username,
                    # Ajoutez d'autres détails du joueur si nécessaire
                }
                for player in tournament.participants.all()
            ],
            # ...
        }

        return JsonResponse(data, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
    
@api_view(['POST'])
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

        # Vérifier si tous les joueurs du tournoi sont prêts
        all_ready = all(participant.is_ready for participant in TournamentParticipation.objects.filter(tournament=tournament))
        
        if all_ready:
            print("all Ready")
            # Tous les joueurs sont prêts, remplir les matches et démarrer le tournoi
            fill_tournament_matches(tournament)
            # !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! idee de genie
            return JsonResponse({'message': 'all ready'}, status=200)


        return JsonResponse({'message': 'Statut Ready mis à jour avec succès'}, status=200)
    except Tournament.DoesNotExist:
        return JsonResponse({'error': 'Tournoi non trouvé'}, status=404)
    except Player.DoesNotExist:
        return JsonResponse({'error': 'Joueur non trouvé'}, status=404)
    except TournamentParticipation.DoesNotExist:
        return JsonResponse({'error': 'Participation au tournoi non trouvée'}, status=404)


def fill_tournament_matches(tournament):
    print("Remplissage des matches pour le tournoi:", tournament.name)

    # Récupérer les participations des joueurs qui sont prêts
    ready_participations = TournamentParticipation.objects.filter(
        tournament=tournament, 
        is_ready=True
    ).order_by('id')

    ready_players = [participation.player for participation in ready_participations]

    # Récupérer les matches du tournoi
    matches = list(tournament.matches.order_by('id'))

    print("nbre de joueurs prets: ", len(ready_players))
    print("nbre de matches a remplir: ", len(matches))
    # Vérifier s'il y a suffisamment de joueurs prêts pour remplir les matches
    # if len(ready_players) < len(matches) * 2:
    #     print("Pas assez de joueurs prêts pour remplir les matches")
    #     return

    # Attribuer les joueurs aux matches
    player_iterator = iter(ready_players)
    for match in matches:
        try:
            match.player_one = next(player_iterator)
            match.player_two = next(player_iterator)
            match.save()

            group_name = f"pong_game_{match.id}"
            print("groupNAME in views: ", group_name)
            channel_layer = get_channel_layer()
            
            # Ajouter les ID de socket des joueurs à ce groupe
            if match.player_one.user.game_socket_id:
                async_to_sync(channel_layer.group_add)(group_name, match.player_one.user.game_socket_id)
                print("player1, match: ", match.player_one.user.get_username(), match.id)
            if match.player_two.user.game_socket_id:
                async_to_sync(channel_layer.group_add)(group_name, match.player_two.user.game_socket_id)
                print("player2, match: ",match.player_two.user.get_username(), match.id)
            
            if match.player_one.user.game_socket_id and match.player_two.user.game_socket_id:
                    # Envoyer les rôles des joueurs
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
                    "type": "game_start_tournament",
                    "game_id": match.id
                }
            )

        except StopIteration:
            break

    print("Matches du tournoi remplis avec succès")


    # Marquez le tournoi comme commencé
    # tournament.is_active = True
    # tournament.save()

    
# @api_view(['GET'])
# @permission_classes([IsAuthenticated])
# def startTournament(request, tournament_id):
#     try:
#         tournament = Tournament.objects.get(id=tournament_id)

#         # Vérifier si tous les joueurs sont prêts
#         if not all(participant.is_ready for participant in tournament.participants.all()):
#             return JsonResponse({'error': 'Tous les joueurs ne sont pas prêts'}, status=400)

#         # Récupérer tous les participants prêts dans l'ordre de leur inscription
#         ready_players = tournament.participants.filter(is_ready=True).order_by('id')

#         # Remplir les matches avec les joueurs
#         for match in tournament.matches.filter(player_one__isnull=True, player_two__isnull=True):
#             if ready_players.exists():
#                 match.player_one = ready_players.first()
#                 ready_players = ready_players[1:]
#             if ready_players.exists():
#                 match.player_two = ready_players.first()
#                 ready_players = ready_players[1:]
#             match.save()

#         return JsonResponse({'message': 'Le tournoi a commencé avec succès'}, status=200)
#     except Tournament.DoesNotExist:
#         return JsonResponse({'error': 'Tournoi non trouvé'}, status=404)



