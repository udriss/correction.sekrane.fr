import { withConnection } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export interface FeedbackNotification {
  id: number;
  log_id: number;
  text: string;
  student_name: string;
  student_id: number;
  activity_name: string;
  activity_id: number;
  correction_id: number;
  grade: number;
  final_grade: number;
  share_code: string;
  viewed_at: Date;
  readOk: boolean;
  metadata?: any;
  action_type: string; // Ajout de cette propriété
  points?: number;    // Ajout de cette propriété
}

/**
 * Récupère les notifications de feedback consultés par les étudiants
 * @param limit Nombre maximum de notifications à récupérer
 * @param includeRead Inclure les notifications déjà lues
 * @returns Liste des notifications de feedback
 */
export async function getFeedbackNotifications(limit = 10, includeRead = false): Promise<FeedbackNotification[]> {
  return withConnection(async (connection) => {
    try {
      const readFilter = includeRead ? '' : 'AND n.readOk = FALSE';
      
      const [notifications] = await connection.query(
        `SELECT 
          n.id,
          n.log_id,
          n.text,
          l.metadata->>'$.student_name' as student_name,
          JSON_EXTRACT(l.metadata, '$.student_id') as student_id,
          l.metadata->>'$.activity_name' as activity_name,
          JSON_EXTRACT(l.metadata, '$.activity_id') as activity_id,
          JSON_EXTRACT(l.metadata, '$.correction_id') as correction_id,
          l.metadata->>'$.grade' as grade,
          l.metadata->>'$.final_grade' as final_grade,
          l.metadata->>'$.share_code' as share_code,
          l.metadata->>'$.points' as points,
          l.created_at as viewed_at,
          n.readOk,
          l.metadata,
          l.action_type
        FROM 
          feedback_notifications n
        JOIN 
          system_logs l ON n.log_id = l.id
        WHERE 
          l.action_type IN ('VIEW_FEEDBACK', 'VIEW_STUDENT_CORRECTIONS')
          ${readFilter}
        ORDER BY 
          l.created_at DESC
        LIMIT ?`,
        [limit]
      );
      
      return Array.isArray(notifications) ? notifications as FeedbackNotification[] : [];
    } catch (error) {
      console.error('Error fetching feedback notifications:', error);
      return [];
    }
  });
}

/**
 * Ajoute une nouvelle notification de feedback
 * @param logId ID de l'entrée de log
 * @returns ID de la notification créée
 */
export async function createFeedbackNotification(logId: number): Promise<number | null> {
  return withConnection(async (connection) => {
    // Récupérer le log
    const [logs] = await connection.query(
      `SELECT * FROM system_logs WHERE id = ?`,
      [logId]
    );
    if (!Array.isArray(logs) || logs.length === 0) return null;
    const log = logs[0] as RowDataPacket & { action_type: string; metadata?: any; description?: string };

    // Générer le texte de notification selon le type d'action
    let notificationText = '';
    if (log.action_type === 'VIEW_FEEDBACK') {
      notificationText = `L'étudiant ${log.metadata?.student_name || ''} a consulté son feedback.`;
    } else if (log.action_type === 'VIEW_STUDENT_CORRECTIONS') {
      notificationText = `L'étudiant ${log.metadata?.student_name || ''} a visité sa page de correction.`;
    } else {
      notificationText = log.description || '';
    }

    // Créer la notification
    const [result] = await connection.query(
      `INSERT INTO feedback_notifications (log_id, text, readOk) VALUES (?, ?, FALSE)`,
      [logId, notificationText]
    );
    return (result as any).insertId || null;
  });
}

/**
 * Marque une notification comme lue
 * @param notificationId ID de la notification
 * @returns Succès de l'opération
 */
export async function markNotificationAsRead(notificationId: number): Promise<boolean> {
  return withConnection(async (connection) => {
    try {
      await connection.query(
        `UPDATE feedback_notifications SET readOk = TRUE WHERE id = ?`,
        [notificationId]
      );
      
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  });
}

/**
 * Marque toutes les notifications comme lues
 * @returns Succès de l'opération
 */
export async function markAllNotificationsAsRead(): Promise<boolean> {
  return withConnection(async (connection) => {
    try {
      await connection.query(
        `UPDATE feedback_notifications SET readOk = TRUE WHERE readOk = FALSE`
      );
      
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  });
}

/**
 * Compte le nombre de notifications non lues
 * @returns Nombre de notifications non lues
 */
export async function countUnreadNotifications(): Promise<number> {
  return withConnection(async (connection) => {
    try {
      const [result] = await connection.query(
        `SELECT COUNT(*) as count FROM feedback_notifications n
         JOIN system_logs l ON n.log_id = l.id
         WHERE n.readOk = FALSE
         AND l.action_type IN ('VIEW_FEEDBACK', 'VIEW_STUDENT_CORRECTIONS')`
      );
      
      if (!Array.isArray(result) || result.length === 0) {
        return 0;
      }
      
      return (result[0] as any).count || 0;
    } catch (error) {
      console.error('Error counting unread notifications:', error);
      return 0;
    }
  });
}

/**
 * Compte le nombre total de notifications
 * @returns Nombre total de notifications
 */
export async function countTotalNotifications(): Promise<number> {
  return withConnection(async (connection) => {
    try {
      const [result] = await connection.query(
        `SELECT COUNT(*) as total FROM feedback_notifications n
         JOIN system_logs l ON n.log_id = l.id
         WHERE l.action_type IN ('VIEW_FEEDBACK', 'VIEW_STUDENT_CORRECTIONS')`
      );
      
      if (!Array.isArray(result) || result.length === 0) {
        return 0;
      }
      
      return (result[0] as any).total || 0;
    } catch (error) {
      console.error('Error counting total notifications:', error);
      return 0;
    }
  });
}

/**
 * Fonction d'optimisation pour compter à la fois les notifications non lues et totales
 * en utilisant une seule connexion à la base de données au lieu de deux
 */
export async function countBothNotifications(): Promise<[number, number]> {
  return withConnection(async (connection) => {
    try {
      // Exécuter les deux requêtes dans la même connexion
      const [unreadResult] = await connection.query(
        `SELECT COUNT(*) as count FROM feedback_notifications n
         JOIN system_logs l ON n.log_id = l.id
         WHERE n.readOk = FALSE
         AND l.action_type IN ('VIEW_FEEDBACK', 'VIEW_STUDENT_CORRECTIONS')`
      );
      
      const [totalResult] = await connection.query(
        `SELECT COUNT(*) as total FROM feedback_notifications n
         JOIN system_logs l ON n.log_id = l.id
         WHERE l.action_type IN ('VIEW_FEEDBACK', 'VIEW_STUDENT_CORRECTIONS')`
      );
      
      const unreadCount = Array.isArray(unreadResult) && unreadResult.length > 0 
        ? (unreadResult[0] as any).count || 0 
        : 0;
        
      const totalCount = Array.isArray(totalResult) && totalResult.length > 0 
        ? (totalResult[0] as any).total || 0 
        : 0;
        
      return [unreadCount, totalCount];
    } catch (error) {
      console.error('Error counting notifications:', error);
      return [0, 0];
    }
  });
}