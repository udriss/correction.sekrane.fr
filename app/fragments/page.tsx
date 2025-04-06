'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Alert,
  Chip,
  useTheme,
  Tooltip,
  Button
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import AddIcon from '@mui/icons-material/Add';
import LoadingSpinner from '@/components/LoadingSpinner';
import useAuth from '@/hooks/useAuth';
import GradientBackground from '@/components/ui/GradientBackground';
import PatternBackground from '@/components/ui/PatternBackground';
import { FragmentForm, FragmentEditor } from '@/components/fragments';

// Importation des composants extraits
import { SearchAndFilterBar } from '@/components/fragments/SearchAndFilterBar';
import { FragmentsList } from '@/components/fragments/FragmentsList';
import { DeleteFragmentDialog } from '@/components/fragments/DeleteFragmentDialog';
import { CategoryManagementDialog } from '@/components/fragments/CategoryManagementDialog';
import { DeleteCategoryDialog } from '@/components/fragments/DeleteCategoryDialog';
import { EditFragmentDialog } from '@/components/fragments/EditFragmentDialog';
import { NewFragmentDialog } from '@/components/fragments/NewFragmentDialog';
import { NotificationSnackbar } from '@/components/ui/NotificationSnackbar';
import { FragmentsHeader } from '@/components/fragments/FragmentsHeader';
import { FragmentsActions } from '@/components/fragments/FragmentsActions';

// Types
import { Category, Activity } from '@/types/fragments';
import type { Fragment as ImportedFragment } from '@/types/fragments';

// Define a compatible Fragment type that doesn't allow null for activity_name
// Include UI-specific properties for rendering and updates
type Fragment = Omit<ImportedFragment, 'activity_name'> & {
  activity_name?: string;
  _forceUpdate?: number;
  _renderKey?: number;
};

