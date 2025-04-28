'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Container, 
  Paper, 
  Typography, 
  Box, 
  Button, 
  Card, 
  CardContent, 
  CardActions,
  Tooltip, 
  Chip, 
  Divider, 
  LinearProgress,
  Alert,
  Grid,
  alpha,
  TextField,
  CircularProgress
} from '@mui/material';
import GradientBackground from '@/components/ui/GradientBackground';
import PatternBackground from '@/components/ui/PatternBackground';
import ErrorDisplay from '@/components/ui/ErrorDisplay';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';

// Icons
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import GradeIcon from '@mui/icons-material/Grade';
import AssignmentIcon from '@mui/icons-material/Assignment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import EqualizerIcon from '@mui/icons-material/Equalizer';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ScienceIcon from '@mui/icons-material/Science';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import LockIcon from '@mui/icons-material/Lock';
import KeyIcon from '@mui/icons-material/Key';

// Types
interface Student {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  gender?: 'M' | 'F' | 'N';
  group?: string;
  // Ajouter les informations sur toutes les classes
  allClasses?: { classId: number; className: string; sub_class?: string | null }[];
}

interface Correction {
  id: number;
  activity_id: number;
  activity_name: string;
  student_id: number;
  class_id: number;
  class_name: string;
  submission_date: string;
  grade: string | number;
  content?: string;
  content_data?: any;
  penalty: string | number;
  deadline: string;
  group_id: number;
  student_name: string;
  student_first_name: string;
  student_last_name: string;
  status: 'RENDU' | 'NON_RENDU' | 'ABSENT' | 'NON_NOTE' | 'DEACTIVATED';
  created_at: string;
  updated_at: string;
  points?: number[]; // Points maximum pour chaque partie
  parts_names?: string[]; // Noms des parties
  points_earned?: number[]; // Points gagnés pour chaque partie
  max_points?: number; // Calculé côté client
  score_percentage?: number; // Calculé côté client
  final_grade?: number | null; // Note finale calculée côté client
}

interface StudentStats {
  total_corrections: number;
  average_grade: number | null;
  highest_grade: number | null;
  lowest_grade: number | null;
  total_experimental_points: number;
  total_theoretical_points: number;
  average_experimental_points: number;
  average_theoretical_points: number;
  recent_corrections: {
    id: number;
    activity_name: string;
    grade: number;
    submission_date: string;
    status: 'RENDU' | 'NON_RENDU' | 'ABSENT' | 'NON_NOTE' | 'DEACTIVATED';
  }[];
  grade_trend?: 'up' | 'down' | 'stable';
  parts_averages?: number[];
}

