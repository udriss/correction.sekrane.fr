/**
 * Services for managing corrections_autres
 */

/**
 * Change the status of a correction_autre to a specific value
 * @param correctionId The ID of the correction to update
 * @param status The new status (ACTIVE, DEACTIVATED, ABSENT, NON_RENDU, NON_NOTE)
 * @returns Promise resolving to the updated correction
 */
export async function changeCorrectionAutreStatus(correctionId: number, status: string): Promise<any> {
  try {
    // Vérifier que le status est valide
    const validStatuses = ['ACTIVE', 'DEACTIVATED', 'ABSENT', 'NON_RENDU', 'NON_NOTE'];
    if (!validStatuses.includes(status)) {
      throw new Error('Statut invalide');
    }

    // Use the API to update the status
    const response = await fetch(`/api/corrections_autres/${correctionId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Échec de la mise à jour du statut');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error in changeCorrectionAutreStatus:', error);
    throw error;
  }
}