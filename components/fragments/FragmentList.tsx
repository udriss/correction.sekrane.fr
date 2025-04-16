import React from 'react';
import { Box } from '@mui/material';
import { Fragment } from '@/lib/types';
import FragmentCard from './FragmentCard';

interface FragmentListProps {
  fragments: Fragment[];
  editingFragmentId: number | null;
  categories: Array<{id: number, name: string}>;
  onEdit: (id: number) => void;
  onCancelEdit: () => void;
  onUpdate: (fragment: Fragment) => void;
  onDelete: (id: number) => void;
  onAddToCorrection?: (fragment: Fragment) => void;
  refreshCategories: () => Promise<void>;
  renderPositionChip?: (fragment: Fragment) => React.ReactNode;
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
  refreshCategories,
  renderPositionChip
}) => {
  return (
    <Box sx={{ maxHeight: 900, overflowY: 'auto', p: 0.5, '& > *': { mb: 1.5 }, position: 'relative' }}>
      {fragments.map((fragment) => (
        <FragmentCard
          key={`fragment-${fragment.id}`}
          fragment={fragment}
          isEditing={fragment.id === editingFragmentId}
          categories={categories}
          onEdit={() => onEdit(fragment.id)}
          onCancelEdit={onCancelEdit}
          onUpdate={onUpdate}
          onDelete={() => onDelete(fragment.id)}
          onAddToCorrection={onAddToCorrection ? () => onAddToCorrection(fragment) : undefined}
          refreshCategories={refreshCategories}
          renderPositionChip={renderPositionChip ? () => renderPositionChip(fragment) : undefined}
        />
      ))}
    </Box>
  );
};

export default FragmentList;
