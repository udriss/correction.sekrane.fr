#!/bin/bash

# Définir les variables
APP_DIR="/var/www/correction.sekrane.fr"
OUTPUT_FILE="correction_app_$(date +%Y%m%d).zip"
EXCLUDE_DIRS=".next node_modules .git"

# Se déplacer dans le répertoire de l'application
cd $APP_DIR

# Créer la commande zip avec les exclusions
ZIP_CMD="zip -r $OUTPUT_FILE ."

# Ajouter les exclusions à la commande
for dir in $EXCLUDE_DIRS; do
  ZIP_CMD="$ZIP_CMD -x \"*$dir/*\""
done

# Exécuter la commande
echo "Création de l'archive $OUTPUT_FILE..."
eval $ZIP_CMD

# Vérifier si la commande a réussi
if [ $? -eq 0 ]; then
  echo "Archive créée avec succès: $APP_DIR/$OUTPUT_FILE"
  ls -lh $OUTPUT_FILE
else
  echo "Erreur lors de la création de l'archive"
  exit 1
fi
