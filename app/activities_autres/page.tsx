'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSnackbar } from 'notistack';
import { ActivityAutre } from '@/lib/types';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  IconButton,
  TextField,
  InputAdornment,
  CircularProgress,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Tooltip,
  Alert,
  Grid
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ScienceIcon from '@mui/icons-material/Science';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import GradientBackground from '@/components/ui/GradientBackground';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function ActivitiesAutresPage() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  
  const [activities, setActivities] = useState<ActivityAutre[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<ActivityAutre[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/activities_autres');
        
        if (!response.ok) {
          throw new Error('Erreur lors du chargement des activités');
        }
        
        const data = await response.json();
        setActivities(data);
        setFilteredActivities(data);
      } catch (err) {
        console.error('Erreur:', err);
        setError(`Erreur: ${(err as Error).message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchActivities();
  }, []);
  
  // Filtrer les activités lorsque le terme de recherche change
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredActivities(activities);
      return;
    }
    
    const lowercaseSearchTerm = searchTerm.toLowerCase();
    const filtered = activities.filter(activity => 
      activity.name.toLowerCase().includes(lowercaseSearchTerm) ||
      (activity.content && activity.content.toLowerCase().includes(lowercaseSearchTerm))
    );
    
    setFilteredActivities(filtered);
  }, [searchTerm, activities]);
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  const handleCreateActivity = () => {
    router.push('/activities_autres/new');
  };
  
  const handleOpenActivity = (id: number) => {
    router.push(`/activities_autres/${id}`);
  };
  
  // Calculer le total des points d'une activité
  const calculateTotalPoints = (activity: ActivityAutre) => {
    return activity.points.reduce((sum, point) => sum + point, 0);
  };
  
  // Formatter le nombre de points en texte
  const formatPointsText = (points: number) => {
    return `${points} point${points > 1 ? 's' : ''}`;
  };
  
  if (loading) {
    return (
      <div className="container max-w-[400px] mx-auto px-4 py-8 flex justify-center">
        <LoadingSpinner size="lg" text="Chargement des activités" />
      </div>
    );
  }
  
  return (
    <Container maxWidth="lg" className="py-8">
      <GradientBackground variant="primary" sx={{ p: 3, borderRadius: 2, mb: 4 }}>
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            flexWrap: 'wrap',
            gap: 2
          }}
        >
          <Typography variant="h4" fontWeight={700} color="text.primary">
            Activités avec parties dynamiques
          </Typography>
          
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleCreateActivity}
            className="bg-white/20 hover:bg-white/30"
          >
            Nouvelle activité
          </Button>
        </Box>
      </GradientBackground>
      
      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}
      
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <TextField
          fullWidth
          placeholder="Rechercher une activité..."
          variant="outlined"
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 3 }}
        />
        
        {filteredActivities.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Aucune activité trouvée
            </Typography>
            {searchTerm ? (
              <Typography variant="body2" color="text.secondary">
                Aucun résultat pour "{searchTerm}". Essayez avec d'autres termes.
              </Typography>
            ) : (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Vous n'avez pas encore créé d'activités avec parties dynamiques.
                </Typography>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={handleCreateActivity}
                >
                  Créer votre première activité
                </Button>
              </Box>
            )}
          </Box>
        ) : (
          <Grid container spacing={3}>
            {filteredActivities.map(activity => (
              <Grid size={{ xs: 12, md:6, lg:4 }} key={activity.id}>
                <Paper
                  elevation={2}
                  sx={{
                    p: 2,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                    },
                  }}
                  onClick={() => handleOpenActivity(activity.id)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                    <FormatListBulletedIcon 
                      color="primary" 
                      sx={{ 
                        mr: 1.5, 
                        fontSize: '1.8rem', 
                        mt: 0.5,
                        opacity: 0.7
                      }} 
                    />
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" noWrap>
                        {activity.name}
                      </Typography>
                      
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ 
                          mb: 1,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          height: '40px'
                        }}
                      >
                        {activity.content || "Aucune description"}
                      </Typography>
                    </Box>
                    
                    <Tooltip title="Modifier" placement="top">
                      <IconButton 
                        size="small" 
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/activities_autres/${activity.id}?tab=0`);
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  
                  <Divider sx={{ my: 1 }} />
                  
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {activity.parts_names.length} partie{activity.parts_names.length > 1 ? 's' : ''} •&nbsp;
                      {formatPointsText(calculateTotalPoints(activity))} au total
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                      {activity.parts_names.map((name, index) => (
                        <Chip
                          key={index}
                          label={`${name}: ${activity.points[index]} pts`}
                          size="small"
                          color={index % 2 === 0 ? "primary" : "secondary"}
                          variant="outlined"
                          icon={index % 2 === 0 ? <MenuBookIcon /> : <ScienceIcon />}
                          sx={{ 
                            fontSize: '0.7rem', 
                            height: '24px',
                            maxWidth: '100%',
                            '.MuiChip-label': {
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '120px'
                            }
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>
    </Container>
  );
}