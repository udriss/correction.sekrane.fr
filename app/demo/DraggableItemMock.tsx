import React, { useRef } from 'react';
import { Paper, IconButton, TextField, Box } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { useDrag, useDrop } from 'react-dnd';
import type { Identifier, XYCoord } from 'dnd-core';
import EditIcon from '@mui/icons-material/Edit';

type DraggableItemMockProps = {
  item: any;
  index: number;
  moveItem?: (dragIndex: number, hoverIndex: number) => void;
  onDelete?: (id: string) => void;
};

interface DragItem {
  index: number;
  id: string;
  type: string;
}

const DraggableItemMock: React.FC<DraggableItemMockProps> = ({ item, index, moveItem, onDelete }) => {
  const ref = useRef<HTMLDivElement>(null);
  
  const [{ handlerId }, drop] = useDrop<
    DragItem,
    void,
    { handlerId: Identifier | null }
  >({
    accept: 'item',
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      }
    },
    hover(item: DragItem, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;
      
      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }
      
      // Determine rectangle on screen
      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      
      // Get vertical middle
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      
      // Determine mouse position
      const clientOffset = monitor.getClientOffset();
      
      // Get pixels to the top
      const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top;
      
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
      if (moveItem) {
        moveItem(dragIndex, hoverIndex);
      }
      
      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex;
    },
  });
  
  const [{ isDragging }, drag] = useDrag({
    type: 'item',
    item: () => {
      return { id: item.id, index };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });
  
  const opacity = isDragging ? 0.4 : 1;
  drag(drop(ref));
  
  const handleDelete = () => {
    if (onDelete) {
      onDelete(item.id);
    }
  };
  
  return (
    <Paper 
      ref={ref}
      className={`p-3 mb-2 relative hover:shadow-md transition-shadow ${
        item.isFromFragment ? 'border-l-4 border-blue-500' : ''
      }`}
      variant="outlined"
      style={{ opacity, cursor: 'move' }}
      data-handler-id={handlerId}
    >
      <div className="flex items-start">
        <div className="flex-grow">
          <TextField
            multiline
            fullWidth
            variant="standard"
            value={item.content}
            InputProps={{ readOnly: true }}
            className="mt-0"
          />
        </div>
        
        <Box className="flex items-center">
          <IconButton size="small" color="primary">
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="error" onClick={handleDelete}>
            <DeleteIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="inherit" sx={{ cursor: 'grab' }}>
            <DragIndicatorIcon fontSize="small" />
          </IconButton>
        </Box>
      </div>
      
      {item.isFromFragment && (
        <div className="text-xs text-blue-600 mt-1">
          Provient d'un fragment
        </div>
      )}
    </Paper>
  );
};

export default DraggableItemMock;
