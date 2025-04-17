'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSnackbar } from 'notistack';
import { 
  Typography, Paper, Button, Alert, Container, Tabs, Tab, Box,
   Card, CardContent, CardActions, Chip, List, ListItem, ListItemText,
    IconButton, Divider, FormControl, InputLabel, Select, MenuItem, Slider, TextField, TableContainer, 
    Table, TableHead, TableRow, TableCell, TableBody, Checkbox, CircularProgress, Tooltip,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import BarChartIcon from '@mui/icons-material/BarChart';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { alpha } from '@mui/material/styles';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorDisplay from '@/components/ui/ErrorDisplay';
import GradientBackground from '@/components/ui/GradientBackground';
import PatternBackground from '@/components/ui/PatternBackground';
import AssociateActivitiesModal, { Activity as ModalActivity } from "@/components/classes/AssociateActivitiesModal";
import CreateCorrectionsModalAutre from "@/components/corrections_autres/CreateCorrectionsModalAutre";
import { CorrectionAutreEnriched, Class, Student, ActivityAutre } from '@/lib/types';
import ExportPDFComponentAllCorrectionsAutres from '@/components/pdf/ExportPDFComponentAllCorrectionsAutres';
import CorrectionCardAutre from '@/components/allCorrections/CorrectionCard';
import { getBatchShareCodes } from '@/lib/services/shareService';
import { changeCorrectionAutreStatus } from '@/lib/services/correctionsAutresService';

// Définition des interfaces nécessaires
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// Composant TabPanel pour afficher le contenu des onglets
function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`class-tabpanel-${index}`}
      aria-labelledby={`class-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: { xs: 1, sm: 2 }, pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}
export default function ClassAutreDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap the params Promise using React.use()
  const unwrappedParams = React.use(params);
  const { id } = unwrappedParams;
  const classId = id;

  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();

  
  // États pour les données de la classe
  const [classData, setClassData] = useState<Class | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [activities, setActivities] = useState<ActivityAutre[]>([]);
  const [corrections, setCorrections] = useState<CorrectionAutreEnriched[]>([]);
  
  // États pour le chargement et les erreurs
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | string | null>(null);
  
  const [associateModalOpen, setAssociateModalOpen] = useState(false);
  const [createCorrectionsModalOpen, setCreateCorrectionsModalOpen] = useState(false);
  
  // État pour l'onglet actif
  const [tabValue, setTabValue] = useState(0);
  
  // États pour les filtres et groupements
  const [filterActivity, setFilterActivity] = useState<number | 'all'>('all');
  const [filterSubClass, setFilterSubClass] = useState<string | 'all'>('all');
  const [groupBy, setGroupBy] = useState<'student' | 'activity'>('student');
  
  // État pour la mise à jour des corrections
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Fonction pour gérer le changement d'onglet
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Effet pour charger les données de la classe
  useEffect(() => {
    const fetchClassData = async () => {
      try {
        setLoading(true);
        
        // Récupérer les détails de la classe
        const classResponse = await fetch(`/api/classes/${classId}`);
        if (!classResponse.ok) {
          const errorData = await classResponse.json().catch(() => ({ error: 'Erreur lors du chargement des données de la classe' }));
          // Créer une instance d'Error et y attacher les détails
          const error = new Error('Erreur lors du chargement des données de la classe : ' + errorData.error || 'Erreur lors du chargement des données de la classe');
          (error as any).details = errorData.details || {};
          setError(error);
          throw error;
        }
        const classDataResponse = await classResponse.json();
        setClassData(classDataResponse);
        
        // Récupérer les étudiants de la classe
        const studentsResponse = await fetch(`/api/classes/${classId}/students`);
        if (!studentsResponse.ok) {
          const errorData = await studentsResponse.json().catch(() => ({ error: 'Erreur lors du chargement des étudiants' }));
          // Créer une instance d'Error et y attacher les détails
          const error = new Error('Erreur lors du chargement des étudiants : ' + errorData.error || 'Erreur lors du chargement des étudiants');
          (error as any).details = errorData.details || {};
          setError(error);
          throw error;
        }
        const studentsData = await studentsResponse.json();
        setStudents(studentsData);
        
        // Récupérer les activités associées à la classe
        const activitiesResponse = await fetch(`/api/classes/${classId}/activities`);
        if (!activitiesResponse.ok) {
          const errorData = await activitiesResponse.json().catch(() => ({ error: 'Erreur lors du chargement des activités' }));
          // Créer une instance d'Error et y attacher les détails
          const error = new Error('Erreur lors du chargement des activités : ' + errorData.error || 'Erreur lors du chargement des activités');
          (error as any).details = errorData.details || {};
          setError(error);
          throw error;
        }
        const activitiesData = await activitiesResponse.json();
        setActivities(activitiesData);
        
        // Récupérer les corrections de la classe
        const correctionsResponse = await fetch(`/api/classes/${classId}/corrections`);
        if (!correctionsResponse.ok) {
          const errorData = await correctionsResponse.json().catch(() => ({ error: 'Erreur lors du chargement des corrections' }));
          // Créer une instance d'Error et y attacher les détails
          const error = new Error('Erreur lors du chargement des corrections : ' + errorData.error || 'Erreur lors du chargement des corrections');
          (error as any).details = errorData.details || {};
          setError(error);
          throw error;
        }
        const correctionsData = await correctionsResponse.json();
        setCorrections(correctionsData);
        
      } catch (err) {
        console.error('Error fetching class:', err);
        // Si nous n'avons pas déjà défini l'erreur (avec des détails) ci-dessus
        if (!error) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchClassData();
  }, [classId, refreshTrigger]);
  
  // Rafraîchir les données de la classe
  const refreshClass = () => {
    setRefreshTrigger(prev => prev + 1);
  };
  
  // Fonction pour changer le statut d'une correction
  const handleChangeStatus = async (correctionId: number, newStatus: string): Promise<void> => {
    try {
      await changeCorrectionAutreStatus(correctionId, newStatus);
      enqueueSnackbar(`Statut de la correction mis à jour avec succès`, { variant: 'success' });
      refreshClass();
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
      enqueueSnackbar(`Erreur lors de la mise à jour du statut: ${error instanceof Error ? error.message : 'Erreur inconnue'}`, { variant: 'error' });
    }
  };
  
  // Fonction pour associer une activité à la classe
  const handleAssociateActivity = async (activitiesToAdd: ModalActivity[], activitiesToRemove: ModalActivity[]): Promise<void> => {
    try {
      // Gérer les ajouts d'activités
      if (activitiesToAdd.length > 0) {
        const activityIdsToAdd = activitiesToAdd.map(a => a.id);
        const response = await fetch(`/api/classes/${classId}/activities`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ activity_ids: activityIdsToAdd }),
        });
        
        if (!response.ok) {
          throw new Error("Erreur lors de l'association des activités");
        }
      }
      
      // Gérer les suppressions d'activités
      for (const activity of activitiesToRemove) {
        const response = await fetch(`/api/classes/${classId}/activities/${activity.id}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error(`Erreur lors de la dissociation de l'activité ${activity.name}`);
        }
      }
      
      enqueueSnackbar(
        `${activitiesToAdd.length} activité(s) ajoutée(s), ${activitiesToRemove.length} activité(s) supprimée(s)`, 
        { variant: 'success' }
      );
      refreshClass();
      setAssociateModalOpen(false);
    } catch (err) {
      console.error('Erreur:', err);
      enqueueSnackbar(err instanceof Error ? err.message : 'Une erreur est survenue', { variant: 'error' });
    }
  };
  // Fonction pour dissocier une activité de la classe
  const handleDisassociateActivity = async (activityId: number) => {
    try {
      const response = await fetch(`/api/classes/${classId}/activities`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ activityId }),
      });
      
      if (!response.ok) {
        throw new Error("Erreur lors de la dissociation de l'activité");
      }
      
      enqueueSnackbar('Activité dissociée avec succès', { variant: 'success' });
      refreshClass();
    } catch (err) {
      console.error('Erreur:', err);
      enqueueSnackbar(err instanceof Error ? err.message : 'Une erreur est survenue', { variant: 'error' });
    }
  };
  
  // Fonction pour créer des corrections en masse
  const handleCreateCorrections = async (data: { 
    activityId: number; 
    studentIds: number[]; 
    createGroup: boolean; 
    groupName?: string;
  }) => {
    try {
      const response = await fetch('/api/corrections_autres/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activity_id: data.activityId,
          student_ids: data.studentIds,
          class_id: parseInt(classId),
          create_group: data.createGroup,
          group_name: data.groupName,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur lors de la création des corrections");
      }
      
      const result = await response.json();
      enqueueSnackbar(`${result.count} corrections créées avec succès`, { variant: 'success' });
      
      refreshClass();
      setCreateCorrectionsModalOpen(false);
    } catch (err) {
      console.error('Erreur:', err);
      enqueueSnackbar(err instanceof Error ? err.message : 'Une erreur est survenue', { variant: 'error' });
    }
  };
  
  // Calcul des statistiques pour la classe
  const classStats = useMemo(() => {
    if (!corrections || corrections.length === 0) {
      return {
        totalCorrections: 0,
        averageGrade: 0,
        studentsCovered: 0,
        activitiesCovered: 0,
      };
    }
    
    // Calculer les statistiques de base
    const validGrades = corrections.filter(c => c.grade !== null && c.grade !== undefined);
    const totalGrade = validGrades.reduce((sum, c) => {
      // Convertir les grades de type string en nombre
      const gradeValue = typeof c.grade === 'string' 
        ? parseFloat(c.grade) 
        : (c.grade || 0);
      
      // Utiliser 0 si la conversion échoue (NaN)
      return sum + (isNaN(gradeValue) ? 0 : gradeValue);
    }, 0);
    
    const averageGrade = validGrades.length > 0 ? totalGrade / validGrades.length : 0;
    
    // Compter les étudiants et activités uniques
    const uniqueStudents = new Set(corrections.map(c => c.student_id));
    const uniqueActivities = new Set(corrections.map(c => c.activity_id));
    
    return {
      totalCorrections: corrections.length,
      averageGrade: averageGrade,
      studentsCovered: uniqueStudents.size,
      activitiesCovered: uniqueActivities.size,
    };
  }, [corrections]);
  
  // Filtrer les corrections selon les critères actuels
  const filteredCorrections = useMemo(() => {
    if (!corrections) return [];
    
    return corrections.filter(correction => {
      // Filtrer par activité
      if (filterActivity !== 'all' && correction.activity_id !== filterActivity) {
        return false;
      }
      
      // Filtrer par sous-classe en utilisant les données des étudiants
      if (filterSubClass !== 'all') {
        // Trouver l'étudiant associé à cette correction
        const student = students.find(s => s.id === correction.student_id);
        // Vérifier si l'étudiant appartient au groupe de filtrage
        if (!student || student.sub_class?.toString() !== filterSubClass) {
          return false;
        }
      }
      
      return true;
    });
  }, [corrections, filterActivity, filterSubClass, students]);
  
  // Grouper les corrections selon le critère choisi
  const groupedCorrections = useMemo(() => {
    if (!filteredCorrections || filteredCorrections.length === 0) {
      return [];
    }
    
    if (groupBy === 'student') {
      // Grouper par étudiant
      const studentGroups = new Map<number, CorrectionAutreEnriched[]>();
      
      filteredCorrections.forEach(correction => {
        // Vérifier que student_id n'est pas null
        const studentId = correction.student_id ?? 0; // Utiliser 0 comme fallback si null
        
        if (!studentGroups.has(studentId)) {
          studentGroups.set(studentId, []);
        }
        studentGroups.get(studentId)?.push(correction);
      });
      
      return Array.from(studentGroups.entries()).map(([studentId, studentCorrections]) => {
        const firstCorrection = studentCorrections[0];
        
        // Calculer la moyenne des notes pour cet étudiant
        const validGrades = studentCorrections
          .filter(c => c.grade !== null && c.grade !== undefined)
          .map(c => {
            // Convertir les grades de type string en nombre
            if (typeof c.grade === 'string') {
              const parsedGrade = parseFloat(c.grade);
              return isNaN(parsedGrade) ? 0 : parsedGrade;
            }
            return c.grade as number;
          });
          
        const averageGrade = validGrades.length > 0
          ? validGrades.reduce((sum, grade) => sum + grade, 0) / validGrades.length
          : 0;
        
        return {
          id: studentId,
          name: firstCorrection.student_name || 'Étudiant inconnu',
          corrections: studentCorrections,
          averageGrade,
          count: studentCorrections.length,
        };
      });
    } else {
      // Grouper par activité
      const activityGroups = new Map<number, CorrectionAutreEnriched[]>();
      
      filteredCorrections.forEach(correction => {
        if (!activityGroups.has(correction.activity_id)) {
          activityGroups.set(correction.activity_id, []);
        }
        activityGroups.get(correction.activity_id)?.push(correction);
      });
      
      return Array.from(activityGroups.entries()).map(([activityId, activityCorrections]) => {
        const firstCorrection = activityCorrections[0];
        
        // Calculer la moyenne des notes pour cette activité
        const validGrades = activityCorrections
          .filter(c => c.grade !== null && c.grade !== undefined)
          .map(c => {
            // Convertir les grades de type string en nombre
            if (typeof c.grade === 'string') {
              const parsedGrade = parseFloat(c.grade);
              return isNaN(parsedGrade) ? 0 : parsedGrade;
            }
            return c.grade as number;
          });
          
        const averageGrade = validGrades.length > 0
          ? validGrades.reduce((sum, grade) => sum + grade, 0) / validGrades.length
          : 0;
        
        return {
          id: activityId,
          name: firstCorrection.activity_name || 'Activité inconnue',
          corrections: activityCorrections,
          averageGrade,
          count: activityCorrections.length,
        };
      });
    }
  }, [filteredCorrections, groupBy]);
  
  // Obtenir les sous-classes disponibles
  const availableSubClasses = useMemo(() => {
    if (!classData || !classData.nbre_subclasses) return [];
    
    return Array.from(
      { length: classData.nbre_subclasses },
      (_, index) => ({
        id: (index + 1).toString(),
        name: `Groupe ${index + 1}`
      })
    );
  }, [classData]);
  
  // Déterminer la couleur selon la note
  const getGradeColor = (grade: number): "success" | "info" | "primary" | "warning" | "error" => {
    if (grade >= 16) return 'success';
    if (grade >= 12) return 'info';
    if (grade >= 10) return 'primary';
    if (grade >= 8) return 'warning';
    return 'error';
  };
  
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <LoadingSpinner size="lg" text="Chargement des données de la classe..." />
        </Box>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <ErrorDisplay
          error={error}
          errorDetails={
            error && typeof error === 'object' && 'details' in error
              ? (error as any).details
              : undefined
          }
          onRefresh={() => {
            setError('');
            window.location.reload();
          }}
          withRefreshButton={true}
        />
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="contained"
            component={Link}
            href="/classes_autres"
            startIcon={<ArrowBackIcon />}
          >
            Retour à la liste des classes
          </Button>
        </Box>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* En-tête avec informations de la classe */}
      <Paper elevation={3} sx={{ borderRadius: 3, overflow: 'hidden', mb: 4 }}>
        <GradientBackground variant="primary">
          <PatternBackground
            pattern="dots"
            opacity={0.05}
            sx={{ p: 4, borderRadius: 0 }}
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
                  <SchoolIcon sx={{ fontSize: 50, color: (theme) => theme.palette.text.primary }} />
                </Box>
                
                <Box>
                  <Typography variant="h4" fontWeight={700} color="text.primary">
                    {classData?.name || 'Classe'}
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary" sx={{ opacity: 0.9 }}>
                    Année scolaire: {classData?.academic_year || '-'} | {students.length} étudiants
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<EditIcon />}
                  component={Link}
                  href={`/classes_autres/${classId}`}
                >
                  Modifier
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<PeopleAltIcon />}
                  component={Link}
                  href={`/classes_autres/${classId}/students`}
                >
                  Gérer les étudiants
                </Button>
              </Box>
            </Box>
          </PatternBackground>
        </GradientBackground>
      </Paper>
      
      {/* Statistiques de la classe */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <BarChartIcon color="primary" />
          Statistiques de la classe
        </Typography>
        
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
                {classStats.totalCorrections}
              </Typography>
              <Typography variant="overline" color="text.secondary">
                corrections
              </Typography>
            </Paper>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper sx={{ 
              p: 2, 
              textAlign: 'center', 
              height: '100%',
              bgcolor: (theme) => alpha(theme.palette.myBoxes.primary, 0.5),
              backdropFilter: 'blur(5px)',
              borderRadius: 2,
            }}>
              <Typography variant="overline" color="text.secondary">Moyenne</Typography>
              <Typography variant="h3" fontWeight="bold" color="text.primary">
                {classStats.totalCorrections > 0 
                  ? classStats.averageGrade.toFixed(1) 
                  : '-'}
              </Typography>
              <Typography variant="overline" color="text.secondary">sur 20</Typography>
            </Paper>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper sx={{ 
              p: 2, 
              textAlign: 'center', 
              height: '100%',
              bgcolor: (theme) => alpha(theme.palette.myBoxes.primary, 0.5),
              backdropFilter: 'blur(5px)',
              borderRadius: 2,
            }}>
              <Typography variant="overline" color="text.secondary">Étudiants</Typography>
              <Typography variant="h3" fontWeight="bold" color="text.primary">
                {classStats.studentsCovered} / {students.length}
              </Typography>
              <Typography variant="overline" color="text.secondary">
                avec corrections
              </Typography>
            </Paper>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper sx={{ 
              p: 2, 
              textAlign: 'center', 
              height: '100%',
              bgcolor: (theme) => alpha(theme.palette.myBoxes.primary, 0.5),
              backdropFilter: 'blur(5px)',
              borderRadius: 2,
            }}>
              <Typography variant="overline" color="text.secondary">Activités</Typography>
              <Typography variant="h3" fontWeight="bold" color="text.primary">
                {classStats.activitiesCovered} / {activities.length}
              </Typography>
              <Typography variant="overline" color="text.secondary">
                avec corrections
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Onglets pour les différentes sections */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 1 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          aria-label="class tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Activités" />
          <Tab label="Étudiants" />
          <Tab label="Toutes les corrections" />
          <Tab label="Export PDF" />
        </Tabs>
      </Box>
      
      {/* Contenu pour l'onglet Activités */}
      <TabPanel value={tabValue} index={0}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h6">
            Activités associées ({activities.length})
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setAssociateModalOpen(true)}
          >
            Associer des activités
          </Button>
        </Box>
        
        {activities.length === 0 ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            Aucune activité n'est associée à cette classe.
          </Alert>
        ) : (
          <Grid container spacing={2}>
            {activities.map((activity) => {
              // Compter les corrections pour cette activité
              const activityCorrections = corrections.filter(c => c.activity_id === activity.id);
              const totalStudentsWithCorrections = new Set(activityCorrections.map(c => c.student_id)).size;
              
              // Calculer la note moyenne pour cette activité
              const validGrades = activityCorrections
                .filter(c => c.grade !== null && c.grade !== undefined)
                .map(c => {
                  // Convertir les grades de type string en nombre
                  if (typeof c.grade === 'string') {
                    const parsedGrade = parseFloat(c.grade);
                    return isNaN(parsedGrade) ? 0 : parsedGrade;
                  }
                  return c.grade as number;
                });
                
              const averageGrade = validGrades.length > 0
                ? validGrades.reduce((sum, grade) => sum + grade, 0) / validGrades.length
                : null;
              
              return (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={activity.id}>
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
                      <Typography variant="h6" component="div" gutterBottom>
                        {activity.name}
                      </Typography>
                      
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {activity.parts_names && activity.parts_names.length > 0 ? (
                            <>Parties: {activity.parts_names.join(', ')}</>
                          ) : (
                            <>Activité sans parties spécifiées</>
                          )}
                        </Typography>
                        
                        <Typography variant="body2" color="text.secondary">
                          Points: {activity.points ? activity.points.reduce((sum, p) => sum + p, 0) : 0} points
                        </Typography>
                      </Box>
                      
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" gutterBottom>
                          <strong>{totalStudentsWithCorrections}</strong> / {students.length} étudiants ont des corrections
                        </Typography>
                        
                        {averageGrade !== null && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2">
                              Note moyenne:
                            </Typography>
                            <Chip 
                              label={`${averageGrade.toFixed(1)}/20`}
                              color={getGradeColor(averageGrade)}
                              size="small"
                            />
                          </Box>
                        )}
                      </Box>
                    </CardContent>
                    
                    <Divider />
                    
                    <CardActions>
                      <Button 
                        size="small" 
                        component={Link}
                        href={`/activities_autres/${activity.id}`}
                      >
                        Voir
                      </Button>
                      <Button 
                        size="small" 
                        color="primary"
                        component={Link}
                        href={`/activities_autres/${activity.id}/corrections/multiples?classId=${classId}`}
                      >
                        Ajouter corrections
                      </Button>
                      <Button 
                        size="small" 
                        color="error"
                        onClick={() => handleDisassociateActivity(activity.id)}
                      >
                        Dissocier
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </TabPanel>
      
      {/* Contenu pour l'onglet Étudiants */}
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h6">
            Étudiants de la classe ({students.length})
          </Typography>
          <Button
            variant="contained"
            color="primary"
            component={Link}
            href={`/classes_autres/${classId}/students`}
            startIcon={<PeopleAltIcon />}
          >
            Gérer les étudiants
          </Button>
        </Box>
        
        {students.length === 0 ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            Aucun étudiant n'est inscrit dans cette classe.
          </Alert>
        ) : (
          <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nom</TableCell>
                  <TableCell>Groupe</TableCell>
                  <TableCell>Corrections</TableCell>
                  <TableCell>Note moyenne</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students.map((student) => {
                  // Trouver les corrections pour cet étudiant
                  const studentCorrections = corrections.filter(c => c.student_id === student.id);
                  
                  // Calculer la moyenne des notes pour cet étudiant
                  const validGrades = studentCorrections
                    .filter(c => c.grade !== null && c.grade !== undefined)
                    .map(c => {
                      // Convertir les grades de type string en nombre
                      if (typeof c.grade === 'string') {
                        const parsedGrade = parseFloat(c.grade);
                        return isNaN(parsedGrade) ? 0 : parsedGrade;
                      }
                      return c.grade as number;
                    });
                    
                  const averageGrade = validGrades.length > 0
                    ? validGrades.reduce((sum, grade) => sum + grade, 0) / validGrades.length
                    : 0;
                  
                  return (
                    <TableRow key={student.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PersonIcon color="action" fontSize="small" />
                          <Typography>
                            {`${student.first_name} ${student.last_name}`}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {student.sub_class ? (
                          <Chip 
                            size="small" 
                            label={`Groupe ${student.sub_class}`} 
                            color="info" 
                            variant="outlined"
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            -
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {studentCorrections.length > 0 ? (
                          <Chip 
                            size="small"
                            label={studentCorrections.length}
                            color="success"
                          />
                        ) : (
                          <Chip 
                            size="small"
                            label="0"
                            color="default"
                            variant="outlined"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {averageGrade !== null ? (
                          <Chip 
                            label={`${averageGrade.toFixed(1)}/20`}
                            color={getGradeColor(averageGrade)}
                            size="small"
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            -
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Button 
                          size="small" 
                          component={Link}
                          href={`/students/${student.id}/corrections`}
                        >
                          Voir corrections
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </TabPanel>
      
      {/* Contenu pour l'onglet Toutes les corrections */}
      <TabPanel value={tabValue} index={2}>
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Typography variant="h6">
              Corrections filtrées ({filteredCorrections.length} sur {corrections.length})
            </Typography>
            {filteredCorrections.length > 0 && (
              <Chip
                label={`Moyenne: ${(() => {
                  const validGrades = filteredCorrections
                    .filter(c => c.grade !== null && c.grade !== undefined)
                    .map(c => {
                      if (typeof c.grade === 'string') {
                        const parsedGrade = parseFloat(c.grade);
                        return isNaN(parsedGrade) ? 0 : parsedGrade;
                      }
                      return c.grade as number;
                    });
                  
                  if (validGrades.length === 0) return '0.0';
                  
                  const avg = validGrades.reduce((sum, grade) => sum + grade, 0) / validGrades.length;
                  return avg.toFixed(1);
                })()} / 20`}
                color={(() => {
                  const validGrades = filteredCorrections
                    .filter(c => c.grade !== null && c.grade !== undefined)
                    .map(c => {
                      if (typeof c.grade === 'string') {
                        const parsedGrade = parseFloat(c.grade);
                        return isNaN(parsedGrade) ? 0 : parsedGrade;
                      }
                      return c.grade as number;
                    });
                  
                  if (validGrades.length === 0) return 'default';
                  
                  const avg = validGrades.reduce((sum, grade) => sum + grade, 0) / validGrades.length;
                  return getGradeColor(avg);
                })()}
                size="medium"
                sx={{ fontWeight: 'bold' }}
              />
            )}
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel id="activity-filter-label">Filtrer par activité</InputLabel>
              <Select
                labelId="activity-filter-label"
                value={filterActivity}
                label="Filtrer par activité"
                onChange={(e) => setFilterActivity(e.target.value as number | 'all')}
              >
                <MenuItem value="all">Toutes les activités</MenuItem>
                {activities.map(activity => (
                  <MenuItem key={activity.id} value={activity.id}>
                    {activity.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {availableSubClasses.length > 0 && (
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel id="subclass-filter-label">Filtrer par groupe</InputLabel>
                <Select
                  labelId="subclass-filter-label"
                  value={filterSubClass}
                  label="Filtrer par groupe"
                  onChange={(e) => setFilterSubClass(e.target.value)}
                >
                  <MenuItem value="all">Tous les groupes</MenuItem>
                  {availableSubClasses.map(subClass => (
                    <MenuItem key={subClass.id} value={subClass.id}>
                      {subClass.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel id="group-by-label">Grouper par</InputLabel>
              <Select
                labelId="group-by-label"
                value={groupBy}
                label="Grouper par"
                onChange={(e) => setGroupBy(e.target.value as 'student' | 'activity')}
              >
                <MenuItem value="student">Étudiant</MenuItem>
                <MenuItem value="activity">Activité</MenuItem>
              </Select>
            </FormControl>
            
            <Button
              variant="contained"
              color="primary"
              onClick={() => setCreateCorrectionsModalOpen(true)}
              startIcon={<AddIcon />}
            >
              Ajouter des corrections
            </Button>
          </Box>
          
          {filteredCorrections.length === 0 ? (
            <Alert severity="info">
              Aucune correction trouvée avec les filtres actuels.
            </Alert>
          ) : (
            <Box>
              {groupedCorrections.map(group => (
                <Paper key={`${groupBy}-${group.id}`} sx={{ mb: 3, overflow: 'hidden', borderRadius: 2 }}>
                  <Box sx={{ 
                    p: 2, 
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <Typography variant="subtitle1" fontWeight="medium">
                      {group.name} ({group.count})
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2">
                        Moyenne:
                      </Typography>
                      <Chip 
                        label={`${group.averageGrade.toFixed(1)} / 20`}
                        color={getGradeColor(group.averageGrade)}
                        size="small"
                      />
                    </Box>
                  </Box>
                  
                  <Divider />
                  
                  <Box sx={{ p: 2 }}>
                    <Grid container spacing={2}>
                      {group.corrections.map(correction => {                        
                        return (
                          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={correction.id}>
                            <CorrectionCardAutre
                              correction={correction}
                              getGradeColor={getGradeColor}
                              showStudent={groupBy === 'activity'}
                              showActivity={groupBy === 'student'}
                              showClass={false}
                              onChangeStatus={handleChangeStatus}
                              standalone={false}
                            />
                          </Grid>
                        );
                      })}
                    </Grid>
                  </Box>
                </Paper>
              ))}
            </Box>
          )}
        </Box>
      </TabPanel>
      
      {/* Contenu pour l'onglet Export PDF */}
      <TabPanel value={tabValue} index={3}>
        <Box>
          <Typography variant="h6" gutterBottom>
            Export PDF des corrections
          </Typography>
          
          {classData && (
            <ExportPDFComponentAllCorrectionsAutres
              corrections={corrections.map(correction => {
                const student = students.find(s => s.id === correction.student_id);
                return {
                  ...correction,
                  sub_class: student?.sub_class
                };
              })}
              activities={activities}
              students={students}
              filterActivity={filterActivity}
              setFilterActivity={setFilterActivity}
              uniqueSubClasses={availableSubClasses}
              uniqueActivities={activities.map(a => ({ id: a.id, name: a.name }))}
              getActivityById={(activityId: number) => activities.find(a => a.id === activityId)}
              getStudentById={(studentId: number) => students.find(s => s.id === studentId)}
              getAllClasses={async () => {
                try {
                  const response = await fetch('/api/classes');
                  if (!response.ok) throw new Error('Erreur lors du chargement des classes');
                  return await response.json();
                } catch (error) {
                  console.error('Erreur:', error);
                  enqueueSnackbar('Erreur lors du chargement des classes', { variant: 'error' });
                  return [];
                }
              }}
            />
          )}
        </Box>
      </TabPanel>
      
      {/* Modal pour associer des activités */}
      {associateModalOpen && (
        <AssociateActivitiesModal
          open={associateModalOpen}
          onClose={() => setAssociateModalOpen(false)}
          onAssociate={handleAssociateActivity}
          availableActivities={activities.map(a => ({
            id: a.id,
            name: a.name,
            points: a.points,
            parts_names: a.parts_names
          }))}
          currentActivities={activities.map(a => ({
            id: a.id,
            name: a.name,
            points: a.points,
            parts_names: a.parts_names
          }))}
        />
      )}
      
      {/* Modal pour créer des corrections en masse */}
      {createCorrectionsModalOpen && (
        <CreateCorrectionsModalAutre
          open={createCorrectionsModalOpen}
          onClose={() => setCreateCorrectionsModalOpen(false)}
          onCreateCorrections={handleCreateCorrections}
          students={students}
          activities={activities}
          isCorrectionAutre={true}
        />
      )}
    </Container>
  );
}