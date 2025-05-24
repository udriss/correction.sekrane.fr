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
  useTheme,
  alpha
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
import InfoIcon from '@mui/icons-material/Info';
import GradientBackground from '@/components/ui/GradientBackground';
import PatternBackground from '@/components/ui/PatternBackground';
import ErrorDisplay from '@/components/ui/ErrorDisplay';
import {CorrectionAutreEnriched} from '@/lib/types';

// Initialiser la police Inter
const inter = Inter({ subsets: ['latin'] });



// Composant pour gérer l'affichage des SVG avec fallback
const SVGImageHandler: React.FC<{ htmlContent: string }> = ({ htmlContent }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Fonction pour gérer les erreurs d'images
    const handleImageError = (imgElement: HTMLImageElement, isRetry = false) => {
      const imageUrl = imgElement.src;
      
      console.error('Erreur de chargement de l\'image dans le feedback:', imageUrl);
      console.error('Image error details:', {
        src: imgElement.src,
        naturalWidth: imgElement.naturalWidth,
        naturalHeight: imgElement.naturalHeight,
        complete: imgElement.complete
      });
      
      // Fonction pour afficher l'erreur
      const showImageError = (element: HTMLImageElement) => {
        const parent = element.parentElement;
        if (parent) {
          parent.innerHTML = `
            <div style="
              padding: 20px; 
              border: 2px dashed #ccc; 
              border-radius: 4px; 
              text-align: center; 
              color: #666;
              background-color: #f9f9f9;
              margin: 1.5rem auto;
            ">
              <p>⚠️ Image non disponible</p>
              <p style="font-size: 12px; margin: 5px 0 0 0;">
                Le fichier image n'a pas pu être chargé${imageUrl?.includes('.svg') ? ' (SVG)' : ''}
              </p>
            </div>
          `;
        }
      };
      
      // Pour les SVG, on essaie une approche différente avant d'afficher l'erreur
      if (imageUrl && imageUrl.toLowerCase().includes('.svg') && !isRetry) {
        console.log('SVG detected in feedback, trying alternative loading method');
        // Pour les SVG, on peut essayer de les charger comme data URL
        fetch(imageUrl)
          .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.text();
          })
          .then(svgContent => {
            if (svgContent.includes('<svg')) {
              // Remplace l'img par le SVG inline
              const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent)}`;
              imgElement.src = svgDataUrl;
              console.log('SVG loaded as data URL successfully in feedback');
              return;
            }
            throw new Error('Invalid SVG content');
          })
          .catch((fetchError) => {
            console.error('SVG fetch failed in feedback:', fetchError);
            // Si même cette approche échoue, afficher l'erreur
            showImageError(imgElement);
          });
        return;
      }
      
      // Pour les autres types d'images ou les SVG qui ont déjà échoué en retry, affichage direct de l'erreur
      showImageError(imgElement);
    };

    // Attacher les gestionnaires d'erreur à toutes les images
    const images = containerRef.current.querySelectorAll('img');
    images.forEach(img => {
      // Gestionnaire pour les erreurs de chargement
      const errorHandler = (e: Event) => {
        handleImageError(e.target as HTMLImageElement);
      };
      
      // Gestionnaire pour les chargements réussis (debug)
      const loadHandler = (e: Event) => {
        const target = e.target as HTMLImageElement;
        console.log('Image loaded successfully in feedback:', target.src);
      };
      
      img.addEventListener('error', errorHandler);
      img.addEventListener('load', loadHandler);
      
      // Nettoyage
      return () => {
        img.removeEventListener('error', errorHandler);
        img.removeEventListener('load', loadHandler);
      };
    });
  }, [htmlContent]);

  return (
    <div 
      ref={containerRef}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
      style={{
        maxWidth: 'none',
      }}
      className="correction-content prose prose-sm md:prose-base"
    />
  );
};

interface ContentData {
  items: any[];
  version: string;
}

interface Correction {
  active: number;
  activity_id: number;
  activity_name: string;
  class_id: number;
  content: string;
  content_data: ContentData;
  created_at: string;
  deadline: string;
  final_grade: string;
  grade: string;
  group_id: number;
  id: number;
  parts_names: string[];
  penalty: string;
  points: number[];
  points_earned: number[];
  shareCode: string;
  shared: boolean;
  status: "ACTIVE" | "ABSENT" | "NON_RENDU" | "NON_NOTE" | "DEACTIVATED";
  student_id: number;
  student_name: string;
  submission_date: string;
  updated_at: string;
}

export default function FeedbackViewer({ params }: { params: Promise<{ code: string }> }) {
  // Unwrap the Promise for params using React.use in client components
  const { code } = React.use(params);
  const router = useRouter();
  const theme = useTheme(); // Obtenir le thème
  const isMediumScreen = useMediaQuery(theme.breakpoints.up('md')); // Détecter si écran md ou plus grand
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | string | null>(null);
  const [correction, setCorrection] = useState<Correction | null>(null);
  const [renderedHtml, setRenderedHtml] = useState('');

  // Pour gérer les fragments de catégorie 26 (titres d'exercices)
  const [fragmentsWithCategory26, setFragmentsWithCategory26] = useState<Set<number>>(new Set());
  const [isProcessingFragments, setIsProcessingFragments] = useState<boolean>(false);
  const [processedHtml, setProcessedHtml] = useState<string>('');
  
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
      // Vérifier si la note a des centièmes
      const hasCentesimal = (numValue * 100) % 10 !== 0;
      
      // Format avec une ou deux décimales selon le cas, et remplace le point par une virgule
      return (hasCentesimal ? numValue.toFixed(2) : numValue.toFixed(1)).replace('.', ',');
    }
  };

  // Extraire la fonction fetchSharedCorrection pour qu'elle soit accessible en dehors du useEffect
  const fetchSharedCorrection = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/feedback/${code}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erreur lors du décodage de la réponse' }));
        // Créer une instance d'Error et y attacher les détails
        const error = new Error('Erreur lors du chargement de la correction : ' + (errorData.error || 'Erreur lors du chargement de la correction'));
        (error as any).details = errorData.details || {};
        
        if (response.status === 404) {
          error.message = 'Ce lien de partage est invalide ou a expiré';
        }
        
        setError(error);
        throw error;
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
      // Si nous n'avons pas déjà défini l'erreur (avec des détails) ci-dessus
      if (!error) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      setLoading(false);
    }
  };

  // Récupérer la correction partagée
  useEffect(() => {
    fetchSharedCorrection();
  }, [code]);

  // Effet pour récupérer les informations sur les fragments et identifier ceux avec des catégories mises en évidence
  useEffect(() => {
    const fetchFragmentsCategories = async () => {
      if (correction?.content_data?.items && !isProcessingFragments) {
        setIsProcessingFragments(true);
        
        try {
          // Extraire tous les IDs de fragments originaux
          const originalFragmentIds = correction.content_data.items
            .filter((item: any) => item.originalFragmentId)
            .map((item: any) => item.originalFragmentId);
          
          // Supprimer les doublons
          const uniqueFragmentIds = Array.from(new Set(originalFragmentIds));
          
          // Si nous avons des fragments originaux, récupérer leurs catégories
          if (uniqueFragmentIds.length > 0) {
            const highlightedFragments = new Set<number>();
            
            // Récupérer les informations de catégorie pour chaque fragment
            for (const fragmentId of uniqueFragmentIds) {
              try {
                const response = await fetch(`/api/fragments/${fragmentId}`);
                if (response.ok) {
                  const fragmentData = await response.json();
                  
                  // Vérifier si ce fragment a des catégories avec highlighted=true
                  if (fragmentData.categories) {
                    // Récupérer les IDs des catégories
                    let categoryIds: number[] = [];
                    
                    if (Array.isArray(fragmentData.categories)) {
                      if (typeof fragmentData.categories[0] === 'object') {
                        // Si categories est un tableau d'objets avec id
                        categoryIds = fragmentData.categories
                          .filter((cat: any) => cat && typeof cat === 'object' && 'id' in cat)
                          .map((cat: any) => cat.id);
                      } else if (typeof fragmentData.categories[0] === 'number') {
                        // Si categories est un tableau d'IDs
                        categoryIds = fragmentData.categories as number[];
                      }
                    }
                    
                    // Vérifier chaque catégorie pour voir si elle est mise en évidence
                    if (categoryIds.length > 0) {
                      const categoriesResponse = await fetch('/api/categories');
                      if (categoriesResponse.ok) {
                        const categoriesData = await categoriesResponse.json();
                        const highlightedCategoryIds = categoriesData
                          .filter((cat: any) => cat.highlighted)
                          .map((cat: any) => cat.id);
                        
                        // Si l'une des catégories du fragment est mise en évidence
                        if (categoryIds.some(id => highlightedCategoryIds.includes(id))) {
                          highlightedFragments.add(fragmentId);
                        }
                      }
                    }
                  }
                }
              } catch (error) {
                console.error(`Erreur lors de la récupération du fragment ${fragmentId}:`, error);
              }
            }
            
            setFragmentsWithCategory26(highlightedFragments);
          }
        } catch (error) {
          console.error('Erreur lors du traitement des fragments:', error);
        } finally {
          setIsProcessingFragments(false);
        }
      }
    };
    
    fetchFragmentsCategories();
  }, [correction]);

  // Effet pour traiter le HTML une fois que les fragments de catégorie 26 sont identifiés
  useEffect(() => {
    if (renderedHtml && fragmentsWithCategory26.size > 0) {
      const processed = processHtmlForExerciseTitles(renderedHtml);
      setProcessedHtml(processed);
    } else {
      setProcessedHtml(renderedHtml);
    }
  }, [renderedHtml, fragmentsWithCategory26]);

  // Nouvelle fonction pour identifier et modifier les fragments de catégorie 26 (titres d'exercices)
  const processHtmlForExerciseTitles = (html: string): string => {
    if (!correction || !correction.content_data || !correction.content_data.items) {
      return html;
    }

    let updatedHtml = html;
    
    // Parcourir les items du contenu
    correction.content_data.items.forEach((item: any, index: number) => {
      // Vérifier si ce fragment provient d'un fragment original de catégorie 26
      if (item.originalFragmentId && fragmentsWithCategory26.has(item.originalFragmentId)) {
        // Créer un identifiant unique pour cet élément
        const itemId = `fragment-${index}-${item.id || Date.now()}`;
        
        // Trouver le texte de l'item dans le HTML (en échappant les caractères spéciaux)
        const escapedContent = item.content
          .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // échapper les caractères spéciaux
          .replace(/\n/g, '\\s*'); // permettre des espaces ou sauts de ligne
        
        // Créer un modèle de regex pour trouver ce fragment
        const regex = new RegExp(`(<[^>]+>)?${escapedContent}(<\\/[^>]+>)?`, 'i');
        
        // Remplacer le fragment trouvé par une version stylisée
        updatedHtml = updatedHtml.replace(regex, (match) => {
          return `<div id="${itemId}" class="exercise-title">${match}</div>`;
        });
      }
    });
    
    return updatedHtml;
  };

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
            Correction introuvable
          </Alert>
        </Box>
      </Box>
    );
  }


  // Vérifier si des notes sont présentes
  const hasGrade = correction.grade !== null && correction.grade !== undefined;
  const hasPenalty = correction.penalty !== null && correction.penalty !== undefined && parseFloat(correction.penalty) > 0;
  
  // Vérifier si c'est un travail non rendu
  const isNeverSubmitted = correction.status === 'NON_RENDU' || (
    hasPenalty && 
    parseFloat(String(correction.penalty)) === 15 && 
    (parseFloat(String(correction.grade)) === 20 || 
      (Array.isArray(correction.points_earned) && 
      correction.points_earned.reduce((sum: number, p: number) => sum + (typeof p === 'number' ? p : parseFloat(String(p || '0'))), 0) === 20))
  );

  const isAbsent = correction.status === 'ABSENT';
  
  // Format pour afficher "- -" au lieu des valeurs numériques pour les travaux non rendus
  const formatGradeWithNonRendu = (value: number | string | null | undefined) => {
    if (isNeverSubmitted || isAbsent) return "- -";
    return formatGrade(value);
  };
  
  // Calcul de la note finale selon la règle, avec normalisation sur 20
  const calculateFinalGrade = (grade: number, penalty: number, totalPoints: number): number => {
    // Normaliser la note sur 20
    const normalizedGrade = (grade * 20) / totalPoints;
    const normalizedPenalty = (penalty * 20) / totalPoints;

    if (normalizedGrade < 5) {
      // Si la note normalisée est inférieure à 5/20, on garde la note originale sans appliquer de pénalité
      return grade;
    } else {
      // Si la note normalisée est supérieure ou égale à 5/20, on applique la pénalité
      // mais on ne descend pas en dessous de 5/20 (normalisé sur le barème total)
      const normalizedResult = Math.max(normalizedGrade - normalizedPenalty, 5);
      // Reconvertir le résultat sur le barème original
      return (normalizedResult * totalPoints) / 20;
    }
  };
  
  // Récupérer final_grade de la correction ou la calculer si elle n'est pas disponible
  const getFinalGrade = () => {
    // Si final_grade est déjà défini dans la correction, l'utiliser
    if (correction.final_grade !== undefined && correction.final_grade !== null) {
      return correction.final_grade;
    }
    
    // Sinon calculer selon la règle avec normalisation
    const rawTotal = parseFloat(correction.grade) || 0;
    const penalty = parseFloat(correction.penalty) || 0;
    return calculateFinalGrade(rawTotal, penalty, maxPoints);
  };

  
  // Données préparées pour les explications
  const rawTotal = hasGrade ? parseFloat(correction.grade) || 0 : 0;
  const penalty = hasPenalty ? parseFloat(correction.penalty) || 0 : 0;
  const calculatedGrade = rawTotal - penalty;
  const finalGrade = hasGrade ? 
    (hasPenalty ? getFinalGrade() : rawTotal) : 
    null;
  
  // Déterminer le cas d'application de la règle pour l'explication
  const isPenaltyRule5Applied = hasPenalty && rawTotal >= 5 && calculatedGrade < 5;
  
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


  
  // Calculer le total des points disponibles
  const maxPoints = correction.points ? correction.points.reduce((sum, points) => sum + points, 0) : 20;

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
                            {/* Notes par partie affichées dynamiquement à partir des tableaux points_earned et parts_names */}
                            <Grid container spacing={2} sx={{ mb: 2.5 }}>
                              {correction.points_earned && 
                              correction.parts_names && 
                               correction.parts_names.map((partName: string, index: number) => (
                                <Grid size={{ xs: 12, md: 6 }} key={index}>
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
                                      {partName.toUpperCase()}
                                    </Typography>
                                    <Typography variant="h4" sx={{ 
                                      fontWeight: 'bold', 
                                      color: 'primary.light', 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      justifyContent: 'center'
                                    }}>
                                      {formatGradeWithNonRendu(correction.points_earned[index])} 
                                      <Box component="span" sx={{ color: 'text.secondary', fontSize: '1rem', ml: 0.5 }}>
                                        / {correction.points ? correction.points[index] : '?'}
                                      </Box>
                                    </Typography>
                                  </Paper>
                                </Grid>
                              ))}
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
                                  Pénalité de retard : — {parseFloat(String(correction.penalty))} point{parseFloat(String(correction.penalty)) > 1 ? 's' : ''}
                                </Typography>
                                {isMoreThanOneDayLate && (
                                  <Typography variant="caption">
                                    (pour {daysLate} jours de retard)
                                  </Typography>
                                )}
                              </Alert>
                            )}

                            {/* Explication du calcul de la note avec règle du seuil de 6/20 */}
                            {hasPenalty && rawTotal >= 5 && (
                              <Paper 
                                elevation={0} 
                                sx={{ 
                                  p: 2, 
                                  mb: 2, 
                                  border: '1px dashed',
                                  borderColor: 'info.light',
                                  bgcolor: 'info.50',
                                  borderRadius: 2
                                }}
                              >
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'info.dark', mb: 1 }}>
                                  Calcul de votre note finale
                                </Typography>
                                
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2">Note brute obtenue :</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{formatGrade(rawTotal)}/20</Typography>
                                  </Box>
                                  
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2">Pénalité appliquée :</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'error.main' }}>− {formatGrade(penalty)}</Typography>
                                  </Box>
                                  
                                  <Box sx={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between',
                                    borderTop: '1px dotted',
                                    borderColor: 'divider',
                                    pt: 1,
                                    mt: 0.5
                                  }}>
                                    <Typography variant="body2">Résultat du calcul :</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{formatGrade(calculatedGrade)}/20</Typography>
                                  </Box>
                                  
                                  {isPenaltyRule5Applied && (
                                    <>
                                      <Box sx={{ 
                                        display: 'flex', 
                                        justifyContent: 'space-between',
                                        borderTop: '1px dotted',
                                        borderColor: 'divider',
                                        pt: 1,
                                        mt: 0.5,
                                        bgcolor: 'success.50',
                                        px: 1,
                                        borderRadius: 1
                                      }}>
                                        <Typography variant="body2">
                                          <strong>Note finale (seuil minimum) :</strong>
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.dark' }}>6 / 20</Typography>
                                      </Box>
                                      <Typography variant="caption" sx={{ color: 'success.dark', mt: 0.5 }}>
                                        <InfoIcon sx={{ fontSize: 16, verticalAlign: 'text-bottom', mr: 0.5 }} />
                                        Comme votre note brute était ≥ 6/20 et que le calcul après pénalité donnerait une note inférieure à 6/20, 
                                        le seuil minimum de 6/20 s'applique.
                                      </Typography>
                                    </>
                                  )}
                                  
                                  {!isPenaltyRule5Applied && rawTotal >= 5 && calculatedGrade >= 5 && (
                                    <>
                                      <Box sx={{ 
                                        display: 'flex', 
                                        justifyContent: 'space-between',
                                        bgcolor: 'success.50',
                                        px: 1,
                                        borderRadius: 1
                                      }}>
                                        <Typography variant="body2">
                                          <strong>Note finale :</strong>
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.dark' }}>{formatGrade(finalGrade)} / 20</Typography>
                                      </Box>
                                      <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5 }}>
                                        <InfoIcon sx={{ fontSize: 16, verticalAlign: 'text-bottom', mr: 0.5 }} />
                                        Info : si la pénalité avait fait descendre votre note en dessous de 6/20, 
                                        vous auriez bénéficié du seuil minimum de 6/20.
                                      </Typography>
                                    </>
                                  )}
                                </Box>
                              </Paper>
                            )}
                            
                            {/* Explication spécifique pour les notes < 5/20 */}
                            {hasPenalty && rawTotal < 5 && (
                              <Paper 
                                elevation={0} 
                                sx={{ 
                                  p: 2, 
                                  mb: 2, 
                                  border: '1px dashed',
                                  borderColor: 'info.light',
                                  bgcolor: 'info.50',
                                  borderRadius: 2
                                }}
                              >
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'info.dark', mb: 1 }}>
                                  Information sur le calcul de votre note
                                </Typography>
                                
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                  <Typography variant="body2">
                                    Votre note brute est de <strong>{formatGrade(rawTotal)}/20</strong>, ce qui est inférieur au seuil de 5/20.
                                  </Typography>
                                  
                                  <Typography variant="body2">
                                    Pour les notes inférieures à 5/20, la pénalité de retard n'est pas appliquée.
                                    Votre note finale reste donc <strong>{formatGrade(finalGrade)}/20</strong>.
                                  </Typography>
                                </Box>
                              </Paper>
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
                        <Typography variant="overline" sx={{ 
                          letterSpacing: 1, 
                          color: `primary`,
                          fontSize: '1.2rem',}}>
                          {isNeverSubmitted ? "STATUT" : "NOTE FINALE"}
                        </Typography>
                        <Typography variant="h1" sx={{ 
                          fontSize: { xs: '4.5rem', sm: '5.5rem' }, 
                          fontWeight: 700, 
                          mb: 1, 
                          textAlign: 'center',
                          width: '100%' 
                        }}>
                          {isNeverSubmitted ? 
                            "Travail non rendu" : 
                            formatGradeWithNonRendu(hasPenalty ? finalGrade : finalGrade)
                          }
                        </Typography>
                        <Typography variant="subtitle1">
                          {!isNeverSubmitted && (
                            maxPoints === 1 
                              ? 'sur 1 point' 
                              : `sur ${maxPoints} points`
                          )}
                        </Typography>
                      </Paper>
                    )}
                  </Grid>
                </Grid>

                {isNeverSubmitted && (
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 2, 
                      mb: 2, 
                      border: '1px dashed',
                      borderColor: 'error.light',
                      bgcolor: 'error.50',
                      borderRadius: 2
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'error.dark', mb: 1 }}>
                      Travail non rendu : note automatique de 25%
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Typography variant="body2">
                        Ce travail n'a pas été rendu dans les délais impartis. Conformément aux règles d'évaluation, une note forfaitaire de 25% des points maximums est attribuée.
                      </Typography>
                      
                      <Typography variant="body2">
                        Pour un barème total de {maxPoints} points, cela donne une note finale de <strong>{(maxPoints * 0.25).toFixed(1).replace('.', ',')}</strong> points.
                      </Typography>
                    </Box>
                  </Paper>
                )}

                {isAbsent && (
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 2, 
                      mb: 2, 
                      border: '1px dashed',
                      borderColor: 'warning.light',
                      bgcolor: 'warning.50',
                      borderRadius: 2
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'warning.dark', mb: 1 }}>
                      Absence à l'évaluation
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Typography variant="body2">
                        Élève absent lors de cette évaluation. Cette absence a été enregistrée et ne compte pas dans le calcul de la moyenne.
                      </Typography>
                      
                      <Typography variant="body2">
                        Aucune note n'est attribuée pour cette évaluation.
                      </Typography>
                    </Box>
                  </Paper>
                )}

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
                    {/* Utilisation de la fonction pour les styles des titres d'exercices */}
                    <style jsx global>{`
                      .exercise-title {
                        margin-top: 1.5rem;
                        text-align: center;
                        margin-bottom: 2rem;
                        padding: 0.75rem 1rem;
                        font-weight: bold;
                        font-size: 1.1rem;
                        background: linear-gradient(90deg, ${alpha(theme.palette.primary.light,.2)}, ${alpha(theme.palette.secondary.light,.2)});
                        border: 1px solid black;
                        box-shadow: 0px 0px 15px 0px #898989;
                        border-radius: 1rem;
                        page-break-before: auto;
                        page-break-after: avoid;
                      }
                      
                      .exercise-title:first-child {
                        margin-top: 0;
                      }
                      
                      /* S'assurer que les titres d'exercices ne sont pas affectés par les styles des paragraphes */
                      .exercise-title::before {
                        content: none !important;
                      }
                      
                      .exercise-title p {
                        margin: 0;
                        padding: 0;
                      }
                    `}</style>

                    <SVGImageHandler htmlContent={processHtmlForExerciseTitles(renderedHtml)} />
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


