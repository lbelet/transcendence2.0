# Étape de construction
FROM node:16-alpine as build-stage

WORKDIR /app

# Copiez les fichiers de package.json et package-lock.json
COPY frontend/package.json ./

# Installez les dépendances du projet
RUN npm install

# Copiez les fichiers du projet
COPY frontend/ .

# Construisez l'application pour la production
RUN npm run build

# Étape de production
FROM nginx:stable-alpine as production-stage

# Copiez le dossier dist construit à l'étape de construction dans le dossier de serveur nginx
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Exposez le port 80
EXPOSE 80

# Lancer Nginx
CMD ["nginx", "-g", "daemon off;"]
