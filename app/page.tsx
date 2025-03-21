'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Button, 
  Typography, 
  Container, 
  Box, 
  Card,
  CardContent
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { 
  AssignmentTurnedIn, 
  Share, 
  School,
  BarChart,
  ArrowForward,
  Groups,
  Analytics,
  Speed
} from '@mui/icons-material';


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
            <Grid size={{ xs: 12, md: 7 }}>
              <Typography 
              variant="h3" 
              component="h2" 
              className="text-4xl md:text-5xl font-extrabold mb-4"
              >
              Évaluez et analysez vos activités pédagogiques
              </Typography>
              <Typography variant="h6" className="mb-8 text-blue-100">
                Créez, gérez et partagez facilement les corrections, individuelles ou en groupe
              </Typography>
              <Box className="flex flex-wrap gap-4">
              <Button 
                variant="outlined" 
                color="secondary" 
                size="large" 
                component={Link}
                href="/demo"
                endIcon={<ArrowForward />}
                className="text-lg py-3 px-6"
                sx={{ fontWeight: 'bold',
                '&:hover': {
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
              >
                Nouvelle activité
              </Button>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 5 }} className="flex justify-center">
              <Box className="relative w-full max-w-md h-64 md:h-80">
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

      {/* Features Section */}
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
          {/* Feature 1 */}
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
                  Créez des corrections structurées avec points expérimentaux et théoriques pour une évaluation complète
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Feature 2 */}
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
                  Organisez vos corrections par groupes et accédez à des statistiques collectives détaillées
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Feature 3 */}
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
                  Visualisez les tendances et identifiez les points forts et à améliorer de vos élèves
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* Additional Features Section */}
      <Box className="py-16 bg-gray-50">
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="h4" className="font-bold mb-4 text-gray-800">
                Nouvelle fonctionnalité : Analyse de groupes
              </Typography>
              <Typography variant="body1" className="mb-4 text-gray-600">
                Notre système amélioré d'évaluation de groupe vous permet de :
              </Typography>
              <Box className="space-y-4">
                <Box className="flex items-start">
                  <Speed className="text-blue-600 mr-3 mt-1" />
                  <Typography variant="body1">
                    <strong>Comparer les performances</strong> entre différents groupes ou au sein d'un même groupe
                  </Typography>
                </Box>
                <Box className="flex items-start">
                  <BarChart className="text-blue-600 mr-3 mt-1" />
                  <Typography variant="body1">
                    <strong>Visualiser des statistiques détaillées</strong> avec répartition des points expérimentaux et théoriques
                  </Typography>
                </Box>
                <Box className="flex items-start">
                  <Share className="text-blue-600 mr-3 mt-1" />
                  <Typography variant="body1">
                    <strong>Partager des liens sécurisés</strong> pour donner accès aux résultats, individuels ou collectifs
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
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
          <Typography variant="body1" className="mb-8 text-blue-100">
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
              variant="outlined" 
              color="inherit"
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
