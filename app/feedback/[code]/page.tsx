'use client';

import React, { useState, useEffect } from 'react';
import { Inter } from 'next/font/google';
import { 
  Paper, 
  Typography, 
  Box, 
  Alert, 
  CircularProgress, 
  Divider,
  Button,
  Chip,
  Zoom,
  Container,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  useMediaQuery,
  useTheme 
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { parseContentItems } from '@/lib/services/correctionService';
import { generateHtmlFromItems } from '@/utils/htmlUtils';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RuleIcon from '@mui/icons-material/Rule';
import GradeIcon from '@mui/icons-material/Grade';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ScheduleIcon from '@mui/icons-material/Schedule';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import GradientBackground from '@/components/ui/GradientBackground';
import PatternBackground from '@/components/ui/PatternBackground';
import ErrorDisplay from '@/components/ui/ErrorDisplay';

// Initialiser la police Inter
const inter = Inter({ subsets: ['latin'] });

export default function FeedbackViewer({ params }: { params: Promise<{ code: string }> }) {
  // Unwrap the Promise for params using React.use in client components
  const { code } = React.use(params);
  const router = useRouter();
  const theme = useTheme(); // Obtenir le thème
  const isMediumScreen = useMediaQuery(theme.breakpoints.up('md')); // Détecter si écran md ou plus grand
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [correction, setCorrection] = useState<any>(null);
  const [renderedHtml, setRenderedHtml] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Ajout des états manquants
  const [correctionContent, setCorrectionContent] = useState<string>('');
  const [editorContent, setEditorContent] = useState<any[]>([]);
  const [datesExpanded, setDatesExpanded] = useState<boolean>(false);
  // Add new state for grades accordion with default value based on screen size
  const [gradesExpanded, setGradesExpanded] = useState<boolean>(false);
  // Nouvel état pour l'accordéon du contenu de correction
  const [contentExpanded, setContentExpanded] = useState<boolean>(true);

  // Effet pour ajuster l'état de l'accordéon en fonction de la taille de l'écran
  useEffect(() => {
    setGradesExpanded(isMediumScreen);
    // On garde le contenu de la correction toujours ouvert par défaut
    setContentExpanded(true);
  }, [isMediumScreen]);

  // Version améliorée de formatGrade
  const formatGrade = (value: number | string | null | undefined) => {
    if (value === null || value === undefined) return '0';
    
    // Convertir en nombre
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    // Vérifier si le nombre est un entier
    if (Number.isInteger(numValue)) {
      return numValue.toString();
    } else {
      // Format avec une décimale et remplace le point par une virgule
      return numValue.toFixed(1).replace('.', ',');
    }
  };

  // Extraire la fonction fetchSharedCorrection pour qu'elle soit accessible en dehors du useEffect
  const fetchSharedCorrection = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/feedback/${code}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Ce lien de partage est invalide ou a expiré');
        }
        throw new Error('Erreur lors du chargement de la correction');
      }
      
      const data = await response.json();
      setCorrection(data);
      
      // Initialiser le contenu de la correction et les fragments d'éditeur
      setCorrectionContent(data.content || '');
      
      // Vérifier si content_data existe et contient des fragments
      if (data.content_data && data.content_data.fragments) {
        setEditorContent(data.content_data.fragments);
      } else {
        setEditorContent([]);
      }
      
      // Générer le HTML à partir des items de contenu
      const contentItems = parseContentItems(data);
      const html = generateHtmlFromItems(contentItems);
      setRenderedHtml(html);
    } catch (err: any) {
      console.error('Erreur:', err);
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  // Récupérer la correction partagée
  useEffect(() => {
    fetchSharedCorrection();
  }, [code]);



  if (loading) {
    return (
      <Box 
        sx={{ 
          minHeight: '100vh', 
          bgcolor: 'grey.50', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          px: 2 
        }}
      >
        <Box 
          sx={{ 
            maxWidth: '4xl', 
            width: '100%', 
            display: 'flex', 
            justifyContent: 'center', 
            py: 8 
          }}
        >
          <CircularProgress size={40} />
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box 
        sx={{ 
          minHeight: '100vh', 
          bgcolor: 'grey.50', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          px: 2, 
          py: 4 
        }}
      >
        <Box sx={{ maxWidth: '4xl', width: '100%' }}>
          <Paper 
            elevation={2} 
            sx={{ 
              p: 4, 
              borderRadius: 2,
              borderLeft: '4px solid',
              borderColor: 'error.main'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <ErrorOutlineIcon color="error" fontSize="large" />
              <Typography variant="h5" color="error.main" sx={{ fontWeight: 'bold' }}>
                Erreur
              </Typography>
            </Box>
            <ErrorDisplay 
              error={error} 
              withRefreshButton={true}
              onRefresh={() => {
                setLoading(true);
                setError('');
                fetchSharedCorrection();
              }}
            />
            <Button
              variant="contained"
              color="primary"
              startIcon={<ArrowBackIcon />}
              onClick={() => router.push('/')}
              sx={{ mt: 3 }}
            >
              Retour à l'accueil
            </Button>
          </Paper>
        </Box>
      </Box>
    );
  }

  if (!correction) {
    return (
      <Box 
        sx={{ 
          minHeight: '100vh', 
          bgcolor: 'grey.50', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          px: 2, 
          py: 4 
        }}
      >
        <Box sx={{ maxWidth: '4xl', width: '100%' }}>
          <Alert severity="warning">
            Correction non trouvée
          </Alert>
        </Box>
      </Box>
    );
  }


  // Vérifier si des notes sont présentes
  const hasGrade = correction.grade !== null && correction.grade !== undefined;
  const hasPenalty = correction.penalty !== null && correction.penalty !== undefined && parseFloat(correction.penalty) > 0;
  
  // Vérifier si c'est un travail non rendu (pénalité de 15 points et note totale de 20 sans pénalité)
  const isNeverSubmitted = hasPenalty && 
                          parseFloat(correction.penalty) === 15 && 
                          (parseFloat(correction.grade) === 20 || 
                          (parseFloat(correction.experimental_points_earned || 0) + 
                           parseFloat(correction.theoretical_points_earned || 0) === 20));
  
  // Format pour afficher "- -" au lieu des valeurs numériques pour les travaux non rendus
  const formatGradeWithNonRendu = (value: number | string | null | undefined) => {
    if (isNeverSubmitted) return "- -";
    return formatGrade(value);
  };
  
  const finalGrade = hasGrade ? 
    (hasPenalty ? correction.final_grade : correction.grade) : 
    null;
  
  // Formater les dates
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Non spécifiée';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
  };
  
  // Déterminer si le rendu est en retard et de combien de jours
  const getDaysLate = () => {
    if (!correction.deadline || !correction.submission_date) return 0;
    
    const deadline = new Date(correction.deadline);
    const submission = new Date(correction.submission_date);
    
    // Calculer la différence en jours
    const diffTime = submission.getTime() - deadline.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  };
  
  const daysLate = getDaysLate();
  const isLate = daysLate > 0;
  const isOneDayLate = daysLate === 1;
  const isMoreThanOneDayLate = daysLate > 1;
  const isOnTime = !isLate && correction.deadline && correction.submission_date;

  return (
    <Box 
      className={inter.className} 
      sx={{ 
        minHeight: '100vh', 
        background: (theme) => theme.palette.grey[50],
        display: 'flex',
        justifyContent: 'center',
        px: 2,
        py: 4
      }}
    >
      <Container maxWidth="lg">
        {/* En-tête avec une apparence plus moderne */}
        <Box mb={3}>
          <Zoom in={true} timeout={500}>
            <Paper 
              elevation={3} 
              sx={{ 
                overflow: 'hidden', 
                borderRadius: 2, 
                boxShadow: (theme) => theme.shadows[3]
              }}
            >
              {/* Bannière supérieure avec GradientBackground et PatternBackground */}
              <GradientBackground variant="primary" sx={{ p: 0 }}>
                <PatternBackground 
                  pattern="dots" 
                  opacity={0.05} 
                  color="black" 
                  size={100}
                  sx={{ position: 'relative', overflow: 'hidden' }}
                >
                  {/* Contenu de l'en-tête */}
                  <Box sx={{ flexDirection:'column', display: 'flex', zIndex: 10, textAlign: 'center', p: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection:'row', gap: 2 }}>
                     <Box
                  sx={{
                    background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                    p: 1.5,
                    borderRadius: '50%',
                    display: 'flex',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                  }}
                >
                  <RuleIcon sx={{ fontSize: 50, color: (theme) => theme.palette.text.primary }} />
                </Box>
                
                    <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, color: 'text.primary' }}>
                      Correction de {correction.student_name || "l'élève"}
                    </Typography>
                    </Box>
                    <Typography variant="h5" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                      {correction.activity_name}
                    </Typography>
                    </Box>
                </PatternBackground>
              </GradientBackground>

              {/* Contenu principal avec présentation améliorée */}
              <Box sx={{ p: 4 }}>
                {/* Section des notes avec un design d'affichage plus percutant */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  {/* Notes par partie - 2 colonnes */}
                  <Grid size={{ xs: 12, lg: 8 }}>
                    {hasGrade && (
                      <Accordion 
                        expanded={gradesExpanded}
                        onChange={() => setGradesExpanded(!gradesExpanded)}
                        slotProps={{
                          transition: { timeout: 300 }
                        }}
                        sx={{
                          height: '100%',
                          borderRadius: 2,
                          overflow: 'hidden',
                          '&:before': {
                            display: 'none',
                          },
                          boxShadow: 'none',
                          border: '1px solid',
                          borderColor: 'divider',
                          '& .MuiAccordionSummary-root': {
                            borderLeft: '4px solid',
                            borderColor: 'success.main'
                          }
                        }}
                      >
                        <AccordionSummary
                          expandIcon={<ExpandMoreIcon />}
                          aria-controls="grades-content"
                          id="grades-header"
                          sx={{
                            bgcolor: 'background.paper',
                            '&:hover': { backgroundColor: 'rgb(212, 212, 212)' },
                            flexDirection: 'row',
                            display: 'flex',
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <GradeIcon color="success" />
                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                              Points détaillés
                            </Typography>
                          </Box>
                        </AccordionSummary>
                        
                        <AccordionDetails sx={{ 
                          bgcolor: 'background.paper',
                          p: 3
                        }}>                           
                            {/* Notes par partie affichées horizontalement */}
                            <Grid container spacing={2} sx={{ mb: 2.5 }}>
                              <Grid  size={{ xs: 12, md: 6 }}>
                                <Paper sx={{ 
                                  p: 2, 
                                  border: 1, 
                                  borderColor: 'divider',
                                  boxShadow: (theme) => theme.shadows[1],
                                  transition: 'all 0.2s',
                                  '&:hover': { boxShadow: (theme) => theme.shadows[3] },
                                  bgcolor: 'background.paper',
                                }}>
                                  <Typography variant="subtitle2" sx={{ 
                                    color: 'text.secondary', mb: 0.5,
                                    justifyContent: 'center', 
                                    alignItems: 'center', 
                                    display: 'flex'                                
                                  }}>
                                    PARTIE EXPÉRIMENTALE
                                  </Typography>
                                  <Typography variant="h4" sx={{ 
                                    fontWeight: 'bold', 
                                    color: 'primary.light', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center'
                                  }}>
                                    {formatGradeWithNonRendu(correction.experimental_points_earned)} 
                                    <Box component="span" sx={{ color: 'text.secondary', fontSize: '1rem', ml: 0.5 }}>
                                      / {correction.experimental_points || '5'}
                                    </Box>
                                  </Typography>
                                </Paper>
                              </Grid>
                              
                              <Grid size={{ xs: 12, md: 6 }}>
                                <Paper sx={{ 
                                  p: 2, 
                                  border: 1, 
                                  borderColor: 'divider',
                                  boxShadow: (theme) => theme.shadows[1],
                                  transition: 'all 0.2s',
                                  '&:hover': { boxShadow: (theme) => theme.shadows[3] },
                                  bgcolor: 'background.paper',
                                }}>
                                  <Typography variant="subtitle2" sx={{ 
                                    color: 'text.secondary', mb: 0.5,
                                    flexDirection: 'column', 
                                    justifyContent: 'center', 
                                    alignItems: 'center', 
                                    display: 'flex'
                                    }}>
                                    PARTIE THÉORIQUE
                                  </Typography>
                                  <Typography variant="h4" sx={{ 
                                    fontWeight: 'bold', 
                                    color: 'primary.light', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center'
                                  }}>
                                    {formatGradeWithNonRendu(correction.theoretical_points_earned)} 
                                    <Box component="span" sx={{ color: 'text.secondary', fontSize: '1rem', ml: 0.5 }}>
                                      / {correction.theoretical_points || '15'}
                                    </Box>
                                  </Typography>
                                </Paper>
                              </Grid>
                            </Grid>
                            
                            {/* Affichage des pénalités */}
                            {hasPenalty && (
                              <Alert 
                                severity="warning" 
                                variant="outlined"
                                sx={{ mb: 1.5 }}
                                icon={<ScheduleIcon />}
                              >
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                  Pénalité de retard : — {correction.penalty} point{correction.penalty > 1 ? 's' : ''}
                                </Typography>
                                {isMoreThanOneDayLate && (
                                  <Typography variant="caption">
                                    (pour {daysLate} jours de retard)
                                  </Typography>
                                )}
                              </Alert>
                            )}
                            
                            {/* Nouveau: Message d'indulgence pour les retards d'un jour */}
                            {isOneDayLate && !hasPenalty && (
                              <Alert 
                                severity="warning" 
                                variant="outlined"
                                sx={{ mb: 1.5 }}
                                icon={<CalendarTodayIcon />}
                              >
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                  Jour de grâce accordé
                                </Typography>
                                <Typography variant="caption">
                                  La pénalité pour 1 jour de retard a été levée par indulgence.
                                </Typography>
                              </Alert>
                            )}
                        </AccordionDetails>
                      </Accordion>
                    )}
                  </Grid>
                  
                  {/* Note totale reste en dehors de l'accordéon */}
                  <Grid size={{ xs: 12, lg: 4 }}>
                    {hasGrade && (
                      <Paper
                        elevation={2}
                        sx={{ 
                          height: '100%', 
                          display: 'flex', 
                          flexDirection: 'column', 
                          justifyContent: 'center', 
                          alignItems: 'center', 
                          p: 3,
                          background: (theme) => `linear-gradient(to bottom right, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                          color: 'white', 
                          borderRadius: 2, 
                          boxShadow: (theme) => theme.shadows[5]
                        }}
                      >
                        <Typography variant="overline" sx={{ letterSpacing: 1, color: `primary` }}>
                          {isNeverSubmitted ? "STATUT" : "NOTE FINALE"}
                        </Typography>
                        <Typography variant="h1" sx={{ 
                          fontSize: { xs: '2.5rem', sm: '3.5rem' }, 
                          fontWeight: 'bold', 
                          mb: 1, 
                          textAlign: 'center',
                          width: '100%' 
                        }}>
                          {isNeverSubmitted ? 
                            "Travail non rendu" : 
                            formatGradeWithNonRendu(hasPenalty ? finalGrade : correction.grade)
                          }
                        </Typography>
                        <Typography variant="subtitle1">
                          {!isNeverSubmitted && "sur 20 points"}
                        </Typography>
                      </Paper>
                    )}
                  </Grid>
                </Grid>



                {/* Contenu de la correction avec style amélioré et transformé en accordéon */}
                <Accordion 
                  expanded={contentExpanded}
                  onChange={() => setContentExpanded(!contentExpanded)}
                  slotProps={{
                    transition: { timeout: 300 }
                  }}
                  sx={{
                    mb: 3,
                    borderRadius: 2,
                    overflow: 'hidden',
                    '&:before': {
                      display: 'none',
                    },
                    boxShadow: 'none',
                    border: '1px solid',
                    borderColor: 'divider',
                    '& .MuiAccordionSummary-root': {
                      borderLeft: '4px solid',
                      borderColor: 'primary.main'
                    }
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="content-correction"
                    id="content-correction-header"
                    sx={{
                      bgcolor: 'background.paper',
                      '&:hover': { backgroundColor: 'rgb(212, 212, 212)' },
                      flexDirection: 'row',
                      display: 'flex',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <RuleIcon color="primary" />
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        Contenu de la correction
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  
                  <AccordionDetails sx={{ 
                    bgcolor: 'background.paper',
                    p: 3,
                    boxShadow: 'inset 0 2px 4px 0 rgba(0,0,0,0.06)'
                  }}>
                    <Box 
                      dangerouslySetInnerHTML={{ __html: renderedHtml }} 
                      sx={{
                        '& h1, & h2, & h3, & h4, & h5, & h6': {
                          color: 'primary.800'
                        },
                        '& a': {
                          color: 'primary.600'
                        },
                        maxWidth: 'none',
                        '& img': {
                          maxWidth: '100%',
                          height: 'auto'
                        },
                        // Styles pour les fragments de correction
                        '& > p': {
                          position: 'relative',
                          paddingLeft: '20px',
                          marginBottom: '5px',
                          '&::before': {
                            content: '"•"',
                            position: 'absolute',
                            left: '5px',
                            color: theme => theme.palette.primary.main,
                            fontWeight: 'bold',
                            fontSize: '18px'
                          }
                        },
                        '& > *': {
                          marginBottom: '5px'
                        },
                        '& > div': {
                          marginBottom: '5px'
                        }
                      }}
                      className="correction-content prose prose-sm md:prose-base"
                    />
                  </AccordionDetails>
                </Accordion>

                {/* Section des dates en accordéon (fermé par défaut) */}
                <Accordion 
                  expanded={datesExpanded}
                  onChange={() => setDatesExpanded(!datesExpanded)}
                  slotProps={{
                    transition: { timeout: 300 }
                  }}
                  sx={{
                    mb: 4,
                    borderRadius: 2,
                    overflow: 'hidden',
                    '&:before': {
                      display: 'none',
                    },
                    boxShadow: 'none',
                    border: '1px solid',
                    borderColor: 'divider',
                    '& .MuiAccordionSummary-root': {
                      borderLeft: '4px solid',
                      borderColor: 'primary.main'
                    }
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="dates-content"
                    id="dates-header"
                    sx={{
                      bgcolor: 'background.paper',
                      '&:hover': { backgroundColor: 'rgb(212, 212, 212)' },
                      flexDirection: 'col',
                      display: 'flex',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'left', flexDirection: 'column' , gap: 1 }}>

                    <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'row' , gap: 1 }}>
                      <CalendarTodayIcon color="primary" />
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        Dates importantes
                      </Typography>
                      </Box>
                    {/* Badge de statut toujours visible dans l'en-tête */}
                      {isNeverSubmitted && (
                        <Chip 
                          label="Non rendu" 
                          size="small" 
                          color="error" 
                          icon={<ScheduleIcon />} 
                          sx={{ fontWeight: 500 }} 
                        />
                      )}
                      {!isNeverSubmitted && isMoreThanOneDayLate && (
                        <Chip 
                          label="Rendu en retard" 
                          size="small" 
                          color="error" 
                          icon={<ScheduleIcon />} 
                          sx={{ fontWeight: 500 }} 
                        />
                      )}
                      {!isNeverSubmitted && isOneDayLate && (
                        <Chip 
                          label="Jour de grâce" 
                          size="small" 
                          color="warning" 
                          icon={<ScheduleIcon />} 
                          sx={{ fontWeight: 500 }} 
                        />
                      )}
                      {!isNeverSubmitted && isOnTime && (
                        <Chip 
                          label="Rendu à temps" 
                          size="small" 
                          color="success" 
                          icon={<CheckCircleIcon />} 
                          sx={{ fontWeight: 500 }} 
                        />
                      )}
                    </Box>
                  </AccordionSummary>
                  
                  <AccordionDetails sx={{ 
                    bgcolor: 'background.paper',
                    p: 3
                  }}>
                    {/* Présentation des dates en deux colonnes (contenu inchangé) */}
                    <Grid container spacing={3} sx={{ mt: 1 }}>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Paper sx={{ 
                          p: 2, 
                          borderRadius: 2, 
                          border: 1, 
                          borderColor: 'primary.100',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5
                        }}>
                          <Box sx={{ 
                            bgcolor: 'primary.50', 
                            p: 1, 
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <EventAvailableIcon fontSize="medium" sx={{ color: 'primary.main' }} />
                          </Box>
                          <Box>
                            <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                              Date limite
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 500 }}>
                              {formatDate(correction.deadline)}
                            </Typography>
                          </Box>
                        </Paper>
                      </Grid>
                      
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Paper sx={{ 
                          p: 2, 
                          borderRadius: 2, 
                          border: 1, 
                          borderColor: 'primary.100',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5
                        }}>
                          <Box sx={{ 
                            bgcolor: 'primary.50', 
                            p: 1, 
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <HourglassEmptyIcon fontSize="medium" sx={{ color: 'primary.main' }} />
                          </Box>
                          <Box>
                            <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                              Date de rendu
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 500 }}>
                              {isNeverSubmitted ? "Travail non rendu" : formatDate(correction.submission_date)}
                            </Typography>
                          </Box>
                        </Paper>
                      </Grid>
                    </Grid>
                    
                    {/* Nouveau message pour les retards d'un jour avec indulgence */}
                    {isOneDayLate && !hasPenalty && (
                      <Alert 
                        severity="warning"
                        sx={{ mt: 2, mb: 1 }}
                        icon={<CalendarTodayIcon />}
                      >
                        <Typography variant="body2">
                          <strong>Jour de grâce accordé :</strong> bien que ce travail ait été rendu avec un retard d'un jour, 
                          aucune pénalité n'a été appliquée par mesure d'indulgence. Les retards plus importants entraîneraient 
                          une pénalité de 2 points par jour de retard.
                        </Typography>
                      </Alert>
                    )}
                    
                    {/* Alerte explicative pour les pénalités de retard si applicable */}
                    {isMoreThanOneDayLate && hasPenalty && (
                      <Alert 
                        severity="error"
                        sx={{ mt: 2, mb: 1 }}
                        icon={<ScheduleIcon />}
                      >
                        <Typography variant="body2">
                          <strong>Pénalité de retard appliquée :</strong> Ce travail a été rendu avec {daysLate} jours de retard, 
                          entraînant une pénalité de {correction.penalty} points sur la note finale.
                        </Typography>
                      </Alert>
                    )}
                  </AccordionDetails>
                </Accordion>

              </Box>
              
              {/* Pied de page amélioré */}
              <GradientBackground variant='primary' sx={{ p: 0 }}>
                <Box 
                  sx={{ 
                    p: 2, 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center'
                  }}
                >
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Correction #{correction.id}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Ajoutée le {new Date(correction.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Mise à jour le {new Date(correction.updated_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Typography>

                  
                </Box>
              </GradientBackground>
            </Paper>
          </Zoom>
        </Box>
      </Container>
    </Box>
  );
}
