'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Container, 
  Paper, 
  Typography, 
  Box, 
  Button, 
  Card, 
  CardContent, 
  CardActions,
  IconButton, 
  Tooltip, 
  Chip, 
  Divider, 
  LinearProgress,
  Alert,
  Grid,
  alpha,
  Skeleton
} from '@mui/material';
import GradientBackground from '@/components/ui/GradientBackground';
import PatternBackground from '@/components/ui/PatternBackground';
import ErrorDisplay from '@/components/ui/ErrorDisplay';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import StudentEditDialog from '@/components/students/StudentEditDialog';

// Icons
import PersonIcon from '@mui/icons-material/Person';
import EditIcon from '@mui/icons-material/Edit';
import ShareIcon from '@mui/icons-material/Share';
import EmailIcon from '@mui/icons-material/Email';
import BookIcon from '@mui/icons-material/Book';
import SchoolIcon from '@mui/icons-material/School';
import GradeIcon from '@mui/icons-material/Grade';
import AssignmentIcon from '@mui/icons-material/Assignment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import EqualizerIcon from '@mui/icons-material/Equalizer';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ScienceIcon from '@mui/icons-material/Science';
import MenuBookIcon from '@mui/icons-material/MenuBook';

// Types
interface Student {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  className?: string;
  classId?: number;
  gender?: 'M' | 'F' | 'N';
  group?: string;
}

interface Correction {
  id: number;
  activity_id: number;
  activity_name: string;
  student_id: number;
  class_id: number;
  class_name: string;
  submission_date: string;
  grade: string | number; // Peut être renvoyé comme string par l'API
  content?: string;
  content_data?: any; // Un objet déjà parsé par l'API
  experimental_points: number;
  theoretical_points: number;
  experimental_points_earned: string | number;
  theoretical_points_earned: string | number;
  penalty: string | number;
  deadline: string;
  group_id: number;
  student_name: string;
  student_first_name: string;
  student_last_name: string;
  created_at: string;
  updated_at: string;
  max_points?: number; // Calculé côté client
  score_percentage?: number; // Calculé côté client
  final_grade?: number | null; // Note finale calculée côté client
}

interface StudentStats {
  total_corrections: number;
  average_grade: number | null;
  highest_grade: number | null;
  lowest_grade: number | null;
  total_experimental_points: number;
  total_theoretical_points: number;
  average_experimental_points: number;
  average_theoretical_points: number;
  recent_corrections: {
    id: number;
    activity_name: string;
    grade: number;
    submission_date: string;
  }[];
  grade_trend?: 'up' | 'down' | 'stable';
}

