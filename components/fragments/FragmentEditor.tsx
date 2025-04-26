'use client';

import React, { useState, useRef } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Paper, 
  Typography, 
  Chip,
  CircularProgress,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  SelectChangeEvent,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import { Fragment } from '@/lib/types';

interface FragmentEditorProps {
  fragment: Fragment;
  categories?: Array<{id: number, name: string}>;
  onUpdate: (updatedFragment: Fragment) => void;
  onCancel: () => void;
  refreshCategories?: () => Promise<void>;
}

export default function FragmentEditor({ 
  fragment, 
  categories = [],
  onUpdate, 
  onCancel,
  refreshCategories
}: FragmentEditorProps) {
  // Utiliser une méthode qui se basera sur la structure des tags plutôt que la référence
  const [content, setContent] = useState(fragment.content);
  const [tags, setTags] = useState<string[]>(() => Array.isArray(fragment.tags) ? [...fragment.tags] : []);
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // États pour le dialogue d'ajout de catégorie
  const [showNewCategoryDialog, setShowNewCategoryDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [categoryAddError, setCategoryAddError] = useState<string | null>(null);
  const [categoryAddSuccess, setCategoryAddSuccess] = useState(false);
  
  // États pour la suppression de catégorie
  const [showDeleteCategoryDialog, setShowDeleteCategoryDialog] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<{id: number, name: string} | null>(null);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);
  const [categoryDeleteError, setCategoryDeleteError] = useState<string | null>(null);
  const [categoryDeleteSuccess, setCategoryDeleteSuccess] = useState(false);
  
  // État pour gérer les catégories sélectionnées
  const [selectedCategories, setSelectedCategories] = useState<number[]>(() => {
    if (fragment.categories) {
      if (Array.isArray(fragment.categories)) {
        return fragment.categories.map(cat => 
          typeof cat === 'object' && cat !== null && 'id' in cat ? cat.id : 
          typeof cat === 'number' ? cat : 
          null
        ).filter((id): id is number => id !== null);
      }
    }
    return [];
  });

  // Générer des clés uniques pour forcer le rendu et éviter les problèmes de mise à jour
  const tagsKey = useRef(`tags-${Date.now()}-${JSON.stringify(tags)}`).current;
  const fragmentKey = useRef(`fragment-${fragment.id}-${Date.now()}`).current;

  // Ajouter une méthode directe d'enregistrement qui retourne à l'interface principale
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Convertir les IDs de catégories en objets complets
      const categoriesObjects = selectedCategories.map(categoryId => {
        const category = categories.find(c => c.id === categoryId);
        return category || { id: categoryId, name: `Category ${categoryId}` };
      });

      // Créer un fragment mis à jour avec toutes les modifications locales
      const updatedFragment = {
        ...fragment,
        content,
        // Utiliser TOUJOURS l'état actuel des tags, même s'il est vide,
        // pour respecter l'intention de l'utilisateur
        tags: tags,
        categories: categoriesObjects
      };


      // Maintenant effectuer l'appel au composant parent qui fera l'appel API
      await onUpdate(updatedFragment);
      setSuccess(true);
      
      // Fermer le modal après l'enregistrement réussi
      onCancel();
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      // Créer un nouveau tableau pour forcer une mise à jour d'état complète
      const newTags = [...tags, tagInput.trim()];
      setTags(newTags);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    // Créer un nouveau tableau pour forcer une mise à jour d'état complète
    const newTags = tags.filter(tag => tag !== tagToRemove);
    setTags(newTags);
  };

  const handleCategoryChange = (event: SelectChangeEvent<number[]>) => {
    const value = event.target.value;
    const newSelectedCategories = typeof value === 'string' ? 
      value.split(',').map(Number) : 
      value;
    setSelectedCategories(newSelectedCategories);
    
    // Les modifications de catégories sont stockées localement mais ne sont pas
    // envoyées au parent immédiatement - elles seront envoyées lors de la validation finale
  };

  // Gérer l'ajout d'une nouvelle catégorie
  const handleAddNewCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    setIsAddingCategory(true);
    setCategoryAddError(null);
    setCategoryAddSuccess(false);
    
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la création de la catégorie');
      }
      
      const newCategory = await response.json();
      
      // Ajouter automatiquement la nouvelle catégorie à la sélection
      const updatedSelectedCategories = [...selectedCategories, newCategory.id];
      setSelectedCategories(updatedSelectedCategories);
      
      // Rafraîchir la liste des catégories
      if (refreshCategories) {
        await refreshCategories();
      }
      
      // Afficher un message de succès
      setCategoryAddSuccess(true);
      
      // Réinitialiser après un court délai mais garder le dialogue ouvert
      setTimeout(() => {
        setNewCategoryName('');
        setCategoryAddSuccess(false);
        // Ne pas fermer automatiquement le dialogue, permettre à l'utilisateur de faire plus d'ajouts
      }, 1500);
    } catch (error: any) {
      setCategoryAddError(error.message || 'Erreur lors de la création de la catégorie');
    } finally {
      setIsAddingCategory(false);
    }
  };

  // Gérer la suppression d'une catégorie
  const handleOpenDeleteCategoryDialog = (category: {id: number, name: string}) => {
    setCategoryToDelete(category);
    setShowDeleteCategoryDialog(true);
    setCategoryDeleteSuccess(false);
    setCategoryDeleteError(null);
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    
    setIsDeletingCategory(true);
    setCategoryDeleteError(null);
    
    try {
      const response = await fetch(`/api/categories/${categoryToDelete.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la suppression de la catégorie');
      }
      
      // Supprimer la catégorie de la sélection
      const updatedSelectedCategories = selectedCategories.filter(id => id !== categoryToDelete.id);
      setSelectedCategories(updatedSelectedCategories);
      
      // Rafraîchir la liste des catégories
      if (refreshCategories) {
        await refreshCategories();
      }
      
      // Afficher un message de succès
      setCategoryDeleteSuccess(true);
      
      // Ne pas fermer le dialogue tout de suite pour montrer le message de succès
      setTimeout(() => {
        setShowDeleteCategoryDialog(false);
        setCategoryToDelete(null);
        setCategoryDeleteSuccess(false);
      }, 1500);
    } catch (error: any) {
      setCategoryDeleteError(error.message || 'Erreur lors de la suppression de la catégorie');
    } finally {
      setIsDeletingCategory(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>      
      <form onSubmit={handleSubmit}>
        <TextField
          label="Contenu"
          multiline
          rows={4}
          value={content}
          onChange={e => setContent(e.target.value)}
          fullWidth
          margin="normal"
          variant="outlined"
          required
        />
        
        {/* Sélection de catégories */}
        <FormControl fullWidth margin="normal">
          <InputLabel id="categories-select-label">Catégories</InputLabel>
          <Select
            labelId="categories-select-label"
            multiple
            value={selectedCategories.filter(id => id !== undefined && id !== null)}
            onChange={handleCategoryChange}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => {
                  const category = categories.find(cat => cat.id === value);
                  return category ? (
                    <Chip 
                      key={`selected-cat-${value}`} 
                      label={category.name} 
                      size="small" 
                    />
                  ) : null;
                }).filter(Boolean)}
              </Box>
            )}
          >
            {categories.map((category) => (
              <MenuItem 
                key={`cat-${category.id}`} 
                value={category.id}
                sx={{ display: 'flex', justifyContent: 'space-between', pr: 1 }}
              >
                <span>{category.name}</span>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation(); // Empêche la sélection de l'élément
                    handleOpenDeleteCategoryDialog(category);
                  }}
                  sx={{ 
                    ml: 1, 
                    color: theme => theme.palette.error.main,
                    '&:hover': { 
                      bgcolor: theme => alpha(theme.palette.error.main, 0.1) 
                    },
                    height: 24,
                    width: 24
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </MenuItem>
            ))}
            
            {/* Remplacer le prompt par un dialogue MaterialUI */}
            <MenuItem 
              key="add-new-category"
              onClick={() => {
                // Afficher un modal pour l'ajout plutôt qu'un prompt
                setShowNewCategoryDialog(true);
              }}
              divider
              sx={{ 
                color: 'primary.main',
                fontWeight: 'bold',
                '&:hover': { bgcolor: 'action.hover' }
              }}
            >
              <AddIcon sx={{ mr: 1 }} /> Ajouter une nouvelle catégorie
            </MenuItem>
          </Select>
        </FormControl>
        
        <Box sx={{ mt: 2, mb: 1 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Tags (optionnels)
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
            <TextField
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              size="small"
              placeholder="Ajouter un tag"
              sx={{ flexGrow: 1 }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
            />
            <Button 
              onClick={handleAddTag} 
              variant="outlined" 
              size="small"
            >
              Ajouter
            </Button>
          </Box>
          
          <Box key={tagsKey} sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {tags.map((tag, index) => (
              <Chip
                key={`${tagsKey}-tag-${index}-${tag}`}
                label={tag}
                onDelete={() => handleRemoveTag(tag)}
                size="small"
                color="info"
                sx={{
                  borderRadius: 1.5,
                  bgcolor: theme => alpha(theme.palette.info.main, 0.05),
                  color: theme => theme.palette.info.dark,
                  fontWeight: 500,
                  '& .MuiChip-deleteIcon': {
                    color: theme => theme.palette.info.dark,
                    '&:hover': {
                      color: theme => theme.palette.error.main,
                    },
                  },
                }}
              />
            ))}
          </Box>
        </Box>
        
        <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            sx={{ color: theme => theme.palette.secondary.dark }}
            onClick={onCancel}
            startIcon={<CancelIcon />}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            startIcon={loading ? <CircularProgress size={24} /> : <SaveIcon />}
            disabled={loading}
          >
            Enregistrer
          </Button>
        </Box>
      </form>
      
      <Snackbar 
        open={error !== null} 
        autoHideDuration={6000} 
        onClose={() => setError(null)}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
      
      <Snackbar 
        open={success} 
        autoHideDuration={3000} 
        onClose={() => setSuccess(false)}
      >
        <Alert severity="success" onClose={() => setSuccess(false)}>
          Fragment mis à jour avec succès
        </Alert>
      </Snackbar>
      
      {/* Dialogue pour ajouter une nouvelle catégorie */}
      <Dialog 
        open={showNewCategoryDialog} 
        onClose={() => !isAddingCategory && setShowNewCategoryDialog(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">Ajouter une nouvelle catégorie</Typography>
            <IconButton 
              onClick={() => setShowNewCategoryDialog(false)}
              disabled={isAddingCategory}
              size="small"
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {categoryAddError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {categoryAddError}
            </Alert>
          )}
          
          {categoryAddSuccess ? (
            <Alert severity="success" sx={{ mb: 2 }}>
              Catégorie ajoutée avec succès!
            </Alert>
          ) : (
            <>
              <TextField
                autoFocus
                label="Nom de la catégorie"
                fullWidth
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                margin="dense"
                variant="outlined"
                disabled={isAddingCategory}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isAddingCategory && newCategoryName.trim()) {
                    e.preventDefault();
                    handleAddNewCategory();
                  }
                }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Les catégories vous aident à organiser et filtrer vos fragments.
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          {!categoryAddSuccess && (
            <>
              <Button 
                onClick={() => setShowNewCategoryDialog(false)} 
                color="inherit"
                disabled={isAddingCategory}
              >
                Annuler
              </Button>
              <Button 
                onClick={handleAddNewCategory} 
                color="primary" 
                variant="contained"
                disabled={isAddingCategory || !newCategoryName.trim()}
                startIcon={isAddingCategory ? <CircularProgress size={16} /> : null}
              >
                {isAddingCategory ? 'Création...' : 'Créer'}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
      
      {/* Dialogue pour supprimer une catégorie */}
      <Dialog
        open={showDeleteCategoryDialog}
        onClose={() => !isDeletingCategory && setShowDeleteCategoryDialog(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>
          {categoryDeleteSuccess ? 'Catégorie supprimée' : 'Supprimer la catégorie'}
        </DialogTitle>
        <DialogContent>
          {categoryDeleteError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {categoryDeleteError}
            </Alert>
          )}
          
          {categoryDeleteSuccess ? (
            <Alert severity="success" sx={{ mb: 2 }}>
              La catégorie a été supprimée avec succès.
            </Alert>
          ) : (
            <>
              <Typography variant="body1" gutterBottom>
                Êtes-vous sûr de vouloir supprimer cette catégorie :
              </Typography>
              <Typography variant="h6" color="error" sx={{ my: 1 }}>
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
            <Button 
              onClick={() => setShowDeleteCategoryDialog(false)} 
              color="primary"
              variant="contained"
              autoFocus
            >
              Fermer
            </Button>
          ) : (
            <>
              <Button 
                onClick={() => setShowDeleteCategoryDialog(false)} 
                color="inherit"
                disabled={isDeletingCategory}
              >
                Annuler
              </Button>
              <Button 
                onClick={handleDeleteCategory} 
                color="error" 
                variant="contained"
                disabled={isDeletingCategory}
                startIcon={isDeletingCategory ? <CircularProgress size={16} /> : null}
              >
                {isDeletingCategory ? 'Suppression...' : 'Supprimer'}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
