// formatUtils.ts - Fonctions de formatage communes à tous les exports
import { CorrectionAutreEnriched, ActivityAutre } from '@/lib/types';

// Fonction pour formater les notes (avec option pour utiliser une virgule)
export const formatGrade = (grade: any, useComma: boolean = false) => {
  if (grade === undefined || grade === null) return '- -';
  
  let formattedGrade = '';
  if (typeof grade === 'number') {
    formattedGrade = grade.toFixed(1);
  } else if (!isNaN(Number(grade))) {
    formattedGrade = Number(grade).toFixed(1);
  } else {
    formattedGrade = grade;
  }
  
  // Remove trailing .0 or .00
  if (typeof formattedGrade === 'string') {
    formattedGrade = formattedGrade.replace(/\.?0+$/, '');
    // Replace '.' by ',' if required
    if (useComma) {
      formattedGrade = formattedGrade.replace('.', ',');
    }
  }
  
  return formattedGrade;
};

// Fonction pour déterminer si une correction est active
export const isCorrectionActive = (correction: any): boolean => {
  // Priorité à correction.status si disponible
  if (correction.status) {
    return correction.status === 'ACTIVE';
  }
  // Compatibilité avec l'ancien système (correction.active)
  return correction.active !== 0;
};

// Fonction pour calculer le total des points d'un barème
export const calculateTotalPoints = (points: number[] | undefined): number => {
  if (!points || !Array.isArray(points) || points.length === 0) {
    return 20; // Valeur par défaut si pas de barème défini
  }
  return points.reduce((acc, curr) => acc + curr, 0);
};

// Fonction pour obtenir les valeurs d'affichage pour une correction
export const getDisplayValues = (
  correction: CorrectionAutreEnriched,
  activity?: ActivityAutre | undefined
) => {
  // Calculer le barème total de l'activité
  const totalPoints = activity && activity.points ? 
    calculateTotalPoints(activity.points) : 20; // Utiliser 20 comme valeur par défaut si pas de barème

  // Vérifier si c'est un placeholder avec status NON_NOTE
  const isPlaceholder = (correction.placeholder && correction.status === 'NON_NOTE');
  
  // Déterminer le statut
  let statusDisplay = 'ACTIVE';
  if (correction.status) {
    switch (correction.status) {
      case 'NON_NOTE': statusDisplay = 'NON NOTÉ'; break;
      case 'ABSENT': statusDisplay = 'ABSENT'; break;
      case 'NON_RENDU': statusDisplay = 'NON RENDU'; break;
      case 'DEACTIVATED': statusDisplay = 'DÉSACTIVÉ'; break;
      default: statusDisplay = correction.status;
    }
  } else if (correction.active === 0) {
    statusDisplay = 'DÉSACTIVÉ';
  }
  
  // Formater les points
  let pointsDisplay = isPlaceholder ? '-.-' : '-.-';
  if (!isPlaceholder && Array.isArray(correction.points_earned) && correction.points_earned.length > 0) {
    pointsDisplay = '[' + correction.points_earned.join(' ; ') + ']';
  }
  
  // Formater la note en utilisant percentage_grade en priorité
  let gradeDisplay;
  if (isPlaceholder) {
    gradeDisplay = 'N/A';
  } else if (statusDisplay === 'ACTIVE') {
    const isNormalized = correction.percentage_grade !== null && correction.percentage_grade !== undefined;
    
    if (isNormalized) {
      // Si on a percentage_grade, afficher la note normalisée sur 20 ET la note originale
      const normalizedGrade = ((correction.percentage_grade ?? 0) / 100) * 20;
      const originalGrade = correction.grade != null ? parseFloat(correction.grade.toString()) : 0;
      
      // Calculer le barème original à partir de l'activité en tenant compte des parties désactivées
      let originalTotal = 20; // Fallback à 20 si pas de barème défini
      if (activity && activity.points) {
        // Parser les parties désactivées
        const disabledParts = correction.disabled_parts && Array.isArray(correction.disabled_parts) 
          ? correction.disabled_parts 
          : null;
        
        // Calculer le total en excluant les parties désactivées
        originalTotal = activity.points.reduce((sum: number, points: number, index: number) => {
          // Exclure les parties désactivées du calcul du barème original
          if (disabledParts && disabledParts[index]) {
            return sum;
          }
          return sum + points;
        }, 0);
        
        // Si toutes les parties sont désactivées, utiliser le fallback
        if (originalTotal === 0) {
          originalTotal = 20;
        }
      }
      
      gradeDisplay = `${formatGrade(normalizedGrade)} / 20 [${formatGrade(originalGrade)} / ${originalTotal}]`;
    } else if (correction.grade != null) {
      // Fallback sur grade si percentage_grade n'est pas disponible
      const gradeToDisplay = parseFloat(correction.grade.toString());
      gradeDisplay = `${formatGrade(gradeToDisplay)} / 20`;
    } else {
      gradeDisplay = `${formatGrade(0)} / 20`;
    }
  } else {
    gradeDisplay = statusDisplay;
  }
  
  return { statusDisplay, pointsDisplay, gradeDisplay };
};