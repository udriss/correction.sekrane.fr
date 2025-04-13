import { withConnection } from './db';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

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
  return withConnection(async (connection) => {
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
  });
}

export async function getActivities(): Promise<Activity[]> {
  return withConnection(async (connection) => {
    const [rows] = await connection.execute<RowDataPacket[]>(
      'SELECT * FROM activities ORDER BY created_at DESC'
    );
    return rows as Activity[];
  });
}

export async function getActivityById(id: number, userId?: number): Promise<Activity | null> {
  return withConnection(async (connection) => {
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
  });
}

export async function updateActivity(id: number, activity: Activity): Promise<boolean> {
  return withConnection(async (connection) => {
    const [result] = await connection.execute<ResultSetHeader>(
      'UPDATE activities SET name = ?, content = ?, experimental_points = ?, theoretical_points = ? WHERE id = ? AND user_id = ?',
      [
        activity.name, 
        activity.content || null, 
        activity.experimental_points || 5, 
        activity.theoretical_points || 15, 
        id,
        activity.user_id // Ajout de la vérification du user_id pour plus de sécurité
      ]
    );
    return result.affectedRows > 0;
  });
}

export async function deleteActivity(id: number, userId?: number): Promise<boolean> {
  return withConnection(async (connection) => {
    // Si un userId est fourni, ajouter une condition pour s'assurer que l'utilisateur ne peut supprimer que ses propres activités
    let query = 'DELETE FROM activities WHERE id = ?';
    let params = [id];
    
    if (userId !== undefined) {
      query = 'DELETE FROM activities WHERE id = ? AND user_id = ?';
      params.push(userId);
    }
    
    const [result] = await connection.execute<ResultSetHeader>(query, params);
    return result.affectedRows > 0;
  });
}

// Nouvelle fonction pour obtenir les statistiques d'une activité
export async function getActivityStats(activityId: number): Promise<any> {
  return withConnection(async (connection) => {
    const [correctionStats] = await connection.execute<RowDataPacket[]>(
      `SELECT 
        COUNT(*) as total_corrections,
        AVG(grade) as average_grade,
        SUM(CASE WHEN grade IS NOT NULL THEN 1 ELSE 0 END) as graded_corrections
      FROM corrections 
      WHERE activity_id = ?`,
      [activityId]
    );
    
    const [groupStats] = await connection.execute<RowDataPacket[]>(
      `SELECT 
        COUNT(*) as total_groups
      FROM groups 
      WHERE activity_id = ?`,
      [activityId]
    );
    
    return {
      corrections: correctionStats[0],
      groups: groupStats[0]
    };
  });
}

// Nouvelle fonction pour dupliquer une activité
export async function duplicateActivity(activityId: number, userId: number): Promise<number> {
  return withConnection(async (connection) => {
    // Commencer une transaction pour garantir l'intégrité des données
    await connection.beginTransaction();
    
    try {
      // 1. Récupérer les données de l'activité originale
      const [activityRows] = await connection.execute<RowDataPacket[]>(
        'SELECT * FROM activities WHERE id = ?',
        [activityId]
      );
      
      if (activityRows.length === 0) {
        throw new Error(`Activity with id ${activityId} not found`);
      }
      
      const originalActivity = activityRows[0] as Activity;
      
      // 2. Créer une copie de l'activité
      const [insertResult] = await connection.execute<ResultSetHeader>(
        'INSERT INTO activities (name, content, experimental_points, theoretical_points, user_id) VALUES (?, ?, ?, ?, ?)',
        [
          `${originalActivity.name} (copie)`,
          originalActivity.content,
          originalActivity.experimental_points,
          originalActivity.theoretical_points,
          userId // Utiliser l'ID de l'utilisateur qui effectue la duplication
        ]
      );
      
      const newActivityId = insertResult.insertId;
      
      // 3. Copier les fragments associés à l'activité
      const [fragmentRows] = await connection.execute<RowDataPacket[]>(
        'SELECT * FROM fragments WHERE activity_id = ? ORDER BY position_order',
        [activityId]
      );
      
      if (fragmentRows.length > 0) {
        // Préparer la requête d'insertion multiple pour les fragments
        const fragmentValues = fragmentRows.map(fragment => [
          newActivityId,
          fragment.content,
          fragment.position_order
        ]);
        
        const placeholders = fragmentValues.map(() => '(?, ?, ?)').join(', ');
        
        // Aplatir les valeurs pour la requête préparée
        const flatValues = fragmentValues.flat();
        
        await connection.execute(
          `INSERT INTO fragments (activity_id, content, position_order) VALUES ${placeholders}`,
          flatValues
        );
      }
      
      // Valider la transaction
      await connection.commit();
      
      return newActivityId;
    } catch (error) {
      // En cas d'erreur, annuler la transaction
      await connection.rollback();
      console.error('Error duplicating activity:', error);
      throw error;
    }
  });
}