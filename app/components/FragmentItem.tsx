'use client';

import React, { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { Fragment } from '@/lib/types';
// Import Material UI components
import { Button, TextField, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check'; // added import

interface FragmentItemProps {
  fragment: Fragment;
  isEditing: boolean;
  editedContent: string;
  savingFragment: boolean;
  onAddToCorrection: (fragment: Fragment) => void;
  onEdit: (fragment: Fragment) => void;
  onDelete: (fragmentId: number) => void;
  onSave: () => void;
  onCancel: () => void;
  onContentChange: (content: string) => void;
  index: number;
  moveFragment?: (dragIndex: number, hoverIndex: number) => void;
}

// Item type for drag and drop
const ITEM_TYPE = 'fragment';

interface DragItem {
  index: number;
  id: number;
  type: string;
}

const FragmentItem: React.FC<FragmentItemProps> = ({
  fragment,
  isEditing,
  editedContent,
  savingFragment,
  onAddToCorrection,
  onEdit,
  onDelete,
  onSave,
  onCancel,
  onContentChange,
  index,
  moveFragment
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [confirmDelete, setConfirmDelete] = React.useState(false); // added state
  
  // Set up drag functionality
  const [{ isDragging }, drag] = useDrag({
    type: ITEM_TYPE,
    item: { id: fragment.id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: !isEditing && !!moveFragment // Only allow dragging when not editing
  });
  
  // Set up drop functionality
  const [, drop] = useDrop({
    accept: ITEM_TYPE,
    hover: (item: DragItem, monitor) => {
      if (!ref.current || !moveFragment) {
        return;
      }
      
      const dragIndex = item.index;
      const hoverIndex = index;
      
      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }
      
      // Determine rectangle on screen
      const hoverBoundingRect = ref.current.getBoundingClientRect();
      
      // Get vertical middle
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      
      // Determine mouse position
      const clientOffset = monitor.getClientOffset();
      
      if (!clientOffset) {
        return;
      }
      
      // Get pixels to the top
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;
      
      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%
      
      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      
      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }
      
      // Time to actually perform the action
      moveFragment(dragIndex, hoverIndex);
      
      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex;
    }
  });
  
  // Initialize drag and drop refs
  drag(drop(ref));
  
  // Apply styles for dragging
  const opacity = isDragging ? 0.4 : 1;
  
  return (
    <div 
      ref={ref} 
      className={`fragment-item bg-gray-50 border rounded p-3 ${isDragging ? 'opacity-40' : ''}`}
      style={{ cursor: moveFragment ? 'move' : 'default' }}
    >
      <div>
      </div>
      {isEditing ? (
        <div className="mb-2">
          <TextField
            value={editedContent}
            onChange={(e) => onContentChange(e.target.value)}
            className="w-full mb-2"
            multiline
            rows={3}
            autoFocus
            variant="outlined"
            size="small"
          />
          <div className="mt-2 flex justify-end space-x-2">
            <Button
              onClick={onSave}
              disabled={savingFragment}
              variant="outlined"
              color="success"
              size="small"
            >
              <SaveIcon sx={{ mr: 0.2 }} />
              {savingFragment ? 'Sauvegarde...' : ''}
            </Button>
            
            <Button
              onClick={onCancel}
              variant="outlined"
              color="inherit"
              size="small"
            >
              <CancelIcon sx={{ mr: 0.2 }} />
            </Button>
          </div>
        </div>
      ) : (
        <>
          {moveFragment && (
            <div className="flex justify-end text-gray-400 text-xs mb-1">
              Position : {fragment.position_order !== null && fragment.position_order !== undefined ? fragment.position_order : 'N/A'}
            </div>
          )}
          <div className="whitespace-pre-wrap mb-2 text-sm max-h-[100px] overflow-y-auto">
            {fragment.content}
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              onClick={() => onAddToCorrection(fragment)}
              variant="outlined"
              color="success"
              size="small"
            >
              <AddIcon sx={{ mr: 0.2 }} />
            </Button>
            
              <Button
                onClick={() => onEdit(fragment)}
                variant="outlined"
                color="warning"
                size="small"
              >
                <EditIcon sx={{ mr: 0.2 }} />
              </Button>
              {confirmDelete ? (
                <>
                  <IconButton
                    onClick={() => {
                      fragment.id && onDelete(fragment.id);
                      setConfirmDelete(false);
                    }}
                    color="error"
                    size="small"
                    title="Confirmer suppression"
                  >
                    <CheckIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    onClick={() => setConfirmDelete(false)}
                    color="inherit"
                    size="small"
                    title="Annuler suppression"
                  >
                    <CancelIcon fontSize="small" />
                  </IconButton>
                </>
              ) : (
                <IconButton
                  onClick={() => setConfirmDelete(true)}
                  color="error"
                  size="small"
                  title="Supprimer ce fragment"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              )}
          </div>
        </>
      )}
    </div>
  );
};

export default FragmentItem;
