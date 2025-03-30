'use client';

import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Paper, 
  Button, 
  Alert, 
  Container,
  Card,
  CardContent,
  CardActions,
  Chip,
  Box,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Divider,
  useTheme,
  useMediaQuery,
  IconButton,
  Tooltip,
  alpha
} from '@mui/material';
import Grid from '@mui/material/Grid';
import GradientBackground from '@/components/ui/GradientBackground';
// Icons
import AddIcon from '@mui/icons-material/Add';
import SchoolIcon from '@mui/icons-material/School';
import GroupIcon from '@mui/icons-material/Group';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import DownloadIcon from '@mui/icons-material/Download';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useRouter } from 'next/navigation';
import PatternBackground from '@/components/ui/PatternBackground';

interface Class {
  id: number;
  name: string;
  description: string;
  academic_year: string;
  student_count?: number;
  activity_count?: number;
  created_at: string;
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showTutorial, setShowTutorial] = useState(false);
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalActivities, setTotalActivities] = useState(0);
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    fetchClasses();
    fetchTotalStudents();
    fetchTotalActivities();
    
    // Initialiser showTutorial à true pour l'afficher par défaut à chaque visite
    setShowTutorial(true);

    // Check if this is the first visit to show tutorial
    // const hasSeenTutorial = localStorage.getItem('hasSeenClassTutorial');
    // if (!hasSeenTutorial) {
    //   setShowTutorial(true);
    //   localStorage.setItem('hasSeenClassTutorial', 'true');
    // }
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/classes');
      if (!response.ok) throw new Error('Erreur lors du chargement des classes');
      
      const data = await response.json();
      setClasses(data);
    } catch (err) {
      console.error('Erreur:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  // New function to fetch total students
  const fetchTotalStudents = async () => {
    try {
      const response = await fetch('/api/students');
      if (response.ok) {
        const data = await response.json();
        
        setTotalStudents(data.length);
        
      } else {
        console.error('Error fetching total students');
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    }
  };

  // New function to fetch total activities
  const fetchTotalActivities = async () => {
    try {
      const response = await fetch('/api/activities');
      if (response.ok) {
        const data = await response.json();
        setTotalActivities(Array.isArray(data) ? data.length : 0);
      } else {
        console.error('Error fetching total activities');
      }
    } catch (err) {
      console.error('Error fetching activities:', err);
    }
  };

  // Function to navigate to class with specific tab
  const navigateToClassTab = (classId: number, tabIndex: number) => {
    router.push(`/classes/${classId}#tab=${tabIndex}`);
  };

  if (loading) {
    return (
      <div className="container max-w-[400px] mx-auto px-4 py-8 flex justify-center">
        <LoadingSpinner size="lg" text="Chargement des classes" />
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
                  <SchoolIcon sx={{ fontSize: 36, color: (theme) => theme.palette.text.primary }} />
                </Box>
                
                <Box>
                  <Typography variant="h4" fontWeight={700} color="text.primary">Gestion des classes</Typography>
                  <Typography variant="subtitle1" color="text.secondary" sx={{ opacity: 0.9 }}>
                    Organisez vos cours et suivez les progrès de vos étudiants
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
                <Typography variant="h3" fontWeight="bold" color="text.primary">{classes.length}</Typography>
                <Typography variant="overline" color="text.secondary">
                  {classes.length === 1 ? 'classe' : 'classes'}
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
                <Typography variant="overline" color="text.secondary">Étudiants</Typography>
                <Typography variant="h3" fontWeight="bold" color="text.primary">{totalStudents}</Typography>
                <Typography variant="overline" color="text.secondary">
                  {totalStudents === 1 ? 'inscrit' : 'inscrits'}
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
                <Typography variant="overline" color="text.secondary">Activités</Typography>
                <Typography variant="h3" fontWeight="bold" color="text.primary">{totalActivities}</Typography>
                <Typography variant="overline" color="text.secondary">
                  {totalActivities === 1 ? 'disponible' : 'disponibles'}
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
                <Typography variant="overline" color="text.secondary">Années</Typography>
                <Typography variant="h3" fontWeight="bold" color="text.primary">
                  {Array.from(new Set(classes.map(cls => cls.academic_year))).length}
                </Typography>
                <Typography variant="overline" color="text.secondary">
                  {Array.from(new Set(classes.map(cls => cls.academic_year))).length === 1 ? 'académique' : 'académiques'}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" className="mb-6">
          {error}
        </Alert>
      )}
      
      {/* Tutorial Section */}
      {showTutorial && (
        <Paper className="mb-8 p-4 border-l-4 border-blue-500 bg-blue-50">
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <TipsAndUpdatesIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6" component="h2">
              Guide de démarrage rapide
            </Typography>
            <Box sx={{ flexGrow: 1 }} />
            <IconButton size="small" onClick={() => setShowTutorial(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          
          <Stepper orientation="vertical" sx={{ my: 2 }} nonLinear>
            <Step active>
              <StepLabel>
                <Typography variant="subtitle1" fontWeight="bold">Ajoutez une classe</Typography>
              </StepLabel>
              <StepContent>
                <Typography variant="body2">
                  Commencez par ajouter une classe pour un cours spécifique. Ajoutez une description
                  et précisez l'année académique.
                </Typography>
              </StepContent>
            </Step>
            
            <Step active>
              <StepLabel>
                <Typography variant="subtitle1" fontWeight="bold">Ajoutez des étudiants</Typography>
              </StepLabel>
              <StepContent>
                <Typography variant="body2">
                  Ajoutez des étudiants individuellement ou importez-les depuis un fichier CSV.
                  Vous pourrez les organiser en groupes si nécessaire.
                </Typography>
              </StepContent>
            </Step>
            
            <Step active>
              <StepLabel>
                <Typography variant="subtitle1" fontWeight="bold">Ajoutez des activités</Typography>
              </StepLabel>
              <StepContent>
                <Typography variant="body2">
                  Définissez des activités d'évaluation avec des points expérimentaux et théoriques
                  que vous pourrez associer à votre classe.
                </Typography>
              </StepContent>
            </Step>
            
            <Step active>
              <StepLabel>
                <Typography variant="subtitle1" fontWeight="bold">Enregistrez les corrections</Typography>
              </StepLabel>
              <StepContent>
                <Typography variant="body2">
                  Notez les travaux des étudiants avec le système de correction qui calcule
                  automatiquement les moyennes et organise les résultats.
                </Typography>
              </StepContent>
            </Step>
          </Stepper>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Button 
              size="small"
              startIcon={<DownloadIcon />}
              variant="outlined"
              disabled
            >
              Télécharger le guide complet
            </Button>
            
            <Button
              size="small"
              onClick={() => setShowTutorial(false)}
              color="primary"
            >
              Fermer le guide
            </Button>
          </Box>
        </Paper>
      )}

      {/* Quick Actions Bar */}
      <Paper className="mb-8 p-4" elevation={1} sx={{ 
        borderRadius: 2, display: 'flex', flexDirection: 'row', gap: 2,
        justifyContent: 'space-between', alignItems: 'center',}}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', flexDirection: 'column', alignItems: 'left' }}>
        <Typography variant="subtitle2" gutterBottom color="textSecondary">
          Actions rapides
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <Button 
            size="small" 
            variant="outlined"
            startIcon={<AddIcon />}
            component={Link}
            href="/classes/new"
          >
            Nouvelle classe
          </Button>
          <Button 
            size="small" 
            variant="outlined"
            startIcon={<GroupIcon />}
            component={Link}
            href="/students"
          >
            Gérer étudiants
          </Button>
          <Button 
            size="small" 
            variant="outlined"
            startIcon={<MenuBookIcon />}
            component={Link}
            href="/activities"
          >
            Activités
          </Button>
          <Button 
            size="small" 
            variant="outlined"
            startIcon={<AnalyticsIcon />}
            component={Link}
            href="/reports"
          >
            Rapports
          </Button>
        </Box>
        </Box>

                        
        <Button 
          variant="contained" 
          color="secondary" 
          startIcon={<AddIcon />} 
          component={Link} 
          href="/classes/new"
          className="bg-gradient-to-r from-amber-500 to-amber-600 shadow-lg"
        >
          Nouvelle classe
        </Button>
      </Paper>

      {/* Classes Grid or Empty State */}
      {!loading && classes.length === 0 ? (
        <Paper className="p-8 text-center border border-dashed border-gray-300">
          <SchoolIcon fontSize="large" className="text-gray-400 mb-2" />
          <Typography variant="h6" className="mb-2">Aucune classe</Typography>
          <Typography variant="body2" sx={{mb: 4, color: 'text.secondary', maxWidth: '500px', mx: 'auto' }}>
            Commencez par ajouter une nouvelle classe pour y associer des étudiants et des activités.
            Vous pourrez ensuite ajouter des corrections et suivre les progrès des étudiants.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            component={Link}
            href="/classes/new"
            size="large"
            className="shadow-lg"
          >
            Ajouter ma première classe
          </Button>
        </Paper>
      ) : (
        <div className="max-w-4xl mx-auto">
          {/* Academic Year Groups */}
          {Array.from(new Set(classes.map(cls => cls.academic_year))).map(year => (
            <div key={year} className="mb-8">
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="h6" component="h2" className="font-bold text-gray-700">
                  {year}
                </Typography>
                <Chip 
                  size="small" 
                  label={classes.filter(c => c.academic_year === year).length} 
                  sx={{ ml: 2 }} 
                  color="primary"
                />
              </Box>
              
              <Grid container spacing={3}>
                {classes
                  .filter(cls => cls.academic_year === year)
                  .map((cls) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={cls.id}>
                    <Card className="h-full flex flex-col hover:shadow-lg transition-shadow border border-gray-100">
                      <CardContent className="flex-grow">
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Typography variant="h6" component="h3" className="font-bold">
                            {cls.name}
                          </Typography>
                          <IconButton 
                            size="small" 
                            component={Link} 
                            href={`/classes/${cls.id}`} 
                            className="ml-2"
                            aria-label="Voir détails"
                          >
                            <InfoOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Box>
                        
                        {cls.description && (
                          <Typography variant="body2" className="mb-3 text-gray-600 line-clamp-2">
                            {cls.description}
                          </Typography>
                        )}
                        
                        <div className="flex gap-2 mt-3 flex-wrap">
                          <Chip 
                            icon={<GroupIcon fontSize="small" />} 
                            label={`${cls.student_count || 0} étudiants`}
                            size="small"
                            color="primary"
                            variant="outlined"
                            className="cursor-pointer"
                            onClick={() => navigateToClassTab(cls.id, 1)}
                          />
                          <Chip 
                            icon={<MenuBookIcon fontSize="small" />} 
                            label={`${cls.activity_count || 0} activités`}
                            size="small"
                            color="secondary"
                            variant="outlined"
                            className="cursor-pointer"
                            onClick={() => navigateToClassTab(cls.id, 0)}
                          />
                          <Chip 
                            icon={<AssignmentTurnedInIcon fontSize="small" />} 
                            label="Corrections"
                            size="small"
                            color="info"
                            variant="outlined"
                            className="cursor-pointer"
                            onClick={() => navigateToClassTab(cls.id, 2)}
                          />
                        </div>
                      </CardContent>
                      <Divider />
                      <CardActions>
                        <Button 
                          size="small" 
                          component={Link} 
                          href={`/classes/${cls.id}`}
                          className="text-blue-700"
                        >
                          Voir détails
                        </Button>
                        <Button 
                          size="small" 
                          component={Link} 
                          href={`/classes/${cls.id}/students`}
                          className="text-blue-700"
                        >
                          Gérer étudiants
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </div>
          ))}
        </div>
      )}
    </Container>
  );
}

// Need to import these at the end to avoid circular dependencies
import CloseIcon from '@mui/icons-material/Close';
