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
  isSelectable?: boolean;
  selectedFragments?: number[];
  onSelectionChange?: (fragmentId: number, selected: boolean) => void;
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
  renderPositionChip,
  isSelectable = false,
  selectedFragments = [],
  onSelectionChange
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
          isSelectable={isSelectable}
          isSelected={selectedFragments.includes(fragment.id)}
          onSelectionChange={onSelectionChange}
        />
      ))}
    </Box>
  );
};

export default FragmentList;
