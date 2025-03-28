import { initializeDatabase, closePool } from '../lib/db.js';

async function main() {
  try {
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
