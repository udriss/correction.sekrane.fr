'use client';

import React from 'react';
import { 
  Box, 
  Button, 
  IconButton, 
  Select, 
  MenuItem, 
  Typography, 
  Stack,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  FirstPage,
  LastPage
} from '@mui/icons-material';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  showItemsPerPageSelector?: boolean;
  itemsPerPageOptions?: number[];
  disabled?: boolean;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  showItemsPerPageSelector = true,
  itemsPerPageOptions = [10, 20, 50, 100, 200, 300, 500],
  disabled = false
}) => {
  // Calculer les éléments visibles
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Générer les numéros de page à afficher
  const getVisiblePages = () => {
    const delta = 2; // Nombre de pages à afficher de chaque côté de la page actuelle
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); 
         i <= Math.min(totalPages - 1, currentPage + delta); 
         i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  if (totalPages <= 1) {
    return showItemsPerPageSelector ? (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {totalItems === 0 ? 'Aucun élément' : `${totalItems} élément${totalItems > 1 ? 's' : ''}`}
        </Typography>
        
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Par page</InputLabel>
          <Select
            value={itemsPerPage}
            label="Par page"
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            disabled={disabled}
          >
            {itemsPerPageOptions.map(option => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    ) : null;
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between', 
      p: 2,
      flexWrap: 'wrap',
      gap: 2
    }}>
      {/* Informations sur les éléments */}
      <Typography variant="body2" color="text.secondary">
        {totalItems === 0 
          ? 'Aucun élément' 
          : `${startItem}-${endItem} sur ${totalItems} éléments`
        }
      </Typography>

      {/* Contrôles de pagination */}
      <Stack direction="row" spacing={1} alignItems="center">
        {/* Sélecteur d'éléments par page */}
        {showItemsPerPageSelector && (
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Par page</InputLabel>
            <Select
              value={itemsPerPage}
              label="Par page"
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              disabled={disabled}
            >
              {itemsPerPageOptions.map(option => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {/* Boutons de navigation */}
        <Stack direction="row" spacing={0.5}>
          {/* Première page */}
          <IconButton
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1 || disabled}
            size="small"
            title="Première page"
          >
            <FirstPage />
          </IconButton>

          {/* Page précédente */}
          <IconButton
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1 || disabled}
            size="small"
            title="Page précédente"
          >
            <ChevronLeft />
          </IconButton>

          {/* Numéros de page */}
          {getVisiblePages().map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <Button
                  disabled
                  size="small"
                  sx={{ minWidth: 40 }}
                >
                  ...
                </Button>
              ) : (
                <Button
                  variant={page === currentPage ? 'contained' : 'outlined'}
                  onClick={() => onPageChange(page as number)}
                  disabled={disabled}
                  size="small"
                  sx={{ minWidth: 40 }}
                >
                  {page}
                </Button>
              )}
            </React.Fragment>
          ))}

          {/* Page suivante */}
          <IconButton
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages || disabled}
            size="small"
            title="Page suivante"
          >
            <ChevronRight />
          </IconButton>

          {/* Dernière page */}
          <IconButton
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages || disabled}
            size="small"
            title="Dernière page"
          >
            <LastPage />
          </IconButton>
        </Stack>
      </Stack>
    </Box>
  );
};

export default Pagination;
