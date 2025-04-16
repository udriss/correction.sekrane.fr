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
  ListItem,
  ListItemText,
  ListItemIcon,
  List,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import GroupsIcon from '@mui/icons-material/Groups';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import GradeTwoToneIcon from '@mui/icons-material/GradeTwoTone';
import SpeedIcon from '@mui/icons-material/Speed';
import dynamic from 'next/dynamic';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

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
    <Container maxWidth="md" className="py-10">
      {/* Header with modern design and gradient */}
        <Paper 
          elevation={3} 
          sx={{ 
            borderRadius: 3,
          }}>
          {/* En-tête avec dégradé et motif */}
          <Box sx={{ position: 'relative' }}>
            <GradientBackground variant="primary" sx={{ position: 'relative', zIndex: 1, p: { xs: 3, sm: 4 } }}>
              <PatternBackground 
                pattern='dots'
                opacity={0.3}
                sx={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  right: 0, 
                  bottom: 0, 
                  zIndex: -1 
                }}
              />

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Box 
                  sx={{ 
                    background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                    p: 1.5, 
                    borderRadius: '50%',
                    display: 'flex',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                  }}
                >
                  <AddCircleIcon sx={{ fontSize: 50, color: (theme) => theme.palette.text.primary }} />
                </Box>
                
                <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h4" fontWeight={700} color="text.primary">Nouvelle correction</Typography>
                  <Typography color='text.secondary' variant="subtitle1" sx={{ opacity: 0.9, mb: 1 }}>
                  Choisissez le type de correction que vous souhaitez ajouter
                  </Typography>
                </Box>
                
                <Button 
                  component={Link}
                  color='secondary'
                  href="/corrections"
                  variant="contained"
                  startIcon={<ArrowBackIcon />}
                  sx={{ 
                    bgcolor: 'rgba(255,255,255,0.2)', 
                    color: theme => theme.palette.text.primary,
                    backdropFilter: 'blur(10px)',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.3)',
                    },
                    fontWeight: 600,
                    py: 1,
                    px: 2,
                    borderRadius: 2,
                    boxShadow: '0 4px 15px rgba(0,0,0,0.15)'
                  }}
                >
                  Retour aux corrections
                </Button>
              </Box>
            </GradientBackground>
          </Box>


        
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

      <Grid sx={{mt:2}} container spacing={4} className="mb-8">
        {/* Option 1: Correction Unique */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card
            elevation={2}
            className="h-full transition-all hover:shadow-lg"
            sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}
          >
            <CardContent sx={{ flexGrow: 1 }}>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Box 
                  sx={{ 
                    background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.secondary.light} 100%)`,
                    borderRadius: '50%', 
                    p: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                >
                  <PersonIcon sx={{color:"text.primary", backgroundColor: 'secondary'}} fontSize="large" />
                </Box>
                <Typography variant="h5" component="h2" fontWeight="bold">
                  Correction unique
                </Typography>
              </Box>
              <Typography variant="body1" >
                Ajoutez une correction individuelle pour un étudiant spécifique.
              </Typography>
                      <Box style={fallbackBoxStyle}>
                        <Typography variant="body2">
                        Idéal pour :
                        </Typography>
                        <List sx={{ mt: 1 }}>
                        <ListItem sx={{ py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 28 }}>
                          <FiberManualRecordIcon fontSize='small' sx={{fontSize:8, color: 'text.secondary' }} />
                          </ListItemIcon>
                          <Typography variant="body2">
                          corriger un seul travail d'étudiant
                        </Typography>
                        </ListItem>
                        <ListItem sx={{ py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 28 }}>
                          <FiberManualRecordIcon fontSize='small' sx={{fontSize:8, color: 'text.secondary' }} />
                          </ListItemIcon>
                          <Typography variant="body2">
                          correction manuelle et détaillée
                        </Typography>
                        </ListItem>
                        <ListItem sx={{ py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 28 }}>
                          <FiberManualRecordIcon fontSize='small' sx={{fontSize:8, color: 'text.secondary' }} />
                          </ListItemIcon>
                          <Typography variant="body2">
                          ajouter une correction isolée
                        </Typography>
                        </ListItem>
                        </List>
                </Box>
                
            </CardContent>
            <CardActions className="p-4 pt-0">
              <Button
                variant="outlined"
                color="primary"
                endIcon={<ArrowForwardIcon />}
                fullWidth
                component={Link}
                href="/corrections/unique"
              >
                Ajouter une correction unique
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Option 2: Corrections Multiples */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card
            elevation={2}
            className="h-full transition-all hover:shadow-lg" 
            sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}
          >
            <CardContent sx={{ flexGrow: 1 }}>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
              <Box 
                  sx={{ 
                    background: (theme) => `linear-gradient(135deg, ${theme.palette.secondary.light} 0%, ${theme.palette.primary.light} 100%)`,
                    borderRadius: '50%', 
                    p: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                >
                  <GroupsIcon sx={{color:"text.primary", backgroundColor: 'secondary'}} fontSize="large" />
                </Box>
                <Typography variant="h5" component="h2" fontWeight="bold">
                  Corrections multiples
                </Typography>
              </Box>
              <Typography variant="body1">
                Ajoutez plusieurs corrections en une seule opération pour un groupe d'étudiants.
              </Typography>
              
                <Box style={fallbackBoxStyle}>
                  <Typography variant="body2">
                    Idéal pour :
                  </Typography>
                  <List sx={{ mt: 1 }}>
                  <ListItem sx={{ py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 28 }}>
                          <FiberManualRecordIcon fontSize='small' sx={{fontSize:8, color: 'text.secondary' }} />
                          </ListItemIcon>
                          <Typography variant="body2">
                          corriger un groupe ou une classe entière
                        </Typography>
                        </ListItem>
                        <ListItem sx={{ py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 28 }}>
                          <FiberManualRecordIcon fontSize='small' sx={{fontSize:8, color: 'text.secondary' }} />
                          </ListItemIcon>
                          <Typography variant="body2">
                          ajouter rapidement plusieurs corrections
                        </Typography>
                        </ListItem>
                        <ListItem sx={{ py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 28 }}>
                          <FiberManualRecordIcon fontSize='small' sx={{fontSize:8, color: 'text.secondary' }} />
                          </ListItemIcon>
                          <Typography variant="body2">
                          corrections par lots avec barème commun
                        </Typography>
                        </ListItem>
                  </List>
                </Box>

            </CardContent>
            <CardActions className="p-4 pt-0">
              <Button
                variant="outlined"
                color="primary"
                endIcon={<ArrowForwardIcon />}
                fullWidth
                component={Link}
                href="/corrections/multiples"
              >
                Ajouter des corrections en lot
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
