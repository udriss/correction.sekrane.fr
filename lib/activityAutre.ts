import { ContentCutOutlined } from '@mui/icons-material';
import { query } from './db';
import { ActivityAutre } from './types';

/**
 * Récupère toutes les activités avec parties dynamiques
 */
export async function getActivitiesAutres(userId: number): Promise<ActivityAutre[]> {
  const activities = await query<ActivityAutre[]>(`
    SELECT *
    FROM activities_autres
    WHERE user_id = ?
    ORDER BY created_at DESC
  `, [userId]);

  console.log('Activities:', activities);

  return activities.map(activity => ({
    ...activity,
    parts_names: activity.parts_names,
    points: activity.points
  }));
}


/**
 * Récupère une activité spécifique par son ID
 */
export async function getActivityAutreById(id: number): Promise<ActivityAutre | null> {
  const activities = await query<ActivityAutre[]>(`
    SELECT *
    FROM activities_autres
    WHERE id = ?
  `, [id]);
  
  if (activities.length === 0) {
    return null;
  }
  
  const activity = activities[0];
  return {
    ...activity,
    parts_names: activity.parts_names,
    points: activity.points
  };
}

/**
 * Crée une nouvelle activité avec parties dynamiques
 */
export async function createActivityAutre(data: {
  name: string;
  content: string | null;
  parts_names: string[];
  points: number[];
  user_id: number;
}): Promise<number> {
  const { name, content, parts_names, points, user_id } = data;
  
  const result = await query<{ insertId: number }>(
    `INSERT INTO activities_autres (
      name, 
      content, 
      parts_names,
      points,
      user_id,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      name,
      content,
      JSON.stringify(parts_names),
      JSON.stringify(points),
      user_id
    ]
  );
  
  return result.insertId;
}

/**
 * Met à jour une activité existante
 */
export async function updateActivityAutre(id: number, data: {
  name?: string;
  content?: string | null;
  parts_names?: string[];
  points?: number[];
  user_id?: number;
}): Promise<boolean> {
  const updates = [];
  const values = [];
  
  if (data.name !== undefined) {
    updates.push('name = ?');
    values.push(data.name);
  }
  
  if (data.content !== undefined) {
    updates.push('content = ?');
    values.push(data.content);
  }
  
  if (data.parts_names !== undefined) {
    updates.push('parts_names = ?');
    values.push(JSON.stringify(data.parts_names));
  }
  
  if (data.points !== undefined) {
    updates.push('points = ?');
    values.push(JSON.stringify(data.points));
  }
  
  if (data.user_id !== undefined) {
    updates.push('user_id = ?');
    values.push(data.user_id);
  }
  
  updates.push('updated_at = NOW()');
  
  if (updates.length === 0) {
    return false;
  }
  
  values.push(id);
  
  const result = await query<{affectedRows: number}>(
    `UPDATE activities_autres SET ${updates.join(', ')} WHERE id = ?`,
    values
  );
  
  return result.affectedRows > 0;
}

/**
 * Supprime une activité
 * @param id L'ID de l'activité à supprimer
 * @param userId L'ID de l'utilisateur qui effectue la suppression (pour vérifier les autorisations)
 */
export async function deleteActivityAutre(id: number, userId?: number): Promise<boolean> {
  let sqlQuery = 'DELETE FROM activities_autres WHERE id = ?';
  let params = [id];
  
  // Si un userId est fourni, vérifier que l'utilisateur est propriétaire de l'activité
  if (userId !== undefined) {
    sqlQuery = 'DELETE FROM activities_autres WHERE id = ? AND user_id = ?';
    params = [id, userId];
  }
  
  const result = await query<{affectedRows: number}>(sqlQuery, params);
  
  return result.affectedRows > 0;
}