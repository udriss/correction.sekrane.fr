'use client';

import React from 'react';
import { Box, Typography, Tabs, Tab } from '@mui/material';
import { useSearchContext } from './SearchContext';
import AllResultsTab from '@/components/search/AllResultsTab';
import CategoryResultsTab from '@/components/search/CategoryResultsTab';

export default function SearchResults() {
  const { 
    searchTerm, 
    isWaitingToSearch,
    hasSearched,
    totalResults, 
    results, 
    tabValue, 
    setTabValue,
    getTableIcon,
    getTableDisplayName
  } = useSearchContext();

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Filter out empty categories
  const nonEmptyCategories = results.filter(category => category.count > 0);

  return (
    <Box>
      {/* Only show results count if we have results */}
      {totalResults > 0 && (
        <Typography variant="h6" gutterBottom>
          {totalResults} résultat{totalResults !== 1 ? 's' : ''} pour "{searchTerm}"
        </Typography>
      )}
      
      {/* Results tabs - only show if we have results */}
      {totalResults > 0 && (
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label={`Tous (${totalResults})`} />
            {nonEmptyCategories.map((category) => (
              <Tab 
                key={category.table} 
                label={`${getTableDisplayName(category.table)} (${category.count})`}
                icon={getTableIcon(category.table)}
                iconPosition="start"
              />
            ))}
          </Tabs>
        </Box>
      )}
      
      {/* All results tab panel */}
      {totalResults > 0 && tabValue === 0 && <AllResultsTab />}
      
      {/* Individual category tab panels */}
      {totalResults > 0 && nonEmptyCategories.map((category, index) => (
        tabValue === index + 1 && (
          <CategoryResultsTab key={category.table} category={category} />
        )
      ))}
    </Box>
  );
}
