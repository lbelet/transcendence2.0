# Utilisez l'image de base Nginx officielle
FROM nginx:latest

# Installez OpenSSL pour générer un certificat auto-signé
RUN apt-get update && \
    apt-get install -y openssl && \
    rm -rf /var/lib/apt/lists/*

# Définissez des variables d'environnement pour le certificat
ENV NX_DOMAIN_NAME localhost
ENV NX_USER_ADMIN_EMAIL admin@example.com

# Créez un répertoire pour les certificats et générez le certificat auto-signé
RUN mkdir -p /etc/nginx/ssl && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/nginx-selfsigned.key \
    -out /etc/nginx/ssl/nginx-selfsigned.crt \
    -subj "/C=CH/ST=Vaud/L=Lausanne/O=MyOrganization/OU=IT/CN=localhost/emailAddress=admin@example.com"

# Copiez votre configuration Nginx personnalisée
COPY default.conf /etc/nginx/conf.d/

# Exposez le port 443 pour HTTPS
EXPOSE 443
