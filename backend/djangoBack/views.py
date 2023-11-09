from django.contrib.auth import authenticate, login
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
import json

from djangoBack.models import User


@csrf_exempt
def register(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        first_name = data.get('first_name')
        last_name = data.get('last_name')
        email = data.get('email')
        username = data.get('username')
        password = data.get('password')

        # Validate that none of the required fields are None
        if not all([first_name, last_name, email, username, password]):
            return JsonResponse({'error': 'All fields are required'}, status=400)

        try:
            # Attempt to create the user
            User.objects.create_user(
                email=email,
                password=password,
                username=username,
                first_name=first_name,
                last_name=last_name,
            )
            return JsonResponse({'success': 'User created successfully'}, status=201)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)


def login_view(request):
    return render(request, 'login.html')

@csrf_exempt
def api_login(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        username = data.get('username')
        password = data.get('password')

        # Utilisez la fonction `authenticate` pour vérifier les identifiants
        user = authenticate(username=username, password=password)
        if user is not None:
            # Si les identifiants sont corrects, utilisez `login` pour connecter l'utilisateur
            login(request, user)
            return JsonResponse({'success': 'User logged in successfully'}, status=200)
        else:
            # Si les identifiants sont incorrects, renvoyez une erreur
            return JsonResponse({'error': 'Invalid username or password'}, status=400)
    else:
        return JsonResponse({'error': 'Only POST method is accepted'}, status=405)


def home_view(request):
    return render(request, 'home.html')
