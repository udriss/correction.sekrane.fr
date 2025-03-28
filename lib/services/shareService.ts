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
export async function getExistingShareCode(correctionId: string): Promise<{ exists: boolean, code?: string }> {
  try {
    const response = await fetch(`/api/corrections/${correctionId}/share`, {
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
export async function generateShareCode(correctionId: string): Promise<{ isNew: boolean, code: string }> {
  try {
    // Try to get existing code first
    const existingCode = await getExistingShareCode(correctionId);
    
    if (existingCode.exists && existingCode.code) {
      return { isNew: false, code: existingCode.code };
    }
    
    // If no existing code, generate a new one
    const response = await fetch(`/api/corrections/${correctionId}/share`, {
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

export async function deactivateShareCode(correctionId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/corrections/${correctionId}/share`, {
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
