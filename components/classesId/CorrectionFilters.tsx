import React from 'react';
import { 
  Box, FormControl, InputLabel, Select, MenuItem, 
  Slider, TextField, Typography, Button
} from '@mui/material';

interface CorrectionFiltersProps {
  filterActivity: number | 'all';
  setFilterActivity: (value: number | 'all') => void;
  filterSubClass: string | 'all';
  setFilterSubClass: (value: string | 'all') => void;
  filterGradeRange: [number, number];
  setFilterGradeRange: (value: [number, number]) => void;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  uniqueActivities: Array<{ id: number; name: string }>;
  uniqueSubClasses: Array<{ id: number; name: string }>;
  hasSubClasses: boolean;
}

export function CorrectionFilters({
  filterActivity,
  setFilterActivity,
  filterSubClass,
  setFilterSubClass,
  filterGradeRange,
  setFilterGradeRange,
  searchTerm,
  setSearchTerm,
  uniqueActivities,
  uniqueSubClasses,
  hasSubClasses
}: CorrectionFiltersProps) {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
      {/* Activity filter */}
      <FormControl size="small" sx={{ minWidth: 200 }}>
        <InputLabel>Activité</InputLabel>
        <Select
          value={filterActivity}
          onChange={(e) => setFilterActivity(e.target.value as number | 'all')}
          label="Activité"
        >
          <MenuItem value="all">Toutes les activités</MenuItem>
          {uniqueActivities.map(activity => (
            <MenuItem key={activity.id} value={activity.id}>
              {activity.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Subclass filter (if class has subclasses) */}
      {hasSubClasses && (
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Groupe</InputLabel>
          <Select
            value={filterSubClass}
            onChange={(e) => setFilterSubClass(e.target.value as string)}
            label="Groupe"
          >
            <MenuItem value="all">Tous les groupes</MenuItem>
            {uniqueSubClasses.map(group => (
              <MenuItem key={group.id} value={group.id.toString()}>
                {group.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {/* Grade range filter */}
      <Box sx={{ width: 200, px: 1 }}>
        <Typography variant="caption" color="textSecondary">
          Notes: {filterGradeRange[0]} - {filterGradeRange[1]}
        </Typography>
        <Slider
          value={filterGradeRange}
          onChange={(_, newValue) => setFilterGradeRange(newValue as [number, number])}
          valueLabelDisplay="auto"
          min={0}
          max={20}
          size="small"
        />
      </Box>

      {/* Search box */}
      <TextField
        size="small"
        label="Rechercher"
        variant="outlined"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ flexGrow: 1, minWidth: 150 }}
        slotProps={{
          input: { 'aria-label': 'Rechercher par nom ou activité' }
        }}
      />
    </Box>
  );
}