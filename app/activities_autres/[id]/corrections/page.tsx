'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ActivityAutre } from '@/lib/types';
import { 
  Paper, 
  Typography, 
  Box, 
  Alert, 
  CircularProgress, 
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Container,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import Link from 'next/link';
import AssignmentIcon from '@mui/icons-material/Assignment';
import GroupsIcon from '@mui/icons-material/Groups';
import PersonIcon from '@mui/icons-material/Person';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import GradientBackground from '@/components/ui/GradientBackground';
import PatternBackground from '@/components/ui/PatternBackground';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import GradeTwoToneIcon from '@mui/icons-material/GradeTwoTone';
import SpeedIcon from '@mui/icons-material/Speed';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import dynamic from 'next/dynamic';


export default function CorrectionsAutrePage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap the params Promise using React.use()
  const unwrappedParams = React.use(params);
  const { id } = unwrappedParams;
  const activityId = id;
  const router = useRouter();
  
  const [activity, setActivity] = useState<ActivityAutre | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');  

  useEffect(() => {
      const fetchActivity = async () => {
        try {
          const response = await fetch(`/api/activities_autres/${activityId}`);
          if (!response.ok) throw new Error('Erreur lors du chargement de l\'activité');
          const data = await response.json();
          setActivity(data);
        } catch (err) {
          console.error('Erreur:', err);
          setError('Erreur lors du chargement de l\'activité');
        } finally {
          setLoading(false);
        }
      };

      fetchActivity();
    }, [activityId]);
  
  // Fallback style pour les boîtes qui ne dépendent pas du thème
  const fallbackBoxStyle = {
    padding: '1rem',
    borderRadius: '0.5rem',
    marginTop: '0.75rem',
    marginBottom: '0.75rem',
    backgroundColor: '#f0f0f0',
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-4xl w-full flex justify-center py-16">
          <CircularProgress size={40} />
        </div>
      </div>
    );
  }
  
  if (!activity) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
        <Box className="max-w-4xl w-full">
          <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }} className="border-l-4 border-yellow-500">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <ErrorOutlineIcon color="warning" fontSize="large" />
            <Typography variant="h5" color="warning.main" className="font-bold">
              Activité non trouvée
            </Typography>
            </Box>
            <Alert severity="warning" sx={{ mb: 3 }}>
              L'activité demandée n'existe pas ou a été supprimée.
            </Alert>
            <Button
              variant="outlined"
              color="primary"
              component={Link}
              href="/activities_autres"
            >
              Retour à la liste des activités
            </Button>
          </Paper>
        </Box>
      </div>
    );
  }
  
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
              pattern="dots" 
              opacity={0.3}
              sx={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                right: 0, 
                bottom: 0, 
                zIndex: -1 
              }}
            >
            </PatternBackground>

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
                <AssignmentIcon sx={{ fontSize: 50, color: (theme) => theme.palette.text.primary }} />
              </Box>
              
              <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h4" fontWeight={700} color="text.primary">Corrections</Typography>
                <Typography color='text.secondary' variant="subtitle1" sx={{ opacity: 0.9, mb: 1 }}>
                  {activity.name}
                </Typography>
              </Box>
              
              <Button 
                component={Link}
                color='secondary'
                href={`/activities_autres/${activityId}`}
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
                Retour à l'activité
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
      
      <Grid container spacing={4} sx={{ mt: 2 }} className="mb-8">
        {/* Carte pour correction unique */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card
            elevation={2}
            className="h-full transition-all hover:shadow-lg"
            sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              transition: 'transform 0.3s, box-shadow 0.3s',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: 6
              },
              borderRadius: 2
            }}
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
                  <PersonIcon sx={{color:"text.primary"}} fontSize="large" />
                </Box>
                <Typography variant="h5" component="h2" fontWeight="bold">
                  Correction unique
                </Typography>
              </Box>
              <Typography variant="body1">
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
            <CardActions sx={{ p: 2, pt: 0 }}>
              <Button 
                variant="outlined" 
                color="primary"
                fullWidth
                endIcon={<ArrowForwardIcon />}
                component={Link}
                href={`/activities_autres/${activityId}/corrections/new`}
              >
                Ajouter une correction unique
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        {/* Carte pour corrections multiples */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card
            elevation={2}
            className="h-full transition-all hover:shadow-lg" 
            sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              transition: 'transform 0.3s, box-shadow 0.3s',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: 6
              },
              borderRadius: 2
            }}
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
                  <GroupsIcon sx={{color:"text.primary"}} fontSize="large" />
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
            <CardActions sx={{ p: 2, pt: 0 }}>
              <Button 
                variant="outlined" 
                color="primary"
                fullWidth
                endIcon={<ArrowForwardIcon />}
                component={Link}
                href={`/activities_autres/${activityId}/corrections/multiples`}
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