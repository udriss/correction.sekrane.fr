export interface ShareResponse {
  code?: string;
  exists: boolean;
  message?: string;
  isNew?: boolean;
}

/**
 * Service pour la gestion des codes de partage des corrections
 */

/**
 * Récupère un code de partage existant pour une correction
 * @param correctionId ID de la correction
 * @returns Objet contenant existe (boolean) et code (string) si trouvé
 */
export async function getExistingShareCode(correctionId: string): Promise<{ exists: boolean, code?: string }> {
  try {
    const response = await fetch(`/api/corrections/${correctionId}/share`, {
      method: 'GET',
    });
    
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération du code de partage');
    }
    
    return await response.json();
  } catch (error) {
    console.error('getExistingShareCode error:', error);
    return { exists: false };
  }
}

/**
 * Génère un code de partage pour une correction
 * @param correctionId ID de la correction
 * @returns Objet contenant isNew (boolean) et code (string)
 */
export async function generateShareCode(correctionId: string): Promise<{ isNew: boolean, code: string }> {
  try {
    const response = await fetch(`/api/corrections/${correctionId}/share`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      throw new Error('Erreur lors de la génération du code de partage');
    }
    
    return await response.json();
  } catch (error) {
    console.error('generateShareCode error:', error);
    throw error;
  }
}

export async function disableShareCode(correctionId: string): Promise<void> {
  try {
    const response = await fetch(`/api/corrections/${correctionId}/share`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la désactivation du code de partage');
    }
  } catch (error) {
    console.error('Erreur:', error);
    throw error;
  }
}
