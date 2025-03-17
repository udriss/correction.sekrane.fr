import React, { useRef, useState, useEffect } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { ContentItem, DragItem } from '@/types/correction';
// Import Material UI components
import { IconButton, TextField } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';

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
  const [editedContent, setEditedContent] = useState(item.content);
  
  // Synchroniser l'état local lorsque l'item change
  useEffect(() => {
    setEditedContent(item.content);
  }, [item.content]);
  
  // Handle content save
  const handleSave = () => {
    if (editedContent !== item.content) {
      updateItem(index, editedContent);
    }
    setIsEditing(false);
  };
  
  // Handle cancellation
  const handleCancel = () => {
    setEditedContent(item.content);
    setIsEditing(false);
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

  drag(drop(ref));
  
  let className = "p-3 mb-2 border rounded bg-white cursor-move";
  if (isDragging) className += " opacity-50";
  if (item.type === 'list') className += " bg-gray-50";
  if (item.type === 'listItem') className += " ml-8 border-dashed";

  return (
    <div ref={ref} className={className} id={item.id}>
      <div className="flex justify-between items-center">
        <div className="flex-grow">
          {isEditing ? (
            <TextField
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full"
              multiline
              rows={2}
              autoFocus
              variant="outlined"
              size="small"
            />
          ) : (
            <div onClick={() => setIsEditing(true)} className="cursor-text">
              {item.type === 'list' ? (
                <strong>{item.content}</strong>
              ) : item.type === 'listItem' ? (
                <div className="flex items-start">
                  <span className="mr-2 text-lg">•</span>
                  <span>{item.content}</span>
                </div>
              ) : (
                <span>{item.content}</span>
              )}
            </div>
          )}
        </div>
        <div className="flex space-x-2">
          {isEditing ? (
            <>
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
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DraggableItem;
