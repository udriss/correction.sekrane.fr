import { query } from './db';

export interface CorrectionGroup {
  id?: number;
  activity_id: number;
  name: string;
  description?: string;
  created_at?: string;
}

export async function createCorrectionGroup(group: CorrectionGroup): Promise<number> {
  const result = await query<{ insertId: number }>(
    'INSERT INTO correction_groups (activity_id, name, description) VALUES (?, ?, ?)',
    [group.activity_id, group.name, group.description || null]
  );
  
  return result.insertId;
}

export async function addCorrectionsToGroup(groupId: number, correctionIds: number[]): Promise<boolean> {
  // Préparer les valeurs pour l'insertion multiple
  const values = correctionIds.map(correctionId => [groupId, correctionId]);
  const placeholders = correctionIds.map(() => '(?, ?)').join(', ');
  
  // Aplatir le tableau de valeurs
  const flatValues = values.flat();
  
  await query(
    `INSERT INTO correction_group_items (group_id, correction_id) VALUES ${placeholders}`,
    flatValues
  );
  
  return true;
}

export async function getGroupById(id: number): Promise<CorrectionGroup | null> {
  const results = await query<CorrectionGroup[]>(
    'SELECT * FROM correction_groups WHERE id = ?',
    [id]
  );
  
  return results.length ? results[0] : null;
}

export async function getCorrectionsByGroupId(groupId: number): Promise<any[]> {
  const results = await query<any[]>(
    `SELECT c.* 
     FROM corrections c
     JOIN correction_group_items cgi ON c.id = cgi.correction_id
     WHERE cgi.group_id = ?
     ORDER BY c.student_name`,
    [groupId]
  );
  
  return results;
}

export async function getGroupsByActivityId(activityId: number): Promise<CorrectionGroup[]> {
  const results = await query<CorrectionGroup[]>(
    'SELECT * FROM correction_groups WHERE activity_id = ? ORDER BY created_at DESC',
    [activityId]
  );
  
  return results;
}