'use client';
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ActivityAutre } from '@/lib/types';
import { CorrectionAutre } from '@/lib/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import { 
  Button, 
  IconButton, 
  Paper, 
  Typography, 
  TextField, 
  CircularProgress, 
  Container, 
  Tabs, 
  Tab,
  SelectChangeEvent, 
  FormControlLabel, 
  Box, 
  FormHelperText, 
  Switch,
  Chip,
  Divider
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import { useSnackbar } from 'notistack';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import QrCodeIcon from '@mui/icons-material/QrCode';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ScienceIcon from '@mui/icons-material/Science';
import AddIcon from '@mui/icons-material/Add';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import GradientBackground from '@/components/ui/GradientBackground';
import ErrorDisplay from '@/components/ui/ErrorDisplay';

export default function ActivityAutreDetail({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap the params Promise using React.use()
  const unwrappedParams = React.use(params);
  const { id } = unwrappedParams;
  const activityId = id;
  const searchParams = useSearchParams();
  const router = useRouter();

  const [activity, setActivity] = useState<ActivityAutre | null>(null);
  const [corrections, setCorrections] = useState<CorrectionAutre[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { enqueueSnackbar } = useSnackbar();
  
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [parts, setParts] = useState<{ name: string; points: number }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  // Récupérer le tab initial depuis l'URL ou utiliser 0 par défaut
  const initialTabValue = useMemo(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam !== null) {
      const tabIndex = parseInt(tabParam, 10);
      if (!isNaN(tabIndex) && tabIndex >= 0 && tabIndex <= 3) {
        return tabIndex;
      }
    }
    return 0;
  }, [searchParams]);
  
  const [tabValue, setTabValue] = useState(initialTabValue);
  
  // Calculer le total des points
  const totalPoints = parts.reduce((sum, part) => sum + part.points, 0);

  useEffect(() => {
    const fetchActivityAndCorrections = async () => {
      try {
        // Fetch activity details
        const activityResponse = await fetch(`/api/activities_autres/${activityId}`);
        if (!activityResponse.ok) {
          throw new Error('Erreur lors du chargement de l\'activité');
        } 
        const activityData = await activityResponse.json();
        setActivity(activityData);
        setName(activityData.name);
        setContent(activityData.content || '');
        
        // Préparer les parties
        const partsData = activityData.parts_names.map((name: string, index: number) => ({
          name,
          points: activityData.points[index] || 0
        }));
        setParts(partsData);
        
        // Fetch corrections for this activity
        const correctionsResponse = await fetch(`/api/activities_autres/${activityId}/corrections`);
        if (!correctionsResponse.ok) {
          throw new Error('Erreur lors du chargement des corrections');
        }
        const correctionsData = await correctionsResponse.json();
        setCorrections(correctionsData);
      } catch (err) {
        console.error('Erreur:', err);
        setError('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };
    
    fetchActivityAndCorrections();
  }, [activityId]);

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
  
  const handleEditClick = () => {
    setIsEditing(true);
  };
  
  const handleCancelClick = () => {
    setIsEditing(false);
    
    if (activity) {
      setName(activity.name);
      setContent(activity.content || '');
      
      // Réinitialiser les parties
      const partsData = activity.parts_names.map((name, index) => ({
        name,
        points: activity.points[index] || 0
      }));
      setParts(partsData);
    }
    
    setErrors({});
  };
  
  // Fonction pour réinitialiser les erreurs
  const clearError = () => {
    setError('');
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

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/activities_autres/${activityId}`, {
        method: 'PUT',
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
        throw new Error(errorData.error || 'Erreur lors de la mise à jour de l\'activité');
      }
      
      const updatedActivity = await response.json();
      setActivity(updatedActivity);
      setIsEditing(false);
      enqueueSnackbar('Activité mise à jour avec succès', { variant: 'success' });
    } catch (error) {
      console.error('Erreur:', error);
      enqueueSnackbar(`Erreur: ${(error as Error).message}`, { variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteClick = () => {
    setConfirmingDelete(true);
  };
  
  const handleCancelDelete = () => {
    setConfirmingDelete(false);
  };
  
  const handleConfirmDelete = async () => {
    try {
      const response = await fetch(`/api/activities_autres/${activityId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la suppression de l\'activité');
      }
      
      enqueueSnackbar('Activité supprimée avec succès', { variant: 'success' });
      router.push('/activities_autres');
    } catch (err) {
      console.error('Erreur:', err);
      setError(`Erreur lors de la suppression de l'activité: ${(err as Error).message}`);
      enqueueSnackbar(`Erreur lors de la suppression de l'activité: ${(err as Error).message}`, { 
        variant: 'error' 
      });
      setConfirmingDelete(false);
    }
  };
  
  const handleNewCorrectionClick = () => {
    router.push(`/activities_autres/${activityId}/corrections/`);
  };
  
  // Modifier la fonction handleTabChange pour mettre à jour l'URL
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    
    // Mettre à jour l'URL avec le nouveau tab
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', newValue.toString());
    
    // Utiliser router.replace pour éviter d'ajouter une entrée dans l'historique
    router.replace(`/activities_autres/${activityId}?${params.toString()}`, { scroll: false });
  };

  // Composant pour afficher les parties de l'activité (utilisé en mode lecture)
  const renderParts = () => {
    if (!activity || !activity.parts_names || !activity.points) {
      return <Typography variant="body2">Aucune partie définie</Typography>;
    }
    
    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          Barème ({totalPoints} points au total)
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {activity.parts_names.map((name, index) => (
            <Chip
              key={index}
              icon={index % 2 === 0 ? <MenuBookIcon /> : <ScienceIcon />}
              label={`${name}: ${activity.points[index]} points`}
              color={index % 2 === 0 ? "primary" : "secondary"}
              variant="outlined"
              sx={{ maxWidth: 'fit-content' }}
            />
          ))}
        </Box>
      </Box>
    );
  };

  if (loading) {
    return (
      <div className="container max-w-[400px] mx-auto px-4 py-8 flex justify-center">
        <LoadingSpinner size="lg" text="Chargement de l'activité" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <div className="w-full max-w-lg animate-slide-in">
          <Paper className="p-6 overflow-hidden relative" elevation={3}>
            <ErrorDisplay 
              error={error} 
              onRefresh={clearError}
              withRefreshButton={true}
            />
          </Paper>
        </div>
      </div>
    );
  }
  
  if (!activity) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4">
          Activité non trouvée
        </div>
      </div>
    );
  }
  
  return (
    <Container maxWidth="md" className="py-8">
      <Paper elevation={2} className="p-6">
        <GradientBackground 
          variant="primary" 
          sx={{
            mt: 4,
            borderRadius: 2,
            py: 3,
            px: 3
          }}
        >
          {isEditing ? (
            <div className="flex items-center w-full">
              <IconButton
                color='primary'
                component={Link}
                href="/activities_autres"
                className="mr-2 bg-white/20 hover:bg-white/30"
                sx={{ transform: 'translateX(-10px)' }}
              >
                <ArrowBackIcon sx={{ fontSize: 30, padding: 0, color: "primary" }} />
              </IconButton>
              <TextField
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-grow mr-2"
                variant="outlined"
                size="small"
                label="Nom de l'activité"
                placeholder="Entrez le nom de l'activité"
                error={!!errors.name}
                helperText={errors.name}
                autoFocus
              />
              <div className="flex space-x-2">
                <IconButton
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  title="Sauvegarder les modifications"
                  size="medium"
                  color="success"
                >
                  {isSubmitting ? <CircularProgress size={24} /> : <SaveIcon />}
                </IconButton>
                <IconButton
                  onClick={handleCancelClick}
                  color="error"
                  title="Annuler les modifications"
                  size="medium"
                >
                  <CloseIcon />
                </IconButton>
              </div>
            </div>
          ) : (
            <div className="flex items-center w-full">
              <IconButton
                color='primary'
                component={Link}
                href="/activities_autres"
                className="mr-2 bg-white/20 hover:bg-white/30"
                sx={{ transform: 'translateX(-10px)' }}
              >
                <ArrowBackIcon sx={{ fontSize: 30, padding: 0, color: "primary" }} />
              </IconButton>
              <Typography variant="h5" fontWeight={700} color="text.primary" className="font-bold" sx={{ transform: 'translateX(-10px)' }}>
                {activity.name}
                <IconButton
                  onClick={handleEditClick}
                  size="small"
                  color="primary"
                  aria-label="edit"
                >
                  <EditIcon className="ml-2" sx={{color: "secondary.light" }} />
                </IconButton>
                {confirmingDelete ? (
                  <>
                    <IconButton
                      onClick={handleCancelDelete}
                      color="inherit"
                      size="medium"
                      title="Annuler la suppression"
                    >
                      <CloseIcon />
                    </IconButton>
                    <IconButton
                      onClick={handleConfirmDelete}
                      color="success"
                      size="medium"
                      title="Confirmer la suppression"
                    >
                      <CheckIcon />
                    </IconButton>
                  </>
                ) : (
                  <IconButton
                    onClick={handleDeleteClick}
                    color="error"
                    size="medium"
                    title="Supprimer cette activité"
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
              </Typography>
            </div>
          )}
        </GradientBackground>
        
        <Box sx={{ mt: 4 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Détails" />
            <Tab label="Corrections" />
            <Tab label="Statistiques" />
          </Tabs>
        </Box>
        
        {/* Tab Content */}
        <Box sx={{ mt: 3, p: 2 }}>
          {/* Premier onglet: détails de l'activité */}
          {tabValue === 0 && (
            <div>
              {isEditing ? (
                <div>
                  <Box sx={{ mb: 4 }}>
                    <TextField
                      label="Description"
                      fullWidth
                      multiline
                      rows={4}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                    />
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Parties et points
                      {errors.totalPoints && (
                        <FormHelperText error sx={{ ml: 1, display: 'inline' }}>
                          {errors.totalPoints}
                        </FormHelperText>
                      )}
                    </Typography>
                    {errors.parts && (
                      <FormHelperText error>{errors.parts}</FormHelperText>
                    )}
                    
                    <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body1">
                        Total des points: <strong>{totalPoints}</strong>
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={handleAddPart}
                        sx={{ ml: 2 }}
                      >
                        Ajouter une partie
                      </Button>
                    </Box>
                    
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      {parts.map((part, index) => (
                        <Box key={index} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                          <DragIndicatorIcon color="disabled" sx={{ cursor: 'grab' }} />
                          
                          <Box sx={{ flexGrow: 1, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            <TextField
                              label={`Nom de la partie ${index + 1}`}
                              value={part.name}
                              onChange={(e) => handlePartNameChange(index, e.target.value)}
                              sx={{ flexGrow: 1, minWidth: '200px' }}
                              required
                            />
                            
                            <TextField
                              label="Points"
                              type="number"
                              value={part.points}
                              onChange={(e) => handlePartPointsChange(index, e.target.value)}
                              InputProps={{
                                startAdornment: index % 2 === 0 ? <MenuBookIcon sx={{ mr: 1, color: 'secondary.main' }} /> : <ScienceIcon sx={{ mr: 1, color: 'primary.main' }} />,
                              }}
                              sx={{ width: '150px' }}
                              inputProps={{ min: 0, step: 1 }}
                            />
                          </Box>
                          
                          <IconButton
                            onClick={() => handleRemovePart(index)}
                            color="error"
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                          
                          {index < parts.length - 1 && <Divider />}
                        </Box>
                      ))}
                    </Paper>
                  </Box>
                </div>
              ) : (
                <div>
                  <Typography variant="h6" gutterBottom>
                    Description
                  </Typography>
                  <Typography variant="body1" >
                    {activity.content || "Aucune description disponible."}
                  </Typography>
                  
                  {renderParts()}
                </div>
              )}
            </div>
          )}
          
          {/* Deuxième onglet: corrections */}
          {tabValue === 1 && (
            <div>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Corrections ({corrections.length})
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={handleNewCorrectionClick}
                >
                  Nouvelle correction
                </Button>
              </Box>
              
              {corrections.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center', mb: 2 }}>
                  <Typography variant="body1" >
                    Aucune correction n'a été créée pour cette activité.
                  </Typography>
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={handleNewCorrectionClick}
                  >
                    Créer une correction
                  </Button>
                </Paper>
              ) : (
                <Paper variant="outlined" sx={{ mb: 2 }}>
                  {corrections.map((correction, index) => (
                    <Box key={correction.id} sx={{ 
                      p: 2, 
                      borderBottom: index < corrections.length - 1 ? '1px solid rgba(0,0,0,0.12)' : 'none',
                      backgroundColor: correction.active === 0 ? 'rgba(0,0,0,0.04)' : 'transparent'
                    }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {correction.student_id ? `Correction pour l'étudiant #${correction.student_id}` : 'Correction sans étudiant assigné'}
                          {correction.active === 0 && (
                            <Chip 
                              size="small" 
                              color="error" 
                              label="Inactive" 
                              sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                            />
                          )}
                        </Typography>
                        <Typography variant="h6" color="primary">
                          {correction.grade ? `${correction.grade}/20` : 'Non noté'}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {Array.isArray(correction.points_earned) && activity.parts_names.map((name, idx) => (
                          <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2">
                              {name}:
                            </Typography>
                            <Typography variant="body2" fontWeight="medium">
                              {correction.points_earned[idx]} / {activity.points[idx]} pts
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                      
                      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          component={Link}
                          href={`/corrections_autres/${correction.id}`}
                        >
                          Voir les détails
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="primary"
                          component={Link}
                          href={`/corrections_autres/${correction.id}/edit`}
                        >
                          Modifier
                        </Button>
                      </Box>
                    </Box>
                  ))}
                </Paper>
              )}
            </div>
          )}
          
          {/* Troisième onglet: statistiques */}
          {tabValue === 2 && (
            <div>
              <Typography variant="h6" gutterBottom>
                Statistiques
              </Typography>
              
              <Box sx={{ mb: 4 }}>
                <Typography variant="body1" >
                  Nombre de corrections: <strong>{corrections.length}</strong>
                </Typography>
                
                <Typography variant="body1" >
                  Nombre de corrections actives: <strong>{corrections.filter(c => c.active !== 0).length}</strong>
                </Typography>
                
                <Typography variant="body1" >
                  Note moyenne: <strong>
                    {corrections.length > 0
                      ? (corrections.reduce((sum, c) => sum + (c.grade || 0), 0) / corrections.length).toFixed(2)
                      : 'N/A'}
                  </strong>
                </Typography>
              </Box>
              
              {/* Répartition des points par partie */}
              <Typography variant="subtitle1" gutterBottom>
                Points moyens par partie:
              </Typography>
              
              {activity.parts_names.map((name, idx) => {
                const maxPoints = activity.points[idx];
                const avgPoints = corrections.length > 0
                  ? corrections.reduce((sum, c) => {
                      const pts = Array.isArray(c.points_earned) && c.points_earned[idx] !== undefined
                        ? c.points_earned[idx]
                        : 0;
                      return sum + pts;
                    }, 0) / corrections.length
                  : 0;
                
                const percentage = maxPoints > 0 ? (avgPoints / maxPoints) * 100 : 0;
                
                return (
                  <Box key={idx} sx={{ mb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">{name}</Typography>
                      <Typography variant="body2">
                        {avgPoints.toFixed(2)} / {maxPoints} pts ({percentage.toFixed(1)}%)
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        width: '100%',
                        height: 10,
                        bgcolor: 'grey.200',
                        borderRadius: 5,
                        overflow: 'hidden'
                      }}
                    >
                      <Box
                        sx={{
                          width: `${percentage}%`,
                          height: '100%',
                          bgcolor: idx % 2 === 0 ? 'primary.main' : 'secondary.main',
                        }}
                      />
                    </Box>
                  </Box>
                );
              })}
            </div>
          )}
        </Box>
      </Paper>
    </Container>
  );
}