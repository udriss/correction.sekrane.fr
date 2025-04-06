'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
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
  CardContent,
  CardActions,
  Tooltip,
  Divider,
  TextField,
  InputAdornment,
  Tab,
  Tabs,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  useTheme,
  useMediaQuery,
  alpha
} from '@mui/material';
import Grid from '@mui/material/Grid';
import GradientBackground from '@/components/ui/GradientBackground';
import H1Title from '@/components/ui/H1Title';
// Icons
import VisibilityIcon from '@mui/icons-material/Visibility';
import RateReviewIcon from '@mui/icons-material/RateReview';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import SearchIcon from '@mui/icons-material/Search';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ScienceIcon from '@mui/icons-material/Science';
import SchoolIcon from '@mui/icons-material/School';
import SortIcon from '@mui/icons-material/Sort';
import GroupIcon from '@mui/icons-material/Group';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { useRouter } from 'next/navigation';
import PatternBackground from 'components/ui/PatternBackground';

export interface Activity {
  id?: number;
  name: string;
  description?: string;
  type?: string;
  experimental_points: number;
  theoretical_points: number;
  userId?: number;
  createdAt?: string;
  updatedAt?: string;
  associated_classes?: number;
  correction_count?: number;
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/activities');
        
        if (response.status === 401) {
          // Redirection gérée par le middleware
          return;
        }
        
        if (!response.ok) {
          throw new Error('Erreur lors du chargement des activités');
        }
        
        const data = await response.json();
        
        // Enhance activities with associated_classes and correction_count
        const enhancedActivities = await Promise.all(data.map(async (activity: Activity) => {
          try {
            // Get associated classes count
            const classesResponse = await fetch(`/api/activities/${activity.id}/classes`);
            let associatedClassesCount = 0;
            if (classesResponse.ok) {
              const classesData = await classesResponse.json();
              associatedClassesCount = Array.isArray(classesData) ? classesData.length : 0;
            }
            
            // Get correction stats
            const statsResponse = await fetch(`/api/activities/${activity.id}/stats`);
            let correctionCount = 0;
            if (statsResponse.ok) {
              const statsData = await statsResponse.json();
              correctionCount = statsData?.total_corrections || 0;
            }
            
            return {
              ...activity,
              associated_classes: associatedClassesCount,
              correction_count: correctionCount
            };
          } catch (error) {
            console.error(`Error enhancing activity ${activity.id}:`, error);
            return {
              ...activity,
              associated_classes: 0,
              correction_count: 0
            };
          }
        }));
        
