import { query } from '@/lib/db';

async function fixActivityGeneric() {
  try {
    
    // 1. Check if any activity with ID 0 exists (from previous implementation)
    const [activityZeroExists] = await query<{count: number}[]>(
      "SELECT COUNT(*) as count FROM activities WHERE id = 0"
    );
    
    // 2. If it exists, we need to migrate its corrections to a new generic activity
    if (activityZeroExists && activityZeroExists.count > 0) {
      
      // Create a new generic activity
      const result = await query<any>(
        `INSERT INTO activities 
         (name, content, experimental_points, theoretical_points, created_at, updated_at)
         VALUES ('Activité générique', 'Corrections migrées depuis ID 0', 5, 15, NOW(), NOW())`
      );
      
      if (result && result.insertId) {
        const newActivityId = result.insertId;
        
        // Update all corrections linked to activity ID 0
        const updateResult = await query<{affectedRows: number}>(
          `UPDATE corrections SET activity_id = ? WHERE activity_id = 0`,
          [newActivityId]
        );
        
        
        // Delete the old activity with ID 0
        await query("DELETE FROM activities WHERE id = 0");
      }
    } else {
      // 3. Check if a generic activity already exists
      const [genericActivityExists] = await query<{count: number}[]>(
        "SELECT COUNT(*) as count FROM activities WHERE name = 'Activité générique'"
      );
      
      // 4. If no generic activity exists, create one
      if (!genericActivityExists || genericActivityExists.count === 0) {
        await query(
          `INSERT INTO activities 
           (name, content, experimental_points, theoretical_points, created_at, updated_at)
           VALUES ('Activité générique', 'Activité pour les corrections sans activité spécifique', 5, 15, NOW(), NOW())`
        );
      } else {
      }
    }
    
  } catch (error) {
    console.error("Error fixing database:", error);
  }
}

// Run the function if executed directly
if (require.main === module) {
  fixActivityGeneric().then(() => process.exit(0));
}

export default fixActivityGeneric;
