# Utilisez une image Node.js comme base
FROM node:16-alpine

# Définissez le répertoire de travail
WORKDIR /app

# Copiez les fichiers de dépendance du projet
COPY ./package*.json ./

# Installez les dépendances, y compris Vite pour le hot-reloading
RUN npm install

# Copiez le reste des fichiers du projet
COPY ./ .

# Exposez le port utilisé par Vite (3000 par défaut)
EXPOSE 5173

# Lancez le serveur de développement Vite pour le hot-reloading
CMD ["npm", "run", "dev"]
