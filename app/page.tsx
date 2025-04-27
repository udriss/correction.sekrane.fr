'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Button, 
  Typography, 
  Container, 
  Box, 
  Card,
  CardContent,
  Divider,
  Paper,
  useTheme,
  CircularProgress,
  alpha
} from '@mui/material';
import Grid from '@mui/material/Grid';
import AssignmentTurnedIn from '@mui/icons-material/AssignmentTurnedIn';
import Share from '@mui/icons-material/Share';
import BarChart from '@mui/icons-material/BarChart';
import ArrowForward from '@mui/icons-material/ArrowForward';
import Groups from '@mui/icons-material/Groups';
import Analytics from '@mui/icons-material/Analytics';
import Speed from '@mui/icons-material/Speed';
import AutoGraph from '@mui/icons-material/AutoGraph';
import PersonSearch from '@mui/icons-material/PersonSearch';
import Equalizer from '@mui/icons-material/Equalizer';
import CloudDownload from '@mui/icons-material/CloudDownload';
import Devices from '@mui/icons-material/Devices';
import DataSaverOn from '@mui/icons-material/DataSaverOn';
import PieChart from '@mui/icons-material/PieChart';
import School from '@mui/icons-material/School';
import CategoryIcon from '@mui/icons-material/Category';
import MergeTypeIcon from '@mui/icons-material/MergeType';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InsightsIcon from '@mui/icons-material/Insights';
import TimelineIcon from '@mui/icons-material/Timeline';

