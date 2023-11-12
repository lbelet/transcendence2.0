# Standard library imports
import json
from django.http import JsonResponse
from django.shortcuts import render
from django.contrib.auth import authenticate
from django.views.decorators.csrf import csrf_exempt
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile

# Third-party imports
import pyotp
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from djangoBack import settings

# Local application imports
from djangoBack.models import User
from djangoBack.helpers import (
    get_tokens_for_user, send_two_factor_email, generate_qr_code, 
    retrieve_stored_2fa_code
)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_avatar(request, username):
    try:
        user = User.objects.get(username=username)
        if user.avatar:
            avatar_url = request.build_absolute_uri(user.avatar.url)
        else:
            avatar_url = request.build_absolute_uri(settings.MEDIA_URL + 'avatars/default.png')
        return JsonResponse({'avatarUrl': avatar_url})
    except User.DoesNotExist:
        return JsonResponse({'error': 'User not found'}, status=404)

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
            saved_path = default_storage.save(file_path, ContentFile(avatar.read()))
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
        if user.is_two_factor_enabled:
            if user.two_factor_method == 'email':
                send_two_factor_email(user.email, user)
                return JsonResponse({'2fa_required': True, '2fa_method': 'email'})
            elif user.two_factor_method == 'qr':
                qr_code_img = generate_qr_code(user)
                return JsonResponse({'2fa_required': True, '2fa_method': 'qr', 'qr_code_img': qr_code_img})

        tokens = get_tokens_for_user(user)
        return JsonResponse(tokens, status=200)
    return JsonResponse({'error': 'Invalid username or password'}, status=400)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_user(request):
    data = json.loads(request.body)
    two_factor_method = data.get('twoFactorMethod')

    user = request.user
    user.two_factor_method = two_factor_method

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

def index(request):
    return render(request, 'index.html')
