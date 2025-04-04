import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  alpha,
  Theme
} from '@mui/material';

interface Category {
  id: number;
  name: string;
}

interface DeleteCategoryDialogProps {
  open: boolean;
  onClose: () => void;
  categoryToDelete: Category | null;
  isDeletingCategory: boolean;
  categoryDeleteError: string | null;
  categoryDeleteSuccess: boolean;
  handleDeleteCategory: () => void;
  theme: Theme;
}

export const DeleteCategoryDialog: React.FC<DeleteCategoryDialogProps> = ({
  open,
  onClose,
  categoryToDelete,
  isDeletingCategory,
  categoryDeleteError,
  categoryDeleteSuccess,
  handleDeleteCategory,
  theme
}) => {
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
          <Button 
            onClick={onClose} 
            color="primary"
            variant="contained"
            autoFocus
          >
            Fermer
          </Button>
        ) : (
          <>
            <Button 
              onClick={onClose} 
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
  );
};
