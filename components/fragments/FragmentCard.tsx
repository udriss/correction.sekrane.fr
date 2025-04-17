'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  IconButton,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Paper,
  Alert,
  Chip,
  Tooltip,
  alpha,
  Theme,
  CircularProgress
} from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import { Fragment } from '@/lib/types';
import { FragmentEditor } from '@/components/fragments';

interface FragmentCardProps {
  fragment: Fragment;
  isEditing?: boolean;
  categories: Array<{id: number, name: string}>;
  onEdit?: () => void;
  onCancelEdit?: () => void;
  onUpdate?: (fragment: Fragment) => void;
  onDelete?: () => void;
  onAddToCorrection?: () => void;
  refreshCategories: () => Promise<void>;
  renderPositionChip?: () => React.ReactNode;
}

export default function FragmentCard({ 
  fragment, 
  isEditing = false,
  categories = [],
  onEdit, 
  onCancelEdit,
  onUpdate, 
  onDelete,
  onAddToCorrection,
  refreshCategories,
  renderPositionChip
}: FragmentCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Normaliser les tags pour l'affichage
  const normalizedTags = React.useMemo(() => {
    if (!fragment.tags) return [];
    if (Array.isArray(fragment.tags)) return fragment.tags;
    if (typeof fragment.tags === 'string') {
      try {
        return JSON.parse(fragment.tags);
      } catch (e) {
        console.error('Error parsing tags string:', e);
        return [];
      }
    }
    return [];
  }, [fragment.tags, fragment._updateKey]);

  const handleEditClick = () => {
    if (onEdit) {
      onEdit();
    }
  };

  const handleCopyClick = () => {
    navigator.clipboard.writeText(fragment.content);
  };

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const response = await fetch(`/api/fragments/${fragment.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la suppression');
      }

      setIsDeleteDialogOpen(false);
      if (onDelete) {
        onDelete();
      }
    } catch (err: any) {
      setDeleteError(err.message || 'Une erreur est survenue');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddToCorrection = () => {
    if (onAddToCorrection) {
      onAddToCorrection();
    }
  };

  // Si en mode édition, afficher l'éditeur de fragment
  if (isEditing) {
    return (
      <FragmentEditor 
        fragment={fragment}
        categories={categories}
        onUpdate={onUpdate || (() => {})}
        onCancel={onCancelEdit || (() => {})}
        refreshCategories={refreshCategories}
      />
    );
  }

  return (
    <Card variant="outlined" sx={{
      position: 'relative',}}
      >
      <CardContent>
        {renderPositionChip && renderPositionChip()}
        
        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', my: 2.5 }}>
          {fragment.content}
        </Typography>
        
        {normalizedTags.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {normalizedTags.map((tag: string, idx: number) => (
              <Chip 
                key={`${tag}-${idx}`} 
                label={tag} 
                size="small" 
                variant="outlined"
                sx={{
                  bgcolor: (theme: Theme) => alpha(theme.palette.primary.light, 0.05),
                  color: (theme: Theme) => theme.palette.primary.dark,
                  '&.MuiChip-outlined': {
                    borderColor: (theme: Theme) => theme.palette.primary.main,
                  },
                }}
              />
            ))}
          </Box>
        )}
      </CardContent>

      <CardActions
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 1,
      }}  
      >
        <Box>
        <Tooltip title="Modifier">
          <IconButton 
            size="medium"
            onClick={handleEditClick}
          >
            <EditIcon fontSize="medium" />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Copier">
          <IconButton 
            size="medium"
            onClick={handleCopyClick}
          >
            <ContentCopyIcon fontSize="medium" />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Supprimer">
          <IconButton 
            size="medium"
            onClick={handleDeleteClick}
            color="error"
          >
            <DeleteIcon fontSize="medium" />
          </IconButton>
        </Tooltip>
        </Box>

        <Box>
        {onAddToCorrection && (
          <Tooltip title="Ajouter à la correction">
            <IconButton 
              size="large"
              color='success'
              onClick={handleAddToCorrection}
              sx={{ ml: 'auto' }}
            >
              <AddCircleIcon fontSize="large" />
            </IconButton>
          </Tooltip>
        )}
        </Box>
      </CardActions>

      <Dialog
        open={isDeleteDialogOpen}
        onClose={() => !isDeleting && setIsDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer ce fragment ? Cette action est irréversible.
          </Typography>
          
          <Paper variant="outlined" sx={{ p: 2, mt: 2, bgcolor: 'background.default' }}>
            <Typography variant="body2" gutterBottom fontStyle="italic">
              {fragment.content}
            </Typography>
          </Paper>
          
          {deleteError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {deleteError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setIsDeleteDialogOpen(false)} 
            disabled={isDeleting}
            variant='outlined'
            sx={{ color: (theme: Theme) => theme.palette.secondary.dark }}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            disabled={isDeleting}
            startIcon={isDeleting ? <CircularProgress size={16} /> : null}
          >
            {isDeleting ? 'Suppression...' : 'Supprimer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
