import { withConnection } from './db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { Correction as CorrectionType } from './types';

export type Correction = CorrectionType;

export async function createCorrection(data: {
  activity_id: number;
  student_id: number | null;
  content: string | null;
  group_id?: number; // Make group_id optional in the function parameters
}) {
  return await withConnection(async (connection) => {
    // Add group_id to the insertion with default 0 if not provided
    const [result] = await connection.query(
      `INSERT INTO corrections 
       (activity_id, student_id, content, group_id) 
       VALUES (?, ?, ?, ?)`,
      [
        data.activity_id,
        data.student_id,
        data.content,
        data.group_id || 0 // Default to 0 if not provided
      ]
    );
    
    return (result as any).insertId;
  });
}

export async function getCorrectionsByActivityId(activityId: number): Promise<CorrectionType[]> {
  return withConnection(async (connection) => {
    const [rows] = await connection.execute<RowDataPacket[]>(
      `SELECT c.*, a.name as activity_name, 
       CONCAT(s.first_name, ' ', s.last_name) as student_name
       FROM corrections c 
       JOIN activities a ON c.activity_id = a.id 
       LEFT JOIN students s ON c.student_id = s.id
       WHERE c.activity_id = ? 
       ORDER BY c.created_at DESC`,
      [activityId]
    );
    
    return rows as CorrectionType[];
  });
}

