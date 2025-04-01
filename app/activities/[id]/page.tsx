'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Activity } from '@/lib/activity';
import { Correction } from '@/lib/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Button, IconButton, Paper, Typography, TextField, CircularProgress, Alert, Tooltip, Container, Tabs, Tab } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import ArticleIcon from '@mui/icons-material/Article';
import AddIcon from '@mui/icons-material/Add';
import BarChartIcon from '@mui/icons-material/BarChart';
import CheckIcon from '@mui/icons-material/Check';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { useSnackbar } from 'notistack';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Box from '@mui/material/Box';
import ActivityStatsGraphs from '@/components/ActivityStatsGraphs';
// Import components
import FragmentsList from '@/components/FragmentsList';
import CorrectionsList from '@/components/CorrectionsList';
import ActivityDetails from '@/components/ActivityDetails';
import H1Title from '@/components/ui/H1Title';
import GradientBackground from '@/components/ui/GradientBackground';
// Import the Fragment type from FragmentEditModal
import FragmentEditModal, { Fragment as EditModalFragment } from '@/components/FragmentEditModal';

// Replace custom Fragment interface with the imported type
type Fragment = EditModalFragment;

export default function ActivityDetail({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap the Promise for params using React.use
  const { id } = React.use(params);
  const activityId = id;
  
  const [activity, setActivity] = useState<Activity | null>(null);
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Add state for fragments
  const [fragments, setFragments] = useState<Fragment[]>([]);
  const [loadingFragments, setLoadingFragments] = useState(false);

  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [experimentalPoints, setExperimentalPoints] = useState(5);
  const [theoreticalPoints, setTheoreticalPoints] = useState(15);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [totalPoints, setTotalPoints] = useState(20); // Nouveau state pour le total des points
  
  // Remplacer l'état pour suivre la correction à supprimer
  const [correctionToDelete, setCorrectionToDelete] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [tabValue, setTabValue] = useState(0);
  
  useEffect(() => {
    const fetchActivityAndCorrections = async () => {
      try {
        // Fetch activity details
        const activityResponse = await fetch(`/api/activities/${activityId}`);
        if (!activityResponse.ok) {
          throw new Error('Erreur lors du chargement de l\'activité');
        } 
        const activityData = await activityResponse.json();
        setActivity(activityData);
        setName(activityData.name);
        setContent(activityData.content || '');
        // Set the grading scale values from the activity data or use defaults
        setExperimentalPoints(activityData.experimental_points !== undefined ? activityData.experimental_points : 5);
        setTheoreticalPoints(activityData.theoretical_points !== undefined ? activityData.theoretical_points : 15);
        
        // Calculer le total des points
        const total = (activityData.experimental_points || 5) + (activityData.theoretical_points || 15);
        setTotalPoints(total);
        
        // Fetch corrections for this activity
        const correctionsResponse = await fetch(`/api/activities/${activityId}/corrections`);
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
  
  // Add useEffect to load fragments when needed (when tab changes to fragments tab)
  useEffect(() => {
    const fetchFragments = async () => {
      if (tabValue === 1 && activityId) {
        setLoadingFragments(true);
        try {
          const response = await fetch(`/api/activities/${activityId}/fragments`);
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Erreur (${response.status}): ${errorData.message || response.statusText}`);
          }
          const data = await response.json();
          setFragments(data);
        } catch (err) {
          console.error('Erreur:', err);
          enqueueSnackbar(`Erreur lors du chargement des fragments: ${(err as Error).message}`, { 
            variant: 'error' 
          });
        } finally {
          setLoadingFragments(false);
        }
      }
    };
    
    fetchFragments();
  }, [activityId, tabValue, enqueueSnackbar]);
  
  const handleEditClick = () => {
    setIsEditing(true);
  };
  
  // Add handlers for fragments
  const handleAddFragment = async (fragmentData: Omit<EditModalFragment, 'id' | 'activity_id' | 'created_at' | 'updated_at'>) => {
    try {
      const response = await fetch(`/api/activities/${activityId}/fragments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...fragmentData,
          activity_id: parseInt(activityId)
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Erreur (${response.status}): ${errorData.message || response.statusText}`);
      }
      
      const newFragment = await response.json();
      setFragments([...fragments, newFragment]);
      enqueueSnackbar('Fragment ajouté avec succès', { variant: 'success' });
    } catch (err) {
      console.error('Erreur:', err);
      enqueueSnackbar(`Erreur lors de l'ajout du fragment: ${(err as Error).message}`, { 
        variant: 'error' 
      });
    }
  };
  
  const handleUpdateFragment = async (id: number, fragmentData: Partial<EditModalFragment>) => {
    try {
      const response = await fetch(`/api/fragments/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fragmentData),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Erreur (${response.status}): ${errorData.message || response.statusText}`);
      }
      
      const updatedFragment = await response.json();
      setFragments(fragments.map(f => f.id === id ? updatedFragment : f));
      enqueueSnackbar('Fragment mis à jour avec succès', { variant: 'success' });
    } catch (err) {
      console.error('Erreur:', err);
      enqueueSnackbar(`Erreur lors de la mise à jour du fragment: ${(err as Error).message}`, { 
        variant: 'error' 
      });
    }
  };
  
  const handleDeleteFragment = async (id: number) => {
    try {
      const response = await fetch(`/api/fragments/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Erreur (${response.status}): ${errorData.message || response.statusText}`);
      }
      
      setFragments(fragments.filter(f => f.id !== id));
      enqueueSnackbar('Fragment supprimé avec succès', { variant: 'success' });
    } catch (err) {
      console.error('Erreur:', err);
      enqueueSnackbar(`Erreur lors de la suppression du fragment: ${(err as Error).message}`, { 
        variant: 'error' 
      });
    }
  };
  
  const handleCancelClick = () => {
    setIsEditing(false);
    setName(activity?.name || '');
    setContent(activity?.content || '');
    setExperimentalPoints(activity?.experimental_points !== undefined ? activity.experimental_points : 5);
    setTheoreticalPoints(activity?.theoretical_points !== undefined ? activity.theoretical_points : 15);
  };
  
  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Le nom de l\'activité est requis');
      enqueueSnackbar('Le nom de l\'activité est requis', { variant: 'error' });
      return;
    }
    
    // Validation de barème flexible - vérifie seulement que le total est positif
    const currentTotal = Number(experimentalPoints) + Number(theoreticalPoints);
    if (currentTotal <= 0) {
      setError('Le total des points doit être supérieur à 0');
      enqueueSnackbar('Le total des points doit être supérieur à 0', { variant: 'error' });
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    try {
      const response = await fetch(`/api/activities/${activityId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          activityId: activityId,
          name, 
          content, 
          experimental_points: experimentalPoints,
          theoretical_points: theoreticalPoints,
          total_points: currentTotal // Ajouter le total des points
        }),
      });
      
      if (!response.ok) {
        // Extraire l'objet d'erreur JSON
        const errorData = await response.json();
        // Vous pouvez maintenant accéder à errorData.error
        console.error('Erreur:', errorData.error);
        // Gérer l'erreur (par ex. avec un state React)
        // setError(`Erreur lors de la mise à jour de l'activité : ${errorData.error}`);
        enqueueSnackbar(`Erreur lors de la mise à jour de l'activité :  ${errorData.error as Error}`,
          { variant: 'error' }
        );
        return;
      }

      
      
      const updatedActivity = await response.json();
      setActivity(updatedActivity);
      setIsEditing(false);
      enqueueSnackbar('Activité mise à jour avec succès', { variant: 'success' });
    } catch (error) {
      console.error('Erreur:', error);
      // setError(`Erreur lors de la mise à jour de l'activité : ${(error as Error).message}`);
      enqueueSnackbar(`Erreur lors de la mise à jour de l'activité: ${(error as Error).message}`,
      { variant: 'error' });
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
      const response = await fetch(`/api/activities/${activityId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Erreur (${response.status}): ${errorData.message || response.statusText}`);
      }
      
      enqueueSnackbar('Activité supprimée avec succès', { variant: 'success' });
      router.push('/');
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
    router.push(`/activities/${activityId}/corrections/new`);
  };
  
  const handleFragmentsClick = () => {
    router.push(`/activities/${activityId}/fragments`);
  };
  
  const handlePointsChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    setter: React.Dispatch<React.SetStateAction<number>>,
    otherValue: number,
    isExperimental: boolean
  ) => {
    const value = Number(e.target.value);
    setter(value);
    
    // Mise à jour du total au lieu d'ajuster automatiquement l'autre valeur
    setTotalPoints(value + otherValue);
  };

  // Fonction pour initier la suppression
  const handleDeleteCorrection = (correctionId: number) => {
    setCorrectionToDelete(correctionId);
  };
  
  // Fonction pour confirmer et exécuter la suppression
  const confirmDeleteCorrection = async (correctionId: number) => {
    try {
      setIsProcessing(true);
      const response = await fetch(`/api/corrections/${correctionId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Erreur (${response.status}): ${errorData.message || response.statusText}`);
      }
      
      // Mise à jour de l'état local pour retirer la correction supprimée
      setCorrections(corrections.filter(c => c.id !== correctionId));
      
      // Notification de succès
      enqueueSnackbar('Correction supprimée avec succès', { 
        variant: 'success' 
      });
    } catch (error) {
      console.error('Erreur:', error);
      enqueueSnackbar(`Erreur lors de la suppression de la correction: ${(error as Error).message}`, { 
        variant: 'error' 
      });
    } finally {
      setCorrectionToDelete(null);
      setIsProcessing(false);
    }
  };
  
  // Fonction pour annuler la suppression
  const cancelDelete = () => {
    setCorrectionToDelete(null);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
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
            <div className="flex items-start gap-4">
              <div className="text-red-500 animate-once">
                <ErrorOutlineIcon fontSize="large" />
              </div>
              <div className="flex-1">
                <Typography variant="h6" className="text-red-600 font-semibold mb-2">
                {error}
                </Typography>
                <div className="flex justify-around items-center mt-4">
                  <Button 
                  variant="outlined" 
                  color="success" 
                  size="small" 
                  className="mt-4"
                  startIcon={<RefreshIcon />}
                  onClick={() => window.location.reload()}
                  >
                  Recharger
                  </Button>
                    <Button 
                    variant="outlined" 
                    size="small"
                    color="primary"
                    className="mt-4"
                    component={Link}
                    href="/activities"
                    startIcon={<ArrowBackIcon sx={{color: "primary"}}/>}
                    >
                    Retour aux activités
                    </Button>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-1 left-0 w-full h-1">
              <div className="bg-red-500 h-full w-full animate-shrink"></div>
            </div>
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
              href={`/activities`}
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
                error={!name.trim()}
                helperText={!name.trim() ? "Le nom est requis" : ""}
                autoFocus
              />
              <div className="flex space-x-2">
                <IconButton
                  onClick={handleSubmit}
                  disabled={isSubmitting || !name.trim()}
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
            href={`/activities`}
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
            <Tab label="Fragments" />
            <Tab label="Corrections" />
            <Tab label="Statistiques" />
          </Tabs>
        </Box>
        
        {/* Tab Content */}
        <Box sx={{ mt: 3 }}>
          {tabValue === 0 && (
            <Box>
              <ActivityDetails 
                activity={activity}
                isEditing={isEditing}
                content={content}
                experimentalPoints={experimentalPoints}
                theoreticalPoints={theoreticalPoints}
                onEditClick={handleEditClick}
                onContentChange={(e) => setContent(e.target.value)}
                handlePointsChange={handlePointsChange}
                setExperimentalPoints={setExperimentalPoints}
                setTheoreticalPoints={setTheoreticalPoints}
              />
            </Box>
          )}
          
          {tabValue === 1 && (
            <Box>
              <Typography variant="body2" color="textSecondary">
              Les fragments sont des morceaux de texte réutilisables pour vos corrections.
              </Typography>
              {loadingFragments ? (
                <div className="py-10 flex justify-center max-w-[400px] mx-auto">
                  <LoadingSpinner size="md" text="Chargement des fragments" />
                </div>
              ) : (
                <FragmentsList 
                  fragments={fragments} 
                  activityId={parseInt(activityId)} 
                  onAddFragment={handleAddFragment}
                  onUpdateFragment={handleUpdateFragment}
                  onDeleteFragment={handleDeleteFragment}
                />
              )}
            </Box>
          )}
          
          {tabValue === 2 && (
            <Box>
              <CorrectionsList 
                corrections={corrections}
                activity={activity}
                activityId={activityId}
                isEditing={isEditing}
                isProcessing={isProcessing}
                correctionToDelete={correctionToDelete}
                onNewCorrection={handleNewCorrectionClick}
                onDeleteCorrection={handleDeleteCorrection}
                onConfirmDelete={confirmDeleteCorrection}
                onCancelDelete={cancelDelete}
              />
            </Box>
          )}
          
          {tabValue === 3 && (
            <Box>
              <ActivityStatsGraphs activityId={parseInt(id)} />
            </Box>
          )}
        </Box>
      </Paper>
    </Container>
  );
}