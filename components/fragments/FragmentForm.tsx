'use client';

import React, { useState } from 'react';
import { Box, TextField, Button, Alert, Chip, CircularProgress, Typography } from '@mui/material';
import { CategorySelect } from './'; // Import depuis index.ts

interface FragmentFormProps {
  activityId?: number;
  categories: Array<{id: number, name: string}>;
  onSuccess: (fragment: any) => void;
  onCancel: () => void;
  refreshCategories: () => Promise<void>;
}

const FragmentForm: React.FC<FragmentFormProps> = ({ 
  activityId, 
  categories, 
  onSuccess, 
  onCancel,
  refreshCategories 
}) => {
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // État pour gérer la création d'une nouvelle catégorie
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [categoryAddSuccess, setCategoryAddSuccess] = useState(false);
  
  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  // Fonction pour ajouter une nouvelle catégorie
  const handleAddNewCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    setIsAddingCategory(true);
    setCategoryAddSuccess(false);
    
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la création de la catégorie');
      }
      
      const newCategory = await response.json();
      
      // Sélectionner automatiquement la nouvelle catégorie
      setSelectedCategoryIds(prev => [...prev, newCategory.id]);
      
      // Rafraîchir la liste des catégories
      await refreshCategories();
      
      // Afficher un message de succès
      setCategoryAddSuccess(true);
      
      // Réinitialiser après un court délai
      setTimeout(() => {
        setNewCategoryName('');
        setCategoryAddSuccess(false);
        setShowCategoryDialog(false);
      }, 1500);
    } catch (error: any) {
      setError(error.message || 'Erreur lors de la création de la catégorie');
    } finally {
      setIsAddingCategory(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/fragments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          tags,
          categories: selectedCategoryIds,
          activity_id: activityId
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la création du fragment');
      }
      
      const newFragment = await response.json();
      onSuccess(newFragment);
      
      // Réinitialiser le formulaire
      setContent('');
      setTags([]);
      setTagInput('');
      setSelectedCategoryIds([]);
    } catch (error: any) {
      console.error('Error creating fragment:', error);
      setError(error.message || 'Erreur lors de la création du fragment');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Box sx={{ mt: 2 }} component="form" onSubmit={handleSubmit}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      <TextField
        label="Contenu du fragment"
        multiline
        rows={4}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        fullWidth
        required
        sx={{ mb: 3 }}
      />
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Tags (optionnels)
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
          <TextField
            size="small"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="Ajouter un tag"
            sx={{ flexGrow: 1 }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddTag();
              }
            }}
          />
          <Button 
            variant="outlined" 
            size="small"
            onClick={handleAddTag}
            disabled={!tagInput.trim()}
          >
            Ajouter
          </Button>
        </Box>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
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
      
      <CategorySelect 
        selectedCategories={selectedCategoryIds}
        availableCategories={categories}
        onChange={setSelectedCategoryIds}
        refreshCategories={refreshCategories}
      />
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
        <Button 
          variant="outlined" 
          color="secondary"
          onClick={onCancel}
          disabled={loading}
        >
          Annuler
        </Button>
        <Button 
          type="submit" 
          variant="contained" 
          color="primary"
          disabled={loading || !content.trim()}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Création...' : 'Créer fragment'}
        </Button>
      </Box>
    </Box>
  );
};

export default FragmentForm;
