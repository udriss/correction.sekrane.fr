'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import React from 'react';
import BarChartIcon from '@mui/icons-material/BarChart';
import { 
  Paper, Typography, Box, Alert, Button, Container, Card, CardContent, Divider, 
  Chip, TextField, Zoom, Fade, Grow, Stack, InputAdornment, alpha, Tooltip 
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import SaveIcon from '@mui/icons-material/Save';
import DescriptionIcon from '@mui/icons-material/Description';
import EmojiObjectsIcon from '@mui/icons-material/EmojiObjects';
import ScienceIcon from '@mui/icons-material/Science';
import SchoolIcon from '@mui/icons-material/School';
import Link from 'next/link';
import H1Title from '@/components/ui/H1Title';
import GradientBackground from '@/components/ui/GradientBackground';
import ThemedTypography from '@/components/ui/ThemedTypography';
import PatternBackground from '@/components/ui/PatternBackground';
import CircularProgress from '@mui/material/CircularProgress';

export default function NewActivity() {
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [experimentalPoints, setExperimentalPoints] = useState(5);
  const [theoreticalPoints, setTheoreticalPoints] = useState(15);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  // Using the total directly instead of maintaining a separate state
  const router = useRouter();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Le nom de l\'activité est requis');
      return;
    }

    // Validation de barème flexible - ne vérifie plus que le total soit exactement 20
    const currentTotal = Number(experimentalPoints) + Number(theoreticalPoints);
    if (currentTotal <= 0) {
      setError('Le total des points doit être supérieur à 0');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name, 
          content,
          experimental_points: experimentalPoints,
          theoretical_points: theoreticalPoints,
          total_points: currentTotal // Ajouter le total des points
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la création de l\'activité');
      }

      const data = await response.json();
      router.push(`/activities/${data.id}`);
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors de la création de l\'activité');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePointsChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    setter: React.Dispatch<React.SetStateAction<number>>,
    isExperimental: boolean
  ) => {
    const value = Number(e.target.value);
    setter(value);
    
    // No need to update totalPoints state as we can calculate it directly
    // when needed in the UI
  };
  return (
    <Container maxWidth="md" className="py-10">
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
                <Typography variant="h4" fontWeight={700} color="text.primary">Nouvelle activité</Typography>
                  <Typography color='text.secondary' variant="subtitle1" sx={{ opacity: 0.9, mb: 1 }}>
                    Ajoutez une nouvelle activité à corriger pour vos élèves
                  </Typography>
                </Box>
                
                <Button 
                  component={Link}
                  color='secondary'
                  href="/activities"
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
                  Retour aux activitiés
                </Button>
              </Box>
            </GradientBackground>
          </Box>
          
          <Box sx={{ p: { xs: 3, sm: 4 } }}>
            {error && (
              <Grow in={!!error}>
                <Alert 
                  severity="error" 
                  variant="filled"
                  sx={{ 
                    mb: 4, 
                    borderRadius: 2,
                    animation: 'fadeInDown 0.5s ease-out'
                  }}
                >
                  {error}
                </Alert>
              </Grow>
            )}
            
            <form onSubmit={handleSubmit}>
              <Fade in={true} timeout={800}>
                <Box sx={{ mb: 4 }}>
                  <ThemedTypography variant="h6" fontWeight="bold" mb={1.5}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <DescriptionIcon color="primary" />
                      Informations générales
                    </Box>
                  </ThemedTypography>
                  <Divider sx={{ mb: 3 }} />
                  
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" fontWeight="bold" mb={1} color="text.secondary">
                      Nom de l'activité *
                    </Typography>
                    <TextField
                      fullWidth
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: TP sur les circuits électriques"
                      required
                      variant="outlined"
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <SchoolIcon color="primary" />
                            </InputAdornment>
                          ),
                        }
                      }}
                      sx={{ 
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          py: 0.5
                        }
                      }}
                    />
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" fontWeight="bold" mb={1} color="text.secondary">
                      Description (facultative)
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Description détaillée de l'activité..."
                      variant="outlined"
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <EmojiObjectsIcon color="primary" />
                            </InputAdornment>
                          ),
                        }
                      }}
                      sx={{ 
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2
                        }
                      }}
                    />
                  </Box>
                </Box>
              </Fade>

              {/* Barème de notation avec dégradé et motif */}
              <Grow in={true} timeout={1000}>
                <Card sx={{ 
                  mb: 4, 
                  overflow: 'hidden', 
                  border: 'none', 
                  boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 5px 15px rgba(0,0,0,0.4)' : '0 5px 15px rgba(0,0,0,0.08)',
                  borderRadius: 3,
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 8px 25px rgba(0,0,0,0.5)' : '0 8px 25px rgba(0,0,0,0.1)',
                  }
                }}>
                  <Box sx={{ position: 'relative' }}>
                    <GradientBackground variant="secondary" sx={{ position: 'relative', zIndex: 1, py: 2, px: 3 }}>
                      <PatternBackground 
                        pattern='grid'
                        opacity={0.2}
                        sx={{ 
                          position: 'absolute', 
                          top: 0, 
                          left: 0, 
                          right: 0, 
                          bottom: 0, 
                          zIndex: -1 
                        }}
                      />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BarChartIcon />
                        <Typography variant="h6" fontWeight="bold">
                          Barème de notation
                        </Typography>
                      </Box>
                    </GradientBackground>
                  </Box>
                  
                  <CardContent sx={{ p: 3 }}>
                    <Stack 
                      direction={{ xs: 'column', md: 'row' }}
                      spacing={3}
                      sx={{ mb: 3 }}
                    >
                      <Card 
                        key="experimental-points"
                        sx={{ 
                          flex: 1, 
                          p: 3, 
                          borderRadius: 2, 
                          bgcolor: 'background.default',
                          border: '1px solid',
                          borderColor: 'divider',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            boxShadow: (theme) => `0 5px 15px ${alpha(theme.palette.primary.main, 0.15)}`,
                            borderColor: 'primary.main',
                          }
                        }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5, gap: 1 }}>
                          <ScienceIcon color="primary" />
                          <Typography variant="subtitle2" fontWeight="bold">
                            Points partie expérimentale
                          </Typography>
                        </Box>
                        <TextField
                          fullWidth
                          type="number"
                          slotProps={{
                            input: { 
                              inputProps: { min: 0, step: .5, max: 20 },
                             }
                          }}
                          value={experimentalPoints}
                          onChange={(e) => handlePointsChange(e, setExperimentalPoints, true)}
                          variant="outlined"
                          sx={{
                            '& input': {
                              textAlign: 'center',
                              fontSize: '1.2rem',
                              fontWeight: 'bold'
                            }
                          }}
                        />
                      </Card>
                      
                      <Card 
                        key="theoretical-points"
                        sx={{ 
                          flex: 1, 
                          p: 3, 
                          borderRadius: 2, 
                          bgcolor: 'background.default',
                          border: '1px solid',
                          borderColor: 'divider',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            boxShadow: (theme) => `0 5px 15px ${alpha(theme.palette.secondary.main, 0.15)}`,
                            borderColor: 'secondary.main',
                          }
                        }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5, gap: 1 }}>
                          <EmojiObjectsIcon color="secondary" />
                          <Typography variant="subtitle2" fontWeight="bold">
                            Points partie théorique
                          </Typography>
                        </Box>
                        <TextField
                          fullWidth
                          type="number"
                          slotProps={{
                            input: { inputProps: { min: 0, max: 20, step: 0.5 } }
                          }}
                          value={theoreticalPoints}
                          onChange={(e) => handlePointsChange(e, setTheoreticalPoints, false)}
                          variant="outlined"
                          sx={{
                            '& input': {
                              textAlign: 'center',
                              fontSize: '1.2rem',
                              fontWeight: 'bold'
                            }
                          }}
                        />
                      </Card>
                    </Stack>
                    
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: { xs: 'column', sm: 'row' }, 
                      justifyContent: 'space-between',
                      alignItems: { xs: 'stretch', sm: 'center' },
                      gap: 2
                    }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        Définissez librement votre barème (valeur actuelle: {experimentalPoints + theoreticalPoints})
                      </Typography>
                      
                      <Tooltip title="Total des points pour cette activité">
                        <Chip
                          label={`Total : ${experimentalPoints + theoreticalPoints} points`}
                          color={(experimentalPoints + theoreticalPoints) > 0 ? "success" : "warning"}
                          sx={{ 
                            fontWeight: 'bold', 
                            fontSize: '1rem', 
                            py: 2.5, 
                            px: 1,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              transform: 'scale(1.05)'
                            }
                          }}
                        />
                      </Tooltip>
                    </Box>
                  </CardContent>
                </Card>
              </Grow>

              <Divider sx={{ my: 4 }} />
              
              <Fade in={true} timeout={1200}>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: 2
                }}>
                  <Button
                    variant="outlined"
                    color="inherit"
                    component={Link}
                    href="/activities"
                    startIcon={<ArrowBackIcon />}
                    sx={{ 
                      borderRadius: 2,
                      px: 3,
                      py: 1.2
                    }}
                  >
                    Annuler
                  </Button>
                  
                  <Button
                    variant="contained"
                    color="primary"
                    type="submit"
                    disabled={isSubmitting}
                    startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                    sx={{ 
                      px: 4, 
                      py: 1.2,
                      fontWeight: 'bold',
                      borderRadius: 2,
                      boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
                      '&:hover': {
                        boxShadow: '0 6px 15px rgba(0, 0, 0, 0.3)',
                        transform: 'translateY(-2px)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {isSubmitting ? 'Création en cours...' : 'Ajouter l\'activité'}
                  </Button>
                </Box>
              </Fade>
            </form>
          </Box>
        </Paper>
    </Container>
  );
}
