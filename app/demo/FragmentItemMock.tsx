import React, { useRef } from 'react';
import { Paper, Typography, Button, IconButton } from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { useDrag } from 'react-dnd';

type FragmentItemMockProps = {
  fragment: any;
  index: number;
  onAddToCorrection?: (fragment: any) => void;
};

const FragmentItemMock: React.FC<FragmentItemMockProps> = ({ fragment, index, onAddToCorrection }) => {
  // Add a ref to solve the TypeScript error
  const paperRef = useRef<HTMLDivElement>(null);
  
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'fragment',
    item: { fragment },
    end: (item, monitor) => {
      const dropResult = monitor.getDropResult();
      // Don't add the fragment if it was dropped outside a drop target
      if (!dropResult) {
        return;
      }
      // Otherwise, the drop target will handle adding the fragment
    },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));
  
  // Apply the drag to the ref
  drag(paperRef);
  
  const handleAddToCorrection = () => {
    if (onAddToCorrection) {
      onAddToCorrection(fragment);
    }
  };
  
  return (
    <Paper 
      ref={paperRef}
      className="p-3 relative transition-all hover:shadow-md"
      variant="outlined"
      style={{ 
        opacity: isDragging ? 0.4 : 1,
        cursor: 'grab'
      }}
    >
      <div className="flex items-start">
        <div className="flex-grow">
          <Typography variant="body2" className="mb-2">
            {fragment.content}
          </Typography>
        </div>
        <IconButton size="small" color="inherit" sx={{ ml: 1, cursor: 'grab' }}>
          <DragIndicatorIcon fontSize="small" />
        </IconButton>
      </div>
      
      <div className="flex justify-between items-center mt-3">
        <Button
          size="small"
          color="primary"
          startIcon={<AddCircleOutlineIcon fontSize="small" />}
          className="text-xs"
          onClick={handleAddToCorrection}
        >
          Ajouter
        </Button>
        
        <div>
          <IconButton size="small" color="primary">
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="error">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </div>
      </div>
    </Paper>
  );
};

export default FragmentItemMock;
