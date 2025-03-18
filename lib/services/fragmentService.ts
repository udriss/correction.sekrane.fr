import { Fragment } from '@/lib/fragment';

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

export async function createFragment(activityId: number, content: string): Promise<Fragment> {
  const response = await fetch('/api/fragments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      activity_id: activityId,
      content: content.trim()
    }),
  });

  if (!response.ok) {
    throw new Error('Erreur lors de l\'ajout du fragment');
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
