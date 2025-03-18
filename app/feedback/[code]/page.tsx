'use client';

import React, { useState, useEffect } from 'react';
import { 
  Paper, 
  Typography, 
  Box, 
  Alert, 
  CircularProgress, 
  Skeleton,
  Container,
  Divider,
  Button,
  Chip
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { parseContentItems } from '@/lib/services/correctionService';
import { generateHtmlFromItems } from '@/utils/htmlUtils';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import RuleIcon from '@mui/icons-material/Rule';
import GradeIcon from '@mui/icons-material/Grade';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ScheduleIcon from '@mui/icons-material/Schedule';

export default function FeedbackViewer({ params }: { params: Promise<{ code: string }> }) {
  // Unwrap the Promise for params using React.use in client components
  const { code } = React.use(params);
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [correction, setCorrection] = useState<any>(null);
  const [renderedHtml, setRenderedHtml] = useState('');

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
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={40} />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <ErrorOutlineIcon color="error" fontSize="large" />
            <Typography variant="h5" color="error.main">
              Erreur
            </Typography>
          </Box>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push('/')}
          >
            Retour à l'accueil
          </Button>
        </Paper>
      </Container>
    );
  }

  if (!correction) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="warning">
          Correction non trouvée
        </Alert>
      </Container>
    );
  }

  // Vérifier si des notes sont présentes
  const hasGrade = correction.grade !== null && correction.grade !== undefined;
  const hasPenalty = correction.penalty !== null && correction.penalty !== undefined && parseFloat(correction.penalty) > 0;
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
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 3 }}>
          <RuleIcon color="primary" />
          <Typography variant="h5" >
            Correction de {correction.student_name || "l'élève"}
          </Typography>
        </Box>
        
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
         {correction.activity_name}
        </Typography>

        {/* Dates importantes */}
        <Paper 
          elevation={0} 
          variant="outlined" 
          sx={{ 
            p: 2, 
            mt: 2, 
            mb: 3, 
            bgcolor: 'background.default',
            borderLeft: '4px solid',
            borderColor: 'info.main'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <CalendarTodayIcon color="info" />
            <Typography variant="h6">
              Dates importantes
            </Typography>
          </Box>
          
          <Grid container spacing={2} sx={{ pl: 3 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EventAvailableIcon fontSize="small" color="action" />
                <Typography variant="body1">
                  <strong>Date limite:</strong> {formatDate(correction.deadline)}
                </Typography>
              </Box>
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <HourglassEmptyIcon fontSize="small" color="action" />
                {/* Fix hydration error by changing Typography to component="div" */}
                <Typography variant="body1" component="div">
                  <strong>Date de rendu:</strong> {formatDate(correction.submission_date)}
                  {isMoreThanOneDayLate && (
                    <Chip 
                      label="En retard" 
                      size="small" 
                      color="error" 
                      sx={{ ml: 1 }}
                    />
                  )}
                  {isOneDayLate && (
                    <Chip 
                      label="Léger retard" 
                      size="small" 
                      color="warning" 
                      sx={{ ml: 1 }}
                    />
                  )}
                  {isOnTime && (
                    <Chip 
                      label="À temps" 
                      size="small" 
                      color="success" 
                      sx={{ ml: 1 }}
                    />
                  )}
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {/* Ajouter un message approprié selon le timing de rendu */}
          {isMoreThanOneDayLate && (
            <Box sx={{ mt: 2, ml: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Alert severity="error" icon={<ScheduleIcon />} sx={{ width: '100%' }}>
                Rendu en retard de {daysLate} jour(s) - Une pénalité s'applique à la note finale.
              </Alert>
            </Box>
          )}
          
          {isOneDayLate && (
            <Box sx={{ mt: 2, ml: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Alert severity="warning" icon={<ScheduleIcon />} sx={{ width: '100%' }}>
                Rendu en retard de 1 jour - Tolérance de 24h : exempté de pénalité.
              </Alert>
            </Box>
          )}
          
          {isOnTime && (
            <Box sx={{ mt: 2, ml: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Alert severity="success" icon={<CheckCircleIcon />} sx={{ width: '100%' }}>
                Rendu effectué dans les délais.
              </Alert>
            </Box>
          )}
        </Paper>

        {/* Affichage de la note */}
        {hasGrade && (
          <Paper 
            elevation={0} 
            variant="outlined" 
            sx={{ 
              p: 2, 
              mt: 2, 
              mb: 3, 
              bgcolor: 'background.default',
              borderLeft: '4px solid',
              borderColor: 'primary.main'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <GradeIcon color="primary" />
              <Typography variant="h6">
                Résultat
              </Typography>
            </Box>
            
            <Box sx={{ pl: 3 }}>
              {/* Afficher les détails des notes expérimentales et théoriques */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                <Box sx={{ 
                  p: 1.5, 
                  borderRadius: 1, 
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider'
                }}>
                  <Typography variant="body2" color="text.secondary">Partie expérimentale</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'medium', color: 'primary.light' }}>
                    {correction.experimental_points_earned || '0'} / {correction.experimental_points || '5'}
                  </Typography>
                </Box>
                
                <Box sx={{ 
                  p: 1.5, 
                  borderRadius: 1, 
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider'
                }}>
                  <Typography variant="body2" color="text.secondary">Partie théorique</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'medium', color: 'primary.light' }}>
                    {correction.theoretical_points_earned || '0'} / {correction.theoretical_points || '15'}
                  </Typography>
                </Box>
              </div>
              <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mt: 2, 
                  gap: 1 
                }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    Note totale :
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    {correction.grade}/20
                  </Typography>
                </Box>
              
              
              {hasPenalty && (
                <Typography variant="body1" color="error" sx={{ mt: 1 }}>
                  <strong>Pénalité:</strong> -{correction.penalty} point{correction.penalty > 1 ? 's' : ''}
                  {isMoreThanOneDayLate && (
                    <Typography component="span" variant="caption" sx={{ ml: 1 }}>
                      (retard sur la date limite)
                    </Typography>
                  )}
                </Typography>
              )}
              
              {isOneDayLate && !hasPenalty && (
                <Typography variant="body1" color="warning.main" sx={{ mt: 1 }}>
                  <strong>Tolérance 24h :</strong> Exempté de pénalité malgré le léger retard.
                </Typography>
              )}
              
              {hasPenalty && (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mt: 2, 
                gap: 1,
                borderColor: 'divider' 
              }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                  Note finale :
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'secondary.main' }}>
                  {finalGrade}/20
                </Typography>
              </Box>
              )}
            </Box>
          </Paper>
        )}

        <Divider sx={{ my: 3 }} />

        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Contenu de la correction :
          </Typography>
          <Paper 
            variant="outlined" 
            sx={{ p: 3, mt: 2, bgcolor: 'background.default' }}
          >
            <div 
              dangerouslySetInnerHTML={{ __html: renderedHtml }} 
              className="correction-content"
            />
          </Paper>
        </Box>
        
        <Box sx={{ mt: 4, textAlign: 'right' }}>
          <Typography variant="caption" display="block" color="text.secondary">
            Correction créée le {new Date(correction.created_at).toLocaleDateString('fr-FR')}
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}
