#!/bin/bash

# Script de nettoyage des connexions MySQL dormantes
# À exécuter via cron job, par exemple toutes les minutes :
# * * * * * /var/www/correction.sekrane.fr/scripts/db-cleanup-cron.sh >> /var/log/db-cleanup.log 2>&1

# Chemin vers l'application
APP_PATH="/var/www/correction.sekrane.fr"
# URL de l'API de nettoyage (en HTTPS et avec le nom de domaine complet)
API_URL="https://correction.sekrane.fr/api/admin/db-status/cron-exec"

# Récupérer la clé secrète depuis le fichier .env
CRON_SECRET=$(grep 'CRON_SECRET=' "$APP_PATH/.env" | cut -d '=' -f2- | tr -d '\r\n')

# Si la clé secrète n'est pas trouvée, arrêter le script avec une erreur
if [ -z "$CRON_SECRET" ]; then
  echo "ERREUR: CRON_SECRET non trouvée dans le fichier .env"
  echo "Veuillez ajouter CRON_SECRET dans le fichier $APP_PATH/.env"
  exit 1
fi

# Horodatage pour les logs
TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")

echo "[$TIMESTAMP] Exécution du nettoyage des connexions MySQL dormantes..."

# Appel à l'API avec curl
# Option -L pour suivre les redirections, et -k pour ignorer les erreurs de certificat SSL si nécessaire
RESPONSE=$(curl -s -L -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -d '{"minIdleTimeSeconds": 60}' \
  $API_URL)

# Vérifier si la requête a réussi
if echo "$RESPONSE" | grep -q "success"; then
  KILLED_COUNT=$(echo "$RESPONSE" | grep -o '"killedCount":[0-9]*' | cut -d':' -f2)
  echo "[$TIMESTAMP] Nettoyage terminé avec succès. $KILLED_COUNT connexion(s) fermée(s)."
else
  ERROR_MSG=$(echo "$RESPONSE" | grep -o '"error":"[^"]*"' | cut -d':' -f2- | tr -d '"')
  if [ -n "$ERROR_MSG" ]; then
    echo "[$TIMESTAMP] Erreur: $ERROR_MSG"
  else
    echo "[$TIMESTAMP] Nettoyage désactivé ou erreur inconnue."
    echo "[$TIMESTAMP] Réponse complète: $RESPONSE"
  fi
fi

# Ajouter une ligne vide pour séparer les exécutions dans le log
echo ""