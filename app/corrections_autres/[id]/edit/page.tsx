'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSnackbar } from 'notistack';
import { ActivityAutre, CorrectionAutre, Student } from '@/lib/types';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Divider,
  Switch,
  FormControlLabel,
  Grid,
  Chip,
  Tooltip,
  Alert
} from '@mui/material';
import LoadingSpinner from '@/components/LoadingSpinner';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Link from 'next/link';
import GradientBackground from '@/components/ui/GradientBackground';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ScienceIcon from '@mui/icons-material/Science';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';


export default function EditCorrectionAutrePage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap the Promise for params using React.use in client components
  const { id } = React.use(params);
  const correctionId = parseInt(id);

  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();

  const [correction, setCorrection] = useState<CorrectionAutre | null>(null);
  const [activity, setActivity] = useState<ActivityAutre | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  
  // Form fields
  const [studentId, setStudentId] = useState<number | null>(null);
  const [classId, setClassId] = useState<number | null>(null);
  const [pointsEarned, setPointsEarned] = useState<number[]>([]);
  const [comments, setComments] = useState('');
  const [submissionDate, setSubmissionDate] = useState<string>('');
  const [penalty, setPenalty] = useState<number | ''>('');
  const [deadline, setDeadline] = useState<string>('');
  const [active, setActive] = useState<number>(1);
  
  // Validation errors
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  // Calculate total points earned and percentage
  const totalPointsEarned = pointsEarned.reduce((sum, points) => sum + points, 0);
  const totalPossiblePoints = activity?.points.reduce((sum, points) => sum + points, 0) || 0;
  const percentage = totalPossiblePoints > 0 ? (totalPointsEarned / totalPossiblePoints) * 100 : 0;
  const grade = totalPossiblePoints > 0 ? (totalPointsEarned / totalPossiblePoints) * 20 : 0;
  
  useEffect(() => {
    const fetchCorrectionDetails = async () => {
      try {
        setLoading(true);
        
        // Fetch correction details
        const correctionResponse = await fetch(`/api/corrections_autres/${correctionId}`);
        if (!correctionResponse.ok) {
          throw new Error('Erreur lors du chargement de la correction');
        }
        const correctionData = await correctionResponse.json();
        setCorrection(correctionData);
        
        // Set form fields
        setStudentId(correctionData.student_id);
        setClassId(correctionData.class_id);
        setPointsEarned(correctionData.points_earned);
        setComments(correctionData.content || '');
        setSubmissionDate(correctionData.submission_date?.split('T')[0] || '');
        setPenalty(correctionData.penalty !== null ? correctionData.penalty : '');
        setDeadline(correctionData.deadline?.split('T')[0] || '');
        setActive(correctionData.active !== undefined ? correctionData.active : 1);
        
        // Fetch activity details
        const activityResponse = await fetch(`/api/activities_autres/${correctionData.activity_id}`);
        if (!activityResponse.ok) {
          throw new Error('Erreur lors du chargement de l\'activité');
        }
        const activityData = await activityResponse.json();
        setActivity(activityData);
        
        // Fetch students
        const studentsResponse = await fetch('/api/students');
        if (!studentsResponse.ok) {
          throw new Error('Erreur lors du chargement des étudiants');
        }
        const studentsData = await studentsResponse.json();
        setStudents(studentsData);
        
      } catch (err) {
        console.error('Erreur:', err);
        setError(`Erreur: ${(err as Error).message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCorrectionDetails();
  }, [correctionId]);
  
  const handlePointsChange = (index: number, value: string) => {
    const newPointsEarned = [...pointsEarned];
    const numericValue = parseFloat(value);
    
    // Check if the value is a valid number
    if (isNaN(numericValue)) {
      newPointsEarned[index] = 0;
    } else {
      // Ensure the points don't exceed the maximum for this part
      const maxPoints = activity?.points[index] || 0;
      newPointsEarned[index] = Math.min(Math.max(0, numericValue), maxPoints);
    }
    
    setPointsEarned(newPointsEarned);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    const newErrors: {[key: string]: string} = {};
    
    if (!validateForm(newErrors)) {
      setErrors(newErrors);
      return;
    }
    
    setSubmitting(true);
    try {
      const response = await fetch(`/api/corrections_autres/${correctionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: studentId,
          class_id: classId,
          points_earned: pointsEarned,
          content: comments,
          submission_date: submissionDate || null,
          penalty: penalty === '' ? null : penalty,
          deadline: deadline || null,
          active: active
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la mise à jour de la correction');
      }
      
      const data = await response.json();
      
      enqueueSnackbar('Correction mise à jour avec succès', { variant: 'success' });
      router.push(`/corrections_autres/${correctionId}`);
    } catch (error) {
      console.error('Erreur:', error);
      enqueueSnackbar(`Erreur: ${(error as Error).message}`, { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };
  
  const validateForm = (newErrors: {[key: string]: string}) => {
    let isValid = true;
    
    // Add validation rules as needed
    if (pointsEarned.some(points => points < 0)) {
      newErrors.points = 'Les points ne peuvent pas être négatifs';
      isValid = false;
    }
    
    if (penalty !== '' && (isNaN(Number(penalty)) || Number(penalty) < 0)) {
      newErrors.penalty = 'La pénalité doit être un nombre positif';
      isValid = false;
    }
    
    return isValid;
  };

  if (loading) {
    return (
      <div className="container max-w-[400px] mx-auto px-4 py-8 flex justify-center">
        <LoadingSpinner size="lg" text="Chargement des données" />
      </div>
    );
  }
  
  if (error) {
    return (
      <Container maxWidth="md" className="py-8">
        <Paper className="p-6">
          <Alert severity="error">
            {error}
          </Alert>
          <Button 
            variant="outlined" 
            component={Link} 
            href="/activities_autres" 
            className="mt-4"
          >
            Retour aux activités
          </Button>
        </Paper>
      </Container>
    );
  }
  
  if (!correction || !activity) {
    return (
      <Container maxWidth="md" className="py-8">
        <Paper className="p-6">
          <Alert severity="warning">
            Correction non trouvée
          </Alert>
          <Button 
            variant="outlined" 
            component={Link} 
            href="/activities_autres" 
            className="mt-4"
          >
            Retour aux activités
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" className="py-8">
      <Paper elevation={3} className="p-6">
        <GradientBackground 
          variant="primary" 
          sx={{
            borderRadius: 2,
            py: 3,
            px: 3,
            mb: 4
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <IconButton
              color='primary'
              component={Link}
              href={`/corrections_autres/${correctionId}`}
              className="mr-2 bg-white/20 hover:bg-white/30"
            >
              <ArrowBackIcon sx={{ fontSize: 30, color: "primary" }} />
            </IconButton>
            <Typography variant="h5" fontWeight={700} color="text.primary">
              Modifier la correction
            </Typography>
          </Box>
          <Typography variant="subtitle1" color="text.secondary" sx={{ ml: 6 }}>
            {activity.name}
          </Typography>
        </GradientBackground>
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Afficher le récapitulatif du barème */}
            <Grid size={{ xs: 12 }}>
              <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  Barème 
                  <Tooltip title="Ce barème est défini dans l'activité">
                    <IconButton size="small" sx={{ ml: 0.5 }}>
                      <HelpOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {activity.parts_names.map((name, index) => (
                    <Chip 
                      key={index}
                      label={`${name}: ${activity.points[index]} pts`}
                      icon={index % 2 === 0 ? <MenuBookIcon /> : <ScienceIcon />}
                      color={index % 2 === 0 ? "primary" : "secondary"}
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Paper>
            </Grid>
            
            {/* Informations de base */}
            <Grid size={{ xs: 12, sm:6 }}>
              <FormControl fullWidth>
                <InputLabel>Étudiant (optionnel)</InputLabel>
                <Select
                  value={studentId || ''}
                  onChange={(e) => setStudentId(e.target.value === '' ? null : Number(e.target.value))}
                  label="Étudiant (optionnel)"
                >
                  <MenuItem value="">Aucun étudiant</MenuItem>
                  {students.map(student => (
                    <MenuItem key={student.id} value={student.id}>
                      {student.first_name} {student.last_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid size={{ xs: 12, sm:6 }}>
              <FormControl fullWidth>
                <InputLabel>Classe (optionnel)</InputLabel>
                <Select
                  value={classId || ''}
                  onChange={(e) => setClassId(e.target.value === '' ? null : Number(e.target.value))}
                  label="Classe (optionnel)"
                >
                  <MenuItem value="">Aucune classe</MenuItem>
                  {/* Ici vous pourriez ajouter une liste de classes si nécessaire */}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={active === 1}
                    onChange={(e) => setActive(e.target.checked ? 1 : 0)}
                    color="primary"
                  />
                }
                label="Correction active"
              />
            </Grid>
            
            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 2 }}>
                <Chip label="Attribution des points" />
              </Divider>
            </Grid>
            
            {/* Points par partie */}
            {activity.parts_names.map((partName, index) => (
              <Grid size={{ xs: 12, sm:6 }} key={index}>
                <TextField
                  fullWidth
                  label={`Points pour ${partName}`}
                  type="number"
                  value={pointsEarned[index]}
                  onChange={(e) => handlePointsChange(index, e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ 
                        mr: 1, 
                        color: index % 2 === 0 ? 'primary.main' : 'secondary.main',
                        display: 'flex',
                        alignItems: 'center'
                      }}>
                        {index % 2 === 0 ? <MenuBookIcon /> : <ScienceIcon />}
                      </Box>
                    ),
                    endAdornment: (
                      <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                        / {activity.points[index]} pts
                      </Typography>
                    ),
                  }}
                  inputProps={{ 
                    min: 0, 
                    max: activity.points[index],
                    step: 0.25
                  }}
                  error={!!errors.points}
                  helperText={errors.points}
                />
              </Grid>
            ))}
            
            {/* Résumé des points */}
            <Grid size={{ xs: 12 }}>
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 2, 
                  mt: 2, 
                  bgcolor: 'background.default',
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                  Résumé
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Points totaux:</Typography>
                    <Typography fontWeight="bold">
                      {totalPointsEarned} / {totalPossiblePoints} pts ({percentage.toFixed(1)}%)
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Note estimée:</Typography>
                    <Typography fontWeight="bold" color="primary.main">
                      {grade.toFixed(2)} / 20
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
            
            {/* Commentaires et options avancées */}
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Commentaires"
                multiline
                rows={4}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
              />
            </Grid>
            
            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 2 }}>
                <Chip label="Options avancées" />
              </Divider>
            </Grid>
            
            <Grid size={{ xs: 12, sm:4 }}>
              <TextField
                fullWidth
                label="Date de soumission"
                type="date"
                value={submissionDate}
                onChange={(e) => setSubmissionDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid size={{ xs: 12, sm:4 }}>
              <TextField
                fullWidth
                label="Pénalité"
                type="number"
                value={penalty}
                onChange={(e) => setPenalty(e.target.value === '' ? '' : parseFloat(e.target.value))}
                inputProps={{ step: 0.5 }}
                error={!!errors.penalty}
                helperText={errors.penalty}
              />
            </Grid>
            
            <Grid size={{ xs: 12, sm:4 }}>
              <TextField
                fullWidth
                label="Date limite"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            {/* Boutons d'action */}
            <Grid size={{ xs: 12 }}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
                <Button
                  variant="outlined"
                  component={Link}
                  href={`/corrections_autres/${correctionId}`}
                >
                  Annuler
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  type="submit"
                  disabled={submitting}
                >
                  {submitting ? <LoadingSpinner size="sm" /> : 'Enregistrer les modifications'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
}