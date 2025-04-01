'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Paper, 
  Typography, 
  Box, 
  Button, 
  Grid,
  Card,
  CardContent,
  CardActions,
  Container,
} from '@mui/material';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import GroupsIcon from '@mui/icons-material/Groups';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import GradeTwoToneIcon from '@mui/icons-material/GradeTwoTone';
import SpeedIcon from '@mui/icons-material/Speed';
import dynamic from 'next/dynamic';

// Import these components with dynamic to prevent SSR issues
const GradientBackground = dynamic(
  () => import('@/components/ui/GradientBackground'),
  { ssr: false }
);

const PatternBackground = dynamic(
  () => import('@/components/ui/PatternBackground'),
  { ssr: false }
);

// Safely create a client-only component for theme-dependent UI
const ThemeDependentBox = dynamic(
  () => import('@/components/ui/ThemeDependentBox'),
  { ssr: false }
);

export default function NewCorrectionPage() {
  const router = useRouter();
  const [componentsLoaded, setComponentsLoaded] = React.useState(false);
  // Suppression des états non utilisés dans cette page qui avaient été ajoutés par erreur
  // Ces états font partie de la page de création individuelle de correction
  // const [isSubmitting, setIsSubmitting] = React.useState(false);
  // const [error, setError] = React.useState('');

  React.useEffect(() => {
    setComponentsLoaded(true);
  }, []);

  // Create fallback styles that don't rely on theme
  const fallbackBoxStyle = {
    padding: '1rem',
    borderRadius: '0.5rem',
    marginTop: '0.75rem',
    marginBottom: '0.75rem',
    backgroundColor: '#f0f0f0',
  };

  // Suppression de la fonction submitCorrection qui n'est pas pertinente pour cette page
  // Cette page est juste une page de sélection du type de correction
  
  return (
    <Container maxWidth="lg" className="py-8">
      {/* Header with modern design and gradient */}
      <Paper 
        elevation={3}
        className="mb-8 rounded-lg overflow-hidden"
      >
        {componentsLoaded ? (
          <GradientBackground variant="primary">
            <PatternBackground pattern="cross" opacity={0.25} color="000000" size={70}>
              <Box className="p-6 relative">
                <Typography variant="h4" component="h1" color='text.primary' fontWeight={700} className="mb-2">
                  Nouvelle correction
                </Typography>
                <Typography variant="subtitle1" color='text.secondary'>
                  Choisissez le type de correction que vous souhaitez ajouter
                </Typography>
              </Box>
            </PatternBackground>
          </GradientBackground>
        ) : (
          <Box className="p-6 relative" sx={{ bgcolor: '#f8f9fa' }}>
            <Typography variant="h4" component="h1" fontWeight={700} className="mb-2">
              Nouvelle correction
            </Typography>
            <Typography variant="subtitle1">
              Choisissez le type de correction que vous souhaitez ajouter
            </Typography>
          </Box>
        )}
        
        {/* Info cards */}
        <Box 
          sx={{ 
            bgcolor: 'background.paper',
            p: 2,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 2,
            justifyContent: 'space-around'
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            px: 2,
            py: 1,
            borderRadius: 2,
            bgcolor: '#f8f9fa' // Hardcoded fallback instead of theme.background.default
          }}>
            <GradeTwoToneIcon color="primary" />
            <Typography variant="body2">
              Évaluez facilement les travaux de vos étudiants
            </Typography>
          </Box>
          
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            px: 2,
            py: 1,
            borderRadius: 2,
            bgcolor: '#f8f9fa' // Hardcoded fallback
          }}>
            <SpeedIcon color="secondary" />
            <Typography variant="body2">
              Gagnez du temps avec des processus de correction optimisés
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Grid container spacing={4} className="mb-8">
        {/* Option 1: Correction Unique */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card
            elevation={2}
            className="h-full transition-all hover:shadow-lg border-t-4 border-green-500"
            sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}
          >
            <CardContent sx={{ flexGrow: 1 }}>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <AssignmentIndIcon color="primary" fontSize="large" />
                <Typography variant="h5" component="h2" fontWeight="bold">
                  Correction unique
                </Typography>
              </Box>
              <Typography variant="body1" paragraph>
                Ajoutez une correction individuelle pour un étudiant spécifique.
              </Typography>
              
              {componentsLoaded ? (
                <ThemeDependentBox>
                  <Typography variant="body2">
                    Idéal pour :
                  </Typography>
                  <ul className="list-disc pl-5 mt-1">
                    <li>corriger un seul travail d'étudiant</li>
                    <li>correction manuelle et détaillée</li>
                    <li>ajouter une correction isolée</li>
                  </ul>
                </ThemeDependentBox>
              ) : (
                <Box style={fallbackBoxStyle}>
                  <Typography variant="body2">
                    Idéal pour :
                  </Typography>
                  <ul className="list-disc pl-5 mt-1">
                    <li>corriger un seul travail d'étudiant</li>
                    <li>correction manuelle et détaillée</li>
                    <li>ajouter une correction isolée</li>
                  </ul>
                </Box>
              )}
            </CardContent>
            <CardActions className="p-4 pt-0">
              <Button
                variant="contained"
                color="primary"
                endIcon={<ArrowForwardIcon />}
                fullWidth
                component={Link}
                href="/corrections/unique"
              >
                Correction unique
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Option 2: Corrections Multiples */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card
            elevation={2}
            className="h-full transition-all hover:shadow-lg border-t-4 border-purple-500" 
            sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}
          >
            <CardContent sx={{ flexGrow: 1 }}>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <GroupsIcon color="secondary" fontSize="large" />
                <Typography variant="h5" component="h2" fontWeight="bold">
                  Corrections Multiples
                </Typography>
              </Box>
              <Typography variant="body1" paragraph>
                Ajoutez plusieurs corrections en une seule opération pour un groupe d'étudiants.
              </Typography>
              
              {componentsLoaded ? (
                <ThemeDependentBox>
                  <Typography variant="body2">
                    Idéal pour :
                  </Typography>
                  <ul className="list-disc pl-5 mt-1">
                    <li>corriger un groupe ou une classe entière</li>
                    <li>ajouter rapidement plusieurs corrections</li>
                    <li>corrections par lots avec barème commun</li>
                  </ul>
                </ThemeDependentBox>
              ) : (
                <Box style={fallbackBoxStyle}>
                  <Typography variant="body2">
                    Idéal pour :
                  </Typography>
                  <ul className="list-disc pl-5 mt-1">
                    <li>corriger un groupe ou une classe entière</li>
                    <li>ajouter rapidement plusieurs corrections</li>
                    <li>corrections par lots avec barème commun</li>
                  </ul>
                </Box>
              )}
            </CardContent>
            <CardActions className="p-4 pt-0">
              <Button
                variant="contained"
                color="secondary"
                endIcon={<ArrowForwardIcon />}
                fullWidth
                component={Link}
                href="/corrections/multiples"
              >
                Corrections multiples
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