export default function StudentCorrectionsPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params?.id;
  
  const [student, setStudent] = useState<Student | null>(null);
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | string | null>(null);
  const [shareUrl, setShareUrl] = useState<string>('');
  
  // États pour la gestion de l'authentification par mot de passe
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [password, setPassword] = useState<string>('');
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  
  // États pour la gestion de l'édition d'étudiant
  const [editError, setEditError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<any>(null);

  // Gérer la récupération du share code et rediriger vers la page de feedback
  const [shareUrls, setShareUrls] = useState<Map<number, string>>(new Map());
  const [loadingShareCodes, setLoadingShareCodes] = useState<Map<number, boolean>>(new Map());
  const [shareCodeErrors, setShareCodeErrors] = useState<Map<number, string>>(new Map());

  // Fonction pour vérifier le mot de passe
  const handlePasswordVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !password.trim()) {
      setAuthError("Veuillez entrer un mot de passe");
      return;
    }

    setAuthLoading(true);
    setAuthError(null);

    try {
      const response = await fetch(`/api/students/${studentId}/verify-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setAuthError(data.error || "Erreur lors de la vérification du mot de passe");
        return;
      }

      if (data.authenticated) {
        // Stocker le token et marquer comme authentifié
        setAccessToken(data.accessToken);
        setIsAuthenticated(true);
        // Stocker le token dans sessionStorage pour persistance
        sessionStorage.setItem(`student_auth_${studentId}`, data.accessToken);
        // Charger les données de l'étudiant
        fetchStudentData(data.accessToken);
      } else {
        setAuthError("Mot de passe incorrect");
      }
    } catch (err) {
      console.error("Erreur lors de la vérification du mot de passe:", err);
      setAuthError("Une erreur est survenue lors de la vérification du mot de passe");
    } finally {
      setAuthLoading(false);
    }
  };

  // Vérifier l'authentification au chargement de la page
  useEffect(() => {
    if (!studentId) return;
    
    // Vérifier si un token existe déjà dans sessionStorage
    const savedToken = sessionStorage.getItem(`student_auth_${studentId}`);
    if (savedToken) {
      setAccessToken(savedToken);
      setIsAuthenticated(true);
      fetchStudentData(savedToken);
    } else {
      setLoading(false);
    }
  }, [studentId]);

  // Fonction pour récupérer le code de partage d'une correction
  const getShareUrl = async (correctionId: number) => {
    // Vérifier si on a déjà l'URL pour cette correction
    if (shareUrls.has(correctionId)) {
      return shareUrls.get(correctionId);
    }

    // Marquer comme en cours de chargement
    setLoadingShareCodes(prev => new Map(prev).set(correctionId, true));
    setShareCodeErrors(prev => new Map(prev).set(correctionId, ''));

    try {
      const response = await fetch(`/api/corrections_autres/${correctionId}/share`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Erreur ${response.status}: Impossible de récupérer le lien de partage`);
      }
      
      const data = await response.json();
      
      // Construire l'URL complète
      const shareUrl = `${window.location.origin}/feedback/${data.code}`;
      
      // Stocker l'URL pour une utilisation ultérieure
      setShareUrls(prev => new Map(prev).set(correctionId, shareUrl));
      return shareUrl;
    } catch (error) {
      console.error('Erreur lors de la récupération du code de partage:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setShareCodeErrors(prev => new Map(prev).set(correctionId, errorMessage));
      return null;
    } finally {
      setLoadingShareCodes(prev => new Map(prev).set(correctionId, false));
    }
  };

  // Fonction pour créer un lien et le suivre au lieu d'utiliser window.open
  const handleOpenFeedback = async (correctionId: number) => {
    try {
      setLoadingShareCodes(prev => new Map(prev).set(correctionId, true));
      const url = await getShareUrl(correctionId);
      setLoadingShareCodes(prev => new Map(prev).set(correctionId, false));
      
      if (url) {
        // Créer un élément <a> invisible et simuler un clic utilisateur
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error("Erreur lors de l'ouverture du feedback:", error);
      setLoadingShareCodes(prev => new Map(prev).set(correctionId, false));
    }
  };

  // Fonction pour récupérer les données de l'étudiant
  const fetchStudentData = async (token: string) => {
    if (!studentId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Récupérer les informations de l'étudiant
      const studentResponse = await fetch(`/api/studentsPublic/${studentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!studentResponse.ok) {
        const errorData = await studentResponse.json().catch(() => ({ error: 'Étudiant non trouvé' }));
        // Créer une instance d'Error et y attacher les détails
        const error = new Error('Erreur lors du chargement des données de l\'étudiant');
        (error as any).details = errorData.details || {};
        setError(error.message);
        setErrorDetails({
          message: typeof error === 'string' ? error : error.message,
          status: errorData.status || 500,
          statusText: errorData.statusText || '',
          details: errorData.error || 'Une erreur est survenue lors du chargement des données'
        });
        setLoading(false);
        return;
      }
      
      const studentData = await studentResponse.json();
      
      // Récupérer toutes les classes de l'étudiant
      const studentClassesResponse = await fetch(`/api/studentsPublic/${studentId}/classes`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (studentClassesResponse.ok) {
        const studentClassesData = await studentClassesResponse.json();
        
        // Formater les données des classes pour correspondre à l'interface Student.allClasses
        const formattedClasses = studentClassesData.map((classItem: any) => {
          // Gérer les deux formats possibles de réponse de l'API
          if (classItem.class) {
            // Format où chaque élément a une propriété 'class'
            return {
              classId: classItem.class.id,
              className: classItem.class.name,
              sub_class: classItem.sub_class
            };
          } else {
            // Format où chaque élément est directement un objet de classe
            return {
              classId: classItem.id || classItem.class_id,
              className: classItem.name || classItem.class_name,
              sub_class: classItem.sub_class || classItem.subclass
            };
          }
        });
        
        // Mettre à jour les données de l'étudiant avec les classes
        studentData.allClasses = formattedClasses;
      }
      
      setStudent(studentData);
      
      // Récupérer les corrections de l'étudiant
      const correctionsResponse = await fetch(`/api/studentsPublic/${studentId}/corrections`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!correctionsResponse.ok) {
        const errorData = await correctionsResponse.json().catch(() => ({ error: 'Erreur lors du chargement des corrections' }));
        // Créer une instance d'Error et y attacher les détails
        const error = new Error('Erreur lors du chargement des corrections : ' + errorData.error || 'Erreur lors du chargement des corrections');
        (error as any).details = errorData.details || {};
        setError(error.message);
        setErrorDetails({
          status: correctionsResponse.status,
          statusText: correctionsResponse.statusText,
          ...errorData.details || {}
        });
        setLoading(false);
        return;
      }
      const correctionsData = await correctionsResponse.json();
      // Enrichir les corrections avec le pourcentage de score et les points max
      const enrichedCorrections = correctionsData.map((correction: any) => {
        // S'assurer que les valeurs numériques sont traitées comme des nombres
        const grade = typeof correction.grade === 'string' ? parseFloat(correction.grade) : correction.grade;
        
        // Calculer le total des points maximum à partir du tableau points
        const maxPoints = correction.points ? 
          correction.points.reduce((sum: number, p: number) => sum + (typeof p === 'number' ? p : parseFloat(String(p))), 0) : 
          20; // Fallback à 20 si aucun point n'est défini
        
        const scorePercentage = maxPoints > 0 ? (grade / maxPoints) * 100 : 0;
        
        return {
          ...correction,
          grade: grade,
          max_points: maxPoints,
          score_percentage: scorePercentage
        };
      });
      
      // Trier par date de soumission décroissante
      const sortedCorrections = enrichedCorrections.sort((a: Correction, b: Correction) => 
        new Date(b.submission_date).getTime() - new Date(a.submission_date).getTime()
      );
      
      setCorrections(sortedCorrections);

      // Récupérer les statistiques de l'étudiant
      const statsResponse = await fetch(`/api/studentsPublic/${studentId}/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!statsResponse.ok) {
        // On ne bloque pas le chargement pour les stats, on continue
        console.warn('Impossible de charger les statistiques de l\'étudiant');
      } else {
        const statsData = await statsResponse.json();

        // Calculer la tendance des notes
        if (statsData.recent_corrections && statsData.recent_corrections.length >= 2) {
          const sortedCorrections = [...statsData.recent_corrections].sort(
            (a, b) => new Date(b.submission_date).getTime() - new Date(a.submission_date).getTime()
          );
          
          if (sortedCorrections.length >= 2) {
            const latestGrade = sortedCorrections[0].grade;
            const previousGrade = sortedCorrections[1].grade;
            
            if (latestGrade > previousGrade) {
              statsData.grade_trend = 'up';
            } else if (latestGrade < previousGrade) {
              statsData.grade_trend = 'down';
            } else {
              statsData.grade_trend = 'stable';
            }
          }
        }
        
        setStats(statsData);
      }
      
      // Générer l'URL de partage
      const baseUrl = window.location.origin;
      setShareUrl(`${baseUrl}/shared/students/${studentId}/corrections`);
    } catch (err) {
      console.error('Erreur:', err);
      if (err instanceof Error) {
        setError(err.message || 'Une erreur est survenue lors du chargement des données');
      } else {
        setError('Une erreur est survenue lors du chargement des données');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Fonction pour formater la date
  const formatDate2 = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

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

  // Fonction pour obtenir la couleur selon la note
  const getGradeColor = (percentage: number) => {
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'info';
    if (percentage >= 50) return 'primary';
    if (percentage >= 40) return 'warning';
    return 'error';
  };

  // Si l'utilisateur n'est pas authentifié, afficher le formulaire de connexion
  if (!isAuthenticated) {
    return (
      <Container maxWidth="sm" className="py-16">
        <Paper
          elevation={4}
          sx={{
            p: 4,
            borderRadius: 2,
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          
          <GradientBackground variant="primary" sx={{ position: 'absolute', inset: 0, zIndex: 0 }} >
          <PatternBackground pattern="dots" opacity={0.1} sx={{ position: 'absolute', inset: 0, zIndex: 0 }} >
          
          <Box position="relative" zIndex={1}>
            <Box 
              sx={{ 
                width: 70,
                height: 70,
                borderRadius: '50%',
                backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}
            >
              <LockIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            </Box>
            
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Accès protégé
            </Typography>
            
            <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 4 }}>
              Veuillez entrer le mot de passe pour accéder aux corrections de cet étudiant.
            </Typography>
            
            {authError && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {authError}
              </Alert>
            )}
            
            <form onSubmit={handlePasswordVerification}>
              <TextField
                fullWidth
                type="password"
                label="Mot de passe"
                variant="outlined"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                  startAdornment: <KeyIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
                sx={{ mb: 3 }}
                required
                autoFocus
              />
              
              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={authLoading}
                startIcon={authLoading ? <CircularProgress size={20} color="inherit" /> : null}
              >
                {authLoading ? 'Vérification...' : 'Accéder aux corrections'}
              </Button>
            </form>
            
            <Button
              variant="text"
              size="small"
              component={Link}
              href="/students"
              sx={{ mt: 3 }}
            >
              Retour à la liste des étudiants
            </Button>
          </Box>
          </PatternBackground>
        </GradientBackground>
        </Paper>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', maxWidth: '400px', mx: 'auto', mt: 8 }}>
          <LoadingSpinner size="lg" text="Chargement des corrections" />
        </Box>
      </Container>
    );
  }

  if (error || !student) {
    return (
      <Container maxWidth="lg" className="py-8">
        <div className="container mx-auto px-4 py-2 flex justify-center">
          <div className="w-full max-w-4xl animate-slide-in">
            <Paper className="p-6 overflow-hidden relative" elevation={3}>
              <ErrorDisplay 
                error={error || "Étudiant non trouvé"} 
                errorDetails={errorDetails}
                onRefresh={() => window.location.reload()}
                withRefreshButton={true}
              />
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                <Button 
                  variant="contained" 
                  component={Link} 
                  href="/students"
                  startIcon={<PersonIcon />}
                >
                  Retour à la liste des étudiants
                </Button>
              </Box>
            </Paper>
          </div>
        </div>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" className="py-8">
      {/* Header avec info étudiant */}
      <Paper 
        elevation={3} 
        sx={{ 
          borderRadius: 3,
          overflow: 'hidden',
          mb: 4
        }}
      >
        <GradientBackground variant="primary" sx={{ p: 0 }}>
          <PatternBackground 
            pattern="dots" 
            opacity={0.05} 
            color="black" 
            size={100}
            sx={{ p: 4, borderRadius: 2 }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
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
                <PersonIcon sx={{ fontSize: 50, color: (theme) => theme.palette.text.primary }} />
              </Box>
              
                <Box>
                  <Typography variant="h4" fontWeight={700} color="text.primary">
                    {student.first_name} {student.last_name?.charAt(0)?.toUpperCase()}.
                  </Typography>
                  
                  {/* Afficher toutes les classes de l'étudiant sans distinction */}
                  {student.allClasses && student.allClasses.length > 0 ? (
                    <Box sx={{ mt: 0.5 }}>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {student.allClasses.map((cls, index) => (
                          <Chip 
                            key={index}
                            size="small"
                            label={
                              <Typography variant="subtitle1" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <SchoolIcon fontSize="small" />
                                {cls.className} {cls.sub_class ? `Groupe ${cls.sub_class}` : ''}
                              </Typography>
                              
                              
                              }
                            sx={{ 
                              backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.1),
                              color: 'primary.main',
                              fontSize: '0.8rem'
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                  ) : (
                    <Typography variant="subtitle1" color="text.secondary" sx={{ opacity: 0.9, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <SchoolIcon fontSize="small" />
                      Non assigné à une classe
                    </Typography>
                  )}
                </Box>
              </Box>

            </Box>
          </PatternBackground>
        </GradientBackground>
        
        {/* Statistiques de l'étudiant */}
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
                <Typography variant="h3" fontWeight="bold" color="text.primary">
                  {stats?.total_corrections || 0}
                </Typography>
                <Typography variant="overline" color="text.secondary">
                  corrections
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
                position: 'relative',
              }}>
                {stats?.grade_trend && (
                  <Box sx={{ 
                    position: 'absolute', 
                    top: 10, 
                    right: 10,
                    color: stats.grade_trend === 'up' ? 'success.main' : 
                           stats.grade_trend === 'down' ? 'error.main' : 
                           'text.secondary'
                  }}>
                    {stats.grade_trend === 'up' && <TrendingUpIcon color="success" />}
                    {stats.grade_trend === 'down' && <TrendingDownIcon color="error" />}
                    {stats.grade_trend === 'stable' && <EqualizerIcon color="inherit" />}
                  </Box>
                )}
                <Typography variant="overline" color="text.secondary">Moyenne</Typography>
                <Typography variant="h3" fontWeight="bold" color="text.primary">
                    {stats?.average_grade !== null && stats?.average_grade !== undefined
                    ? (typeof stats.average_grade === 'number'
                      ? stats.average_grade.toFixed(1)
                      : !isNaN(Number(stats.average_grade))
                        ? Number(stats.average_grade).toFixed(1)
                        : '-')
                    : '-'}
                </Typography>
                <Typography variant="overline" color="text.secondary">
                  sur 20
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
                <Typography variant="overline" color="text.secondary">Meilleure note</Typography>
                <Typography variant="h3" fontWeight="bold" color="text.primary">
                    {stats?.highest_grade !== null && stats?.highest_grade !== undefined
                    ? (typeof stats.highest_grade === 'number'
                      ? stats.highest_grade.toFixed(1)
                      : !isNaN(Number(stats.highest_grade))
                        ? Number(stats.highest_grade).toFixed(1)
                        : '-')
                    : '-'}
                </Typography>
                <Typography variant="overline" color="text.secondary">
                  sur 20
                </Typography>
              </Paper>
            </Grid>
            
          </Grid>
        </Box>
      </Paper>
      
      {/* Liste des corrections */}
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
        <AssignmentIcon color="primary" />
        Corrections ({corrections.length})
      </Typography>
      
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
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {corrections.map((correction) => (
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
                  <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography variant="h6" fontWeight="bold" noWrap sx={{ flex: 1 }}>
                      {correction.activity_name}
                    </Typography>
                    {correction.status && ['NON_RENDU', 'ABSENT', 'NON_NOTE', 'DEACTIVATED'].includes(correction.status) && (
                      <Chip
                        size="small"
                        label={correction.status === 'NON_RENDU' ? 'Non rendu' : 
                               correction.status === 'ABSENT' ? 'Absent' : 
                               correction.status === 'NON_NOTE' ? 'Non noté' : 
                               correction.status === 'DEACTIVATED' ? 'Désactivé' : ''}
                        color={correction.status === 'NON_RENDU' ? 'error' : 
                               correction.status === 'ABSENT' ? 'warning' : 
                               correction.status === 'NON_NOTE' ? 'info' : 
                               correction.status === 'DEACTIVATED' ? 'default' : 'default'}
                        sx={{ fontSize: '1.7rem', ml: 1, py:3 }}
                      />
                    )}
                  </Box>
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
                  {correction.updated_at && (
                    <Typography 
                      variant="overline" 
                      color="text.secondary"
                      sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: .2 }}
                    >
                      <CalendarTodayIcon fontSize="small" color="success" />
                      Mise à jour : {formatDate2(correction.updated_at)}
                    </Typography>
                  )}
                  <Typography variant="overline" fontWeight={'bold'} gutterBottom>
                    Répartition des point
                  </Typography>
                  
                  <Grid container spacing={1} sx={{ mb: .2 }} direction={'column'}>
                    {correction.parts_names?.map((partName, index) => (
                        <Grid size={{ xs: 12 }} key={index}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {index === 0 ? (
                                <ScienceIcon color="primary" fontSize="small" />
                              ) : (
                                <MenuBookIcon color="secondary" fontSize="small" />
                              )}
                              <Typography variant="overline" fontWeight="medium">
                              {partName} : {String(correction.points_earned?.[index] || 0).replace('.', ',')} / {correction.points?.[index] || 0} pts
                              </Typography>
                            </Box>
                            {correction.status && (
                              <Chip
                                size="small"
                                label={correction.status === 'NON_RENDU' ? 'Non rendu' : 
                                       correction.status === 'ABSENT' ? 'Absent' : 
                                       correction.status === 'NON_NOTE' ? 'Non noté' : 
                                       correction.status === 'DEACTIVATED' ? 'Désactivé' : ''}
                                color={correction.status === 'NON_RENDU' ? 'error' : 
                                       correction.status === 'ABSENT' ? 'warning' : 
                                       correction.status === 'NON_NOTE' ? 'info' : 
                                       correction.status === 'DEACTIVATED' ? 'default' : 'default'}
                                sx={{ 
                                  display: ['NON_RENDU', 'ABSENT', 'NON_NOTE', 'DEACTIVATED'].includes(correction.status) ? 'flex' : 'none',
                                  fontSize: '0.65rem'
                                }}
                              />
                            )}
                          </Box>
                        </Grid>
                    ))}
                  </Grid>
                  
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="text.secondary" gutterBottom>
                      Pourcentage de réussite
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={correction.score_percentage ?? 0} 
                      color={getGradeColor(correction.score_percentage ?? 0) as "primary" | "secondary" | "error" | "info" | "success" | "warning" | undefined}
                      sx={{ height: 10, borderRadius: 5 }}
                    />
                    <Typography variant="caption" sx={{ display: 'block', textAlign: 'right', mt: 0.5 }}>
                      {(correction.score_percentage ?? 0).toFixed(1)}%
                    </Typography>
                  </Box>
                </CardContent>
                
                <Divider />
                
                <CardActions>
                  {loadingShareCodes.get(correction.id) ? (
                    <Button 
                      size="small" 
                      startIcon={<LoadingSpinner size="sm" />}
                      disabled
                      sx={{ flexGrow: 1 }}
                    >
                      Chargement...
                    </Button>
                  ) : shareCodeErrors.get(correction.id) ? (
                    <Tooltip title={`Impossible de récupérer le lien de partage : ${shareCodeErrors.get(correction.id)}`}>
                      <Button 
                        size="small" 
                        startIcon={<AssignmentIcon />}
                        disabled
                        sx={{ flexGrow: 1 }}
                      >
                        Feedback indisponible
                      </Button>
                    </Tooltip>
                  ) : (
                    <Button 
                      size="small" 
                      startIcon={<AssignmentIcon />}
                      onClick={() => handleOpenFeedback(correction.id)}
                      sx={{ flexGrow: 1 }}
                    >
                      Voir Feedback
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      

      
      
      {/* Display edit errors if necessary */}
      {editError && (
        <Box sx={{ p: 2 }}>
          <Alert severity="error">{editError}</Alert>
        </Box>
      )}
    </Container>
  );
}
