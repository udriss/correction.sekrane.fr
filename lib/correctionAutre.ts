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
    points_earned: parsePointsEarned(correction.points_earned),
    disabled_parts: parseDisabledParts(correction.disabled_parts)
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
    points_earned: parsePointsEarned(correction.points_earned),
    disabled_parts: parseDisabledParts(correction.disabled_parts)
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
    points_earned: parsePointsEarned(correction.points_earned),
    disabled_parts: parseDisabledParts(correction.disabled_parts)
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
  bonus?: number;
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
    bonus,
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
      bonus,
      deadline,
      grade,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      activity_id,
      student_id,
      JSON.stringify(initialPoints), // Initialiser avec un tableau de zéros de la bonne taille
      content,
      class_id,
      submission_date || null,
      penalty || null,
      bonus || null,
      deadline || null,
      grade || null
    ]
  );
  
  // Si une note a été fournie, calculer percentage_grade
  if (grade !== undefined && grade !== null && activity?.points) {
    try {
      const percentageGrade = calculatePercentageGrade(grade, activity.points, null);
      if (percentageGrade !== null) {
        await query(
          `UPDATE corrections_autres SET percentage_grade = ? WHERE id = ?`,
          [percentageGrade, result.insertId]
        );
      }
    } catch (error) {
      console.error('Error calculating percentage_grade on creation:', error);
      // Ne pas faire échouer la création pour cette erreur
    }
  }
  
  return result.insertId;
}

/**
 * Met à jour une correction existante
 */
