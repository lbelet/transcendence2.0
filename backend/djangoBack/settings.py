# backend/django/settings.py

import os
from pathlib import Path

# Chemin de base du projet Django
BASE_DIR = Path(__file__).resolve().parent.parent

# Clé secrète de l'application
# En production, ne jamais hardcoder la clé secrète!
# Utilisez une variable d'environnement et gardez-la secrète.
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'django-insecure-default-key')

# Debug
# En production, cela doit être False
DEBUG = os.environ.get('DJANGO_DEBUG', 'False') != 'False'

# Hôtes autorisés
ALLOWED_HOSTS = os.environ.get('DJANGO_ALLOWED_HOSTS', 'localhost 127.0.0.1 [::1]').split()

# Application Django installée
INSTALLED_APPS = [
    # Applications par défaut de Django
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Ajoutez ici les applications tierces
    # 'rest_framework', # Par exemple, si vous utilisez Django REST framework
    'djangoBack', # Votre application Django
]

# Middleware de Django
MIDDLEWARE = [
    # Middleware par défaut de Django
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# Configuration de l'URL racine
ROOT_URLCONF = 'django.urls'

# Configuration des templates
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'], # Si vous avez un dossier de templates
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                # Context processors par défaut de Django
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# Configuration WSGI
WSGI_APPLICATION = 'djangoBack.wsgi.application'

# Configuration de la base de données
# https://docs.djangoproject.com/en/3.2/ref/settings/#databases
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('POSTGRES_DB', 'your_database_name'),
        'USER': os.environ.get('POSTGRES_USER', 'user'),
        'PASSWORD': os.environ.get('POSTGRES_PASSWORD', 'password'),
        'HOST': 'db',  # Utilise le nom du service défini dans docker-compose.yml
        'PORT': '5432',
    }
}

# Validateurs de mot de passe
AUTH_PASSWORD_VALIDATORS = [
    # Validateurs par défaut de Django
    # ...
]

# Internationalisation
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_L10N = True
USE_TZ = True

# Configuration des fichiers statiques
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles' # Pour collecter les fichiers statiques

# Configuration des médias
# MEDIA_URL = '/media/'
# MEDIA_ROOT = BASE_DIR / 'media'

# Configuration de la clé primaire par défaut
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
