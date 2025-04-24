import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Alert, 
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  Grid,
  Divider,
  LinearProgress,
  IconButton,
  Tooltip,
  alpha,
  Stack,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import Link from 'next/link';
import { CorrectionAutreEnriched, Student, ActivityAutre } from '@/lib/types';
import { getGradeColor } from './utils/gradeUtils';
import { useTheme } from '@mui/material/styles';

// Importation des composants de partage et d'email
import EmailFeedbackAutre from '@/components/corrections/EmailFeedbackAutre';
import ShareModal from '@/app/components/ShareModal';

// Icons
import SearchIcon from '@mui/icons-material/Search';
import GradeIcon from '@mui/icons-material/Grade';
import EditIcon from '@mui/icons-material/Edit';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SchoolIcon from '@mui/icons-material/School';
import ScienceIcon from '@mui/icons-material/Science';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import SortIcon from '@mui/icons-material/Sort';
import AssignmentIcon from '@mui/icons-material/Assignment';
import FilterListIcon from '@mui/icons-material/FilterList';
import ShareIcon from '@mui/icons-material/Share';
import EmailIcon from '@mui/icons-material/Email';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';

interface StudentCorrectionsProps {
  student: Student;
  corrections: CorrectionAutreEnriched[];
}

export default function StudentCorrections({ student, corrections: initialCorrections }: StudentCorrectionsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActivity, setFilterActivity] = useState('');
  const [sortOption, setSortOption] = useState('date-desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const theme = useTheme();
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedCorrectionId, setSelectedCorrectionId] = useState<string>('');
  const [corrections, setCorrections] = useState<CorrectionAutreEnriched[]>(initialCorrections);
  const [activities, setActivities] = useState<Map<number, ActivityAutre>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger les activités pour les corrections
  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true);
      // Créer un tableau d'IDs uniques au lieu d'un Set
      const activityIds = Array.from(new Set(initialCorrections.map(c => c.activity_id)));
      
      try {
        const activitiesMap = new Map<number, ActivityAutre>();
        
        // Récupérer chaque activité individuellement
        for (const activityId of activityIds) {
          const response = await fetch(`/api/activities_autres/${activityId}`);
          if (response.ok) {
            const activity = await response.json();
            activitiesMap.set(activityId, activity);
          }
        }
        
        setActivities(activitiesMap);
        
        // Enrichir les corrections avec les infos des activités
        const enrichedCorrections = initialCorrections.map(correction => {
          const activity = activitiesMap.get(correction.activity_id);
          return {
            ...correction,
            activity_name: activity?.name || 'Activité inconnue',
            // Toujours prendre les parts_names et points de l'activité associée
            parts_names: activity?.parts_names || [],
            points: activity?.points || [],
            // Calculer le pourcentage de réussite
            score_percentage: calculateScorePercentage(correction, activity)
          };
        });
        
        setCorrections(enrichedCorrections);
      } catch (err) {
        console.error('Erreur lors du chargement des activités:', err);
        setError('Impossible de charger les informations des activités');
      } finally {
        setLoading(false);
      }
    };
    
    if (initialCorrections.length > 0) {
      fetchActivities();
    }
  }, [initialCorrections]);

  // Fonction pour formater la date
  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return 'Non spécifiée';
    
    const date = typeof dateString === 'string' 
      ? new Date(dateString) 
      : dateString;
    
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
    };
    return date.toLocaleDateString('fr-FR', options);
  };

  // Obtenir les activités uniques
  const getUniqueActivities = () => {
    const activityMap = new Map();
    
    corrections.forEach(c => {
      if (c.activity_id && c.activity_name) {
        activityMap.set(c.activity_id, {
          id: c.activity_id,
          name: c.activity_name
        });
      }
    });
    
    return Array.from(activityMap.values());
  };

  // Filtrer et trier les corrections
  const getFilteredAndSortedCorrections = () => {
    let filtered = [...corrections];
    
    // Filtrage
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(c => 
        (c.activity_name?.toLowerCase().includes(search) || false) ||
        (c.class_name?.toLowerCase().includes(search) || false)
      );
    }
    
    if (filterActivity) {
      filtered = filtered.filter(c => c.activity_id === parseInt(filterActivity));
    }

    // Tri
    return filtered.sort((a, b) => {
      switch(sortOption) {
        case 'date-desc':
          return new Date(b.submission_date || b.created_at || '').getTime() - 
                 new Date(a.submission_date || a.created_at || '').getTime();
        case 'date-asc':
          return new Date(a.submission_date || a.created_at || '').getTime() - 
                 new Date(b.submission_date || b.created_at || '').getTime();
        case 'grade-high':
          return (b.final_grade || 0) - (a.final_grade || 0);
        case 'grade-low':
          return (a.final_grade || 0) - (b.final_grade || 0);
        default:
          return 0;
      }
    });
  };

  // Calculer le pourcentage de score pour une correction
  const calculateScorePercentage = (correction: CorrectionAutreEnriched, activity?: ActivityAutre): number => {
    if (!correction.points_earned || correction.points_earned.length === 0) {
      return 0;
    }
    
    // Utiliser les points de l'activité ou ceux fournis dans la correction
    const activityPoints = activity?.points || [];
    
    if (activityPoints.length === 0) {
      return 0;
    }
    
    // Calculer le total des points gagnés et le total possible
    const totalEarned = correction.points_earned.reduce((sum, points) => sum + (points || 0), 0);
    const totalPossible = activityPoints.reduce((sum, points) => sum + (points || 0), 0);
    
    if (totalPossible <= 0) {
      return 0;
    }
    
    return (totalEarned / totalPossible) * 100;
  };

  // Obtenir une activité par son ID
  const getActivity = (activityId: number): ActivityAutre | undefined => {
    return activities.get(activityId);
  };

  // Fonction pour ouvrir le modal de partage
  const handleOpenShareModal = (correctionId: number) => {
    setSelectedCorrectionId(correctionId.toString());
    setShareModalOpen(true);
  };

  // Fonction pour fermer le modal de partage
  const handleCloseShareModal = () => {
    setShareModalOpen(false);
  };

  const filteredCorrections = getFilteredAndSortedCorrections();
  

  return (
    <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
      {/* En-tête avec options de recherche et filtrage */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AssignmentIcon color="primary" />
          Corrections ({corrections.length})
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Rechercher..."
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            slotProps ={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" fontSize="small" />
                  </InputAdornment>
                ),
              }
            }}
            variant="outlined"
          />
          
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel id="filter-activity-label">Filtrer par activité</InputLabel>
            <Select
              labelId="filter-activity-label"
              value={filterActivity}
              onChange={(e) => setFilterActivity(e.target.value)}
              label="Filtrer par activité"
              startAdornment={<FilterListIcon fontSize="small" sx={{ mr: 1 }} />}
            >
              <MenuItem value="">Toutes les activités</MenuItem>
              {getUniqueActivities().map(activity => (
                <MenuItem key={activity.id} value={activity.id.toString()}>
                  {activity.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel id="sort-option-label">Trier par</InputLabel>
            <Select
              labelId="sort-option-label"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              label="Trier par"
              startAdornment={<SortIcon fontSize="small" sx={{ mr: 1 }} />}
            >
              <MenuItem value="date-desc">Plus récentes</MenuItem>
              <MenuItem value="date-asc">Plus anciennes</MenuItem>
              <MenuItem value="grade-high">Meilleures notes</MenuItem>
              <MenuItem value="grade-low">Moins bonnes notes</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>
      
      {/* État de chargement */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}
      
      {/* Message d'erreur */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Contenu principal */}
      {corrections.length === 0 && !loading ? (
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
          <Button
            variant="contained"
            startIcon={<AssignmentIcon />}
            component={Link}
            href={`/corrections/unique?studentId=${student.id}`}
          >
            Ajouter une correction
          </Button>
        </Paper>
      ) : filteredCorrections.length === 0 && !loading ? (
        <Alert 
          severity="warning"
          sx={{ 
            border: 1,
            borderColor: 'warning.main',
            '& .MuiAlert-icon': {
              color: 'warning.main'
            }
          }}
        >
          Aucune correction ne correspond aux filtres appliqués.
        </Alert>
      ) : !loading && (
        <Grid container spacing={3}>
          {filteredCorrections.map((correction) => {
            const activity = getActivity(correction.activity_id);
            return (
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
                      {correction.final_grade !== null && correction.final_grade !== undefined ? (
                        <Chip 
                          label={
                            correction.final_grade !== null && correction.final_grade !== undefined
                              ?
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                              <Typography variant="overline" fontWeight='700' noWrap>
                                {correction.final_grade}&nbsp;
                              </Typography>
                              <Typography variant="overline" noWrap>
                              / {activity?.points?.reduce((a, b) => a + b, 0)}
                              </Typography>
                              </Box>
                              : 'Non notée'
                          }
                          sx={{
                            color: getGradeColor(correction.final_grade || 0),
                            fontWeight: 700,
                          }}
                          icon={<GradeIcon />}
                        />
                      ) : (
                        <Chip label="Non notée" variant="outlined" />
                      )}
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography 
                        variant="overline" 
                        color="text.secondary"
                        sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: .2 }}
                      >
                        <CalendarTodayIcon fontSize="small" color="primary" />
                        Envoyé le : {correction.submission_date 
                          ? formatDate(correction.submission_date)
                          : formatDate(correction.created_at)
                        }
                      </Typography>
                      
                      {correction.deadline && (
                        <Typography 
                          variant="overline" 
                          color="text.secondary"
                          sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: .2 }}
                        >
                          <CalendarTodayIcon fontSize="small" color="error" />
                          Date limite : {formatDate(correction.deadline)}
                        </Typography>
                      )}
                    </Box>
                    
                    {/* Affichage des points par partie */}
                    {correction.points_earned && correction.points_earned.length > 0 && (
                      <>
                        <Typography variant="overline" fontWeight={'bold'} gutterBottom>
                          Répartition des points
                        </Typography>
                        
                        <Grid container spacing={1} sx={{ mb: .2 }} direction={'column'}>
                          {correction.points_earned.map((points, index) => {
                            // Obtenir le nom de la partie de l'activité
                            const partName = activity?.parts_names?.[index] || `Partie ${index + 1}`;
                            
                            // Obtenir les points max de la partie
                            const maxPoints = activity?.points?.[index] || 0;
                            
                            return (
                              <Grid size={{ xs: 12 }} key={`part-${index}`}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  {index === 0 ? (
                                    <ScienceIcon color="primary" fontSize="small" />
                                  ) : (
                                    <MenuBookIcon color="secondary" fontSize="small" />
                                  )}
                                  <Typography variant="overline" fontWeight="medium">
                                  {partName} : {(points || 0).toString().replace('.', ',')} / {maxPoints} pts
                                  </Typography>
                                </Box>
                              </Grid>
                            );
                          })}
                          
                          {correction.penalty && parseFloat(String(correction.penalty)) > 0 && (
                            <Grid size={{ xs: 12 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <RemoveCircleIcon color="error" fontSize="small" />
                                <Typography variant="body2" fontWeight="medium">
                                  Pénalité: {correction.penalty} pts
                                </Typography>
                              </Box>
                            </Grid>
                          )}
                        </Grid>
                        
                        {correction.final_grade !== null && correction.final_grade !== undefined && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="caption" color="text.secondary" gutterBottom>
                              Pourcentage de réussite
                            </Typography>
                            <LinearProgress 
                              variant="determinate" 
                              value={correction.score_percentage || 0} 
                              sx={{ 
                              height: 10, 
                              borderRadius: 5,
                                // Styliser le fond (partie non remplie)
                                backgroundColor: theme => {
                                  const grade = correction.final_grade || 0;
                                  if (grade >= 16) return alpha(theme.palette.success.main, 0.15);
                                  if (grade >= 14) return alpha(theme.palette.primary.light, 0.15);
                                  if (grade >= 12) return alpha(theme.palette.info.main, 0.15);
                                  if (grade >= 10) return alpha(theme.palette.warning.light, 0.15);
                                  if (grade >= 5) return alpha(theme.palette.warning.main, 0.15);
                                  return alpha(theme.palette.error.main, 0.15);
                                },
                                // Styliser la barre de progression (partie remplie)
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: theme => {
                                    const grade = correction.final_grade || 0;
                                    if (grade >= 16) return theme.palette.success.main;
                                    if (grade >= 14) return theme.palette.primary.light;
                                    if (grade >= 12) return theme.palette.info.main;
                                    if (grade >= 10) return theme.palette.warning.light;
                                    if (grade >= 5) return theme.palette.warning.main;
                                    return theme.palette.error.main;
                                  }
                                }
                              }}
                            />
                            <Typography variant="caption" sx={{ display: 'block', textAlign: 'right', mt: 0.5 }}>
                              {(correction.score_percentage || 0).toFixed(1)}%
                            </Typography>
                          </Box>
                        )}
                      </>
                    )}
                  </CardContent>
                  
                  <Divider />
                  
                  <CardActions sx={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', 
                     alignContent: 'center', flexWrap: 'wrap', gap: 1 }}>
                    <Button 
                      startIcon={<EditIcon />}
                      component={Link}
                      href={`/corrections/${correction.id}`}
                      variant="outlined"
                      target="_blank"
                      rel="noopener noreferrer"
                      size="small"
                    >
                      Voir / Modifier
                    </Button>
                    
                    <Stack direction="row" spacing={1} sx={{ display:'flex', justifyItems:'center',
                         flexWrap: 'wrap', justifyContent: 'flex-end', alignContent: 'center' }}>
                      {/* Bouton de partage - uniquement pour les corrections notées */}
                      <Tooltip title={correction.final_grade !== null && correction.final_grade !== undefined 
                        ? "Partager cette correction" 
                        : "Attribution d'une note nécessaire pour partager"}>
                        <span className='flex justify-center'> {/* Wrapper pour permettre le tooltip sur un bouton désactivé */}
                          <IconButton 
                            color="primary" 
                            size="small"
                            onClick={() => handleOpenShareModal(correction.id)}
                            disabled={correction.final_grade === null || correction.final_grade === undefined}
                          >
                            <ShareIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      
                      {/* Email Feedback */}
                      {correction.final_grade !== null && correction.final_grade !== undefined ? (
                        <EmailFeedbackAutre
                          correctionId={correction.id.toString()}
                          activityName={correction.activity_name}
                          student={student}
                          points_earned={correction.points_earned || []}
                          activity_parts_names={activity?.parts_names || []}
                          activity_points={activity?.points || []}
                          penalty={correction.penalty?.toString()}
                        />
                      ) : (
                        <Tooltip title="Attribution d'une note nécessaire pour envoyer par email">
                          <span>
                            <IconButton 
                              color="primary" 
                              size="small"
                              disabled={true}
                            >
                              <EmailIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      )}
                    </Stack>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
      
      {/* Modal de partage - avec vérification de la note */}
      <ShareModal 
        open={shareModalOpen}
        onClose={handleCloseShareModal}
        correctionId={selectedCorrectionId}
      />
      
      {/* Actions en bas */}
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<AssignmentIcon />}
          component={Link}
          href={`/corrections/unique?studentId=${student.id}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Ajouter une correction
        </Button>
      </Box>
    </Paper>
  );
}
