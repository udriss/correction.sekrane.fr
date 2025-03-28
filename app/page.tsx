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
  Divider
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
              Évaluez et analysez vos activités pédagogiques
              </Typography>
              <Typography variant="h6" className="mb-8 text-blue-100">
                Plateforme complète pour ajouter, gérer et partager des évaluations individuelles ou collectives
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
            Découvrez comment notre outil peut transformer votre façon d'évaluer et d'analyser les performances
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {/* Feature 1 - Corrections personnalisées */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card className="h-full hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <Box className="flex justify-center mb-4">
                  <AssignmentTurnedIn fontSize="large" className="text-blue-600" />
                </Box>
                <Typography variant="h5" className="font-bold mb-2 text-center">
                  Corrections personnalisées
                </Typography>
                <Typography variant="body1" color="text.secondary" className="text-center">
                  Évaluations structurées avec points expérimentaux et théoriques, commentaires détaillés et grilles adaptables
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Feature 2 - Gestion de groupes */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card className="h-full hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <Box className="flex justify-center mb-4">
                  <Groups fontSize="large" className="text-green-600" />
                </Box>
                <Typography variant="h5" className="font-bold mb-2 text-center">
                  Gestion de groupes
                </Typography>
                <Typography variant="body1" color="text.secondary" className="text-center">
                  Organisez vos corrections par groupes, classes ou thématiques avec annotations et statistiques collectives
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Feature 3 - Analyse des performances */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card className="h-full hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <Box className="flex justify-center mb-4">
                  <Analytics fontSize="large" className="text-purple-600" />
                </Box>
                <Typography variant="h5" className="font-bold mb-2 text-center">
                  Analyse des performances
                </Typography>
                <Typography variant="body1" color="text.secondary" className="text-center">
                  Visualisez les tendances individuelles et collectives avec graphiques interactifs et rapports détaillés
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* Extended Features Grid */}
      <Box className="py-16 bg-white">
        <Container maxWidth="lg">
          <Typography variant="h4" component="h3" className="text-center font-bold mb-12">
            Fonctionnalités avancées pour les enseignants
          </Typography>
          <Box sx={{ height: '40px' }} />

          <Grid container spacing={5}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }} className="mb-1">
              <Box className="flex items-start">
                <AutoGraph className="text-blue-600 mr-3 mt-1" fontSize="medium" />
                <div>
                  <Typography variant="h6" className="font-semibold mb-1">
                    Statistiques comparatives
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Comparez les résultats entre différents groupes, périodes ou critères d'évaluation
                  </Typography>
                </div>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4 }} className="mb-1">
              <Box className="flex items-start">
                <PersonSearch className="text-indigo-600 mr-3 mt-1" fontSize="medium" />
                <div>
                  <Typography variant="h6" className="font-semibold mb-1">
                    Suivi des progrès individuels
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Suivez l'évolution des performances de chaque élève à travers les différentes évaluations
                  </Typography>
                </div>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4 }} className="mb-1">
              <Box className="flex items-start">
                <Share className="text-green-600 mr-3 mt-1" fontSize="medium" />
                <div>
                  <Typography variant="h6" className="font-semibold mb-1">
                    Partage de résultats
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Générez des liens sécurisés ou exportez les résultats pour les partager avec les élèves et collègues
                  </Typography>
                </div>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4 }} className="mb-1">
              <Box className="flex items-start">
                <Equalizer className="text-amber-600 mr-3 mt-1" fontSize="medium" />
                <div>
                  <Typography variant="h6" className="font-semibold mb-1">
                    Modèles d'évaluation
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Ajoutez et réutilisez des modèles personnalisés adaptés à vos besoins pédagogiques spécifiques
                  </Typography>
                </div>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4 }} className="mb-6">
              <Box className="flex items-start">
                <CloudDownload className="text-purple-600 mr-3 mt-1" fontSize="medium" />
                <div>
                  <Typography variant="h6" className="font-semibold mb-1">
                    Exportation de données
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Exportez les résultats en PDF, CSV ou Excel pour une utilisation dans d'autres systèmes
                  </Typography>
                </div>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4 }} className="mb-6">
              <Box className="flex items-start">
                <Devices className="text-cyan-600 mr-3 mt-1" fontSize="medium" />
                <div>
                  <Typography variant="h6" className="font-semibold mb-1">
                    Compatible tous supports
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Accédez à vos corrections depuis n'importe quel appareil avec une interface adaptative
                  </Typography>
                </div>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Group Analysis Feature Section */}
      <Box className="py-16 bg-gray-50">
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
          <Typography variant="h4" className="font-bold mb-4 text-gray-800">
                Nouvelle fonctionnalité : analyse de groupes avancée
              </Typography> 
            <Grid size={{ xs: 12, md: 8 }}>
              <Typography variant="body1" sx={{marginTop: '20px', marginBottom: '10px'}} className="text-gray-600">
                Un système d'évaluation de groupe qui offre des fonctionnalités puissantes :
              </Typography>
              
              <Box className="space-y-4">
                <Box className="flex items-start">
                  <PieChart className="text-blue-600 mr-3 mt-1" />
                  <Typography variant="body1">
                    <strong>Distribution des notes</strong> - Visualisez la répartition des notes dans un groupe et identifiez les tendances
                  </Typography>
                </Box>
                <Box className="flex items-start">
                  <Speed className="text-blue-600 mr-3 mt-1" />
                  <Typography variant="body1">
                    <strong>Comparaison inter-groupes</strong> - Analysez les performances entre différents groupes ou au sein d'un même groupe
                  </Typography>
                </Box>
                <Box className="flex items-start">
                  <BarChart className="text-blue-600 mr-3 mt-1" />
                  <Typography variant="body1">
                    <strong>Statistiques détaillées</strong> - Explorez les métriques avancées avec ventilation par points expérimentaux et théoriques
                  </Typography>
                </Box>
                <Box className="flex items-start">
                  <DataSaverOn className="text-blue-600 mr-3 mt-1" />
                  <Typography variant="body1">
                    <strong>Identification des points critiques</strong> - Repérez les concepts difficiles et adaptez votre enseignement
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Box className="relative rounded-lg overflow-hidden shadow-xl">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-700 p-8 h-80 flex items-center justify-center">
                <BarChart
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        opacity: 0.2,
                        color:'darkblue',
                      }}
                    />
                  <div className="relative text-center">
                    <Groups sx={{ fontSize: 120, color: 'white', opacity: 0.9 }} />
                    <Typography variant="h5" className="text-white mt-4 font-bold">
                      Analyse de performances de groupe
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
            Prêt à améliorer votre processus d'évaluation ?
          </Typography>
          <Typography variant="body1"  sx={{ mb: 8 }}>
            Rejoignez les enseignants qui utilisent notre plateforme pour économiser du temps et fournir des analyses approfondies.
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
