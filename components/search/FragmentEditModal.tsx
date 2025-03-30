'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  TextField,
  Button,
  IconButton,
  Typography,
  CircularProgress,
  Alert,
  alpha,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  useTheme
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useSearchContext, Fragment, Category } from './SearchContext';

interface EditFragmentFormProps {
  fragment: Fragment;
  categories: Category[];
  onSuccess: (updatedFragment: Fragment) => void;
  onCancel: () => void;
}

function EditFragmentForm({ fragment, categories, onSuccess, onCancel }: EditFragmentFormProps) {
  const [content, setContent] = useState(fragment.content || '');
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Improved initial category loading with separate API call
  useEffect(() => {
    const fetchFragmentDetails = async () => {
      setIsLoading(true);
      try {
        // Load complete fragment details
        const response = await fetch(`/api/fragments/${fragment.id}`);
        if (response.ok) {
          const data = await response.json();
          setContent(data.content || fragment.content);
          
          // Extract category IDs with better handling
          let categoryIds: number[] = [];
          
          if (data.categories) {
            if (Array.isArray(data.categories)) {
              categoryIds = data.categories.map((cat: any) => 
                typeof cat === 'object' && cat !== null && 'id' in cat ? cat.id : 
                typeof cat === 'number' ? cat : 
                null
              ).filter(Boolean);
            }
          } else if (data.category_id) {
            categoryIds = [data.category_id];
          }
          
          console.log('Loaded fragment categories:', categoryIds);
          setSelectedCategories(categoryIds);
        } else {
          // Fallback handling
          let categoryIds: number[] = [];
          
          if (fragment.categories) {
            if (Array.isArray(fragment.categories)) {
              categoryIds = fragment.categories.map((cat: any) => 
                typeof cat === 'object' && cat !== null && 'id' in cat ? cat.id : 
                typeof cat === 'number' ? cat : 
                null
              ).filter(Boolean);
            }
          } else if (fragment.category_id) {
            categoryIds = [fragment.category_id];
          }
          
          setSelectedCategories(categoryIds);
        }
      } catch (err) {
        console.error('Error loading fragment details:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFragmentDetails();
  }, [fragment.id]);
  
  const handleCategoryChange = (newCategories: number[]) => {
    setSelectedCategories(newCategories);
  };
  
  const handleSave = async () => {
    if (!content.trim()) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/fragments`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          id: fragment.id,
          content: content,
          categories: selectedCategories
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save fragment');
      }
      
      const updatedFragment = await response.json();
      
      const formattedCategories = selectedCategories.length > 0 
        ? selectedCategories.map(id => {
            const cat = categories.find(c => c.id === id);
            return cat ? { id: cat.id, name: cat.name } : { id, name: `Category ${id}` };
          })
        : [];
      
      const formattedFragment = {
        ...updatedFragment,
        categories: formattedCategories
      };
      
      onSuccess(formattedFragment);
    } catch (error: any) {
      console.error('Error saving fragment:', error);
      setError(error.message || 'Error saving fragment');
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress size={24} />
          <Typography sx={{ ml: 2 }}>Chargement des détails du fragment...</Typography>
        </Box>
      ) : (
        <>
          <TextField
            label="Contenu"
            multiline
            rows={6}
            fullWidth
            value={content}
            onChange={(e) => setContent(e.target.value)}
            variant="outlined"
            sx={{ mb: 3 }}
          />
          
          <CategorySelect 
            categories={categories} 
            selectedCategories={selectedCategories}
            onChange={handleCategoryChange} 
          />
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, gap: 2 }}>
            <Button 
              onClick={onCancel}
              variant="outlined"
              color="warning"
              disabled={isSaving}
            >
              Annuler
            </Button>
            <Button 
              onClick={handleSave}
              variant="contained" 
              color="primary"
              disabled={isSaving || !content.trim()}
              startIcon={isSaving ? <CircularProgress size={20} /> : null}
            >
              {isSaving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
}

interface CategorySelectProps {
  categories: Category[];
  selectedCategories: number[];
  onChange: (categories: number[]) => void;
}

function CategorySelect({ categories, selectedCategories, onChange }: CategorySelectProps) {
  return (
    <FormControl fullWidth>
      <InputLabel id="category-select-label">Catégories</InputLabel>
      <Select
        labelId="category-select-label"
        multiple
        value={selectedCategories}
        onChange={(e) => onChange(e.target.value as number[])}
        renderValue={(selected) => (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {selected.map((value) => {
              const category = categories.find(cat => cat.id === value);
              return (
                <Chip 
                  key={value} 
                  label={category ? category.name : `ID:${value}`} 
                  size="small" 
                />
              );
            })}
          </Box>
        )}
      >
        {categories.map((category) => (
          <MenuItem key={category.id} value={category.id}>
            {category.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

export default function FragmentEditModal() {
  const theme = useTheme();
  const { 
    editModalOpen, 
    editingFragment, 
    editingSuccess, 
    categories,
    handleCloseEditModal,
    handleEditSuccess
  } = useSearchContext();

  return (
    <Dialog
      open={editModalOpen}
      onClose={handleCloseEditModal}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.2)}`
        }
      }}
    >
      <DialogTitle component={"h2"} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Modifier le fragment
        <IconButton edge="end" color="inherit" onClick={handleCloseEditModal} aria-label="close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {editingFragment && (
          <Box sx={{ pt: 2 }}>
            {editingSuccess ? (
              <Alert severity="success" sx={{ mb: 2 }}>
                Fragment mis à jour avec succès!
              </Alert>
            ) : (
              <EditFragmentForm 
                fragment={editingFragment} 
                categories={categories}
                onSuccess={handleEditSuccess}
                onCancel={handleCloseEditModal}
              />
            )}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