        setActivities(enhancedActivities);
      } catch (error) {
        console.error('Erreur:', error);
        setError('Une erreur est survenue lors du chargement des activités.');
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
    
    setShowTutorial(true);

    // Check if this is the first visit to show tutorial
    // const hasSeenTutorial = localStorage.getItem('hasSeenActivityTutorial');
    // if (!hasSeenTutorial) {
    //   setShowTutorial(true);
    //   localStorage.setItem('hasSeenActivityTutorial', 'true');
    // }
  }, []);

  const handleDeleteClick = (activityId: number) => {
    setConfirmingDelete(activityId);
  };

  const handleCancelDelete = () => {
    setConfirmingDelete(null);
  };

  const handleConfirmDelete = async (activityId: number) => {
    try {
      const response = await fetch(`/api/activities/${activityId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      // Mettre à jour la liste d'activités sans rechargement
      setActivities(activities.filter(activity => activity.id !== activityId));
      setConfirmingDelete(null);
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors de la suppression de l\'activité');
      setConfirmingDelete(null);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setFilterTab(newValue);
  };

  // Filter activities based on search term and tab
  const filteredActivities = activities
    .filter(activity => {
      // Filter by search term
      if (searchTerm && !activity.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Filter by tab (if not "All")
      if (filterTab === 1 && (!activity.associated_classes || activity.associated_classes <= 0)) {
        return false; // "With Classes" tab
      } else if (filterTab === 2 && (!activity.correction_count || activity.correction_count <= 0)) {
        return false; // "With Corrections" tab
      }
      
      return true;
    })
    .sort((a, b) => {
      // Sort by name
      return a.name.localeCompare(b.name);
    });

  // Calculate stats
  const totalActivities = activities.length;
  const totalWithClasses = activities.filter(a => a.associated_classes && a.associated_classes > 0).length;
  const totalWithCorrections = activities.filter(a => a.correction_count && a.correction_count > 0).length;
  const totalPoints = activities.reduce((sum, activity) => {
    const exp = activity.experimental_points || 0;
    const theo = activity.theoretical_points || 0;
    return sum + exp + theo;
  }, 0);

  // Group activities by type if needed (example grouping)
  const groupedActivities = activities.reduce((groups, activity) => {
    const type = activity.type || 'Non classé';
    if (!groups[type]) groups[type] = [];
    groups[type].push(activity);
    return groups;
  }, {} as Record<string, Activity[]>);

  if (loading) {
    return (
      <div className="container max-w-[400px] mx-auto px-4 py-8 flex justify-center">
        <LoadingSpinner size="lg" text="Chargement des activités" />
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
            opacity={0.02} 
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
                  <MenuBookIcon sx={{ fontSize: 50, color: (theme) => theme.palette.text.primary }} />
                </Box>
                
                <Box>
                  <Typography variant="h4" fontWeight={700} color="text.primary">Activités pédagogiques</Typography>
                  <Typography variant="subtitle1" color="text.secondary" sx={{ opacity: 0.9 }}>
                    Ajoutez et gérez les activités d'évaluation
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
                
                <Button 
                  variant="contained" 
                  color="secondary" 
                  startIcon={<AddIcon />} 
                  component={Link} 
                  href="/activities/new"
                  className="bg-gradient-to-r from-amber-500 to-amber-600 shadow-lg"
                >
                  Nouvelle activité
                </Button>
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
                <Typography variant="h3" fontWeight="bold" color="text.primary">{totalActivities}</Typography>
                <Typography variant="overline" color="text.secondary">
                  {totalActivities === 1 ? 'activité' : 'activités'}
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
                <Typography variant="h3" fontWeight="bold" color="text.primary">{totalWithClasses}</Typography>
                <Typography variant="overline" color="text.secondary">
                  {totalWithClasses === 1 ? 'associée' : 'associées'}
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
                <Typography variant="overline" color="text.secondary">Corrections</Typography>
                <Typography variant="h3" fontWeight="bold" color="text.primary">{totalWithCorrections}</Typography>
                <Typography variant="overline" color="text.secondary">
                  {totalWithCorrections === 1 ? 'enregistrée' : 'enregistrées'}
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
                <Typography variant="overline" color="text.secondary">Total points</Typography>
                <Typography variant="h3" fontWeight="bold" color="text.primary">{totalPoints}</Typography>
                <Typography variant="overline" color="text.secondary">
                  {totalPoints === 1 ? 'point' : 'points'}
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
        <Paper className="mb-8 p-4 border-l-4 border-purple-500 bg-purple-50">
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <TipsAndUpdatesIcon  sx={{ mr: 1, color: theme => theme.palette.secondary.dark }} />
            <Typography variant="h6" component="h2">
              Guide des activités
            </Typography>
            <Box sx={{ flexGrow: 1 }} />
            <IconButton size="small" onClick={() => setShowTutorial(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          
          <Stepper orientation="vertical" sx={{ my: 2 }} nonLinear>
            <Step active>
              <StepLabel>
                <Typography variant="subtitle1" fontWeight="bold">Ajouter une activité</Typography>
              </StepLabel>
              <StepContent>
                <Typography variant="body2">
                  Une activité représente un travail à évaluer. Définissez un nom clair et répartissez 
                  les points entre la partie expérimentale et théorique.
                </Typography>
              </StepContent>
            </Step>
            
            <Step active>
              <StepLabel>
                <Typography variant="subtitle1" fontWeight="bold">Associer à des classes</Typography>
              </StepLabel>
              <StepContent>
                <Typography variant="body2">
                  Associez votre activité à une ou plusieurs classes pour pouvoir l'utiliser 
                  dans l'évaluation des étudiants de ces classes.
                </Typography>
              </StepContent>
            </Step>
            
            <Step active>
              <StepLabel>
                <Typography variant="subtitle1" fontWeight="bold">Ajouter des corrections</Typography>
              </StepLabel>
              <StepContent>
                <Typography variant="body2">
                  Pour chaque étudiant, ajoutez une correction avec les points attribués.
                  Le système calculera automatiquement la note sur 20.
                </Typography>
              </StepContent>
            </Step>
          </Stepper>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button
              size="small"
              onClick={() => setShowTutorial(false)}
              sx={{color: theme => theme.palette.primary.dark, bgcolor: alpha(theme.palette.secondary.main, 0.1), '&:hover': { bgcolor: alpha(theme.palette.secondary.main, 0.2) }}}
            >
              J'ai compris
            </Button>
          </Box>
        </Paper>
      )}

      {/* Search and Filters */}
      <Paper className="mb-6 p-4" elevation={1}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 2, mb: 2 }}>
          <TextField
            placeholder="Rechercher une activité..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flexGrow: 1, maxWidth: 500 }}
            slotProps={{
              input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
              },
            }}
          />
          
          <Button
            variant="outlined"
            color="primary"
            startIcon={<AddIcon />}
            component={Link}
            href="/activities/new"
          >
            Nouvelle activité
          </Button>
        </Box>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={filterTab} onChange={handleTabChange}>
            <Tab label="Toutes" />
            <Tab label="Avec classes" />
            <Tab label="Avec corrections" />
          </Tabs>
        </Box>
      </Paper>

      {/* Activities Grid or Empty State */}
      <div className="max-w-3xl mx-auto">
        {activities.length === 0 ? (
          <Box textAlign="center" my={8} className="p-8 border border-dashed border-gray-300 rounded-lg">
            <MenuBookIcon fontSize="large" className="text-gray-400 mb-4" />
            <Typography variant="h6" gutterBottom>
              Aucune activité trouvée
            </Typography>
            <Typography variant="body1" color="textSecondary" mb={4} className="max-w-md mx-auto">
              Les activités sont la base de votre système d'évaluation. Ajoutez votre première activité 
              pour commencer à noter vos étudiants.
            </Typography>
            <Button 
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              component={Link}
              href="/activities/new"
              size="large"
              className="shadow-lg"
            >
              Ajouter ma première activité
            </Button>
          </Box>
        ) : (
          <div className="space-y-6">
            {filteredActivities.length === 0 ? (
              <Paper className="p-8 text-center">
                <SearchIcon fontSize="large" className="text-gray-400 mb-2" />
                <Typography variant="h6" className="mb-2">Aucune activité ne correspond à cette recherche</Typography>
                <Button 
                  onClick={() => {
                    setSearchTerm('');
                    setFilterTab(0);
                  }}
                  variant="outlined"
                >
                  Réinitialiser les filtres
                </Button>
              </Paper>
            ) : (
              <Grid container spacing={5}>
                {filteredActivities.map((activity) => (
                  <Grid size={{ xs: 12, md: 12 }} key={activity.id}>
                    <Card className="hover:shadow-lg transition-shadow" sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1, }}>
                            <Typography variant="h6" component="h3" className="font-bold">
                              {activity.name}
                            </Typography>
                            
                            {/* Boutons de suppression avec confirmation */}
                            <Box>
                              {confirmingDelete === activity.id ? (
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                  <IconButton
                                    onClick={() => handleConfirmDelete(activity.id!)}
                                    color="success"
                                    size="small"
                                    title="Confirmer la suppression"
                                  >
                                    <CheckIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton
                                    onClick={handleCancelDelete}
                                    color="inherit"
                                    size="small"
                                    title="Annuler la suppression"
                                  >
                                    <CloseIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                              ) : (
                                <IconButton
                                  onClick={() => handleDeleteClick(activity.id!)}
                                  color="error"
                                  size="small"
                                  title="Supprimer cette activité"
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              )}
                            </Box>
                          </Box>
                      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' } }}>
                        <CardContent sx={{ flex: '1 1 auto' }}>                          
                          {/* Activity details */}
                          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                            {/* Left side - Points information and stats */}
                            <Box sx={{ flex: '1 1 auto', minWidth: '200px' }}>
                              {/* Total points indicator */}
                              <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <AssessmentIcon color="primary" />
                                <Typography variant="h6" color="primary.main">
                                  {activity.experimental_points + activity.theoretical_points} points au total
                                </Typography>
                              </Box>
                              
                              {/* Points breakdown */}
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
                                <Tooltip title="Voir les détails de cette activité">
                                  <Chip 
                                    icon={<ScienceIcon />}
                                    label={`${activity.experimental_points} pts exp.`}
                                    size="small"
                                    color="primary"
                                    variant="outlined" 
                                    component={Link}
                                    href={`/activities/${activity.id}`}
                                    clickable
                                    sx={{ 
                                      cursor: 'pointer',
                                      '&:hover': { 
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                                        backgroundColor: 'rgba(25, 118, 210, 0.08)'
                                      }
                                    }}
                                  />
                                </Tooltip>
                                <Tooltip title="Voir les détails de cette activité">
                                  <Chip 
                                    icon={<MenuBookIcon />}
                                    label={`${activity.theoretical_points} pts théo.`}
                                    size="small"
                                    variant="outlined"
                                    component={Link}
                                    href={`/activities/${activity.id}`}
                                    clickable
                                    sx={{ 
                                      cursor: 'pointer',
                                      color: theme => theme.palette.secondary.dark, 
                                      bgcolor: alpha(theme.palette.secondary.main, 0.02), 
                                      '&:hover': { bgcolor: alpha(theme.palette.secondary.main, 0.2)
                                      }
                                    }}
                                  />
                                </Tooltip>
                              </Box>
                              
                              {/* Usage stats */}
                              <Box sx={{ mt: 3 }}>
                                {activity.associated_classes && activity.associated_classes > 0 ? (
                                  <Tooltip title="Voir les classes associées">
                                    <Chip
                                      icon={<SchoolIcon />}
                                      label={`${activity.associated_classes} classe${activity.associated_classes > 1 ? 's' : ''}`}
                                      size="small"
                                      color="info"
                                      variant="outlined"
                                      component={Link}
                                      href={`/activities/${activity.id}?tab=classes`}
                                      clickable
                                      sx={{ 
                                        cursor: 'pointer',
                                        '&:hover': { 
                                          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                                          backgroundColor: 'rgba(2, 136, 209, 0.08)'
                                        }
                                      }}
                                    />
                                  </Tooltip>
                                ) : (
                                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <SchoolIcon fontSize="small" color="disabled" /> Non associée à une classe
                                  </Typography>
                                )}
                                
                                <Box sx={{ mt: 1 }}>
                                  {activity.correction_count !== undefined && activity.correction_count > 0 ? (
                                    <Tooltip title="Voir les corrections existantes">
                                      <Chip
                                        icon={<RateReviewIcon />}
                                        label={`${activity.correction_count} correction${activity.correction_count > 1 ? 's' : ''}`}
                                        size="small"
                                        color="success"
                                        variant="outlined"
                                        component={Link}
                                        href={`/activities/${activity.id}?tab=2`}
                                        clickable
                                        sx={{ 
                                          cursor: 'pointer', 
                                          '&:hover': { 
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                                            backgroundColor: 'rgba(46, 125, 50, 0.08)'
                                          }
                                        }}
                                      />
                                    </Tooltip>
                                  ) : (
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                      <RateReviewIcon fontSize="small" color="disabled" /> Aucune correction
                                    </Typography>
                                  )}
                                </Box>
                              </Box>
                              
                              {/* Last updated */}
                              {activity.updatedAt && (
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 3 }}>
                                  Dernière mise à jour: {new Date(activity.updatedAt).toLocaleDateString('fr-FR')}
                                </Typography>
                              )}
                            </Box>
                            
                            {/* Right side - Activity description */}
                            <Box sx={{ flex: '1 1 auto', minWidth: '200px' }}>
                              {activity.description ? (
                                <>
                                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    Description:
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {activity.description}
                                  </Typography>
                                </>
                              ) : (
                                <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                                  Aucune description disponible
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </CardContent>
                        
                        <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
                        <Divider sx={{ display: { xs: 'block', sm: 'none' } }} />
                        
                        <Box sx={{ 
                          flex: '0 1 auto',
                          display: 'flex', 
                          flexDirection: 'column', 
                          justifyContent: 'center',
                          p: 2,
                          gap: 1
                        }}>
                          <Button 
                            variant="outlined" 
                            color="primary" 
                            href={`/activities/${activity.id}`} 
                            component={Link}
                            startIcon={<VisibilityIcon />}
                            size="small"
                            fullWidth
                          >
                            Détails
                          </Button>
                          <Button 
                            variant="outlined" 
                            color='primary'
                            href={`/activities/${activity.id}/corrections/`} 
                            component={Link}
                            startIcon={<RateReviewIcon />}
                            size="small"
                            fullWidth
                            sx={{color: theme => theme.palette.success.dark, 
                              bgcolor: alpha(theme.palette.success.main, 0.02), 
                              '&:hover': { bgcolor: alpha(theme.palette.success.main, 0.2) }}}
                          >
                            Nouvelle correction
                          </Button>
                          <Button 
                            variant="outlined" 
                            color='success'
                            href={`/activities/${activity.id}/corrections/multiples`} 
                            component={Link}
                            startIcon={<RateReviewIcon />}
                            size="small"
                            fullWidth
                            sx={{color: theme => theme.palette.success.dark, 
                              bgcolor: alpha(theme.palette.success.main, 0.02), 
                              '&:hover': { bgcolor: alpha(theme.palette.success.main, 0.2) }}}
                          >
                            Corrections en lot
                          </Button>
                        </Box>
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </div>
        )}
      </div>
    </Container>
  );
}
