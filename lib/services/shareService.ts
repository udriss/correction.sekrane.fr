import { ShareCode } from '@/lib/types';

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
export async function getExistingShareCode(correctionId: string | number): Promise<{ exists: boolean, code?: string }> {
  try {
    // Convert number to string if needed
    const id = typeof correctionId === 'number' ? correctionId.toString() : correctionId;

    const response = await fetch(`/api/corrections_autres/${id}/share`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (response.ok && data.exists && data.code) {
      return { exists: true, code: data.code };
    }
    
    return { exists: false };
  } catch (error) {
    console.error('Error checking for existing share code:', error);
    return { exists: false };
  }
}

/**
 * Génère un code de partage pour une correction
 * @param correctionId ID de la correction
 * @returns Objet contenant isNew (boolean) et code (string)
 */
export async function generateShareCode(correctionId: string | number): Promise<{ isNew: boolean, code: string }> {
  try {
    // Convert number to string if needed
    const id = typeof correctionId === 'number' ? correctionId.toString() : correctionId;

    // Try to get existing code first
    const existingCode = await getExistingShareCode(id);
    
    if (existingCode.exists && existingCode.code) {
      return { isNew: false, code: existingCode.code };
    }
    
    // If no existing code, generate a new one
    const response = await fetch(`/api/corrections_autres/${id}/share`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to generate share code');
    }
    
    return { isNew: true, code: data.code };
  } catch (error) {
    console.error('Error generating share code:', error);
    throw error;
  }
}

export async function deactivateShareCode(correctionId: string | number): Promise<boolean> {
  try {
    // Convert number to string if needed
    const id = typeof correctionId === 'number' ? correctionId.toString() : correctionId;

    const response = await fetch(`/api/corrections_autres/${id}/share`, {
      method: 'DELETE',
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error deactivating share code:', error);
    return false;
  }
}

// Function to get share code details
export async function getShareCodeDetails(code: string): Promise<ShareCode | null> {
  try {
    const response = await fetch(`/api/share/${code}`);
    
    if (!response.ok) {
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting share code details:', error);
    return null;
  }
}

/**
 * Récupère en lot les codes de partage pour plusieurs corrections_autres
 * @param correctionIds Liste des IDs de corrections_autres
 * @returns Map des codes de partage indexés par ID de correction
 */
export async function getBatchShareCodes(correctionIds: (string | number)[]): Promise<Map<string, string>> {
  try {
    if (!correctionIds.length) return new Map();

    // Convert number IDs to strings if needed
    const ids = correctionIds.map(id => typeof id === 'number' ? id.toString() : id);
    
    const response = await fetch(`/api/share/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ correctionIds: ids }),
    });

    if (!response.ok) {
      console.error('Error fetching batch share codes:', response.statusText);
      return new Map();
    }
    
    const data = await response.json();

    
    const shareCodesMap = new Map<string, string>();
    
    // Vérifier si les données sont un tableau ou un objet avec des clés numériques
    if (Array.isArray(data.shareCodes)) {
      // Format attendu: un tableau d'objets { correction_id, code }
      data.shareCodes.forEach((item: any) => {
        if (item.correction_id && item.code) {
          shareCodesMap.set(item.correction_id.toString(), item.code);
        }
      });
    } else if (typeof data === 'object' && data !== null) {
      // Format alternatif: un objet où les clés sont les IDs et les valeurs sont les codes
      // Parcourir toutes les propriétés de l'objet data qui correspondent à des IDs de correction
      Object.keys(data).forEach(key => {
        // Ignorer les propriétés qui ne sont pas censées être des IDs de correction
        if (key !== 'shareCodes' && !isNaN(Number(key))) {
          const correctionId = key;
          const shareCode = data[key];
          
          if (typeof shareCode === 'string') {
            shareCodesMap.set(correctionId, shareCode);
          }
        }
      });
    }
    

    return shareCodesMap;
  } catch (error) {
    console.error('Error fetching batch share codes:', error);
    return new Map();
  }
}
