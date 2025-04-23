import { withConnection } from '@/lib/db';

export interface SystemLogEntry {
  action_type: string;
  description: string;
  entity_type?: string;
  entity_id?: number;
  user_id?: number;
  username?: string;
  ip_address?: string;
  metadata?: any;
}

/**
 * Enregistre une entrée de log dans le système
 * @returns ID du log créé en cas de succès, false sinon
 */
export async function createLogEntry(logEntry: SystemLogEntry): Promise<number | boolean> {
  return withConnection(async (connection) => {
    try {
      // Préparer les données pour l'insertion
      const {
        action_type,
        description,
        entity_type,
        entity_id,
        user_id,
        username,
        ip_address,
        metadata
      } = logEntry;

      // Convertir les métadonnées en JSON si nécessaire
      const metadataJson = metadata ? JSON.stringify(metadata) : null;

      // Exécuter la requête d'insertion
      const [result] = await connection.query(
        `INSERT INTO system_logs 
        (action_type, description, entity_type, entity_id, user_id, username, ip_address, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [action_type, description, entity_type, entity_id, user_id, username, ip_address, metadataJson]
      );

      // Retourner l'ID du log créé
      if (result && 'insertId' in result) {
        return (result as any).insertId;
      }

      return true; // Retourne true pour compatibilité avec le code existant
    } catch (error) {
      console.error('Error creating log entry:', error);
      return false;
    }
  });
}

/**
 * Récupère les entrées de log du système avec pagination et filtres
 */
export async function getLogEntries({
  page = 1,
  limit = 50,
  actionType,
  entityType,
  entityId,
  userId,
  startDate,
  endDate,
  searchTerm
}: {
  page?: number;
  limit?: number;
  actionType?: string;
  entityType?: string;
  entityId?: number;
  userId?: number;
  startDate?: string;
  endDate?: string;
  searchTerm?: string;
}) {
  return withConnection(async (connection) => {
    try {
      // Calculer l'offset pour la pagination
      const offset = (page - 1) * limit;
      
      // Construire la requête avec les filtres
      let query = `SELECT * FROM system_logs WHERE 1=1`;
      const queryParams: any[] = [];
      
      // Ajouter les conditions de filtrage
      if (actionType) {
        query += ` AND action_type = ?`;
        queryParams.push(actionType);
      }
      
      if (entityType) {
        query += ` AND entity_type = ?`;
        queryParams.push(entityType);
      }
      
      if (entityId) {
        query += ` AND entity_id = ?`;
        queryParams.push(entityId);
      }
      
      if (userId) {
        query += ` AND user_id = ?`;
        queryParams.push(userId);
      }
      
      if (startDate) {
        query += ` AND created_at >= ?`;
        queryParams.push(startDate);
      }
      
      if (endDate) {
        query += ` AND created_at <= ?`;
        queryParams.push(endDate);
      }
      
      if (searchTerm) {
        query += ` AND (description LIKE ? OR action_type LIKE ? OR entity_type LIKE ? OR username LIKE ?)`;
        const searchPattern = `%${searchTerm}%`;
        queryParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
      }
      
      // Ajouter l'ordre et la pagination
      query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
      queryParams.push(limit, offset);
      
      // Exécuter la requête pour récupérer les logs
      const [logs] = await connection.query(query, queryParams);
      
      // Compter le nombre total de logs pour la pagination
      let countQuery = `SELECT COUNT(*) as total FROM system_logs WHERE 1=1`;
      const countParams = [...queryParams];
      countParams.pop(); // Retirer le LIMIT
      countParams.pop(); // Retirer l'OFFSET
      
      if (actionType) countQuery += ` AND action_type = ?`;
      if (entityType) countQuery += ` AND entity_type = ?`;
      if (entityId) countQuery += ` AND entity_id = ?`;
      if (userId) countQuery += ` AND user_id = ?`;
      if (startDate) countQuery += ` AND created_at >= ?`;
      if (endDate) countQuery += ` AND created_at <= ?`;
      if (searchTerm) {
        countQuery += ` AND (description LIKE ? OR action_type LIKE ? OR entity_type LIKE ? OR username LIKE ?)`;
      }
      
      const [countResult] = await connection.query(countQuery, countParams);
      
      // Traiter les résultats et renvoyer la réponse
      const total = Array.isArray(countResult) && countResult.length > 0 
        ? (countResult[0] as any).total 
        : 0;
      
      return {
        logs: Array.isArray(logs) ? logs : [],
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error fetching log entries:', error);
      throw error;
    }
  });
}

/**
 * Récupère les types d'actions et entités distincts pour les filtres
 */
export async function getLogFilterOptions() {
  return withConnection(async (connection) => {
    try {
      // Récupérer les types d'actions distincts
      const [actionTypes] = await connection.query(
        `SELECT DISTINCT action_type FROM system_logs ORDER BY action_type`
      );
      
      // Récupérer les types d'entités distincts
      const [entityTypes] = await connection.query(
        `SELECT DISTINCT entity_type FROM system_logs WHERE entity_type IS NOT NULL ORDER BY entity_type`
      );
      
      return {
        actionTypes: Array.isArray(actionTypes) 
          ? actionTypes.map((item: any) => item.action_type) 
          : [],
        entityTypes: Array.isArray(entityTypes) 
          ? entityTypes.map((item: any) => item.entity_type).filter(Boolean)
          : []
      };
    } catch (error) {
      console.error('Error fetching log filter options:', error);
      throw error;
    }
  });
}