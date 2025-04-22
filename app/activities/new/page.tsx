'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSnackbar } from 'notistack';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  IconButton,
  Divider,
  Chip,
  FormHelperText,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ScienceIcon from '@mui/icons-material/Science';
import Link from 'next/link';
import GradientBackground from '@/components/ui/GradientBackground';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function NewActivityAutrePage() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  
  // Form fields
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [parts, setParts] = useState<{ name: string; points: number }[]>([
    { name: 'Partie 1', points: 10 }
  ]);
  
  // Form state
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  // Calculer le total des points
  const totalPoints = parts.reduce((sum, part) => sum + part.points, 0);
  
  // Fonction pour gérer l'ajout d'une nouvelle partie
  const handleAddPart = () => {
    setParts([...parts, { name: `Partie ${parts.length + 1}`, points: 0 }]);
  };
  
  // Fonction pour gérer la suppression d'une partie
  const handleRemovePart = (index: number) => {
    if (parts.length <= 1) {
      enqueueSnackbar('Vous devez avoir au moins une partie', { variant: 'warning' });
      return;
    }
    const newParts = [...parts];
    newParts.splice(index, 1);
    setParts(newParts);
  };
  
  // Fonction pour gérer les changements de nom d'une partie
  const handlePartNameChange = (index: number, value: string) => {
    const newParts = [...parts];
    newParts[index].name = value;
    setParts(newParts);
  };
  
  // Fonction pour gérer les changements de points d'une partie
  const handlePartPointsChange = (index: number, value: string) => {
    const points = parseInt(value, 10);
    const newParts = [...parts];
    newParts[index].points = isNaN(points) ? 0 : points;
    setParts(newParts);
  };
  
  // Validation du formulaire
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!name.trim()) {
      newErrors.name = 'Le nom de l\'activité est requis';
    }
    
    let hasEmptyPartName = false;
    parts.forEach((part, index) => {
      if (!part.name.trim()) {
        hasEmptyPartName = true;
      }
    });
    
    if (hasEmptyPartName) {
      newErrors.parts = 'Chaque partie doit avoir un nom';
    }
    
    if (totalPoints <= 0) {
      newErrors.totalPoints = 'Le total des points doit être supérieur à 0';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Fonction pour soumettre le formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);
    try {
      const response = await fetch('/api/activities_autres', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          content,
          parts_names: parts.map(part => part.name),
          points: parts.map(part => part.points)
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'ajout de l\'activité');
      }
      
      const data = await response.json();
      enqueueSnackbar('Activité ajoutée avec succès', { variant: 'success' });
      router.push(`/activities/${data.id}`);
    } catch (error) {
      console.error('Erreur:', error);
      enqueueSnackbar(`Erreur: ${(error as Error).message}`, { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="md" className="py-8">
      <Paper elevation={3} className="p-6">
        <GradientBackground 
          variant="primary" 
          sx={{
            borderRadius: 2,
            py: 3,
            px: 3,
            mb: 4
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <IconButton
              color='primary'
              component={Link}
              href="/activities"
              className="mr-2 bg-white/20 hover:bg-white/30"
            >
              <ArrowBackIcon sx={{ fontSize: 30, color: "primary" }} />
            </IconButton>
            <Typography variant="h5" fontWeight={700} color="text.primary">
              Nouvelle activité avec parties dynamiques
            </Typography>
          </Box>
        </GradientBackground>
        
        <form onSubmit={handleSubmit}>
          <Box sx={{ mb: 4 }}>
            <TextField
              label="Nom de l'activité"
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={!!errors.name}
              helperText={errors.name}
              required
              autoFocus
            />
          </Box>
          
          <Box sx={{ mb: 4 }}>
            <TextField
              label="Description de l'activité"
              fullWidth
              multiline
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Décrivez cette activité (objectifs, consignes, etc.)"
            />
          </Box>
          
          <Divider sx={{ my: 3 }}>
            <Chip label="Parties et barème" />
          </Divider>
          
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Définir les parties
                {errors.parts && (
                  <FormHelperText error sx={{ ml: 1 }}>
                    {errors.parts}
                  </FormHelperText>
                )}
              </Typography>
              
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddPart}
                size="small"
              >
                Ajouter une partie
              </Button>
            </Box>
            
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Chaque partie correspond à un élément du barème avec un nombre de points spécifique.
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body1">
                Total des points: <strong>{totalPoints}</strong>
                {errors.totalPoints && (
                  <FormHelperText error sx={{ display: 'inline', ml: 1 }}>
                    {errors.totalPoints}
                  </FormHelperText>
                )}
              </Typography>
            </Box>
            
            <Paper variant="outlined" sx={{ p: 2 }}>
              {parts.map((part, i) => (
                <Box key={i} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <DragIndicatorIcon color="disabled" sx={{ cursor: 'grab' }} />
                  
                  <Box sx={{ flexGrow: 1, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <TextField
                      label={`Nom de la partie ${i + 1}`}
                      value={part.name}
                      onChange={(e) => handlePartNameChange(i, e.target.value)}
                      sx={{ flexGrow: 1, minWidth: '200px' }}
                      required
                    />
                    
                    <TextField
                      label="Points"
                      type="number"
                      value={part.points}
                      onChange={(e) => handlePartPointsChange(i, e.target.value)}
                      slotProps={{
                        input: { 
                          inputProps: { min: 0, step: .5 },
                          startAdornment: i % 2 === 0 
                          ? <MenuBookIcon sx={{ mr: 1, color: 'secondary.main' }} /> 
                          : <ScienceIcon sx={{ mr: 1, color: 'primary.main' }} />,
                         }
                      }}
                      sx={{ width: '150px' }}
                    />
                  </Box>
                  
                  <IconButton
                    onClick={() => handleRemovePart(i)}
                    color="error"
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}
            </Paper>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
            <Button
              variant="outlined"
              component={Link}
              href="/activities"
            >
              Annuler
            </Button>
            <Button
              variant="contained"
              color="primary"
              type="submit"
              disabled={submitting}
            >
              {submitting ? <LoadingSpinner size="sm" /> : 'Ajouter l\'activité'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
}