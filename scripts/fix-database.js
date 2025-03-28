// Load environment variables
require('dotenv').config();
const { pool, initializeDatabase, closePool } = require('../lib/db');

async function fixDatabase() {
  try {
    console.log('Starting database repair...');
    
    // Create connection
    const connection = await pool.getConnection();
    
    try {
      // Check if correction_fragments table exists
      const [tables] = await connection.query(`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = ? AND table_name = 'correction_fragments'
      `, [process.env.DB_NAME || 'correction']);
      
      if (tables[0].count === 0) {
        console.log('Creating missing correction_fragments table...');
        await connection.query(`
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
        console.log('Table created successfully!');
      } else {
        console.log('Table correction_fragments already exists.');
      }
    } finally {
      connection.release();
    }
    
    // Run full database init to fix any other issues
    console.log('Running full database initialization to check for other issues...');
    await initializeDatabase();
    
    console.log('Database repair completed successfully!');
  } catch (error) {
    console.error('Error fixing database:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

fixDatabase();
