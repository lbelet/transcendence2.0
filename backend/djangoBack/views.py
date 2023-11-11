import json
import secrets
import datetime
from django.http import JsonResponse
from django.shortcuts import render
from django.contrib.auth import authenticate
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken

from djangoBack.models import User

# Helper Functions
def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

def generate_2fa_code():
    return ''.join(secrets.choice('0123456789') for i in range(6))

def send_two_factor_email(user_email, user):
    two_factor_code = generate_2fa_code()
    user.two_factor_code = two_factor_code
    user.two_factor_code_expires = timezone.now() + datetime.timedelta(minutes=5)
    user.save()
    send_mail(
        subject='Your 2FA Code',
        message=f'Your 2FA code is: {two_factor_code}',
        from_email=settings.EMAIL_HOST_USER,
        recipient_list=[user_email],
        fail_silently=False,
    )

def retrieve_stored_2fa_code(user):
    if user.two_factor_code_expires and timezone.now() < user.two_factor_code_expires:
        return user.two_factor_code
    return None

# View Functions
@csrf_exempt
def register(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST method is accepted'}, status=405)

    data = json.loads(request.body)
    required_fields = ['first_name', 'last_name', 'email', 'username', 'password']
    if not all(data.get(field) for field in required_fields):
        return JsonResponse({'error': 'All fields are required'}, status=400)

    try:
        User.objects.create_user(**data)
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
            send_two_factor_email(user.email, user)
            return JsonResponse({'2fa_required': True})
        tokens = get_tokens_for_user(user)
        return JsonResponse(tokens, status=200)
    return JsonResponse({'error': 'Invalid username or password'}, status=400)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_user(request):
    data = json.loads(request.body)
    is_two_factor_enabled = data.get('isTwoFactorEnabled')

    user = request.user
    user.is_two_factor_enabled = is_two_factor_enabled
    user.save()

    if is_two_factor_enabled:
        send_mail(
            subject='Two-Factor Authentication Enabled',
            message='Two-factor authentication has been enabled for your account.',
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[user.email],
            fail_silently=False,
        )

    return JsonResponse({'success': 'Profile updated successfully'}, status=200)

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

    stored_code = retrieve_stored_2fa_code(user)
    if two_factor_code == stored_code:
        tokens = get_tokens_for_user(user)
        return JsonResponse(tokens, status=200)
    return JsonResponse({'error': 'Invalid 2FA code'}, status=400)

def index(request):
    return render(request, 'index.html')
