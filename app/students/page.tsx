'use client';

import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Alert, 
  Paper, 
  Typography, 
  Box,
  IconButton,
  Button,
  Tooltip,
  alpha
} from '@mui/material';
import Grid from '@mui/material/Grid';
import LoadingSpinner from '@/components/LoadingSpinner';
import StudentsHeader from '@/components/students/StudentsHeader';
import StudentsTutorial from '@/components/students/StudentsTutorial';
import AllStudentsManager from '@/components/students/AllStudentsManager';
import GradientBackground from '@/components/ui/GradientBackground';
import PatternBackground from '@/components/ui/PatternBackground';
import Link from 'next/link';
import AddIcon from '@mui/icons-material/Add';
import PeopleIcon from '@mui/icons-material/People';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import SchoolIcon from '@mui/icons-material/School';
import AssignmentIcon from '@mui/icons-material/Assignment';

export interface Class {
  id: number;
  name: string;
  year: string;
}

export interface Student {
  id?: number;
  first_name: string;
  last_name: string;
  email: string;
  gender?: 'M' | 'F' | 'N';
  classId?: number | null;
  group?: string;
  // Added properties from enhancement
  className?: string;
  corrections_count?: number;
  additionalClasses?: {id: number, name: string}[];
}

// Additional types for student statistics
export interface StudentStats {
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
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

  // Fonction pour charger les données
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Récupérer les étudiants
      const studentsResponse = await fetch('/api/students');
      if (!studentsResponse.ok) {
        throw new Error('Erreur lors du chargement des étudiants');
      }
      const studentsData = await studentsResponse.json();
      
      // Récupérer toutes les classes en un seul appel
      const classesResponse = await fetch('/api/classes');
      if (!classesResponse.ok) {
        throw new Error('Erreur lors du chargement des classes');
      }
      const classesData = await classesResponse.json();
      setClasses(classesData);
      
      // Récupérer toutes les affectations étudiant-classe en un seul appel
      const studentClassesResponse = await fetch('/api/students/classes');
      if (!studentClassesResponse.ok) {
        throw new Error('Erreur lors du chargement des affectations des classes');
      }
      const studentClassesData = await studentClassesResponse.json();
      
      // Récupérer toutes les statistiques des étudiants en un seul appel
      const statsResponse = await fetch('/api/students/stats');
      if (!statsResponse.ok) {
        throw new Error('Erreur lors du chargement des statistiques');
      }
      const statsData = await statsResponse.json();
      
      // Organiser les données de classe par étudiant pour un accès plus facile
      const studentClassesMap: Record<number, { id: number, name: string }[]> = {};
      studentClassesData.forEach((item: { student_id: number, class_id: number, class_name: string }) => {
        if (!studentClassesMap[item.student_id]) {
          studentClassesMap[item.student_id] = [];
        }
        studentClassesMap[item.student_id].push({ 
          id: item.class_id, 
          name: item.class_name 
        });
      });
      
      // Organiser les statistiques par étudiant
      const statsMap: Record<number, { total_corrections: number, average_score: number }> = {};
      statsData.forEach((item: { student_id: number, total_corrections: number, average_score: number }) => {
        statsMap[item.student_id] = {
          total_corrections: item.total_corrections,
          average_score: item.average_score
        };
      });
      
      // Construire les enhanced students avec toutes les données
      const enhancedStudents = studentsData.map((student: Student) => {
        const studentClasses = studentClassesMap[student.id!] || [];
        const stats = statsMap[student.id!] || { total_corrections: 0, average_score: 0 };
        
        // Trouver la classe principale (celle qui correspond à classId)
        const primaryClass = student.classId ? 
          classesData.find((c: Class) => c.id === student.classId) : 
          null;
        
        // Filtrer les classes additionnelles (exclure la classe principale)
        const additionalClasses = studentClasses
          .filter(cls => cls.id !== student.classId)
          .map(cls => ({ id: cls.id, name: cls.name }));
        
        return {
          ...student,
          className: primaryClass ? primaryClass.name : 'Non assigné',
          corrections_count: stats.total_corrections,
          additionalClasses: additionalClasses
        };
      });
      
      // Dédupliquer les étudiants par ID au cas où
      const uniqueStudentsMap = new Map<number, Student>();
      enhancedStudents.forEach((student: Student) => {
        if (student.id) {
          uniqueStudentsMap.set(student.id, student);
        }
      });
      
