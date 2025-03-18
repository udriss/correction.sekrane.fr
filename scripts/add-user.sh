#!/bin/bash

# Vérifier si ts-node est installé
if ! command -v ts-node &> /dev/null; then
    echo "ts-node n'est pas installé. Installation en cours..."
    npm install -g ts-node typescript
fi

# Vérifier si les dépendances sont installées
if [ ! -d "node_modules/bcrypt" ]; then
    echo "Installation des dépendances..."
    npm install bcrypt
fi

# Exécuter le script avec ts-node
npx ts-node scripts/create-user.ts "$1" "$2" "$3"
