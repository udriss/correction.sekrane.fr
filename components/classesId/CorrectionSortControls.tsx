import React from 'react';
import { Box, Button, FormControl, InputLabel, MenuItem, Select, Typography } from '@mui/material';

interface CorrectionSortControlsProps {
  sortField: 'lastName' | 'firstName' | 'grade' | 'activity' | 'date';
  sortDirection: 'asc' | 'desc';
  onSortChange: (field: 'lastName' | 'firstName' | 'grade' | 'activity' | 'date') => void;
  groupBy: 'none' | 'activity' | 'student';
  setGroupBy: (value: 'none' | 'activity' | 'student') => void;
  viewMode: 'card' | 'table';
  setViewMode: (mode: 'card' | 'table') => void;
}

export function CorrectionSortControls({
  sortField,
  sortDirection,
  onSortChange,
  groupBy,
  setGroupBy,
  viewMode,
  setViewMode
}: CorrectionSortControlsProps) {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
      {/* Sort options */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="caption" sx={{ mr: 1 }}>
          Trier par:
        </Typography>
        <Button 
          size="small" 
          variant={sortField === 'lastName' ? 'contained' : 'outlined'}
          onClick={() => onSortChange('lastName')}
          endIcon={sortField === 'lastName' ? (sortDirection === 'asc' ? '↑' : '↓') : undefined}
        >
          Nom
        </Button>
        <Button 
          size="small" 
          variant={sortField === 'firstName' ? 'contained' : 'outlined'}
          onClick={() => onSortChange('firstName')}
          endIcon={sortField === 'firstName' ? (sortDirection === 'asc' ? '↑' : '↓') : undefined}
        >
          Prénom
        </Button>
        <Button 
          size="small" 
          variant={sortField === 'grade' ? 'contained' : 'outlined'}
          onClick={() => onSortChange('grade')}
          endIcon={sortField === 'grade' ? (sortDirection === 'asc' ? '↑' : '↓') : undefined}
        >
          Note
        </Button>
        <Button 
          size="small" 
          variant={sortField === 'activity' ? 'contained' : 'outlined'}
          onClick={() => onSortChange('activity')}
          endIcon={sortField === 'activity' ? (sortDirection === 'asc' ? '↑' : '↓') : undefined}
        >
          Activité
        </Button>
        <Button 
          size="small" 
          variant={sortField === 'date' ? 'contained' : 'outlined'}
          onClick={() => onSortChange('date')}
          endIcon={sortField === 'date' ? (sortDirection === 'asc' ? '↑' : '↓') : undefined}
        >
          Date
        </Button>
      </Box>

      {/* Grouping and view options */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>Regrouper par</InputLabel>
          <Select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as 'none' | 'activity' | 'student')}
            label="Regrouper par"
          >
            <MenuItem value="none">Aucun</MenuItem>
            <MenuItem value="activity">Activité</MenuItem>
            <MenuItem value="student">Étudiant</MenuItem>
          </Select>
        </FormControl>

        <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, display: 'flex' }}>
          <Button
            size="small"
            variant={viewMode === 'card' ? 'contained' : 'text'}
            onClick={() => setViewMode('card')}
          >
            Cartes
          </Button>
          <Button
            size="small"
            variant={viewMode === 'table' ? 'contained' : 'text'}
            onClick={() => setViewMode('table')}
          >
            Table
          </Button>
        </Box>
      </Box>
    </Box>
  );
}