      setStudents(Array.from(uniqueStudentsMap.values()));
      
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour forcer le rafraîchissement des données
  const handleDataUpdate = () => {
    setLastUpdate(Date.now());
  };

  // Chargement initial et rafraichissement après modification
  useEffect(() => {
    fetchData();
    
    // Vérifier si c'est la première visite pour montrer le tutoriel
    const hasSeenTutorial = localStorage.getItem('hasSeenStudentTutorial');
    // if (!hasSeenTutorial) {
    //   setShowTutorial(true);
    //   localStorage.setItem('hasSeenStudentTutorial', 'true');
   // }
   setShowTutorial(true);
  }, [lastUpdate]); // Utiliser lastUpdate pour déclencher le rechargement

  // Stats pour l'en-tête
  const totalStudents = students.length;
  const totalWithCorrections = students.filter(s => s.corrections_count && s.corrections_count > 0).length;
  const uniqueClasses = new Set(students.map(s => s.classId).filter(Boolean)).size;
  const studentsWithoutClass = students.filter(s => !s.classId).length;

  if (loading && students.length === 0) {
    return (
      <div className="container max-w-[400px] mx-auto px-4 py-8 flex justify-center">
        <LoadingSpinner size="lg" text="Chargement des étudiants" />
      </div>
    );
  }

  return (
    <Container maxWidth="lg" className="py-8">
      {/* Header */}
      <Paper 
        elevation={3} 
        sx={{ 
          borderRadius: 3,
          overflow: 'hidden',
          mb: 4,
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
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
                <PeopleIcon sx={{ fontSize: 36, color: (theme) => theme.palette.text.primary }} />
              </Box>
                
                <Box>
                  <Typography variant="h4" fontWeight={700} color="text.primary">Gestion des étudiants</Typography>
                  <Typography variant="subtitle1" color="text.secondary" sx={{ opacity: 0.9 }}>
                    Gérez vos étudiants et suivez leurs performances
                  </Typography>
                </Box>
              </Box>
              
              <div className="flex gap-2">
                <Tooltip title="Afficher le guide">
                  <IconButton 
                    color="info" 
                    onClick={() => setShowTutorial(!showTutorial)}
                    sx={{
                      color: 'secondary.light',
                      bgcolor: 'rgba(0, 0, 0, 0.3)',
                      backdropFilter: 'blur(10px)',
                      '&:hover': {
                        bgcolor: 'rgba(0, 0, 0, 0.48)',
                        color: 'secondary',
                      }
                    }}
                  >
                    <HelpOutlineIcon />
                  </IconButton>
                </Tooltip>
              </div>
            </Box>
          </PatternBackground>
        </GradientBackground>
        
        {/* Stats summary */}
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
                <Typography variant="h3" fontWeight="bold" color="text.primary">{totalStudents}</Typography>
                <Typography variant="overline" color="text.secondary">
                  {totalStudents === 1 ? 'étudiant' : 'étudiants'}
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
                <Typography variant="overline" color="text.secondary">Classes</Typography>
                <Typography variant="h3" fontWeight="bold" color="text.primary">{uniqueClasses}</Typography>
                <Typography variant="overline" color="text.secondary">
                  {uniqueClasses === 1 ? 'associée' : 'associées'}
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
                <Typography variant="overline" color="text.secondary">Corrigés</Typography>
                <Typography variant="h3" fontWeight="bold" color="text.primary">{totalWithCorrections}</Typography>
                <Typography variant="overline" color="text.secondary">
                  évalués
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
                <Typography variant="overline" color="text.secondary">Non assignés</Typography>
                <Typography variant="h3" fontWeight="bold" color="text.primary">{studentsWithoutClass}</Typography>
                <Typography variant="overline" color="text.secondary">
                  sans classe
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" className="mb-6" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {/* Tutoriel */}
      <StudentsTutorial 
        show={showTutorial} 
        onClose={() => setShowTutorial(false)} 
      />

      {/* Gestionnaire des étudiants */}
      <AllStudentsManager
        students={students}
        classes={classes}
        loading={loading}
        onStudentUpdate={handleDataUpdate}
        onError={setError}
      />
    </Container>
  );
}
