'use client';

import React, { useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, Chip } from '@mui/material';
import Link from 'next/link';
import { useSearchContext } from './SearchContext';
import ResultActions from '@/components/search/ResultActions';

export default function AllResultsTab() {
  const { 
    results,
    getTableIcon,
    getTableDisplayName,
    getResultLink,
    getResultLabel,
    getResultSecondaryText,
    getItemStats
  } = useSearchContext();

  // Filter out empty categories
  const nonEmptyCategories = results.filter(category => category.count > 0);
  

  return (
    <Box>
      {nonEmptyCategories.map((category) => (
        <Box key={category.table} sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            {getTableIcon(category.table)}
            <Typography variant="h6" sx={{ ml: 1 }}>
              {getTableDisplayName(category.table)} ({category.count})
            </Typography>
          </Box>
          
          <Grid container spacing={2}>
            {category.items.map((item) => (
              <Grid size={{ xs: 12, sm:6, md: 4, lg: 3 }} key={`${category.table}-${item.id}`}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                      <Box sx={{ mr: 1.5 }}>
                        {getTableIcon(category.table)}
                      </Box>
                      <Box>
                        <Link href={getResultLink(category.table, item.id)}>
                          <Typography variant="subtitle1" component="div" className="font-medium hover:underline">
                            {getResultLabel(category.table, item)}
                          </Typography>
                        </Link>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {getResultSecondaryText(category.table, item)}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip 
                        key={`stat-${item.id}-${category.table === 'fragments' 
                          ? (item.categories ? item.categories.length : 0) 
                          : item.id}`}
                        size="small" 
                        icon={getItemStats(category.table, item).icon}
                        label={getItemStats(category.table, item).label} 
                        variant="outlined"
                        sx={{
                          color: theme => theme.palette.secondary.dark,
                          height: "auto",
                          "& .MuiChip-label": { 
                            display: "block", 
                            whiteSpace: "normal",
                            py: 0.5
                          } 
                        }}
                      />
                      <ResultActions table={category.table} item={item} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      ))}
    </Box>
  );
}