export async function updateCorrectionAutre(id: number, data: {
  points_earned?: number[];
  content?: string | null;
  content_data?: string | Record<string, any> | null; // Corrigé pour accepter null
  submission_date?: Date | string | null;
  penalty?: number | null;
  bonus?: number | null;
  deadline?: Date | string | null;
  grade?: number | null;
  final_grade?: number | null;
  status?: string;
  disabled_parts?: boolean[] | null; // Ajout des parties désactivées
}): Promise<boolean> {
  const updates = [];
  const values = [];
  
  // Indicateur si nous devons recalculer percentage_grade
  let shouldCalculatePercentageGrade = false;

  if (data.points_earned !== undefined) {
    updates.push('points_earned = ?');
    // Traiter spécifiquement le cas où points_earned est null
    values.push(data.points_earned === null ? null : JSON.stringify(data.points_earned));
  }

  if (data.content !== undefined) {
    updates.push('content = ?');
    values.push(data.content);
  }

  if (data.content_data !== undefined) {
    updates.push('content_data = ?');
    values.push(data.content_data !== null ? JSON.stringify(data.content_data) : null);
  }

  if (data.submission_date !== undefined) {
    updates.push('submission_date = ?');
    values.push(data.submission_date);
  }

  if (data.penalty !== undefined) {
    updates.push('penalty = ?');
    values.push(data.penalty);
  }

  if (data.bonus !== undefined) {
    updates.push('bonus = ?');
    values.push(data.bonus);
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
    shouldCalculatePercentageGrade = true; // Déclencher le recalcul
  }

  if (data.status !== undefined) {
    updates.push('status = ?');
    values.push(data.status);
  }

  if (data.disabled_parts !== undefined) {
    updates.push('disabled_parts = ?');
    values.push(data.disabled_parts !== null ? JSON.stringify(data.disabled_parts) : null);
    shouldCalculatePercentageGrade = true; // Déclencher le recalcul car les parties ont changé
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

  // Si la mise à jour a réussi et qu'on doit recalculer percentage_grade
  if (result.affectedRows > 0 && shouldCalculatePercentageGrade) {
    try {
      // Récupérer la correction mise à jour pour avoir final_grade et disabled_parts
      const updatedCorrection = await getCorrectionAutreById(id);
      if (updatedCorrection) {
        // Récupérer l'activité pour avoir les points
        const { getActivityAutreById } = await import('@/lib/activityAutre');
        const activity = await getActivityAutreById(updatedCorrection.activity_id);
        
        if (activity && activity.points) {
          // Utiliser les disabled_parts mis à jour ou existants
          const disabledParts = data.disabled_parts !== undefined ? 
            data.disabled_parts : 
            updatedCorrection.disabled_parts;
          
          // Calculer et mettre à jour percentage_grade
          const percentageGrade = calculatePercentageGrade(
            updatedCorrection.final_grade ?? null,
            activity.points,
            disabledParts ?? null
          );
          
          // Mettre à jour percentage_grade dans la base de données
          if (percentageGrade !== null) {
            await query(
              `UPDATE corrections_autres SET percentage_grade = ? WHERE id = ?`,
              [percentageGrade, id]
            );
          }
        }
      }
    } catch (error) {
      console.error('Error calculating percentage_grade:', error);
      // Ne pas faire échouer la mise à jour principale pour cette erreur
    }
  }

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
 * Valide qu'une valeur respecte les contraintes de la base de données decimal(4,2)
 * Les colonnes grade, penalty, bonus, final_grade ont une limite max de 99.99
 */
export function validateGradeConstraint(value: number | null | undefined, fieldName: string = 'value'): number {
  if (value === null || value === undefined) {
    return 0;
  }
  
  const numValue = Number(value);
  if (isNaN(numValue)) {
    return 0;
  }
  
  // Contrainte de la base de données: decimal(4,2) max = 99.99
  const MAX_DB_VALUE = 99.99;
  
  if (numValue > MAX_DB_VALUE) {
    console.warn(`${fieldName} value ${numValue} exceeds database constraint (max: ${MAX_DB_VALUE}). Capping to ${MAX_DB_VALUE}.`);
    return MAX_DB_VALUE;
  }
  
  if (numValue < 0) {
    console.warn(`${fieldName} value ${numValue} is negative. Setting to 0.`);
    return 0;
  }
  
  // Arrondir à 2 décimales pour correspondre au format decimal(4,2)
  return Math.round(numValue * 100) / 100;
}

/**
 * Calcul de la note globale
 * En fonction des points obtenus pour chaque partie, de l'activité, de la pénalité et du bonus éventuels
 */
export function calculateGrade(
  activityPoints: number[],
  points_earned: number[],
  penalty: number | null | undefined = 0,
  bonus: number | null | undefined = 0,
  disabledParts?: boolean[]
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
  // en excluant les parties désactivées
  let totalEarned = 0;
  let totalPossible = 0;
  
  for (let i = 0; i < points_earned.length; i++) {
    // Exclure les parties désactivées du calcul
    if (disabledParts && disabledParts[i]) {
      continue;
    }
    totalEarned += points_earned[i] || 0;
    totalPossible += total_points[i] || 0;
  }
  
  
  // Éviter la division par zéro
  if (totalPossible === 0) {
    return { grade: 0, final_grade: 0 };
  }
  
  // Calculer la note sur le barème total
  const rawGrade = totalEarned;
  
  // Arrondir à 2 décimales et valider les contraintes
  const grade = validateGradeConstraint(rawGrade, 'grade');
  
  // Calculer la note finale en appliquant la pénalité et le bonus selon les règles spécifiques:
  // 1. Si la note est inférieure à 5, on garde cette note
  // 2. Sinon, on prend le maximum entre (note - pénalité + bonus) et 5
  const actualPenalty = validateGradeConstraint(penalty, 'penalty');
  const actualBonus = validateGradeConstraint(bonus, 'bonus');
  
  let final_grade;
  if (grade < 5) {
    // Si la note est inférieure à 5, on conserve la note initiale mais on peut appliquer le bonus
    final_grade = Math.max(grade + actualBonus, grade);
  } else {
    // Sinon, on applique la pénalité et le bonus mais ne descend pas en dessous de 5
    final_grade = Math.max(5, grade - actualPenalty + actualBonus);
  }
  
  // Valider les contraintes pour la note finale
  final_grade = validateGradeConstraint(final_grade, 'final_grade');
  
  return { grade, final_grade };
}

/**
 * Calcule le percentage_grade basé sur final_grade et les parties actives
 * @param finalGrade - Note finale avec bonus/pénalités appliquées
 * @param activityPoints - Tableau des points de l'activité
 * @param disabledParts - Parties désactivées
 * @returns percentage_grade (0-100) ou null si calcul impossible
 */
export function calculatePercentageGrade(
  finalGrade: number | null,
  activityPoints: number[],
  disabledParts: boolean[] | null
): number | null {
  if (finalGrade === null || finalGrade === undefined) {
    return null;
  }

  if (!activityPoints || activityPoints.length === 0) {
    return null;
  }

  // Calculer le total des points des parties actives
  let totalActivePoints = 0;
  activityPoints.forEach((points, index) => {
    if (!disabledParts || !disabledParts[index]) {
      totalActivePoints += points || 0;
    }
  });

  if (totalActivePoints <= 0) {
    return null;
  }

  // Calculer le pourcentage : (final_grade / total_parties_actives) * 100
  const percentage = (finalGrade / totalActivePoints) * 100;
  
  // Limiter à 100% maximum et arrondir à 2 décimales
  return Math.min(Math.round(percentage * 100) / 100, 100);
}

/**
 * Met à jour le champ percentage_grade d'une correction
 * @param correctionId - ID de la correction
 * @param finalGrade - Note finale
 * @param activityPoints - Points de l'activité
 * @param disabledParts - Parties désactivées
 */
export async function updatePercentageGrade(
  correctionId: number,
  finalGrade: number | null,
  activityPoints: number[],
  disabledParts: boolean[] | null
): Promise<void> {
  const percentageGrade = calculatePercentageGrade(finalGrade, activityPoints, disabledParts);
  
  await query(
    `UPDATE corrections_autres 
     SET percentage_grade = ? 
     WHERE id = ?`,
    [percentageGrade, correctionId]
  );
}

/**
 * Recalcule et met à jour le percentage_grade pour toutes les corrections
 * Utilise lors de migrations ou corrections en masse
 */
export async function recalculateAllPercentageGrades(): Promise<void> {
  // Récupérer toutes les corrections avec leurs activités
  const corrections = await query<any[]>(`
    SELECT 
      ca.id,
      ca.final_grade,
      ca.disabled_parts,
      aa.points
    FROM corrections_autres ca
    JOIN activities_autres aa ON ca.activity_id = aa.id
    WHERE ca.final_grade IS NOT NULL
  `);

  for (const correction of corrections) {
    const activityPoints = parsePointsEarned(correction.points);
    const disabledParts = parseDisabledParts(correction.disabled_parts);
    
    await updatePercentageGrade(
      correction.id,
      correction.final_grade,
      activityPoints,
      disabledParts
    );
  }
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
  
  // Requête séparée pour récupérer tous les points_earned et disabled_parts
  const pointsQuery = `
    SELECT 
      c.points_earned,
      c.disabled_parts
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
  
  // Traiter chaque résultat de points_earned individuellement en excluant les parties désactivées
  if (pointsResults && pointsResults.length > 0) {
    allPointsEarned = pointsResults
      .map(row => {
        // Utiliser notre fonction utilitaire pour parser les points_earned
        const pointsEarned = parsePointsEarned(row.points_earned);
        const disabledParts = parseDisabledParts(row.disabled_parts);
        
        // Si des parties sont désactivées, les exclure du calcul
        if (disabledParts && Array.isArray(pointsEarned)) {
          return pointsEarned.map((points, index) => 
            disabledParts[index] ? 0 : points
          );
        }
        
        return pointsEarned;
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

/**
 * Fonction utilitaire pour parser correctement le champ disabled_parts
 * Gère les différents cas de figure (string JSON, déjà parsé, etc.)
 */
export function parseDisabledParts(disabledParts: any): boolean[] | null {
  // Si disabledParts est null ou undefined, on retourne null
  if (disabledParts === null || disabledParts === undefined) {
    return null;
  }
  
  // Si disabledParts est déjà un tableau, on le retourne tel quel
  if (Array.isArray(disabledParts)) {
    return disabledParts;
  }
  
  // Si disabledParts est une chaîne JSON, on la parse
  if (typeof disabledParts === 'string') {
    try {
      const parsed = JSON.parse(disabledParts);
      
      // Vérifier que le résultat est bien un tableau
      if (Array.isArray(parsed)) {
        return parsed;
      } else {
        console.error('Le JSON parsé pour disabled_parts n\'est pas un tableau:', parsed);
        return null;
      }
    } catch (error) {
      console.error('Erreur lors du parsing de disabled_parts:', error);
      return null;
    }
  }
  
  // Cas par défaut, on retourne null
  console.error('Format de disabled_parts non reconnu:', disabledParts);
  return null;
}