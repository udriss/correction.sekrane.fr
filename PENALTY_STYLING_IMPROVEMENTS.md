# Amélioration de la stylisation des cellules Excel avec pénalités

## Résumé des modifications apportées

### 1. Modification de la fonction `applyExcelCellStyle`

**Fichier modifié :** `/var/www/correction.sekrane.fr/components/pdfAutre/exportUtils/xlsxExportUtils.ts`

**Changements :**
- Ajout d'un troisième paramètre optionnel `hasPenalty: boolean = false`
- Nouvelle logique de stylisation pour les notes avec pénalité :
  - **Texte en gras et couleur rouge** (`color: { argb: 'FFCC0000' }, bold: true`)
  - **Fond rouge très pâle** (`fgColor: { argb: 'FFFFEEEE' }`)
- Support pour les notes avec format "X/20" et les notes simples (nombres uniquement)
- Détection via regex améliorée pour les notes numériques : `/^\d+([.,]\d+)?$/`

### 2. Détection automatique des pénalités

**Logique de détection :**
```typescript
const hasPenalty = c.penalty !== undefined && 
                  c.penalty !== null && 
                  parseFloat(String(c.penalty)) > 0;
```

Cette logique détecte une pénalité quand :
- Le champ `penalty` existe
- Il n'est pas `null`
- Sa valeur convertie en nombre est supérieure à 0

### 3. Mise à jour de tous les formats d'export

#### Format simplifié (viewType: 'simplified')
- Ajout d'une `penaltyMap` pour stocker les informations de pénalité par étudiant/activité
- Mise à jour de l'appel `applyExcelCellStyle(cell, cellValue, hasPenalty)`

#### Format détaillé avec colonnes groupées
- Ajout d'une `penaltyMap` pour le mapping étudiant/activité → pénalité
- Application du style pénalité uniquement aux cellules de notes (pas aux points)
- Points : `applyExcelCellStyle(pointsCell, rowData[cellIndex - 1], false)`
- Notes : `applyExcelCellStyle(gradeCell, rowData[cellIndex], hasPenalty)`

#### Format détaillé standard
- Détection directe de la pénalité depuis l'objet correction `c`
- Application du style pénalité à la cellule de note
- Cellules de statut et points non affectées par le style pénalité

### 4. Exemples de données traitées

**Exemple 1 - Avec pénalité :**
```javascript
{
  penalty: "4.00",        // Pénalité de 4 points
  final_grade: "7.50",    // Note finale après pénalité
  // → Cellule stylée en rouge gras
}
```

**Exemple 2 - Sans pénalité :**
```javascript
{
  penalty: "0.00",        // Pas de pénalité
  final_grade: "9.00",    // Note finale
  // → Cellule avec style normal selon la note
}
```

### 5. Comportement visuel

#### Notes avec pénalité :
- **Police :** Rouge (#CC0000) et gras
- **Fond :** Rouge très pâle (#FFEEEE)
- **Alignement :** Centré horizontal et vertical

#### Notes sans pénalité :
- **Style normal :** Couleurs selon la performance (rouge < 5, orange < 10, vert ≥ 10)
- **Notes excellentes (≥ 15) :** Texte en gras avec fond vert

### 6. Compatibilité

- ✅ Tous les formats d'export existants sont préservés
- ✅ Rétrocompatibilité garantie avec le paramètre `hasPenalty` optionnel
- ✅ Support des formats de notes "X/20" et nombres simples
- ✅ Gestion des virgules et points décimaux

## Utilisation

Après ces modifications, les exports Excel afficheront automatiquement les notes avec pénalité dans un style visuel distinctif (rouge gras), permettant une identification rapide des corrections pénalisées.
