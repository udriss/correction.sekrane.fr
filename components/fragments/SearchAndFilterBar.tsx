import React from 'react';
import {
  Paper,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  alpha,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CategoryIcon from '@mui/icons-material/CategoryOutlined';
import SettingsIcon from '@mui/icons-material/Settings';

interface Category {
  id: number;
  name: string;
}

interface SearchAndFilterBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  categoryFilter: string;
  categories: Category[];
  handleSearch: () => void;
  handleCategoryChange: (category: string) => void;
}

export const SearchAndFilterBar: React.FC<SearchAndFilterBarProps> = ({
  searchQuery,
  setSearchQuery,
  categoryFilter,
  categories,
  handleSearch,
  handleCategoryChange,
}) => {
  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: { xs: 2, sm: 3 }, 
        borderRadius: 3,
        backdropFilter: 'blur(20px)',
        backgroundColor: theme => alpha(theme.palette.background.paper, 0.9),
        boxShadow: theme => `0 8px 32px ${alpha(theme.palette.primary.main, 0.15)}`
      }}
    >
      <Grid container spacing={2} alignItems="center">
        <Grid size={{ xs: 12, md: 5, sm: 6 }}>
          <TextField
            label="Rechercher"
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
            slotProps={{
              input: { 
                startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
                endAdornment: (
                  <IconButton 
                    size="small" 
                    onClick={handleSearch}
                    sx={{ ml: -1 }}
                  >
                    <SearchIcon fontSize="small" />
                  </IconButton>
                )
                }
            }}
            fullWidth
          />
        </Grid>
        <Grid size={{ xs: 12, md: 5, sm: 6 }}>
          <FormControl size="small" fullWidth>
            <InputLabel id="category-filter-label">Catégorie</InputLabel>
            <Select
              labelId="category-filter-label"
              value={categoryFilter}
              onChange={(e) => handleCategoryChange(e.target.value)}
              label="Catégorie"
              startAdornment={<CategoryIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />}
            >
              <MenuItem value="all">Toutes</MenuItem>
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.name}>
                  {category.name}
                </MenuItem>
              ))}
              
              <MenuItem 
                value="manage_categories" 
                sx={{ color: 'primary.main', fontWeight: 'medium' }}
              >
                <SettingsIcon fontSize="small" sx={{ mr: 1 }} />
                Gérer les catégories
              </MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </Paper>
  );
};
