'use client';

import React from 'react';
import {
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  InputAdornment,
  IconButton,
  Tooltip,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Alert
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import TuneIcon from '@mui/icons-material/Tune';
import { useSearchContext } from './SearchContext';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

export default function SearchHeader() {
  const {
    searchInputValue,
    setSearchInputValue,
    isWaitingToSearch,
    isSearching,
    error,
    showFilters,
    setShowFilters,
    selectedTables,
    handleManualSearch,
    handleClearSearch,
    handleTableFilterChange
  } = useSearchContext();

  return (
    <Paper elevation={3} className="mb-6 p-6 rounded-lg">
      <Typography variant="h4" component="h1" gutterBottom className="font-bold">
        Recherche avancée
      </Typography>
      <Typography variant="body1" className="mb-4 text-gray-600">
        Recherchez dans toutes les tables de l'application : catégories, classes, étudiants, activités et fragments.
      </Typography>
      
      {/* Display error message in header if present */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => {}}>
          {error}
        </Alert>
      )}
      
      {/* Updated search form */}
      <form onSubmit={handleManualSearch} className="mt-4">
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Rechercher..."
            value={searchInputValue}
            onChange={(e) => setSearchInputValue(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  {isWaitingToSearch && (
                    <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                  )}
                  {searchInputValue && (
                    <IconButton onClick={handleClearSearch} edge="end">
                      <ClearIcon />
                    </IconButton>
                  )}
                </InputAdornment>
              )
            }}
          />
          <Button
            type="submit"
            variant="outlined"
            color="primary"
            disabled={isSearching || !searchInputValue.trim()}
            startIcon={isSearching ? <CircularProgress size={20} color="inherit" /> : ''}
          >
            {isSearching ? 'Recherche...' : <PlayArrowIcon fontSize='large' />}
          </Button>
          <Tooltip title="Filtres de recherche">
            <Button
              color="secondary"
              variant="outlined"
              onClick={() => setShowFilters(!showFilters)}
              startIcon={<TuneIcon />}
            >
              Filtres
            </Button>
          </Tooltip>
        </Box>
        
        {/* Search filters */}
        {showFilters && (
          <Paper variant="outlined" className="mt-3 p-3">
            <Typography variant="subtitle2" gutterBottom>
              Filtrer par tables:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <FormControlLabel
                control={<Checkbox checked={selectedTables.categories} onChange={() => handleTableFilterChange('categories')} />}
                label="Catégories"
              />
              <FormControlLabel
                control={<Checkbox checked={selectedTables.classes} onChange={() => handleTableFilterChange('classes')} />}
                label="Classes"
              />
              <FormControlLabel
                control={<Checkbox checked={selectedTables.students} onChange={() => handleTableFilterChange('students')} />}
                label="Étudiants"
              />
              <FormControlLabel
                control={<Checkbox checked={selectedTables.activities} onChange={() => handleTableFilterChange('activities')} />}
                label="Activités"
              />
              <FormControlLabel
                control={<Checkbox checked={selectedTables.fragments} onChange={() => handleTableFilterChange('fragments')} />}
                label="Fragments"
              />
            </Box>
          </Paper>
        )}
      </form>
    </Paper>
  );
}