export default function StudentCorrectionsPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params?.id;
  
  const [student, setStudent] = useState<Student | null>(null);
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string>('');
  
  // États pour la gestion de l'édition d'étudiant
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedClasses, setSelectedClasses] = useState<{id: number, name: string}[]>([]);
  const [availableSubgroups, setAvailableSubgroups] = useState<string[]>([]);
  const [loadingSubgroups, setLoadingSubgroups] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [errorDetails, setErrorDetails] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!studentId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Récupérer les informations de l'étudiant
        const studentResponse = await fetch(`/api/students/${studentId}`);
        if (!studentResponse.ok) {
          setError('Étudiant non trouvé');
          setErrorDetails({
            status: studentResponse.status,
            statusText: studentResponse.statusText
          });
          setLoading(false);
          return;
        }
        const studentData = await studentResponse.json();
        setStudent(studentData);
        
        // Récupérer toutes les classes pour le dialog d'édition
        const classesResponse = await fetch('/api/classes');
        if (classesResponse.ok) {
          const classesData = await classesResponse.json();
          setClasses(classesData);
        }
        
        // Récupérer les corrections de l'étudiant
        const correctionsResponse = await fetch(`/api/students/${studentId}/corrections`);
        if (!correctionsResponse.ok) {
          setError('Erreur lors du chargement des corrections');
          setErrorDetails({
            status: correctionsResponse.status,
            statusText: correctionsResponse.statusText
          });
          setLoading(false);
          return;
        }
        const correctionsData = await correctionsResponse.json();
        
        // Enrichir les corrections avec le pourcentage de score et les points max
        const enrichedCorrections = correctionsData.map((correction: any) => {
          // S'assurer que les valeurs numériques sont traitées comme des nombres
          const grade = typeof correction.grade === 'string' ? parseFloat(correction.grade) : correction.grade;
          const experimentalPoints = typeof correction.experimental_points === 'string' ? 
            parseFloat(correction.experimental_points) : correction.experimental_points;
          const theoreticalPoints = typeof correction.theoretical_points === 'string' ? 
            parseFloat(correction.theoretical_points) : correction.theoretical_points;
            
          const maxPoints = experimentalPoints + theoreticalPoints;
          const scorePercentage = maxPoints > 0 ? (grade / maxPoints) * 100 : 0;
          
          // Ne pas essayer de parser content_data car c'est déjà un objet
          return {
            ...correction,
            grade: grade,
            experimental_points: experimentalPoints,
            theoretical_points: theoreticalPoints,
            max_points: maxPoints,
            score_percentage: scorePercentage
          };
        });
        
        // Trier par date de soumission décroissante
        const sortedCorrections = enrichedCorrections.sort((a: Correction, b: Correction) => 
          new Date(b.submission_date).getTime() - new Date(a.submission_date).getTime()
        );
        
        setCorrections(sortedCorrections);
        
        // Récupérer les statistiques de l'étudiant
        const statsResponse = await fetch(`/api/students/${studentId}/stats`);
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          
          // Calculer la tendance des notes
          if (statsData.recent_corrections && statsData.recent_corrections.length >= 2) {
            const sortedCorrections = [...statsData.recent_corrections].sort(
              (a, b) => new Date(b.submission_date).getTime() - new Date(a.submission_date).getTime()
            );
            
            if (sortedCorrections.length >= 2) {
              const latestGrade = sortedCorrections[0].grade;
              const previousGrade = sortedCorrections[1].grade;
              
              if (latestGrade > previousGrade) {
                statsData.grade_trend = 'up';
              } else if (latestGrade < previousGrade) {
                statsData.grade_trend = 'down';
              } else {
                statsData.grade_trend = 'stable';
              }
            }
          }
          
          setStats(statsData);
        }
        
        // Générer l'URL de partage
        const baseUrl = window.location.origin;
        setShareUrl(`${baseUrl}/shared/students/${studentId}/corrections`);
        
      } catch (err) {
        console.error('Erreur:', err);
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [studentId]);
  
  // Fonction pour formater la date
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };
  
  // Fonction pour obtenir la couleur selon la note
  const getGradeColor = (percentage: number) => {
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'info';
    if (percentage >= 50) return 'primary';
    if (percentage >= 40) return 'warning';
    return 'error';
  };
  
  // Fonction pour partager les corrections
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Corrections de ${student?.first_name} ${student?.last_name}`,
          text: `Relevé de notes de ${student?.first_name} ${student?.last_name}`,
          url: shareUrl
        });
      } else {
        // Copier le lien dans le presse-papier
        await navigator.clipboard.writeText(shareUrl);
        alert('Lien copié dans le presse-papier !');
      }
    } catch (err) {
      console.error('Erreur lors du partage:', err);
    }
  };
  
  // Fonction pour envoyer un email à l'étudiant
  const handleSendEmail = () => {
    if (!student?.email) return;
    
    const subject = `Vos corrections`;
    const body = `Bonjour ${student.first_name},

Vous pouvez consulter vos corrections à l'adresse suivante :
${shareUrl}

