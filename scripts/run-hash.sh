#!/bin/bash

# Se déplacer dans le répertoire du projet
cd "$(dirname "$0")/.."

# Installer les dépendances nécessaires
echo "Installation des dépendances..."
npm install dotenv bcrypt mysql2

# Exécuter le script de hachage
echo "Exécution du script de hachage des mots de passe..."
node scripts/hash-passwords.js
