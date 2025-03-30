'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Chip,
  alpha,
  useTheme
} from '@mui/material';
import CategoryIcon from '@mui/icons-material/CategoryOutlined';
import AddIcon from '@mui/icons-material/Add';

interface Category {
  id: number;
  name: string;
}

interface DeleteCategoryDialogProps {
  open: boolean;
  categoryToDelete: Category | null;
  onClose: () => void;
  onDelete: (category: Category) => Promise<void>;
  isDeletingCategory: boolean;
  deleteError: string | null;
  deleteSuccess: boolean;
}

export function DeleteCategoryDialog({
  open,
  categoryToDelete,
  onClose,
  onDelete,
  isDeletingCategory,
  deleteError,
  deleteSuccess
}: DeleteCategoryDialogProps) {
  const theme = useTheme();
  
  return (
    <Dialog
      open={open}
      onClose={() => !isDeletingCategory && onClose()}
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
      <DialogTitle sx={{ color: deleteSuccess ? 'success.main' : 'error.main' }}>
        {deleteSuccess ? '' : 'Supprimer la catégorie'}
      </DialogTitle>
      <DialogContent>
        {deleteError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {deleteError}
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
            onClick={onClose} 
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
              onClick={onClose} 
              color="inherit"
              disabled={isDeletingCategory}
            >
              Annuler
            </Button>
            <Button 
              onClick={() => categoryToDelete && onDelete(categoryToDelete)} 
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
  );
}

interface CategoryManagementDialogProps {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  onAddCategory: (name: string) => Promise<void>;
  onDeleteCategory: (category: Category) => void;
  isAddingCategory: boolean;
}

export function CategoryManagementDialog({
  open,
  onClose,
  categories,
  onAddCategory,
  onDeleteCategory,
  isAddingCategory
}: CategoryManagementDialogProps) {
  const theme = useTheme();
  const [newCategory, setNewCategory] = useState('');
  
  const handleAddCategory = async () => {
    if (!newCategory.trim() || categories.some(cat => cat.name === newCategory.trim())) {
      return;
    }
    
    await onAddCategory(newCategory.trim());
    setNewCategory('');
  };
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
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
              disabled={!newCategory.trim() || 
                       categories.some(cat => cat.name === newCategory.trim()) || 
                       isAddingCategory}
            >
              {isAddingCategory ? 'Ajout...' : 'Ajouter'}
            </Button>
          </Box>
        </Box>
        
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Catégories existantes
        </Typography>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {categories.map((cat) => (
            <Chip
              key={cat.id}
              label={cat.name}
              onDelete={() => onDeleteCategory(cat)}
              color="primary"
              variant="filled"
            />
          ))}
          
          {categories.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              Aucune catégorie définie
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          Fermer
        </Button>
      </DialogActions>
    </Dialog>
  );
}
