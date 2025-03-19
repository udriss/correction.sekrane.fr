'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Activity } from '@/lib/activity';
import { 
  Paper, 
  Typography, 
  Box, 
  Alert, 
  CircularProgress, 
  TextField,
  Button,
  IconButton
} from '@mui/material';
import Link from 'next/link';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SaveIcon from '@mui/icons-material/Save';
import HomeIcon from '@mui/icons-material/Home';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

export default function NewCorrection({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap the Promise for params using React.use
  const { id } = React.use(params);
  const activityId = id;
  
  const [studentName, setStudentName] = useState('');
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const response = await fetch(`/api/activities/${activityId}`);
        if (!response.ok) throw new Error('Erreur lors du chargement de l\'activité');
        const data = await response.json();
        setActivity(data);
      } catch (err) {
        console.error('Erreur:', err);
        setError('Erreur lors du chargement de l\'activité');
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [activityId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/activities/${activityId}/corrections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          student_name: studentName.trim() || null,
          content: '' 
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la création de la correction');
      }

      const data = await response.json();
      router.push(`/corrections/${data.id}`);
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors de la création de la correction');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-4xl w-full flex justify-center py-16">
          <CircularProgress size={40} />
        </div>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
        <div className="max-w-4xl w-full">
          <Paper 
            elevation={2} 
            sx={{ p: 4, borderRadius: 2 }}
            className="border-l-4 border-yellow-500"
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <ErrorOutlineIcon color="warning" fontSize="large" />
              <Typography variant="h5" color="warning.main" className="font-bold">
                Activité non trouvée
              </Typography>
            </Box>
            <Alert severity="warning" sx={{ mb: 3 }}>
              L'activité demandée n'existe pas ou a été supprimée.
            </Alert>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<ArrowBackIcon />}
              component={Link}
              href="/"
            >
              Retour à l'accueil
            </Button>
          </Paper>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8 text-center">
          <Typography variant="h4" component="h1" className="font-bold text-blue-800 mb-2">
            Nouvelle correction
          </Typography>
          <Typography variant="subtitle1" className="text-gray-600">
            {activity.name}
          </Typography>
        </div>
        
        <Paper 
          elevation={2} 
          className="rounded-lg overflow-hidden shadow-md"
        >
          {/* En-tête du formulaire */}
          <Box className="bg-purple-600 p-4 text-white flex justify-between items-center">
            <div className="flex items-center gap-2">
              <AssignmentIcon />
              <Typography variant="h6">
                Créer une correction
              </Typography>
            </div>
            <IconButton 
              component={Link}
              href="/"
              size="small"
              className="text-white"
              aria-label="retour à l'accueil"
            >
              <HomeIcon />
            </IconButton>
          </Box>
          
          <Box className="p-6">
            {error && (
              <Alert severity="error" className="mb-6" variant="outlined">
                {error}
              </Alert>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <TextField
                  id="studentName"
                  label="Nom de l'étudiant (facultatif)"
                  variant="outlined"
                  fullWidth
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder={`${activity.name} - [horodatage sera ajouté automatiquement]`}
                  InputProps={{
                    startAdornment: <PersonAddIcon className="mr-2 text-gray-400" />,
                  }}
                  className="bg-white"
                />
                <Typography variant="caption" className="text-gray-500 mt-1 block">
                  Si non spécifié, la correction sera identifiée uniquement par l'horodatage
                </Typography>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-100">
                <Typography variant="body2" className="text-blue-800">
                  <strong>Information :</strong> Après avoir créé la correction, vous pourrez ajouter le contenu détaillé, les notes et les dates de rendu.
                </Typography>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
                <Button
                  variant="text"
                  color="inherit"
                  startIcon={<ArrowBackIcon />}
                  component={Link}
                  href={`/activities/${activityId}`}
                  className="text-gray-600 hover:text-purple-600"
                >
                  Retour à l'activité
                </Button>
                
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<SaveIcon />}
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto"
                >
                  {isSubmitting ? 'Création en cours...' : 'Créer la correction'}
                </Button>
              </div>
            </form>
          </Box>
        </Paper>
      </div>
    </div>
  );
}
