'use client';

import React from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Typography,
  Chip,
  Button,
  InputAdornment,
  Stack
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import { useNotificationsData } from '@/app/components/NotificationsDataProvider';
import dayjs from 'dayjs';

export default function NotificationFilters() {
  const {
    filters,
    setFilters,
    activeFilters,
    setActiveFilters,
    sortOptions,
    setSortOptions,
    clearAllFilters,
    unreadCount,
    readCount
  } = useNotificationsData();

  // Appliquer un filtre
  const applyFilter = (filterName: string) => {
    if (!activeFilters.includes(filterName)) {
      setActiveFilters(prev => [...prev, filterName]);
    }
  };

  // Supprimer un filtre
  const removeFilter = (filterName: string) => {
    setActiveFilters(prev => prev.filter(f => f !== filterName));
    setFilters(prev => ({
      ...prev,
      [filterName]: filterName === 'search' ? '' : 
                   filterName === 'read' ? 'all' : null
    }));
  };

  // Gérer le changement de recherche
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setFilters(prev => ({ ...prev, search: value }));
    
    if (value && !activeFilters.includes('search')) {
      applyFilter('search');
    } else if (!value && activeFilters.includes('search')) {
      removeFilter('search');
    }
  };

  // Gérer le changement de statut de lecture
  const handleReadStatusChange = (value: 'all' | 'read' | 'unread') => {
    setFilters(prev => ({ ...prev, read: value }));
    
    if (value !== 'all' && !activeFilters.includes('read')) {
      applyFilter('read');
    } else if (value === 'all' && activeFilters.includes('read')) {
      removeFilter('read');
    }
  };

  // Gérer le changement de date de début
  const handleDateFromChange = (date: any) => {
    setFilters(prev => ({ ...prev, dateFrom: date }));
    
    if (date && !activeFilters.includes('dateFrom')) {
      applyFilter('dateFrom');
    } else if (!date && activeFilters.includes('dateFrom')) {
      removeFilter('dateFrom');
    }
  };

  // Gérer le changement de date de fin
  const handleDateToChange = (date: any) => {
    setFilters(prev => ({ ...prev, dateTo: date }));
    
    if (date && !activeFilters.includes('dateTo')) {
      applyFilter('dateTo');
    } else if (!date && activeFilters.includes('dateTo')) {
      removeFilter('dateTo');
    }
  };

  // Gérer le changement de tri
  const handleSortChange = (field: string, direction: 'asc' | 'desc') => {
    setSortOptions({ field: field as any, direction });
  };

  return (
    <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Filtrer et trier les notifications
      </Typography>

      <Stack spacing={3}>
        {/* Recherche */}
        <TextField
          label="Rechercher"
          placeholder="Titre du feedback, activité, étudiant..."
          value={filters.search}
          onChange={handleSearchChange}
          size="small"
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: filters.search && (
              <InputAdornment position="end">
                <Button
                  size="small"
                  onClick={() => handleSearchChange({ target: { value: '' } } as any)}
                  sx={{ minWidth: 'auto', p: 0.5 }}
                >
                  <ClearIcon fontSize="small" />
                </Button>
              </InputAdornment>
            )
          }}
        />

        {/* Filtres en ligne */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Statut de lecture */}
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Statut</InputLabel>
            <Select
              value={filters.read}
              label="Statut"
              onChange={(e) => handleReadStatusChange(e.target.value as any)}
            >
              <MenuItem value="all">
                Toutes ({unreadCount + readCount})
              </MenuItem>
              <MenuItem value="unread">
                Non lues ({unreadCount})
              </MenuItem>
              <MenuItem value="read">
                Lues ({readCount})
              </MenuItem>
            </Select>
          </FormControl>

          {/* Tri */}
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Trier par</InputLabel>
            <Select
              value={`${sortOptions.field}-${sortOptions.direction}`}
              label="Trier par"
              onChange={(e) => {
                const [field, direction] = e.target.value.split('-');
                handleSortChange(field, direction as 'asc' | 'desc');
              }}
            >
              <MenuItem value="viewed_at-desc">Plus récent</MenuItem>
              <MenuItem value="viewed_at-asc">Plus ancien</MenuItem>
              <MenuItem value="feedback_title-asc">Titre A-Z</MenuItem>
              <MenuItem value="feedback_title-desc">Titre Z-A</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Filtres de date */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <DatePicker
            label="Date de début"
            value={filters.dateFrom}
            onChange={handleDateFromChange}
            slotProps={{
              textField: {
                size: 'small',
                sx: { minWidth: 150 }
              }
            }}
          />
          
          <DatePicker
            label="Date de fin"
            value={filters.dateTo}
            onChange={handleDateToChange}
            slotProps={{
              textField: {
                size: 'small',
                sx: { minWidth: 150 }
              }
            }}
          />
        </Box>

        {/* Filtres actifs */}
        {activeFilters.length > 0 && (
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Filtres actifs :
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {activeFilters.map(filter => (
                <Chip
                  key={filter}
                  label={
                    filter === 'search' ? `Recherche: "${filters.search}"` :
                    filter === 'read' ? `Statut: ${filters.read === 'unread' ? 'Non lues' : 'Lues'}` :
                    filter === 'dateFrom' ? `À partir de: ${dayjs(filters.dateFrom).format('DD/MM/YYYY')}` :
                    filter === 'dateTo' ? `Jusqu'à: ${dayjs(filters.dateTo).format('DD/MM/YYYY')}` :
                    filter
                  }
                  onDelete={() => removeFilter(filter)}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              ))}
              <Button
                size="small"
                onClick={clearAllFilters}
                startIcon={<ClearIcon />}
                variant="outlined"
                color="secondary"
              >
                Tout effacer
              </Button>
            </Stack>
          </Box>
        )}
      </Stack>
    </Paper>
  );
}
