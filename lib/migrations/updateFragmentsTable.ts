import { query } from '@/lib/db';

export async function updateFragmentsTable() {
  try {
    
    
    // Check if category column exists
    const [categoryResult] = await query<any[]>(`
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'fragments' AND COLUMN_NAME = 'category'
    `);
    
    if (categoryResult && categoryResult[0].count === 0) {
      
      await query(`
        ALTER TABLE fragments
        ADD COLUMN category VARCHAR(100) DEFAULT 'Général'
      `);
    }
    
    // Check if tags column exists
    const [tagsResult] = await query<any[]>(`
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'fragments' AND COLUMN_NAME = 'tags'
    `);
    
    if (tagsResult && tagsResult[0].count === 0) {
      
      await query(`
        ALTER TABLE fragments
        ADD COLUMN tags JSON DEFAULT NULL
      `);
    }
    
    // Check if user_id column exists
    const [userIdResult] = await query<any[]>(`
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'fragments' AND COLUMN_NAME = 'user_id'
    `);
    
    if (userIdResult && userIdResult[0].count === 0) {
      
      await query(`
        ALTER TABLE fragments
        ADD COLUMN user_id VARCHAR(100) DEFAULT NULL
      `);
    }
    
    // Check if activity_id column allows NULL
    const [activityNullable] = await query<any[]>(`
      SELECT IS_NULLABLE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'fragments' AND COLUMN_NAME = 'activity_id'
    `);
    
    if (activityNullable && activityNullable[0].IS_NULLABLE === 'NO') {
      
      await query(`
        ALTER TABLE fragments
        MODIFY activity_id INT NULL
      `);
    }
    
    
  } catch (error) {
    console.error('Error updating fragments table:', error);
    throw error;
  }
}
