const mysql = require('mysql2/promise');
const { updateFragmentsTable } = require('./migrations/updateFragmentsTable');
require('dotenv').config(); // Add this line to load environment variables

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER, // Add default value as fallback
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'correction',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// For debugging - remove in production
console.log('Database config (without password):', {
  host: dbConfig.host,
  user: dbConfig.user,
  database: dbConfig.database
});

// Create pool
const pool = mysql.createPool(dbConfig);

// Helper function to handle database connections
async function withConnection(callback) {
  const connection = await pool.getConnection();
  try {
    return await callback(connection);
  } finally {
    connection.release();
  }
}

// Function for simple queries
async function query(sql, params) {
  return withConnection(async (connection) => {
    const [rows] = await connection.query(sql, params);
    return rows;
  });
}

// Function to clean up when the application stops
async function closePool() {
  if (pool) {
    try {
      await pool.end();
      console.log('Database connection pool closed');
    } catch (err) {
      console.error('Error closing database connection pool:', err);
    }
  }
}

// Initialize the database
async function initializeDatabase() {
  try {
    // Create the activities table
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
    
    // Check if the user_id column already exists
    const userIdResults = await query(`
      SELECT COUNT(*) as count
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'activities' AND COLUMN_NAME = 'user_id'
    `);
    
    if (userIdResults && userIdResults[0].count === 0) {
      await query(`
        ALTER TABLE activities
        ADD COLUMN user_id VARCHAR(100) NULL
      `);
      console.log('Added user_id column to activities table');
    }
    
    // Create the corrections table
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

    // Create the fragments table
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

    // Run migrations to update existing tables - pass query function to avoid circular dependency
    await updateFragmentsTable(query);

    // Check if position_order column exists and add if not
    const positionResults = await query(`
      SELECT COUNT(*) as count
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'fragments' AND COLUMN_NAME = 'position_order'
    `);
    
    if (positionResults && positionResults[0].count === 0) {
      await query(`
        ALTER TABLE fragments
        ADD COLUMN position_order INT DEFAULT 0
      `);
      // Initialize position values
      await query(`
        UPDATE fragments
        SET position_order = id
        WHERE position_order = 0
      `);
    }

    // Check if grade/penalty columns exist
    const gradeResults = await query(`
      SELECT COUNT(*) as count
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'corrections' AND COLUMN_NAME = 'grade'
    `);
    
    if (gradeResults && gradeResults[0].count === 0) {
      await query(`
        ALTER TABLE corrections
        ADD COLUMN grade DECIMAL(4,2) DEFAULT NULL,
        ADD COLUMN penalty DECIMAL(4,2) DEFAULT NULL
      `);
      console.log('Added grade and penalty columns to corrections table');
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Export the functions
module.exports = {
  pool,
  withConnection,
  query,
  closePool,
  initializeDatabase
};
