import { useState, useEffect, useCallback } from 'react';

interface Category {
  id: number;
  name: string;
}

export default function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fonction pour charger les catégories avec cache
  const fetchCategories = useCallback(async (forceRefresh = false) => {
    // Vérifier si nous avons déjà des catégories et que nous ne forçons pas un rafraîchissement
    if (categories.length > 0 && !forceRefresh) {
      return categories;
    }
    
    // Éviter les requêtes multiples pendant le chargement
    if (loading) return categories;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/categories');
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des catégories');
      }
      const data = await response.json();
      setCategories(data);
      return data;
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Impossible de charger les catégories');
    } finally {
      setLoading(false);
    }
    
    return categories;
  }, [categories, loading]);
  
  // Charger les catégories au montage du composant
  useEffect(() => {
    fetchCategories();
  }, []);
  
  // Fonction pour ajouter une catégorie
  const addCategory = async (name: string) => {
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la création de la catégorie');
      }
      
      const newCategory = await response.json();
      
      // Mettre à jour l'état local avec la nouvelle catégorie
      setCategories(prevCategories => [...prevCategories, newCategory]);
      
      return newCategory;
    } catch (error) {
      console.error('Error adding category:', error);
      throw error;
    }
  };
  
  // Fonction pour supprimer une catégorie
  const deleteCategory = async (id: number) => {
    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la suppression de la catégorie');
      }
      
      // Mettre à jour l'état local en supprimant la catégorie
      setCategories(prevCategories => prevCategories.filter(cat => cat.id !== id));
      
      return true;
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  };
  
  return {
    categories,
    loading,
    error,
    fetchCategories,
    addCategory,
    deleteCategory,
  };
}
