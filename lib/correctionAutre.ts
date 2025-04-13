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
    points_earned: correction.points_earned
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
    points_earned: correction.points_earned
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
    points_earned: correction.points_earned
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
      JSON.stringify([]), // points_earned is initialized as an empty array
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
  submission_date?: string;
  penalty?: number;
  deadline?: Date | string | null;
  grade?: number;
  active?: number;
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
  
  if (data.active !== undefined) {
    updates.push('active = ?');
    values.push(data.active);
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
 * En fonction des points obtenus pour chaque partie et du barème total
 */
export async function calculateGrade(points_earned: number[], total_points: number[]): Promise<number> {
  // Valider que les tableaux ont la même longueur
  if (points_earned.length !== total_points.length) {
    throw new Error('Les tableaux de points doivent avoir la même longueur');
  }
  
  // Calcul des points totaux obtenus et des points totaux possibles
  const totalEarned = points_earned.reduce((sum, points) => sum + points, 0);
  const totalPossible = total_points.reduce((sum, points) => sum + points, 0);
  
  // Éviter la division par zéro
  if (totalPossible === 0) {
    return 0;
  }
  
  // Calculer la note sur 20
  const grade = (totalEarned / totalPossible) * 20;
  
  // Arrondir à 2 décimales
  return Math.round(grade * 100) / 100;
}

/**
 * Récupère les statistiques des corrections pour une activité spécifique
 * @param activityId ID de l'activité
 * @param includeInactive Inclure les corrections inactives (désactivées)
 */
export async function getCorrectionAutreStatsByActivity(activityId: number, includeInactive: boolean = false): Promise<any> {
  // Préparer la requête SQL avec une condition optionnelle pour les corrections actives
  let activeCondition = includeInactive ? '' : 'AND c.active = 1';
  
  const sqlQuery = `
    SELECT 
      COUNT(c.id) as totalCorrections,
      AVG(c.grade) as averageGrade,
      MIN(c.grade) as minGrade,
      MAX(c.grade) as maxGrade,
      SUM(CASE WHEN c.grade >= 10 THEN 1 ELSE 0 END) as passCount,
      SUM(CASE WHEN c.grade < 10 THEN 1 ELSE 0 END) as failCount,
      JSON_ARRAYAGG(c.points_earned) as allPointsEarned,
      COUNT(DISTINCT c.student_id) as uniqueStudents,
      COUNT(DISTINCT c.class_id) as uniqueClasses
    FROM 
      corrections_autres c
    WHERE 
      c.activity_id = ? ${activeCondition}
  `;
  
  const stats = await query<any[]>(sqlQuery, [activityId]);
  
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
  let allPointsEarned = [];
  try {
    // Analyser le tableau JSON des points obtenus pour toutes les corrections
    if (result.allPointsEarned && result.allPointsEarned !== null) {
      allPointsEarned = JSON.parse(result.allPointsEarned);
      
      // Si les points sont stockés sous forme de chaîne JSON dans la base de données,
      // nous devons analyser chaque entrée
      allPointsEarned = allPointsEarned.map((points: string | number[]) => {
        if (typeof points === 'string') {
          return JSON.parse(points);
        }
        return points;
      });
    }
  } catch (error) {
    console.error('Error parsing points earned:', error);
    allPointsEarned = [];
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