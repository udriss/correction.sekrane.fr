'use client';

import React, { useState, useRef } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Chip, 
  IconButton, 
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  alpha,
  useTheme,
  Paper
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AddIcon from '@mui/icons-material/Add';
import { useDrag, useDrop } from 'react-dnd';
import { Fragment } from '@/lib/types';
import FragmentEditor from './FragmentEditor';

// Interface pour les props de la carte de fragment
interface FragmentCardProps {
  fragment: Fragment;
  index?: number;
  isEditing?: boolean;
  categories?: Array<{id: number, name: string}>;
  onEdit?: () => void;
  onCancelEdit?: () => void;
  onUpdate?: (fragment: Fragment) => void;
  onDelete?: () => void;
  onAddToCorrection?: () => void;
  moveFragment?: (dragIndex: number, hoverIndex: number) => void;
  refreshCategories?: () => Promise<void>;
}

// Type d'item pour le drag and drop
interface DragItem {
  index: number;
  id: string;
  type: string;
}

export default function FragmentCard({ 
  fragment, 
  index = 0, 
  isEditing = false,
  categories = [],
  onEdit, 
  onCancelEdit,
  onUpdate, 
  onDelete,
  onAddToCorrection,
  moveFragment,
  refreshCategories
}: FragmentCardProps) {
  // Remove menuAnchor state since we're no longer using it
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const theme = useTheme();

  // Référence pour le drag and drop
  const ref = useRef<HTMLDivElement>(null);

  // Configuration du drag and drop si moveFragment est fourni
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'fragment',
    item: { id: fragment.id, index },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
    canDrag: !!moveFragment,
  }));

  const [, drop] = useDrop<DragItem>({
    accept: 'fragment',
    hover(item, monitor) {
      if (!ref.current || !moveFragment) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      // Ne pas remplacer les éléments avec eux-mêmes
      if (dragIndex === hoverIndex) {
        return;
      }

      moveFragment(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  // Configurer le drag and drop si disponible
  if (moveFragment) {
    drag(drop(ref));
  }

  // Normaliser les tags pour s'assurer qu'ils sont toujours un tableau
  // This logic can be simpler now since we ensure proper formatting at the API level
  const normalizedTags = fragment.tags || [];

  console
  // Remove handleMenuOpen and handleMenuClose functions
  
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

  // Styles pour l'état de glisser-déposer
  const cardStyle = {
    opacity: isDragging ? 0.4 : 1,
    cursor: moveFragment ? 'move' : 'default',
  };

  return (
    <div ref={ref} style={cardStyle}>
      <Card elevation={2} sx={{ mb: 1, borderRadius: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Box>
              {fragment.activity_name && (
                <Chip 
                  size="small" 
                  color="primary" 
                  label={fragment.activity_name} 
                  sx={{ mb: 1, mr: 1 }}
                />
              )}
              {fragment.isModified && (
                <Chip 
                  size="small" 
                  label="Modifié" 
                  color="secondary"
                  sx={{ mb: 1, mr: 1 }}
                />
              )}
              {fragment.usage_count && fragment.usage_count > 0 && (
                <Tooltip title="Nombre d'utilisations">
                  <Chip 
                    size="small" 
                    label={`Utilisé ${fragment.usage_count} fois`}
                    sx={{ mb: 1 }}
                  />
                </Tooltip>
              )}
            </Box>
            
            <Box sx={{ display: 'flex' }}>
              {onAddToCorrection && (
                <Tooltip title="Ajouter à la correction">
                  <IconButton 
                    size="small"
                    color="primary"
                    onClick={handleAddToCorrection}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              
              {fragment.isOwner && (
                <>
                  <Tooltip title="Modifier">
                    <IconButton 
                      size="small"
                      onClick={handleEditClick}
                      aria-label="edit"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Copier">
                    <IconButton 
                      size="small"
                      onClick={handleCopyClick}
                      aria-label="copy"
                    >
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Supprimer">
                    <IconButton 
                      size="small"
                      onClick={handleDeleteClick}
                      aria-label="delete"
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </>
              )}
            </Box>
          </Box>
          
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>
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
                />
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
      


      <Dialog
        open={isDeleteDialogOpen}
        onClose={() => !isDeleting && setIsDeleteDialogOpen(false)}
        aria-labelledby="delete-fragment-dialog-title"
        sx = {
          {
            borderRadius: 3,
          boxShadow: `0 8px 32px ${alpha(theme.palette.error.main, 0.2)}`}
        }
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
            <Typography color="error" sx={{ mt: 2 }}>
              {deleteError}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setIsDeleteDialogOpen(false)} 
            disabled={isDeleting}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            disabled={isDeleting}
          >
            {isDeleting ? 'Suppression...' : 'Supprimer'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
