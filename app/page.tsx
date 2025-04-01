'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Button, 
  Typography, 
  Container, 
  Box, 
  Card,
  CardContent,
  Divider,
  Paper
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

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50">
      {/* Hero Section */}
      <Box 
        className="bg-gradient-to-r from-black to-indigo-700 text-white py-16 md:py-24"
        sx={{ 
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
              >
                Plateforme complète d'évaluation pédagogique
              </Typography>
              <Typography variant="h6" className="mb-8 text-blue-100">
                Créez, gérez et analysez vos corrections avec un système complet d'évaluation basé sur des points expérimentaux et théoriques
              </Typography>
              <Box className="flex mt-4 flex-wrap gap-4">
              <Button 
                variant="outlined" 
                size="large" 
                component={Link}
                href="/demo"
                endIcon={<ArrowForward />}
                className="text-lg py-3 px-6"
                sx={{ 
                  fontWeight: 'bold',
                  color: 'secondary.light', 
                  borderColor: 'secondary.light', 
                  '&:hover': {
                    borderColor: 'secondary.main', 
                    color: 'secondary.main',
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
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  '&:hover': {
                    borderColor: 'primary.dark',
                    color: 'primary.dark',
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
      <Container maxWidth="lg" className="py-16">
        <Box className="text-center mb-12 flex flex-col items-center justify-center">
          <Typography variant="h3" component="h2" className="font-bold mb-3 text-gray-800">
            Une plateforme complète d'évaluation
          </Typography>
          <Typography variant="h6" className="text-gray-600 mx-auto max-w-3xl">
            Optimisez votre processus d'évaluation avec un système complet d'analyse de performance
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {/* Feature 1 - Système de points dual */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card className="h-full hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <Box className="flex justify-center mb-4">
                  <AssignmentTurnedIn fontSize="large" className="text-blue-600" />
                </Box>
                <Typography variant="h5" className="font-bold mb-2 text-center">
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
                  <CategoryIcon fontSize="large" className="text-green-600" />
                </Box>
                <Typography variant="h5" className="font-bold mb-2 text-center">
                  Bibliothèque de fragments
                </Typography>
                <Typography variant="body1" color="text.secondary" className="text-center">
                  Créez et réutilisez des commentaires organisés par catégories pour gagner du temps
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Feature 3 - Analyse statistique */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card className="h-full hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <Box className="flex justify-center mb-4">
                  <Analytics fontSize="large" className="text-purple-600" />
                </Box>
                <Typography variant="h5" className="font-bold mb-2 text-center">
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
      <Box className="py-16 bg-white">
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <Box className="p-3">
                <Typography variant="h4" className="font-bold mb-4 text-gray-800">
                  Gestion complète des étudiants et des classes
                </Typography>
                <Typography variant="body1" className="mb-6 text-gray-600">
                  Structurez vos groupes d'élèves et obtenez des analyses détaillées de leurs performances.
                </Typography>
                
                <Box className="space-y-3">
                  <Paper elevation={0} className="p-3 flex items-center bg-blue-50">
                    <PeopleAltIcon className="text-blue-600 mr-3" />
                    <Typography>Organisation des étudiants par classe et sous-groupes</Typography>
                  </Paper>
                  
                  <Paper elevation={0} className="p-3 flex items-center bg-blue-50">
                    <AccountTreeIcon className="text-blue-600 mr-3" />
                    <Typography>Association des activités à des classes spécifiques</Typography>
                  </Paper>
                  
                  <Paper elevation={0} className="p-3 flex items-center bg-blue-50">
                    <TimelineIcon className="text-blue-600 mr-3" />
                    <Typography>Statistiques détaillées sur les performances des classes</Typography>
                  </Paper>
                  
                  <Paper elevation={0} className="p-3 flex items-center bg-blue-50">
                    <InsightsIcon className="text-blue-600 mr-3" />
                    <Typography>Suivi de progression individuelle des étudiants</Typography>
                  </Paper>
                </Box>
              </Box>
            </Grid>
            
            <Grid size={{ xs: 12, md: 6 }}>
              <Box 
                className="rounded-lg shadow-xl overflow-hidden"
                sx={{ 
                  position: 'relative', 
                  height: {xs: '300px', md: '400px'}, 
                  background: 'linear-gradient(135deg, #2a4365 0%, #4299e1 100%)' 
                }}
              >
                <Groups 
                  sx={{ 
                    position: 'absolute', 
                    top: '50%', 
                    left: '50%', 
                    transform: 'translate(-50%, -50%)', 
                    fontSize: 180, 
                    color: 'white', 
                    opacity: 0.2 
                  }} 
                />
                <Box sx={{ position: 'relative', zIndex: 1, p: 4, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h5" className="text-white font-bold">
                      Structure hiérarchique
                    </Typography>
                    <Typography className="text-blue-100 mt-2">
                      Classes → Sous-groupes → Étudiants
                    </Typography>
                  </Box>
                  
                  <Box className="bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                    <Typography className="text-white">
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
      <Box className="py-16 bg-gray-50">
        <Container maxWidth="lg">
          <Typography variant="h4" component="h3" className="text-center font-bold mb-12">
            Caractéristiques principales
          </Typography>

          <Grid container spacing={5}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }} className="mb-1">
              <Box className="flex items-start">
                <MergeTypeIcon className="text-blue-600 mr-3 mt-1" fontSize="medium" />
                <div>
                  <Typography variant="h6" className="font-semibold mb-1">
                    Corrections avec fragments
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Créez des retours détaillés en utilisant des fragments réutilisables classés par catégories
                  </Typography>
                </div>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4 }} className="mb-1">
              <Box className="flex items-start">
                <AutoGraph className="text-indigo-600 mr-3 mt-1" fontSize="medium" />
                <div>
                  <Typography variant="h6" className="font-semibold mb-1">
                    Statistiques comparatives
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Comparez les résultats entre différents groupes avec ventilation par critères d'évaluation
                  </Typography>
                </div>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4 }} className="mb-1">
              <Box className="flex items-start">
                <Share className="text-green-600 mr-3 mt-1" fontSize="medium" />
                <div>
                  <Typography variant="h6" className="font-semibold mb-1">
                    Partage sécurisé
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Générez des liens uniques pour partager les corrections avec les étudiants
                  </Typography>
                </div>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4 }} className="mb-1">
              <Box className="flex items-start">
                <PersonSearch className="text-amber-600 mr-3 mt-1" fontSize="medium" />
                <div>
                  <Typography variant="h6" className="font-semibold mb-1">
                    Recherche avancée
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Retrouvez rapidement des étudiants, activités, classes ou fragments avec la fonction de recherche
                  </Typography>
                </div>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4 }} className="mb-6">
              <Box className="flex items-start">
                <DataSaverOn className="text-purple-600 mr-3 mt-1" fontSize="medium" />
                <div>
                  <Typography variant="h6" className="font-semibold mb-1">
                    Analyses détaillées
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Visualisez les points forts et faibles des étudiants avec séparation des critères
                  </Typography>
                </div>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4 }} className="mb-6">
              <Box className="flex items-start">
                <Devices className="text-cyan-600 mr-3 mt-1" fontSize="medium" />
                <div>
                  <Typography variant="h6" className="font-semibold mb-1">
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
      <Box className="py-16 bg-white">
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid size={{ xs: 12, md: 5 }}>
              <Box className="relative rounded-lg overflow-hidden shadow-xl" sx={{ height: '400px' }}>
                <div className="bg-gradient-to-br from-purple-500 to-indigo-700 p-8 h-full flex items-center justify-center">
                  <CategoryIcon
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      opacity: 0.2,
                      color:'white',
                    }}
                  />
                  <div className="relative text-center">
                    <FormatQuoteIcon sx={{ fontSize: 80, color: 'white', opacity: 0.9 }} />
                    <Typography variant="h5" className="text-white mt-4 font-bold">
                      Bibliothèque de fragments intelligente
                    </Typography>
                  </div>
                </div>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 7 }}>
              <Typography variant="h4" className="font-bold mb-4 text-gray-800">
                Système de fragments catégorisés
              </Typography>
              <Typography variant="body1" sx={{marginBottom: '10px'}} className="text-gray-600">
                Optimisez votre flux de travail avec notre système unique de fragments :
              </Typography>
              
              <Box className="space-y-4 mt-6">
                <Box className="flex items-start">
                  <CheckCircleIcon className="text-green-600 mr-3 mt-1" />
                  <Typography variant="body1">
                    <strong>Fragments réutilisables</strong> - Créez une bibliothèque de commentaires que vous pouvez utiliser dans toutes vos corrections
                  </Typography>
                </Box>
                <Box className="flex items-start">
                  <CheckCircleIcon className="text-green-600 mr-3 mt-1" />
                  <Typography variant="body1">
                    <strong>Organisation par catégories</strong> - Classez vos fragments pour un accès rapide et efficace
                  </Typography>
                </Box>
                <Box className="flex items-start">
                  <CheckCircleIcon className="text-green-600 mr-3 mt-1" />
                  <Typography variant="body1">
                    <strong>Association à des activités</strong> - Créez des fragments spécifiques pour certains types d'activités
                  </Typography>
                </Box>
                <Box className="flex items-start">
                  <CheckCircleIcon className="text-green-600 mr-3 mt-1" />
                  <Typography variant="body1">
                    <strong>Recherche intelligente</strong> - Retrouvez rapidement les fragments dont vous avez besoin grâce à notre moteur de recherche
                  </Typography>
                </Box>
                <Box className="flex items-start">
                  <CheckCircleIcon className="text-green-600 mr-3 mt-1" />
                  <Typography variant="body1">
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
                className="text-md font-medium"
              >
                Explorer les fragments
              </Button>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Analysis Feature Section */}
      <Box className="py-16 bg-gray-50">
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid size={{ xs: 12, md: 7 }}>
              <Typography variant="h4" className="font-bold mb-4 text-gray-800">
                Analyses statistiques avancées
              </Typography> 
              <Typography variant="body1" sx={{marginTop: '20px', marginBottom: '10px'}} className="text-gray-600">
                Obtenez des insights précieux sur les performances avec nos outils d'analyse :
              </Typography>
              
              <Box className="space-y-4">
                <Box className="flex items-start">
                  <PieChart className="text-blue-600 mr-3 mt-1" />
                  <Typography variant="body1">
                    <strong>Statistiques individuelles</strong> - Suivez la progression de chaque étudiant avec des métriques détaillées
                  </Typography>
                </Box>
                <Box className="flex items-start">
                  <BarChart className="text-blue-600 mr-3 mt-1" />
                  <Typography variant="body1">
                    <strong>Analyses de groupe</strong> - Comparez les performances entre différentes classes et sous-groupes
                  </Typography>
                </Box>
                <Box className="flex items-start">
                  <Speed className="text-blue-600 mr-3 mt-1" />
                  <Typography variant="body1">
                    <strong>Ventilation des points</strong> - Distinguez les performances sur les aspects expérimentaux et théoriques
                  </Typography>
                </Box>
                <Box className="flex items-start">
                  <Equalizer className="text-blue-600 mr-3 mt-1" />
                  <Typography variant="body1">
                    <strong>Évaluation des tendances</strong> - Identifiez les points forts et les axes d'amélioration
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <Box className="relative rounded-lg overflow-hidden shadow-xl">
                <div className="bg-gradient-to-br from-blue-500 to-cyan-700 p-8 h-80 flex items-center justify-center">
                  <BarChart
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      opacity: 0.2,
                      color:'white',
                    }}
                  />
                  <div className="relative text-center">
                    <Analytics sx={{ fontSize: 100, color: 'white', opacity: 0.9 }} />
                    <Typography variant="h5" className="text-white mt-4 font-bold">
                      Visualisation des performances
                    </Typography>
                  </div>
                </div>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Call to Action */}
      <Box className="py-16 text-white" style={{ backgroundColor: 'rgba(7, 31, 97, 1)' }}>
        <Container maxWidth="md" className="text-center">
          <Typography variant="h4" className="font-bold mb-4">
            Commencez dès aujourd'hui
          </Typography>
          <Typography variant="body1" sx={{ mb: 8 }}>
            Rejoignez les enseignants qui optimisent leur processus d'évaluation et fournissent des retours de qualité à leurs étudiants.
          </Typography>
          <Box className="flex flex-wrap justify-center gap-4">
            <Button 
              variant="contained" 
              color="secondary" 
              size="large" 
              component={Link}
              href="/activities"
              className="text-lg font-medium"
            >
              Commencer maintenant
            </Button>
            <Button 
              variant="contained" 
              color="primary"
              size="large" 
              component={Link}
              href="/demo"
              className="text-lg font-medium border-2"
            >
              Voir des exemples
            </Button>
          </Box>
        </Container>
      </Box>
    </div>
  );
}
