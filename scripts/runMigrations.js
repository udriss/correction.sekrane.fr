// Load environment variables first
require('dotenv').config();

// We need to use require since we're running plain Node.js
const { initializeDatabase, closePool } = require('../lib/db');

async function main() {
  try {
    // Print environment variables (but not password) for debugging
    console.log('Environment variables loaded:', {
      DB_HOST: process.env.DB_HOST || '(not set)',
      DB_USER: process.env.DB_USER || '(not set)',
      DB_NAME: process.env.DB_NAME || '(not set)',
      DOTENV_LOADED: 'true'
    });
    
    console.log('Running database migrations...');
    await initializeDatabase();
    console.log('All migrations completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

main();
