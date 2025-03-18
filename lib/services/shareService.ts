export interface ShareResponse {
  code?: string;
  exists: boolean;
  message?: string;
  isNew?: boolean;
}

export async function generateShareCode(correctionId: string): Promise<ShareResponse> {
  try {
    const response = await fetch(`/api/corrections/${correctionId}/share`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la génération du code de partage');
    }

    return await response.json();
  } catch (error) {
    console.error('Erreur:', error);
    throw error;
  }
}

export async function getExistingShareCode(correctionId: string): Promise<ShareResponse> {
  try {
    const response = await fetch(`/api/corrections/${correctionId}/share`);

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération du code de partage');
    }

    return await response.json();
  } catch (error) {
    console.error('Erreur:', error);
    return { exists: false };
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
