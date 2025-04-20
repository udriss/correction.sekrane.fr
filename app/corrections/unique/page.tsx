'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Typography,
  Paper,
  Box,
  Button,
  Alert,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  SelectChangeEvent,
} from '@mui/material';


import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BarChartIcon from '@mui/icons-material/BarChart';
import ArticleIcon from '@mui/icons-material/Article';
import AddIcon from '@mui/icons-material/Add';
import EditNoteIcon from '@mui/icons-material/EditNote';
import Link from 'next/link';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PublishedWithChangesIcon from '@mui/icons-material/PublishedWithChanges';

import { ActivityAutre } from '@/lib/types';
import LoadingSpinner from '@/components/LoadingSpinner';
// Importation du formulaire adapté aux corrections de type "Autre"
import SingleCorrectionFormAutre from '@/components/SingleCorrectionFormAutre';
import GradientBackground from '@/components/ui/GradientBackground';
import PatternBackground from '@/components/ui/PatternBackground';
import ErrorDisplay from '@/components/ui/ErrorDisplay';

export default function UniqueCorrection() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activityId = searchParams?.get('activityId') || "0";
  
  // Activity and points states
  const [activity, setActivity] = useState<ActivityAutre | null>(null);
  
  // UI states
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>('');

  // États pour les activités disponibles
  const [allActivities, setAllActivities] = useState<ActivityAutre[]>([]);
  const [genericActivities, setGenericActivities] = useState<ActivityAutre[]>([]);
  const [selectedActivityId, setSelectedActivityId] = useState<string>(activityId);
  
  // Ajout d'un état pour l'activité générique
  const [genericActivityId, setGenericActivityId] = useState<number | null>(null);

  useEffect(() => {
    // Charger toutes les activités disponibles
    fetchAllActivities();
    
    // Si aucun activityId n'est fourni, ne pas charger automatiquement une activité générique
    if (activityId && activityId !== "0") {
      fetchActivity();
    } else {
      setLoading(false); // Ne pas montrer le chargement si pas d'activité sélectionnée
    }
  }, [activityId]);

  // Fetch all available activities for the dropdown
  const fetchAllActivities = async () => {
    try {
      const response = await fetch('/api/activities_autres');
      if (!response.ok) {
        const errorData = await response.json();
        // Créer une instance d'Error et y attacher les détails
        const error = new Error('Erreur lors du chargement des activités : ' + (errorData.error || 'Erreur lors du chargement des activités disponibles'));
        (error as any).details = errorData.details || {};
        setError(error.message);
        throw error;
      }
      
      const activitiesData = await response.json();
      
      // Séparer les activités génériques des activités normales
      const generic = activitiesData.filter((act: ActivityAutre) => act.name.includes('Activité générique'));
      const regular = activitiesData.filter((act: ActivityAutre) => !act.name.includes('Activité générique'));
      
      setAllActivities(regular);
      setGenericActivities(generic);
    } catch (err) {
      console.error('Erreur:', err);
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const fetchActivity = async () => {
    if (!activityId || activityId === "0") return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/activities_autres/${activityId}`);
      if (!response.ok) {
        const errorData = await response.json();
        // Créer une instance d'Error et y attacher les détails
        const error = new Error('Erreur lors du chargement de l\'activité : ' + (errorData.error || 'Erreur lors du chargement de l\'activité'));
        (error as any).details = errorData.details || {};
        setError(error.message);
        throw error;
      }
      
      const activityData: ActivityAutre = await response.json();
      setActivity(activityData);
    } catch (err) {
      console.error('Erreur:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  // Handle activity selection change
  const handleActivityChange = async (event: SelectChangeEvent<string>) => {
    const newActivityId = event.target.value;
    setSelectedActivityId(newActivityId);
    
    if (newActivityId === "0") {
      setActivity(null);
    } else {
      try {
        setLoading(true);
        const response = await fetch(`/api/activities_autres/${newActivityId}`);
        if (!response.ok) {
          const errorData = await response.json();
          // Créer une instance d'Error et y attacher les détails
          const error = new Error('Erreur lors du chargement de l\'activité : ' + (errorData.error || 'Échec du chargement de l\'activité'));
          (error as any).details = errorData.details || {};
          setError(error.message);
          throw error;
        }
        
        const activityData = await response.json();
        setActivity(activityData);
        
        // Update the URL without full refresh
        router.push(`/corrections/unique?activityId=${newActivityId}`, { scroll: false });
      } catch (err) {
        console.error('Erreur:', err);
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    }
  };

  // Fonction pour chercher ou créer une activité générique
  const fetchOrCreateGenericActivity = async () => {
    try {
      setLoading(true);
      // Chercher une activité générique existante
      const response = await fetch('/api/activities_autres/generic');
      
      if (response.ok) {
        const activityData = await response.json();
        setActivity(activityData);
        setGenericActivityId(activityData.id);
        
        // D'abord rafraîchir la liste des activités
        await fetchAllActivities();
        
        // Ensuite seulement, mettre à jour l'ID sélectionné
        setSelectedActivityId(activityData.id.toString());
        
        // Update the URL without full refresh
        router.push(`/corrections/unique?activityId=${activityData.id}`, { scroll: false });
      } else {
        const errorData = await response.json();
        
        // Si c'est une erreur 404, c'est normal (pas d'activité générique trouvée)
        // On va alors en créer une nouvelle
        if (response.status === 404) {
          // Si aucune activité générique n'existe, en ajouter une nouvelle
          const createResponse = await fetch('/api/activities_autres', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: 'Activité générique',
              content: 'Activité pour les corrections sans activité spécifique',
              points: [5, 5, 5, 5]
            }),
          });
          
          if (!createResponse.ok) {
            const createErrorData = await createResponse.json();
            // Créer une instance d'Error et y attacher les détails
            const error = new Error('Erreur lors de la création d\'une activité générique : ' + (createErrorData.error || 'Échec de création'));
            (error as any).details = createErrorData.details || {};
            setError(error.message);
            throw error;
          }
          
          const newActivity = await createResponse.json();
          setActivity(newActivity);
          setGenericActivityId(newActivity.id);
          
          // D'abord rafraîchir la liste des activités
          await fetchAllActivities();
          
          // Ensuite seulement, mettre à jour l'ID sélectionné
          setSelectedActivityId(newActivity.id.toString());
          
          // Update the URL without full refresh
          router.push(`/corrections/unique?activityId=${newActivity.id}`, { scroll: false });
        } else {
          // Créer une instance d'Error et y attacher les détails
          const error = new Error('Erreur lors de la recherche d\'une activité générique : ' + (errorData.error || 'Échec de la recherche'));
          (error as any).details = errorData.details || {};
          setError(error.message);
          throw error;
        }
      }
    } catch (err) {
      console.error('Erreur:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  // Handle successful correction creation
  const handleSuccessfulCreateCorrection = (createdCorrectionId: string) => {
    if (createdCorrectionId) {
      setSuccessMessage(`Correction ajoutée avec succès`);
      
      // Redirect to the correction page after successful creation
      setTimeout(() => {
        router.push(`/corrections/${createdCorrectionId}`);
      }, 2000);
    }
  };

  if (loading) {
    return (
      <div className="container max-w-[400px] mx-auto px-4 py-8 flex justify-center">
        <LoadingSpinner size="lg" text="Chargement des données " />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header with modern design and gradient */}
      <Paper 
        elevation={3}
        className="mb-8 rounded-lg overflow-hidden"
      >
        <Box sx={{ position: 'relative' }}>
          <GradientBackground variant="primary" sx={{ position: 'relative', zIndex: 1, p: { xs: 3, sm: 4 } }}>
            <PatternBackground 
              pattern='dots'
              opacity={0.3}
              sx={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                right: 0, 
                bottom: 0, 
                zIndex: -1 
              }}
            />
            
            {/* Header content */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Box 
                sx={{ 
                  background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  p: 1.5, 
                  borderRadius: '50%',
                  display: 'flex',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                }}
              >
                <EditNoteIcon sx={{ fontSize: 50, color: (theme) => theme.palette.text.primary }} />
              </Box>
              
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h4" fontWeight={700} color="text.primary">
                  Nouvelle correction (format autre)
                </Typography>
                <Typography color='text.secondary' variant="subtitle1" sx={{ opacity: 0.9, mb: 1 }}>
                  Sélectionnez une activité ou ajoutez-en une nouvelle
                </Typography>
              </Box>
              
              <Button 
                component={Link} 
                href="/corrections/new"
                variant="contained"
                color='secondary'
                startIcon={<ArrowBackIcon />}
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)', 
                  color: theme => theme.palette.text.primary,
                  backdropFilter: 'blur(10px)',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.3)',
                  },
                  fontWeight: 600,
                  py: 1,
                  px: 2,
                  borderRadius: 2,
                  boxShadow: '0 4px 15px rgba(0,0,0,0.15)'
                }}
              >
                Retour
              </Button>
            </Box>
          </GradientBackground>
        </Box>
      </Paper>

      {/* Activity Selection Section */}
      <Paper className="p-6 rounded-lg mb-6 shadow-md border-t-4 border-green-600">
        <div className="flex items-center gap-2 mb-4">
          <ArticleIcon className="text-green-600" fontSize="large" />
          <Typography variant="h5" className="font-bold">
            Sélection d'activité
          </Typography>
        </div>
        
        <Grid container spacing={2} className="mb-4">
          <Grid size={{xs:12, sm:12, md:8, lg:8}}
            sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControl fullWidth variant="outlined">
            <InputLabel id="activity-select-label">Activités existantes</InputLabel>
            <Select
              labelId="activity-select-label"
              id="activity-select"
              value={selectedActivityId}
              onChange={handleActivityChange}
              label="Activités existantes"
            >
              <MenuItem value="0">Aucune activité sélectionnée</MenuItem>
              <MenuItem disabled style={{ opacity: 0.7 }}>-- Activités régulières --</MenuItem>
              {allActivities.map((act) => (
                <MenuItem key={act.id?.toString() || 'unknown'} value={act.id?.toString() || '0'}>
                  {act.name}
                </MenuItem>
              ))}
              <MenuItem disabled style={{ opacity: 0.7 }}>-- Activités génériques --</MenuItem>
              {genericActivities.map((act) => (
                <MenuItem key={act.id?.toString() || 'unknown'} value={act.id?.toString() || '0'}>
                  {act.name}
                </MenuItem>
              ))}
            </Select>
            
          </FormControl>
          </Grid>
          
          <Grid size={{xs:12, sm:12, md:4, lg:4}} 
                container
                direction={{ xs: 'row', md: 'column', lg: 'column' }}
                spacing={2}>
            <Button
              variant="outlined"
              color="error"
              endIcon={<PublishedWithChangesIcon />}
              component={Link}
              href={`/activities/${selectedActivityId !== "0" ? selectedActivityId : ''}`}
              fullWidth
              disabled={selectedActivityId === "0" || !activity}
              sx={{ mb:.5}}
            >
              Modifier cette activité
            </Button>
            <Button
              variant="outlined"
              color="success"
              endIcon={<ArrowForwardIcon />}
              component={Link}
              href="/activities/new"
              fullWidth
              sx={{ mb:.5}}
            >
              Ajouter une nouvelle activité
            </Button>
            
            <Button
              variant="outlined"
              color="primary"
              startIcon={<AddIcon />}
              onClick={fetchOrCreateGenericActivity}
              disabled={!!activity}
              fullWidth
            >
              Utiliser activité générique
            </Button>
            </Grid>
        </Grid>
        
        {error && (
          <div className="container mx-auto px-4 py-2 flex justify-center">
            <div className="w-full animate-slide-in">
              <ErrorDisplay 
                error={error} 
                onRefresh={() => {
                  setError('');
                  window.location.reload();
                }}
                withRefreshButton={true}
              />
            </div>
          </div>
        )}
        
        {!activity && !error && (
          <Alert severity="info" className="my-4">
            Sélectionnez une activité existante, ajoutez une nouvelle activité, ou utilisez une activité générique.
            </Alert>
        )}
      </Paper>

      {/* Conditionally show the rest of the form only if an activity is selected */}
      {activity && (
        <>
          {/* Success messages */}
          {successMessage && (
            <Alert severity="success" className="mb-6 animate-fadeIn">
              {successMessage}
            </Alert>
          )}

          {/* Activity title banner */}
          <Paper className="p-4 mb-6 bg-blue-50 border-l-4 border-blue-500">
            <Typography variant="h6" className="font-bold">
              Activité sélectionnée: {activity.name}
            </Typography>
          </Paper>

          {/* Points display section - Une partie par ligne */}
          {activity.points && activity.points.length > 0 && (
            <Paper className="p-6 rounded-lg mb-6 shadow-md border-t-4 border-blue-600">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BarChartIcon className="text-blue-600" fontSize="large" />
                  <Typography variant="h5" className="font-bold">
                    Points par partie
                  </Typography>
                </div>
              </div>

              {/* Liste simple des parties avec une partie par ligne */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {activity.parts_names && activity.points && activity.parts_names.map((partName, index) => (
                  <Box 
                    key={index}
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      p: 1.5,
                      borderBottom: '1px solid rgba(0,0,0,0.12)',
                      '&:last-of-type': { borderBottom: 'none' },
                      borderRadius: 1,
                      bgcolor: 'background.paper',
                    }}
                  >
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        fontWeight: 'medium', 
                        display: 'flex', 
                        alignItems: 'center' 
                      }}
                    >
                      {partName}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        {activity.points[index]}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        points
                      </Typography>
                    </Box>
                  </Box>
                ))}
                
                {/* Ligne du total */}
                <Box 
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    p: 1.5,
                    mt: 1,
                    borderRadius: 1,
                    bgcolor: 'primary.light',
                    borderLeft: '4px solid',
                    borderColor: 'primary.main',
                  }}
                >
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    TOTAL
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {activity.points.reduce((sum, points) => sum + points, 0)}
                    </Typography>
                    <Typography variant="body2">
                      points
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Paper>
          )}

          <SingleCorrectionFormAutre
            activityId={activity.id?.toString() || "0"}
            activity={activity}
            onSuccess={handleSuccessfulCreateCorrection}
          />
        </>
      )}
    </div>
  );
}