'use client';

import React, { useState } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Paper, 
  Typography, 
  Chip,
  CircularProgress,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import { Fragment } from '@/lib/types';

interface FragmentEditorProps {
  fragment: Fragment;
  categories?: Array<{id: number, name: string}>;
  onUpdate: (updatedFragment: Fragment) => void;
  onCancel: () => void;
  refreshCategories?: () => Promise<void>;
}

export default function FragmentEditor({ 
  fragment, 
  categories = [],
  onUpdate, 
  onCancel,
  refreshCategories
}: FragmentEditorProps) {
  const [content, setContent] = useState(fragment.content);
  const [tags, setTags] = useState<string[]>(fragment.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // État pour gérer les catégories sélectionnées
  const [selectedCategories, setSelectedCategories] = useState<number[]>(() => {
    // Initialiser les catégories à partir du fragment
    if (fragment.categories) {
      if (Array.isArray(fragment.categories)) {
        // Si c'est déjà un tableau de nombres
        if (fragment.categories.length > 0 && typeof fragment.categories[0] === 'number') {
          return fragment.categories as number[];
        }
        // Si c'est un tableau d'objets
        if (fragment.categories.length > 0 && typeof fragment.categories[0] === 'object') {
          return (fragment.categories as Array<{id: number, name: string}>).map(cat => cat.id);
        }
      }
    }
    return [];
  });

  // Ajouter une méthode directe d'enregistrement qui retourne à l'interface principale
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const updatedFragment = {
        ...fragment,
        content,
        tags,
        categories: selectedCategories
      };

      const response = await fetch(`/api/fragments/${fragment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedFragment),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la mise à jour du fragment');
      }

      const result = await response.json();
      setSuccess(true);
      
      // Notifier le parent que l'opération est réussie
      onUpdate(result);
      
      // Afficher la notification de succès
      setTimeout(() => {
        // Si vous voulez fermer automatiquement
        // onCancel();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleCategoryChange = (event: any) => {
    setSelectedCategories(event.target.value as number[]);
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>      
      <form onSubmit={handleSubmit}>
        <TextField
          label="Contenu"
          multiline
          rows={4}
          value={content}
          onChange={e => setContent(e.target.value)}
          fullWidth
          margin="normal"
          variant="outlined"
          required
        />
        
        {/* Sélection de catégories */}
        <FormControl fullWidth margin="normal">
          <InputLabel id="categories-select-label">Catégories</InputLabel>
          <Select
            labelId="categories-select-label"
            multiple
            value={selectedCategories}
            onChange={handleCategoryChange}
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
        
        <Box sx={{ mt: 2, mb: 1 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Tags (optionnels)
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
            <TextField
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              size="small"
              placeholder="Ajouter un tag"
              sx={{ flexGrow: 1 }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
            />
            <Button 
              onClick={handleAddTag} 
              variant="outlined" 
              size="small"
            >
              Ajouter
            </Button>
          </Box>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {tags.map((tag, index) => (
              <Chip
                key={index}
                label={tag}
                onDelete={() => handleRemoveTag(tag)}
                size="small"
              />
            ))}
          </Box>
        </Box>
        
        <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            color="secondary"
            onClick={onCancel}
            startIcon={<CancelIcon />}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            startIcon={loading ? <CircularProgress size={24} /> : <SaveIcon />}
            disabled={loading}
          >
            Enregistrer
          </Button>
        </Box>
      </form>
      
      <Snackbar 
        open={error !== null} 
        autoHideDuration={6000} 
        onClose={() => setError(null)}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
      
      <Snackbar 
        open={success} 
        autoHideDuration={3000} 
        onClose={() => setSuccess(false)}
      >
        <Alert severity="success" onClose={() => setSuccess(false)}>
          Fragment mis à jour avec succès
        </Alert>
      </Snackbar>
    </Paper>
  );
}
