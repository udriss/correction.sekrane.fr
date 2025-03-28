import React from 'react';
import { Box } from '@mui/material';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Fragment } from '@/lib/types';
import FragmentCard from '@/components/fragments/FragmentCard';

interface FragmentListProps {
  fragments: Fragment[];
  editingFragmentId: number | null;
  categories: Array<{id: number, name: string}>;
  onEdit: (id: number) => void;
  onCancelEdit: () => void;
  onUpdate: (fragment: Fragment) => void;
  onDelete: (id: number) => void;
  onAddToCorrection?: (fragment: Fragment) => void;
  moveFragment: (dragIndex: number, hoverIndex: number) => void;
  refreshCategories: () => Promise<void>;
}

const FragmentList: React.FC<FragmentListProps> = ({
  fragments,
  editingFragmentId,
  categories,
  onEdit,
  onCancelEdit,
  onUpdate,
  onDelete,
  onAddToCorrection,
  moveFragment,
  refreshCategories
}) => {
  return (
    <DndProvider backend={HTML5Backend}>
      <Box sx={{ maxHeight: 500, overflowY: 'auto', p: 0.5, '& > *': { mb: 1.5 } }}>
        {fragments.map((fragment, index) => (
          <FragmentCard
            key={`fragment-${fragment.id}`}
            fragment={fragment}
            index={index}
            isEditing={fragment.id === editingFragmentId}
            categories={categories}
            onEdit={() => onEdit(fragment.id)}
            onCancelEdit={onCancelEdit}
            onUpdate={onUpdate}
            onDelete={() => onDelete(fragment.id)}
            onAddToCorrection={onAddToCorrection ? () => onAddToCorrection(fragment) : undefined}
            moveFragment={moveFragment}
            refreshCategories={refreshCategories}
          />
        ))}
      </Box>
    </DndProvider>
  );
};

export default FragmentList;
