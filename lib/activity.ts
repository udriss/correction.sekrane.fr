import { getPool } from './db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface Activity {
  id?: number;
  name: string;
  content?: string;
  created_at?: string | null;
  updated_at?: string | null;
  experimental_points: number;
  theoretical_points: number;
  user_id: number; // Ajout du champ user_id pour associer l'activité à un utilisateur
}

export async function createActivity(activity: Activity): Promise<number> {
  const pool = getPool();
  let connection;
  try {
    connection = await pool.getConnection();
    const [result] = await connection.execute<ResultSetHeader>(
      'INSERT INTO activities (name, content, experimental_points, theoretical_points, user_id) VALUES (?, ?, ?, ?, ?)',
      [
        activity.name, 
        activity.content || null, 
        activity.experimental_points || 5, 
        activity.theoretical_points || 15,
        activity.user_id // Utiliser l'ID de l'utilisateur
      ]
    );
    return result.insertId;
  } catch (error) {
    console.error('Error creating activity:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

export async function getActivities(userId: number): Promise<Activity[]> {
  const pool = getPool();
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.execute<RowDataPacket[]>(
      'SELECT * FROM activities WHERE user_id = ? ORDER BY created_at DESC',
      [userId] // Filtrer par user_id
    );
    return rows as Activity[];
  } catch (error) {
    console.error('Error fetching activities:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

export async function getActivityById(id: number, userId?: number): Promise<Activity | null> {
  const pool = getPool();
  let connection;
  try {
    connection = await pool.getConnection();
    
    // Requête conditionnelle selon que userId est défini ou non
    if (userId !== undefined) {
      const [rows] = await connection.execute<RowDataPacket[]>(
        'SELECT * FROM activities WHERE id = ? AND user_id = ?',
        [id, userId]
      );
      return rows.length > 0 ? rows[0] as Activity : null;
    } else {
      // Fallback pour la compatibilité rétroactive - récupérer l'activité sans vérifier l'utilisateur
      const [rows] = await connection.execute<RowDataPacket[]>(
        'SELECT * FROM activities WHERE id = ?',
        [id]
      );
      return rows.length > 0 ? rows[0] as Activity : null;
    }
  } catch (error) {
    console.error('Error fetching activity by ID:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

export async function updateActivity(id: number, activity: Activity): Promise<boolean> {
  const pool = getPool();
  let connection;
  try {
    connection = await pool.getConnection();
    const [result] = await connection.execute<ResultSetHeader>(
      'UPDATE activities SET name = ?, content = ?, experimental_points = ?, theoretical_points = ? WHERE id = ?',
      [
        activity.name, 
        activity.content || null, 
        activity.experimental_points || 5, 
        activity.theoretical_points || 15, 
        id
      ]
    );
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error updating activity:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

export async function deleteActivity(id: number): Promise<boolean> {
  const pool = getPool();
  let connection;
  try {
    connection = await pool.getConnection();
    const [result] = await connection.execute<ResultSetHeader>(
      'DELETE FROM activities WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error deleting activity:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}
