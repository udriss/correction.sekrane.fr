// Load environment variables
require('dotenv').config();
const { pool, closePool } = require('../lib/db');

async function ensureCorrectionFragmentsTable() {
  try {
    console.log('Ensuring correction_fragments table exists with proper structure...');
    
    const connection = await pool.getConnection();
    
    try {
      // Step 1: Create the table if it doesn't exist
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
      
      console.log('Table created or already exists');
      
      // Step 2: Check if any records exist in the table
      const [countResult] = await connection.query(`
        SELECT COUNT(*) as count FROM correction_fragments
      `);
      
      console.log(`Found ${countResult[0].count} records in correction_fragments table`);
      
      console.log('Table correction_fragments is ready to use!');
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error ensuring correction_fragments table:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

ensureCorrectionFragmentsTable();
