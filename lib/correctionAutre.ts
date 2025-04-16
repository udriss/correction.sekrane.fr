import { query } from './db';
import { CorrectionAutre, CorrectionAutreWithShareCode } from './types';

/**
 * Récupère toutes les corrections avec parties dynamiques
 */
export async function getCorrectionsAutres(): Promise<CorrectionAutre[]> {
  const corrections = await query<CorrectionAutre[]>(`
    SELECT *
    FROM corrections_autres
    ORDER BY created_at DESC
  `);
  
  return corrections.map(correction => ({
    ...correction,
    points_earned: parsePointsEarned(correction.points_earned)
  }));
}

/**
 * Récupère les corrections pour une activité spécifique
 */
export async function getCorrectionsAutresByActivityId(activityId: number): Promise<CorrectionAutre[]> {
  const corrections = await query<CorrectionAutre[]>(`
    SELECT *
    FROM corrections_autres
    WHERE activity_id = ?
    ORDER BY created_at DESC
  `, [activityId]);
  
  return corrections.map(correction => ({
    ...correction,
    points_earned: parsePointsEarned(correction.points_earned)
  }));
}

/**
 * Récupère une correction spécifique par son ID
 */
export async function getCorrectionAutreById(id: number): Promise<CorrectionAutre | null> {
  const corrections = await query<CorrectionAutre[]>(`
    SELECT *
    FROM corrections_autres
    WHERE id = ?
  `, [id]);
  
  if (corrections.length === 0) {
    return null;
  }
  
  const correction = corrections[0];
  return {
    ...correction,
    points_earned: parsePointsEarned(correction.points_earned)
  };
}

/**
 * Crée une nouvelle correction avec parties dynamiques
 */
