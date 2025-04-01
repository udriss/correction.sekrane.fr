'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Activity } from '@/lib/activity';
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
  CardMedia,
  CardActions
} from '@mui/material';
import Link from 'next/link';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import GradientBackground from '@/components/ui/GradientBackground';
import PatternBackground from '@/components/ui/PatternBackground';

export default function CorrectionsPage({ params }: { params: Promise<{ activityId: string }> }) {
  const { activityId } = React.use(params);
  const router = useRouter();
  
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const response = await fetch(`/api/activities/${activityId}`);
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
            <Alert severity="warning" sx={{ mb: 3 }}>
              L'activité demandée n'existe pas ou a été supprimée.
            </Alert>
            <Button
              variant="outlined"
              color="primary"
              component={Link}
              href="/activities"
            >
              Retour à la liste des activités
            </Button>
          </Paper>
        </Box>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-4xl mx-auto">
        <Paper elevation={3} sx={{ borderRadius: 3, overflow: 'hidden', mb: 4 }}>
          <GradientBackground variant="primary" sx={{ p: 0 }}>
            <PatternBackground 
              pattern="dots" 
              opacity={0.05} 
              color="black" 
              size={100}
              sx={{ p: 4, borderRadius: 2 }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <AssignmentIcon sx={{ fontSize: 36, color: 'white' }} />
                  <Box>
                    <Typography variant="h4" fontWeight={700} color="white">Corrections</Typography>
                    <Typography variant="subtitle1" color="white" sx={{ opacity: 0.9 }}>
                      {activity.name}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </PatternBackground>
          </GradientBackground>
        </Paper>
        
        <Grid container spacing={4}>
          {/* Carte pour correction unique */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              transition: 'transform 0.3s, box-shadow 0.3s',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: 6
              },
              borderRadius: 2
            }}>
              <CardMedia
                component="div"
                sx={{
                  height: 140,
                  bgcolor: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <PersonIcon sx={{ fontSize: 60, color: 'white' }} />
              </CardMedia>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h5" component="h2" gutterBottom fontWeight="bold">
                  Correction unique
                </Typography>
                <Typography variant="body2">
                  Créez une correction pour un seul étudiant à la fois. Cette option est idéale pour les évaluations individuelles ou pour ajouter une correction spécifique.
                </Typography>
              </CardContent>
              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button 
                  variant="contained" 
                  fullWidth
                  endIcon={<ArrowForwardIcon />}
                  component={Link}
                  href={`/activities/${activityId}/corrections/new`}
                >
                  Créer une correction
                </Button>
              </CardActions>
            </Card>
          </Grid>
          
          {/* Carte pour corrections multiples */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              transition: 'transform 0.3s, box-shadow 0.3s',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: 6
              },
              borderRadius: 2
            }}>
              <CardMedia
                component="div"
                sx={{
                  height: 140,
                  bgcolor: 'secondary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <PeopleIcon sx={{ fontSize: 60, color: 'white' }} />
              </CardMedia>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h5" component="h2" gutterBottom fontWeight="bold">
                  Corrections multiples
                </Typography>
                <Typography variant="body2">
                  Créez des corrections pour plusieurs étudiants en une fois. Idéal pour les classes entières ou les groupes d'étudiants travaillant sur la même activité.
                </Typography>
              </CardContent>
              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button 
                  variant="contained" 
                  color="secondary"
                  fullWidth
                  endIcon={<ArrowForwardIcon />}
                  component={Link}
                  href={`/activities/${activityId}/corrections/multiples`}
                >
                  Créer plusieurs corrections
                </Button>
              </CardActions>
            </Card>
          </Grid>
        </Grid>
      </div>
    </div>
  );
}
