'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Typography,
  Paper,
  Box,
  Button,
  Alert,
  Container,
  IconButton,
  TextField,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import Grid from '@mui/material/Grid';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import GroupsIcon from '@mui/icons-material/Groups';
import BarChartIcon from '@mui/icons-material/BarChart';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import ArticleIcon from '@mui/icons-material/Article';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import AddIcon from '@mui/icons-material/Add';
import EditNoteIcon from '@mui/icons-material/EditNote';
import Link from 'next/link';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PublishedWithChangesIcon from '@mui/icons-material/PublishedWithChanges';

import { Activity } from '@/lib/activity';
import LoadingSpinner from '@/components/LoadingSpinner';

import GradientBackground from '@/components/ui/GradientBackground';
import PatternBackground from '@/components/ui/PatternBackground';
import ErrorDisplay from '@/components/ui/ErrorDisplay';

export default function MultipleCorrections() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activityId = searchParams?.get('activityId') || "0"; // Utiliser "0" comme valeur par défaut au lieu de null
  
  // Activity and points states
  const [activity, setActivity] = useState<Activity | null>(null);
  const [experimentalPoints, setExperimentalPoints] = useState<number>(5);
  const [theoreticalPoints, setTheoreticalPoints] = useState<number>(15);
  
  // UI states
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Group states
  const [groupName, setGroupName] = useState<string>('');
  const [groupDescription, setGroupDescription] = useState<string>('');
  const [groupId, setGroupId] = useState<number | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string>(''); // Add state for selected class ID

  // Ajout d'un état pour l'activité générique
  const [genericActivityId, setGenericActivityId] = useState<number | null>(null);
  
  // États pour les activités disponibles
  const [allActivities, setAllActivities] = useState<Activity[]>([]);
  const [genericActivities, setGenericActivities] = useState<Activity[]>([]);
  const [selectedActivityId, setSelectedActivityId] = useState<string>(activityId);

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
      const response = await fetch('/api/activities');
      if (!response.ok) throw new Error("Erreur lors du chargement des activités");
      
      const activitiesData = await response.json();
      
      // Séparer les activités génériques des activités normales
      const generic = activitiesData.filter((act: Activity) => act.name.includes('Activité générique'));
      const regular = activitiesData.filter((act: Activity) => !act.name.includes('Activité générique'));
      
      setAllActivities(regular);
      setGenericActivities(generic);
    } catch (err) {
      console.error('Erreur:', err);
      setError("Erreur lors du chargement des activités disponibles");
    }
  };

  const fetchActivity = async () => {
    if (!activityId || activityId === "0") return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/activities/${activityId}`);
      if (!response.ok) throw new Error("Erreur lors du chargement de l'activité");
      
      const activityData: Activity = await response.json();
      setActivity(activityData);
      setExperimentalPoints(activityData.experimental_points !== undefined ? activityData.experimental_points : 5);
      setTheoreticalPoints(activityData.theoretical_points !== undefined ? activityData.theoretical_points : 15);
    } catch (err) {
      console.error('Erreur:', err);
      setError("Erreur lors du chargement de l'activité");
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour chercher des activités génériques
  const fetchGenericActivities = async () => {
    try {
      const response = await fetch('/api/activities/generic/list');
      if (!response.ok) throw new Error("Erreur lors du chargement des activités génériques");
      
      const genericActivitiesData = await response.json();
      setGenericActivities(genericActivitiesData);
    } catch (err) {
      console.error('Erreur:', err);
      setError("Erreur lors du chargement des activités génériques");
    }
  };

  // Nouvelle fonction pour chercher ou créer une activité générique
  const fetchOrCreateGenericActivity = async () => {
    try {
      setLoading(true);
      // Chercher une activité générique existante
      const response = await fetch('/api/activities/generic');
      
      if (response.ok) {
        const activityData = await response.json();
        setActivity(activityData);
        setGenericActivityId(activityData.id);
        setExperimentalPoints(activityData.experimental_points || 5);
        setTheoreticalPoints(activityData.theoretical_points || 15);
        
        // D'abord rafraîchir la liste des activités
        await fetchAllActivities();
        
        // Ensuite seulement, mettre à jour l'ID sélectionné
        setSelectedActivityId(activityData.id.toString());
        
        // Mettre à jour l'URL sans rafraîchir la page
        router.push(`/corrections/multiples?activityId=${activityData.id}`, { scroll: false });
      } else {
        // Si aucune activité générique n'existe, en ajouter une nouvelle
        const createResponse = await fetch('/api/activities', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: 'Activité générique',
            content: 'Activité pour les corrections sans activité spécifique',
            experimental_points: 5,
            theoretical_points: 15
          }),
        });
        
        if (createResponse.ok) {
          const newActivity = await createResponse.json();
          setActivity(newActivity);
          setGenericActivityId(newActivity.id);
          setExperimentalPoints(newActivity.experimental_points || 5);
          setTheoreticalPoints(newActivity.theoretical_points || 15);
          
          // D'abord rafraîchir la liste des activités
          await fetchAllActivities();
          
          // Ensuite seulement, mettre à jour l'ID sélectionné
          setSelectedActivityId(newActivity.id.toString());
          
          // Mettre à jour l'URL sans rafraîchir la page
          router.push(`/corrections/multiples?activityId=${newActivity.id}`, { scroll: false });
        } else {
          throw new Error("Erreur lors de la création d'une activité générique");
        }
      }
    } catch (err) {
      console.error('Erreur:', err);
      setError("Erreur lors du chargement de l'activité générique");
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
        const response = await fetch(`/api/activities/${newActivityId}`);
        if (!response.ok) throw new Error("Erreur lors du chargement de l'activité");
        
        const activityData = await response.json();
        setActivity(activityData);
        setExperimentalPoints(activityData.experimental_points || 5);
        setTheoreticalPoints(activityData.theoretical_points || 15);
        
        // Update the URL without full refresh
        router.push(`/corrections/multiples?activityId=${newActivityId}`, { scroll: false });
      } catch (err) {
        console.error('Erreur:', err);
        setError("Erreur lors du chargement de l'activité");
      } finally {
        setLoading(false);
      }
    }
  };


  // Handle form submission for creating a group
  const handleCreateGroup = async (createdCorrectionIds: string[]) => {
    if (createdCorrectionIds.length === 0 || !groupName.trim()) {
      setError('Veuillez saisir un nom de groupe et ajouter des corrections');
      return;
    }
    
    try {
      // First create the group
      const groupResponse = await fetch('/api/correction-groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activity_id: activityId !== "0" ? activityId : genericActivityId, // Utiliser l'ID de l'activité générique si activityId est 0
          name: groupName,
          description: groupDescription
        }),
      });
      
      if (!groupResponse.ok) {
        const errorData = await groupResponse.json();
        throw new Error(errorData.error || 'Erreur lors de la création du groupe');
      }
      
      const groupData = await groupResponse.json();
      setGroupId(groupData.id);
      
      // Then associate the corrections with the group
      const linkResponse = await fetch(`/api/correction-groups/${groupData.id}/corrections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          correction_ids: createdCorrectionIds
        }),
      });
      
      if (!linkResponse.ok) {
        console.error('Réponse d\'association non-OK:', await linkResponse.text());
        throw new Error(`Erreur lors de l'association des corrections au groupe (${linkResponse.status})`);
      }
      
      setSuccessMessage(`Groupe "${groupName}" créé avec ${createdCorrectionIds.length} corrections`);
      
      // Redirect to the group page after successful creation
      setTimeout(() => {
        router.push(`/activities/${activityId}/groups/${groupData.id}`);
      }, 2000);
      
    } catch (err) {
      console.error('Erreur:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la création du groupe');
    }
  };

  // Handle successful correction creation
  const handleSuccessfulCreateCorrections = (createdCorrectionIds: string[]) => {
    if (createdCorrectionIds.length > 0) {
      setSuccessMessage(
        createdCorrectionIds.length === 1 
          ? `1 correction ajoutée avec succès` 
          : `${createdCorrectionIds.length} corrections ajoutées avec succès`
      );
      
      // If we have selectedClassId, we don't need to create a group
      // Only create a group if there's no class ID but we have a group name
      if (!selectedClassId && groupName.trim()) {
        handleCreateGroup(createdCorrectionIds);
      } else if (selectedClassId) {
        // Pour les corrections basées sur une classe, montrer un message de succès
        // et rediriger vers une vue filtrée des corrections au lieu de la vue de classe
        setTimeout(() => {
          const highlightParam = createdCorrectionIds.join(',');
          // Rediriger vers la page des corrections avec des filtres appropriés
          // Ajouter correctionId pour filtrer spécifiquement ces corrections
          router.push(`/corrections?classId=${selectedClassId}&highlight=${highlightParam}&correctionId=${highlightParam}&activityId=${activityId !== "0" ? activityId : genericActivityId}`);
        }, 2000);
      } else {
        // Si aucune classe n'est sélectionnée et pas de groupe, rediriger vers les corrections
        setTimeout(() => {
          const highlightParam = createdCorrectionIds.join(',');
          // Ajouter correctionId pour filtrer spécifiquement ces corrections
          router.push(`/corrections?highlight=${highlightParam}&correctionId=${highlightParam}&activityId=${activityId !== "0" ? activityId : genericActivityId}`);
        }, 2000);
      }
    }
  };

  // Handle class selection from the form component
  const handleClassSelect = (classId: string, className: string) => {
    setSelectedClassId(classId);
    // Update the group name with the class name
    setGroupName(className);
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
                  Nouvelles corrections en lot
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
                <MenuItem key={act.id?.toString() || 'unknown'} value={act.id?.toString() || "0"}>
                  {act.name}
                </MenuItem>
              ))}
              <MenuItem disabled style={{ opacity: 0.7 }}>-- Activités génériques --</MenuItem>
              {genericActivities.map((act) => (
                <MenuItem key={act.id?.toString() || 'unknown'} value={act.id?.toString() || "0"}>
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
              href={`/activities/${activityId}`}
              fullWidth
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
                onRefresh={() => setError('')}
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

          {/* Grading scale section with improved design */}
          <Paper className="p-6 rounded-lg mb-6 shadow-md border-t-4 border-blue-600">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChartIcon className="text-blue-600" fontSize="large" />
                <Typography variant="h5" className="font-bold">
                  Barème de notation {activityId === "0" && "(modifiable)"}
                </Typography>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Paper className="p-4 border shadow-sm transition-all hover:shadow-md flex flex-col items-center text-center">
                <Typography variant="overline" color="textSecondary" className="mb-1">
                  PARTIE EXPÉRIMENTALE
                </Typography>
                {activityId === "0" ? (
                  <TextField
                    type="number"
                    value={experimentalPoints}
                    onChange={(e) => setExperimentalPoints(Number(e.target.value))}
                    variant="outlined"
                    size="small"
                    sx={{ mt: 1, width: '80px', textAlign: 'center' }}
                    slotProps={{
                      input: { inputProps: { min: 0, max: 20 } }
                    }}
                  />
                ) : (
                  <Typography variant="h3" className="font-bold text-blue-600 mb-1">
                    {activity?.experimental_points || 5}
                  </Typography>
                )}
                <Typography variant="body2" color="textSecondary">
                  points
                </Typography>
              </Paper>
              
              <Paper className="p-4 border shadow-sm transition-all hover:shadow-md flex flex-col items-center text-center">
                <Typography variant="overline" color="textSecondary" className="mb-1">
                  PARTIE THÉORIQUE
                </Typography>
                {activityId === "0" ? (
                  <TextField
                    type="number"
                    value={theoreticalPoints}
                    onChange={(e) => setTheoreticalPoints(Number(e.target.value))}
                    variant="outlined"
                    size="small"
                    sx={{ mt: 1, width: '80px', textAlign: 'center' }}
                    slotProps={{
                      input: { inputProps: { min: 0, max: 20 } }
                    }}
                  />
                ) : (
                  <Typography variant="h3" className="font-bold text-blue-600 mb-1">
                    {activity?.theoretical_points || 15}
                  </Typography>
                )}
                <Typography variant="body2" color="textSecondary">
                  points
                </Typography>
              </Paper>
              
              <Paper className="p-4 border-2 border-blue-600 bg-blue-50 shadow-sm transition-all hover:shadow-md flex flex-col items-center text-center">
                <Typography variant="overline" color="primary" className="mb-1 font-medium">
                  TOTAL
                </Typography>
                <Typography variant="h3" className="font-bold text-blue-700 mb-1">
                  {experimentalPoints + theoreticalPoints}
                </Typography>
                <Typography variant="body2" color="primary">
                  points sur 20
                </Typography>
              </Paper>
            </div>
          </Paper>

          {/* Group Information Section */}
          <Paper className="p-6 rounded-lg mb-6 shadow-md border-t-4 border-purple-600">
            <div className="flex items-center gap-2 mb-4">
              <GroupsIcon className="text-purple-600" fontSize="large" />
              <Typography variant="h5" className="font-bold">
                Informations du groupe
              </Typography>
            </div>
            
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Nom du groupe"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                variant="outlined"
                fullWidth
                className="mb-4"
                placeholder="Ex: TP1 - Groupe B - Session Automne 2024"
                slotProps={{
                  input: {
                    startAdornment: (
                      <Box sx={{ color: 'action.active', mr: 1 }}>
                        <PeopleAltIcon />
                      </Box>
                    ),
                  }
                }}
              />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Description (optionnelle)"
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                variant="outlined"
                fullWidth
                multiline
                rows={3}
                placeholder="Informations additionnelles sur ce groupe de corrections"
                slotProps={{
                  input: {
                    startAdornment: (
                      <Box sx={{ color: 'action.active', mr: 1, alignSelf: 'flex-start', mt: 1.5 }}>
                        <ArticleIcon />
                      </Box>
                    ),
                  }
                }}
              />
              </Grid>
            </Grid>
          </Paper>


        </>
      )}
    </div>
  );
}
