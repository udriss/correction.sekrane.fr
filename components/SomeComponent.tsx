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
  Snackbar
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import CategoryIcon from '@mui/icons-material/CategoryOutlined';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import LoadingSpinner from '@/components/LoadingSpinner';
import useAuth from '@/hooks/useAuth';

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
}

export default function FragmentsLibraryPage() {
  // Use the enhanced useAuth hook with error handling
  const { user, status } = useAuth();
  
  const isAuthenticated = status === 'authenticated';
  
  const [fragments, setFragments] = useState<Fragment[]>([]);
  const [filteredFragments, setFilteredFragments] = useState<Fragment[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [userOnly, setUserOnly] = useState(false);
  
  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fragmentToDelete, setFragmentToDelete] = useState<Fragment | null>(null);
  const [deleteError, setDeleteError] = useState('');
  
  // Notification
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });
  
  // Pagination
  const [page, setPage] = useState(1);
  const [fragmentsPerPage] = useState(10);
  
  // Add state for category management
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [managedCategories, setManagedCategories] = useState<string[]>([]);
  
  // Fetch fragments and categories
  const fetchFragments = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (userOnly && isAuthenticated) {
        queryParams.append('userOnly', 'true');
      }
      if (categoryFilter !== 'all') {
        queryParams.append('category', categoryFilter);
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
      
      // Extract unique categories
      const uniqueCategories = Array.from(new Set(data.map((f: Fragment) => f.category)));
      setCategories(uniqueCategories as string[]);
    } catch (err) {
      console.error('Error fetching fragments:', err);
      setError('Impossible de charger les fragments. Veuillez réessayer plus tard.');
    } finally {
      setLoading(false);
    }
  }, [userOnly, categoryFilter, searchQuery, isAuthenticated]);
  
  useEffect(() => {
    fetchFragments();
  }, [fetchFragments]);
  
  // Load categories when the component mounts
  useEffect(() => {
    if (categories.length > 0) {
      setManagedCategories(categories);
    }
  }, [categories]);
  
  // Apply filters and sorting
  useEffect(() => {
    let result = [...fragments];
    
    // Apply sorting
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
    setPage(1); // Reset to first page when filters change
  }, [fragments, sortBy]);
  
  // Get current fragments for pagination
  const indexOfLastFragment = page * fragmentsPerPage;
  const indexOfFirstFragment = indexOfLastFragment - fragmentsPerPage;
  const currentFragments = filteredFragments.slice(indexOfFirstFragment, indexOfLastFragment);
  const totalPages = Math.ceil(filteredFragments.length / fragmentsPerPage);
  
  // Copy fragment to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setNotification({
      open: true,
      message: 'Fragment copié dans le presse-papiers',
      severity: 'success'
    });
  };
  
  // Handle fragment deletion
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
        // Enhanced error handling
        const errorMessage = data.sqlMessage 
          ? `Erreur SQL: ${data.sqlMessage}` 
          : (data.error || 'Erreur lors de la suppression du fragment');
        throw new Error(errorMessage);
      }
      
      // Close dialog and refresh fragments
      setDeleteDialogOpen(false);
      setFragmentToDelete(null);
      setDeleteError('');
      
      // Show notification
      setNotification({
        open: true,
        message: 'Fragment supprimé avec succès',
        severity: 'success'
      });
      
      // Refresh fragments
      fetchFragments();
    } catch (err) {
      console.error('Error deleting fragment:', err);
      setDeleteError((err as Error).message || 'Erreur lors de la suppression du fragment');
    }
  };
  
  // Handle adding a new category
  const handleAddCategory = () => {
    if (!newCategory.trim() || managedCategories.includes(newCategory.trim())) {
      return;
    }
    
    setManagedCategories([...managedCategories, newCategory.trim()]);
    setNewCategory('');
  };
  
  // Handle deleting a category
  const handleDeleteCategory = (categoryToDelete: string) => {
    setManagedCategories(managedCategories.filter(cat => cat !== categoryToDelete));
  };
  
  // Open delete dialog
  const openDeleteDialog = (fragment: Fragment) => {
    setFragmentToDelete(fragment);
    setDeleteDialogOpen(true);
    setDeleteError('');
  };
  
  // Handle notification close
  const handleCloseNotification = () => {
    setNotification({
      ...notification,
      open: false
    });
  };

  // Show authentication error if user is unauthenticated
  if (status === 'unauthenticated') {
    return (
      <Container maxWidth="lg" className="py-8">
        <Typography variant="h4" component="h1" gutterBottom>
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
      <Container maxWidth="lg" className="py-8">
        <Typography variant="h4" component="h1" gutterBottom>
          Bibliothèque de fragments
        </Typography>
        <div className="py-10 flex justify-center max-w-[400px] mx-auto">
        <LoadingSpinner text="Chargement des fragments" />
        </div>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" className="py-8">
      <Box className="mb-6">
        <Typography variant="h4" component="h1" gutterBottom>
          Bibliothèque de fragments
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Parcourez et utilisez des fragments de texte prédéfinis pour vos corrections
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" className="mb-4">
          {error}
        </Alert>
      )}

      {/* Filters and Search */}
      <Paper elevation={2} className="p-4 mb-6">
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <TextField
            label="Rechercher"
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') fetchFragments();
            }}
            InputProps={{
              startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
              endAdornment: (
                <IconButton 
                  size="small" 
                  onClick={() => fetchFragments()}
                  sx={{ ml: -1 }}
                >
                  <SearchIcon fontSize="small" />
                </IconButton>
              )
            }}
            sx={{ flexGrow: 1, minWidth: '200px' }}
          />
          
          <FormControl size="small" sx={{ minWidth: '150px' }}>
            <InputLabel id="category-filter-label">Catégorie</InputLabel>
            <Select
              labelId="category-filter-label"
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                // Trigger fetch when category changes
                setTimeout(fetchFragments, 0);
              }}
              label="Catégorie"
              startAdornment={<CategoryIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />}
            >
              <MenuItem value="all">Toutes</MenuItem>
              {categories.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
              
              {/* Add option to manage categories */}
              {isAuthenticated && (
                <MenuItem 
                  value="manage_categories" 
                  onClick={() => {
                    setCategoryDialogOpen(true);
                    setCategoryFilter('all'); // Reset to all categories
                  }}
                  sx={{ color: 'primary.main', fontWeight: 'medium' }}
                >
                  <SettingsIcon fontSize="small" sx={{ mr: 1 }} />
                  Gérer les catégories
                </MenuItem>
              )}
            </Select>
          </FormControl>
          
          {isAuthenticated && (
            <FormControl size="small">
              <Tooltip title={userOnly ? "Afficher tous les fragments" : "Afficher uniquement mes fragments"}>
                <Button
                  variant={userOnly ? "contained" : "outlined"}
                  color="primary"
                  startIcon={<PersonIcon />}
                  onClick={() => {
                    setUserOnly(prev => !prev);
                    // Trigger fetch when userOnly changes
                    setTimeout(fetchFragments, 0);
                  }}
                  size="medium"
                >
                  {userOnly ? "Mes fragments" : "Tous les fragments"}
                </Button>
              </Tooltip>
            </FormControl>
          )}
          
          {isAuthenticated && (
            <Button 
              variant="contained" 
              color="primary"
              startIcon={<AddIcon />}
              href="/fragments/new"
            >
              Nouveau
            </Button>
          )}
        </Box>
      </Paper>

      {/* Results summary */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary">
          {filteredFragments.length} fragments trouvés
        </Typography>
      </Box>

      {/* Fragments List */}
      {currentFragments.length === 0 ? (
        <Alert severity="info">
          Aucun fragment ne correspond à vos critères de recherche.
        </Alert>
      ) : (
        <Box>
          {currentFragments.map((fragment) => (
            <Card key={fragment.id} sx={{ mb: 2, '&:hover': { boxShadow: 3 } }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      {fragment.activity_name || 'Général'}
                    </Typography>
                    {fragment.isOwner && (
                      <Chip
                        label="Mon fragment"
                        size="small"
                        color="primary"
                        variant="outlined"
                        icon={<PersonIcon fontSize="small" />}
                      />
                    )}
                  </Box>
                  <Box>
                    <Tooltip title="Copier">
                      <IconButton 
                        size="small" 
                        onClick={() => copyToClipboard(fragment.content)}
                      >
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    
                    {fragment.isOwner && (
                      <>
                        <Tooltip title="Modifier">
                          <IconButton 
                            size="small" 
                            href={`/fragments/${fragment.id}/edit`}
                            color="primary"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Supprimer">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => openDeleteDialog(fragment)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </Box>
                </Box>
                
                <Typography variant="body1" gutterBottom>
                  {fragment.content}
                </Typography>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                  <Chip 
                    label={fragment.category} 
                    size="small" 
                    color="primary" 
                    variant="outlined" 
                  />
                  
                  {fragment.tags?.map(tag => (
                    <Chip 
                      key={tag} 
                      label={tag} 
                      size="small" 
                      variant="outlined"
                    />
                  ))}
                  
                  {fragment.usage_count !== undefined && fragment.usage_count > 0 && (
                    <Chip 
                      label={`Utilisé ${fragment.usage_count} fois`} 
                      size="small" 
                      variant="outlined"
                      color="secondary"
                    />
                  )}
                </Box>
              </CardContent>
            </Card>
          ))}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination 
                count={totalPages} 
                page={page} 
                onChange={(_, newPage) => setPage(newPage)}
                color="primary"
              />
            </Box>
          )}
        </Box>
      )}
      
      {/* Delete Fragment Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="delete-fragment-dialog-title"
      >
        <DialogTitle id="delete-fragment-dialog-title">
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
      
      {/* Category Management Dialog */}
      <Dialog
        open={categoryDialogOpen}
        onClose={() => setCategoryDialogOpen(false)}
        aria-labelledby="category-management-dialog-title"
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle id="category-management-dialog-title">
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CategoryIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">Gérer les catégories</Typography>
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
                onKeyPress={(e) => {
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
                disabled={!newCategory.trim() || managedCategories.includes(newCategory.trim())}
              >
                Ajouter
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
                onDelete={() => handleDeleteCategory(cat)}
                color="primary"
                variant="outlined"
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
      
      {/* Notifications */}
      <Snackbar
        open={notification.open}
        autoHideDuration={5000}
        onClose={handleCloseNotification}
        message={notification.message}
      />
    </Container>
  );
}