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
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';
import Link from 'next/link';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SaveIcon from '@mui/icons-material/Save';
import HomeIcon from '@mui/icons-material/Home';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import {Student} from '@/lib/types'


export default function NewCorrection({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap the Promise for params using React.use
  const { id } = React.use(params);
  const activityId = id;
  
  const [studentId, setStudentId] = useState<number | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(true);
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
    
    const fetchStudents = async () => {
      try {
        setStudentsLoading(true);
        const response = await fetch('/api/students');
        if (!response.ok) throw new Error('Erreur lors du chargement des étudiants');
        const data = await response.json();
        setStudents(data);
      } catch (err) {
        console.error('Erreur:', err);
        // Ne pas définir d'erreur pour ne pas bloquer l'interface
      } finally {
        setStudentsLoading(false);
      }
    };

    fetchActivity();
    fetchStudents();
  }, [activityId]);

  const handleStudentChange = (event: SelectChangeEvent<number>) => {
    setStudentId(event.target.value as number);
  };

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
          student_id: studentId,
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
              Ajouter une correction
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
                <FormControl fullWidth>
                  <InputLabel id="student-select-label">Étudiant</InputLabel>
                  <Select
                    labelId="student-select-label"
                    id="student-select"
                    value={studentId || ''}
                    onChange={handleStudentChange}
                    label="Étudiant"
                    startAdornment={<PersonAddIcon className="mr-2 text-gray-400" />}
                    disabled={studentsLoading}
                  >
                    <MenuItem value="">
                      <em>Aucun étudiant sélectionné</em>
                    </MenuItem>
                    {students.map((student) => (
                      <MenuItem key={student.id} value={student.id}>
                        {student.first_name} {student.last_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Typography variant="caption" className="text-gray-500 mt-1 block">
                  Sélectionnez un étudiant pour cette correction ou laissez vide
                </Typography>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-100">
                <Typography variant="body2" >
                  <strong>Information :</strong> Après avoir ajouté la correction, vous pourrez ajouter le contenu détaillé, les notes et les dates de rendu.
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
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto"
                >
                    {isSubmitting ? (
                    <>
                      <HourglassEmptyIcon className="mr-1" />
                      En cours ...
                    </>
                    ) : (
                    <SaveIcon />
                    )}
                </Button>
              </div>
            </form>
          </Box>
        </Paper>
      </div>
    </div>
  );
}
