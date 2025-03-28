import { migrateCategoryData } from '@/lib/migrations/categoryMigration';

async function runMigration() {
  try {
    console.log('Starting category migration script...');
    await migrateCategoryData();
    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
