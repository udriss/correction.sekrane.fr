'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  FormHelperText,
  Typography,
  Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import CategorySelector from '@/components/CategorySelector';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorDisplay from '@/components/ui/ErrorDisplay';
import { Fragment } from '@/lib/types';

interface Activity {
  id: number;
  name: string;
}


interface FragmentEditModalProps {
  open: boolean;
  onClose: () => void;
  fragment?: Fragment | null;
  activityId?: number | null;
  onSave: (fragment: Fragment) => Promise<void>;
  categories: Array<{id: number, name: string}>;
  activities: Activity[];
}

const FragmentEditModal: React.FC<FragmentEditModalProps> = ({
  open,
  onClose,
  fragment,
  activityId: defaultActivityId,
  onSave,
  categories,
  activities,
}) => {
  // Form state
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [activityId, setActivityId] = useState<number | null>(null);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorDetails, setErrorDetails] = useState<any>(null);
  const [success, setSuccess] = useState('');
  
  // Initialize form data when fragment or modal opens
  useEffect(() => {
    if (fragment) {
      setContent(fragment.content || '');
      setCategory(fragment.category || '');
      setTags(fragment.tags || []);
      setActivityId(fragment.activity_id || null);
    } else {
      // For new fragment
      setContent('');
      setCategory('');
      setTags([]);
      setActivityId(defaultActivityId || null);
    }
    
    // Reset state when modal opens
    setError('');
    setErrorDetails(null);
    setSuccess('');
  }, [fragment, defaultActivityId, open]);
  
  // Fonction pour réinitialiser les erreurs
  const clearError = () => {
    setError('');
    setErrorDetails(null);
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!content.trim()) {
      setError('Le contenu du fragment est requis');
      setErrorDetails({
        code: 'VALIDATION_ERROR',
        field: 'content',
        validationErrors: [{ field: 'content', message: 'Le contenu est requis' }]
      });
      return;
    }
    
    if (!category.trim()) {
      setError('La catégorie est requise');
      setErrorDetails({
        code: 'VALIDATION_ERROR',
        field: 'category',
        validationErrors: [{ field: 'category', message: 'La catégorie est requise' }]
      });
      return;
    }
    
    setLoading(true);
    clearError();
    
    try {
      // Create fragment object with updated data
      const updatedFragment: Fragment = {
        id: fragment?.id || 0,
        content,
        tags,
        activity_id: activityId,
        categories: categories.filter(cat => cat.name === category) // Utiliser la catégorie sélectionnée
      };
      
      // Call the onSave function passed by the parent
      await onSave(updatedFragment);
      
      setSuccess('Fragment enregistré avec succès');
      
      // Close modal after a delay on success
      setTimeout(() => {
        onClose();
      }, 1000);
      
    } catch (err: any) {
      console.error('Error saving fragment:', err);
      
      // Gestion standardisée des erreurs
      if (err.details) {
        // Si l'erreur contient déjà des détails structurés
        setError(err.message || 'Erreur lors de l\'enregistrement du fragment');
        setErrorDetails(err.details);
      } else {
        // Erreur standard
        setError((err as Error).message || 'Erreur lors de l\'enregistrement du fragment');
        setErrorDetails({
          code: 'SAVE_ERROR',
          message: err.message || 'Une erreur s\'est produite lors de l\'enregistrement du fragment'
        });
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Handle adding a tag
  const handleAddTag = () => {
    if (!newTag.trim() || tags.includes(newTag.trim())) return;
    setTags([...tags, newTag.trim()]);
    setNewTag('');
  };
  
  // Handle removing a tag
  const handleDeleteTag = (tagToDelete: string) => {
    setTags(tags.filter(tag => tag !== tagToDelete));
  };
  
  return (
    <Dialog 
      open={open} 
      onClose={loading ? undefined : onClose}
      fullWidth
      maxWidth="md"
      scroll="paper"
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {fragment ? 'Modifier le fragment' : 'Nouveau fragment'}
        <IconButton onClick={onClose} disabled={loading}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        <form id="fragment-form" onSubmit={handleSubmit}>
          {error && (
            <ErrorDisplay 
              error={error}
              errorDetails={errorDetails}
              onRefresh={() => {
                setError('');
                window.location.reload();
              }}
              withRefreshButton={true}
            />
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}
          
          <TextField
            label="Contenu du fragment"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            fullWidth
            multiline
            rows={4}
            required
            margin="normal"
            variant="outlined"
            helperText="Entrez le texte de votre fragment (maximum 500 caractères)"
            slotProps={{
              input: { 
                inputProps: { maxLength: 500 }
              }
            }}
            disabled={loading}
            error={!!errorDetails?.validationErrors?.some((err: any) => err.field === 'content')}
          />
          
          <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
            <CategorySelector
              value={category}
              onChange={setCategory}
              existingCategories={categories}
              required
              label="Catégorie"
              margin="normal"
              size="medium"
            />
            
            <FormControl fullWidth margin="normal">
              <InputLabel id="activity-label">Activité (optionnel)</InputLabel>
              <Select
                labelId="activity-label"
                value={activityId || ''}
                onChange={(e) => setActivityId(e.target.value === '' ? null : Number(e.target.value))}
                label="Activité (optionnel)"
                disabled={defaultActivityId !== null || loading}
              >
                <MenuItem value="">
                  <em>Aucune (fragment général)</em>
                </MenuItem>
                {activities.map(activity => (
                  <MenuItem key={activity.id} value={activity.id}>
                    {activity.name}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                {defaultActivityId !== null 
                  ? "Activité définie par le contexte" 
                  : "Associer le fragment à une activité spécifique (optionnel)"}
              </FormHelperText>
            </FormControl>
          </Box>
          
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Tags (optionnels)
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <TextField
                label="Ajouter un tag"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                size="small"
                variant="outlined"
                sx={{ flexGrow: 1 }}
                disabled={loading}
              />
              <Button
                variant="outlined"
                onClick={handleAddTag}
                startIcon={<AddIcon />}
                disabled={loading || !newTag.trim() || tags.includes(newTag.trim())}
              >
                Ajouter
              </Button>
            </Box>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {tags.map(tag => (
                <Chip
                  key={tag}
                  label={tag}
                  onDelete={loading ? undefined : () => handleDeleteTag(tag)}
                  size="small"
                />
              ))}
            </Box>
          </Box>
        </form>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          onClick={onClose}
          disabled={loading}
          variant="outlined"
        >
          Annuler
        </Button>
        <Button
          type="submit"
          form="fragment-form"
          variant="contained"
          color="primary"
          disabled={loading || !content.trim() || !category.trim()}
        >
          {loading ? <LoadingSpinner size="sm" hideText /> : <SaveIcon />}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FragmentEditModal;
