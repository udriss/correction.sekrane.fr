import mysql, { Pool, PoolConnection } from 'mysql2/promise';

let pool: Pool;

export function getPool(): Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'int',
      password: process.env.DB_PASSWORD || '4Na9Gm8mdTVgnUp',
      database: process.env.DB_NAME || 'corrections',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }
  return pool;
}

// Fonction utilitaire pour exécuter des requêtes et gérer automatiquement les connexions
export async function withConnection<T>(callback: (connection: PoolConnection) => Promise<T>): Promise<T> {
  const pool = getPool();
  const connection = await pool.getConnection();
  
  try {
    return await callback(connection);
  } finally {
    // Toujours libérer la connexion, même en cas d'erreur
    connection.release();
  }
}

// Fonction utilitaire pour les requêtes simples
export async function query<T>(sql: string, params?: any[]): Promise<T> {
  return withConnection(async (connection) => {
    const [rows] = await connection.query(sql, params);
    return rows as T;
  });
}

// Initialiser la base de données
export async function initializeDatabase() {
  const pool = getPool();
  
  try {
    // Créer la table des activités
    await query(`
      CREATE TABLE IF NOT EXISTS activities (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        content TEXT,
        user_id INT NULL,
        experimental_points INT DEFAULT 5,
        theoretical_points INT DEFAULT 15,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // Vérifier si la colonne user_id existe déjà
    await query(`
      SELECT COUNT(*) as count
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'activities' AND COLUMN_NAME = 'user_id'
    `).then(async (rows: any) => {
      const result = rows[0] as any[];
      if (result[0].count === 0) {
        await query(`
          ALTER TABLE activities
          ADD COLUMN user_id INT NULL
        `);
        console.log('Added user_id column to activities table');
      }
    });
    
    // Créer la table des corrections (liée aux activités)
    await query(`
      CREATE TABLE IF NOT EXISTS corrections (
        id INT AUTO_INCREMENT PRIMARY KEY,
        activity_id INT NOT NULL,
        student_name VARCHAR(255),
        content TEXT,
        content_data JSON,
        grade DECIMAL(4,2) DEFAULT NULL,
        penalty DECIMAL(4,2) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE
      )
    `);

    // Créer la table des fragments (liés aux activités et non aux corrections)
    await query(`
      CREATE TABLE IF NOT EXISTS fragments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        activity_id INT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE
      )
    `);

    // Check if position column exists in fragments table, add if not
    await query(`
      SELECT COUNT(*) as count
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'fragments' AND COLUMN_NAME = 'position_order'
    `).then(async (rows: any) => {
      const result = rows[0] as any[];
      if (result[0].count === 0) {
        await query(`
          ALTER TABLE fragments
          ADD COLUMN position_order INT DEFAULT 0
        `);
        // Initialize position values based on id for existing fragments
        await query(`
          UPDATE fragments
          SET position_order = id
          WHERE position_order = 0
        `);
      }
    });

    // Check if grade/penalty columns exist in corrections table, add if not
    await query(`
      SELECT COUNT(*) as count
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'corrections' AND COLUMN_NAME = 'grade'
    `).then(async (rows: any) => {
      const result = rows[0] as any[];
      if (result[0].count === 0) {
        await query(`
          ALTER TABLE corrections
          ADD COLUMN grade DECIMAL(4,2) DEFAULT NULL,
          ADD COLUMN penalty DECIMAL(4,2) DEFAULT NULL
        `);
        console.log('Added grade and penalty columns to corrections table');
      }
    });

    console.log('Base de données initialisée avec succès');
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de la base de données:', error);
  }
}
