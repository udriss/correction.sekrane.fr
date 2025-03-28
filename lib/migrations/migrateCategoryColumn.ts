import { query } from '@/lib/db';

export async function migrateCategoryColumn() {
  try {
    console.log('Starting category column migration...');
    
    // 1. Assurez-vous que toutes les catégories sont migrées
    await query(`
      INSERT IGNORE INTO categories (name)
      SELECT DISTINCT category FROM fragments 
      WHERE category IS NOT NULL AND category != ''
    `);
    console.log('Category data verified');
    
    // 2. Vérifier si la colonne category_id existe déjà
    const columnExists = await query<any[]>(`
      SELECT COUNT(*) as count
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'fragments' AND COLUMN_NAME = 'category_id'
    `);
    
    // Si la colonne n'existe pas, l'ajouter
    if (columnExists.length > 0 && columnExists[0].count === 0) {
      await query(`
        ALTER TABLE fragments ADD COLUMN category_id INT NULL
      `);
      console.log('Added category_id column');
    } else {
      console.log('category_id column already exists');
    }
    
    // 3. Mettre à jour la colonne category_id avec les IDs correspondants
    await query(`
      UPDATE fragments f
      JOIN categories c ON f.category = c.name
      SET f.category_id = c.id
      WHERE f.category IS NOT NULL AND f.category != ''
    `);
    console.log('Updated category_id values');
    
    // 4. Vérifier que toutes les valeurs ont été correctement migrées
    const fragmentsWithCategory = await query<any[]>(`
      SELECT COUNT(*) as count
      FROM fragments
      WHERE category IS NOT NULL AND category != '' AND category_id IS NULL
    `);
    
    if (fragmentsWithCategory.length > 0 && fragmentsWithCategory[0].count > 0) {
      console.warn(`Warning: ${fragmentsWithCategory[0].count} fragments still have category but no category_id`);
    } else {
      console.log('All fragments successfully migrated to use category_id');
      
      // 5. Optionnel: Supprimer l'ancienne colonne (décommentez pour activer)
      /*
      await query(`
        ALTER TABLE fragments DROP COLUMN category
      `);
      console.log('Removed old category column');
      */
    }
    
    console.log('Category column migration completed');
    return true;
  } catch (error) {
    console.error('Error during category column migration:', error);
    throw error;
  }
}
