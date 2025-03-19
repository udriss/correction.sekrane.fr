'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Activity } from '@/lib/activity';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Button, Box, Typography, Alert, IconButton } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RateReviewIcon from '@mui/icons-material/RateReview';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { useRouter } from 'next/navigation';

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await fetch('/api/activities');
        
        if (response.status === 401) {
          // Redirection gérée par le middleware
          return;
        }
        
        if (!response.ok) {
          throw new Error('Erreur lors du chargement des activités');
        }
        
        const data = await response.json();
        setActivities(data);
      } catch (error) {
        console.error('Erreur:', error);
        setError('Une erreur est survenue lors du chargement des activités.');
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  const handleDeleteClick = (activityId: number) => {
    setConfirmingDelete(activityId);
  };

  const handleCancelDelete = () => {
    setConfirmingDelete(null);
  };

  const handleConfirmDelete = async (activityId: number) => {
    try {
      const response = await fetch(`/api/activities/${activityId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      // Mettre à jour la liste d'activités sans rechargement
      setActivities(activities.filter(activity => activity.id !== activityId));
      setConfirmingDelete(null);
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors de la suppression de l\'activité');
      setConfirmingDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-3 text-blue-800">Corrections d'activités</h1>
          <p className="text-xl text-gray-600">Plateforme de gestion des activités pédagogiques</p>
        </header>
        
        <div className="flex justify-center mb-8">
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            component={Link}
            href="/activities/new"
            size="large"
            className="py-2 px-4"
          >
            Nouvelle activité
          </Button>
        </div>

        {loading ? (
          <div className="py-10 flex justify-center">
            <LoadingSpinner text="Chargement des activités" />
          </div>
        ) : error ? (
          <Box mb={4}>
            <Alert severity="error">{error}</Alert>
          </Box>
        ) : activities.length === 0 ? (
          <Box textAlign="center" my={8}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Aucune activité trouvée
            </Typography>
            <Typography variant="body1" color="text.secondary" mb={4}>
              Commencez par une nouvelle activité.
            </Typography>
          </Box>
        ) : (
          <div className="space-y-6">
            {activities.map((activity) => (
              <div key={activity.id} className="bg-white border rounded-xl p-6 shadow-md hover:shadow-lg transition">
                <div className="flex justify-between items-start">
                  <h2 className="text-2xl font-semibold mb-3 text-gray-800">{activity.name}</h2>
                  
                  {/* Boutons de suppression avec confirmation */}
                  <div>
                    {confirmingDelete === activity.id ? (
                      <div className="flex space-x-1">
                        <IconButton
                          onClick={() => handleConfirmDelete(activity.id!)}
                          color="success"
                          size="small"
                          title="Confirmer la suppression"
                        >
                          <CheckIcon />
                        </IconButton>
                        <IconButton
                          onClick={handleCancelDelete}
                          color="inherit"
                          size="small"
                          title="Annuler la suppression"
                        >
                          <CloseIcon />
                        </IconButton>
                      </div>
                    ) : (
                      <IconButton
                        onClick={() => handleDeleteClick(activity.id!)}
                        color="error"
                        size="small"
                        title="Supprimer cette activité"
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3 mt-4">
                  <Button 
                    variant="outlined" 
                    color="primary" 
                    href={`/activities/${activity.id}`} 
                    component={Link}
                    startIcon={<VisibilityIcon />}
                  >
                    Voir détails
                  </Button>
                  <Button 
                    variant="outlined" 
                    color="secondary" 
                    href={`/activities/${activity.id}/corrections/new`} 
                    component={Link}
                    startIcon={<RateReviewIcon />}
                  >
                    Nouvelle correction
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