// Composant côté client pour empêcher les erreurs de pré-rendu
const ClientSideLandingPage = () => {
  const theme = useTheme();
  const [isLoaded, setIsLoaded] = useState(false);
  
  // S'assurer que le composant est chargé uniquement côté client
  useEffect(() => {
    setIsLoaded(true);
  }, []);
  
  if (!isLoaded) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // Valeurs par défaut sécurisées pour les propriétés du thème qui pourraient être undefined
  const myBoxesPrimary = theme.palette.myBoxes?.primary;
  const myBoxesSecondary = theme.palette.myBoxes?.secondary;
  
  return (
    <Container className="min-h-screen" sx={{ bgcolor: 'background.default' }}>
      {/* Hero Section */}
      <Box 
        sx={{ 
          background: `linear-gradient(to right, ${theme.palette.common.black}, ${theme.palette.primary.dark})`,
          color: 'text.primary',
          py: { xs: 8, md: 12 },
          clipPath: {
            xs: 'none',
            md: 'polygon(0 0, 100% 0, 100% 85%, 0 100%)'
          }
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid size={{ xs: 12, md: 8 }}>
              <Typography 
                variant="h3" 
                component="h1" 
                className="text-4xl md:text-5xl font-extrabold mb-4"
                sx={{ color: 'common.white' }}
              >
                Plateforme complète d'évaluation pédagogique
              </Typography>
              <Typography variant="h6" className="mb-8" sx={{ color: 'primary.light' }}>
                Ajoutez, gérez et analysez vos corrections avec un système complet d'évaluation basé sur des points expérimentaux et théoriques
              </Typography>
              <Box className="flex mt-4 flex-wrap gap-4">
              <Button 
                variant="outlined" 
                color="secondary"
                size="large" 
                component={Link}
                href="/demo"
                endIcon={<ArrowForward />}
                className="text-lg py-3 px-6"
                sx={{ 
                  fontWeight: 'bold',
                  borderColor: theme => theme.palette.secondary.dark,
                  color: theme => theme.palette.primary.main,
                  borderWidth: 2,
                  '&:hover': {
                    borderColor: theme => theme.palette.secondary.main,
                    color: theme => theme.palette.secondary.light,
                    borderWidth: 2,
                    boxShadow: 2,
                    transform: 'translateY(-2px)',
                    transition: 'all 0.2s',
                  }
                }}
              >
                Essayer en mode démo
              </Button>
              <Button 
                variant="outlined" 
                color="primary" 
                size="large" 
                component={Link}
                href="/activities/new"
                className="text-lg border-2"
                sx={{ 
                  fontWeight: 'bold',
                  borderColor: theme => theme.palette.primary.dark,
                  color: theme => theme.palette.primary.main,
                  '&:hover': {
                    borderColor: theme => theme.palette.primary.main,
                    color: theme => theme.palette.primary.light,
                    boxShadow: 2,
                    transform: 'translateY(-2px)',
                    transition: 'all 0.2s',
                  }
                }}
              >
                Nouvelle activité
              </Button>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }} className="flex justify-center">
              <Box className="relative w-full max-w-sm h-64 md:h-60">
                <div className="w-full h-full bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                  <div className="relative">
                    <School sx={{ fontSize: 100, opacity: 0.9 }} />
                    <div className="absolute -bottom-2 -right-2 bg-blue-500 rounded-full p-2">
                      <Groups sx={{ fontSize: 40, opacity: 0.9 }} />
                    </div>
                  </div>
                </div>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Key Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box className="text-center mb-12 flex flex-col items-center justify-center">
          <Typography variant="h3" component="h2" className="font-bold mb-3" sx={{ color: 'text.primary' }}>
            Une plateforme complète d'évaluation
          </Typography>
          <Typography variant="h6" sx={{ color: 'text.secondary', mx: 'auto', maxWidth: '3xl' }}>
            Optimisez votre processus d'évaluation avec un système complet d'analyse de performance
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {/* Feature 1 - Système de points dual */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card className="h-full hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <Box className="flex justify-center mb-4">
                  <AssignmentTurnedIn fontSize="large" sx={{ color: 'primary.main' }} />
                </Box>
                <Typography variant="h5" className="font-bold mb-2 text-center" sx={{ color: 'text.primary' }}>
                  Système de points dual
                </Typography>
                <Typography variant="body1" color="text.secondary" className="text-center">
                  Évaluez avec précision grâce à la distinction entre points expérimentaux et théoriques
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Feature 2 - Bibliothèque de fragments */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card className="h-full hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <Box className="flex justify-center mb-4">
                  <CategoryIcon fontSize="large" sx={{ color: 'success.main' }} />
                </Box>
                <Typography variant="h5" className="font-bold mb-2 text-center" sx={{ color: 'text.primary' }}>
                  Bibliothèque de fragments
                </Typography>
                <Typography variant="body1" color="text.secondary" className="text-center">
                Ajoutez et réutilisez des commentaires organisés par catégories pour gagner du temps
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Feature 3 - Analyse statistique */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card className="h-full hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <Box className="flex justify-center mb-4">
                  <Analytics fontSize="large" sx={{ color: 'secondary.main' }} />
                </Box>
                <Typography variant="h5" className="font-bold mb-2 text-center" sx={{ color: 'text.primary' }}>
                  Analyse statistique
                </Typography>
                <Typography variant="body1" color="text.secondary" className="text-center">
                  Obtenez des insights précis sur les performances individuelles et de groupe
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* Student and Class Management */}
      <Box sx={{ py: 8, bgcolor: 'background.paper' }}>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ p: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2, color: 'text.primary' }}>
                  Gestion complète des étudiants et des classes
                </Typography>
                <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary' }}>
                  Structurez vos groupes d'élèves et obtenez des analyses détaillées de leurs performances.
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Paper elevation={0} sx={{ p: 2, display: 'flex', alignItems: 'center', bgcolor: myBoxesSecondary, opacity: 0.8 }}>
                    <PeopleAltIcon sx={{ color: 'primary.dark', mr: 2 }} />
                    <Typography sx={{ color: 'text.primary' }}>Organisation des étudiants par classe et sous-groupes</Typography>
                  </Paper>
                  
                  <Paper elevation={0} sx={{ p: 2, display: 'flex', alignItems: 'center', bgcolor: myBoxesSecondary, opacity: 0.8 }}>
                    <AccountTreeIcon sx={{ color: 'primary.dark', mr: 2 }} />
                    <Typography sx={{ color: 'text.primary' }}>Association des activités à des classes spécifiques</Typography>
                  </Paper>
                  
                  <Paper elevation={0} sx={{ p: 2, display: 'flex', alignItems: 'center', bgcolor: myBoxesSecondary, opacity: 0.8 }}>
                    <TimelineIcon sx={{ color: 'primary.dark', mr: 2 }} />
                    <Typography sx={{ color: 'text.primary' }}>Statistiques détaillées sur les performances des classes</Typography>
                  </Paper>
                  
                  <Paper elevation={0} sx={{ p: 2, display: 'flex', alignItems: 'center', bgcolor: myBoxesSecondary, opacity: 0.8 }}>
                    <InsightsIcon sx={{ color: 'primary.dark', mr: 2 }} />
                    <Typography sx={{ color: 'text.primary' }}>Suivi de progression individuelle des étudiants</Typography>
                  </Paper>
                </Box>
              </Box>
            </Grid>
            
            <Grid size={{ xs: 12, md: 6 }}>
              <Box 
                sx={{ 
                  position: 'relative', 
                  height: {xs: '300px', md: '400px'}, 
                  background: `linear-gradient(135deg, ${myBoxesPrimary} 0%, ${myBoxesSecondary} 100%)`,
                  borderRadius: 2,
                  boxShadow: 4,
                  overflow: 'hidden'
                }}
              >
                <Groups 
                  sx={{ 
                    position: 'absolute', 
                    top: '50%', 
                    left: '50%', 
                    transform: 'translate(-50%, -50%)', 
                    fontSize: 180, 
                    color: theme => theme.palette.primary.main, 
                    opacity: 0.2 
                  }} 
                />
                <Box sx={{ position: 'relative', zIndex: 1, p: 4, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h5" sx={{ color: theme => theme.palette.text.primary, fontWeight: 'bold' }}>
                      Structure hiérarchique
                    </Typography>
                    <Typography sx={{ color: 'primary.light', mt: 2 }}>
                      Classes → Sous-groupes → Étudiants
                    </Typography>
                  </Box>
                  
                  <Box sx={{ bgcolor: myBoxesPrimary, p: 3, borderRadius: 2, backdropFilter: 'blur(4px)' }}>
                    <Typography sx={{ color: theme => theme.palette.text.primary }}>
                      "Une organisation claire et flexible qui s'adapte à tous les contextes d'enseignement"
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Extended Features Grid */}
      <Box sx={{ py: 8, bgcolor: 'background.default' }}>
        <Container maxWidth="lg">
          <Typography variant="h4" component="h3" sx={{ textAlign: 'center', fontWeight: 'bold', mb: 6, color: 'text.primary' }}>
            Caractéristiques principales
          </Typography>

          <Grid container spacing={5}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }} sx={{ mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                <MergeTypeIcon sx={{ color: 'primary.main', mr: 2, mt: 0.5 }} fontSize="medium" />
                <div>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: 'text.primary' }}>
                    Corrections avec fragments
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                  Ajoutez des retours détaillés en utilisant des fragments réutilisables classés par catégories
                  </Typography>
                </div>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4 }} sx={{ mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                <AutoGraph sx={{ color: 'secondary.main', mr: 2, mt: 0.5 }} fontSize="medium" />
                <div>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: 'text.primary' }}>
                    Statistiques comparatives
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Comparez les résultats entre différents groupes avec ventilation par critères d'évaluation
                  </Typography>
                </div>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4 }} sx={{ mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                <Share sx={{ color: 'success.main', mr: 2, mt: 0.5 }} fontSize="medium" />
                <div>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: 'text.primary' }}>
                    Partage sécurisé
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Générez des liens uniques pour partager les corrections avec les étudiants
                  </Typography>
                </div>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4 }} sx={{ mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                <PersonSearch sx={{ color: 'warning.main', mr: 2, mt: 0.5 }} fontSize="medium" />
                <div>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: 'text.primary' }}>
                    Recherche avancée
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Retrouvez rapidement des étudiants, activités, classes ou fragments avec la fonction de recherche
                  </Typography>
                </div>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4 }} sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                <DataSaverOn sx={{ color: 'secondary.dark', mr: 2, mt: 0.5 }} fontSize="medium" />
                <div>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: 'text.primary' }}>
                    Analyses détaillées
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Visualisez les points forts et faibles des étudiants avec séparation des critères
                  </Typography>
                </div>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4 }} sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                <Devices sx={{ color: 'info.main', mr: 2, mt: 0.5 }} fontSize="medium" />
                <div>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: 'text.primary' }}>
                    Interface adaptative
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Travaillez efficacement sur tous les appareils grâce à une conception responsive
                  </Typography>
                </div>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Fragments System Feature Focus */}
      <Box sx={{ py: 8, bgcolor: 'background.paper' }}>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid size={{ xs: 12, md: 5 }}>
              <Box sx={{ 
                position: 'relative', 
                borderRadius: 2, 
                overflow: 'hidden', 
                boxShadow: 4, 
                height: '400px'
              }}>
                <Box sx={{ 
                  background: `linear-gradient(to bottom right, ${alpha(theme.palette.secondary.light,0.3)}, ${alpha(theme.palette.primary.light,0.3)})`,
                  p: 4,
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <CategoryIcon
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      opacity: 0.2,
                      color: theme => theme.palette.primary.light,
                    }}
                  />
                  <Box sx={{ position: 'relative', textAlign: 'center' }}>
                    <FormatQuoteIcon sx={{ fontSize: 80, color: theme.palette.primary.dark, opacity: 0.9 }} />
                    <Typography variant="h5" sx={{ color: theme.palette.text.primary, mt: 2, fontWeight: 'bold' }}>
                      Bibliothèque de fragments intelligente
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 7 }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2, color: theme.palette.text.primary }}>
                Système de fragments catégorisés
              </Typography>
              <Typography variant="body1" sx={{ mb: 3, color: theme.palette.text.secondary }}>
                Optimisez votre flux de travail avec notre système unique de fragments :
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                  <CheckCircleIcon sx={{ color: 'success.main', mr: 2, mt: 0.5 }} />
                  <Typography variant="body1" color="text.primary">
                    <strong>Fragments réutilisables</strong> - Ajoutez une bibliothèque de commentaires que vous pouvez utiliser dans toutes vos corrections
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                  <CheckCircleIcon sx={{ color: 'success.main', mr: 2, mt: 0.5 }} />
                  <Typography variant="body1" color="text.primary">
                    <strong>Organisation par catégories</strong> - Classez vos fragments pour un accès rapide et efficace
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                  <CheckCircleIcon sx={{ color: 'success.main', mr: 2, mt: 0.5 }} />
                  <Typography variant="body1" color="text.primary">
                    <strong>Association à des activités</strong> - Ajoutez des fragments spécifiques pour certains types d'activités
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                  <CheckCircleIcon sx={{ color: 'success.main', mr: 2, mt: 0.5 }} />
                  <Typography variant="body1" color="text.primary">
                    <strong>Recherche intelligente</strong> - Retrouvez rapidement les fragments dont vous avez besoin grâce à notre moteur de recherche
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                  <CheckCircleIcon sx={{ color: 'success.main', mr: 2, mt: 0.5 }} />
                  <Typography variant="body1" color="text.primary">
                    <strong>Système d'étiquettes</strong> - Ajoutez des tags à vos fragments pour une organisation encore plus flexible
                  </Typography>
                </Box>
              </Box>

              <Button 
                variant="outlined" 
                color="primary" 
                size="large" 
                component={Link}
                href="/fragments"
                sx={{ mt: 4 }}
              >
                Explorer les fragments
              </Button>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Analysis Feature Section */}
      <Box sx={{ py: 8, bgcolor: 'background.default' }}>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid size={{ xs: 12, md: 7 }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2, color: 'text.primary' }}>
                Analyses statistiques avancées
              </Typography> 
              <Typography variant="body1" sx={{ mt: 2, mb: 3, color: 'text.secondary' }}>
                Obtenez des insights précieux sur les performances avec nos outils d'analyse :
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                  <PieChart sx={{ color: 'info.main', mr: 2, mt: 0.5 }} />
                  <Typography variant="body1" color="text.primary">
                    <strong>Statistiques individuelles</strong> - Suivez la progression de chaque étudiant avec des métriques détaillées
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                  <BarChart sx={{ color: 'info.main', mr: 2, mt: 0.5 }} />
                  <Typography variant="body1" color="text.primary">
                    <strong>Analyses de groupe</strong> - Comparez les performances entre différentes classes et sous-groupes
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                  <Speed sx={{ color: 'info.main', mr: 2, mt: 0.5 }} />
                  <Typography variant="body1" color="text.primary">
                    <strong>Ventilation des points</strong> - Distinguez les performances sur les aspects expérimentaux et théoriques
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                  <Equalizer sx={{ color: 'info.main', mr: 2, mt: 0.5 }} />
                  <Typography variant="body1" color="text.primary">
                    <strong>Évaluation des tendances</strong> - Identifiez les points forts et les axes d'amélioration
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <Box sx={{ 
                position: 'relative', 
                borderRadius: 2, 
                overflow: 'hidden', 
                boxShadow: 4
              }}>
                <Box sx={{ 
                  background: `linear-gradient(to bottom right, ${alpha(theme.palette.primary.light,0.3)}, ${alpha(theme.palette.secondary.light,0.3)})`,
                  p: 4,
                  height: '320px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <BarChart
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      opacity: 0.2,
                      color: theme => theme.palette.primary.light,
                    }}
                  />
                  <Box sx={{ position: 'relative', textAlign: 'center' }}>
                    <Analytics sx={{ fontSize: 100, color: theme => theme.palette.primary.dark, opacity: 0.9 }} />
                    <Typography variant="h5" sx={{ color: theme => theme.palette.text.primary, mt: 2, fontWeight: 'bold' }}>
                      Visualisation des performances
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Call to Action */}
      <Box sx={{ 
        py: 8, 
        bgcolor: myBoxesSecondary, 
        color: theme => theme.palette.text.primary
      }}>
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2, color: theme => theme.palette.text.primary }}>
            Commencez dès aujourd'hui
          </Typography>
          <Typography variant="body1" sx={{ mb: 5, color: theme => theme.palette.text.primary }}>
            Rejoignez les enseignants qui optimisent leur processus d'évaluation et fournissent des retours de qualité à leurs étudiants.
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 2 }}>
            <Button 
              variant="outlined" 
              color="success" 
              size="large" 
              component={Link}
              href="/activities"
              sx={{ fontSize: '1.1rem', fontWeight: 500 }}
            >
              Commencer maintenant
            </Button>
            <Button 
              variant="outlined" 
              size="large" 
              color="primary"
              component={Link}
              href="/demo"
              sx={{ 
                fontSize: '1.1rem', 
                fontWeight: 500, 
                color: theme => theme.palette.primary.dark, 
                borderColor: theme => theme.palette.primary.light,
                '&:hover': {
                  borderColor: theme => theme.palette.primary.light,
                }
              }}
            >
              Voir des exemples
            </Button>
          </Box>
        </Container>
      </Box>
    </Container>
  );
};

// Export le composant côté client uniquement
export default function LandingPage() {
  return <ClientSideLandingPage />;
}
