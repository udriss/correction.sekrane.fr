import { Fragment } from '@/lib/types';

export async function fetchFragmentsForActivity(activityId: number): Promise<Fragment[]> {
  const fragmentsResponse = await fetch(`/api/activities/${activityId}/fragments`);
  if (!fragmentsResponse.ok) {
    throw new Error('Erreur lors du chargement des fragments');
  }
  return await fragmentsResponse.json();
}

export async function fetchAllActivities(): Promise<Array<{id: number, name: string}>> {
  const response = await fetch('/api/activities');
  if (!response.ok) {
    throw new Error('Erreur lors du chargement des activités');
  }
  return await response.json();
}

/**
 * Creates a new fragment with optional categories
 */
export async function createFragment(
  activityId: number, 
  content: string, 
  categories: number[] = []
): Promise<Fragment> {
  
  
  const response = await fetch('/api/fragments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      activity_id: activityId,
      content: content.trim(),
      categories: categories // Make sure categories are included in the request
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Erreur lors de l\'ajout du fragment');
  }

  return await response.json();
}

export async function updateFragment(fragmentId: number, content: string): Promise<Fragment> {
  const response = await fetch(`/api/fragments/${fragmentId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    throw new Error('Erreur lors de la mise à jour du fragment');
  }

  return await response.json();
}

export async function deleteFragment(fragmentId: number): Promise<void> {
  const response = await fetch(`/api/fragments/${fragmentId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Erreur lors de la suppression du fragment');
  }
}

/**
 * Fetches all available categories
 */
export async function fetchCategories(): Promise<Array<{id: number, name: string}>> {
  const response = await fetch('/api/categories');
  if (!response.ok) {
    throw new Error('Erreur lors du chargement des catégories');
  }
  return await response.json();
}

/**
 * Delete a category with the given ID
 */
export async function deleteCategory(categoryId: number): Promise<{ success: boolean, message?: string }> {
  const response = await fetch(`/api/categories/${categoryId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Erreur lors de la suppression de la catégorie');
  }
  
  return await response.json();
}

export async function reorderFragments(fragments: Array<{fragmentId: number, newPosition: number}>): Promise<void> {
  const response = await fetch(`/api/fragments/reorder`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(fragments)
  });
  
  if (!response.ok) {
    throw new Error('Failed to update fragment positions');
  }
}

/**
 * Associates a fragment with a correction
 */
export async function associateFragmentWithCorrection(
  fragmentId: number, 
  correctionId: number
): Promise<void> {
  const response = await fetch('/api/correction-fragments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fragment_id: fragmentId,
      correction_id: correctionId
    }),
  });
  
  if (!response.ok) {
    throw new Error('Erreur lors de l\'association du fragment avec la correction');
  }
}

// Fonction pour mettre à jour la position d'un fragment
export async function updateFragmentPosition(fragmentId: number, newPosition: number) {
  try {
    const response = await fetch(`/api/fragments/update-position`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fragmentId,
        newPosition,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la mise à jour de la position');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating fragment position:', error);
    throw error;
  }
}
