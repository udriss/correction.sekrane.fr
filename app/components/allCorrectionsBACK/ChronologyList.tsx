import React, { useEffect } from 'react';
import {
  Typography,
  Paper,
  Box,
  Stack,
  Button,
  Chip,
  Alert,
  Divider,
  Grid,
  Tooltip
} from '@mui/material';
import { 
  Timeline, 
  TimelineItem, 
  TimelineSeparator, 
  TimelineConnector, 
  TimelineContent, 
  TimelineDot,
  TimelineOppositeContent 
} from '@mui/lab';
import Link from 'next/link';
import { alpha } from '@mui/material/styles';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import GradeIcon from '@mui/icons-material/Grade';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Use the existing Correction type without modification
import { Correction } from '@/app/components/CorrectionsDataProvider';

interface ChronologyListProps {
  filteredCorrections: Correction[];
  error: string;
  activeFilters: string[];
  handleClearAllFilters: () => void;
  getGradeColor: (grade: number) => string;
  highlightedIds: string[];
  recentFilter: boolean;
}

export default function ChronologyList({
  filteredCorrections,
  error,
  activeFilters,
  handleClearAllFilters,
  getGradeColor,
  highlightedIds,
  recentFilter
}: ChronologyListProps) {
  
  // Automatically scroll to highlighted items
  useEffect(() => {
    if (highlightedIds.length > 0) {
      // Set a small timeout to ensure DOM is ready
      const timer = setTimeout(() => {
        const firstHighlightedElement = document.getElementById(`timeline-correction-${highlightedIds[0]}`);
        if (firstHighlightedElement) {
          firstHighlightedElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [highlightedIds]);
  
  if (error) {
    return <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>;
  }
  
  if (filteredCorrections.length === 0) {
    return (
      <Paper elevation={0} sx={{ p: 4, textAlign: 'center', bgcolor: 'background.default' }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Aucune correction trouvée
        </Typography>
        {activeFilters.length > 0 && (
          <Button
            variant="outlined" 
            color="primary"
            onClick={handleClearAllFilters}
            sx={{ mt: 2 }}
          >
            Supprimer tous les filtres
          </Button>
        )}
      </Paper>
    );
  }
  
  // Sort corrections by date (newest first)
  const sortedCorrections = [...filteredCorrections].sort((a, b) => {
    const dateA = a.submission_date ? new Date(a.submission_date).getTime() : 0;
    const dateB = b.submission_date ? new Date(b.submission_date).getTime() : 0;
    return dateB - dateA;
  });
  
  // Group corrections by date
  const correctionsByDate: { [key: string]: Correction[] } = {};
  
  for (const correction of sortedCorrections) {
    if (!correction.submission_date) continue;
    
    const date = format(new Date(correction.submission_date), 'PP', { locale: fr });
    if (!correctionsByDate[date]) {
      correctionsByDate[date] = [];
    }
    correctionsByDate[date].push(correction);
  }
  
  return (
    <Stack spacing={4}>
      {Object.entries(correctionsByDate).map(([date, corrections]) => (
        <Paper
          key={date}
          elevation={1}
          sx={{
            p: 3,
            borderRadius: 2,
            bgcolor: 'background.paper',
          }}
        >
          <Typography variant="h6" component="h3" gutterBottom>
            {date}
          </Typography>
          
          <Divider sx={{ mb: 3 }} />
          
          <Timeline position="right" sx={{ p: 0, m: 0 }}>
            {corrections.map((correction) => {
              const isHighlighted = highlightedIds.includes(correction.id.toString());
              const isRecent = recentFilter || 
                (correction.submission_date && 
                 new Date().getTime() - new Date(correction.submission_date).getTime() < 24 * 60 * 60 * 1000);
              
              return (
                <TimelineItem 
                  key={correction.id}
                  id={`timeline-correction-${correction.id}`}
                  sx={{
                    '&:before': {
                      display: { xs: 'none', sm: 'block' },
                    },
                  }}
                >
                  <TimelineOppositeContent
                    sx={{ 
                      flex: { xs: 0, sm: 1 }, 
                      px: { xs: 0, sm: 2 }, 
                      display: { xs: 'none', sm: 'block' }
                    }}
                  >
                    {correction.submission_date && (
                      <Typography variant="body2" color="text.secondary">
                        {format(new Date(correction.submission_date), 'HH:mm', { locale: fr })}
                      </Typography>
                    )}
                  </TimelineOppositeContent>
                  
                  <TimelineSeparator>
                    <TimelineDot 
                      color={isHighlighted ? "secondary" : isRecent ? "info" : "primary"}
                      variant={isHighlighted || isRecent ? "filled" : "outlined"}
                      sx={{
                        boxShadow: isHighlighted ? 3 : 1,
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <AssignmentIcon />
                    </TimelineDot>
                    <TimelineConnector />
                  </TimelineSeparator>
                  
                  <TimelineContent sx={{ py: '12px', px: 2 }}>
                    <Paper
                      elevation={isHighlighted ? 3 : 1}
                      sx={{
                        p: 2.5,
                        borderRadius: 2,
                        transition: 'all 0.3s ease',
                        transform: isHighlighted ? 'scale(1.01)' : 'scale(1)',
                        borderLeft: isHighlighted ? '4px solid' : '1px solid',
                        borderLeftColor: isHighlighted 
                          ? theme => theme.palette.secondary.main 
                          : theme => alpha(theme.palette.divider, 0.1),
                        bgcolor: isHighlighted 
                          ? theme => alpha(theme.palette.secondary.light, 0.05)
                          : 'background.paper',
                        '&:hover': {
                          boxShadow: 3,
                        },
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      {isHighlighted && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            bgcolor: 'secondary.main',
                            color: 'white',
                            py: 0.5,
                            px: 2,
                            borderBottomLeftRadius: 8,
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            zIndex: 1,
                          }}
                        >
                          Nouveau
                        </Box>
                      )}
                      
                      {isRecent && !isHighlighted && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            bgcolor: 'info.main',
                            color: 'white',
                            py: 0.5,
                            px: 2,
                            borderBottomLeftRadius: 8,
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            zIndex: 1,
                          }}
                        >
                          Récent
                        </Box>
                      )}
                      
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 8 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <AssignmentIcon color="primary" />
                            <Typography variant="h6">
                              {correction.activity_name || 'Activité non spécifiée'}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                            <PersonIcon fontSize="small" color="action" />
                            <Typography variant="subtitle1">
                              {correction.student_name || 'Étudiant non spécifié'}
                            </Typography>
                          </Box>
                          
                          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ mb: 2 }}>
                            <Chip 
                              icon={<SchoolIcon />} 
                              label={correction.class_name || 'Classe non spécifiée'}
                              variant="outlined"
                              size="small"
                            />
                            
                            {correction.submission_date && (
                              <Chip 
                                icon={<AccessTimeIcon />} 
                                label={format(new Date(correction.submission_date), 'HH:mm', { locale: fr })}
                                variant="outlined"
                                size="small"
                              />
                            )}
                          </Stack>
                        </Grid>
                        
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <Box sx={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: { xs: 'flex-start', sm: 'flex-end' },
                            height: '100%',
                            justifyContent: 'space-between'
                          }}>
                            <Tooltip title="Note" arrow>
                              <Chip
                                icon={<GradeIcon />}
                                label={
                                  <Typography variant="body2" fontWeight="bold">
                                    {correction.grade} / {
                                      // Calculate total points from activity data
                                      correction.experimental_points !== undefined && 
                                      correction.theoretical_points !== undefined
                                        ? (correction.experimental_points + correction.theoretical_points)
                                        : 20
                                    }
                                  </Typography>
                                }
                                color={getGradeColor(
                                  ((correction.grade || 0) / (
                                    (correction.experimental_points || 0) + 
                                    (correction.theoretical_points || 0) || 20
                                  )) * 20
                                ) as "success" | "warning" | "error" | "info" | "primary" | "secondary" | "default"}
                                sx={{ 
                                  px: 0.5,
                                  fontSize: '0.9rem',
                                  height: 'auto',
                                  '& .MuiChip-label': { px: 1, py: 0.5 }
                                }}
                              />
                            </Tooltip>
                            
                            <Button
                              component={Link}
                              href={`/corrections/${correction.id}`}
                              variant="contained"
                              size="small"
                              color="primary"
                              sx={{ mt: { xs: 2, sm: 0 } }}
                            >
                              Voir
                            </Button>
                          </Box>
                        </Grid>
                      </Grid>
                      

                    </Paper>
                  </TimelineContent>
                </TimelineItem>
              );
            })}
          </Timeline>
        </Paper>
      ))}
    </Stack>
  );
}
