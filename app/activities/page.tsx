'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSnackbar } from 'notistack';
import { ActivityAutre } from '@/lib/types';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  IconButton,
  TextField,
  InputAdornment,
  Divider,
  Chip,
  Tooltip,
  Alert,
  Grid,
  Card,
  CardContent,
  alpha,
  useTheme,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  List,
  ListItem,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RateReviewIcon from '@mui/icons-material/RateReview';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import AssignmentLateIcon from '@mui/icons-material/AssignmentLate';
import GradientBackground from '@/components/ui/GradientBackground';
import PatternBackground from '@/components/ui/PatternBackground';
import LoadingSpinner from '@/components/LoadingSpinner';
import { fr } from 'date-fns/locale';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';

// Configuration française personnalisée pour les DatePickers
const frenchAdapter = new AdapterDateFns({
  locale: fr,
  formats: {
    keyboardDate: 'dd/MM/yyyy',
    normalDate: 'dd/MM/yyyy',
    shortDate: 'dd/MM/yyyy',
    year: 'yyyy',
    month: 'MMMM',
    monthShort: 'MMM',
    dayOfMonth: 'dd',
    weekday: 'EEEE',
    weekdayShort: 'EEE'
  }
});

export default function ActivitiesAutresPage() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  
  const [activities, setActivities] = useState<ActivityAutre[]>([]);
  const [enhancedActivities, setEnhancedActivities] = useState<(ActivityAutre & { 
    correction_count?: number;
    inactive_corrections_count?: number;
    associated_classes?: number;
    absent_count?: number;
    non_rendu_count?: number;
    classes?: any[]; // Ajouté pour le filtrage multi-classes
  })[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<(ActivityAutre & {
    correction_count?: number;
    inactive_corrections_count?: number;
    associated_classes?: number;
    absent_count?: number;
    non_rendu_count?: number;
    classes?: any[]; // Ajouté pour le filtrage multi-classes
  })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [showTutorial, setShowTutorial] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState<number | null>(null);
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(null);
  const [allClasses, setAllClasses] = useState<any[]>([]);
  const [selectedClassIds, setSelectedClassIds] = useState<number[]>([]);
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [dateModifFrom, setDateModifFrom] = useState<Date | null>(null);
  const [dateModifTo, setDateModifTo] = useState<Date | null>(null);
  
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/activities_autres');
        
        if (!response.ok) {
          throw new Error('Erreur lors du chargement des activités');
        }
        
        const data = await response.json();
        setActivities(data);
        
        // Enrichir les activités avec des informations supplémentaires
        const enhancedActivitiesData = await Promise.all(data.map(async (activity: ActivityAutre) => {
          try {
            // Récupérer le nombre de classes associées
            const classesResponse = await fetch(`/api/activities_autres/${activity.id}/classes`);
            let associatedClassesCount = 0;
            let associatedClasses: any[] = [];
            if (classesResponse.ok) {
              const classesData = await classesResponse.json();
              associatedClassesCount = Array.isArray(classesData) ? classesData.length : 0;
              associatedClasses = Array.isArray(classesData) ? classesData : [];
            }
            
            // Récupérer les statistiques des corrections
            const statsResponse = await fetch(`/api/activities_autres/${activity.id}/stats?includeInactive=true`);
            let correctionCount = 0;
            let inactiveCorrectionsCount = 0;
            let absentCount = 0;
            let nonRenduCount = 0;
            
            if (statsResponse.ok) {
              const statsData = await statsResponse.json();
              
              // Analyser les données de statistiques retournées
              if (Array.isArray(statsData)) {
                // Si c'est un tableau (ancienne structure)
                correctionCount = statsData.reduce((total, group) => total + (Number(group.count) || 0), 0);
                inactiveCorrectionsCount = statsData.reduce((total, group) => total + (Number(group.inactive_count) || 0), 0);
                absentCount = statsData.reduce((total, group) => total + (Number(group.absent_count) || 0), 0);
                nonRenduCount = statsData.reduce((total, group) => total + (Number(group.non_rendu_count) || 0), 0);
              } else {
                // Si c'est un objet (structure actuelle)
                // Vérifier si totalCorrections existe ou utiliser count comme fallback
                if (statsData.totalCorrections !== undefined) {
                  correctionCount = Number(statsData.totalCorrections) || 0;
                } else if (statsData.count !== undefined) {
                  correctionCount = Number(statsData.count) || 0;
                }
                
                // Obtenir le nombre de corrections inactives
                inactiveCorrectionsCount = Number(statsData.inactive_count) || 0;
                
                // Obtenir le nombre d'absents et de travaux non rendus
                absentCount = Number(statsData.absent_count) || 0;
                nonRenduCount = Number(statsData.non_rendu_count) || 0;
                
                // Calculer le vrai nombre de corrections actives
                // Si le nombre total inclut les inactives, soustraire les inactives pour avoir les actives
                if (correctionCount > 0 && inactiveCorrectionsCount > 0) {
                  correctionCount = correctionCount - inactiveCorrectionsCount - absentCount - nonRenduCount;
                }
              }
            }
            
            return {
              ...activity,
              associated_classes: associatedClassesCount,
              classes: associatedClasses,
              correction_count: correctionCount,
              inactive_corrections_count: inactiveCorrectionsCount,
              absent_count: absentCount,
              non_rendu_count: nonRenduCount
            };
          } catch (error) {
            console.error(`Erreur lors de la récupération des données pour l'activité ${activity.id}:`, error);
            return {
              ...activity,
              associated_classes: 0,
              correction_count: 0,
              inactive_corrections_count: 0
            };
          }
        }));
        
        setEnhancedActivities(enhancedActivitiesData);
        setFilteredActivities(enhancedActivitiesData);
        
        // Afficher le tutoriel
        // setShowTutorial(true);
      } catch (err) {
        console.error('Erreur:', err);
        setError(`Erreur: ${(err as Error).message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchActivities();
  }, []);
  
  // Récupérer toutes les classes pour le filtre
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await fetch('/api/classes');
        if (res.ok) {
          const data = await res.json();
          setAllClasses(data);
        }
      } catch (e) { /* ignore */ }
    };
    fetchClasses();
  }, []);
  
  // Filtrer les activités lorsque le terme de recherche change ou que les filtres changent
  useEffect(() => {
    // Si les activités enrichies ne sont pas encore chargées, ne rien faire
    if (enhancedActivities.length === 0) return;
    
    let filtered = [...enhancedActivities];
    
    // Appliquer le filtre de recherche
    if (searchTerm.trim() !== '') {
      const lowercaseSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(activity => 
        activity.name.toLowerCase().includes(lowercaseSearchTerm) ||
        (activity.content && activity.content.toLowerCase().includes(lowercaseSearchTerm))
      );
    }
    
    // Filtre multi-classes
    if (selectedClassIds.length > 0) {
      filtered = filtered.filter(activity => {
        if (!activity.id) return false;
        // On suppose que chaque activité a une propriété 'classes' (array d'objets {id, name, ...})
        if (Array.isArray(activity.classes)) {
          return activity.classes.some((cls: any) => selectedClassIds.includes(cls.id));
        }
        // fallback: si pas de détail, on ne filtre que si au moins une classe est associée
        return false;
      });
    }
    
    // Filtre date de création
    if (dateFrom) {
      filtered = filtered.filter(activity => activity.created_at && new Date(activity.created_at) >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter(activity => activity.created_at && new Date(activity.created_at) <= dateTo);
    }
    
    // Filtre date de modification
    if (dateModifFrom) {
      filtered = filtered.filter(activity => activity.updated_at && new Date(activity.updated_at) >= dateModifFrom);
    }
    if (dateModifTo) {
      filtered = filtered.filter(activity => activity.updated_at && new Date(activity.updated_at) <= dateModifTo);
    }
    
    // Trier les activités par nom
    filtered.sort((a, b) => a.name.localeCompare(b.name));
    
    setFilteredActivities(filtered);
  }, [searchTerm, enhancedActivities, selectedClassIds, dateFrom, dateTo, dateModifFrom, dateModifTo]);
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  const handleCreateActivity = () => {
    router.push('/activities/new');
  };
  
  const handleActivitySelect = (activityId: number) => {
    setSelectedActivityId(activityId);
  };
  
  const handleDeleteClick = (activityId: number) => {
    setConfirmingDelete(activityId);
  };
  
  const handleCancelDelete = () => {
    setConfirmingDelete(null);
  };
  
  const handleConfirmDelete = async (activityId: number) => {
    try {
      const response = await fetch(`/api/activities_autres/${activityId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      // Mettre à jour la liste d'activités sans rechargement
      setEnhancedActivities(enhancedActivities.filter(activity => activity.id !== activityId));
      setConfirmingDelete(null);
      enqueueSnackbar('Activité supprimée avec succès', { variant: 'success' });
    } catch (err) {
      console.error('Erreur:', err);
      enqueueSnackbar(`Erreur: ${(err as Error).message}`, { variant: 'error' });
      setConfirmingDelete(null);
    }
  };
  
  // Calculer le total des points d'une activité
  const calculateTotalPoints = (activity: ActivityAutre) => {
    return activity.points.reduce((sum, point) => sum + point, 0);
  };
  
  if (loading) {
    return (
      <div className="container max-w-[400px] mx-auto px-4 py-8 flex justify-center">
        <LoadingSpinner size="lg" text="Chargement des activités" />
      </div>
    );
  }
  

  // Fonction pour afficher une activité
  const renderActivityCard = (activity: ActivityAutre & {
    correction_count?: number;
    inactive_corrections_count?: number;
    associated_classes?: number;
    absent_count?: number;
    non_rendu_count?: number;
  }) => (
    <Card className="hover:shadow-lg transition-shadow" sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
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
                size="large"
                title="Confirmer la suppression"
              >
                <CheckIcon fontSize="large" />
              </IconButton>
              <IconButton
                onClick={handleCancelDelete}
                color="inherit"
                size="large"
                title="Annuler la suppression"
              >
                <CloseIcon fontSize="large" />
              </IconButton>
            </Box>
          ) : (
            <IconButton
              onClick={() => handleDeleteClick(activity.id!)}
              color="error"
              size='large'
              title="Supprimer cette activité"
            >
              <DeleteIcon fontSize="large" />
            </IconButton>
          )}
        </Box>
      </Box>
      <Grid container sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' } }}>
        <Grid size={{ xs: 12, md: 8 }}>
          <CardContent sx={{ flex: '1 1 auto' }}>                          
            {/* Activity details */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start' }}>
              {/* Left side - Points information and stats */}
              <Box sx={{ flex: '1 1 auto', minWidth: '200px' }}>
                {/* Total points indicator */}
                <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AssessmentIcon color="primary" />
                  <Box>
                    {calculateTotalPoints(activity) === 0 ? (
                      <Typography variant="h6" color="text.secondary">
                        Aucun point
                      </Typography>
                    ) : calculateTotalPoints(activity) === 1 ? (
                      <Typography variant="h6" color="primary.main">
                        1 seul point au total
                      </Typography>
                    ) : (
                      <Typography variant="h6" color="primary.main">
                        {calculateTotalPoints(activity)} points au total
                      </Typography>
                    )}
                  </Box>
                </Box>
                
                {/* Points breakdown */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
                  {Array.isArray(activity.parts_names) && activity.parts_names.map((name, index) => (
                    <Tooltip key={index} title="Voir les détails de cette activité">
                      <Chip 
                        label={
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between',
                            width: '100%'
                          }}>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            <MenuBookIcon fontSize='medium'
                             sx={{ 
                              mr:1,
                              color: theme => alpha(theme.palette.text.primary, 0.6),
                            }}
                             /> {name}
                            </Typography>
                            <Box 
                              component="span"
                              sx={{ 
                                ml: 1, 
                                bgcolor: 'rgba(25, 118, 210, 0.12)',
                                px: 1,
                                py: 0.2,
                                borderRadius: 1,
                                fontSize: '0.75rem',
                                fontWeight: 'bold'
                              }}
                            >
                              {activity.points[index]} pts
                            </Box>
                          </Box>
                        }
                        size="medium"
                        color="primary"
                        variant="outlined" 
                        component={Link}
                        href={`/activities/${activity.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        clickable
                        sx={{ 
                          cursor: 'pointer',
                          py: 0.5,
                          px: 0.5,
                          '& .MuiChip-label': {
                            px: 0.5,
                            width: '100%'
                          },
                          '&:hover': { 
                            boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                            backgroundColor: 'rgba(25, 118, 210, 0.04)',
                            borderColor: 'primary.main',
                            transform: 'translateY(-1px)',
                            transition: 'all 0.2s ease'
                          },
                          transition: 'all 0.2s ease'
                        }}
                      />
                    </Tooltip>
                  ))}
                </Box>
              </Box>
              
              {/* Right side - Activity description */}
              <Box sx={{ flex: '1 1 auto', minWidth: '200px' }}>
                {activity.content ? (
                  <>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Description :
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {activity.content}
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
        </Grid>
        
        <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
        
        <Grid size={{ xs: 12, md: 3.9 }}>
          <Box sx={{ 
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
              target="_blank"
              rel="noopener noreferrer"
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
              target="_blank"
              rel="noopener noreferrer"
              sx={{
              color: theme => theme.palette.success.dark, 
              bgcolor: alpha(theme.palette.success.main, 0.02), 
              '&:hover': { bgcolor: alpha(theme.palette.success.main, 0.2) },
              '& .MuiButton-startIcon': { mr: 0.5 },
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
              }}
            >
              Nouvelle correction
            </Button>
          </Box>
          <Box sx={{ mt: 1.5, display: 'flex', 
          alignItems: 'center', 
          gap: .75, 
          justifyContent: 'center', 
          flexDirection: 'column' }}> 
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
                  target="_blank"
                  rel="noopener noreferrer"
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
            
            {/* Display inactive corrections if any */}
            {activity.inactive_corrections_count && activity.inactive_corrections_count > 0 ? (
              <Tooltip title="Corrections inactives">
                <Chip
                  icon={<CloseIcon />}
                  label={`${activity.inactive_corrections_count} inactive${activity.inactive_corrections_count > 1 ? 's' : ''}`}
                  size="small"
                  color="error"
                  variant="outlined"
                  component={Link}
                  href={`/activities/${activity.id}?tab=1`}
                  target="_blank"
                  rel="noopener noreferrer"
                  clickable
                  sx={{cursor: 'pointer' }}
                />
              </Tooltip>
            ) : null}
            
            {/* Display absent students if any */}
            {activity.absent_count && activity.absent_count > 0 ? (
              <Tooltip title="Étudiants absents">
                <Chip
                  icon={<PersonOffIcon fontSize="small" />}
                  label={`${activity.absent_count} absent${activity.absent_count > 1 ? 's' : ''}`}
                  size="small"
                  color="warning"
                  variant="outlined"
                  component={Link}
                  href={`/activities/${activity.id}?tab=1`}
                  target="_blank"
                  rel="noopener noreferrer"
                  clickable
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': { 
                      boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                      backgroundColor: 'rgba(237, 108, 2, 0.08)'
                    }
                  }}
                />
              </Tooltip>
            ) : null}
            
            {/* Display non-submitted assignments if any */}
            {activity.non_rendu_count && activity.non_rendu_count > 0 ? (
              <Tooltip title="Travaux non rendus">
                <Chip
                  icon={<AssignmentLateIcon fontSize="small" />}
                  label={`${activity.non_rendu_count} non rendu${activity.non_rendu_count > 1 ? 's' : ''}`}
                  size="small"
                  color="info"
                  variant="outlined"
                  component={Link}
                  href={`/activities/${activity.id}?tab=1`}
                  target="_blank"
                  rel="noopener noreferrer"
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
            ) : null}
          </Box>
        </Grid>
      </Grid>
    </Card>
  );
  
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
                  <FormatListBulletedIcon sx={{ fontSize: 50, color: (theme) => theme.palette.text.primary }} />
                </Box>
                
                <Box>
                  <Typography variant="h4" fontWeight={700} color="text.primary">Activités</Typography>
                  <Typography variant="subtitle1" color="text.secondary" sx={{ opacity: 0.9 }}>
                    Ajoutez et gérez les activités avec barème flexible
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
                  onClick={handleCreateActivity}
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
            <Grid size={{ xs: 12, sm: 6, md: 2 }} key="total-activities">
              <Paper sx={{ 
                p: 2, 
                textAlign: 'center', 
                height: '100%',
                bgcolor: (theme) => alpha(theme.palette.myBoxes?.primary || theme.palette.primary.light, 0.5),
                backdropFilter: 'blur(5px)',
                borderRadius: 2,
              }}>
                <Typography color="text.secondary">Total</Typography>
                <Typography variant="h3" fontWeight="bold" color="text.primary">{enhancedActivities.length}</Typography>
                <Typography variant="overline" color="text.secondary">
                  {enhancedActivities.length === 1 ? 'activité' : 'activités'}
                </Typography>
              </Paper>
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6, md: 2 }} key="total-with-classes">
              <Paper sx={{ 
                p: 2, 
                textAlign: 'center', 
                height: '100%',
                bgcolor: (theme) => alpha(theme.palette.myBoxes?.primary || theme.palette.primary.light, 0.5),
                backdropFilter: 'blur(5px)',
                borderRadius: 2,
              }}>
                <Typography variant="overline" color="text.secondary">Classes</Typography>
                <Typography variant="h3" fontWeight="bold" color="text.primary">
                  {enhancedActivities.filter(a => a.associated_classes && a.associated_classes > 0).length}
                </Typography>
                <Typography variant="overline" color="text.secondary">
                  {enhancedActivities.filter(a => a.associated_classes && a.associated_classes > 0).length === 1 ? 'associée' : 'associées'}
                </Typography>
              </Paper>
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6, md: 2 }} key="total-with-corrections">
              <Paper sx={{ 
                p: 2, 
                textAlign: 'center', 
                height: '100%',
                bgcolor: (theme) => alpha(theme.palette.myBoxes?.primary || theme.palette.primary.light, 0.5),
                backdropFilter: 'blur(5px)',
                borderRadius: 2,
              }}>
                <Typography variant="overline" color="text.secondary">Corrections</Typography>
                <Typography variant="h3" fontWeight="bold" color="text.primary">
                  {enhancedActivities.filter(a => a.correction_count && a.correction_count > 0).length}
                </Typography>
                <Typography variant="overline" color="text.secondary">
                  {enhancedActivities.filter(a => a.correction_count && a.correction_count > 0).length === 1 ? 'enregistrée' : 'enregistrées'}
                </Typography>
              </Paper>
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6, md: 2 }} key="total-points">
              <Paper sx={{ 
                p: 2, 
                textAlign: 'center', 
                height: '100%',
                bgcolor: (theme) => alpha(theme.palette.myBoxes?.primary || theme.palette.primary.light, 0.5),
                backdropFilter: 'blur(5px)',
                borderRadius: 2,
              }}>
                <Typography variant="overline" color="text.secondary">Total points</Typography>
                <Typography variant="h3" fontWeight="bold" color="text.primary">
                  {enhancedActivities.reduce((sum, activity) => sum + calculateTotalPoints(activity), 0)}
                </Typography>
                <Typography variant="overline" color="text.secondary">
                  {enhancedActivities.reduce((sum, activity) => sum + calculateTotalPoints(activity), 0) === 1 ? 'point' : 'points'}
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
            <TipsAndUpdatesIcon sx={{ mr: 1, color: theme => theme.palette.secondary.dark }} />
            <Typography variant="h6" component="h2">
              Guide des activités avec parties dynamiques
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
                  Une activité à parties dynamiques vous permet d'ajouter des barèmes flexibles en définissant autant 
                  de parties que nécessaire, chacune avec son propre nombre de points.
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
                  Pour chaque étudiant, ajoutez une correction avec les points attribués pour chaque partie.
                  Le système calculera automatiquement la note sur 20.
                </Typography>
              </StepContent>
            </Step>
          </Stepper>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button
              size="small"
              onClick={() => setShowTutorial(false)}
              sx={{
                color: theme => theme.palette.primary.dark, 
                bgcolor: alpha(theme.palette.secondary.main, 0.1), 
                '&:hover': { bgcolor: alpha(theme.palette.secondary.main, 0.2) }
              }}
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
            onChange={handleSearchChange}
            sx={{ flexGrow: 1, maxWidth: 500 }}
            slotProps={{
              input: { 
                startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
               }
            }}
          />
          <Button
            variant="outlined"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleCreateActivity}
          >
            Nouvelle activité
          </Button>
        </Box>
        {/* Filtres avancés : classes et dates */}
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
        <Box sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1.5,
          mb: 1,
          alignItems: 'center',
          rowGap: 1,
          columnGap: 1.5,
          px: 0.5,
          py: 0.5,
          '@media (max-width: 700px)': { flexDirection: 'column', alignItems: 'stretch', gap: 1 }
        }}>
          {/* Filtre multi-classes */}
          <FormControl sx={{ minWidth: 140, flex: '1 1 120px', m: 0 }} size="small">
            <InputLabel id="classes-filter-label">Classes</InputLabel>
            <Select
              labelId="classes-filter-label"
              multiple
              value={selectedClassIds}
              onChange={e => setSelectedClassIds(typeof e.target.value === 'string' ? e.target.value.split(',').map(Number) : e.target.value)}
              label="Classes"
              renderValue={(selected) =>
                allClasses
                  .filter(cls => selected.includes(cls.id))
                  .map(cls => cls.name)
                  .join(', ') || 'Toutes'
              }
              sx={{ minWidth: 140, maxWidth: 220, fontSize: '0.95em', py: 0 }}
            >
              {allClasses.map(cls => (
                <MenuItem key={cls.id} value={cls.id} sx={{ py: 0.5, minHeight: 32 }}>
                  <Checkbox checked={selectedClassIds.indexOf(cls.id) > -1} size="small" />
                  <Typography variant="body2">{cls.name}</Typography>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {/* Dates de création */}
          <DatePicker
            label="Créée après le"
            value={dateFrom}
            onChange={setDateFrom}
            format="dd/MM/yyyy"
            slotProps={{ 
              textField: { 
                variant: 'outlined',
                size: 'small', 
                sx: { minWidth: 140, maxWidth: 160, fontSize: '0.95em', py: 0, m: 0 },
                placeholder: "",
                InputLabelProps: { shrink: true },
                inputProps: { 
                  'aria-label': 'Date de création minimum',
                  pattern: '[0-9]{2}/[0-9]{2}/[0-9]{4}'
                }
              },
              openPickerButton: { 'aria-label': 'Choisir la date' },
              field: { clearable: true }
            }}
            closeOnSelect
            views={['year', 'month', 'day']}
            openTo="day"
          />
          <DatePicker
            label="Créée avant le"
            value={dateTo}
            onChange={setDateTo}
            format="dd/MM/yyyy"
            slotProps={{ 
              textField: { 
                variant: 'outlined',
                size: 'small', 
                sx: { minWidth: 140, maxWidth: 160, fontSize: '0.95em', py: 0, m: 0 },
                placeholder: "",
                InputLabelProps: { shrink: true },
                inputProps: { 
                  'aria-label': 'Date de création maximum',
                  pattern: '[0-9]{2}/[0-9]{2}/[0-9]{4}'
                }
              },
              openPickerButton: { 'aria-label': 'Choisir la date' },
              field: { clearable: true }
            }}
            closeOnSelect
            views={['year', 'month', 'day']}
            openTo="day"
          />
          {/* Dates de modification */}
          <DatePicker
            label="Modifiée après le"
            value={dateModifFrom}
            onChange={setDateModifFrom}
            format="dd/MM/yyyy"
            slotProps={{ 
              textField: { 
                variant: 'outlined',
                size: 'small', 
                sx: { minWidth: 140, maxWidth: 160, fontSize: '0.95em', py: 0, m: 0 },
                placeholder: "",
                InputLabelProps: { shrink: true },
                inputProps: { 
                  'aria-label': 'Date de modification minimum',
                  pattern: '[0-9]{2}/[0-9]{2}/[0-9]{4}'
                }
              },
              openPickerButton: { 'aria-label': 'Choisir la date' },
              field: { clearable: true }
            }}
            closeOnSelect
            views={['year', 'month', 'day']}
            openTo="day"
          />
          <DatePicker
            label="Modifiée avant le"
            value={dateModifTo}
            onChange={setDateModifTo}
            format="dd/MM/yyyy"
            slotProps={{ 
              textField: { 
                variant: 'outlined',
                size: 'small', 
                sx: { minWidth: 140, maxWidth: 160, fontSize: '0.95em', py: 0, m: 0 },
                placeholder: "",
                InputLabelProps: { shrink: true },
                inputProps: { 
                  'aria-label': 'Date de modification maximum',
                  pattern: '[0-9]{2}/[0-9]{2}/[0-9]{4}'
                }
              },
              openPickerButton: { 'aria-label': 'Choisir la date' },
              field: { clearable: true }
            }}
            closeOnSelect
            views={['year', 'month', 'day']}
            openTo="day"
          />
        </Box>
        </LocalizationProvider>
      </Paper>

      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
      {/* Nouvelle mise en page avec menu latéral et contenu principal */}
      <Box sx={{ display: 'flex', gap: 4, alignItems: 'flex-start' }}>
        {/* Menu latéral gauche */}
        <Paper 
          sx={{ 
            width: 380, 
            flexShrink: 0, 
            alignSelf: 'flex-start',
            maxHeight: 'calc(100vh - 200px)', 
            overflowY: 'auto',
            position: 'sticky',
            top: 100,
            p: 2,
            borderRadius: 2
          }}
          elevation={2}
        >
          <Typography variant="h6" gutterBottom sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 1, mb: 2 }}>
            Liste des activités
          </Typography>
          {/* Rangement par année de création */}
          {(() => {
            if (filteredActivities.length === 0) {
              return (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                  Aucune activité ne correspond aux critères
                </Typography>
              );
            }
            // Regrouper les activités par année de création
            const activitiesByYear: { [year: string]: typeof filteredActivities } = {};
            filteredActivities.forEach(activity => {
              const year = activity.created_at ? new Date(activity.created_at).getFullYear().toString() : 'Inconnue';
              if (!activitiesByYear[year]) activitiesByYear[year] = [];
              activitiesByYear[year].push(activity);
            });
            // Trier les années (plus récentes en haut)
            const sortedYears = Object.keys(activitiesByYear).sort((a, b) => b.localeCompare(a));
            return (
              <Box>
                {sortedYears.map(year => (
                  <Box key={year} sx={{ mb: 2 }}>
                    <Box
                      sx={{
                        bgcolor: 'rgb(89, 113, 138)',
                        color: 'primary.contrastText',
                        px: 2,
                        py: 0.5,
                        borderRadius: 2,
                        fontWeight: 'bold',
                        fontSize: '1.1rem',
                        letterSpacing: 1,
                        mb: 1,
                        boxShadow: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        textTransform: 'uppercase',
                        borderLeft: '6px solid',
                        borderColor: 'secondary.main',
                      }}
                    >
                      <AssessmentIcon sx={{ mr: 1, opacity: 0.7 }} fontSize="small" />
                      {year}
                    </Box>
                    <List sx={{ p: 0, mb: 1 }}>
                      {activitiesByYear[year]
                        .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
                        .map((activity) => (
                        <ListItem 
                          key={activity.id} 
                          disablePadding
                          sx={{ 
                            display: 'block', 
                            mb: 0.5, 
                          }}
                        >
                          {/* Bouton pour sélectionner l'activité */}
                          <Button
                            fullWidth
                            onClick={() => handleActivitySelect(activity.id!)}
                            sx={{
                              justifyContent: 'flex-start',
                              py: 1.2,
                              borderRadius: 2,
                              textAlign: 'left',
                              color: selectedActivityId === activity.id ? 'primary.main' : 'text.primary',
                              fontWeight: selectedActivityId === activity.id ? 'bold' : 'normal',
                              bgcolor: selectedActivityId === activity.id ? 'secondary.lighter' : 'background.paper',
                              border: selectedActivityId === activity.id ? '2px solid' : '1px solid',
                              borderColor: selectedActivityId === activity.id ? 'secondary.main' : 'divider',
                              boxShadow: selectedActivityId === activity.id ? 3 : 0,
                              '&:hover': {
                                bgcolor: selectedActivityId === activity.id 
                                  ? 'secondary.light' 
                                  : 'primary.50',
                                borderColor: 'primary.main',
                                boxShadow: 2,
                              },
                              position: 'relative',
                              overflow: 'hidden',
                              transition: 'all 0.15s',
                            }}
                          >
                            <Grid container spacing={1} alignItems="center" sx={{ 
                              width: '100%',
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'space-between'
                            }}>
                              <Grid size={{ xs: 10  }}>
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    fontWeight: selectedActivityId === activity.id ? 'bold' : 'normal',
                                    color: selectedActivityId === activity.id ? 'primary.main' : 'text.primary',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    flexGrow: 1, 
                                  }}
                                >
                                  {activity.name}
                                </Typography>
                              </Grid>
                              <Grid size={{ xs: 2 }} 
                                sx={{ 
                                  textAlign: 'right',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'flex-end',
                                }}>
                                {activity.correction_count && activity.correction_count > 0 && (
                                  <Chip
                                    size="small"
                                    label={activity.correction_count}
                                    color="success"
                                    sx={{ minWidth: 0, height: 20, '& .MuiChip-label': { px: 1 } }}
                                  />
                                )}
                              </Grid>   
                            </Grid>               
                          </Button>
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                ))}
              </Box>
            );
          })()}
        </Paper>
        
        {/* Zone de contenu principal */}
        <Box sx={{ flexGrow: 1 }}>
          {enhancedActivities.length === 0 ? (
            <Box textAlign="center" my={8} className="p-8 border border-dashed border-gray-300 rounded-lg">
              <FormatListBulletedIcon fontSize="large" className="text-gray-400 mb-4" />
              <Typography variant="h6" gutterBottom>
                Aucune activité trouvée
              </Typography>
              <Typography variant="body1" color="textSecondary" mb={4} className="max-w-md mx-auto">
                Les activités avec parties dynamiques vous permettent d'ajouter des barèmes flexibles. 
                Ajoutez votre première activité pour commencer à noter vos étudiants.
              </Typography>
              <Button 
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleCreateActivity}
                size="large"
                className="shadow-lg"
              >
                Ajouter ma première activité
              </Button>
            </Box>
          ) : filteredActivities.length === 0 ? (
            <Paper className="p-8 text-center">
              <SearchIcon fontSize="large" className="text-gray-400 mb-2" />
              <Typography variant="h6" className="mb-2">Aucune activité ne correspond à cette recherche</Typography>
              <Button 
                onClick={() => {
                  setSearchTerm('');
                }}
                variant="outlined"
              >
                Réinitialiser les filtres
              </Button>
            </Paper>
          ) : !selectedActivityId ? (
            <Box textAlign="center" my={8} className="p-8 border border-dashed border-gray-300 rounded-lg">
              <FormatListBulletedIcon fontSize="large" className="text-gray-400 mb-4" />
              <Typography variant="h6" gutterBottom>
                Sélectionnez une activité
              </Typography>
              <Typography variant="body1" color="textSecondary" className="w-full mx-auto">
                Cliquez sur une activité dans le menu latéral pour afficher ses détails.
              </Typography>
            </Box>
          ) : (
            <Box>
              {renderActivityCard(filteredActivities.find(a => a.id === selectedActivityId)!)}
            </Box>
          )}
        </Box>
      </Box>
      </LocalizationProvider>
    </Container>
  );
}