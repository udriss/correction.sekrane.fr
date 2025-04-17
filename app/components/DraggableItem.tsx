import React, { useState, useEffect, useRef } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { ContentItem } from '@/types/correction';
// Import Material UI components
import { IconButton, TextField, Paper, Typography, Box, Stack } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ArticleIcon from '@mui/icons-material/Article';

interface DraggableItemProps {
  item: ContentItem;
  index: number;
  moveItem: (dragIndex: number, hoverIndex: number) => void;
  removeItem: (index: number) => void;
  updateItem: (index: number, content: string) => void;
}

const DraggableItem: React.FC<DraggableItemProps> = ({ 
  item, 
  index, 
  moveItem, 
  removeItem,
  updateItem 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(item.content || '');
  
  // Synchroniser l'état local lorsque l'item change
  useEffect(() => {
    setEditedContent(item.content || '');
  }, [item.content]);
  
  // Handle content save
  const handleSave = () => {
    if (editedContent !== item.content) {
      // Appliquer la mise à jour d'état avant l'aperçu pour éviter les désynchronisations
      const updatedContent = editedContent || '';
      
      // Immédiatement mettre à jour l'état parent pour garantir la cohérence
      updateItem(index, updatedContent);
      
      // Puis forcer la mise à jour de l'aperçu
      setTimeout(() => {
        updatePreviewForItem(index, updatedContent);
      }, 10); // Petit délai pour s'assurer que le DOM est mis à jour
    }
    setIsEditing(false);
  };
  
  // Handle cancellation
  const handleCancel = () => {
    // Si c'est un fragment et qu'on annule, revenir au contenu original si disponible
    if (item.isFromFragment && item.originalContent) {
      setEditedContent(item.originalContent);
    } else {
      setEditedContent(item.content || '');
    }
    setIsEditing(false);
  };

  // Handle content change with live update
  const handleContentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newContent = e.target.value;
    setEditedContent(newContent);
    
    // Mise à jour en temps réel pour refléter les changements dans l'aperçu
    if (isEditing) {
      updatePreviewForItem(index, newContent);
    }
  };
  
  // Fonction améliorée pour mettre à jour l'aperçu spécifiquement pour cet élément
  const updatePreviewForItem = (itemIndex: number, newContent: string) => {
    const previewContainer = document.querySelector('.preview-content');
    if (!previewContainer) return;
    
    // Recherche directe par data-item-id
    const previewItem = previewContainer.querySelector(`[data-item-id="${item.id}"]`);
    
    if (previewItem) {
      // Mise à jour forcée du contenu en fonction du type
      if (item.type === 'text') {
        previewItem.innerHTML = newContent; // Utiliser innerHTML au lieu de textContent
      } else if (item.type === 'list') {
        const titleElement = previewItem.querySelector('strong') || previewItem.firstChild;
        if (titleElement) {
          titleElement.textContent = newContent;
        }
      } else if (item.type === 'image') {
        const imgElement = previewItem.querySelector('img');
        if (imgElement) {
          imgElement.setAttribute('alt', newContent);
        }
      }
      
      // Ajouter un attribut pour signaler que l'élément a été mis à jour
      previewItem.setAttribute('data-updated', Date.now().toString());
    } 
    // Pour les éléments de liste (items enfants)
    else if (item.parentId) {
      const parentElement = previewContainer.querySelector(`[data-item-id="${item.parentId}"]`);
      if (parentElement) {
        const listItem = parentElement.querySelector(`[data-item-id="${item.id}"]`);
        if (listItem) {
          listItem.textContent = newContent;
        }
      }
    }
  };

  // Handle key press (Enter to save, Escape to cancel)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <Draggable draggableId={item.id} index={index}>
      {(provided, snapshot) => (
        <Box 
          ref={provided.innerRef}
          {...provided.draggableProps}
          sx={{ mb: 2 }}
          id={item.id} 
          data-item-id={item.id}
          data-parent-id={item.parentId}
          data-from-fragment={item.isFromFragment ? 'true' : 'false'}
        >
          <Paper 
            elevation={snapshot.isDragging ? 3 : 1} 
            sx={{
              borderLeft: item.isFromFragment ? '4px solid' : 'none',
              borderColor: item.isFromFragment ? 'primary.main' : 'transparent',
              transition: 'all 0.2s ease',
              opacity: snapshot.isDragging ? 0.6 : 1,
              display: 'flex',
              flexDirection: 'row',
            }}
            variant="outlined"
          >
            {/* Barre de drag verticale */}
            <Box 
              {...provided.dragHandleProps}
              sx={{ 
                height: 'auto',
                cursor: 'move',
                display: 'flex',
                alignItems: 'stretch',
                justifyContent: 'center',
                borderRight: '1px solid',
                borderColor: 'divider',
                bgcolor: theme => theme.palette.action.hover,
                px: 0.5,
                width: '28px',
              }}
            >
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'center ',
                alignItems: 'center',
                py: 1,
                height: 'auto'
              }}>
                <DragIndicatorIcon fontSize="small" />
              </Box>
            </Box>
            
            <Box sx={{ flexGrow: 1 }}>
              {isEditing ? (
                /* Mode édition - design plus compact */
                <Box sx={{ p: 1.5 }}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                    {item.isFromFragment && (
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: 'primary.main', 
                          display: 'flex', 
                          alignItems: 'center',
                          fontSize: '0.75rem',
                          mr: 'auto'
                        }}
                      >
                        <ArticleIcon fontSize="small" sx={{ mr: 0.5 }} />
                        Fragment importé
                      </Typography>
                    )}
                    
                    <Stack direction="row" spacing={1} sx={{ ml: 'auto' }}>
                      <IconButton 
                        onClick={handleSave}
                        color="success"
                        title="Sauvegarder"
                        size="small"
                      >
                        <SaveIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        onClick={handleCancel}
                        color="default"
                        title="Annuler"
                        size="small"
                      >
                        <CancelIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Stack>
                  
                  <TextField
                    value={editedContent}
                    onChange={handleContentChange}
                    onKeyDown={handleKeyDown}
                    sx={{ width: '100%', mt: 1, }}
                    multiline
                    rows={item.type === 'image' ? 1 : 3}
                    autoFocus
                    variant="outlined"
                    size="small"
                    onBlur={() => {
                      if (editedContent !== item.content) {
                        handleSave();
                      }
                    }}
                  />
                </Box>
              ) : (
                /* Mode affichage normal */
                <Box sx={{ p: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                    <Box sx={{ flexGrow: 1 }}>
                      {/* Indicateur de fragment */}
                      {item.isFromFragment && (
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: 'primary.main', 
                            display: 'flex', 
                            alignItems: 'center',
                            mb: 1
                          }}
                        >
                          <ArticleIcon fontSize="small" sx={{ mr: 0.5 }} />
                          Fragment importé
                        </Typography>
                      )}
                      
                      <Box 
                        onClick={() => setIsEditing(true)} 
                        sx={{ cursor: 'text' }}
                      >
                        {item.type === 'image' && item.src ? (
                          <Box sx={{ position: 'relative' }}>
                            <img 
                              src={item.src}
                              alt={item.alt || 'Image uploadée'}
                              style={{ 
                                maxWidth: '100%', 
                                height: 'auto', 
                                borderRadius: '4px',
                                maxHeight: '200px'
                              }}
                            />
                          </Box>
                        ) : item.type === 'list' ? (
                          <Typography sx={{ fontWeight: 'bold' }}>
                            {item.content}
                          </Typography>
                        ) : item.type === 'listItem' ? (
                          <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                            <Typography sx={{ mr: 1, fontSize: '1.25rem' }}>•</Typography>
                            <Typography>{item.content}</Typography>
                          </Box>
                        ) : (
                          <Box dangerouslySetInnerHTML={{ __html: item.content || '' }} />
                        )}
                      </Box>
                    </Box>
                    
                    <Stack direction="column" spacing={1} sx={{ ml: 2 }}>
                      <IconButton 
                        onClick={() => setIsEditing(true)}
                        color="primary"
                        title="Modifier"
                        size="small"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        onClick={() => removeItem(index)}
                        color="error"
                        title="Supprimer"
                        size="small"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Box>
                </Box>
              )}
            </Box>
          </Paper>
        </Box>
      )}
    </Draggable>
  );
};

export default DraggableItem;