export default function FragmentsLibraryPage() {
  const { user, status } = useAuth();
  const theme = useTheme();
  
  const isAuthenticated = status === 'authenticated';
  
  const [fragments, setFragments] = useState<Fragment[]>([]);
  const [filteredFragments, setFilteredFragments] = useState<Fragment[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [userOnly, setUserOnly] = useState(false);
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fragmentToDelete, setFragmentToDelete] = useState<Fragment | null>(null);
  const [deleteError, setDeleteError] = useState('');
  
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });
  
  const [page, setPage] = useState(1);
  const [fragmentsPerPage] = useState(10);
  
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [managedCategories, setManagedCategories] = useState<string[]>([]);
  
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingFragment, setEditingFragment] = useState<Fragment | null>(null);
  const [editingSuccess, setEditingSuccess] = useState(false);
  // Ajout d'un état pour suivre l'ID du fragment en cours de mise à jour
  const [updatingFragmentId, setUpdatingFragmentId] = useState<number | undefined>(undefined);

  const [newFragmentModalOpen, setNewFragmentModalOpen] = useState(false);
  const [creatingSuccess, setCreatingSuccess] = useState(false);
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);

  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);
  const [categoryDeleteError, setCategoryDeleteError] = useState<string | null>(null);
  const [categoryDeleteSuccess, setCategoryDeleteSuccess] = useState(false);

  const [isAddingCategory, setIsAddingCategory] = useState(false);
  
  // Ajouter un état pour suivre l'état de synchronisation des données
  const [fragmentsData, setFragmentsData] = useState<{
    fragments: Fragment[];
    lastUpdated: number;
    isStale: boolean;
  }>({
    fragments: [],
    lastUpdated: Date.now(),
    isStale: true
  });
  
  // Fonction pour charger les activités
  const fetchActivities = useCallback(async () => {
    try {
      setLoadingActivities(true);
      const response = await fetch('/api/activities');
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des activités');
      }
      const data = await response.json();
      setActivities(data);
      
      // Sélectionner la première activité par défaut
      if (data.length > 0 && !selectedActivityId) {
        setSelectedActivityId(data[0].id);
      }
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError('Impossible de charger les activités. Veuillez réessayer plus tard.');
    } finally {
      setLoadingActivities(false);
    }
  }, [selectedActivityId]);
  
  // Charger les activités au chargement de la page
  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);
  
  // Fonction de gestion de la création réussie d'un fragment
  const handleCreateSuccess = (newFragment: Fragment) => {
    setCreatingSuccess(true);
    
    // Ajouter un marqueur temporel pour forcer le rendu
    const enhancedFragment = {
      ...newFragment,
      _forceUpdate: Date.now()
    };
    
    // Mettre à jour l'état unifié des fragments
    setFragmentsData(prevData => ({
      fragments: [enhancedFragment, ...prevData.fragments],
      lastUpdated: Date.now(),
      isStale: false
    }));
    
    // Mettre à jour les listes principales avec des tableaux entièrement nouveaux
    setFragments(prevFragments => [enhancedFragment, ...prevFragments]);
    
    // Appliquer immédiatement le tri et la mise à jour des fragments filtrés
    setTimeout(() => {
      // Récupérer l'état le plus récent pour le tri
      const updatedFragments = [enhancedFragment, ...fragments];
      let result = [...updatedFragments];
      
      // Appliquer le même tri que dans useEffect
      switch(sortBy) {
        case 'newest':
          result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          break;
        case 'oldest':
          result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          break;
        case 'mostUsed':
          result.sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0));
          break;
        case 'alphabetical':
          result.sort((a, b) => a.content.localeCompare(b.content));
          break;
      }
      
      // Mettre à jour les fragments filtrés
      setFilteredFragments([...result]);
      
      
    }, 50);
    
    // Afficher un message de succès
    setNotification({
      open: true,
      message: 'Fragment ajouté avec succès',
      severity: 'success'
    });
    
    // Fermer le modal après un court délai
    setTimeout(() => {
      setNewFragmentModalOpen(false);
      setCreatingSuccess(false);
    }, 1500);
  };

  // Correction de la dépendance circulaire dans fetchFragments
  const fetchFragments = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (userOnly && isAuthenticated) {
        queryParams.append('userOnly', 'true');
      }
      
      // Pour le filtre par catégorie, utiliser l'ID de la catégorie au lieu du nom
      if (categoryFilter !== 'all' && categoryFilter !== 'manage_categories') {
        // Trouver la catégorie par son nom et obtenir son ID
        const selectedCategory = categories.find(cat => cat.name === categoryFilter);
        if (selectedCategory) {
          queryParams.append('categoryId', selectedCategory.id.toString());
        }
      }
      
      if (searchQuery) {
        queryParams.append('search', searchQuery);
      }
      
      const response = await fetch(`/api/fragments?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des fragments');
      }
      const data = await response.json();
      setFragments(data);
      
      // Mettre à jour l'état unifié des fragments
      setFragmentsData({
        fragments: data,
        lastUpdated: Date.now(),
        isStale: false
      });
      
      // Mettre à jour aussi les états classiques pour compatibilité
      setFragments(data);
      
    } catch (err) {
      console.error('Error fetching fragments:', err);
      setError('Impossible de charger les fragments. Veuillez réessayer plus tard.');
      setFragmentsData(prev => ({...prev, isStale: true}));
    } finally {
      setLoading(false);
    }
  }, [userOnly, categoryFilter, searchQuery, isAuthenticated]);
  
  const fetchCategories = useCallback(async (): Promise<void> => {
    try {
      setLoadingCategories(true);
      const response = await fetch('/api/categories');
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des catégories');
      }
      const data = await response.json();
      setCategories(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Impossible de charger les catégories. Veuillez réessayer plus tard.');
    } finally {
      setLoadingCategories(false);
    }
  }, []);
  
  // Modifions useEffect pour éviter les appels inutiles ou redondants
  useEffect(() => {
    // Nous chargeons les fragments uniquement au montage initial
    // mais pas en réponse à des changements de fetchFragments qui pourraient créer des cycles
    const initialLoad = async () => {
      await fetchFragments();
    };
    
    initialLoad();
    // Pas de dépendance à fetchFragments pour éviter les boucles
  }, []);
  
  // Appel séparé pour les catégories
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);
  
  useEffect(() => {
    if (categories.length > 0) {
      setManagedCategories(categories.map(cat => cat.name));
    }
  }, [categories]);
  
  useEffect(() => {
    let result = [...fragmentsData.fragments];
    
    switch(sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'mostUsed':
        result.sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0));
        break;
      case 'alphabetical':
        result.sort((a, b) => a.content.localeCompare(b.content));
        break;
    }
    
    setFilteredFragments(result);
    setPage(1);
  }, [fragmentsData, sortBy]);
  
  const indexOfLastFragment = page * fragmentsPerPage;
  const indexOfFirstFragment = indexOfLastFragment - fragmentsPerPage;
  
  // Génération d'une clé de fragment unique pour forcer la mise à jour des composants enfants
  const fragmentsWithKeys = React.useMemo(() => {
    return filteredFragments.map(fragment => ({
      ...fragment,
      // Utiliser un nombre au lieu d'une chaîne pour _renderKey
      _renderKey: Date.now() + Math.random() 
    }));
  }, [filteredFragments]);
  
  // Utiliser les fragments avec clés pour la pagination
  const currentFragments = fragmentsWithKeys.slice(indexOfFirstFragment, indexOfLastFragment);
  const totalPages = Math.ceil(filteredFragments.length / fragmentsPerPage);
  
  const copyToClipboard = async (text: string) => {
    try {
      // Vérifier si l'API Clipboard est disponible dans l'environnement courant
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        setNotification({
          open: true,
          message: 'Fragment copié dans le presse-papiers',
          severity: 'success'
        });
      } else {
        // Solution de secours utilisant un élément textarea temporaire
        const textArea = document.createElement('textarea');
        textArea.value = text;
        
        // Masquer l'élément textarea mais s'assurer qu'il est dans la page
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        
        // Sélectionner et copier le texte
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        
        // Nettoyer
        document.body.removeChild(textArea);
        
        if (successful) {
          setNotification({
            open: true,
            message: 'Fragment copié dans le presse-papiers',
            severity: 'success'
          });
        } else {
          throw new Error('Échec de la copie');
        }
      }
    } catch (err) {
      console.error('Erreur lors de la copie:', err);
      setNotification({
        open: true,
        message: 'Impossible de copier le fragment',
        severity: 'error'
      });
    }
  };
  
  const handleDeleteFragment = async () => {
    if (!fragmentToDelete) return;
    
    try {
      const response = await fetch(`/api/fragments/${fragmentToDelete.id}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 409) {
          setDeleteError(`Ce fragment est utilisé dans ${data.usageCount} correction(s) et ne peut pas être supprimé.`);
          return;
        }
        const errorMessage = data.sqlMessage 
          ? `Erreur SQL: ${data.sqlMessage}` 
          : (data.error || 'Erreur lors de la suppression du fragment');
        throw new Error(errorMessage);
      }
      
      setDeleteDialogOpen(false);
      setFragmentToDelete(null);
      setDeleteError('');
      
      setNotification({
        open: true,
        message: 'Fragment supprimé avec succès',
        severity: 'success'
      });
      
      fetchFragments();
    } catch (err) {
      console.error('Error deleting fragment:', err);
      setDeleteError((err as Error).message || 'Erreur lors de la suppression du fragment');
    }
  };
  
  // Remplacer handleAddCategory par une version corrigée sans appel de hook à l'intérieur
  const handleAddCategory = async () => {
    if (!newCategory.trim() || managedCategories.includes(newCategory.trim())) {
      return;
    }
    
    // Utiliser l'état défini au niveau du composant
    setIsAddingCategory(true);
    
    try {
      // Appeler l'API pour créer la catégorie
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategory.trim() }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la création de la catégorie');
      }
      
      // Récupérer la nouvelle catégorie ajoutée avec son ID
      const newCategoryData = await response.json();
      
      // Mettre à jour l'interface utilisateur
      setManagedCategories([...managedCategories, newCategory.trim()]);
      
      // Rafraîchir la liste complète des catégories pour inclure le nouvel ID
      await fetchCategories();
      
      // Afficher un message de succès
      setNotification({
        open: true,
        message: `Catégorie "${newCategory.trim()}" ajoutée avec succès`,
        severity: 'success'
      });
      
      // Réinitialiser le champ
      setNewCategory('');
    } catch (error: any) {
      console.error('Error creating category:', error);
      setError(error.message || 'Erreur lors de la création de la catégorie');
      
      // Afficher un message d'erreur
      setNotification({
        open: true,
        message: `Erreur: ${error.message || 'Problème lors de la création de la catégorie'}`,
        severity: 'error'
      });
    } finally {
      setIsAddingCategory(false);
    }
  };

  // Remplacer handleDeleteCategory par une version améliorée
  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    
    setIsDeletingCategory(true);
    setCategoryDeleteError(null);
    setCategoryDeleteSuccess(false);
    
    try {
      // Rechercher l'ID de la catégorie à partir de son nom
      const categoryObj = categories.find(cat => cat.name === categoryToDelete.name);
      
      if (!categoryObj) {
        throw new Error('Catégorie non trouvée');
      }
      
      // Appeler l'API pour supprimer la catégorie
      const response = await fetch(`/api/categories/${categoryObj.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la suppression de la catégorie');
      }
      
      // Mise à jour des états après suppression réussie
      setManagedCategories(managedCategories.filter(cat => cat !== categoryToDelete.name));
      setCategoryDeleteSuccess(true);
      
      // Rafraîchir la liste des catégories
      await fetchCategories();
      
      // Message de succès
      setNotification({
        open: true,
        message: `Catégorie "${categoryToDelete.name}" supprimée avec succès`,
        severity: 'success'
      });
    } catch (error: any) {
      console.error('Error deleting category:', error);
      setCategoryDeleteError(error.message || 'Erreur lors de la suppression de la catégorie');
    } finally {
      setIsDeletingCategory(false);
    }
  };
  
  // Fonction pour ouvrir le dialogue de confirmation de suppression
  const openDeleteCategoryDialog = (categoryName: string) => {
    const category = categories.find(cat => cat.name === categoryName);
    if (!category) return;
    
    setCategoryToDelete(category);
    setShowDeleteWarning(true);
    setCategoryDeleteError(null);
    setCategoryDeleteSuccess(false);
  };
  
  // Fonction pour fermer le dialogue de suppression
  const handleCloseDeleteCategoryDialog = () => {
    setShowDeleteWarning(false);
    setCategoryToDelete(null);
    setCategoryDeleteSuccess(false);
    setCategoryDeleteError(null);
  };
  
  const openDeleteDialog = (fragment: Fragment) => {
    setFragmentToDelete(fragment);
    setDeleteDialogOpen(true);
    setDeleteError('');
  };
  
  const handleCloseNotification = () => {
    setNotification({
      ...notification,
      open: false
    });
  };

  const handleEditFragment = (fragment: Fragment) => {
    // Make sure the fragment object conforms to the expected shape
    // Ensure tags is always an array and categories is defined
    const normalizedFragment: Fragment = {
      ...fragment,
      tags: Array.isArray(fragment.tags) ? fragment.tags : 
            (typeof fragment.tags === 'string' ? JSON.parse(fragment.tags) : []),
      categories: fragment.categories || [] // Ensure categories is defined, even if empty
    };
    
    setEditingFragment(normalizedFragment);
    setEditModalOpen(true);
    setEditingSuccess(false);
  };

  const handleCloseEditModal = () => {
    if (!editingSuccess) {
      setEditModalOpen(false);
      setEditingFragment(null);
    }
  };

  const handleEditSuccess = (updatedFragment: ImportedFragment) => {
    // Définir l'ID du fragment en cours de mise à jour pour afficher le spinner
    setUpdatingFragmentId(updatedFragment.id);
    
    // Vérifier et normaliser les tags
    // Si les tags sont vides et qu'il y a un fragment en édition, utiliser ses tags
    if (Array.isArray(updatedFragment.tags) && updatedFragment.tags.length === 0 && editingFragment) {
      updatedFragment.tags = [...editingFragment.tags];
    }
    
    // S'assurer que les tags sont toujours un tableau
    const normalizedTags = Array.isArray(updatedFragment.tags) ? 
      [...updatedFragment.tags] : 
      (typeof updatedFragment.tags === 'string' ? 
        JSON.parse(updatedFragment.tags as string) : []);
    
    // Forcer une mise à jour visuelle avec un nouvel objet et un timestamp
    const normalizedUpdateTime = Date.now();
    
    // Créer un fragment normalisé qui est compatible avec le type Fragment
    const normalizedFragment: Fragment = {
      ...updatedFragment,
      tags: normalizedTags,
      // Convertir null en undefined pour activity_name pour résoudre l'erreur de type
      activity_name: updatedFragment.activity_name === null ? undefined : updatedFragment.activity_name,
      // Ces propriétés supplémentaires sont utilisées pour forcer la mise à jour visuelle
      _forceUpdate: normalizedUpdateTime,
      _renderKey: Math.random(),
    };
    
    // Mettre à jour le fragment dans le tableau et définir le succès
    setFragments(prevFragments => {
      return prevFragments.map(f => {
        if (f.id === normalizedFragment.id) {
          
          return normalizedFragment; // Remplacer par le fragment mis à jour complet
        }
        return f;
      });
    });
    
    // Forcer la mise à jour des fragments filtrés également
    setFilteredFragments(prevFiltered => {
      return prevFiltered.map(f => {
        if (f.id === normalizedFragment.id) {
          
          return normalizedFragment;  // Remplacer par le fragment mis à jour complet
        }
        return f;
      });
    });
    
    // Mettre à jour fragmentsData pour forcer le rendu de la liste
    setFragmentsData(prev => ({
      ...prev,
      lastUpdated: normalizedUpdateTime
    }));
    
    setEditingSuccess(true);
    setNotification({
      open: true,
      message: 'Fragment mis à jour avec succès',
      severity: 'success'
    });
    
    // Réinitialiser l'ID du fragment en cours de mise à jour après un délai
    // pour que le spinner disparaisse progressivement
    setTimeout(() => {
      setUpdatingFragmentId(undefined);
    }, 800);
    
    // Fermer la modal après un délai
    setTimeout(() => {
      setEditModalOpen(false);
      setEditingFragment(null);
      setEditingSuccess(false);
    }, 1500);
  };

  const formatFragmentCategories = (fragment: Fragment): React.ReactNode => {
    if (!fragment.categories || (Array.isArray(fragment.categories) && fragment.categories.length === 0)) {
      return (
        <Tooltip title="Aucune catégorie associée">
          <Chip 
            label="Sans catégorie" 
            size="small" 
            variant="outlined"
            sx={{ 
              borderRadius: 1.5, 
              borderStyle: 'dashed',
              color: 'text.secondary'
            }}
          />
        </Tooltip>
      );
    }
    
    let categoryIds: number[] = [];
    
    if (Array.isArray(fragment.categories)) {
      if (fragment.categories.length > 0) {
        if (typeof fragment.categories[0] === 'object' && fragment.categories[0] !== null && 'id' in fragment.categories[0]) {
          categoryIds = fragment.categories.map((cat: any) => cat.id);
        } else if (typeof fragment.categories[0] === 'number') {
          categoryIds = fragment.categories as number[];
        }
      }
    }
    
    return (
      <React.Fragment>
        {categoryIds.map((catId) => {
          const category = categories.find(c => c.id === catId);
          return (
            <Chip 
              key={catId} 
              label={category ? category.name : `ID:${catId}`} 
              size="small" 
              color="secondary"
              variant="filled" 
              sx={{
                backgroundColor: theme => theme.palette.secondary.light,
              }}
            />
          );
        })}
      </React.Fragment>
    );
  };

  // Gestionnaire amélioré pour le changement de catégorie
  const handleCategoryChange = (newValue: string) => {
    // Cas spécial pour gérer les catégories
    if (newValue === 'manage_categories') {
      setCategoryDialogOpen(true);
      return; // Ne pas modifier le filtre actuel
    }
    
    // Définir le state de manière synchrone
    setCategoryFilter(newValue);
    
    // Ajout d'un délai pour s'assurer que l'état est mis à jour avant d'exécuter le fetch
    setTimeout(() => {
      // Création explicite de queryParams à l'intérieur du setTimeout 
      // pour utiliser la valeur la plus récente
      const queryParams = new URLSearchParams();
      
      if (userOnly && isAuthenticated) {
        queryParams.append('userOnly', 'true');
      }
      
      if (searchQuery) {
        queryParams.append('search', searchQuery);
      }
      
      // Logique de filtre par catégorie ajustée
      if (newValue !== 'all') {
        // Chercher la catégorie par son nom pour obtenir l'ID
        const selectedCategory = categories.find(cat => cat.name === newValue);
        if (selectedCategory) {
          queryParams.append('categoryId', selectedCategory.id.toString());
        }
      }
      
      // Exécution explicite du fetch avec les paramètres construits
      setLoading(true);
      fetch(`/api/fragments?${queryParams.toString()}`)
        .then(response => {
          if (!response.ok) {
            throw new Error('Erreur lors du chargement des fragments');
          }
          return response.json();
        })
        .then(data => {
          setFragments(data);
        })
        .catch(err => {
          console.error('Error fetching fragments:', err);
          setError('Impossible de charger les fragments. Veuillez réessayer plus tard.');
        })
        .finally(() => setLoading(false));
    }, 100); // légère augmentation du délai pour garantir la synchronisation
  };

  // Gestionnaire pour la recherche
  const handleSearch = () => {
    fetchFragments();
  };
  
  // Gestionnaire pour le filtre utilisateur
  const handleUserFilterToggle = () => {
    setUserOnly(prev => !prev);
    // Appel délibéré après mise à jour de l'état
    setTimeout(() => {
      fetchFragments();
    }, 50);
  };

  if (status === 'unauthenticated') {
    return (
      <Container maxWidth="lg" className="py-8 max-w-4xl mx-auto">
        <Typography variant="h4" component="h1" color='text.parimary' gutterBottom>
          Bibliothèque de fragments
        </Typography>
        <Alert severity="error" className="mb-4">
          Erreur d'authentification: utilisateur non authentifié. 
          <Button 
            color="inherit" 
            size="small" 
            href="/login" 
            sx={{ ml: 1 }}
            variant="outlined"
          >
            Se connecter
          </Button>
        </Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box
          className="max-w-4xl mx-auto"
          sx={{ 
            minHeight: '100vh',
            pb: 8,
            background: theme.palette.mode === 'dark' 
              ? 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)' 
              : 'linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%)'
          }}
        >
          <GradientBackground variant="primary" sx={{ pt: 5, pb: 6, px: 3, mb: 4 }}>
            <PatternBackground 
              pattern='dots'
              opacity={0.05}
              sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: -1 }}
            >
              <Typography variant="h4" component="h1" color='text.parimary' gutterBottom>
                Bibliothèque de fragments
              </Typography>
              <div className="py-10 flex justify-center max-w-[400px] mx-auto">
                <LoadingSpinner text="Chargement des fragments" />
              </div>
            </PatternBackground>
          </GradientBackground>
        </Box>  
      </Container>
    );
  }

  // Add a check to make sure we have data before rendering components that depend on it
  if (!categories || categories.length === 0) {
    return (
      <Container maxWidth="lg">
        <Box className="max-w-4xl mx-auto">
          <Typography variant="h6" color="text.secondary">
            Chargement des catégories...
          </Typography>
        </Box>
      </Container>
    );
  }



  return (
    <Box
      className="max-w-4xl mx-auto"
      sx={{ 
        minHeight: '100vh',
        pb: 8,
        background: theme.palette.mode === 'dark' 
          ? 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)' 
          : 'linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%)'
      }}
    >
      {/* Utilisation du composant d'en-tête */}
      <FragmentsHeader 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        categoryFilter={categoryFilter}
        categories={categories}
        handleSearch={handleSearch}
        handleCategoryChange={handleCategoryChange}
      />

      <Container className="max-w-4xl" sx={{ px: { xs: 2, sm: 3 } }}>
        {error && (
          <Alert severity="error" sx={{ mb: 4, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {/* Utilisation du composant d'actions */}
        <FragmentsActions 
          isAuthenticated={isAuthenticated}
          userOnly={userOnly}
          filteredFragmentsCount={filteredFragments.length}
          handleUserFilterToggle={handleUserFilterToggle}
          openNewFragmentModal={() => setNewFragmentModalOpen(true)}
        />

        {/* Utilisation du composant de liste de fragments */}
        <FragmentsList 
          fragments={currentFragments}
          formatFragmentCategories={formatFragmentCategories} 
          copyToClipboard={copyToClipboard}
          handleEditFragment={handleEditFragment}
          openDeleteDialog={openDeleteDialog}
          totalPages={totalPages}
          page={page}
          setPage={setPage}
          theme={theme}
          lastUpdated={fragmentsData.lastUpdated} // Passer le timestamp pour forcer la mise à jour
          updatingFragmentId={updatingFragmentId} // Passer l'ID du fragment en cours de mise à jour
        />
      </Container>
      
      {/* Utilisation des composants de dialogue */}
      <DeleteFragmentDialog 
        open={deleteDialogOpen}
        setOpen={setDeleteDialogOpen}
        fragmentToDelete={fragmentToDelete}
        deleteError={deleteError}
        handleDeleteFragment={handleDeleteFragment}
        theme={theme}
      />
      
      <CategoryManagementDialog 
        open={categoryDialogOpen}
        setOpen={setCategoryDialogOpen}
        newCategory={newCategory}
        setNewCategory={setNewCategory}
        managedCategories={managedCategories}
        handleAddCategory={handleAddCategory}
        openDeleteCategoryDialog={openDeleteCategoryDialog}
        isAddingCategory={isAddingCategory}
        theme={theme}
      />
      
      <DeleteCategoryDialog 
        open={showDeleteWarning}
        onClose={handleCloseDeleteCategoryDialog}
        categoryToDelete={categoryToDelete}
        isDeletingCategory={isDeletingCategory}
        categoryDeleteError={categoryDeleteError}
        categoryDeleteSuccess={categoryDeleteSuccess}
        handleDeleteCategory={handleDeleteCategory}
        theme={theme}
      />
      
      <EditFragmentDialog 
        open={editModalOpen}
        onClose={handleCloseEditModal}
        fragment={editingFragment}
        categories={categories}
        editingSuccess={editingSuccess}
        onUpdate={handleEditSuccess}
        fetchCategories={fetchCategories}
        theme={theme}
      />
      
      <NewFragmentDialog 
        open={newFragmentModalOpen}
        setOpen={setNewFragmentModalOpen}
        creatingSuccess={creatingSuccess}
        selectedActivityId={selectedActivityId}
        setSelectedActivityId={setSelectedActivityId}
        activities={activities}
        loadingActivities={loadingActivities}
        categories={categories}
        onSuccess={handleCreateSuccess}
        fetchCategories={fetchCategories}
        theme={theme}
      />
      
      <NotificationSnackbar 
        open={notification.open}
        message={notification.message}
        severity={notification.severity}
        onClose={handleCloseNotification}
        theme={theme}
      />
    </Box>
  );
}
