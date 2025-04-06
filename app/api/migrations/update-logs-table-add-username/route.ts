import { withConnection } from "@/lib/db";

export async function GET(request: Request) {
  return withConnection(async (connection) => {
    try {
      // Vérifier si la colonne username existe déjà
      const [columns] = await connection.query(`
        SHOW COLUMNS FROM system_logs LIKE 'username'
      `);
      
      // Si la colonne n'existe pas, l'ajouter
      if (!Array.isArray(columns) || (columns as any[]).length === 0) {
        await connection.query(`
          ALTER TABLE system_logs
          ADD COLUMN username VARCHAR(255) AFTER user_id,
          MODIFY COLUMN user_email VARCHAR(255) COMMENT 'Deprecated - use username instead'
        `);
      }

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Table system_logs mise à jour avec succès - ajout de la colonne username' 
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        }
      });
    } catch (error) {
      console.error('Error updating system_logs table:', error);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Erreur lors de la mise à jour de la table system_logs',
        details: (error as Error).message
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        }
      });
    }
  });
}