import { migrateCategoryColumn } from '@/lib/migrations/migrateCategoryColumn';

async function runMigration() {
  try {
    console.log('Starting category column migration script...');
    await migrateCategoryColumn();
    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
