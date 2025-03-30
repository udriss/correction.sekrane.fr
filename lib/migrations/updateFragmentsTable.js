// Remove the require to avoid circular dependency
// const { query } = require('../db');

async function updateFragmentsTable(queryFunction) {
  try {
    
    
    // Check if category column exists
    const categoryResults = await queryFunction(`
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'fragments' AND COLUMN_NAME = 'category'
    `);
    
    if (categoryResults && categoryResults[0].count === 0) {
      
      await queryFunction(`
        ALTER TABLE fragments
        ADD COLUMN category VARCHAR(100) DEFAULT 'Général'
      `);
    }
    
    // Check if tags column exists
    const tagsResults = await queryFunction(`
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'fragments' AND COLUMN_NAME = 'tags'
    `);
    
    if (tagsResults && tagsResults[0].count === 0) {
      
      await queryFunction(`
        ALTER TABLE fragments
        ADD COLUMN tags JSON DEFAULT NULL
      `);
    }
    
    // Check if user_id column exists
    const userIdResults = await queryFunction(`
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'fragments' AND COLUMN_NAME = 'user_id'
    `);
    
    if (userIdResults && userIdResults[0].count === 0) {
      
      await queryFunction(`
        ALTER TABLE fragments
        ADD COLUMN user_id VARCHAR(100) DEFAULT NULL
      `);
    }
    
    // Check if activity_id column allows NULL
    const activityNullableResults = await queryFunction(`
      SELECT IS_NULLABLE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'fragments' AND COLUMN_NAME = 'activity_id'
    `);
    
    if (activityNullableResults && activityNullableResults[0].IS_NULLABLE === 'NO') {
      
      await queryFunction(`
        ALTER TABLE fragments
        MODIFY activity_id INT NULL
      `);
    }
    
    
  } catch (error) {
    console.error('Error updating fragments table:', error);
    throw error;
  }
}

module.exports = { updateFragmentsTable };