Cordialement,
Votre enseignant`;
    
    window.location.href = `mailto:${student.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };
  
  // Fonctions pour l'édition de l'étudiant
  const fetchClassSubgroups = async (classId: number) => {
    try {
      setLoadingSubgroups(true);
      const response = await fetch(`/api/classes/${classId}`);
      
      if (!response.ok) {
        throw new Error('Error loading class data');
      }
      
      const classData = await response.json();
      
      // If the class has a defined number of subclasses
      if (classData.nbre_subclasses) {
        const groups = Array.from({ length: classData.nbre_subclasses }, (_, i) => (i + 1).toString());
        setAvailableSubgroups(groups);
      } else {
        setAvailableSubgroups([]);
      }
    } catch (error) {
      console.error('Error loading subgroups:', error);
      setAvailableSubgroups([]);
    } finally {
      setLoadingSubgroups(false);
    }
  };

  const handleEditClick = async () => {
    if (!student) return;
    
    setEditingStudent(student);
    setEditError(null);
    
    try {
      // Get all classes for the student
      const studentClassesResponse = await fetch(`/api/students/${student.id}/classes`);
      
      if (studentClassesResponse.ok) {
        const allStudentClasses = await studentClassesResponse.json();
        
        // Map classes to the format expected by the Autocomplete component
        const mappedClasses = allStudentClasses.map((cls: any) => ({
          id: cls.id,
          name: cls.name
        }));
        
        setSelectedClasses(mappedClasses);
        
        // If the student has a main class, retrieve its subgroups
        if (student.classId) {
          fetchClassSubgroups(student.classId);
        }
      } else {
        // Fallback if we can't retrieve all classes
        if (student.classId) {
          const studentClass = classes.find(c => c.id === student.classId);
          if (studentClass) {
            setSelectedClasses([{ id: studentClass.id, name: studentClass.name }]);
            fetchClassSubgroups(student.classId);
          } else {
            setSelectedClasses([]);
          }
        } else {
          setSelectedClasses([]);
        }
      }
    } catch (error) {
      console.error('Error retrieving student classes:', error);
      // Fallback in case of error
      if (student.classId) {
        const studentClass = classes.find(c => c.id === student.classId);
        if (studentClass) {
          setSelectedClasses([{ id: studentClass.id, name: studentClass.name }]);
        } else {
          setSelectedClasses([]);
        }
      } else {
        setSelectedClasses([]);
      }
    }
    
    setOpenEditDialog(true);
  };

  const handleEditClose = () => {
    setOpenEditDialog(false);
    setEditingStudent(null);
    setEditError(null);
  };

  const handleEditSave = async () => {
    if (!editingStudent || !editingStudent.id) return;
    setEditError(null);
    
    try {
      // Explicitly format each field to ensure they are correctly sent
      const studentData = {
        id: editingStudent.id,
        first_name: editingStudent.first_name,
        last_name: editingStudent.last_name,
        email: editingStudent.email,
        gender: editingStudent.gender || 'N',
        classId: selectedClasses.length > 0 ? selectedClasses[0].id : null,
        group: editingStudent.group || null,
      };
      
      // 1. Update student basic information
      const response = await fetch(`/api/students/${editingStudent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(studentData),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.message || 'Error during update');
        } catch (e) {
          throw new Error(`Error ${response.status}: ${errorText || 'Unknown error'}`);
        }
      }
      
      const updatedStudent = await response.json();
      
      // 2. Class association management - first update the main class
      if (studentData.classId) {
        const updateClassResponse = await fetch(`/api/classes/${studentData.classId}/students/${editingStudent.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sub_class: studentData.group
          }),
        });
        
        if (!updateClassResponse.ok) {
          console.warn('Warning: Group update failed');
        }
      }
      
      // 3. Handle additional classes
      // Get current classes
      const currentClassesResponse = await fetch(`/api/students/${editingStudent.id}/classes`);
      if (currentClassesResponse.ok) {
        const currentClasses = await currentClassesResponse.json();
        
        // For each selected class
        for (const selectedClass of selectedClasses) {
          const classExists = currentClasses.some((c: any) => c.id === selectedClass.id);
          
          if (!classExists) {
            // Add the student to this class if not already there
            await fetch(`/api/classes/${selectedClass.id}/students`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                student_id: editingStudent.id,
                first_name: editingStudent.first_name,
                last_name: editingStudent.last_name,
                email: editingStudent.email,
                gender: editingStudent.gender || 'N',
                sub_class: selectedClass.id === studentData.classId ? studentData.group : null
              }),
            });
          } else if (selectedClass.id === studentData.classId && studentData.group) {
            // Update the subgroup if it's the main class
            await fetch(`/api/classes/${selectedClass.id}/students/${editingStudent.id}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                sub_class: studentData.group
              }),
            });
          }
        }
        
        // Remove the student from unselected classes
        for (const currentClass of currentClasses) {
          if (!selectedClasses.some(c => c.id === currentClass.id)) {
            try {
              await fetch(`/api/classes/${currentClass.id}/students/${editingStudent.id}`, {
                method: 'DELETE',
              });
            } catch (error) {
              console.error(`Error removing student from class ${currentClass.id}:`, error);
            }
          }
        }
      }
      
      // Close dialog and refresh data
      setOpenEditDialog(false);
      setEditingStudent(null);
      setSelectedClasses([]);
      
      // Refresh the student data
      const refreshStudentResponse = await fetch(`/api/students/${studentId}`);
      if (refreshStudentResponse.ok) {
        const refreshedStudentData = await refreshStudentResponse.json();
        setStudent(refreshedStudentData);
      }
      
    } catch (err) {
      console.error('Error during update:', err);
      setEditError(`Update error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };
  
  // Calculer la note finale selon la règle établie
  const calculateFinalGrade = (grade: number, penalty: number = 0): number => {
    if (grade < 6) {
      // Si la note est inférieure à 6, on garde la note originale
      return grade;
    } else {
      // Sinon, on prend le maximum entre (note-pénalité) et 6
      return Math.max(grade - penalty, 6);
    }
  };

  // Déterminer la note finale à afficher
  const getFinalGrade = (correction: Correction): number => {
    // Si final_grade est déjà défini, l'utiliser
    if (correction.final_grade !== undefined && correction.final_grade !== null) {
      return typeof correction.final_grade === 'number' 
        ? correction.final_grade 
        : parseFloat(String(correction.final_grade));
    }
    
    // Sinon calculer la note en fonction de la règle
    const grade = typeof correction.grade === 'number'
      ? correction.grade
      : parseFloat(String(correction.grade || 0));
    
    const penalty = typeof correction.penalty === 'number'
      ? correction.penalty
      : parseFloat(String(correction.penalty || 0));
    
    return calculateFinalGrade(grade, penalty);
  };

  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', maxWidth: '400px', mx: 'auto', mt: 8 }}>
        <LoadingSpinner size="lg" text="Chargement des corrections" />
          </Box>
        
      </Container>
    );
  }
  
  if (error || !student) {
    return (
      <Container maxWidth="lg" className="py-8">
        <div className="container mx-auto px-4 py-2 flex justify-center">
          <div className="w-full max-w-lg animate-slide-in">
            <Paper className="p-6 overflow-hidden relative" elevation={3}>
              <ErrorDisplay 
                error={error || "Étudiant non trouvé"} 
                onRefresh={() => window.location.reload()}
                withRefreshButton={true}
              />
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                <Button 
                  variant="contained" 
                  component={Link} 
                  href="/students"
                  startIcon={<PersonIcon />}
                >
                  Retour à la liste des étudiants
                </Button>
              </Box>
            </Paper>
          </div>
        </div>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" className="py-8">
      {/* Header avec info étudiant */}
      <Paper 
        elevation={3} 
        sx={{ 
          borderRadius: 3,
          overflow: 'hidden',
          mb: 4
        }}
      >
        <GradientBackground variant="primary" sx={{ p: 0 }}>
          <PatternBackground 
            pattern="dots" 
            opacity={0.05} 
            color="black" 
            size={100}
            sx={{ p: 4, borderRadius: 2 }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box 
                sx={{ 
                  background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  p: 1.5, 
                  borderRadius: '50%',
                  display: 'flex',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                }}
              >
                <PersonIcon sx={{ fontSize: 50, color: (theme) => theme.palette.text.primary }} />
              </Box>
              
                <Box>
                  <Typography variant="h4" fontWeight={700} color="text.primary">
                    {student.first_name} {student.last_name}
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary" sx={{ opacity: 0.9, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SchoolIcon fontSize="small" />
                    {student.className || 'Non assigné à une classe'}
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<EditIcon />}
                  onClick={handleEditClick}
                >
                  Modifier
                </Button>
                
                <Tooltip title="Partager les corrections">
                  <IconButton 
                    onClick={handleShare}
                    className="bg-white/20 hover:bg-white/30"
                  >
                    <ShareIcon />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title={`Envoyer un email à ${student.email}`}>
                  <IconButton 
                    onClick={handleSendEmail}
                    className="bg-white/20 hover:bg-white/30"
                    disabled={!student.email}
                  >
                    <EmailIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </PatternBackground>
        </GradientBackground>
        
        {/* Statistiques de l'étudiant */}
        <Box sx={{ p: 2 }}>
          <Grid container spacing={2} sx={{ display: 'flex', justifyContent: 'space-around' }}>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <Paper sx={{ 
                p: 2, 
                textAlign: 'center', 
                height: '100%',
                bgcolor: (theme) => alpha(theme.palette.myBoxes.primary, 0.5),
                backdropFilter: 'blur(5px)',
                borderRadius: 2,
              }}>
                <Typography variant="overline" color="text.secondary">Total</Typography>
                <Typography variant="h3" fontWeight="bold" color="text.primary">
                  {stats?.total_corrections || 0}
                </Typography>
                <Typography variant="overline" color="text.secondary">
                  corrections
                </Typography>
              </Paper>
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <Paper sx={{ 
                p: 2, 
                textAlign: 'center', 
                height: '100%',
                bgcolor: (theme) => alpha(theme.palette.myBoxes.primary, 0.5),
                backdropFilter: 'blur(5px)',
                borderRadius: 2,
                position: 'relative',
              }}>
                {stats?.grade_trend && (
                  <Box sx={{ 
                    position: 'absolute', 
                    top: 10, 
                    right: 10,
                    color: stats.grade_trend === 'up' ? 'success.main' : 
                           stats.grade_trend === 'down' ? 'error.main' : 
                           'text.secondary'
                  }}>
                    {stats.grade_trend === 'up' && <TrendingUpIcon color="success" />}
                    {stats.grade_trend === 'down' && <TrendingDownIcon color="error" />}
                    {stats.grade_trend === 'stable' && <EqualizerIcon color="inherit" />}
                  </Box>
                )}
                <Typography variant="overline" color="text.secondary">Moyenne</Typography>
                <Typography variant="h3" fontWeight="bold" color="text.primary">
                  {stats?.average_grade !== null && stats?.average_grade !== undefined && typeof stats?.average_grade === 'number' 
                    ? stats.average_grade.toFixed(1) 
                    : '-'}
                </Typography>
                <Typography variant="overline" color="text.secondary">
                  sur 20
                </Typography>
              </Paper>
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <Paper sx={{ 
                p: 2, 
                textAlign: 'center', 
                height: '100%',
                bgcolor: (theme) => alpha(theme.palette.myBoxes.primary, 0.5),
                backdropFilter: 'blur(5px)',
                borderRadius: 2,
              }}>
                <Typography variant="overline" color="text.secondary">Meilleure note</Typography>
                <Typography variant="h3" fontWeight="bold" color="text.primary">
                  {stats?.highest_grade !== null && stats?.highest_grade !== undefined && typeof stats?.highest_grade === 'number' 
                    ? stats.highest_grade.toFixed(1) 
                    : '-'}
                </Typography>
                <Typography variant="overline" color="text.secondary">
                  sur 20
                </Typography>
              </Paper>
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <Paper sx={{ 
                p: 2, 
                textAlign: 'center', 
                height: '100%',
                bgcolor: (theme) => alpha(theme.palette.myBoxes.primary, 0.5),
                backdropFilter: 'blur(5px)',
                borderRadius: 2,
                display: 'flex',
                flexDirection: 'column',
              }}>
                <Typography variant="overline" color="text.secondary">Points moyens</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                  <ScienceIcon color="primary" sx={{ fontSize: 16 }} />
                  <Typography variant="body2" fontWeight="medium">
                    {stats?.average_experimental_points !== null && 
                     stats?.average_experimental_points !== undefined && 
                     typeof stats?.average_experimental_points === 'number'
                      ? stats.average_experimental_points.toFixed(1)
                      : '0'} exp.
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center', mt: 1 }}>
                  <MenuBookIcon color="secondary" sx={{ fontSize: 16 }} />
                  <Typography variant="body2" fontWeight="medium">
                    {stats?.average_theoretical_points !== null && 
                     stats?.average_theoretical_points !== undefined && 
                     typeof stats?.average_theoretical_points === 'number'
                      ? stats.average_theoretical_points.toFixed(1)
                      : '0'} théo.
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Paper>
      
      {/* Liste des corrections */}
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
        <AssignmentIcon color="primary" />
        Corrections ({corrections.length})
      </Typography>
      
      {corrections.length === 0 ? (
        <Paper 
          sx={{ 
            p: 4, 
            textAlign: 'center',
            borderStyle: 'dashed',
            borderWidth: 1,
            borderColor: 'divider'
          }}
        >
          <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>
            Aucune correction n'a encore été enregistrée pour cet étudiant
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {corrections.map((correction) => (
            <Grid size={{ xs: 12, md: 6 }} key={correction.id}>
              <Card 
                elevation={2}
                sx={{ 
                  height: '100%', 
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 8
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" fontWeight="bold" noWrap>
                      {correction.activity_name}
                    </Typography>
                    <Chip 
                      color={getGradeColor(correction.score_percentage ?? 0)}
                      label={`${correction.grade} / ${correction.max_points}`}
                      icon={<GradeIcon />}
                    />
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}
                    >
                      <CalendarTodayIcon fontSize="small" />
                      {formatDate(correction.submission_date)}
                    </Typography>
                    
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                    >
                      <SchoolIcon fontSize="small" />
                      {correction.class_name}
                    </Typography>
                  </Box>
                  
                  <Typography variant="subtitle2" gutterBottom>
                    Répartition des points :
                  </Typography>
                  
                  <Grid container spacing={1} sx={{ mb: 1 }}>
                    <Grid size={{ xs: 6 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ScienceIcon color="primary" fontSize="small" />
                        <Typography variant="body2" fontWeight="medium">
                          Expérimental: {correction.experimental_points} pts
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MenuBookIcon color="secondary" fontSize="small" />
                        <Typography variant="body2" fontWeight="medium">
                          Théorique: {correction.theoretical_points} pts
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                  
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="text.secondary" gutterBottom>
                      Pourcentage de réussite
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={correction.score_percentage ?? 0} 
                      color={getGradeColor(correction.score_percentage ?? 0) as "primary" | "secondary" | "error" | "info" | "success" | "warning" | undefined}
                      sx={{ height: 10, borderRadius: 5 }}
                    />
                    <Typography variant="caption" sx={{ display: 'block', textAlign: 'right', mt: 0.5 }}>
                      {(correction.score_percentage ?? 0).toFixed(1)}%
                    </Typography>
                  </Box>
                </CardContent>
                
                <Divider />
                
                <CardActions>
                  <Button 
                    size="small" 
                    startIcon={<EditIcon />}
                    component={Link}
                    href={`/corrections/${correction.id}`}
                    sx={{ flexGrow: 1 }}
                  >
                    Voir/Modifier
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* Actions en bas de page */}
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
        <Button
          variant="outlined"
          startIcon={<PersonIcon />}
          component={Link}
          href={`/students/${studentId}`}
        >
          Retour au profil
        </Button>
        
        <Button
          variant="outlined"
          color="success"
          startIcon={<AssignmentIcon />}
          component={Link}
          href={`/corrections/unique?studentId=${studentId}`}
        >
          Ajouter une correction
        </Button>
      </Box>
      
      {/* Modal d'édition */}
      <StudentEditDialog
        open={openEditDialog}
        student={editingStudent ? {
          ...editingStudent,
          gender: editingStudent.gender || 'N'  // Provide default 'N' if gender is undefined
        } : null}
        classes={classes}
        selectedClasses={selectedClasses}
        availableSubgroups={availableSubgroups}
        loadingSubgroups={loadingSubgroups}
        onClose={handleEditClose}
        onSave={handleEditSave}
        onStudentChange={(student) => setEditingStudent(student as any)}
        onSelectedClassesChange={setSelectedClasses}
        fetchClassSubgroups={fetchClassSubgroups}
      />
      
      {/* Display edit errors if necessary */}
      {editError && (
        <Box sx={{ p: 2 }}>
          <Alert severity="error">{editError}</Alert>
        </Box>
      )}
    </Container>
  );
}
