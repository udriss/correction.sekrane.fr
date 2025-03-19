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
  Chip
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import Link from 'next/link';
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-4xl w-full flex justify-center py-16">
          <CircularProgress size={40} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
        <div className="max-w-4xl w-full">
          <Paper 
            elevation={2} 
            sx={{ p: 4, borderRadius: 2 }}
            className="border-l-4 border-red-500"
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <ErrorOutlineIcon color="error" fontSize="large" />
              <Typography variant="h5" color="error.main" className="font-bold">
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
        </div>
      </div>
    );
  }

  if (!correction) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
        <div className="max-w-4xl w-full">
          <Alert severity="warning">
            Correction non trouvée
          </Alert>
        </div>
      </div>
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
    <div className={`${inter.className} min-h-screen bg-gray-50 flex justify-center px-4 py-8`}>
      <div className="max-w-4xl w-full">
        <Paper 
          elevation={3} 
          className="overflow-hidden rounded-lg shadow-lg"
        >
          {/* En-tête avec un arrière-plan gradient */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <RuleIcon sx={{ fontSize: 32 }} />
              <Typography variant="h4" className="font-bold">
                Correction de {correction.student_name || "l'élève"}
              </Typography>
            </div>
            
            <Typography 
              variant="h6" 
              className="text-center text-blue-100 mt-2 font-medium"
            >
              {correction.activity_name}
            </Typography>
          </div>

          <div className="p-6">
            {/* Dates importantes - design amélioré */}
            <Paper 
              elevation={0} 
              variant="outlined" 
              sx={{ borderRadius: 2 }}
              className="p-4 mb-6 border-l-4 border-blue-500 bg-blue-50"
            >
              <Box className="flex items-center gap-2 mb-3">
                <CalendarTodayIcon color="primary" />
                <Typography variant="h6" className="font-bold">
                  Dates importantes
                </Typography>
              </Box>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-2">
                <div className="flex items-center gap-2">
                  <EventAvailableIcon fontSize="small" className="text-blue-700" />
                  <div>
                    <Typography variant="subtitle2" className="text-gray-600">Date limite</Typography>
                    <Typography variant="body1" className="font-medium">{formatDate(correction.deadline)}</Typography>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <HourglassEmptyIcon fontSize="small" className="text-blue-700" />
                  <div>
                    <Typography variant="subtitle2" className="text-gray-600">Date de rendu</Typography>
                    <div className="flex items-center gap-2">
                      <Typography variant="body1" className="font-medium">{formatDate(correction.submission_date)}</Typography>
                      {isMoreThanOneDayLate && (
                        <Chip label="En retard" size="small" color="error" />
                      )}
                      {isOneDayLate && (
                        <Chip label="Léger retard" size="small" color="warning" />
                      )}
                      {isOnTime && (
                        <Chip label="À temps" size="small" color="success" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages de statut */}
              {isMoreThanOneDayLate && (
                <Alert severity="error" icon={<ScheduleIcon />}
                className="mt-4"
                variant="outlined">
                  Rendu en retard de {daysLate} jour(s) - Une pénalité s'applique à la note finale.
                </Alert>
              )}
              
              {isOneDayLate && (
                <Alert severity="warning" icon={<ScheduleIcon />} 
                className="mt-4"
                variant="outlined">
                  Rendu en retard de 1 jour - Tolérance de 24h : exempté de pénalité.
                </Alert>
              )}
              
              {isOnTime && (
                <Alert 
                  severity="success" 
                  icon={<CheckCircleIcon />} 
                  className="mt-4"
                  variant="outlined"
                >
                  Rendu effectué dans les délais.
                </Alert>
              )}
            </Paper>

            {/* Affichage de la note - design amélioré */}
            {hasGrade && (
              <Paper 
                elevation={0}
                variant="outlined"
                sx={{ borderRadius: 2 }}
                className="p-4 mb-6 border-l-4 border-green-600 bg-green-50"
              >
                <Box className="flex items-center gap-2 mb-3">
                  <GradeIcon className="text-green-700" />
                  <Typography variant="h6" className="font-bold">
                    Résultat
                  </Typography>
                </Box>
                
                {/* Notes par partie */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <Paper className="p-3 border shadow-sm">
                    <Typography variant="subtitle2" className="text-gray-600">Partie expérimentale</Typography>
                    <Typography variant="h5" className="font-bold text-blue-700">
                      {formatGrade(correction.experimental_points_earned)} <span className="text-gray-600 text-lg">/ {correction.experimental_points || '5'}</span>
                    </Typography>
                  </Paper>
                  
                  <Paper className="p-3 border shadow-sm">
                    <Typography variant="subtitle2" className="text-gray-600">Partie théorique</Typography>
                    <Typography variant="h5" className="font-bold text-blue-700">
                      {formatGrade(correction.theoretical_points_earned)} <span className="text-gray-600 text-lg">/ {correction.theoretical_points || '15'}</span>
                    </Typography>
                  </Paper>
                </div>
                
                {/* Note totale */}
                <div className="flex justify-center mb-2">
                  <div className="flex flex-col items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-800 rounded-full text-white inline-block">
                    <Typography variant="subtitle2">Totale</Typography>
                    <Typography variant="h4" className="text-center font-bold">
                      {formatGrade(correction.grade)} / 20
                    </Typography>
                  </div>
                </div>
                
                {/* Pénalités si applicables */}
                {hasPenalty && (
                  <div className="mt-4">
                    <Alert 
                      severity="error" 
                      variant="outlined"
                      sx={{ mb: 1 }}
                    >
                      <div className="font-bold">Pénalité de retard : - {correction.penalty} point{correction.penalty > 1 ? 's' : ''}</div>
                      {isMoreThanOneDayLate && (
                        <Typography variant="caption">
                          (pour {daysLate} jours de retard)
                        </Typography>
                      )}
                    </Alert>
                    
                    <div className="mt-3 p-2 bg-gray-100 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-center">
                        <Typography variant="subtitle2">
                          Note finale après pénalité :
                        </Typography>
                        <Typography variant="h5" className="font-bold text-red-600">
                          {formatGrade(finalGrade)} / 20
                        </Typography>
                      </div>
                    </div>
                  </div>
                )}
              </Paper>
            )}

            <Divider className="my-6" />

            {/* Contenu de la correction */}
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-4 bg-gray-100 p-2 rounded-t-lg border-b-2 border-blue-500">
                <Typography variant="h6" className="font-bold text-gray-800">
                  Contenu de la correction
                </Typography>
              </div>
              
              <Paper 
                variant="outlined" 
                className="p-5 mb-6 rounded bg-white shadow-inner"
              >
                <div 
                  dangerouslySetInnerHTML={{ __html: renderedHtml }} 
                  className="correction-content prose prose-sm md:prose-base max-w-none prose-headings:text-blue-800 prose-a:text-blue-600"
                />
              </Paper>
            </div>
          </div>
          
          <div className="bg-gray-100 p-4 text-right border-t">
            <Typography variant="caption" className="text-gray-500">
              Correction créée le {new Date(correction.created_at).toLocaleDateString('fr-FR')}
            </Typography>
          </div>
        </Paper>
      </div>
    </div>
  );
}
