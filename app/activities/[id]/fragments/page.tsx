'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Activity } from '@/lib/activity';
import { Fragment } from '@/lib/fragment';
import {
  Button,
  CircularProgress,
  IconButton,
  TextField,
  Paper,
  Typography,
  Card,
  CardContent,
  CardActions,
  Divider,
  Alert,
  Box
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Add as AddIcon
} from '@mui/icons-material';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function ActivityFragments({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap the Promise for params using React.use
  const { id } = React.use(params);
  const activityId = id;
  
  const [activity, setActivity] = useState<Activity | null>(null);
  const [fragments, setFragments] = useState<Fragment[]>([]);
  const [newFragmentContent, setNewFragmentContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [deletingIds, setDeletingIds] = useState<number[]>([]);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [editingFragmentId, setEditingFragmentId] = useState<number | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [savingFragment, setSavingFragment] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch activity details
        const activityResponse = await fetch(`/api/activities/${activityId}`);
        if (!activityResponse.ok) {
          throw new Error('Erreur lors du chargement de l\'activité');
        }
        const activityData = await activityResponse.json();
        setActivity(activityData);

        // Fetch fragments
        const fragmentsResponse = await fetch(`/api/activities/${activityId}/fragments`);
        if (!fragmentsResponse.ok) {
          throw new Error('Erreur lors du chargement des fragments');
        }
        const fragmentsData = await fragmentsResponse.json();
        setFragments(fragmentsData);
      } catch (err) {
        console.error('Erreur:', err);
        setError('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activityId]);

  const handleAddFragment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFragmentContent.trim()) return;

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/fragments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activity_id: activityId,
          content: newFragmentContent.trim()
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'ajout du fragment');
      }

      const newFragment = await response.json();
      setFragments([...fragments, newFragment]);
      setNewFragmentContent('');
      setSuccessMessage('Fragment ajouté avec succès');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors de l\'ajout du fragment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteFragment = async (fragmentId: number) => {
    setDeletingIds(prev => [...prev, fragmentId]);
    setPendingDeleteId(null);
    try {
      const response = await fetch(`/api/fragments/${fragmentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression du fragment');
      }

      setFragments(fragments.filter(fragment => fragment.id !== fragmentId));
      setSuccessMessage('Fragment supprimé');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors de la suppression du fragment');
    } finally {
      setDeletingIds(prev => prev.filter(id => id !== fragmentId));
    }
  };

  const handleEditFragment = (fragment: Fragment) => {
    setEditingFragmentId(fragment.id || null);
    setEditedContent(fragment.content);
  };

  const handleCancelEdit = () => {
    setEditingFragmentId(null);
    setEditedContent('');
  };

  const handleSaveFragment = async () => {
    if (!editingFragmentId) return;
    
    setSavingFragment(true);
    setError('');

    try {
      const response = await fetch(`/api/fragments/${editingFragmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: editedContent }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour du fragment');
      }

      const updatedFragment = await response.json();
      
      setFragments(fragments.map(fragment => 
        fragment.id === editingFragmentId ? updatedFragment : fragment
      ));

      setEditingFragmentId(null);
      setEditedContent('');
      setSuccessMessage('Fragment mis à jour');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors de la mise à jour du fragment');
    } finally {
      setSavingFragment(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <LoadingSpinner size="lg" text="Chargement des fragments" />
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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header avec navigation */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center mb-2">
            <Button
              component={Link}
              href={`/activities/${activityId}`}
              startIcon={<ArrowBackIcon />}
              color="primary"
              variant="text"
              size="small"
            >
              Retour à l'activité
            </Button>
          </div>
          <h1 className="text-3xl font-bold">Fragments pour {activity.name}</h1>
        </div>
      </div>

      {/* Messages d'erreur et de succès */}
      {error && (
        <Alert severity="error" className="mb-4" onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      
      {successMessage && (
        <Alert severity="success" className="mb-4" onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      )}

      {/* Section d'ajout de fragment */}
      <Paper className="p-4 mb-6 shadow-sm">
        <Typography variant="h6" className="mb-3 flex items-center">
          <AddIcon fontSize="small" className="mr-1" />
          Ajouter un fragment
        </Typography>
        
        <form onSubmit={handleAddFragment}>
          <TextField
            value={newFragmentContent}
            onChange={(e) => setNewFragmentContent(e.target.value)}
            className="w-full mb-3"
            multiline
            rows={3}
            placeholder="Contenu du fragment..."
            variant="outlined"
            size="small"
            required
          />
          
          <div className="flex justify-end mt-2">
            <IconButton
              type="submit"
              color="success"
              size="medium"
              disabled={submitting || !newFragmentContent.trim()}
              title="Ajouter le fragment"
            >
              {submitting ? <CircularProgress size={24} /> : <AddIcon />}
            </IconButton>
          </div>
        </form>
      </Paper>

      {/* Liste des fragments */}
      <Paper className="p-4 shadow-sm">
        <Typography variant="h6" className="mb-4 pb-2 border-b">
          Fragments existants ({fragments.length})
        </Typography>
        
        {fragments.length === 0 ? (
          <div className="bg-gray-50 p-4 text-center rounded-md">
            <Typography color="textSecondary">
              Aucun fragment pour cette activité.
            </Typography>
          </div>
        ) : (
          <div className="space-y-4">
            {fragments.map((fragment) => (
              <Card 
                key={fragment.id} 
                variant="outlined" 
                className="relative hover:shadow-md transition-shadow"
              >
                {editingFragmentId === fragment.id ? (
                  <Box className="p-3">
                    <TextField
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      className="w-full mb-2"
                      multiline
                      rows={3}
                      variant="outlined"
                      size="small"
                      autoFocus
                    />
                    <div className="flex justify-end space-x-2">
                      <IconButton
                        onClick={handleSaveFragment}
                        color="primary"
                        size="small"
                        disabled={savingFragment}
                        title="Sauvegarder les modifications"
                      >
                        {savingFragment ? <CircularProgress size={16} /> : <SaveIcon fontSize="small" />}
                      </IconButton>
                      <IconButton
                        onClick={handleCancelEdit}
                        color="error"
                        size="small"
                        title="Annuler les modifications"
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </div>
                  </Box>
                ) : (
                  <>
                    <CardContent className="pb-1 whitespace-pre-wrap">
                      {fragment.content}
                    </CardContent>
                    <Divider />
                    <CardActions className="flex justify-end bg-gray-50">
                      <IconButton
                        onClick={() => handleEditFragment(fragment)}
                        color="primary"
                        size="small"
                        title="Modifier"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      
                      {pendingDeleteId === fragment.id ? (
                        <>
                          <IconButton
                            onClick={() => {
                              fragment.id && handleDeleteFragment(fragment.id);
                            }}
                            color="success"
                            size="small"
                            title="Confirmer la suppression"
                          >
                            <CheckIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            onClick={() => setPendingDeleteId(null)}
                            color="inherit"
                            size="small"
                            title="Annuler la suppression"
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </>
                      ) : (
                        <IconButton
                          onClick={() => fragment.id && setPendingDeleteId(fragment.id)}
                          color="error"
                          size="small"
                          title="Supprimer ce fragment"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </CardActions>
                  </>
                )}
                {typeof fragment.id === 'number' && deletingIds.includes(fragment.id) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
                    <CircularProgress size={24} />
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </Paper>
    </div>
  );
}
