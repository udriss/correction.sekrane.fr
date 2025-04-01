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
  SelectChangeEvent,
} from '@mui/material';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BarChartIcon from '@mui/icons-material/BarChart';
import ArticleIcon from '@mui/icons-material/Article';
import AddIcon from '@mui/icons-material/Add';
import Link from 'next/link';

import { Activity } from '@/lib/activity';
import LoadingSpinner from '@/components/LoadingSpinner';
// Fix the import to use the correct component name
import SingleCorrectionForm from '@/components/SingleCorrectionForm';

export default function UniqueCorrection() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activityId = searchParams?.get('activityId') || "0";
  
  // Activity and points states
  const [activity, setActivity] = useState<Activity | null>(null);
  const [experimentalPoints, setExperimentalPoints] = useState<number>(5);
  const [theoreticalPoints, setTheoreticalPoints] = useState<number>(15);
  
  // UI states
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // États pour les activités disponibles
  const [allActivities, setAllActivities] = useState<Activity[]>([]);
  const [genericActivities, setGenericActivities] = useState<Activity[]>([]);
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
        router.push(`/corrections/unique?activityId=${newActivityId}`, { scroll: false });
      } catch (err) {
        console.error('Erreur:', err);
        setError("Erreur lors du chargement de l'activité");
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
      const response = await fetch('/api/activities/generic');
      
      if (response.ok) {
        const activityData = await response.json();
        setActivity(activityData);
        setGenericActivityId(activityData.id);
        setExperimentalPoints(activityData.experimental_points || 5);
        setTheoreticalPoints(activityData.theoretical_points || 15);
        setSelectedActivityId(activityData.id.toString());
        
        // Update the URL without full refresh
        router.push(`/corrections/unique?activityId=${activityData.id}`, { scroll: false });
      } else {
        throw new Error("Erreur lors de la création d'une activité générique");
      }
    } catch (err) {
      console.error('Erreur:', err);
      setError("Erreur lors du chargement de l'activité générique");
    } finally {
      setLoading(false);
    }
  };

  // Handle successful correction creation
  const handleSuccessfulCreateCorrection = (createdCorrectionId: string) => {
    if (createdCorrectionId) {
      setSuccessMessage(`Correction créée avec succès`);
      
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
              <Typography variant="h4" component="h1" className="font-bold text-black mb-1">
                  Création d'une correction
              </Typography>
              <Typography variant="subtitle1" className="text-blue-600">
                Sélectionnez une activité ou créez-en une nouvelle
              </Typography>
            </div>
            
            <div className="flex gap-3">
              <Button 
                component={Link} 
                href="/activities"
                variant="outlined"
                color='secondary'
                startIcon={<ArrowBackIcon />}
              >
                Retour
              </Button>
            </div>
          </div>
        </div>
      </Paper>

      {/* Activity Selection Section */}
      <Paper className="p-6 rounded-lg mb-6 shadow-md border-t-4 border-green-600">
        <div className="flex items-center gap-2 mb-4">
          <ArticleIcon className="text-green-600" fontSize="large" />
          <Typography variant="h5" className="font-bold">
            Sélection d'activité
          </Typography>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
          
          <div className="flex gap-2 items-center">
            <Button
              variant="contained"
              color="success"
              startIcon={<AddIcon />}
              component={Link}
              href="/activities/new"
              fullWidth
            >
              Créer une nouvelle activité
            </Button>
            
            <Button
              variant="outlined"
              color="primary"
              onClick={fetchOrCreateGenericActivity}
              disabled={!!activity}
            >
              Utiliser activité générique
            </Button>
          </div>
        </div>
        
        {error && (
          <Alert severity="error" className="mb-6 animate-fadeIn">
            {error}
          </Alert>
        )}
        
        {!activity && !error && (
          <Alert severity="info" className="my-4">
            Veuillez sélectionner une activité existante, créer une nouvelle activité, ou utiliser une activité générique.
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

          <SingleCorrectionForm
            activityId={activity.id?.toString() || "0"}
            activity={activity}
            experimentalPoints={experimentalPoints}
            theoreticalPoints={theoreticalPoints}
            onSuccess={handleSuccessfulCreateCorrection}
          />
        </>
      )}
    </div>
  );
}
