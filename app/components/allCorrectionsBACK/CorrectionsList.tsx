import React, { useEffect } from 'react';
import {
  Typography,
  Paper,
  Box,
  Stack,
  Button,
  Chip,
  Alert,
  Tooltip,
  Fade,
  Grid,
} from '@mui/material';
import Link from 'next/link';
import { alpha } from '@mui/material/styles';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';
import AssignmentIcon from '@mui/icons-material/Assignment';
import GradeIcon from '@mui/icons-material/Grade';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
//
// Use the existing Correction type without modification
import { Correction } from '@/app/components/CorrectionsDataProvider';

interface CorrectionsListProps {
  filteredCorrections: Correction[];
  error: string;
  activeFilters: string[];
  handleClearAllFilters: () => void;
  getGradeColor: (grade: number) => string;
  highlightedIds: string[];
  recentFilter: boolean;
}

export default function CorrectionsList({
  filteredCorrections,
  error,
  activeFilters,
  handleClearAllFilters,
  getGradeColor,
  highlightedIds,
  recentFilter
}: CorrectionsListProps) {
  
  // Automatically scroll to highlighted item
  useEffect(() => {
    if (highlightedIds.length > 0) {
      // Set a small timeout to ensure DOM is ready
      const timer = setTimeout(() => {
        const firstHighlightedElement = document.getElementById(`correction-${highlightedIds[0]}`);
        if (firstHighlightedElement) {
          firstHighlightedElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [highlightedIds]);
  
  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
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
  
  return (
    <Stack spacing={2}>
      {filteredCorrections.map((correction) => {
        // Explicitly check if the correction's ID is in the highlighted list
        const isHighlighted = highlightedIds.includes(correction.id.toString());
        
        // Check if it's recent (last 24h)
        const isRecent = recentFilter || 
          (correction.submission_date && 
           new Date().getTime() - new Date(correction.submission_date).getTime() < 24 * 60 * 60 * 1000);
        
        return (
          <Fade
            key={correction.id}
            in={true}
            timeout={300}
          >
            <Paper
              id={`correction-${correction.id}`}
              elevation={isHighlighted ? 6 : 1}
              sx={{
                p: 3,
                position: 'relative',
                borderRadius: 2,
                transition: 'all 0.3s ease',
                transform: isHighlighted ? 'scale(1.01)' : 'scale(1)',
                borderLeft: isHighlighted ? '5px solid' : '1px solid',
                borderLeftColor: isHighlighted 
                  ? theme => theme.palette.secondary.main 
                  : theme => alpha(theme.palette.divider, 0.1),
                bgcolor: isHighlighted 
                  ? theme => alpha(theme.palette.secondary.light, 0.05)
                  : 'background.paper',
                '&:hover': {
                  boxShadow: 4,
                  transform: 'translateY(-2px)',
                },
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
                {/* Student and Grade Info */}
                <Grid size={{ xs: 12, sm: 8 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                    <PersonIcon color="primary" />
                    <Typography variant="h6" component="h3">
                      {correction.student_name}
                    </Typography>
                  </Box>
                  
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
                    <Chip 
                      icon={<SchoolIcon />} 
                      label={correction.class_name}
                      variant="outlined"
                      size="small"
                    />
                    
                    <Chip 
                      icon={<AssignmentIcon />} 
                      label={correction.activity_name}
                      variant="outlined"
                      size="small"
                    />
                    
                    {correction.submission_date && (
                      <Chip 
                        icon={<AccessTimeIcon />} 
                        label={format(new Date(correction.submission_date), 'PPP', { locale: fr })}
                        variant="outlined"
                        size="small"
                      />
                    )}
                  </Stack>
                </Grid>
                
                {/* Grade and Actions */}
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
                          fontSize: '1rem',
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
          </Fade>
        );
      })}
    </Stack>
  );
}
