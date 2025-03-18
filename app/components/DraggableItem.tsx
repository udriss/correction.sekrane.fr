import React, { useRef, useState, useEffect } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { ContentItem, DragItem } from '@/types/correction';
import { useIsomorphicLayoutEffect } from '@/utils/client-hooks';
// Import Material UI components
import { IconButton, TextField, Paper, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ArticleIcon from '@mui/icons-material/Article';
import Image from 'next/image';

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
  const ref = useRef<HTMLDivElement>(null);
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

  const [{ isDragging }, drag] = useDrag({
    type: 'contentItem',
    item: () => ({ index, id: item.id }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  });

  const [, drop] = useDrop({
    accept: 'contentItem',
    hover: (draggedItem: DragItem, monitor) => {
      if (!ref.current) return;
      
      const dragIndex = draggedItem.index;
      const hoverIndex = index;
      
      if (dragIndex === hoverIndex) return;
      
      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      
      if (!clientOffset) return;
      
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;
      
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;
      
      moveItem(dragIndex, hoverIndex);
      draggedItem.index = hoverIndex;
    }
  });

  // Important: appliquer drag et drop au même conteneur racine pour tous les types d'éléments
  drag(ref);
  drop(ref);
  
  const opacity = isDragging ? 0.4 : 1;

  return (
    <div 
      ref={ref}
      className="mb-2" 
      id={item.id} 
      data-item-id={item.id}
      data-parent-id={item.parentId}
      data-from-fragment={item.isFromFragment ? 'true' : 'false'}
      style={{ opacity }}
    >
      <Paper 
        elevation={1} 
        className={`
          ${isDragging ? 'opacity-50' : ''} 
          ${item.isFromFragment ? 'border-l-4 border-blue-500' : ''}
          transition-all duration-200
        `}
        variant="outlined"
      >
        {isEditing ? (
          /* Mode édition - design plus compact */
          <div className="p-2">
            <div className="flex items-center mb-1">
              <div className="cursor-move flex items-center mr-1">
                <DragIndicatorIcon fontSize="small" />
              </div>
              
              {item.isFromFragment && (
                <Typography variant="caption" className="text-blue-600 flex items-center text-xs mr-auto">
                  <ArticleIcon fontSize="small" className="mr-1" />
                  Fragment importé
                </Typography>
              )}
              
              <div className="flex space-x-1 ml-auto">
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
              </div>
            </div>
            
            <TextField
              value={editedContent}
              onChange={handleContentChange}
              onKeyDown={handleKeyDown}
              className="w-full mt-1"
              multiline
              rows={item.type === 'image' ? 1 : 2}
              autoFocus
              variant="outlined"
              size="small"
              onBlur={() => {
                if (editedContent !== item.content) {
                  handleSave();
                }
              }}
            />
          </div>
        ) : (
          /* Mode affichage normal */
          <div className="p-3 flex items-start">
            <div className="cursor-move flex items-center mr-2">
              <DragIndicatorIcon fontSize="small" />
            </div>
            
            <div className="flex-grow">
              {/* Indicateur de fragment */}
              {item.isFromFragment && (
                <Typography variant="caption" className="text-blue-600 flex items-center mb-1">
                  <ArticleIcon fontSize="small" className="mr-1" />
                  Fragment importé
                </Typography>
              )}
              
              <div onClick={() => setIsEditing(true)} className="cursor-text">
                {item.type === 'image' && item.src ? (
                  <div className="relative">
                    <img 
                      src={item.src}
                      alt={item.alt || 'Image uploadée'}
                      className="max-w-full h-auto rounded"
                      style={{ maxHeight: '200px' }}
                    />
                  </div>
                ) : item.type === 'list' ? (
                  <strong>{item.content}</strong>
                ) : item.type === 'listItem' ? (
                  <div className="flex items-start">
                    <span className="mr-2 text-lg">•</span>
                    <span>{item.content}</span>
                  </div>
                ) : (
                  <div dangerouslySetInnerHTML={{ __html: item.content || '' }} />
                )}
              </div>
            </div>
            
            <div className="flex space-x-1 ml-2">
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
            </div>
          </div>
        )}
      </Paper>
    </div>
  );
};

export default DraggableItem;
