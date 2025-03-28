import React, { useState } from 'react';
import { 
  FormControl, InputLabel, Select, MenuItem, 
  Box, Chip, TextField, Dialog, DialogTitle, 
  DialogContent, DialogActions, Button, IconButton, 
  Typography, alpha, useTheme, CircularProgress,
  SelectChangeEvent, Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';

interface CategorySelectProps {
  selectedCategories: number[];
  availableCategories: Array<{id: number, name: string}>;
  onChange: (categories: number[]) => void;
  refreshCategories: () => Promise<void>;
}

const CategorySelect: React.FC<CategorySelectProps> = ({
  selectedCategories,
  availableCategories,
  onChange,
  refreshCategories
}) => {
  const theme = useTheme();
  const [showNewCategoryDialog, setShowNewCategoryDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<{id: number, name: string} | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  // Handle category selection change
  const handleCategoryChange = (event: SelectChangeEvent<typeof selectedCategories>) => {
    const newValue = event.target.value;
    const newCategories = typeof newValue === 'string' 
      ? newValue.split(',').map(Number) 
      : newValue as number[];
    
    onChange(newCategories);
  };

  // Handle new category creation
  const handleNewCategorySubmit = async () => {
    if (!newCategoryName.trim()) return;
    
    setIsAddingCategory(true);
    setCategoryError(null);
    
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
      
      // Add the new category to selected categories
      onChange([...selectedCategories, newCategory.id]);
      
      // Refresh categories list
      await refreshCategories();
      
      // Reset and close dialog
      setNewCategoryName('');
      setShowNewCategoryDialog(false);
    } catch (error: any) {
      console.error('Error creating category:', error);
      setCategoryError(error.message || 'Erreur lors de la création de la catégorie');
    } finally {
      setIsAddingCategory(false);
    }
  };

  // Handle category deletion
  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    
    setIsDeletingCategory(true);
    setCategoryError(null);
    setDeleteSuccess(false);
    
    try {
      const response = await fetch(`/api/categories/${categoryToDelete.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la suppression de la catégorie');
      }
      
      // Remove category from selected categories
      onChange(selectedCategories.filter(id => id !== categoryToDelete.id));
      
      // Refresh categories list
      await refreshCategories();
      
      // Marquer la suppression comme réussie au lieu de fermer le dialogue
      setDeleteSuccess(true);
      
      // Ne pas réinitialiser le categoryToDelete pour pouvoir l'afficher dans le message de succès
    } catch (error: any) {
      console.error('Error deleting category:', error);
      setCategoryError(error.message || 'Erreur lors de la suppression de la catégorie');
    } finally {
      setIsDeletingCategory(false);
    }
  };

  // Nouvelle fonction pour fermer le dialogue manuellement
  const handleCloseDeleteDialog = () => {
    setShowDeleteWarning(false);
    setCategoryToDelete(null);
    setDeleteSuccess(false);
    setCategoryError(null);
  };

  // Handle category delete button click
  const handleDeleteCategoryClick = (categoryId: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the MenuItem from being selected
    
    const category = availableCategories.find(c => c.id === categoryId);
    if (!category) return;
    
    setCategoryToDelete(category);
    setShowDeleteWarning(true);
  };

  return (
    <>
      <FormControl fullWidth size="small" sx={{ mt: 2 }}>
        <InputLabel id="category-select-label">Catégories</InputLabel>
        <Select
          labelId="category-select-label"
          multiple
          value={selectedCategories}
          onChange={handleCategoryChange}
          renderValue={(selected) => (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {selected.length === 0 ? (
                <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                  Aucune catégorie sélectionnée
                </Typography>
              ) : (
                selected.map((value) => {
                  const category = availableCategories.find(cat => cat.id === value);
                  return (
                    <Chip 
                      key={value} 
                      label={category ? category.name : `ID:${value}`} 
                      size="small" 
                    />
                  );
                })
              )}
            </Box>
          )}
          MenuProps={{
            PaperProps: {
              style: {
                maxHeight: 224,
                width: 'auto',
                minWidth: 250
              },
            },
          }}
        >
          <MenuItem disabled divider>
            <Typography variant="caption" color="text.secondary">
              Sélectionnez une ou plusieurs catégories
            </Typography>
          </MenuItem>
          
          {availableCategories.length === 0 ? (
            <MenuItem disabled>
              <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                Aucune catégorie disponible
              </Typography>
            </MenuItem>
          ) : (
            availableCategories.map((category) => (
              <MenuItem 
                key={category.id} 
                value={category.id}
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  pr: 1
                }}
              >
                <Typography>{category.name}</Typography>
                <IconButton
                  size="small"
                  onClick={(e) => handleDeleteCategoryClick(category.id, e)}
                  sx={{ 
                    ml: 1, 
                    opacity: 0.5,
                    color: theme.palette.error.main,
                    '&:hover': { 
                      opacity: 1,
                      bgcolor: alpha(theme.palette.error.main, 0.1) 
                    }
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </MenuItem>
            ))
          )}
          
          <MenuItem 
            onClick={() => setShowNewCategoryDialog(true)}
            divider
            sx={{ 
              color: theme.palette.primary.light,
              '&:hover': { bgcolor: alpha(theme.palette.primary.light, 0.1) }
            }}
          >
            <AddIcon fontSize="small" sx={{ mr: 1 }} />
            <Typography>Ajouter une catégorie</Typography>
          </MenuItem>
        </Select>
      </FormControl>

      {/* Dialog pour ajouter une nouvelle catégorie */}
      <Dialog 
        open={showNewCategoryDialog} 
        onClose={() => !isAddingCategory && setShowNewCategoryDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Ajouter une nouvelle catégorie</DialogTitle>
        <DialogContent>
          {categoryError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {categoryError}
            </Alert>
          )}
          
          <TextField
            autoFocus
            margin="dense"
            label="Nom de la catégorie"
            type="text"
            fullWidth
            variant="outlined"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            disabled={isAddingCategory}
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setShowNewCategoryDialog(false)} 
            color="inherit"
            disabled={isAddingCategory}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleNewCategorySubmit} 
            color="primary" 
            disabled={isAddingCategory || !newCategoryName.trim()}
            startIcon={isAddingCategory ? <CircularProgress size={16} /> : null}
          >
            {isAddingCategory ? 'Création...' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmation de suppression */}
      <Dialog
        open={showDeleteWarning}
        onClose={() => !isDeletingCategory && handleCloseDeleteDialog()}
        sx={{
            maxWidth: '600px', mx: 'auto',
        }}
        fullWidth
      >
        <DialogTitle sx={{ color: deleteSuccess ? 'success.main' : 'error.main' }}>
          {deleteSuccess ? '' : 'Supprimer la catégorie'}
        </DialogTitle>
        <DialogContent>
          {categoryError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {categoryError}
            </Alert>
          )}
          
          {deleteSuccess ? (
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
          {deleteSuccess ? (
            // Un seul bouton pour fermer après suppression réussie
            <Button 
              onClick={handleCloseDeleteDialog} 
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
                onClick={handleCloseDeleteDialog} 
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
    </>
  );
};

export default CategorySelect;
