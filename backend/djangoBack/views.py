from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import User
import json

@csrf_exempt  # Pour simplifier, désactivez la protection CSRF. En production, utilisez une approche sécurisée.
def register(request):
    if request.method == 'POST':
        body = json.loads(request.body.decode('utf-8')) 
        username = body.get('username')
        first_name = body.get('firstname')
        last_name = body.get('lastname')
        email = body.get('email')
        password = body.get('password')
        # age = request.body('age')  # Assurez-vous que l'âge est envoyé depuis le frontend

        # return JsonResponse({'status': 'success', 'message': email })
        user = User.objects.create_user(email=email, password=password, username=username, first_name=first_name, last_name=last_name)
        return JsonResponse({'status': 'success', 'message': 'User registered successfully'})
    return JsonResponse({'status': 'error', 'message': 'Invalid request'}, status=400)
