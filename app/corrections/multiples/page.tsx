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
} from '@mui/material';
import Grid from '@mui/material/Grid';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import GroupsIcon from '@mui/icons-material/Groups';
import BarChartIcon from '@mui/icons-material/BarChart';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import ArticleIcon from '@mui/icons-material/Article';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import Link from 'next/link';

import { Activity } from '@/lib/activity';
import LoadingSpinner from '@/components/LoadingSpinner';
import MultipleCorrectionsForm from '@/components/MultipleCorrectionsForm';

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

  useEffect(() => {
    // Si aucun activityId n'est fourni, chercher ou créer une activité générique
    if (!activityId || activityId === "0") {
      fetchOrCreateGenericActivity();
    } else {
      fetchActivity();
    }
  }, [activityId]);

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
      } else {
        // Si aucune activité générique n'existe, en créer une nouvelle
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

  // Handle form submission for creating a group
  const handleCreateGroup = async (createdCorrectionIds: string[]) => {
    if (createdCorrectionIds.length === 0 || !groupName.trim()) {
      setError('Veuillez saisir un nom de groupe et créer des corrections');
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
      setSuccessMessage(`${createdCorrectionIds.length} correction(s) créée(s) avec succès`);
      
      // If we have selectedClassId, we don't need to create a group
      // Only create a group if there's no class ID but we have a group name
      if (!selectedClassId && groupName.trim()) {
        handleCreateGroup(createdCorrectionIds);
      } else if (selectedClassId) {
        // For class-based corrections, just show success message and redirect to class view
        setTimeout(() => {
          router.push(`/classes/${selectedClassId}`);
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

  // Modifier la condition d'affichage d'erreur pour ne pas bloquer si activityId est 0
  if (error && (!activityId || (activityId !== "0" && !activity))) {
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
                    size="small"
                    color="primary"
                    className="mt-4"
                    component={Link}
                    href="/activities"
                    startIcon={<ArrowBackIcon />}
                  >
                    Sélectionner une activité
                  </Button>
                </div>
              </div>
            </div>
          </Paper>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header with modern design and gradient */}
      <Paper 
        elevation={3}
        className="mb-8 rounded-lg overflow-hidden bg-gradient-to-r from-blue-700 to-indigo-800"
      >
        <div className="p-6 text-white relative">
          {/* Decorative background pattern */}
          <div className="absolute inset-0 opacity-10" 
               style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'}}
          ></div>
          
          {/* Header content */}
          <div className="relative z-10 flex justify-between items-center">
            <div>
              {activity && (
              <Typography variant="h4" component="h1" className="font-bold text-black mb-1">
                  {activityId === "0" || activity.name === "Activité générique" 
                    ? "Activité générique" 
                    : `Activité : ${activity.name}`}
              </Typography>
              )}
            <Typography variant="subtitle1" className="text-blue-600">
            Corrections multiples
              </Typography>
            </div>
            
            <div className="flex gap-3">
              <Button 
                component={Link} 
                href={activityId !== "0" ? `/activities/${activityId}` : (genericActivityId ? `/activities/${genericActivityId}` : '/activities')}
                variant="outlined"
                color='secondary'
                startIcon={<ArrowBackIcon />}
              >
                Retour
              </Button>
              
              {activityId !== "0" && (
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<GroupsIcon />}
                  component={Link}
                  href={`/activities/${activityId}/groups`}
                >
                  Groupes
                </Button>
              )}
              
              {activityId === "0" && genericActivityId && (
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<GroupsIcon />}
                  component={Link}
                  href={`/activities/${genericActivityId}/groups`}
                >
                  Groupes
                </Button>
              )}
            </div>
          </div>
        </div>
      </Paper>

      {/* Success messages */}
      {successMessage && (
        <Alert severity="success" className="mb-6 animate-fadeIn">
          {successMessage}
        </Alert>
      )}

      {error && (
        <Alert severity="error" className="mb-6 animate-fadeIn">
          {error}
        </Alert>
      )}

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
                inputProps={{ min: 0, max: 20 }}
                sx={{ mt: 1, width: '80px', textAlign: 'center' }}
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
                inputProps={{ min: 0, max: 20 }}
                sx={{ mt: 1, width: '80px', textAlign: 'center' }}
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

      <MultipleCorrectionsForm
        activityId={activityId !== "0" ? activityId : (genericActivityId ? genericActivityId.toString() : "")}
        activity={activity}
        experimentalPoints={experimentalPoints}
        theoreticalPoints={theoreticalPoints}
        onSuccess={handleSuccessfulCreateCorrections}
        groupName={groupName}
        requireGroupName={true} // Exiger un nom de groupe
        onClassSelect={handleClassSelect} // Add the new prop
      />
    </div>
  );
}
