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
  Grid 
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

// Initialiser la police Inter
const inter = Inter({ subsets: ['latin'] });

export default function FeedbackViewer({ params }: { params: Promise<{ code: string }> }) {
  // Unwrap the Promise for params using React.use in client components
  const { code } = React.use(params);
  const router = useRouter();
  
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
  // Add new state for grades accordion
  const [gradesExpanded, setGradesExpanded] = useState<boolean>(false);

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

  // Récupérer la correction partagée
  useEffect(() => {
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
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
            <Button
              variant="contained"
              color="primary"
              startIcon={<ArrowBackIcon />}
              onClick={() => router.push('/')}
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
  const finalGrade = hasGrade ? 
    (hasPenalty ? correction.final_grade : correction.grade) : 
    null;
  console.log('correction:', correction);
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
        background: (theme) => `linear-gradient(to bottom, ${theme.palette.grey[50]}, ${theme.palette.primary.light}20)`,
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
              {/* Bannière supérieure avec dégradé et image de fond */}
              <Box 
                sx={{ 
                  background: (theme) => `linear-gradient(to right, ${theme.palette.secondary.dark}, ${theme.palette.primary.dark})`,
                  color: 'white', 
                  p: 4, 
                  position: 'relative', 
                  overflow: 'hidden'
                }}
              >
                {/* Motif de fond discret */}
                <Box 
                  sx={{ 
                    position: 'absolute', 
                    inset: 0, 
                    opacity: 0.1,
                    backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
                  }}
                />
                
                {/* Contenu de l'en-tête */}
                <Box sx={{ position: 'relative', zIndex: 10, textAlign: 'center' }}>
                  <Box 
                    sx={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      mb: 2, 
                      bgcolor: 'rgba(255, 255, 255, 0.2)', 
                      p: 1.5, 
                      borderRadius: '50%' 
                    }}
                  >
                    <RuleIcon sx={{ fontSize: 38 }} />
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Correction de {correction.student_name || "l'élève"}
                  </Typography>
                  <Typography variant="h5"  sx={{ color: 'text.secondary', fontWeight: 700 }}>
                    {correction.activity_name}
                  </Typography>
                </Box>
              </Box>

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
                                    {formatGrade(correction.experimental_points_earned)} 
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
                                    {formatGrade(correction.theoretical_points_earned)} 
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
                          NOTE FINALE
                        </Typography>
                        <Typography variant="h1" sx={{ fontSize: { xs: '3rem', sm: '4rem' }, fontWeight: 'bold', mb: 1 }}>
                          {formatGrade(hasPenalty ? finalGrade : correction.grade)}
                        </Typography>
                        <Typography variant="subtitle1">
                          sur 20 points
                        </Typography>
                      </Paper>
                    )}
                  </Grid>
                </Grid>



                {/* Contenu de la correction avec style amélioré */}
                <Paper 
                  elevation={0}
                  variant="outlined" 
                  sx={{ 
                    borderRadius: 2,
                    overflow: 'hidden',
                    mb: 3
                  }}
                >
                  {/* En-tête stylisé pour le contenu */}
                  <Box 
                    sx={{ 
                      background: (theme) => `linear-gradient(to bottom right, ${theme.palette.secondary.main}, ${theme.palette.primary.main})`,
                      borderBottom: 1,
                      borderColor: 'divider',
                      p: 2, 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1
                    }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'white' }}>
                      Contenu de la correction
                    </Typography>
                  </Box>
                  
                  {/* Contenu avec style amélioré */}
                  <Box 
                    sx={{ 
                      p: 3, 
                      bgcolor: 'background.paper',
                      boxShadow: 'inset 0 2px 4px 0 rgba(0,0,0,0.06)'
                    }}
                  >
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
                        }
                      }}
                      className="correction-content prose prose-sm md:prose-base"
                    />
                  </Box>
                </Paper>
                

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
                      {isMoreThanOneDayLate && (
                        <Chip 
                          label="Rendu en retard" 
                          size="small" 
                          color="error" 
                          icon={<ScheduleIcon />} 
                          sx={{ fontWeight: 500 }} 
                        />
                      )}
                      {isOneDayLate && (
                        <Chip 
                          label="Léger retard" 
                          size="small" 
                          color="warning" 
                          icon={<ScheduleIcon />} 
                          sx={{ fontWeight: 500 }} 
                        />
                      )}
                      {isOnTime && (
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
                              {formatDate(correction.submission_date)}
                            </Typography>
                          </Box>
                        </Paper>
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>

              </Box>
              
              {/* Pied de page amélioré */}
              <Box 
                sx={{ 
                  background: (theme) => `linear-gradient(to right, ${theme.palette.grey[800]}, ${theme.palette.grey[900]})`,
                  color: 'white', 
                  p: 2, 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center'
                }}
              >
                <Typography variant="caption" sx={{ color: 'grey.300' }}>
                  Correction #{correction.id}
                </Typography>
                <Typography variant="caption" sx={{ color: 'grey.300' }}>
                  Créée le {new Date(correction.created_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </Typography>
              </Box>
            </Paper>
          </Zoom>
        </Box>
      </Container>
    </Box>
  );
}
