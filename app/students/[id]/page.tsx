'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Container,
  Paper,
  Box,
  Alert,
  Button,
  Tab,
  Tabs,
  useTheme,
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import GradeIcon from '@mui/icons-material/Grade';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';

import LoadingSpinner from '@/components/LoadingSpinner';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';

// Importation des types et composants
import { Student, Class, StudentStats } from '@/components/students/[id]/types';
import { CorrectionAutreEnriched, ActivityAutre } from '@/lib/types';
import StudentHeader from '@/components/students/[id]/StudentHeader';
import StudentStatsDisplay from '@/components/students/[id]/StudentStats';
import StudentCorrections from '@/components/students/[id]/StudentCorrections';
import StudentStatistics from '@/components/students/[id]/StudentStatistics';
import StudentEvolution from '@/components/students/[id]/StudentEvolution';
import StudentClasses from '@/components/students/[id]/StudentClasses';
import StudentEditDialogForDetail from '@/components/students/StudentEditDialogForDetail';
import ErrorDisplay from '@/components/ui/ErrorDisplay';

dayjs.locale('fr');

export default function StudentDetailPage() {
  const params = useParams();
  const studentId = params?.id as string;
  const theme = useTheme();

  const [student, setStudent] = useState<Student | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [allAvailableClasses, setAllAvailableClasses] = useState<Class[]>([]); // Nouveau state pour toutes les classes
  const [corrections, setCorrections] = useState<CorrectionAutreEnriched[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>('');
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [tabValue, setTabValue] = useState(0);
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [selectedClasses, setSelectedClasses] = useState<{ id: number, name: string }[]>([]);
  const [availableSubgroups, setAvailableSubgroups] = useState<string[]>([]);
  const [loadingSubgroups, setLoadingSubgroups] = useState(false);
  const [errorDetails, setErrorDetails] = useState<any>(null);
  

  useEffect(() => {
    if (!studentId) return;

    const fetchStudentData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const studentResponse = await fetch(`/api/students/${studentId}`);


        if (!studentResponse.ok) {
          const errorData = await studentResponse.json().catch(() => ({ error: 'Étudiant non trouvé' }));
          // Créer une instance d'Error et y attacher les détails
          const error = new Error('Erreur lors du chargement des informations de l\'étudiant :');
          (error as any).details = errorData.details || {};
          setError(error.message);
          setErrorDetails({
            message: typeof error === 'string' ? error : error.message,
            status: errorData.status || 500,
            statusText: errorData.statusText || '',
            details: errorData.error || 'Une erreur est survenue lors du chargement des données'
          });
          setLoading(false);
          return;
        }


        const studentData = await studentResponse.json();
        setStudent(studentData);
        setEditingStudent(studentData);

        // Récupérer toutes les classes disponibles (pas seulement celles de l'étudiant)
        const allClassesResponse = await fetch('/api/classes');
        if (allClassesResponse.ok) {
          const allClassesData = await allClassesResponse.json();
          setAllAvailableClasses(allClassesData);
        }

        const classesResponse = await fetch(`/api/students/${studentId}/classes`);
        if (classesResponse.ok) {
          const classesData = await classesResponse.json();
          
          let formattedClasses;
          
          if (Array.isArray(classesData) && classesData.length > 0 && classesData[0].class) {
            formattedClasses = classesData.map((c: any) => ({
              ...c.class,
              sub_class: c.sub_class,
              year: c.class.academic_year
            }));
            
            setSelectedClasses(classesData.map((c: any) => ({
              id: c.class.id,
              name: c.class.name
            })));
          } 
          else if (Array.isArray(classesData)) {
            formattedClasses = classesData.map((c: any) => ({
              ...c,
              sub_class: c.sub_class || c.subclass,
              year: c.academic_year
            }));
            
            setSelectedClasses(classesData.map((c: any) => ({
              id: c.id,
              name: c.name
            })));
          }
          
          setClasses(formattedClasses || []);
          
          if (studentData.classId) {
            fetchClassSubgroups(studentData.classId);
          }
        }

        const correctionsResponse = await fetch(`/api/students/${studentId}/corrections`);
        if (correctionsResponse.ok) {
          
          const correctionsData = await correctionsResponse.json();
          setCorrections(correctionsData);

          // Récupérer les activités associées pour obtenir les points max
          const activityIds = Array.from(new Set(correctionsData.map((c: CorrectionAutreEnriched) => c.activity_id)));
          const activitiesMap = new Map<number, ActivityAutre>();
          
          // Récupérer chaque activité individuellement
          for (const activityId of activityIds) {
            try {
              const activityResponse = await fetch(`/api/activities_autres/${activityId}`);
              if (activityResponse.ok) {
                const activity = await activityResponse.json();
                activitiesMap.set(Number(activityId), activity);
              }
            } catch (error) {
              console.error(`Erreur lors de la récupération de l'activité ${activityId}:`, error);
            }
          }

          // On filtre pour ne garder que les corrections notées
          const gradesFiltered = correctionsData.filter((c: CorrectionAutreEnriched) => c.final_grade !== null);
          
          // Normaliser chaque note sur 20 pour avoir des comparaisons équitables
          const normalizedGrades = gradesFiltered.map((c: CorrectionAutreEnriched) => {
            // Récupérer l'activité associée pour obtenir les points maximum
            const activity = activitiesMap.get(c.activity_id);
            
            // Calculer le total des points maximum à partir de l'activité
            const maxPoints = activity?.points && activity.points.length > 0 
              ? activity.points.reduce((sum, p) => sum + (typeof p === 'number' ? p : 0), 0) 
              : 20; // Si points n'est pas défini, on suppose un barème de 20
            
            // Normaliser la note sur 20
            return maxPoints > 0 ? (Number(c.final_grade) * 20) / maxPoints : 0;
          });
          
          const ungradedCount = correctionsData.length - gradesFiltered.length;

          // Calculer la moyenne des notes normalisées
          const averageGrade = normalizedGrades.length > 0 
            ? normalizedGrades.reduce((sum: number, grade: number) => sum + grade, 0) / normalizedGrades.length 
            : 0;
            
          setStats({
            averageGrade: parseFloat(averageGrade.toFixed(2)),
            totalCorrections: correctionsData.length,
            bestGrade: normalizedGrades.length > 0 ? Math.max(...normalizedGrades) : 0,
            worstGrade: normalizedGrades.length > 0 ? Math.min(...normalizedGrades) : 0,
            latestSubmission: correctionsData.length > 0 && correctionsData[0].submission_date
              ? dayjs(correctionsData[0].submission_date).format('DD/MM/YYYY') 
              : 'Aucune',
            totalActivities: new Set(correctionsData.map((c: CorrectionAutreEnriched) => c.activity_id)).size,
            classesCount: new Set(correctionsData.filter((c: CorrectionAutreEnriched) => c.class_id !== null).map((c: CorrectionAutreEnriched) => c.class_id)).size,
            gradedCount: gradesFiltered.length,
            ungradedCount: ungradedCount
          });
        }
      } catch (err) {
        console.error("Erreur:", err);
        setError(err instanceof Error ? err.message : "Une erreur est survenue");
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [studentId]);

  const fetchClassSubgroups = async (classId: number) => {
    setLoadingSubgroups(true);
    try {
      const response = await fetch(`/api/classes/${classId}/subgroups`);
      if (response.ok) {
        const data = await response.json();
        setAvailableSubgroups(data.subgroups || []);
      } else {
        setAvailableSubgroups([]);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des sous-groupes:", error);
      setAvailableSubgroups([]);
    } finally {
      setLoadingSubgroups(false);
    }
  };

  const handleOpenEditDialog = () => {
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    if (student) {
      setEditingStudent({ ...student });
    }
  };

  const handleSaveStudent = async () => {
    if (!editingStudent) return;
    
    try {
      const studentData = {
        ...editingStudent,
        classes: selectedClasses.map(cls => ({
          id: cls.id,
          group: cls.id === editingStudent.classId ? editingStudent.group : undefined
        }))
      };
      
      const response = await fetch(`/api/students/${studentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(studentData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`${errorData.error}` || "Erreur lors de la mise à jour de l'étudiant.");
      }
      
      setStudent(editingStudent);
      
      // Récupérer les classes mises à jour et les formater correctement
      const classesResponse = await fetch(`/api/students/${studentId}/classes`);
      if (classesResponse.ok) {
        const classesData = await classesResponse.json();
        
        let formattedClasses;
        
        if (Array.isArray(classesData) && classesData.length > 0 && classesData[0].class) {
          // Format where each item has a 'class' property
          formattedClasses = classesData.map((c: any) => ({
            id: c.class.id,
            name: c.class.name,
            sub_class: c.sub_class,
            year: c.class.academic_year
          }));
        } 
        else if (Array.isArray(classesData)) {
          // Format where each item is a class object directly
          formattedClasses = classesData.map((c: any) => ({
            id: c.id || c.class_id,
            name: c.name || c.class_name,
            sub_class: c.sub_class || c.subclass,
            year: c.academic_year
          }));
        }
        
        // Ensure all required properties exist to prevent "undefined" in UI
        const validatedClasses = formattedClasses?.map((c: any) => ({
          ...c,
          id: c.id || 0,
          name: c.name || 'Classe sans nom',
        })) || [];
        
        setClasses(validatedClasses);
      }
      
      setEditDialogOpen(false);
      
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      // Re-throw the error for the dialog to handle it
      throw error;
    }
  };

  const handleStudentChange = (updatedStudent: Student | null) => {
    setEditingStudent(updatedStudent);
  };

  const handleSelectedClassesChange = (classes: { id: number, name: string }[]) => {
    setSelectedClasses(classes);
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <Container sx={{ py: 4,display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Box sx={{ maxWidth: 400, width: '100%', mx: 'auto', textAlign: 'center' }}>
        <LoadingSpinner size="lg" text="Chargement des données de l'étudiant" />
          </Box>
        
      </Container>
    );
  }


  if (error || !student) {
    return (
      <Container maxWidth="lg" className="py-8">
        <div className="container mx-auto px-4 py-2 flex justify-center">
          <div className="w-full max-w-4xl animate-slide-in">
            <Paper className="p-6 overflow-hidden relative" elevation={3}>
              <ErrorDisplay 
                error={error || "Étudiant non trouvé"} 
                errorDetails={errorDetails}
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
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          borderRadius: 3, 
          overflow: 'hidden',
          mb: 4,
          transform: 'translateY(0)',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          '&:hover': {
            transform: 'translateY(-5px)',
            boxShadow: (theme) => `0 15px 50px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.15)'}`,
          }
        }}
      >
        <StudentHeader 
          student={student} 
          classes={classes} 
          onEditClick={handleOpenEditDialog} 
        />
        
        {stats && <StudentStatsDisplay stats={stats} />}
      </Paper>
      
      <Box sx={{ mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '1rem',
            }
          }}
        >
          <Tab icon={<AssignmentIcon />} label="Corrections" />
          <Tab icon={<GradeIcon />} label="Statistiques" />
          <Tab icon={<TrendingUpIcon />} label="Évolution" />
          <Tab icon={<SchoolIcon />} label="Classes" />
        </Tabs>
      </Box>
      
      {/* Onglet Corrections */}
      {tabValue === 0 && student && (
        <StudentCorrections 
          student={student} 
          corrections={corrections} 
        />
      )}
      
      {/* Onglet Statistiques */}
      {tabValue === 1 && stats && (
        <StudentStatistics corrections={corrections} stats={stats} />
      )}
      
      {/* Onglet Évolution */}
      {tabValue === 2 && (
        <StudentEvolution corrections={corrections} />
      )}
      
      {/* Onglet Classes */}
      {tabValue === 3 && student && (
        <StudentClasses 
          student={student} 
          classes={classes} 
          onAddClassClick={handleOpenEditDialog} // Passer la fonction pour ouvrir le même modal
        />
      )}
      
      <StudentEditDialogForDetail
        open={editDialogOpen}
        student={editingStudent}
        classes={allAvailableClasses.length > 0 ? allAvailableClasses : classes} // Utiliser toutes les classes disponibles
        selectedClasses={selectedClasses}
        availableSubgroups={availableSubgroups}
        loadingSubgroups={loadingSubgroups}
        onClose={handleCloseEditDialog}
        onSave={handleSaveStudent}
        onStudentChange={handleStudentChange}
        onSelectedClassesChange={handleSelectedClassesChange}
        fetchClassSubgroups={fetchClassSubgroups}
      />
    </Container>
  );
}
