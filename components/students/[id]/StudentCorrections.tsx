import React, { useState } from 'react';
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
  Stack
} from '@mui/material';
import Link from 'next/link';
import dayjs from 'dayjs';
import { Correction, Student } from './types';
import { getGradeColor } from './utils/gradeUtils';
import { useTheme } from '@mui/material/styles';

// Importation des composants de partage et d'email
import EmailFeedback from '@/components/corrections/EmailFeedback';
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
  corrections: Correction[];
}

export default function StudentCorrections({ student, corrections }: StudentCorrectionsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActivity, setFilterActivity] = useState('');
  const [sortOption, setSortOption] = useState('date-desc'); // Options: date-desc, date-asc, grade-high, grade-low
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const theme = useTheme();
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedCorrectionId, setSelectedCorrectionId] = useState<string>('');

  // Fonction pour formater la date
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
    };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

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
          return new Date(b.submission_date || b.created_at).getTime() - 
                 new Date(a.submission_date || a.created_at).getTime();
        case 'date-asc':
          return new Date(a.submission_date || a.created_at).getTime() - 
                 new Date(b.submission_date || b.created_at).getTime();
        case 'grade-high':
          return (b.grade || 0) - (a.grade || 0);
        case 'grade-low':
          return (a.grade || 0) - (b.grade || 0);
        default:
          return 0;
      }
    });
  };

  // Calculer le pourcentage de score pour une correction
  const calculateScorePercentage = (correction: Correction) => {
    const expPoints = correction.experimental_points || 0;
    const theoPoints = correction.theoretical_points || 0;
    const maxPoints = expPoints + theoPoints;
    
    if (maxPoints > 0 && correction.grade !== null) {
      return (correction.grade / maxPoints) * 100;
    }
    return 0;
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
            InputProps={{
              startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
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
      
      {/* Contenu principal */}
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
          <Button
            variant="contained"
            startIcon={<AssignmentIcon />}
            component={Link}
            href={`/corrections/unique?studentId=${student.id}`}
          >
            Ajouter une correction
          </Button>
        </Paper>
      ) : filteredCorrections.length === 0 ? (
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
      ) : (
        <Grid container spacing={3}>
          {filteredCorrections.map((correction) => {
            const scorePercentage = calculateScorePercentage(correction);
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
                      {correction.grade !== null ? (
                        <Chip 
                          label={`${correction.grade}/20`}
                          sx={{
                            color: getGradeColor(correction.grade || 0)
                          }}
                          icon={<GradeIcon />}
                        />
                      ) : (
                        <Chip label="Non notée" variant="outlined" />
                      )}
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}
                      >
                        <CalendarTodayIcon fontSize="small" color="primary" />
                        Envoyé le : {correction.submission_date 
                          ? formatDate(correction.submission_date)
                          : formatDate(correction.created_at)
                        }
                      </Typography>
                      
                      {correction.deadline && (
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}
                        >
                          <CalendarTodayIcon fontSize="small" color="error" />
                          Date limite : {formatDate(correction.deadline)}
                        </Typography>
                      )}
                      
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <SchoolIcon fontSize="small" />
                        {correction.class_name}
                      </Typography>
                    </Box>
                    
                    {(correction.experimental_points || correction.theoretical_points) && (
                      <>
                        <Typography variant="subtitle2" gutterBottom>
                          Répartition des points :
                        </Typography>
                        
                        <Grid container spacing={1} sx={{ mb: 1 }}>
                          {correction.experimental_points && (
                            <Grid size={{ xs: 4 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <ScienceIcon color="primary" fontSize="small" />
                                <Typography variant="body2" fontWeight="medium">
                                  Expérim : {correction.experimental_points} pts
                                </Typography>
                              </Box>
                            </Grid>
                          )}
                          {correction.theoretical_points && (
                            <Grid size={{ xs: 4 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <MenuBookIcon color="secondary" fontSize="small" />
                                <Typography variant="body2" fontWeight="medium">
                                  Théorique: {correction.theoretical_points} pts
                                </Typography>
                              </Box>
                            </Grid>
                          )}
                          {correction.penalty && (
                            <Grid size={{ xs: 4 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <RemoveCircleIcon color="error" fontSize="small" />
                                <Typography variant="body2" fontWeight="medium">
                                    Pénalité: {correction.penalty} pts
                                </Typography>
                            </Box>
                            </Grid>
                          )}
                        </Grid>
                        
                        {correction.grade !== null && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="caption" color="text.secondary" gutterBottom>
                              Pourcentage de réussite
                            </Typography>
                            <LinearProgress 
                              variant="determinate" 
                              value={scorePercentage} 
                              sx={{ 
                                height: 10, 
                                borderRadius: 5,
                                // Styliser le fond (partie non remplie)
                                backgroundColor: theme => {
                                  const grade = correction.grade || 0;
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
                                    const grade = correction.grade || 0;
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
                              {scorePercentage.toFixed(1)}%
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
                    >
                      Voir/Modifier
                    </Button>
                    
                    <Stack direction="row" spacing={1} sx={{ display:'flex', justifyItems:'center',
                         flexWrap: 'wrap', justifyContent: 'flex-end', alignContent: 'center' }}>
                      {/* Bouton de partage - uniquement pour les corrections notées */}
                      <Tooltip title={correction.grade !== null 
                        ? "Partager cette correction" 
                        : "Attribution d'une note nécessaire pour partager"}>
                        <span className='flex justify-center'> {/* Wrapper pour permettre le tooltip sur un bouton désactivé */}
                          <IconButton 
                            color="primary" 
                            size="small"
                            onClick={() => handleOpenShareModal(correction.id)}
                            disabled={correction.grade === null}
                          >
                            <ShareIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      
                      {/* Utiliser EmailFeedback correctement - sans le nester dans un IconButton */}
                      {correction.grade !== null ? (
                        <EmailFeedback
                          correctionId={correction.id.toString()}
                          studentData={{
                            first_name: student.first_name,
                            last_name: student.last_name,
                            email: student.email || ''
                          }}
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
        >
          Ajouter une correction
        </Button>
      </Box>
    </Paper>
  );
}
