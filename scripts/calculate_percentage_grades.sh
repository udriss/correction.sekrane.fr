#!/bin/bash

# Script pour calculer les percentage_grade manquants dans corrections_autres
# Usage: ./calculate_percentage_grades.sh

echo "🔄 Calcul automatique des percentage_grade manquants..."
echo "=================================================="

# Configuration de la base de données (à adapter selon votre configuration)
DB_HOST="localhost"
DB_USER="root"
DB_NAME="correction"

# Demander le mot de passe de façon sécurisée
echo -n "Mot de passe MySQL: "
read -s DB_PASSWORD
echo

# Fonction pour exécuter une requête SQL
execute_sql() {
    local sql_file=$1
    local description=$2
    
    echo "📊 $description..."
    mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$sql_file"
    
    if [ $? -eq 0 ]; then
        echo "✅ $description - Terminé avec succès"
    else
        echo "❌ $description - Erreur lors de l'exécution"
        exit 1
    fi
    echo
}

# Vérifier que les fichiers SQL existent
required_files=(
    "scripts/test_percentage_grade_calculation.sql"
    "scripts/calculate_percentage_grade.sql"
    "scripts/verify_percentage_grade_calculation.sql"
)

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Fichier requis manquant: $file"
        exit 1
    fi
done

echo "✅ Tous les fichiers SQL sont présents"
echo

# Étape 1: Test et analyse des données
echo "🔍 ÉTAPE 1: Analyse des données existantes"
execute_sql "scripts/test_percentage_grade_calculation.sql" "Analyse des données avant calcul"

# Demander confirmation avant de procéder
echo "⚠️  Voulez-vous procéder au calcul des percentage_grade? (y/N)"
read -r confirmation
if [[ ! "$confirmation" =~ ^[Yy]$ ]]; then
    echo "🛑 Opération annulée par l'utilisateur"
    exit 0
fi

# Étape 2: Calcul des percentage_grade
echo "🔄 ÉTAPE 2: Calcul des percentage_grade"
execute_sql "scripts/calculate_percentage_grade.sql" "Mise à jour des percentage_grade"

# Étape 3: Vérification des résultats
echo "🔍 ÉTAPE 3: Vérification des résultats"
execute_sql "scripts/verify_percentage_grade_calculation.sql" "Vérification des calculs"

echo "🎉 PROCESSUS TERMINÉ AVEC SUCCÈS!"
echo "============================================"
echo "✅ Les percentage_grade ont été calculés et vérifiés"
echo "📊 Consultez les résultats ci-dessus pour les statistiques"
echo
