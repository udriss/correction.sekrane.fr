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
  Theme,
  Switch,
  FormControlLabel,
  IconButton,
  Tooltip
} from '@mui/material';
import CategoryIcon from '@mui/icons-material/CategoryOutlined';
import AddIcon from '@mui/icons-material/Add';
import HighlightIcon from '@mui/icons-material/Highlight';

interface Category {
  id: number;
  name: string;
  highlighted: boolean;
}

interface CategoryManagementDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  newCategory: string;
  setNewCategory: (category: string) => void;
  managedCategories: Category[];
  handleAddCategory: () => void;
  openDeleteCategoryDialog: (categoryId: number, categoryName: string) => void;
  toggleCategoryHighlight: (categoryId: number, currentHighlighted: boolean) => void;
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
  toggleCategoryHighlight,
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
            Utilisez l'option de mise en évidence pour les catégories qui doivent être distinctes dans les corrections.
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
              disabled={!newCategory.trim() || managedCategories.some(cat => cat.name === newCategory.trim()) || isAddingCategory}
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
              key={cat.id}
              label={cat.name}
              onDelete={() => openDeleteCategoryDialog(cat.id, cat.name)}
              color={cat.highlighted ? "secondary" : "primary"}
              variant="filled"
              icon={cat.highlighted ? <HighlightIcon /> : undefined}
              sx={{
                position: 'relative',
                '&:hover .highlight-toggle': {
                  opacity: 1,
                }
              }}
              onClick={() => toggleCategoryHighlight(cat.id, cat.highlighted)}
            />
          ))}
          
          {managedCategories.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              Aucune catégorie définie
            </Typography>
          )}
        </Box>
        
        <Box sx={{ mt: 3 }}>
          <Typography variant="body2" color="text.secondary">
            <HighlightIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
            Les catégories mises en évidence apparaîtront avec un style spécial dans les corrections partagées.
          </Typography>
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
