'use client';

import React from 'react';
import { Box, List, ListItem, ListItemIcon, ListItemText, Paper, Typography, Chip } from '@mui/material';
import Link from 'next/link';
import { useSearchContext, SearchResult } from './SearchContext';
import ResultActions from '@/components/search/ResultActions';

interface CategoryResultsTabProps {
  category: SearchResult;
}

export default function CategoryResultsTab({ category }: CategoryResultsTabProps) {
  const { 
    getTableIcon,
    getResultLink,
    getResultLabel,
    getResultSecondaryText,
    getItemStats
  } = useSearchContext();

  return (
    <Box>
      <List>
        {category.items.map((item) => (
          <ListItem 
            key={`${category.table}-${item.id}`}
            component={Paper}
            variant="outlined"
            sx={{ mb: 2, borderRadius: 1 }}
          >
            <ListItemIcon>
              {getTableIcon(category.table)}
            </ListItemIcon>
            <ListItemText
              primary={
                <Link href={getResultLink(category.table, item.id)}>
                  <Typography color="primary" className="hover:underline">
                    {getResultLabel(category.table, item)}
                  </Typography>
                </Link>
              }
              secondary={getResultSecondaryText(category.table, item)}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
