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
  
  // Formater la note
  let gradeDisplay;
  if (isPlaceholder) {
    gradeDisplay = 'N/A';
  } else if (correction.grade !== undefined) {
    if (statusDisplay === 'ACTIVE') {
      gradeDisplay = `${formatGrade(correction.grade)} / ${totalPoints}`;
    } else {
      gradeDisplay = statusDisplay;
    }
  } else {
    gradeDisplay = 'NON NOTÉ';
  }
  
  return { statusDisplay, pointsDisplay, gradeDisplay };
};