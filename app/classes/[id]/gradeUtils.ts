import { ActivityAutre } from '@/lib/types';

/**
 * Normalise une note en fonction du barème de l'activité pour la ramener sur 20
 * @param grade La note à normaliser
 * @param activity L'activité contenant le barème
 * @returns La note normalisée sur 20
 */
export const normalizeGrade = (
  grade: number | string | null | undefined, 
  activity?: ActivityAutre | null
): number => {
  // Convertir la note en nombre
  let numericGrade: number;
  if (grade === null || grade === undefined) {
    return 0;
  }
  
  // Si la note est une chaîne, la convertir en nombre
  if (typeof grade === 'string') {
    numericGrade = parseFloat(grade);
    if (isNaN(numericGrade)) return 0;
  } else {
    numericGrade = grade;
  }
  
  // Si l'activité n'est pas définie ou n'a pas de barème, on considère que la note est déjà sur 20
  if (!activity || !activity.points || !Array.isArray(activity.points) || activity.points.length === 0) {
    return numericGrade;
  }
  
  // Calculer le barème total de l'activité (somme des points)
  const totalPoints = activity.points.reduce((sum, p) => sum + p, 0);
  
  // Si le barème total est 0 ou non défini, retourner la note telle quelle
  if (totalPoints <= 0) {
    return numericGrade;
  }
  
  // Normaliser la note sur 20
  return (numericGrade / totalPoints) * 20;
};

/**
 * Récupère le barème total d'une activité
 * @param activity L'activité dont on veut connaître le barème
 * @returns Le barème total de l'activité
 */
export const getTotalPoints = (activity?: ActivityAutre | null): number => {
  if (!activity || !activity.points || !Array.isArray(activity.points)) {
    return 0;
  }
  
  return activity.points.reduce((sum, p) => sum + p, 0);
};
