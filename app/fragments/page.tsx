'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Divider,
  Button,
  Card,
  CardContent,
  Skeleton,
  IconButton,
  Tooltip,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Modal,
  Box as MuiBox,
  Grid,
  alpha,
  useTheme,
  Zoom,
  Fade
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import CategoryIcon from '@mui/icons-material/CategoryOutlined';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import CloseIcon from '@mui/icons-material/Close';
import CircularProgress from '@mui/material/CircularProgress';
import LoadingSpinner from '@/components/LoadingSpinner';
import useAuth from '@/hooks/useAuth';
import { FragmentForm, CategorySelect } from '@/components/fragments';
import GradientBackground from '@/components/ui/GradientBackground';
import PatternBackground from '@/components/ui/PatternBackground';
import H1Title from '@/components/ui/H1Title';

// Types
interface Fragment {
  id: number;
  content: string;
  category: string;
  tags?: string[];
  activity_id?: number;
  activity_name?: string;
  created_at: string;
  usage_count?: number;
  isOwner?: boolean;
  user_id?: string;
  categories?: Array<{id: number, name: string}> | number[];
}

interface Category {
  id: number;
  name: string;
}

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

  // Ajout d'états pour le modal de nouveau fragment
  const [newFragmentModalOpen, setNewFragmentModalOpen] = useState(false);
  const [creatingSuccess, setCreatingSuccess] = useState(false);
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(null);
  const [activities, setActivities] = useState<Array<{id: number, name: string}>>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);

  // Ajouter les états pour gérer la suppression de catégorie
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);
  const [categoryDeleteError, setCategoryDeleteError] = useState<string | null>(null);
  const [categoryDeleteSuccess, setCategoryDeleteSuccess] = useState(false);

  // Ajouter un état au niveau du composant pour gérer le chargement
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  
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
    
    // Ajouter le nouveau fragment à la liste
    setFragments(prevFragments => [newFragment, ...prevFragments]);
    setFilteredFragments(prevFragments => [newFragment, ...prevFragments]);
    
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
      
    } catch (err) {
      console.error('Error fetching fragments:', err);
      setError('Impossible de charger les fragments. Veuillez réessayer plus tard.');
    } finally {
      setLoading(false);
    }
  // Retirer categories des dépendances pour éviter un cycle de dépendances
  }, [userOnly, categoryFilter, searchQuery, isAuthenticated]);
  
  const fetchCategories = useCallback(async () => {
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
    let result = [...fragments];
    
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
  }, [fragments, sortBy]);
  
  const indexOfLastFragment = page * fragmentsPerPage;
  const indexOfFirstFragment = indexOfLastFragment - fragmentsPerPage;
  const currentFragments = filteredFragments.slice(indexOfFirstFragment, indexOfLastFragment);
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
      
      // Récupérer la nouvelle catégorie créée avec son ID
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
    setEditingFragment(fragment);
    setEditModalOpen(true);
    setEditingSuccess(false);
  };

  const handleCloseEditModal = () => {
    if (!editingSuccess) {
      setEditModalOpen(false);
      setEditingFragment(null);
    }
  };

  const handleEditSuccess = (updatedFragment: Fragment) => {
    setEditingSuccess(true);
    
    setFragments(prevFragments => 
      prevFragments.map(f => 
        f.id === updatedFragment.id ? updatedFragment : f
      )
    );
    
    setFilteredFragments(prevFragments => 
      prevFragments.map(f => 
        f.id === updatedFragment.id ? updatedFragment : f
      )
    );
    
    setNotification({
      open: true,
      message: 'Fragment mis à jour avec succès',
      severity: 'success'
    });
    
    setTimeout(() => {
      setEditModalOpen(false);
      setEditingFragment(null);
      setEditingSuccess(false);
    }, 1500);
  };

  const formatFragmentCategories = (fragment: Fragment): React.ReactNode => {
    if (!fragment.categories || (Array.isArray(fragment.categories) && fragment.categories.length === 0)) {
      return null;
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
    // Suppression de la référence à fragment.category_id qui cause l'erreur
    
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
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
      </Box>
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
    
    // Log de débogage pour voir la valeur exacte
    
    
    // Ajout d'un délai pour s'assurer que l'état est mis à jour avant d'exécuter le fetch
    setTimeout(() => {
      // Logging à l'intérieur du timeout pour confirmer l'état utilisé
      
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
    }}>
      {/* En-tête avec dégradé */}
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

  return (
    <Box
    className="max-w-4xl mx-auto"
     sx={{ 
      minHeight: '100vh',
      pb: 8,
      background: theme.palette.mode === 'dark' 
        ? 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)' 
        : 'linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%)'
    }}>
      {/* En-tête avec dégradé */}
      <GradientBackground variant="primary" sx={{ pt: 5, pb: 6, px: 3, mb: 4 }}>
        <PatternBackground 
          pattern='dots'
          opacity={0.05}
          sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: -1 }}
        />
        <Container className="max-w-4xl">
          <Zoom in={true} timeout={800}>
            <Box>
              <Box>
                <H1Title 
                  mb={2}
                >
                  Bibliothèque de fragments
                </H1Title>
                <Typography 
                  variant="subtitle1" 
                  color="text.secondary"
                  sx={{ mb: 4 }}
                >
                  Parcourez et utilisez des fragments de texte prédéfinis pour vos corrections
                </Typography>
              </Box>
            </Box>
          </Zoom>
          
          {/* Barre de recherche et filtres */}
          <Fade in={true} timeout={1000}>
            <Paper 
              elevation={3} 
              sx={{ 
                p: { xs: 2, sm: 3 }, 
                borderRadius: 3,
                backdropFilter: 'blur(20px)',
                backgroundColor: alpha(theme.palette.background.paper, 0.9),
                boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.15)}`
              }}
            >
              <Grid container spacing={2} alignItems="center">
                <Grid size={{ xs: 12, md: 5 }}>
                  <TextField
                    label="Rechercher"
                    variant="outlined"
                    size="small"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                    slotProps={{
                      input: {
                        startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
                        endAdornment: (
                          <IconButton 
                            size="small" 
                            onClick={handleSearch}
                            sx={{ ml: -1 }}
                          >
                            <SearchIcon fontSize="small" />
                          </IconButton>
                        )
                      }
                    }}
                    fullWidth
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3, sm: 6 }}>
                  <FormControl size="small" fullWidth>
                    <InputLabel id="category-filter-label">Catégorie</InputLabel>
                    <Select
                      labelId="category-filter-label"
                      value={categoryFilter}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      label="Catégorie"
                      startAdornment={<CategoryIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />}
                    >
                      <MenuItem value="all">Toutes</MenuItem>
                      {categories.map((category) => (
                        <MenuItem key={category.id} value={category.name}>
                          {category.name}
                        </MenuItem>
                      ))}
                      
                      {isAuthenticated && (
                        <MenuItem 
                          value="manage_categories" 
                          sx={{ color: 'primary.main', fontWeight: 'medium' }}
                        >
                          <SettingsIcon fontSize="small" sx={{ mr: 1 }} />
                          Gérer les catégories
                        </MenuItem>
                      )}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 4, sm: 6 }} sx={{ display: 'flex', gap: 1 }}>
                  {isAuthenticated && (
                    <>
                      <Tooltip title={userOnly ? "Afficher tous les fragments" : "Afficher uniquement mes fragments"}>
                        <Button
                          variant="contained"
                          color={userOnly ? "primary" : "secondary"}
                          startIcon={<PersonIcon />}
                          onClick={handleUserFilterToggle}
                          size="medium"
                          sx={{ flex: 1 }}
                        >
                          {userOnly ? "Mes fragments" : "Tous"}
                        </Button>
                      </Tooltip>
                      
                      <Button 
                        variant="contained" 
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={() => setNewFragmentModalOpen(true)}
                        sx={{ flex: 1 }}
                      >
                        Nouveau
                      </Button>
                    </>
                  )}
                </Grid>
              </Grid>
            </Paper>
          </Fade>
        </Container>
      </GradientBackground>

      <Container className="max-w-4xl" sx={{ px: { xs: 2, sm: 3 } }}>
        {error && (
          <Alert severity="error" sx={{ mb: 4, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" color="text.secondary" fontWeight="medium">
            {filteredFragments.length} fragments trouvés
          </Typography>
        </Box>

        {currentFragments.length === 0 ? (
          <Fade in={true} timeout={500}>
            <Alert 
              severity="info" 
              sx={{ 
                borderRadius: 2, 
                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.1)}`,
                backgroundColor: alpha(theme.palette.info.light, 0.1)
              }}
            >
              Aucun fragment ne correspond à vos critères de recherche.
            </Alert>
          </Fade>
        ) : (
          <Box sx={{ mb: 5 }}>
            <Grid container spacing={2}>
              {currentFragments.map((fragment, index) => (
                <Grid size={{ xs: 12 }} key={fragment.id}>
                  <Fade in={true} timeout={300 + index * 100} style={{ transitionDelay: `${index * 50}ms` }}>
                    <Card 
                      sx={{ 
                        borderRadius: 3,
                        overflow: 'hidden',
                        transition: 'all 0.3s ease',
                        '&:hover': { 
                          boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.15)}`,
                          transform: 'translateY(-2px)'
                        },
                        border: '1px solid',
                        borderColor: alpha(theme.palette.divider, 0.1)
                      }}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography 
                              variant="body2" 
                              color="text.secondary"
                              sx={{ 
                                py: 0.5, 
                                px: 1.5, 
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                borderRadius: 5,
                                fontSize: '0.75rem'
                              }}
                            >
                              {fragment.activity_name || 'Général'}
                            </Typography>
                            {fragment.isOwner && (
                              <Chip
                                label="Mon fragment"
                                size="small"
                                color="primary"
                                variant="filled"
                                icon={<PersonIcon fontSize="small" />}
                                sx={{ height: 24 }}
                              />
                            )}
                          </Box>
                          <Box>
                            <Tooltip title="Copier">
                              <IconButton 
                                size="small" 
                                onClick={() => copyToClipboard(fragment.content)}
                                sx={{ 
                                  color: theme.palette.primary.main,
                                  '&:hover': { 
                                    bgcolor: alpha(theme.palette.primary.main, 0.1)
                                  }
                                }}
                              >
                                <ContentCopyIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            
                            {fragment.isOwner && (
                              <>
                                <Tooltip title="Modifier">
                                  <IconButton 
                                    size="small" 
                                    onClick={() => handleEditFragment(fragment)}
                                    color="primary"
                                    sx={{ 
                                      '&:hover': { 
                                        bgcolor: alpha(theme.palette.primary.main, 0.1)
                                      }
                                    }}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                
                                <Tooltip title="Supprimer">
                                  <IconButton 
                                    size="small" 
                                    color="error"
                                    onClick={() => openDeleteDialog(fragment)}
                                    sx={{ 
                                      '&:hover': { 
                                        bgcolor: alpha(theme.palette.error.main, 0.1)
                                      }
                                    }}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                          </Box>
                        </Box>
                        
                        <Typography 
                          variant="body1" 
                          gutterBottom
                          sx={{ 
                            py: 2, 
                            px: 0.5, 
                            lineHeight: 1.6,
                            color: theme.palette.text.primary
                          }}
                        >
                          {fragment.content}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                          {formatFragmentCategories(fragment)}
                          
                          {fragment.tags?.map(tag => (
                            <Chip 
                              key={tag} 
                              label={tag} 
                              size="small" 
                              variant="filled"
                              color="secondary"
                              sx={{ borderRadius: 1.5 }}
                            />
                          ))}
                          
                          {fragment.usage_count !== undefined && fragment.usage_count > 0 && (
                            <Chip 
                              label={`Utilisé ${fragment.usage_count} fois`} 
                              size="small" 
                              variant="filled"
                              color="secondary"
                              sx={{ borderRadius: 1.5 }}
                            />
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Fade>
                </Grid>
              ))}
            </Grid>
            
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
                <Paper 
                  elevation={2} 
                  sx={{ 
                    p: 1, 
                    borderRadius: 3,
                    backgroundColor: alpha(theme.palette.background.paper, 0.8),
                    backdropFilter: 'blur(8px)'
                  }}
                >
                  <Pagination 
                    count={totalPages} 
                    page={page} 
                    onChange={(_, newPage) => setPage(newPage)}
                    color="primary"
                    size="large"
                    shape="rounded"
                    sx={{ '& .MuiPaginationItem-root': { mx: 0.5 } }}
                  />
                </Paper>
              </Box>
            )}
          </Box>
        )}
      </Container>
      
      {/* Dialog pour la suppression d'un fragment */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="delete-fragment-dialog-title"
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: `0 8px 32px ${alpha(theme.palette.error.main, 0.2)}`
          }
        }}
      >
        <DialogTitle component={"h2"} id="delete-fragment-dialog-title">
          Confirmer la suppression
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir supprimer ce fragment ? Cette action est irréversible.
          </DialogContentText>
          {fragmentToDelete && (
            <Paper variant="outlined" sx={{ p: 2, mt: 2, bgcolor: 'background.default' }}>
              <Typography variant="body2" gutterBottom fontStyle="italic">
                {fragmentToDelete.content}
              </Typography>
            </Paper>
          )}
          {deleteError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {deleteError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
            Annuler
          </Button>
          <Button onClick={handleDeleteFragment} color="error">
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialog pour la gestion des catégories */}
      <Dialog
        open={categoryDialogOpen}
        onClose={() => setCategoryDialogOpen(false)}
        aria-labelledby="category-management-dialog-title"
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.2)}`
          }
        }}
      >
        <DialogTitle component={"h2"} id="category-management-dialog-title">
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CategoryIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography>Gérer les catégories</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Les catégories vous aident à organiser vos fragments pour une recherche et une utilisation plus faciles.
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                label="Nouvelle catégorie"
                size="small"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                // Utiliser onKeyDown au lieu de onKeyPress
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCategory();
                  }
                }}
                fullWidth
              />
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddCategory}
                disabled={!newCategory.trim() || managedCategories.includes(newCategory.trim()) || isAddingCategory}
              >
                {isAddingCategory ? 'Ajout...' : 'Ajouter'}
              </Button>
            </Box>
          </Box>
          
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Catégories existantes
          </Typography>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {managedCategories.map((cat) => (
              <Chip
                key={cat}
                label={cat}
                onDelete={() => openDeleteCategoryDialog(cat)} // Modifié ici pour ouvrir le dialogue
                color="primary"
                variant="filled"
              />
            ))}
            
            {managedCategories.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                Aucune catégorie définie
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCategoryDialogOpen(false)}>
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialog pour la suppression d'une catégorie */}
      <Dialog
        open={showDeleteWarning}
        onClose={() => !isDeletingCategory && handleCloseDeleteCategoryDialog()}
        sx={{
          maxWidth: '600px', mx: 'auto',
        }}
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: `0 8px 32px ${alpha(theme.palette.error.main, 0.2)}`
          }
        }}
      >
        <DialogTitle sx={{ color: categoryDeleteSuccess ? 'success.main' : 'error.main' }}>
          {categoryDeleteSuccess ? '' : 'Supprimer la catégorie'}
        </DialogTitle>
        <DialogContent>
          {categoryDeleteError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {categoryDeleteError}
            </Alert>
          )}
          
          {categoryDeleteSuccess ? (
            // Message de succès après suppression
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h6" color="success.main" gutterBottom>
                Suppression réussie !
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                La catégorie <strong>{categoryToDelete?.name}</strong> a été complètement supprimée.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tous les fragments associés à cette catégorie ont été mis à jour.
              </Typography>
            </Box>
          ) : (
            // Contenu de confirmation avant suppression
            <>
              <Typography variant="body1">
                Êtes-vous sûr de vouloir supprimer cette catégorie :
              </Typography>
              <Typography 
                variant="subtitle1" 
                fontWeight="bold"
                color="error.main"
                sx={{ my: 1 }}
              >
                {categoryToDelete?.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Cette action est irréversible et supprimera la catégorie de tous les fragments associés.
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          {categoryDeleteSuccess ? (
            // Un seul bouton pour fermer après suppression réussie
            <Button 
              onClick={handleCloseDeleteCategoryDialog} 
              color="primary"
              variant="contained"
              autoFocus
            >
              Fermer
            </Button>
          ) : (
            // Boutons de confirmation avant suppression
            <>
              <Button 
                onClick={handleCloseDeleteCategoryDialog} 
                color="inherit"
                disabled={isDeletingCategory}
              >
                Annuler
              </Button>
              <Button 
                onClick={handleDeleteCategory} 
                color="error" 
                disabled={isDeletingCategory}
                startIcon={isDeletingCategory ? <CircularProgress size={16} /> : null}
              >
                {isDeletingCategory ? 'Suppression...' : 'Supprimer'}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
      
      {/* Dialog pour l'édition d'un fragment */}
      <Dialog
        open={editModalOpen}
        onClose={handleCloseEditModal}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.2)}`
          }
        }}
      >
        <DialogTitle component={"h6"} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Modifier le fragment
          <IconButton edge="end" color="inherit" onClick={handleCloseEditModal} aria-label="close">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {editingFragment && (
            <Box sx={{ pt: 2 }}>
              {editingSuccess ? (
                <Alert severity="success" sx={{ mb: 2 }}>
                  Fragment mis à jour avec succès!
                </Alert>
              ) : (
                <EditFragmentForm 
                  fragment={editingFragment} 
                  categories={categories}
                  onSuccess={handleEditSuccess}
                  onCancel={handleCloseEditModal}
                />
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Dialog pour l'ajout d'un fragment */}
      <Dialog
        open={newFragmentModalOpen}
        onClose={() => !creatingSuccess && setNewFragmentModalOpen(false)}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.2)}`
          }
        }}
      >
        <DialogTitle component={"h2"} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Ajouter un nouveau fragment
          <IconButton 
            edge="end" 
            color="warning"
            onClick={() => setNewFragmentModalOpen(false)} 
            aria-label="close"
            disabled={creatingSuccess}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {creatingSuccess ? (
            <Alert severity="success" sx={{ my: 2 }}>
              Fragment ajouté avec succès!
            </Alert>
          ) : (
            <Box sx={{ pt: 2 }}>
              {/* Sélecteur d'activité */}
              <FormControl fullWidth margin="normal" sx={{ mb: 3 }}>
                <InputLabel id="activity-select-label">Activité</InputLabel>
                <Select
                  labelId="activity-select-label"
                  value={selectedActivityId || ''}
                  onChange={(e) => setSelectedActivityId(Number(e.target.value))}
                  label="Activité"
                  disabled={loadingActivities}
                >
                  {activities.map((activity) => (
                    <MenuItem key={activity.id} value={activity.id}>
                      {activity.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              {/* Formulaire de création de fragment */}
              <FragmentForm 
                activityId={selectedActivityId || undefined}
                categories={categories}
                onSuccess={handleCreateSuccess}
                onCancel={() => setNewFragmentModalOpen(false)}
                refreshCategories={fetchCategories}
              />
            </Box>
          )}
        </DialogContent>
      </Dialog>

      <Snackbar
        open={notification.open}
        autoHideDuration={3000}
        onClose={handleCloseNotification}
        message={notification.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        ContentProps={{
          sx: {
            borderRadius: 2,
            bgcolor: notification.severity === 'success' 
              ? theme.palette.success.dark 
              : notification.severity === 'error'
                ? theme.palette.error.dark
                : theme.palette.info.dark
          }
        }}
      />
    </Box>
  );
}

interface EditFragmentFormProps {
  fragment: Fragment;
  categories: Category[];
  onSuccess: (updatedFragment: Fragment) => void;
  onCancel: () => void;
}

const EditFragmentForm: React.FC<EditFragmentFormProps> = ({ 
  fragment, 
  categories,
  onSuccess, 
  onCancel 
}) => {
  const [content, setContent] = useState(fragment.content || '');
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    let categoryIds: number[] = [];
    
    if (fragment.categories) {
      if (Array.isArray(fragment.categories)) {
        if (fragment.categories.length > 0) {
          if (typeof fragment.categories[0] === 'object' && fragment.categories[0] !== null && 'id' in fragment.categories[0]) {
            categoryIds = fragment.categories.map((cat: any) => cat.id);
          } else if (typeof fragment.categories[0] === 'number') {
            categoryIds = fragment.categories as number[];
          }
        }
      }
    } 
    setSelectedCategories(categoryIds);
  }, [fragment]);
  
  const handleCategoryChange = (newCategories: number[]) => {
    setSelectedCategories(newCategories);
  };
  
  // Optimiser la fonction de rafraîchissement des catégories pour éviter les requêtes en boucle
  const refreshCategories = async () => {
    try {
      // Ajouter un indicateur d'état de chargement
      const [loading, setLoading] = useState(false);
      
      // Éviter les requêtes multiples pendant le chargement
      if (loading) return;
      
      setLoading(true);
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setLoading(false);
        return data;
      }
      setLoading(false);
    } catch (error) {
      console.error('Error refreshing categories:', error);
    }
    return [];
  };
  
  const handleSave = async () => {
    if (!content.trim()) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/fragments`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          id: fragment.id,
          content: content,
          categories: selectedCategories
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save fragment');
      }
      
      const updatedFragment = await response.json();
      
      const formattedCategories = selectedCategories.length > 0 
        ? selectedCategories.map(id => {
            const cat = categories.find(c => c.id === id);
            return cat ? { id: cat.id, name: cat.name } : { id, name: `Category ${id}` };
          })
        : [];
      
      const formattedFragment = {
        ...updatedFragment,
        categories: formattedCategories
      };
      
      onSuccess(formattedFragment);
    } catch (error: any) {
      console.error('Error saving fragment:', error);
      setError(error.message || 'Error saving fragment');
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      <TextField
        label="Contenu"
        multiline
        rows={6}
        fullWidth
        value={content}
        onChange={(e) => setContent(e.target.value)}
        variant="outlined"
        sx={{ mb: 3 }}
      />
      
      <CategorySelect
        selectedCategories={selectedCategories}
        availableCategories={categories}
        onChange={handleCategoryChange}
        refreshCategories={refreshCategories}
      />
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, gap: 2 }}>
        <Button 
          onClick={onCancel}
          variant="outlined"
          color='warning'
          disabled={isSaving}
        >
          Annuler
        </Button>
        <Button 
          onClick={handleSave}
          variant="contained" 
          color="primary"
          disabled={isSaving || !content.trim()}
          startIcon={isSaving ? <CircularProgress size={20} /> : null}
        >
          {isSaving ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </Box>
    </Box>
  );
};
