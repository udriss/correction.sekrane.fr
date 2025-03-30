import { query } from '@/lib/db';

export async function migrateCategoryData() {
  try {
    
    
    // 1. Créer la table des catégories si elle n'existe pas déjà
    await query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    
    // 2. Créer la table de jonction si elle n'existe pas déjà
    await query(`
      CREATE TABLE IF NOT EXISTS fragments_categories (
        fragment_id INT NOT NULL,
        category_id INT NOT NULL,
        PRIMARY KEY (fragment_id, category_id),
        FOREIGN KEY (fragment_id) REFERENCES fragments(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
      )
    `);
    
    
    // 3. Insérer les catégories uniques de la table fragments
    await query(`
      INSERT IGNORE INTO categories (name)
      SELECT DISTINCT category FROM fragments 
      WHERE category IS NOT NULL AND category != ''
    `);
    
    
    // 4. Créer les associations dans la table de jonction
    const fragmentsWithCategories = await query<any[]>(`
      SELECT id, category FROM fragments 
      WHERE category IS NOT NULL AND category != ''
    `);
    
    // Pour chaque fragment avec une catégorie
    for (const fragment of fragmentsWithCategories) {
      // Trouver l'ID de la catégorie correspondante
      const categoryResult = await query<any[]>(`
        SELECT id FROM categories WHERE name = ?
      `, [fragment.category]);
      
      if (categoryResult.length > 0) {
        const categoryId = categoryResult[0].id;
        
        // Insérer dans la table de jonction
        await query(`
          INSERT IGNORE INTO fragments_categories (fragment_id, category_id)
          VALUES (?, ?)
        `, [fragment.id, categoryId]);
      }
    }
    
    
    // 5. OPTIONNEL: Vous pouvez décider de garder ou non la colonne 'category' dans la table fragments
    // Si vous décidez de la supprimer, décommentez le code ci-dessous
    /*
    await query(`
      ALTER TABLE fragments DROP COLUMN category
    `);
    
    */
    
    
    return true;
  } catch (error) {
    console.error('Error during category migration:', error);
    throw error;
  }
}
