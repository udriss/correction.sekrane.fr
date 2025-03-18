import { getPool, withConnection } from './db';
import { RowDataPacket, ResultSetHeader, PoolConnection } from 'mysql2/promise';

export interface Fragment {
  id?: number;
  activity_id: number;
  content: string;
  position_order?: number;
  created_at?: Date;
  updated_at?: Date;
}

// Mettre à jour la position d'un fragment
export async function updateFragmentPosition(
  fragmentId: number, 
  newPosition: number,
  existingConnection?: PoolConnection
): Promise<boolean> {
  try {
    // Si on a déjà une connexion (dans une transaction), l'utiliser
    // sinon créer une nouvelle connexion via withConnection
    if (existingConnection) {
      await existingConnection.query(
        'UPDATE fragments SET position_order = ? WHERE id = ?',
        [newPosition, fragmentId]
      );
      return true;
    } else {
      return withConnection(async (connection) => {
        const [result] = await connection.query(
          'UPDATE fragments SET position_order = ? WHERE id = ?',
          [newPosition, fragmentId]
        );
        return true;
      });
    }
  } catch (error) {
    console.error('Error updating fragment position:', error);
    return false;
  }
}

// Créer un nouveau fragment
export async function createFragment({ activity_id, content }: { activity_id: number, content: string }): Promise<number> {
  return withConnection(async (connection) => {
    const [result] = await connection.query(
      'INSERT INTO fragments (activity_id, content) VALUES (?, ?)',
      [activity_id, content]
    );
    
    // @ts-ignore
    return result.insertId;
  });
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

// Obtenir un fragment par ID
export async function getFragmentById(id: number): Promise<any> {
  return withConnection(async (connection) => {
    const [rows] = await connection.query(
      'SELECT * FROM fragments WHERE id = ?',
      [id]
    );
    
    // @ts-ignore
    return rows.length ? rows[0] : null;
  });
}

// Mettre à jour un fragment
export async function updateFragment(id: number, content: string): Promise<boolean> {
  return withConnection(async (connection) => {
    const [result] = await connection.query(
      'UPDATE fragments SET content = ? WHERE id = ?',
      [content, id]
    );
    
    // @ts-ignore
    return result.affectedRows > 0;
  });
}

// Supprimer un fragment
export async function deleteFragment(id: number): Promise<boolean> {
  return withConnection(async (connection) => {
    const [result] = await connection.query(
      'DELETE FROM fragments WHERE id = ?',
      [id]
    );
    
    // @ts-ignore
    return result.affectedRows > 0;
  });
}


