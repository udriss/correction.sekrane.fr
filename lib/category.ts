import { withConnection } from '@/lib/db';

/**
 * Supprime toutes les associations de fragments pour une catégorie spécifique
 * @param categoryId - L'ID de la catégorie à supprimer
 * @returns true si la suppression a réussi, false sinon
 */
export async function deleteCategoryAssociations(categoryId: number): Promise<boolean> {
  try {
    return await withConnection(async (connection) => {
      // Exécute la requête DELETE avec le paramètre categoryId
      const [result] = await connection.query(
        'DELETE FROM fragments_categories WHERE category_id = ?',
        [categoryId]
      );
      
      // Retourne true si la suppression a réussi
      return true;
    });
  } catch (error) {
    console.error('Erreur lors de la suppression des associations de catégorie:', error);
    return false;
  }
}
