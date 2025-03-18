import { getPool } from './db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { Correction as CorrectionType } from './types';

export type Correction = CorrectionType;

export async function createCorrection(correction: Partial<CorrectionType>): Promise<number> {
  const pool = getPool();
  const [result] = await pool.execute<ResultSetHeader>(
    'INSERT INTO corrections (activity_id, student_name, content) VALUES (?, ?, ?)',
    [correction.activity_id, correction.student_name || null, correction.content || null]
  );
  
  return result.insertId;
}

export async function getCorrectionsByActivityId(activityId: number): Promise<CorrectionType[]> {
  const pool = getPool();
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT c.*, a.name as activity_name 
     FROM corrections c 
     JOIN activities a ON c.activity_id = a.id 
     WHERE c.activity_id = ? 
     ORDER BY c.created_at DESC`,
    [activityId]
  );
  
  return rows as CorrectionType[];
}

export async function getCorrectionById(id: number): Promise<CorrectionType | null> {
  const pool = getPool();
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT c.*, a.name as activity_name 
     FROM corrections c 
     JOIN activities a ON c.activity_id = a.id 
     WHERE c.id = ?`,
    [id]
  );
  
  return rows.length > 0 ? rows[0] as CorrectionType : null;
}

export async function updateCorrection(id: number, data: CorrectionType): Promise<boolean> {
  try {
    const pool = getPool();
    const { activity_id, student_name, content, content_data } = data;
    
    // Convertir content_data en JSON si nécessaire
    const contentDataJson = content_data ? JSON.stringify(content_data) : null;
    
    const [result] = await pool.query(
      `UPDATE corrections 
       SET activity_id = ?, student_name = ?, content = ?, content_data = ?
       WHERE id = ?`,
      [activity_id, student_name, content, contentDataJson, id]
    );
    
    const resultObj = result as { affectedRows: number };
    return resultObj.affectedRows > 0;
  } catch (error) {
    console.error('Error updating correction:', error);
    return false;
  }
}

// Function to update just the student name (more efficient)
export async function updateCorrectionName(id: number, student_name: string): Promise<boolean> {
  const pool = getPool();
  let connection;
  try {
    connection = await pool.getConnection();
    const [result] = await connection.execute<ResultSetHeader>(
      'UPDATE corrections SET student_name = ? WHERE id = ?',
      [student_name, id]
    );
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error updating correction name:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

export async function deleteCorrection(id: number): Promise<boolean> {
  const pool = getPool();
  const [result] = await pool.execute<ResultSetHeader>(
    'DELETE FROM corrections WHERE id = ?',
    [id]
  );
  
  return result.affectedRows > 0;
}

// Generate a default name based on activity and timestamp
export async function generateCorrectionName(activityId: number): Promise<string> {
  const pool = getPool();
  const [rows] = await pool.execute<RowDataPacket[]>(
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
}