export async function getCorrectionById(id: number): Promise<CorrectionType | null> {
  try {
    return await withConnection(async (connection) => {
      const [rows] = await connection.execute<RowDataPacket[]>(
        `SELECT c.*, a.name as activity_name,
         CONCAT(s.first_name, ' ', s.last_name) as student_name
         FROM corrections c 
         JOIN activities a ON c.activity_id = a.id 
         LEFT JOIN students s ON c.student_id = s.id
         WHERE c.id = ?`,
        [id]
      );
      
      if (!Array.isArray(rows) || rows.length === 0) {
        return null;
      }
      
      const correction = rows[0] as any;
      
      // Traiter content_data si présent
      if (correction.content_data && typeof correction.content_data === 'string') {
        try {
          correction.content_data = JSON.parse(correction.content_data);
        } catch (e) {
          console.error('Erreur lors du parsing de content_data:', e);
          correction.content_data = { fragments: [] };
        }
      }
      
      return correction as CorrectionType;
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la correction:', error);
    throw error;
  }
}

export async function updateCorrection(id: number, data: CorrectionType): Promise<boolean> {
  return withConnection(async (connection) => {
    const { activity_id, student_id, content, content_data } = data;
    
    // Convertir content_data en JSON si nécessaire
    const contentDataJson = content_data ? JSON.stringify(content_data) : null;
    
    const [result] = await connection.query(
      `UPDATE corrections 
       SET activity_id = ?, student_id = ?, content = ?, content_data = ?
       WHERE id = ?`,
      [activity_id, student_id, content, contentDataJson, id]
    );
    
    const resultObj = result as { affectedRows: number };
    return resultObj.affectedRows > 0;
  }).catch((error) => {
    console.error('Error updating correction:', error);
    return false;
  });
}

// Function to update just the student ID (more efficient)
export async function updateCorrectionStudentId(id: number, student_id: number): Promise<boolean> {
  return withConnection(async (connection) => {
    const [result] = await connection.execute<ResultSetHeader>(
      'UPDATE corrections SET student_id = ? WHERE id = ?',
      [student_id, id]
    );
    return result.affectedRows > 0;
  });
}

export async function deleteCorrection(id: number): Promise<boolean> {
  return withConnection(async (connection) => {
    const [result] = await connection.execute<ResultSetHeader>(
      'DELETE FROM corrections WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  });
}

// Generate a default name based on activity and timestamp
export async function generateCorrectionName(activityId: number): Promise<string> {
  return withConnection(async (connection) => {
    const [rows] = await connection.execute<RowDataPacket[]>(
      'SELECT name FROM activities WHERE id = ?',
      [activityId]
    );
    
    if (rows.length === 0) return `Correction ${new Date().toISOString()}`;
    
    const activityName = rows[0].name;
    const timestamp = new Date().toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    return `${activityName} - ${timestamp}`;
  });
}

// Nouvelle fonction pour obtenir les statistiques des corrections par activité
export async function getCorrectionStatsByActivity(activityId: number): Promise<any> {
  return withConnection(async (connection) => {
    const [stats] = await connection.query<RowDataPacket[]>(
      `SELECT 
        COUNT(*) as total_corrections,
        AVG(grade) as average_grade,
        MIN(grade) as min_grade,
        MAX(grade) as max_grade,
        SUM(CASE WHEN grade IS NOT NULL THEN 1 ELSE 0 END) as graded_corrections
      FROM corrections 
      WHERE activity_id = ?`,
      [activityId]
    );
    
    return stats[0];
  });
}

// Fonction pour obtenir les corrections par groupe
export async function getCorrectionsByGroup(groupId: number): Promise<CorrectionType[]> {
  return withConnection(async (connection) => {
    const [rows] = await connection.query(
      `SELECT c.*, a.name as activity_name,
       CONCAT(s.first_name, ' ', s.last_name) as student_name
       FROM corrections c 
       JOIN group_corrections gc ON c.id = gc.correction_id
       JOIN activities a ON c.activity_id = a.id 
       LEFT JOIN students s ON c.student_id = s.id
       WHERE gc.group_id = ? 
       ORDER BY c.created_at DESC`,
      [groupId]
    );
    
    return rows as CorrectionType[];
  });
}

// Fonction pour ajouter une correction à un groupe
export async function addCorrectionToGroup(correctionId: number, groupId: number): Promise<boolean> {
  return withConnection(async (connection) => {
    try {
      // Vérifier d'abord si la relation existe déjà
      const [existingRows] = await connection.query(
        'SELECT 1 FROM group_corrections WHERE correction_id = ? AND group_id = ?',
        [correctionId, groupId]
      );
      
      if (Array.isArray(existingRows) && existingRows.length > 0) {
        // La relation existe déjà, pas besoin de l'ajouter à nouveau
        return true;
      }
      
      // La relation n'existe pas, l'ajouter
      const [result] = await connection.execute(
        'INSERT INTO group_corrections (correction_id, group_id) VALUES (?, ?)',
        [correctionId, groupId]
      );
      
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'ajout d\'une correction au groupe:', error);
      return false;
    }
  });
}

// Fonction pour supprimer une correction d'un groupe
export async function removeCorrectionFromGroup(correctionId: number, groupId: number): Promise<boolean> {
  return withConnection(async (connection) => {
    const [result] = await connection.execute(
      'DELETE FROM group_corrections WHERE correction_id = ? AND group_id = ?',
      [correctionId, groupId]
    );
    
    return (result as any).affectedRows > 0;
  });
}

// Fonction pour générer un rapport PDF des corrections
export async function getCorrectionsForPdfReport(groupId: number): Promise<any[]> {
  return withConnection(async (connection) => {
    const [rows] = await connection.query(
      `SELECT 
        c.id, c.student_id, CONCAT(s.first_name, ' ', s.last_name) as student_name, 
        c.grade, c.experimental_points_earned, 
        c.theoretical_points_earned, c.penalty, a.name as activity_name,
        a.experimental_points as max_experimental_points,
        a.theoretical_points as max_theoretical_points,
        (c.grade - c.penalty) as final_grade
       FROM corrections c 
       JOIN group_corrections gc ON c.id = gc.correction_id
       JOIN activities a ON c.activity_id = a.id 
       LEFT JOIN students s ON c.student_id = s.id
       WHERE gc.group_id = ? 
       ORDER BY s.last_name, s.first_name`,
      [groupId]
    );
    
    return rows as any[];
  });
}