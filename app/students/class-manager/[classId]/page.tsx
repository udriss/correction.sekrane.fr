'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ClassStudentsManager from '@/components/classes/ClassStudentsManager';
import LoadingSpinner from '@/components/LoadingSpinner';
import { 
  Button,
  Box,
  Typography, 
  Alert,
  IconButton,
  Paper, 
  Container,
  Chip,
  Card,
  Tooltip,
  TextField,
  InputAdornment,
  useTheme,
  useMediaQuery,
  Breadcrumbs
} from '@mui/material';
import PatternBackground from '@/components/ui/PatternBackground';
import GradientBackground from '@/components/ui/GradientBackground';

// Icons
import PersonIcon from '@mui/icons-material/Person';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import SchoolIcon from '@mui/icons-material/School';
import AssignmentIcon from '@mui/icons-material/Assignment';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ClassIcon from '@mui/icons-material/Class';

interface ClassData {
  id: number;
  name: string;
  academic_year: string;
  nbre_subclasses?: number | null;
}

export default function ClassStudentManagerPage({ params }: { params: { classId: string } }) {
  const classId = parseInt(params.classId, 10);
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [studentStats, setStudentStats] = useState({
    total: 0,
    withCorrections: 0
  });
  
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const fetchClassData = async () => {
      try {
        setLoading(true);
        
        // Fetch class details
        const classResponse = await fetch(`/api/classes/${classId}`);
        
        if (classResponse.status === 404) {
          setError('Classe non trouvée');
          setLoading(false);
          return;
        }
        
        if (classResponse.status === 401) {
          // Redirection handled by middleware
          return;
        }
        
        if (!classResponse.ok) {
          throw new Error('Erreur lors du chargement des données de la classe');
        }
        
        const classDataResponse = await classResponse.json();
        setClassData(classDataResponse);
        
        // Fetch students stats
        const statsResponse = await fetch(`/api/classes/${classId}/stats`);
        
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStudentStats({
            total: statsData?.total_students || 0,
            withCorrections: statsData?.students_with_corrections || 0
          });
        }
      } catch (err) {
        console.error('Erreur:', err);
        setError('Une erreur est survenue lors du chargement des données.');
      } finally {
        setLoading(false);
      }
    };

    fetchClassData();
    
    // Show tutorial based on localStorage
    const hasSeenTutorial = localStorage.getItem('hasSeenClassStudentsTutorial');
    if (!hasSeenTutorial) {
      setShowTutorial(true);
      localStorage.setItem('hasSeenClassStudentsTutorial', 'true');
    }
  }, [classId]);

  if (loading) {
    return (
      <div className="container max-w-[400px] mx-auto px-4 py-8 flex justify-center">
        <LoadingSpinner size="lg" text="Chargement des données" />
      </div>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" className="py-8">
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={() => router.push('/students')}>
              Retour
            </Button>
          }
        >
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" className="py-8">
      {/* Breadcrumbs navigation */}
      <Box mb={3}>
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />}>
          <Link href="/students" className="text-blue-600 hover:underline flex items-center gap-1">
            <PersonIcon fontSize="small" />
            <span>Étudiants</span>
          </Link>
          <Typography color="text.primary" className="flex items-center gap-1">
            <ClassIcon fontSize="small" />
            <span>{classData?.name || 'Gestion de classe'}</span>
          </Typography>
        </Breadcrumbs>
      </Box>
      
      {/* Header with gradient and stats */}
      <Paper 
        elevation={3} 
        className="mb-8 rounded-lg overflow-hidden"
        style={{ 
          background: 'linear-gradient(to right, #581c87,rgb(7, 0, 193))'
        }}
      >
        <GradientBackground variant="primary" >
        <PatternBackground 
        pattern="cross" 
        opacity={0.75} 
        color="5566AA" 
        size={70}
        sx={{ p: 4, borderRadius: 2 }}
      >
        <div className="p-6 relative">          
          {/* Header content */}
          <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center mb:4">
            <div className="flex items-center gap-3 mb-4 sm:mb-0">
              <SchoolIcon fontSize="large" className="text-blue-200" />
              <div>
                <Typography variant="h4" component="h1" className="font-bold text-white mb-1">
                  {classData?.name}
                </Typography>
                <Typography variant="subtitle1" >
                  Gestion des étudiants de la classe {classData?.academic_year || ''}
                </Typography>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Tooltip title="Afficher le guide">
                <IconButton 
                  color="info" 
                  onClick={() => setShowTutorial(!showTutorial)}
                  className="bg-white/20 hover:bg-white/30"
                >
                  <HelpOutlineIcon />
                </IconButton>
              </Tooltip>
              
              <Button 
                variant="contained" 
                color="secondary" 
                startIcon={<ArrowBackIcon />} 
                component={Link} 
                href="/students"
                className="bg-gradient-to-r from-amber-500 to-amber-600 shadow-lg"
              >
                Retour aux étudiants
              </Button>
            </div>
          </div>
          
          {/* Stats bar */}
          <div className="relative z-10 mt-4 justify-center flex gap-10 sm:gap-6">
            <div className="flex justify-center sm:justify-start">
              <Paper className="p-3 bg-white/20 backdrop-blur-sm rounded-lg flex items-center gap-3">
                <PersonIcon className="text-blue-500" />
                <Typography variant="body2" >
                  {studentStats.total === 0 ? "Aucun étudiant" : 
                  studentStats.total === 1 ? "1 étudiant" : 
                  `${studentStats.total} étudiants`}
                </Typography>
              </Paper>
            </div>

            <div className="flex justify-center sm:justify-start">
              <Paper className="p-3 bg-white/20 backdrop-blur-sm rounded-lg flex items-center gap-3">
                <SchoolIcon className="text-blue-500" />
                <Typography variant="body2" >
                  {classData?.nbre_subclasses ? 
                    `${classData?.nbre_subclasses} groupe${classData?.nbre_subclasses > 1 ? 's' : ''}` : 
                    "Pas de groupes"}
                </Typography>
              </Paper>
            </div>

            <div className="flex justify-center sm:justify-start">
              <Paper className="p-3 bg-white/20 backdrop-blur-sm rounded-lg flex items-center gap-3">
                <AssignmentIcon className="text-blue-500" />
                <Typography variant="body2" >
                  {studentStats.withCorrections === 0 ? "Aucun étudiant corrigé" : 
                  studentStats.withCorrections === 1 ? "1 étudiant avec corrections" : 
                  `${studentStats.withCorrections} étudiants avec corrections`}
                </Typography>
              </Paper>
            </div>
          </div>
        </div>
        </PatternBackground>
        </GradientBackground>
      </Paper>
      
      {/* Tutorial Alert - conditionally rendered */}
      {showTutorial && (
        <Alert 
          severity="info" 
          className="mb-6"
          onClose={() => setShowTutorial(false)}
        >
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Gestion des étudiants de la classe
          </Typography>
          <Typography variant="body2">
            Cette page vous permet de gérer les étudiants de la classe {classData?.name}. 
            Vous pouvez ajouter des étudiants manuellement, importer une liste depuis un fichier CSV,
            et organiser les étudiants en groupes.
          </Typography>
        </Alert>
      )}
      
      {/* ClassStudentsManager component */}
      <ClassStudentsManager 
        classId={classId}
        classData={classData}
        embedded={false}
      />
    </Container>
  );
}
