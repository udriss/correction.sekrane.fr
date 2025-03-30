'use client';

import React from 'react';
import { Box, Button } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CategoryIcon from '@mui/icons-material/Category';
import { useSearchContext } from './SearchContext';

interface ResultActionsProps {
  table: string;
  item: any;
}

export default function ResultActions({ table, item }: ResultActionsProps) {
  const { handleEditFragment, setCategoryDialogOpen } = useSearchContext();

  if (table === 'fragments') {
    return (
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button 
          size="small" 
          variant="outlined" 
          startIcon={<EditIcon />}
          onClick={() => handleEditFragment(item)}
        >
          Modifier
        </Button>
      </Box>
    );
  }
  
  if (table === 'categories') {
    return (
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button
          color='success'
          size="small" 
          variant="outlined" 
          startIcon={<CategoryIcon />}
          onClick={() => setCategoryDialogOpen(true)}
        >
          Gérer
        </Button>
      </Box>
    );
  }
  
  return null;
}
