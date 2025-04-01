import mysql from 'mysql2/promise';
import { Pool, PoolConnection } from 'mysql2/promise';
import { updateFragmentsTable } from './migrations/updateFragmentsTable';

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'correction',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create pool
const pool: Pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // Paramètres de pool pour limiter les connexions
  connectionLimit: 10, // Limiter le nombre maximum de connexions
  queueLimit: 0, // 0 = illimité, défini un nombre max pour limiter la file d'attente
  waitForConnections: true, // Attendre une connexion disponible ou rejeter
  connectTimeout: 10000, // Timeout de connexion en millisecondes
  // acquireTimeout is not a valid option in mysql2/promise PoolOptions
  idleTimeout: 60000, // Temps d'inactivité avant fermeture d'une connexion (ms)
  // Paramètres supplémentaires utiles
  enableKeepAlive: true, // Maintenir les connexions actives
  keepAliveInitialDelay: 10000, // Délai initial pour keepAlive
});

// Helper function to handle database connections
export async function withConnection<T>(
  callback: (connection: PoolConnection) => Promise<T>
): Promise<T> {
  const connection = await pool.getConnection();
  try {
    return await callback(connection);
  } finally {
    connection.release();
  }
}

export default pool;

// Fonction utilitaire pour les requêtes simples
export async function query<T>(sql: string, params?: any[]): Promise<T> {
  try {
    const [results] = await pool.execute(sql, params);
    return results as unknown as T;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Fonction de nettoyage à appeler lors de l'arrêt de l'application
export async function closePool() {
  if (pool) {
    try {
      await pool.end();
    } catch (err) {
      console.error('Error closing database connection pool:', err);
    }
  }
}

// Initialiser la base de données
export async function initializeDatabase() {
  try {
    // Créer la table des activités
    await query(`
      CREATE TABLE IF NOT EXISTS activities (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        content TEXT,
        user_id VARCHAR(100) NULL,
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
      if (rows && rows.length > 0 && rows[0].count === 0) {
        await query(`
          ALTER TABLE activities
          ADD COLUMN user_id VARCHAR(100) NULL
        `);
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

    // Créer la table des fragments si elle n'existe pas
    await query(`
      CREATE TABLE IF NOT EXISTS fragments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        activity_id INT NULL,
        content TEXT NOT NULL,
        category VARCHAR(100) DEFAULT 'Général',
        tags JSON DEFAULT NULL,
        user_id VARCHAR(100) DEFAULT NULL,
        position_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create the correction_fragments table if it doesn't exist
    await query(`
      CREATE TABLE IF NOT EXISTS correction_fragments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        correction_id INT NOT NULL,
        fragment_id INT NOT NULL,
        position INT DEFAULT 0,
        custom_content TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (correction_id) REFERENCES corrections(id) ON DELETE CASCADE,
        FOREIGN KEY (fragment_id) REFERENCES fragments(id)
      )
    `);
    

    // Run migrations to update existing tables
    await updateFragmentsTable();

    // Check if position column exists in fragments table, add if not
    await query(`
      SELECT COUNT(*) as count
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'fragments' AND COLUMN_NAME = 'position_order'
    `).then(async (rows: any) => {
      if (rows && rows.length > 0 && rows[0].count === 0) {
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
      if (rows && rows.length > 0 && rows[0].count === 0) {
        await query(`
          ALTER TABLE corrections
          ADD COLUMN grade DECIMAL(4,2) DEFAULT NULL,
          ADD COLUMN penalty DECIMAL(4,2) DEFAULT NULL
        `);
        
      }
    });

    // Create the class management tables
    await query(`
      CREATE TABLE IF NOT EXISTS classes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        academic_year VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    await query(`
      CREATE TABLE IF NOT EXISTS students (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        gender CHAR(1) NOT NULL COMMENT 'M for Male, F for Female, N for Neutral',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    await query(`
      CREATE TABLE IF NOT EXISTS class_activities (
        id INT AUTO_INCREMENT PRIMARY KEY,
        class_id INT NOT NULL,
        activity_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
        FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
        UNIQUE KEY (class_id, activity_id)
      )
    `);
    
    await query(`
      CREATE TABLE IF NOT EXISTS class_students (
        id INT AUTO_INCREMENT PRIMARY KEY,
        class_id INT NOT NULL,
        student_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        UNIQUE KEY (class_id, student_id)
      )
    `);
    
    // Check if class_id column exists in corrections table, add if not
    await query(`
      SELECT COUNT(*) as count
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'corrections' AND COLUMN_NAME = 'class_id'
    `).then(async (rows: any) => {
      if (rows && rows.length > 0 && rows[0].count === 0) {
        await query(`
          ALTER TABLE corrections
          ADD COLUMN class_id INT NULL,
          ADD CONSTRAINT fk_correction_class FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL
        `);
      }
    });

    // Créer la table des catégories si elle n'existe pas
    await query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Créer la table de liaison fragments_categories si elle n'existe pas
    await query(`
      CREATE TABLE IF NOT EXISTS fragments_categories (
        fragment_id INT NOT NULL,
        category_id INT NOT NULL,
        PRIMARY KEY (fragment_id, category_id),
        FOREIGN KEY (fragment_id) REFERENCES fragments(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
      )
    `);

    // Vérifier si la colonne category existe dans la table fragments
    // Si oui, migrer les données vers la nouvelle structure
    await query(`
      SELECT COUNT(*) as count
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'fragments' AND COLUMN_NAME = 'category'
    `).then(async (rows: any) => {
      if (rows && rows.length > 0 && rows[0].count > 0) {
        // Migrer les catégories existantes vers la nouvelle table
        // 1. Créer les catégories uniques
        await query(`
          INSERT IGNORE INTO categories (name)
          SELECT DISTINCT category FROM fragments WHERE category IS NOT NULL AND category != ''
        `);

        // 2. Créer les associations dans la table de liaison
        await query(`
          INSERT INTO fragments_categories (fragment_id, category_id)
          SELECT f.id, c.id 
          FROM fragments f 
          JOIN categories c ON f.category = c.name
          WHERE f.category IS NOT NULL AND f.category != ''
        `);

        // On pourrait supprimer la colonne category ici, mais pour la compatibilité,
        // nous la gardons pendant la transition
      }
    });

    // Au lieu de créer une activité avec ID 0, nous allons supprimer cette partie
    // et la remplacer par une vérification de l'existence d'une activité générique
    const [genericActivityExists] = await query<{count: number}[]>(
      "SELECT COUNT(*) as count FROM activities WHERE name LIKE 'Activité générique%'"
    );
    
    if (!genericActivityExists || genericActivityExists.count === 0) {
      
      await query(
        `INSERT INTO activities 
         (name, content, experimental_points, theoretical_points, created_at, updated_at)
         VALUES ('Activité générique N° 1', 'Activité pour les corrections sans activité spécifique', 5, 15, NOW(), NOW())`
      );
    }
    
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de la base de données:', error);
    throw error;
  }
}
