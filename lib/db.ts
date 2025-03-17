import mysql from 'mysql2/promise';

export function createCorrectionPool() {
  return mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'int',
    password: process.env.DB_PASSWORD || '4Na9Gm8mdTVgnUp',
    database: process.env.DB_NAME || 'corrections',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
}

// Singleton pour éviter de créer plusieurs pools
let pool: mysql.Pool;

export function getPool(): mysql.Pool {
  if (!pool) {
    pool = createCorrectionPool();
  }
  return pool;
}

// Initialiser la base de données
export async function initializeDatabase() {
  const pool = getPool();
  
  try {
    // Créer la table des activités
    await pool.query(`
      CREATE TABLE IF NOT EXISTS activities (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        content TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // Créer la table des corrections (liée aux activités)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS corrections (
        id INT AUTO_INCREMENT PRIMARY KEY,
        activity_id INT NOT NULL,
        student_name VARCHAR(255),
        content TEXT,
        content_data JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE
      )
    `);

    // Créer la table des fragments (liés aux activités et non aux corrections)
    await pool.query(`
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
    await pool.query(`
      SELECT COUNT(*) as count
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'fragments' AND COLUMN_NAME = 'position_order'
    `).then(async ([rows]) => {
      const result = rows as any[];
      if (result[0].count === 0) {
        await pool.query(`
          ALTER TABLE fragments
          ADD COLUMN position_order INT DEFAULT 0
        `);
        // Initialize position values based on id for existing fragments
        await pool.query(`
          UPDATE fragments
          SET position_order = id
          WHERE position_order = 0
        `);
      }
    });

    console.log('Base de données initialisée avec succès');
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de la base de données:', error);
  }
}
