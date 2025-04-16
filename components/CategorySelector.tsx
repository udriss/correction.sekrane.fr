import React, { useState, useEffect } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Box,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ListItemText,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CategoryIcon from '@mui/icons-material/Category';

interface CategorySelectorProps {
  value: string;
  onChange: (value: string) => void;
  existingCategories: Array<{id: number, name: string}>;
  required?: boolean;
  label?: string;
  margin?: 'none' | 'dense' | 'normal';
  size?: 'small' | 'medium';
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  value,
  onChange,
  existingCategories,
  required = false,
  label = "Catégorie",
  margin = "none",
  size = "medium"
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(value || '');
  const [newCategoryDialogOpen, setNewCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [error, setError] = useState('');

  // Update local state when the parent value changes
  useEffect(() => {
    setSelectedCategory(value);
  }, [value]);

  // Handle category selection
  const handleCategoryChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const categoryValue = event.target.value as string;
    
    if (categoryValue === 'add_new') {
      setNewCategoryDialogOpen(true);
    } else {
      setSelectedCategory(categoryValue);
      onChange(categoryValue);
    }
  };

  // Handle new category creation
  const handleAddNewCategory = () => {
    if (!newCategoryName.trim()) {
      setError('Le nom de la catégorie ne peut pas être vide');
      return;
    }

    if (existingCategories.some(category => category.name === newCategoryName.trim())) {
      setError('Cette catégorie existe déjà');
      return;
    }

    // Set the new category
    const newCategory = newCategoryName.trim();
    setSelectedCategory(newCategory);
    onChange(newCategory);
    
    // Close the dialog and reset
    setNewCategoryDialogOpen(false);
    setNewCategoryName('');
    setError('');
  };

  return (
    <>
      <FormControl required={required} fullWidth={true} margin={margin} size={size}>
        <InputLabel id="category-label">{label}{required ? ' *' : ''}</InputLabel>
        <Select
          labelId="category-label"
          value={selectedCategory}
          onChange={handleCategoryChange as any}
          label={`${label}${required ? ' *' : ''}`}
          startAdornment={<CategoryIcon sx={{ mr: 1, color: 'text.secondary' }} />}
        >
          <MenuItem value="">
            <em>Sélectionner une catégorie</em>
          </MenuItem>
          {existingCategories.map((category) => (
            <MenuItem key={category.id} value={category.name}>
              {category.name}
            </MenuItem>
          ))}
          {/* Option to add a new category */}
          <MenuItem value="add_new" sx={{ color: 'primary.main' }}>
            <AddIcon fontSize="small" sx={{ mr: 1 }} />
            <ListItemText primary="Ajouter une nouvelle catégorie" />
          </MenuItem>
        </Select>
      </FormControl>
      
      {/* Dialog for adding a new category */}
      <Dialog 
        open={newCategoryDialogOpen} 
        onClose={() => {
          setNewCategoryDialogOpen(false);
          setNewCategoryName('');
          setError('');
        }}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CategoryIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">Ajouter une nouvelle catégorie</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nom de la catégorie"
            fullWidth
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            error={!!error}
            helperText={error}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddNewCategory();
              }
            }}
          />
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Les catégories vous aident à organiser vos fragments pour une recherche et une utilisation plus faciles.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setNewCategoryDialogOpen(false);
            setNewCategoryName('');
            setError('');
          }}>
            Annuler
          </Button>
          <Button 
            onClick={handleAddNewCategory} 
            variant="contained" 
            color="primary"
            disabled={!newCategoryName.trim()}
          >
            Ajouter
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CategorySelector;
