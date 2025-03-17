'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Activity } from '@/lib/activity';
import { Correction } from '@/lib/correction';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Button, IconButton } from '@mui/material';
import { Edit as EditIcon, Save as SaveIcon, Close as CloseIcon, Delete as DeleteIcon, Article as ArticleIcon, Add as AddIcon } from '@mui/icons-material';


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
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Le nom de l\'activité est requis');
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
        body: JSON.stringify({ name, content }),
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

  const handleDelete = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette activité et toutes ses corrections ?')) {
      return;
    }

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
    }
  };

  const handleFragmentsClick = () => {
    router.push(`/activities/${activityId}/fragments`);
  };

  const handleNewCorrectionClick = () => {
    router.push(`/activities/${activityId}/corrections/new`);
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
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">{error}</div>
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
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        {isEditing ? (
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        ) : (
          <h1 className="text-3xl font-bold flex items-center">
            {activity.name}
            <IconButton 
              onClick={handleEditClick}
              size="small"
              color="primary"
              aria-label="edit"
            >
              <EditIcon />
            </IconButton>
          </h1>
        )}

        {isEditing ? (
          <div>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              variant="contained"
              color="primary"
              className="mr-2"
            >
              <SaveIcon sx={{ mr: 0.2 }} />
              Enregistrer
            </Button>
            <Button
              onClick={handleCancelClick}
              variant="outlined"
              color="secondary"
            >
              <CloseIcon sx={{ mr: 0.2 }} />
              Annuler
            </Button>
          </div>
        ) : null}
      </div>

      {activity.content && !isEditing ? (
        <div className="bg-gray-50 p-4 rounded-lg mb-8">
          <h2 className="text-xl font-semibold mb-2">Description de l'activité</h2>
          <div className="whitespace-pre-wrap">{activity.content}</div>
        </div>
      ) : isEditing && (
        <div className="mb-6">
          <label htmlFor="content" className="block text-gray-700 font-medium mb-2">
            Contenu (facultatif)
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Fragments d'activité</h2>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Corrections</h2>
          
          {!isEditing && (
            <div className="flex space-x-2">
              <Button
                onClick={handleFragmentsClick}
                variant="contained"
                color="success"
              >
                <ArticleIcon sx={{ mr: 0.2 }} />
                Gérer les fragments
              </Button>
              <Button
                onClick={handleNewCorrectionClick}
                variant="contained"
                color="secondary"
              >
                <AddIcon sx={{ mr: 0.2 }} />
                Nouvelle correction
              </Button>
              <Button
                onClick={handleDelete}
                variant="contained"
                color="error"
              >
                <DeleteIcon sx={{ mr: 0.2 }} />
                Supprimer
              </Button>
            </div>
          )}
        </div>

        {corrections.length === 0 ? (
          <p className="text-gray-600">Aucune correction pour cette activité.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {corrections.map((correction) => (
              <div key={correction.id} className="border rounded-lg p-4 shadow">
                <h3 className="font-semibold mb-2">
                  {correction.student_name || `${activity.name} - Sans nom`}
                </h3>
                <p className="text-sm text-gray-500">
                  Créée le {new Date(correction.created_at!).toLocaleString('fr-FR')}
                </p>
                <Button
                  component={Link}
                  href={`/corrections/${correction.id}`}
                  variant="contained"
                  size="small"
                  className="mt-3"
                >
                  Éditer la correction
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
