import React, { useState } from 'react';
import { 
  Box, Typography, TextField, Button, Paper, 
  CircularProgress, Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import InfoIcon from '@mui/icons-material/Info';
import CategorySelect from '@/components/fragments/CategorySelect';
import { Fragment } from '@/lib/types';
import { createFragment } from '@/lib/services/fragmentService';

interface FragmentFormProps {
  activityId?: number;
  categories: Array<{id: number, name: string}>;
  // Modification du type pour rendre 'category' optionnel dans le type Fragment
  onSuccess: (fragment: any) => void; // Utilisez 'any' pour contourner l'incompatibilité temporairement
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
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() || !activityId) {
      setError('Le contenu et l\'activité sont requis');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const newFragment = await createFragment(activityId, content, selectedCategories);
      
      // Format categories as objects for display
      const formattedCategories = selectedCategories.map(id => {
        const cat = categories.find(c => c.id === id);
        return cat ? { id: cat.id, name: cat.name } : { id, name: `Category ${id}` };
      });
      
      const formattedFragment = {
        ...newFragment,
        categories: formattedCategories
      };
      
      // Call success callback
      onSuccess(formattedFragment);
      
      // Reset form
      setContent('');
      setSelectedCategories([]);
      
    } catch (error: any) {
      console.error('Error creating fragment:', error);
      setError(error.message || 'Erreur lors de la création du fragment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCategoryChange = (newCategories: number[]) => {
    setSelectedCategories(newCategories);
  };

  return (
    <Paper variant="outlined" sx={{ p: 3, mt: 3 }}>
      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
        Ajouter un nouveau fragment
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      <form onSubmit={handleSubmit}>
        <Box sx={{ mb: 2 }}>
          <TextField
            value={content}
            onChange={(e) => setContent(e.target.value)}
            fullWidth
            multiline
            rows={4}
            placeholder="Contenu du nouveau fragment..."
            variant="outlined"
            required
            size="small"
            // Mise à jour des styles avec slotProps au lieu de InputProps
            slotProps={{
              input: {
                style: {
                  backgroundColor: 'background.paper',
                }
              }
            }}
            sx={{
              backgroundColor: 'background.paper',
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'background.paper',
                '&:hover, &.Mui-focused': {
                  backgroundColor: 'background.default',
                }
              }
            }}
          />
        </Box>

        <CategorySelect
          selectedCategories={selectedCategories}
          availableCategories={categories}
          onChange={handleCategoryChange}
          refreshCategories={refreshCategories}
        />

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              variant="outlined" 
              color="warning" 
              onClick={onCancel}
              disabled={isSubmitting}
            >
              <b>Annuler</b>
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              variant="contained"
              color="success"
              startIcon={isSubmitting ? <CircularProgress size={20} /> : <AddIcon />}
            >
              <b>{isSubmitting ? 'Ajout ...' : 'Ajouter'}</b>
            </Button>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', mt: 2 }}>
            <InfoIcon fontSize="small" sx={{ mr: 0.5 }} />
            <Typography variant="caption">
              Ce fragment sera disponible pour l'activité actuelle
            </Typography>
          </Box>
      </form>
    </Paper>
  );
};

export default FragmentForm;