export async function createCorrectionAutre(data: {
  activity_id: number;
  student_id: number | null;
  //points_earned: number[];
  content: string | null;
  class_id: number | null;
  submission_date?: string;
  penalty?: number;
  deadline?: Date | string | null;
  user_id?: number;
  grade?: number;
}): Promise<number> {
  const { 
    activity_id, 
    student_id, 
    //points_earned, 
    content, 
    class_id, 
    submission_date, 
    penalty, 
    deadline,
    user_id,
    grade
  } = data;
  
  // Récupérer l'activité pour connaître le nombre de parties et initialiser points_earned
  const { getActivityAutreById } = await import('@/lib//activityAutre');
  const activity = await getActivityAutreById(activity_id);
  
  // Initialiser le tableau points_earned avec des zéros pour chaque partie de l'activité
  const initialPoints = activity?.points?.length ? 
    new Array(activity.points.length).fill(0) : 
    [];
  
  const result = await query<{ insertId: number }>(
    `INSERT INTO corrections_autres (
      activity_id,
      student_id,
      points_earned,
      content,
      class_id,
      submission_date,
      penalty,
      deadline,
      grade,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      activity_id,
      student_id,
      JSON.stringify(initialPoints), // Initialiser avec un tableau de zéros de la bonne taille
      content,
      class_id,
      submission_date || null,
      penalty || null,
      deadline || null,
      grade || null
    ]
  );
  
  return result.insertId;
}

/**
 * Met à jour une correction existante
 */
export async function updateCorrectionAutre(id: number, data: {
  points_earned?: number[];
  content?: string | null;
  submission_date?: Date | string | null; // Ajout de null pour correspondre à l'utilisation réelle
  penalty?: number | null;
  deadline?: Date | string | null;
  grade?: number | null; // Ajout de null pour correspondre à l'utilisation réelle
  final_grade?: number | null; // Ajout de null pour correspondre à l'utilisation réelle
  status?: string; // Changé de active (number) à status (string)
}): Promise<boolean> {
  const updates = [];
  const values = [];
  
  if (data.points_earned !== undefined) {
    updates.push('points_earned = ?');
    values.push(JSON.stringify(data.points_earned));
  }
  
  if (data.content !== undefined) {
    updates.push('content = ?');
    values.push(data.content);
  }
  
  if (data.submission_date !== undefined) {
    updates.push('submission_date = ?');
    values.push(data.submission_date);
  }
  
  if (data.penalty !== undefined) {
    updates.push('penalty = ?');
    values.push(data.penalty);
  }
  
  if (data.deadline !== undefined) {
    updates.push('deadline = ?');
    values.push(data.deadline);
  }
  
  if (data.grade !== undefined) {
    updates.push('grade = ?');
    values.push(data.grade);
  }
  
  if (data.final_grade !== undefined) {
    updates.push('final_grade = ?');
    values.push(data.final_grade);
  }
  
  if (data.status !== undefined) {
    updates.push('status = ?');
    values.push(data.status);
  }
  
  updates.push('updated_at = NOW()');
  
  if (updates.length === 0) {
    return false;
  }
  
  values.push(id);
  
  const result = await query<{ affectedRows: number }>(
    `UPDATE corrections_autres SET ${updates.join(', ')} WHERE id = ?`,
    values
  );
  
  return result.affectedRows > 0;
}

/**
 * Supprime une correction
 */
export async function deleteCorrectionAutre(id: number): Promise<boolean> {
  const result = await query<{ affectedRows: number }>(
    'DELETE FROM corrections_autres WHERE id = ?',
    [id]
  );
  
  return result.affectedRows > 0;
}

/**
 * Calcul de la note globale
 * En fonction des points obtenus pour chaque partie, de l'activité et de la pénalité éventuelle
 */
export function calculateGrade(
  activityPoints: number[],
  points_earned: number[],
  penalty: number | null | undefined = 0
): { grade: number; final_grade: number } {
  // Récupérer le barème total depuis l'activité
  const total_points = activityPoints || [];
  
  // Valider que les tableaux ont la même longueur
  if (points_earned.length !== total_points.length && total_points.length > 0) {
    // Ajuster la taille du tableau des points obtenus si nécessaire
    while (points_earned.length < total_points.length) {
      points_earned.push(0);
    }
  }
  
  // Calcul des points totaux obtenus et des points totaux possibles
  const totalEarned = points_earned.reduce((sum: number, points: number) => sum + points, 0);
  const totalPossible = total_points.reduce((sum: number, points: number) => sum + points, 0);
  
  
  // Éviter la division par zéro
  if (totalPossible === 0) {
    return { grade: 0, final_grade: 0 };
  }
  
  // Calculer la note sur le barème total
  const rawGrade = totalEarned;
  
  // Arrondir à 2 décimales
  const grade = Math.round(rawGrade * 100) / 100;
  
  // Calculer la note finale en appliquant la pénalité selon les règles spécifiques:
  // 1. Si la note est inférieure à 5, on garde cette note
  // 2. Sinon, on prend le maximum entre (note-pénalité) et 5
  const actualPenalty = penalty || 0; // Utiliser 0 si penalty est null ou undefined
  
  let final_grade;
  if (grade < 5) {
    // Si la note est inférieure à 5, on conserve la note initiale
    final_grade = grade;
  } else {
    // Sinon, on applique la pénalité mais ne descend pas en dessous de 5
    final_grade = Math.max(5, grade - actualPenalty);
  }
  
  // Arrondir à 2 décimales
  final_grade = Math.round(final_grade * 100) / 100;
  
  return { grade, final_grade };
}

/**
 * Récupère les statistiques des corrections pour une activité spécifique
 * @param activityId ID de l'activité
 * @param includeInactive Inclure les corrections inactives (désactivées)
 */
export async function getCorrectionAutreStatsByActivity(activityId: number, includeInactive: boolean = false): Promise<any> {
  // Préparer la requête SQL avec une condition optionnelle pour les corrections actives
  let statusCondition = includeInactive ? '' : "AND c.status = 'ACTIVE'";
  
  // Requête pour obtenir les statistiques globales sans les points_earned
  const sqlQuery = `
    SELECT 
      COUNT(c.id) as totalCorrections,
      AVG(c.final_grade) as averageGrade,
      MIN(c.final_grade) as minGrade,
      MAX(c.final_grade) as maxGrade,
      SUM(CASE WHEN c.final_grade >= 10 THEN 1 ELSE 0 END) as passCount,
      SUM(CASE WHEN c.final_grade < 10 THEN 1 ELSE 0 END) as failCount,
      COUNT(DISTINCT c.student_id) as uniqueStudents,
      COUNT(DISTINCT c.class_id) as uniqueClasses,
      SUM(CASE WHEN c.status = 'DEACTIVATED' THEN 1 ELSE 0 END) as inactive_count,
      SUM(CASE WHEN c.status = 'NON_RENDU' THEN 1 ELSE 0 END) as non_rendu_count,
      SUM(CASE WHEN c.status = 'ABSENT' THEN 1 ELSE 0 END) as absent_count
    FROM 
      corrections_autres c
    WHERE 
      c.activity_id = ? ${statusCondition}
  `;
  
  // Requête séparée pour récupérer tous les points_earned
  const pointsQuery = `
    SELECT 
      c.points_earned
    FROM 
      corrections_autres c
    WHERE 
      c.activity_id = ? ${statusCondition}
  `;
  
  // Exécuter les deux requêtes
  const stats = await query<any[]>(sqlQuery, [activityId]);
  const pointsResults = await query<any[]>(pointsQuery, [activityId]);
  
  if (!stats || stats.length === 0) {
    return {
      totalCorrections: 0,
      averageGrade: 0,
      minGrade: 0,
      maxGrade: 0,
      passCount: 0,
      failCount: 0,
      passRate: 0,
      allPointsEarned: [],
      uniqueStudents: 0,
      uniqueClasses: 0,
      pointsDistribution: []
    };
  }
  
  const result = stats[0];
  
  // Calculer le taux de réussite
  const passRate = result.totalCorrections > 0 
    ? (result.passCount / result.totalCorrections) * 100 
    : 0;
  
  // Traiter les points obtenus pour chaque partie
  let allPointsEarned: number[][] = [];
  
  // Traiter chaque résultat de points_earned individuellement
  if (pointsResults && pointsResults.length > 0) {
    allPointsEarned = pointsResults
      .map(row => {
        // Utiliser notre fonction utilitaire pour parser les points_earned
        return parsePointsEarned(row.points_earned);
      })
      .filter(points => Array.isArray(points) && points.length > 0);
  }
  
  // Calculer la distribution des points pour chaque partie
  const pointsDistribution = calculatePointsDistribution(allPointsEarned);
  
  return {
    ...result,
    passRate: Math.round(passRate * 100) / 100, // Arrondir à 2 décimales
    allPointsEarned,
    pointsDistribution
  };
}

/**
 * Récupère les statistiques des corrections pour une activité spécifique, regroupées par groupe
 * @param activityId ID de l'activité
 * @param includeInactive Inclure les corrections inactives (désactivées)
 */
export async function getCorrectionAutreStatsByGroups(activityId: number, includeInactive: boolean = false): Promise<any[]> {
  // Préparer la requête SQL avec une condition optionnelle pour les corrections actives
  let statusCondition = includeInactive ? '' : "AND c.status = 'ACTIVE'";
  
  // Requête SQL pour obtenir les statistiques par groupe
  const sqlQuery = `
    SELECT 
      CASE 
        WHEN g.id IS NOT NULL THEN g.id
        WHEN c.class_id IS NOT NULL AND cs.sub_class IS NOT NULL THEN -1 
        ELSE 0
      END as groupId,
      CASE 
        WHEN g.id IS NOT NULL THEN g.name
        WHEN c.class_id IS NOT NULL AND cs.sub_class IS NOT NULL THEN CONCAT(cl.name, ' - Groupe ', cs.sub_class)
        ELSE 'Sans groupe'
      END as groupName,
      c.class_id as classId,
      cl.name as className,
      cs.sub_class as subClass,
      AVG(c.final_grade) as averageGrade,
      MAX(c.final_grade) as maxGrade,
      MIN(c.final_grade) as minGrade,
      COUNT(c.id) as count
    FROM 
      corrections_autres c
    LEFT JOIN 
      correction_groups g ON c.group_id = g.id
    LEFT JOIN 
      classes cl ON c.class_id = cl.id
    LEFT JOIN
      class_students cs ON c.student_id = cs.student_id AND c.class_id = cs.class_id
    WHERE 
      c.activity_id = ? ${statusCondition}
    GROUP BY 
      groupId, groupName, c.class_id, cl.name, cs.sub_class
    ORDER BY 
      groupId, groupName
  `;
  
  try {
    const stats = await query<any[]>(sqlQuery, [activityId]);
    
    if (!stats || stats.length === 0) {
      return [];
    }
    
    // Traiter les résultats pour s'assurer que les valeurs numériques sont bien formatées
    return stats.map(stat => ({
      ...stat,
      averageGrade: parseFloat(parseFloat(stat.averageGrade).toFixed(2)) || 0,
      maxGrade: parseFloat(parseFloat(stat.maxGrade).toFixed(2)) || 0,
      minGrade: parseFloat(parseFloat(stat.minGrade).toFixed(2)) || 0,
      count: parseInt(stat.count) || 0
    }));
    
  } catch (error) {
    console.error('Error fetching group statistics:', error);
    return [];
  }
}

/**
 * Calcule la distribution des points pour chaque partie de l'activité
 * @param allPointsEarned Tableau des points obtenus pour toutes les corrections
 */
function calculatePointsDistribution(allPointsEarned: number[][]): any[] {
  if (!allPointsEarned || allPointsEarned.length === 0) {
    return [];
  }
  
  // Déterminer le nombre de parties (colonnes) en utilisant la première correction
  const numParts = allPointsEarned[0]?.length || 0;
  
  // Initialiser le tableau des statistiques pour chaque partie
  const distribution = Array(numParts).fill(0).map(() => ({
    average: 0,
    min: Infinity,
    max: -Infinity,
    total: 0
  }));
  
  // Calculer les statistiques pour chaque partie
  allPointsEarned.forEach(points => {
    if (Array.isArray(points)) {
      points.forEach((point, partIndex) => {
        if (partIndex < numParts) {
          const numPoint = Number(point);
          if (!isNaN(numPoint)) {
            distribution[partIndex].total += numPoint;
            distribution[partIndex].min = Math.min(distribution[partIndex].min, numPoint);
            distribution[partIndex].max = Math.max(distribution[partIndex].max, numPoint);
          }
        }
      });
    }
  });
  
  // Calculer les moyennes
  distribution.forEach((stats, index) => {
    stats.average = allPointsEarned.length > 0 
      ? Math.round((stats.total / allPointsEarned.length) * 100) / 100 
      : 0;
    
    // Corriger les valeurs min/max si aucune donnée n'est disponible
    if (stats.min === Infinity) stats.min = 0;
    if (stats.max === -Infinity) stats.max = 0;
  });
  
  return distribution;
}

/**
 * Fonction utilitaire pour parser correctement le champ points_earned
 * Gère les différents cas de figure (string JSON, déjà parsé, etc.)
 */
function parsePointsEarned(points: any): number[] {
  // Si points est déjà un tableau, on le retourne tel quel
  if (Array.isArray(points)) {
    return points;
  }
  
  // Si points est null ou undefined, on retourne un tableau vide
  if (points === null || points === undefined) {
    return [];
  }
  
  // Si points est une chaîne JSON, on la parse
  if (typeof points === 'string') {
    try {
      const parsed = JSON.parse(points);
      
      // Vérifier que le résultat est bien un tableau
      if (Array.isArray(parsed)) {
        return parsed;
      } else {
        console.error('Le JSON parsé n\'est pas un tableau:', parsed);
        return [];
      }
    } catch (error) {
      console.error('Erreur lors du parsing des points:', error);
      return [];
    }
  }
  
  // Cas par défaut, on retourne un tableau vide
  console.error('Format de points_earned non reconnu:', points);
  return [];
}