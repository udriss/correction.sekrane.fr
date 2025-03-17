import { getPool } from './db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface Fragment {
  id?: number;
  activity_id: number;
  content: string;
  position_order?: number;
  created_at?: Date;
  updated_at?: Date;
}

export async function updateFragmentPosition(fragmentId: number, newPosition: number): Promise<boolean> {
  const pool = getPool();
  try {
    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE fragments SET position_order = ? WHERE id = ?',
      [newPosition, fragmentId]
    );
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error updating fragment position:', error);
    return false;
  }
}

export async function createFragment(fragment: Fragment): Promise<number> {
  const pool = getPool();
  const [result] = await pool.execute<ResultSetHeader>(
    'INSERT INTO fragments (activity_id, content) VALUES (?, ?)',
    [fragment.activity_id, fragment.content]
  );
  
  return result.insertId;
}

export async function getFragmentsByActivityId(activityId: number): Promise<Fragment[]> {
  const pool = getPool();
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.execute<RowDataPacket[]>(
      'SELECT * FROM fragments WHERE activity_id = ? ORDER BY position_order, id',
      [activityId]
    );
    return rows as Fragment[];
  } catch (error) {
    console.error('Error fetching fragments:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

export async function getFragmentById(id: number): Promise<Fragment | null> {
  const pool = getPool();
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT * FROM fragments WHERE id = ?',
    [id]
  );
  
  return rows.length > 0 ? rows[0] as Fragment : null;
}

export async function updateFragment(id: number, content: string): Promise<boolean> {
  const pool = getPool();
  const [result] = await pool.execute<ResultSetHeader>(
    'UPDATE fragments SET content = ? WHERE id = ?',
    [content, id]
  );
  
  return result.affectedRows > 0;
}

export async function deleteFragment(id: number): Promise<boolean> {
  const pool = getPool();
  const [result] = await pool.execute<ResultSetHeader>(
    'DELETE FROM fragments WHERE id = ?',
    [id]
  );
  
  return result.affectedRows > 0;
}


