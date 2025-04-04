import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Chip,
  alpha,
  Theme
} from '@mui/material';
import CategoryIcon from '@mui/icons-material/CategoryOutlined';
import AddIcon from '@mui/icons-material/Add';

interface CategoryManagementDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  newCategory: string;
  setNewCategory: (category: string) => void;
  managedCategories: string[];
  handleAddCategory: () => void;
  openDeleteCategoryDialog: (categoryName: string) => void;
  isAddingCategory: boolean;
  theme: Theme;
}

export const CategoryManagementDialog: React.FC<CategoryManagementDialogProps> = ({
  open,
  setOpen,
  newCategory,
  setNewCategory,
  managedCategories,
  handleAddCategory,
  openDeleteCategoryDialog,
  isAddingCategory,
  theme
}) => {
  return (
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
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
      <DialogTitle id="category-management-dialog-title">
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
              onDelete={() => openDeleteCategoryDialog(cat)}
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
        <Button onClick={() => setOpen(false)}>
          Fermer
        </Button>
      </DialogActions>
    </Dialog>
  );
};
