// Create system_logs table migration
import { withConnection } from "@/lib/db";

export async function GET(request: Request) {
  return withConnection(async (connection) => {
    try {
      // Créer la table system_logs
      await connection.query(`
        CREATE TABLE IF NOT EXISTS system_logs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          action_type VARCHAR(50) NOT NULL,
          description TEXT NOT NULL,
          entity_type VARCHAR(50),
          entity_id INT,
          user_id INT,
          username VARCHAR(255),
          ip_address VARCHAR(50),
          metadata JSON,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      return new Response(JSON.stringify({ success: true, message: 'Table system_logs ajoutée avec succès' }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        }
      });
    } catch (error) {
      console.error('Error creating system_logs table:', error);
      return new Response(JSON.stringify({ success: false, error: 'Erreur lors de la création de la table system_logs' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        }
      });
    }
  });
}