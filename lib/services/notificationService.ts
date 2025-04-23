import { withConnection } from '@/lib/db';

export interface FeedbackNotification {
  id: number;
  log_id: number;
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
          l.metadata->>'$.student_name' as student_name,
          JSON_EXTRACT(l.metadata, '$.student_id') as student_id,
          l.metadata->>'$.activity_name' as activity_name,
          JSON_EXTRACT(l.metadata, '$.activity_id') as activity_id,
          JSON_EXTRACT(l.metadata, '$.correction_id') as correction_id,
          l.metadata->>'$.grade' as grade,
          l.metadata->>'$.final_grade' as final_grade,
          l.metadata->>'$.share_code' as share_code,
          l.created_at as viewed_at,
          n.readOk,
          l.metadata
        FROM 
          feedback_notifications n
        JOIN 
          system_logs l ON n.log_id = l.id
        WHERE 
          l.action_type = 'VIEW_FEEDBACK'
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
    try {
      // Vérifier si une notification existe déjà pour ce log
      const [existingNotification] = await connection.query(
        `SELECT id FROM feedback_notifications WHERE log_id = ?`,
        [logId]
      );
      
      if (Array.isArray(existingNotification) && existingNotification.length > 0) {
        return (existingNotification[0] as any).id;
      }
      
      // Créer une nouvelle notification
      const [result] = await connection.query(
        `INSERT INTO feedback_notifications (log_id, readOk) VALUES (?, FALSE)`,
        [logId]
      );
      
      if (!result || !(result as any).insertId) {
        return null;
      }
      
      return (result as any).insertId;
    } catch (error) {
      console.error('Error creating feedback notification:', error);
      return null;
    }
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
        `SELECT COUNT(*) as count FROM feedback_notifications WHERE readOk = FALSE`
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