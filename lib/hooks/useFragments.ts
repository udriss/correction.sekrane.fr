import { useState, useCallback } from 'react';
import { Fragment } from '@/lib/types';
import { ContentItem } from '@/types/correction';
import * as fragmentService from '../services/fragmentService';

// Mise à jour de la signature de la fonction pour accepter un paramètre de mise à jour
export function useFragments(updateContentWithFragment?: (fragmentId: number, newContent: string) => void) {
  const [fragments, setFragments] = useState<Fragment[]>([]);
  const [activities, setActivities] = useState<Array<{id: number, name: string}>>([]);
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(null);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [loadingFragments, setLoadingFragments] = useState(false);
  const [addingFragment, setAddingFragment] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [editingFragmentId, setEditingFragmentId] = useState<number | null>(null);
  const [editedFragmentContent, setEditedFragmentContent] = useState('');
  const [savingFragment, setSavingFragment] = useState(false);
  const [deletingIds, setDeletingIds] = useState<number[]>([]);

  const fetchFragmentsForActivity = useCallback(async (activityId: number) => {
    if (!activityId) return;
    
    setLoadingFragments(true);
    try {
      const fragmentsData = await fragmentService.fetchFragmentsForActivity(activityId);
      setFragments(fragmentsData);
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors du chargement des fragments');
    } finally {
      setLoadingFragments(false);
    }
  }, []);

  const fetchAllActivities = useCallback(async () => {
    setLoadingActivities(true);
    try {
      const activitiesData = await fragmentService.fetchAllActivities();
      setActivities(activitiesData);
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors du chargement des activités');
    } finally {
      setLoadingActivities(false);
    }
  }, []);

  const handleCreateNewFragment = useCallback(async (activityId: number, content: string) => {
    if (!content.trim() || !activityId) return;

    setAddingFragment(true);
    setError('');

    try {
      const newFragment = await fragmentService.createFragment(activityId, content);
      setFragments(prev => [...prev, newFragment]);
      setSuccessMessage('Fragment ajouté avec succès');
      
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      
      return newFragment;
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors de l\'ajout du fragment');
      return null;
    } finally {
      setAddingFragment(false);
    }
  }, []);
  
  const handleAddFragment = useCallback((fragment: Fragment, saveToHistory: () => void): ContentItem[] => {
    // Sauvegarder l'état actuel avant modification
    saveToHistory();
    
    // Créer un nouvel identifiant unique pour la liste
    const listId = `item-${Date.now()}`;
    
    // Extraire le titre du fragment (première ligne ou début du contenu)
    const firstLine = fragment.content.trim().split('\n')[0];
    const title = firstLine; 
    
    // Créer l'élément de liste avec un titre significatif et l'ID du fragment
    const listItem: ContentItem = {
      id: listId,
      type: 'list',
      content: title,
      fragmentId: fragment.id,
      fragmentName: title
    };
    
    // Créer les éléments de la liste
    const fragmentItems = fragment.content
      .split('\n')
      .filter(line => line.trim())
      .map((line, index) => ({
        id: `item-${Date.now()}-${index}`,
        content: line.trim(),
        type: 'listItem' as const,
        parentId: listId
      }));
    
    // Return all items to be added
    return [listItem, ...fragmentItems];
  }, []);

  const handleDeleteFragment = useCallback(async (fragmentId: number) => {
    setDeletingIds(prev => [...prev, fragmentId]);
    try {
      await fragmentService.deleteFragment(fragmentId);
      setFragments(fragments => fragments.filter(fragment => fragment.id !== fragmentId));
      setSuccessMessage('Fragment supprimé avec succès');
      
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors de la suppression du fragment');
    } finally {
      setDeletingIds(prev => prev.filter(id => id !== fragmentId));
    }
  }, []);

  const handleEditFragment = useCallback((id: number, content: string) => {
    setEditingFragmentId(id || null);
    setEditedFragmentContent(content);
  }, []);

  const handleCancelEditFragment = useCallback(() => {
    setEditingFragmentId(null);
    setEditedFragmentContent('');
  }, []);

  const handleSaveFragment = async () => {
    if (!editingFragmentId) return;
    
    setSavingFragment(true);
    try {
      const response = await fetch(`/api/fragments/${editingFragmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: editedFragmentContent }),
      });
      
      if (!response.ok) throw new Error('Failed to save fragment');
      
      const updatedFragment = await response.json();
      
      // Mettre à jour l'état local avec le fragment mis à jour
      setFragments(prevFragments => 
        prevFragments.map(fragment => 
          fragment.id === updatedFragment.id ? updatedFragment : fragment
        )
      );
      
      // Si la fonction de mise à jour est fournie, l'utiliser pour mettre à jour
      // tous les contenus liés à ce fragment dans la correction
      if (updateContentWithFragment) {
        updateContentWithFragment(editingFragmentId, editedFragmentContent);
      }
      
      // Réinitialiser l'état d'édition
      setEditingFragmentId(null);
      setEditedFragmentContent('');
      
      setSuccessMessage('Fragment mis à jour avec succès');
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (error) {
      console.error('Error saving fragment:', error);
      setError('Erreur lors de la sauvegarde du fragment');
      setTimeout(() => setError(''), 3000);
    } finally {
      setSavingFragment(false);
    }
  };

  const moveFragment = useCallback((dragIndex: number, hoverIndex: number) => {
    const newFragments = [...fragments];
    const [draggedFragment] = newFragments.splice(dragIndex, 1);
    newFragments.splice(hoverIndex, 0, draggedFragment);
    
    // Update position_order in local state immediately
    const updatedFragments = newFragments.map((fragment, index) => ({
      ...fragment,
      position_order: index + 1
    }));
    
    // Set the updated fragments with position_order already set
    setFragments(updatedFragments);

    // Send the update to the API
    fragmentService.reorderFragments(updatedFragments.map((frag, index) => ({
      fragmentId: frag.id as number,
      newPosition: index + 1
    })))
    .catch(error => {
      console.error('Error during batch position update:', error);
    });
  }, [fragments]);

  return {
    fragments,
    activities,
    selectedActivityId,
    loadingActivities,
    loadingFragments,
    addingFragment,
    error,
    successMessage,
    editingFragmentId,
    editedFragmentContent,
    savingFragment,
    deletingIds,
    setSelectedActivityId,
    setEditedFragmentContent,
    fetchFragmentsForActivity,
    fetchAllActivities,
    handleCreateNewFragment,
    handleAddFragment,
    handleDeleteFragment,
    handleEditFragment,
    handleCancelEditFragment,
    handleSaveFragment,
    moveFragment,
    setError,
    setSuccessMessage
  };
}
