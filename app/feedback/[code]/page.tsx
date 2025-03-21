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
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Ajout des états manquants
  const [correctionContent, setCorrectionContent] = useState<string>('');
  const [editorContent, setEditorContent] = useState<any[]>([]);

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
    <div className={`${inter.className} min-h-screen bg-gradient-to-b from-gray-50 to-blue-50 flex justify-center px-4 py-8`}>
      <div className="max-w-4xl w-full">
        {/* En-tête avec une apparence plus moderne */}
        <div className="mb-6">
          <Paper 
            elevation={3} 
            className="overflow-hidden rounded-lg shadow-lg"
          >
            {/* Bannière supérieure avec dégradé et image de fond */}
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-8 relative overflow-hidden">
              {/* Motif de fond discret */}
              <div className="absolute inset-0 opacity-10" 
                   style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'}}
              ></div>
              
              {/* Contenu de l'en-tête */}
              <div className="relative z-10 text-center">
                <div className="inline-flex items-center justify-center mb-4 bg-white/20 p-3 rounded-full">
                  <RuleIcon sx={{ fontSize: 38 }} />
                </div>
                <Typography variant="h3" className="font-bold mb-2">
                  Correction de {correction.student_name || "l'élève"}
                </Typography>
                <Typography variant="h5" className="text-blue-100 font-medium">
                  {correction.activity_name}
                </Typography>
              </div>
            </div>

            {/* Contenu principal avec présentation améliorée */}
            <div className="p-8">
              {/* Section des notes avec un design d'affichage plus percutant */}
              <div className="grid grid-cols-1 lg:grid-cols-6 gap-6 mb-8">
                {/* Notes par partie - 4 colonnes */}
                <div className="lg:col-span-4">
                  {hasGrade && (
                    <Paper 
                      elevation={0}
                      variant="outlined"
                      sx={{ borderRadius: 2 }}
                      className="h-full p-5 bg-gradient-to-br from-green-50 to-blue-50 border-l-4 border-green-600"
                    >
                      <Box className="flex items-center gap-2 mb-4">
                        <GradeIcon className="text-green-700" />
                        <Typography variant="h6" className="font-bold">
                          Résultats
                        </Typography>
                      </Box>
                      
                      {/* Notes par partie affichées horizontalement */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                        <Paper className="p-4 border shadow-sm transition-all hover:shadow-md bg-white">
                          <Typography variant="subtitle2" className="text-gray-600 mb-1">Partie expérimentale</Typography>
                          <Typography variant="h4" className="font-bold text-blue-700 flex items-baseline">
                            {formatGrade(correction.experimental_points_earned)} <span className="text-gray-500 text-lg ml-1">/ {correction.experimental_points || '5'}</span>
                          </Typography>
                        </Paper>
                        
                        <Paper className="p-4 border shadow-sm transition-all hover:shadow-md bg-white">
                          <Typography variant="subtitle2" className="text-gray-600 mb-1">Partie théorique</Typography>
                          <Typography variant="h4" className="font-bold text-blue-700 flex items-baseline">
                            {formatGrade(correction.theoretical_points_earned)} <span className="text-gray-500 text-lg ml-1">/ {correction.theoretical_points || '15'}</span>
                          </Typography>
                        </Paper>
                      </div>
                      
                      {/* Affichage des pénalités */}
                      {hasPenalty && (
                        <Alert 
                          severity="warning" 
                          variant="outlined"
                          className="mb-3"
                          icon={<ScheduleIcon />}
                        >
                          <Typography variant="subtitle2" className="font-bold">
                            Pénalité de retard : — {correction.penalty} point{correction.penalty > 1 ? 's' : ''}
                          </Typography>
                          {isMoreThanOneDayLate && (
                            <Typography variant="caption">
                              (pour {daysLate} jours de retard)
                            </Typography>
                          )}
                        </Alert>
                      )}
                    </Paper>
                  )}
                </div>
                
                {/* Note totale - 2 colonnes */}
                <div className="lg:col-span-2">
                  {hasGrade && (
                    <Paper
                      elevation={0}
                      className="h-full flex flex-col justify-center items-center p-6 bg-gradient-to-br from-blue-600 to-indigo-800 text-white rounded-lg shadow-lg"
                    >
                      <Typography variant="overline" className="tracking-wider text-blue-500">
                        NOTE FINALE
                      </Typography>
                      <Typography variant="h1" className="text-5xl sm:text-6xl font-bold mb-2">
                        {formatGrade(hasPenalty ? finalGrade : correction.grade)}
                      </Typography>
                      <Typography variant="subtitle1">
                        sur 20 points
                      </Typography>
                    </Paper>
                  )}
                </div>
              </div>

              {/* Section des dates avec design modernisé */}
              <Paper 
                elevation={0} 
                variant="outlined" 
                sx={{ borderRadius: 2 }}
                className="p-6 mb-8 bg-blue-50 border-l-4 border-blue-500"
              >
                <Box className="flex flex-wrap items-center justify-between">
                  <Box className="flex items-center gap-2 mb-3">
                    <CalendarTodayIcon color="primary" />
                    <Typography variant="h6" className="font-bold">
                      Dates importantes
                    </Typography>
                  </Box>
                  
                  {/* Badge de statut plus visible */}
                  <Box>
                    {isMoreThanOneDayLate && (
                      <Chip 
                        label="Rendu en retard" 
                        size="medium" 
                        color="error" 
                        icon={<ScheduleIcon />} 
                        className="font-medium" 
                      />
                    )}
                    {isOneDayLate && (
                      <Chip 
                        label="Léger retard" 
                        size="medium" 
                        color="warning" 
                        icon={<ScheduleIcon />} 
                        className="font-medium" 
                      />
                    )}
                    {isOnTime && (
                      <Chip 
                        label="Rendu à temps" 
                        size="medium" 
                        color="success" 
                        icon={<CheckCircleIcon />} 
                        className="font-medium" 
                      />
                    )}
                  </Box>
                </Box>
                
                {/* Présentation des dates en deux colonnes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <div className="bg-white rounded-lg p-4 border border-blue-100 flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <EventAvailableIcon fontSize="medium" className="text-blue-700" />
                    </div>
                    <div>
                      <Typography variant="subtitle2" className="text-gray-600">Date limite</Typography>
                      <Typography variant="h6" className="font-medium">{formatDate(correction.deadline)}</Typography>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 border border-blue-100 flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <HourglassEmptyIcon fontSize="medium" className="text-blue-700" />
                    </div>
                    <div>
                      <Typography variant="subtitle2" className="text-gray-600">Date de rendu</Typography>
                      <Typography variant="h6" className="font-medium">{formatDate(correction.submission_date)}</Typography>
                    </div>
                  </div>
                </div>
              </Paper>

              {/* Contenu de la correction avec style amélioré */}
              <Paper 
                elevation={0}
                variant="outlined" 
                sx={{ borderRadius: 2 }}
                className="overflow-hidden mb-6"
              >
                {/* En-tête stylisé pour le contenu */}
                <div className="bg-gradient-to-r from-gray-100 to-blue-50 border-b p-4 flex items-center gap-2">
                  <Typography variant="h6" className="font-bold text-gray-800">
                    Contenu de la correction
                  </Typography>
                </div>
                
                {/* Contenu avec style amélioré */}
                <div className="p-6 bg-white shadow-inner">
                  <div 
                    dangerouslySetInnerHTML={{ __html: renderedHtml }} 
                    className="correction-content prose prose-sm md:prose-base max-w-none prose-headings:text-blue-800 prose-a:text-blue-600"
                  />
                </div>
              </Paper>
            </div>
            
            {/* Pied de page amélioré */}
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-4 flex justify-between items-center">
              <Typography variant="caption" className="text-gray-300">
                Correction #{correction.id}
              </Typography>
              <Typography variant="caption" className="text-gray-300">
                Créée le {new Date(correction.created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </Typography>
            </div>
          </Paper>
        </div>
      </div>
    </div>
  );
}
