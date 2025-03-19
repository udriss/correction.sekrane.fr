'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Activity } from '@/lib/activity';
import { Correction } from '@/lib/correction';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Button, IconButton, Paper, Typography, TextField, CircularProgress } from '@mui/material';
import { Edit as EditIcon, Save as SaveIcon, Close as CloseIcon, Delete as DeleteIcon, Article as ArticleIcon, Add as AddIcon, BarChart as BarChartIcon, Check as CheckIcon } from '@mui/icons-material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';


export default function ActivityDetail({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap the Promise for params using React.use
  const { id } = React.use(params);
  const activityId = id;

  const [activity, setActivity] = useState<Activity | null>(null);
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [experimentalPoints, setExperimentalPoints] = useState(5);
  const [theoreticalPoints, setTheoreticalPoints] = useState(15);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

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

  const handleEditClick = () => {
    setIsEditing(true);
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
      return;
    }

    // Validate that the points sum to 20
    const totalPoints = Number(experimentalPoints) + Number(theoreticalPoints);
    if (totalPoints !== 20) {
      setError('Le total des points doit être égal à 20');
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
          name, 
          content, 
          experimental_points: experimentalPoints,
          theoretical_points: theoreticalPoints 
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour de l\'activité');
      }

      const updatedActivity = await response.json();
      setActivity(updatedActivity);
      setIsEditing(false);
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors de la mise à jour de l\'activité');
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
        throw new Error('Erreur lors de la suppression');
      }

      router.push('/');
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors de la suppression de l\'activité');
      setConfirmingDelete(false);
    }
  };

  const handleDelete = handleDeleteClick; // Pour maintenir la compatibilité avec les références existantes

  const handleFragmentsClick = () => {
    router.push(`/activities/${activityId}/fragments`);
  };

  const handleNewCorrectionClick = () => {
    router.push(`/activities/${activityId}/corrections/new`);
  };

  const handlePointsChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    setter: React.Dispatch<React.SetStateAction<number>>,
    otherValue: number,
    isExperimental: boolean
  ) => {
    const value = Number(e.target.value);
    setter(value);
    
    // Auto-adjust the other field to maintain a sum of 20
    if (isExperimental) {
      setTheoreticalPoints(20 - value);
    } else {
      setExperimentalPoints(20 - value);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
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
                    href="/activites"
                    startIcon={<ArrowBackIcon />}
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
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        {isEditing ? (
          <div className="flex items-center w-full">
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
                color="primary"
                title="Sauvegarder les modifications"
                size="medium"
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
          <h1 className="text-3xl font-bold flex items-center">
            {activity.name}
            <IconButton 
              onClick={handleEditClick}
              size="small"
              color="primary"
              aria-label="edit"
            >
              <EditIcon className="ml-2" />
            </IconButton>
            {confirmingDelete ? (
                    <>
                      <IconButton
                        onClick={handleConfirmDelete}
                        color="success"
                        size="medium"
                        title="Confirmer la suppression"
                      >
                        <CheckIcon />
                      </IconButton>
                      <IconButton
                        onClick={handleCancelDelete}
                        color="inherit"
                        size="medium"
                        title="Annuler la suppression"
                      >
                        <CloseIcon />
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
          </h1>
        )}
      </div>

      {/* Section description */}
      <Paper className="p-4 rounded-lg mb-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold">Description de l'activité</h2>
          {!isEditing && (
            <IconButton 
              onClick={handleEditClick}
              size="small"
              color="primary"
              aria-label="edit"
            >
              <EditIcon fontSize="small" />
            </IconButton>
          )}
        </div>
        
        {isEditing ? (
          <TextField
            value={content}
            onChange={(e) => setContent(e.target.value)}
            multiline
            rows={4}
            variant="outlined"
            fullWidth
            placeholder="Description de l'activité (facultative)"
            size="small"
          />
        ) : activity.content ? (
          <div className="bg-gray-50 p-3 rounded border border-gray-200 whitespace-pre-wrap">
            {activity.content}
          </div>
        ) : (
          <div className="bg-gray-50 p-3 rounded border border-gray-200 text-gray-500 italic">
            Aucune description fournie
          </div>
        )}
      </Paper>

      {/* Section Barème - Compact version */}
      <Paper className="p-4 rounded-lg mb-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <BarChartIcon className="mr-2 text-blue-500" />
            <h2 className="text-xl font-semibold">Barème de notation</h2>
          </div>
          {!isEditing && (
            <IconButton 
              onClick={handleEditClick}
              size="small"
              color="primary"
              aria-label="edit"
            >
              <EditIcon fontSize="small" />
            </IconButton>
          )}
        </div>

        {isEditing ? (
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <div className="flex flex-col md:flex-row gap-4 mb-2">
              <div className="flex-1">
                <TextField
                  label="Points partie expérimentale"
                  type="number"
                  InputProps={{ inputProps: { min: 0, max: 20 } }}
                  value={experimentalPoints}
                  onChange={(e) => handlePointsChange(e, setExperimentalPoints, theoreticalPoints, true)}
                  variant="outlined"
                  size="small"
                  fullWidth
                />
              </div>
              <div className="flex-1">
                <TextField
                  label="Points partie théorique"
                  type="number"
                  InputProps={{ inputProps: { min: 0, max: 20 } }}
                  value={theoreticalPoints}
                  onChange={(e) => handlePointsChange(e, setTheoreticalPoints, experimentalPoints, false)}
                  variant="outlined"
                  size="small"
                  fullWidth
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Le total des points doit être égal à 20
              </div>
              <div className="font-medium">
                Total: <span className="font-bold">{experimentalPoints + theoreticalPoints}/20</span>
                {experimentalPoints + theoreticalPoints !== 20 && (
                  <span className="text-red-500 ml-2">(Ajustez pour obtenir un total de 20)</span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-3 rounded border border-gray-200">
                <p className="text-gray-700 font-medium">Partie expérimentale:</p>
                <p className="text-2xl font-bold text-blue-600">{activity.experimental_points || 5} points</p>
              </div>
              <div className="bg-white p-3 rounded border border-gray-200">
                <p className="text-gray-700 font-medium">Partie théorique:</p>
                <p className="text-2xl font-bold text-blue-600">{activity.theoretical_points || 15} points</p>
              </div>
            </div>

            <div className="text-right mt-3">
              <p className="text-gray-700">
                <span className="font-medium">Total:</span>{" "}
                <span className="font-bold">
                  {(activity.experimental_points || 5) + (activity.theoretical_points || 15)} points
                </span>
              </p>
            </div>
          </div>
        )}
      </Paper>

      {/* Section Fragments et Corrections */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* Corrections */}
        <div className="w-full lg:w-2/3">
          <Paper className="p-4 shadow mb-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Corrections</h2>
              
              {!isEditing && (
                <div className="flex space-x-2">
                  <IconButton
                    onClick={handleNewCorrectionClick}
                    color="primary"
                    size="medium"
                    title="Nouvelle correction"
                  >
                    <AddIcon />
                  </IconButton>
                
                </div>
              )}
            </div>

            {corrections.length === 0 ? (
              <div className="bg-gray-50 p-4 rounded border border-gray-200 text-center">
                <Typography color="textSecondary">
                  Aucune correction pour cette activité.
                </Typography>
                {!isEditing && (
                  <Button
                    onClick={handleNewCorrectionClick}
                    variant="contained" 
                    color="primary"
                    size="small"
                    className="mt-3"
                    startIcon={<AddIcon />}
                  >
                    Créer une correction
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                {corrections.map((correction) => (
                  <div key={correction.id} className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-col gap-2 mb-2">
                      <h3 className="font-semibold">
                      {correction.student_name || `${activity.name} - Sans nom`}
                      </h3>
                      <p className="text-sm text-gray-500">
                      Créée le {new Date(correction.created_at!).toLocaleString('fr-FR')}
                      </p>
                    <Button
                      component={Link}
                      href={`/corrections/${correction.id}`}
                      variant="outlined"
                      size="small"
                      className="mt-2"
                      >
                      Éditer la correction
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Paper>
        </div>

        {/* Fragments */}
        <div className="w-full lg:w-1/3">
          <Paper className="p-4 shadow mb-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-semibold">Fragments</h2>
              
              {!isEditing && (
                <IconButton
                  onClick={handleFragmentsClick}
                  color="success"
                  size="medium"
                  title="Gérer les fragments"
                >
                  <ArticleIcon />
                </IconButton>
              )}
            </div>
            <Typography variant="body2" color="textSecondary">
              Les fragments sont des morceaux de texte réutilisables pour vos corrections.
            </Typography>
          </Paper>
        </div>
      </div>
    </div>
  );
}
