FROM python:3.10-slim

# Définir le répertoire de travail
WORKDIR /app

# Installer les dépendances système nécessaires (optionnel, pour certaines bibliothèques ML)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copier les fichiers de dépendances
COPY requirements.txt .

# Installer les dépendances Python
RUN pip install --no-cache-dir -r requirements.txt

# Copier tout le code du microservice
COPY . .

# Exposer le port
EXPOSE 5001

# Commande par défaut pour lancer le service
CMD ["python", "run.py", "--host", "0.0.0.0", "--port", "5001"]
