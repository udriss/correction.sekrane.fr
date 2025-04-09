import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  CardActions,
  Tooltip,
  Divider,
  Chip,
  Alert
} from '@mui/material';
import Grid from '@mui/material/Grid';

import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

// Import the existing FragmentEditModal component and its Fragment type
import FragmentEditModal, { Fragment as EditModalFragment } from '@/components/FragmentEditModal';

// Use the imported Fragment type for consistency
type Fragment = EditModalFragment;

// Update the props interface to match the imported Fragment type
interface FragmentsListProps {
  fragments: Fragment[];
  activityId: number;
  // Props d'origine
  onAddFragment?: (fragmentData: Omit<EditModalFragment, 'id' | 'activity_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onUpdateFragment?: (id: number, fragmentData: Partial<EditModalFragment>) => Promise<void>;
  onDeleteFragment?: (id: number) => Promise<void>;
  // Nouvelles props
  onUpdate?: (activityId: string | number) => Promise<void>;
  error?: string;
  favoriteFragments?: Fragment[];
  isFavoriteLoading?: boolean;
  showTitle?: boolean;
  showIcon?: boolean;
  showEmpty?: boolean;
}

const FragmentsList: React.FC<FragmentsListProps> = ({ 
  fragments, 
  activityId,
  onAddFragment, 
  onUpdateFragment, 
  onDeleteFragment,
  onUpdate,
  error,
  favoriteFragments,
  isFavoriteLoading,
  showTitle = false,
  showIcon = false,
  showEmpty = false
}) => {
  // Modal and fragment state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingFragment, setEditingFragment] = useState<Fragment | null>(null);
  const [fragmentToDelete, setFragmentToDelete] = useState<number | null>(null);
  const [isProcessingDelete, setIsProcessingDelete] = useState(false);

  // Categories and activities
  const [categories, setCategories] = useState<string[]>(['Expérimental', 'Théorique', 'Général']);
  const [activities, setActivities] = useState<{id: number, name: string}[]>([]);
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [filteredFragments, setFilteredFragments] = useState<Fragment[]>(fragments);

  // Fetch activities for the dropdown
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await fetch('/api/activities');
        if (response.ok) {
          const activitiesData = await response.json();
          setActivities(activitiesData.map((activity: any) => ({
            id: activity.id,
            name: activity.name
          })));
        }
      } catch (error) {
        console.error('Failed to fetch activities:', error);
      }
    };
    
    fetchActivities();
  }, []);

  // Apply filters when fragments or filters change
  useEffect(() => {
    let result = [...fragments];
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(fragment => 
        fragment.content.toLowerCase().includes(query) ||
        (fragment.category && fragment.category.toLowerCase().includes(query))
      );
    }
    
    // Apply category filter
    if (categoryFilter !== 'all') {
      result = result.filter(fragment => 
        fragment.category && fragment.category.toLowerCase() === categoryFilter.toLowerCase()
      );
    }
    
    setFilteredFragments(result);
  }, [fragments, searchQuery, categoryFilter]);

  // Modal handlers
  const handleOpenAddModal = () => {
    setEditingFragment(null);
    setEditModalOpen(true);
  };

  const handleOpenEditModal = (fragment: Fragment) => {
    setEditingFragment(fragment);
    setEditModalOpen(true);
  };

  const handleSaveFragment = async (fragment: EditModalFragment): Promise<void> => {
    if (editingFragment) {
      const { content, category } = fragment;
      if (onUpdateFragment) {
        await onUpdateFragment(editingFragment.id, { content, category } as Partial<EditModalFragment>);
      }
    } else {
      const { content, category } = fragment;
      if (onAddFragment) {
        await onAddFragment({ content, category } as Omit<EditModalFragment, 'id' | 'activity_id' | 'created_at' | 'updated_at'>);
      }
    }
    setEditModalOpen(false);
    
    // Utiliser onUpdate si fourni pour actualiser la liste des fragments
    if (onUpdate) {
      await onUpdate(activityId);
    }
  };

  // Delete handlers
  const handleDeleteRequest = (fragmentId: number) => {
    setFragmentToDelete(fragmentId);
  };

  const handleCancelDelete = () => {
    setFragmentToDelete(null);
  };

  const handleConfirmDelete = async (fragmentId: number) => {
    try {
      setIsProcessingDelete(true);
      if (onDeleteFragment) {
        await onDeleteFragment(fragmentId);
      }
      
      // Utiliser onUpdate si fourni pour actualiser la liste des fragments
      if (onUpdate) {
        await onUpdate(activityId);
      }
    } finally {
      setIsProcessingDelete(false);
      setFragmentToDelete(null);
    }
  };

  // Get unique categories from fragments for the filter
  const getUniqueCategories = () => {
    const uniqueCategories = new Set<string>();
    fragments.forEach(f => {
      if (f.category) uniqueCategories.add(f.category);
    });
    return Array.from(uniqueCategories);
  };

  return (
    <Box>
      {/* Afficher l'erreur si elle existe */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Afficher le titre si showTitle est à true */}
      {showTitle && (
        <Typography variant="h5" gutterBottom>
          Fragments pour cette activité
        </Typography>
      )}
      
      {/* Search and filter bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <TextField
            placeholder="Rechercher un fragment..."
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
            }}
            sx={{ flexGrow: 1 }}
          />
          
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="category-filter-label">Catégorie</InputLabel>
            <Select
              labelId="category-filter-label"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              label="Catégorie"
              startAdornment={<FilterListIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />}
            >
              <MenuItem value="all">Toutes les catégories</MenuItem>
              {getUniqueCategories().map(category => (
                <MenuItem key={category} value={category}>{category}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            onClick={handleOpenAddModal}
          >
            Ajouter
          </Button>
        </Box>
      </Paper>

      {/* Fragments count summary */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1">
          {filteredFragments.length > 0 
            ? `${filteredFragments.length} fragment${filteredFragments.length > 1 ? 's' : ''} trouvé${filteredFragments.length > 1 ? 's' : ''}`
            : 'Aucun fragment disponible'
          }
        </Typography>
      </Box>

      {/* Display a message if no fragments are found and showEmpty is true */}
      {fragments.length === 0 && showEmpty && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Aucun fragment n'a encore été créé pour cette activité. Vous pouvez ajouter des fragments pour réutiliser rapidement du texte dans vos corrections.
        </Alert>
      )}

      {/* Fragments grid */}
      <Grid container spacing={2}>
        {filteredFragments.length === 0 ? (
          <Grid size={12}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Aucun fragment ne correspond à vos critères de recherche
              </Typography>
            </Paper>
          </Grid>
        ) : (
          filteredFragments.map(fragment => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={fragment.id}>
              <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* Category chip in top right */}
                <Box sx={{ position: 'relative', pt: 1, px: 2 }}>
                  <Chip 
                    label={fragment.category || 'Général'} 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                    sx={{ position: 'absolute', top: 8, right: 8 }}
                  />
                </Box>
                <CardContent sx={{ flexGrow: 1, pt: 3 }}>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {fragment.content}
                  </Typography>
                </CardContent>
                <Divider />
                <CardActions>
                  <Tooltip title="Modifier ce fragment">
                    <IconButton 
                      size="small" 
                      onClick={() => handleOpenEditModal(fragment)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  
                  {/* Inline delete confirmation */}
                  {fragmentToDelete === fragment.id ? (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', ml: 'auto' }}>
                      <Tooltip title="Annuler">
                        <IconButton 
                          size="small" 
                          onClick={handleCancelDelete}
                          disabled={isProcessingDelete}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Confirmer la suppression">
                        <IconButton 
                          size="small" 
                          color="error" 
                          onClick={() => handleConfirmDelete(fragment.id)}
                          disabled={isProcessingDelete}
                        >
                          <CheckIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  ) : (
                    <Tooltip title="Supprimer ce fragment">
                      <IconButton 
                        size="small" 
                        color="error" 
                        onClick={() => handleDeleteRequest(fragment.id)}
                        sx={{ ml: 'auto' }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      {/* Fragment Edit Modal */}
      <FragmentEditModal
        open={editModalOpen}
        fragment={editingFragment}
        activityId={activityId}
        onClose={() => setEditModalOpen(false)}
        onSave={handleSaveFragment}
        categories={categories}
        activities={activities}
      />
    </Box>
  );
};

export default FragmentsList;
