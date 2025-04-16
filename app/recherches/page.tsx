'use client';

import React from 'react';
import { Container, Alert, Box, CircularProgress, Typography, Paper, Button, AlertTitle } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SearchHeader from '@/components/search/SearchHeader';
import SearchResults from '@/components/search/SearchResults';
import FragmentEditModal from '@/components/search/FragmentEditModal';
import CategoryManager from '@/components/categories/CategoryManager';
import { SearchContextProvider, useSearchContext } from '@/components/search/SearchContext';

export default function RechercheAvancee() {
  return (
    <SearchContextProvider>
      <SearchPage />
    </SearchContextProvider>
  );
}

function SearchPage() {
  const { 
    searchTerm, 
    isSearching, 
    results, 
    error, 
    totalResults,
    searchInputValue,
    isWaitingToSearch,
    hasSearched,
    categoryDialogOpen,
    setCategoryDialogOpen,
    categories,
    updateCategories
  } = useSearchContext();

  // Handler for category changes
  const handleCategoriesChange = (updatedCategories: any[]) => {
    updateCategories(updatedCategories);
  };

  return (
    <Container maxWidth="lg" className="py-8">
      {/* Search header with form and filters */}
      <SearchHeader />
      
      {/* Results section with improved state handling */}
      {isSearching ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Recherche en cours...</Typography>
        </Box>
      ) : hasSearched && totalResults === 0 ? (
        <Paper className="p-8 text-center">
          <Typography variant="h6">Aucun résultat trouvé pour "{searchTerm}"</Typography>
          <Typography variant="body2" className="mt-2 text-gray-600">
            Essayez de modifier vos termes de recherche ou vos filtres.
          </Typography>
        </Paper>
      ) : hasSearched ? (
        <SearchResults />
      ) : isWaitingToSearch && searchInputValue ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4, color: 'text.secondary' }}>
          <CircularProgress size={20} />
          <Typography sx={{ ml: 2 }}>Saisissez au moins 3 caractères pour lancer la recherche automatique...</Typography>
        </Box>
      ) : (
        <Paper className="p-8 text-center">
          <SearchIcon fontSize="large" className="text-gray-400 mb-2" />
          <Typography variant="h6">Recherchez dans toutes les données</Typography>
          <Typography variant="body2" className="mt-2 text-gray-600">
            Saisissez un terme de recherche et appuyez sur Entrée ou cliquez sur le bouton Rechercher.
          </Typography>
        </Paper>
      )}
      
      {/* Include the fragment edit modal */}
      <FragmentEditModal />
      
      {/* Include the category manager with corrected props */}
      {categories.length > 0 && (
        <CategoryManager
          categories={categories}
          onCategoriesChange={handleCategoriesChange}
          dialogOpen={categoryDialogOpen}
          setDialogOpen={setCategoryDialogOpen}
        />
      )}
    </Container>
  );
}
