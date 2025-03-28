// Load environment variables
require('dotenv').config();
const { pool, closePool } = require('../lib/db');

async function fixCorrectionFragmentsTable() {
  try {
    console.log('Starting correction_fragments table repair...');
    
    const connection = await pool.getConnection();
    
    try {
      // Step 1: Check if the correction_fragments table exists
      const [tableCheck] = await connection.query(`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = ? AND table_name = 'correction_fragments'
      `, [process.env.DB_NAME || 'correction']);
      
      if (tableCheck[0].count === 0) {
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
      
      // Step 2: Check columns to ensure they're correctly defined
      console.log('Checking correction_fragments columns...');
      const [columnsCheck] = await connection.query(`
        SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'correction_fragments'
      `, [process.env.DB_NAME || 'correction']);
      
      const columnNames = columnsCheck.map(col => col.COLUMN_NAME);
      console.log('Found columns:', columnNames);
      
      // Check for missing required columns and add them if needed
      const requiredColumns = ['fragment_id', 'correction_id', 'position'];
      
      for (const colName of requiredColumns) {
        if (!columnNames.includes(colName)) {
          console.log(`Adding missing column: ${colName}`);
          
          if (colName === 'fragment_id') {
            await connection.query(`
              ALTER TABLE correction_fragments
              ADD COLUMN fragment_id INT NOT NULL,
              ADD FOREIGN KEY (fragment_id) REFERENCES fragments(id)
            `);
          }
          
          if (colName === 'correction_id') {
            await connection.query(`
              ALTER TABLE correction_fragments
              ADD COLUMN correction_id INT NOT NULL,
              ADD FOREIGN KEY (correction_id) REFERENCES corrections(id) ON DELETE CASCADE
            `);
          }
          
          if (colName === 'position') {
            await connection.query(`
              ALTER TABLE correction_fragments
              ADD COLUMN position INT DEFAULT 0
            `);
          }
        }
      }
      
      console.log('Correction fragments table repair completed successfully!');
      
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fixing correction_fragments table:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

fixCorrectionFragmentsTable();
