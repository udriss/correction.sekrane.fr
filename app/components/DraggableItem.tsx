import React, { useState, useEffect, useRef } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { ContentItem } from '@/types/correction';
import { useMediaUrl } from '@/hooks/useMediaUrl';
// Import Material UI components
import { IconButton, TextField, Paper, Typography, Box, Stack, Slider, Card, CardContent, CardMedia } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ArticleIcon from '@mui/icons-material/Article';
import AudioFileIcon from '@mui/icons-material/AudioFile';

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
  
  // Utiliser le hook pour gérer l'URL de l'image selon l'environnement
  const imageUrl = useMediaUrl(item.src);
  const audioUrl = useMediaUrl(item.src);
  
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
      } else if (item.type === 'audio') {
        // Pour les éléments audio, on met à jour la description
        const descriptionElement = previewItem.querySelector('.audio-description');
        if (descriptionElement) {
          descriptionElement.textContent = newContent;
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
                    rows={item.type === 'image' || item.type === 'audio' ? 1 : 3}
                    autoFocus
                    variant="outlined"
                    size="small"
                    placeholder={item.type === 'audio' ? 'Description de l\'audio (optionnel)' : ''}
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
                      
                      <Box>
                        {item.type === 'image' && imageUrl ? (
                          <Box 
                            onClick={() => setIsEditing(true)} 
                            sx={{ cursor: 'text', position: 'relative' }}
                          >
                            <img 
                              src={imageUrl}
                              alt={item.alt || 'Image uploadée'}
                              style={{ 
                                maxWidth: '100%', 
                                height: 'auto', 
                                borderRadius: '4px',
                                maxHeight: '200px'
                              }}
                              onLoad={(e) => {
                                // Log successful load for debugging
                                console.log('Image loaded successfully:', imageUrl);
                              }}
                              onError={(e) => {
                                console.error('Erreur de chargement de l\'image:', imageUrl);
                                const target = e.currentTarget as HTMLImageElement;
                                console.error('Image error details:', {
                                  src: target.src,
                                  naturalWidth: target.naturalWidth,
                                  naturalHeight: target.naturalHeight,
                                  complete: target.complete
                                });
                                
                                // Fonction pour afficher l'erreur
                                const showImageError = (imgElement: HTMLImageElement) => {
                                  const parent = imgElement.parentElement;
                                  if (parent) {
                                    parent.innerHTML = `
                                      <div style="
                                        padding: 20px; 
                                        border: 2px dashed #ccc; 
                                        border-radius: 4px; 
                                        text-align: center; 
                                        color: #666;
                                        background-color: #f9f9f9;
                                      ">
                                        <p>⚠️ Image non disponible</p>
                                        <p style="font-size: 12px; margin: 5px 0 0 0;">
                                          Le fichier image n'a pas pu être chargé${imageUrl?.includes('.svg') ? ' (SVG)' : ''}
                                        </p>
                                      </div>
                                    `;
                                  }
                                };
                                
                                // Pour les SVG, on essaie une approche différente avant d'afficher l'erreur
                                if (imageUrl && imageUrl.toLowerCase().includes('.svg')) {
                                  console.log('SVG detected, trying alternative loading method');
                                  // Pour les SVG, on peut essayer de les charger comme data URL
                                  fetch(imageUrl)
                                    .then(response => {
                                      if (!response.ok) throw new Error(`HTTP ${response.status}`);
                                      return response.text();
                                    })
                                    .then(svgContent => {
                                      if (svgContent.includes('<svg')) {
                                        // Remplace l'img par le SVG inline
                                        const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent)}`;
                                        target.src = svgDataUrl;
                                        console.log('SVG loaded as data URL successfully');
                                        return;
                                      }
                                      throw new Error('Invalid SVG content');
                                    })
                                    .catch((fetchError) => {
                                      console.error('SVG fetch failed:', fetchError);
                                      // Si même cette approche échoue, afficher l'erreur
                                      showImageError(target);
                                    });
                                  return;
                                }
                                
                                // Pour les autres types d'images, affichage direct de l'erreur
                                showImageError(target);
                              }}
                            />
                          </Box>
                        ) : item.type === 'audio' && audioUrl ? (
                          <Card 
                            sx={{ 
                              maxWidth: 450, 
                              bgcolor: 'background.paper',
                              border: '1px solid',
                              borderColor: 'divider',
                              borderRadius: 2,
                              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                              transition: 'all 0.2s ease-in-out',
                              '&:hover': {
                                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                              }
                            }}
                          >
                            <CardContent sx={{ p: 2 }}>
                              {/* Lecteur audio compact avec icône */}
                              <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                alignContent: 'center',
                                bgcolor: 'grey.50',
                                borderRadius: 2,
                                p: 1.5,
                                mb: item.content ? 1.5 : 0,
                                border: '1px solid',
                                borderColor: 'grey.200'
                              }}>
                                <Box sx={{
                                  p: 0.8,
                                  borderRadius: '50%',
                                  bgcolor: 'primary.main',
                                  color: 'white',
                                  mr: 1.5,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  minWidth: 32,
                                  height: 32
                                }}>
                                  <AudioFileIcon fontSize="small" />
                                </Box>
                                
                                <CardMedia
                                  component="audio"
                                  controls
                                  src={audioUrl}
                                  sx={{
                                    flexGrow: 1,
                                    height: 40,
                                    '& audio': {
                                      width: '100%',
                                      outline: 'none',
                                      borderRadius: 1,
                                      '&::-webkit-media-controls-panel': {
                                        backgroundColor: 'white',
                                        borderRadius: '4px'
                                      },
                                      '&::-webkit-media-controls-play-button': {
                                        backgroundColor: 'primary.main',
                                        borderRadius: '50%'
                                      }
                                    }
                                  }}
                                />
                              </Box>
                              
                              {/* Description stylisée */}
                              {item.content && (
                                <Box sx={{
                                  bgcolor: 'grey.50',
                                  borderRadius: 1,
                                  p: 1.5,
                                  borderLeft: '3px solid',
                                  borderColor: 'primary.main'
                                }}>
                                  <Typography 
                                    variant="caption" 
                                    sx={{ 
                                      display: 'block', 
                                      color: 'text.secondary',
                                      fontStyle: 'italic',
                                      lineHeight: 1.4
                                    }}
                                  >
                                    {item.content}
                                  </Typography>
                                </Box>
                              )}
                            </CardContent>
                          </Card>
                        ) : item.type === 'list' ? (
                          <Typography 
                            onClick={() => setIsEditing(true)} 
                            sx={{ cursor: 'text', fontWeight: 'bold' }}
                          >
                            {item.content}
                          </Typography>
                        ) : item.type === 'listItem' ? (
                          <Box 
                            onClick={() => setIsEditing(true)} 
                            sx={{ cursor: 'text', display: 'flex', alignItems: 'flex-start' }}
                          >
                            <Typography sx={{ mr: 1, fontSize: '1.25rem' }}>•</Typography>
                            <Typography>{item.content}</Typography>
                          </Box>
                        ) : (
                          <Box 
                            onClick={() => setIsEditing(true)} 
                            sx={{ cursor: 'text' }}
                            dangerouslySetInnerHTML={{ __html: item.content || '' }} 
                          />
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
