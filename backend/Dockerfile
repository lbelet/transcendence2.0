# Utiliser une image Python officielle comme base
FROM python:3.9

# Ne pas écrire les fichiers .pyc sur le disque
ENV PYTHONDONTWRITEBYTECODE 1
# Ne pas bufferiser les sorties stdout et stderr
ENV PYTHONUNBUFFERED 1

# Créer le répertoire où le code source sera placé
WORKDIR /app

# Installer les dépendances
COPY requirements.txt .
# COPY requirements.txt /app/

RUN pip install --upgrade pip

RUN pip install --no-cache-dir -r requirements.txt

# Copier le reste du code source dans le conteneur
COPY . .

# Exposer le port sur lequel le serveur Django va écouter
EXPOSE 8000

# Lancer le serveur Uvicorn avec le module WSGI/ASGI
CMD ["uvicorn", "djangoBack.asgi:application", "--host", "0.0.0.0", "--port", "8000"]
