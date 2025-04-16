import React, { useRef, useEffect } from 'react';
import {
  Typography,
  Box,
  Container,
  Zoom,
  Fade
} from '@mui/material';
import GradientBackground from '@/components/ui/GradientBackground';
import PatternBackground from '@/components/ui/PatternBackground';
import { SearchAndFilterBar } from './SearchAndFilterBar';

interface Category {
  id: number;
  name: string;
}

interface FragmentsHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  categoryFilter: string;
  categories: Category[];
  handleSearch: () => void;
  handleCategoryChange: (category: string) => void;
}

export const FragmentsHeader: React.FC<FragmentsHeaderProps> = ({
  searchQuery,
  setSearchQuery,
  categoryFilter,
  categories,
  handleSearch,
  handleCategoryChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Safe DOM manipulation inside useEffect with null check
  useEffect(() => {
    // Only attempt to access DOM nodes if they exist
    if (containerRef.current) {
      // Safe DOM operations here
    }
  }, []);
  
  return (
    <GradientBackground variant="primary" sx={{ pt: 5, pb: 6, px: 3, mb: 4 }}>
      <PatternBackground 
        pattern='dots'
        opacity={0.05}
        sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: -1 }}
      />
      <Container className="max-w-4xl" ref={containerRef}>
        <Zoom in={true} timeout={800} mountOnEnter unmountOnExit>
          <Box>
            <Box>
              <Typography variant="h4" component="h1" color='text.primary' gutterBottom>
                Bibliothèque de fragments
              </Typography>
              <Typography 
                variant="subtitle1" 
                color="text.secondary"
                sx={{ mb: 4 }}
              >
                Parcourez et utilisez des fragments de texte prédéfinis pour vos corrections
              </Typography>
            </Box>
          </Box>
        </Zoom>
        
        {/* Barre de recherche et filtres */}
        <Fade in={true} timeout={1000} mountOnEnter unmountOnExit>
          <div>
            <SearchAndFilterBar 
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              categoryFilter={categoryFilter}
              categories={categories}
              handleSearch={handleSearch}
              handleCategoryChange={handleCategoryChange}
            />
          </div>
        </Fade>
      </Container>
    </GradientBackground>
  );
};
