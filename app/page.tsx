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
  ArrowForward
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
            <Grid size={{ xs: 12, md: 10 }}>
              <Typography 
              variant="h3" 
              component="h2" 
              className="text-4xl md:text-5xl font-extrabold mb-4"
              >
              Simplifiez vos corrections pédagogiques
              </Typography>
              <Typography variant="h6" className="mb-8 text-blue-100">
              Gérez et partagez facilement les corrections pour vos élèves
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
            <Grid size={{ xs: 12, md: 2 }} className="flex justify-center">
              <Box className="relative w-full max-w-md h-64 md:h-80">
              {/* Ici vous pourriez ajouter une image d'illustration ou une animation */}
              <div className="w-full h-full bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <School sx={{ fontSize: 100, opacity: 0.9 }} />
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
            Une plateforme conçue pour les enseignants
          </Typography>
          <Typography variant="h6" className="text-gray-600 mx-auto max-w-3xl">
            Découvrez comment notre outil peut transformer votre façon de corriger les travaux
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
                  Corrections simplifiées
                </Typography>
                <Typography variant="body1" color="text.secondary" className="text-center">
                  Créez des corrections structurées avec un éditeur intuitif et des modèles personnalisables
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Feature 2 */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card className="h-full hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <Box className="flex justify-center mb-4">
                  <Share fontSize="large" className="text-green-600" />
                </Box>
                <Typography variant="h5" className="font-bold mb-2 text-center">
                  Partage facile
                </Typography>
                <Typography variant="body1" color="text.secondary" className="text-center">
                  Partagez instantanément les corrections avec vos élèves via un lien sécurisé
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Feature 3 */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card className="h-full hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <Box className="flex justify-center mb-4">
                  <BarChart fontSize="large" className="text-purple-600" />
                </Box>
                <Typography variant="h5" className="font-bold mb-2 text-center">
                  Suivi des performances
                </Typography>
                <Typography variant="body1" color="text.secondary" className="text-center">
                  Visualisez les progrès des élèves et identifiez les points à améliorer
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* Call to Action */}
      <Box className="py-16 text-white" style={{ backgroundColor: 'rgba(7, 31, 97, 1)' }}>
        <Container maxWidth="md" className="text-center">
          <Typography variant="h4" className="font-bold mb-4">
            Prêt à améliorer votre processus de correction ?
          </Typography>
          <Typography variant="body1" className="mb-8 text-blue-100">
            Rejoignez nos enseignants qui utilisent notre plateforme pour économiser du temps et fournir des retours de qualité.
          </Typography>
          <Box className="flex justify-center">
            <Button 
              variant="contained" 
              color="secondary" 
              size="large" 
              component={Link}
              href="/activites"
              className="text-lg font-medium"
            >
              Commencer maintenant
            </Button>
          </Box>
        </Container>
      </Box>
    </div>
  );
}
