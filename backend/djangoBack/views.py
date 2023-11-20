# Standard library imports
from django.db.models import Q
import json
from django.http import JsonResponse
from django.shortcuts import render
from django.contrib.auth import authenticate
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
from djangoBack import settings

# Local application imports
from djangoBack.models import User, FriendRequest, PongGame
from djangoBack.helpers import (
    get_tokens_for_user, send_two_factor_email, generate_qr_code,
    retrieve_stored_2fa_code
)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def join_game_queue(request):
    # Récupérer l'utilisateur actuel
    current_user = request.user

    game_socket_id = request.data.get('game_socket_id')


    # Chercher une partie en attente
    game_waiting = PongGame.objects.filter(status='waiting').first()

    if game_waiting:
        # S'il y a déjà une partie en attente, ajouter l'utilisateur actuel comme joueur deux
        game_waiting.player_two = current_user
        game_waiting.player_two_socket_id = game_socket_id
        game_waiting.status = 'playing'
        game_waiting.save()

        return JsonResponse({'message': 'Vous avez rejoint une partie en cours', 'game_id': game_waiting.id})
    else:
        # S'il n'y a pas de partie en attente, créer une nouvelle partie
        new_game = PongGame.objects.create(
            player_one=current_user,
            player_one_socket_id = game_socket_id,
            status='waiting'
        )

        return JsonResponse({'message': 'Vous êtes en file d attente pour une nouvelle partie', 'game_id': new_game.id})



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

    user = request.user
    user.two_factor_method = two_factor_method
    user.language = language  # Update the user's language preference

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

        send_two_factor_email(user.email, user)
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
            'avatarUrl': request.build_absolute_uri(user.avatar.url) if user.avatar else None
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

    friends_data = [{
        'username': friend.username,
        'avatarUrl': request.build_absolute_uri(friend.avatar.url) if friend.avatar else None,
        'status': friend.status
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

    from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

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

