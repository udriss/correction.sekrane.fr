import { withConnection } from './db';
import { RowDataPacket, ResultSetHeader, PoolConnection } from 'mysql2/promise';

export interface Fragment {
  id?: number;
  activity_id: number;
  content: string;
  position_order?: number;
  created_at?: Date;
  updated_at?: Date;
  category?: string; // Added missing category field used in FragmentsList
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
    
    const typedResult = result as ResultSetHeader;
    return typedResult.insertId;
  });
}

// Récupérer les fragments par ID d'activité - Version corrigée avec withConnection
export async function getFragmentsByActivityId(activityId: number): Promise<Fragment[]> {
  return withConnection(async (connection) => {
    const [rows] = await connection.execute<RowDataPacket[]>(
      'SELECT * FROM fragments WHERE activity_id = ? ORDER BY position_order, id',
      [activityId]
    );
    return rows as Fragment[];
  });
}

// Obtenir un fragment par ID
export async function getFragmentById(id: number): Promise<Fragment | null> {
  return withConnection(async (connection) => {
    const [rows] = await connection.query<RowDataPacket[]>(
      'SELECT * FROM fragments WHERE id = ?',
      [id]
    );
    
    return rows.length ? rows[0] as Fragment : null;
  });
}

// Mettre à jour un fragment
export async function updateFragment(id: number, content: string): Promise<boolean> {
  return withConnection(async (connection) => {
    const [result] = await connection.query<ResultSetHeader>(
      'UPDATE fragments SET content = ? WHERE id = ?',
      [content, id]
    );
    
    return result.affectedRows > 0;
  });
}

// Supprimer un fragment
export async function deleteFragment(id: number): Promise<boolean> {
  return withConnection(async (connection) => {
    const [result] = await connection.query<ResultSetHeader>(
      'DELETE FROM fragments WHERE id = ?',
      [id]
    );
    
    return result.affectedRows > 0;
  });
}

// Fonction pour réordonner plusieurs fragments en une seule transaction
export async function reorderFragments(fragmentOrders: { id: number, position: number }[]): Promise<boolean> {
  return withConnection(async (connection) => {
    try {
      // Démarrer une transaction pour s'assurer que toutes les mises à jour sont atomiques
      await connection.beginTransaction();
      
      // Mettre à jour la position de chaque fragment
      for (const fragment of fragmentOrders) {
        await connection.query(
          'UPDATE fragments SET position_order = ? WHERE id = ?',
          [fragment.position, fragment.id]
        );
      }
      
      // Valider les modifications
      await connection.commit();
      return true;
    } catch (error) {
      // Annuler en cas d'erreur
      await connection.rollback();
      console.error('Error reordering fragments:', error);
      throw error;
    }
  });
}