import React, { useEffect } from 'react';
import {
  Typography,
  Paper,
  Box,
  Stack,
  Button,
  Chip,
  Avatar,
  Alert,
  Divider,
  Grid,
  Tooltip
} from '@mui/material';
import Link from 'next/link';
import { alpha } from '@mui/material/styles';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SchoolIcon from '@mui/icons-material/School';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PersonIcon from '@mui/icons-material/Person';
import GradeIcon from '@mui/icons-material/Grade';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Use the existing Correction type without modification
import { Correction } from '@/app/components/CorrectionsDataProvider';

interface StudentsListProps {
  filteredCorrections: Correction[];
  error: string;
  activeFilters: string[];
  handleClearAllFilters: () => void;
  getGradeColor: (grade: number) => string;
  highlightedIds: string[];
  recentFilter: boolean;
}

export default function StudentsList({
  filteredCorrections,
  error,
  activeFilters,
  handleClearAllFilters,
  getGradeColor,
  highlightedIds,
  recentFilter
}: StudentsListProps) {
  
  // Automatically scroll to highlighted items
  useEffect(() => {
    if (highlightedIds.length > 0) {
      // Set a small timeout to ensure DOM is ready
      const timer = setTimeout(() => {
        const firstHighlightedElement = document.getElementById(`student-correction-${highlightedIds[0]}`);
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
  
  // Group corrections by student
  const studentCorrections: { [key: string]: Correction[] } = {};
  
  for (const correction of filteredCorrections) {
    const studentId = correction.student_id?.toString() || '';
    if (!studentId) continue;
    
    if (!studentCorrections[studentId]) {
      studentCorrections[studentId] = [];
    }
    studentCorrections[studentId].push(correction);
  }
  
  return (
    <Stack spacing={4}>
      {Object.entries(studentCorrections).map(([studentId, corrections]) => {
        const student = corrections[0]; // Use first correction to get student info
        
        // Check if any of this student's corrections are highlighted
        const hasHighlightedCorrections = corrections.some(
          c => highlightedIds.includes(c.id.toString())
        );
        
        // Check if any corrections are recent
        const hasRecentCorrections = recentFilter || corrections.some(
          c => c.submission_date && 
               (new Date().getTime() - new Date(c.submission_date).getTime() < 24 * 60 * 60 * 1000)
        );
        
        return (
          <Paper
            key={studentId}
            elevation={hasHighlightedCorrections ? 3 : 1}
            sx={{
              p: 3,
              position: 'relative',
              borderRadius: 2,
              transition: 'all 0.3s ease',
              borderLeft: hasHighlightedCorrections ? '5px solid' : '1px solid',
              borderLeftColor: hasHighlightedCorrections 
                ? theme => theme.palette.secondary.main 
                : theme => alpha(theme.palette.divider, 0.1),
              bgcolor: hasHighlightedCorrections 
                ? theme => alpha(theme.palette.secondary.light, 0.05)
                : 'background.paper',
              overflow: 'hidden',
            }}
          >
            {hasHighlightedCorrections && (
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
            
            {hasRecentCorrections && !hasHighlightedCorrections && (
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
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
              <Avatar
                sx={{ 
                  width: 60, 
                  height: 60, 
                  bgcolor: 'primary.main',
                  fontSize: '1.5rem',
                  boxShadow: 2
                }}
              >
                {student.student_name ? student.student_name.charAt(0) : 'S'}
              </Avatar>
              <Box>
                <Typography variant="h5" component="h3" fontWeight="bold">
                  {student.student_name || 'Étudiant'}
                </Typography>
                <Box sx={{ display: 'flex', mt: 0.5, gap: 1 }}>
                  <Chip
                    icon={<SchoolIcon fontSize="small" />}
                    label={student.class_name || 'Classe non spécifiée'}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    icon={<AssignmentIcon fontSize="small" />}
                    label={`${corrections.length} correction${corrections.length > 1 ? 's' : ''}`}
                    size="small"
                    variant="outlined"
                  />
                </Box>
              </Box>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
              Corrections:
            </Typography>
            
            <Stack spacing={2}>
              {corrections.map((correction) => {
                const isHighlighted = highlightedIds.includes(correction.id.toString());
                const isRecent = recentFilter || 
                  (correction.submission_date && 
                   new Date().getTime() - new Date(correction.submission_date).getTime() < 24 * 60 * 60 * 1000);
                
                return (
                  <Paper
                    key={correction.id}
                    id={`student-correction-${correction.id}`}
                    elevation={isHighlighted ? 4 : 0}
                    sx={{
                      p: 2,
                      borderRadius: 1.5,
                      transition: 'all 0.2s ease',
                      transform: isHighlighted ? 'scale(1.01)' : 'scale(1)',
                      border: '1px solid',
                      borderColor: isHighlighted
                        ? 'secondary.main'
                        : theme => alpha(theme.palette.divider, 0.1),
                      bgcolor: isHighlighted
                        ? theme => alpha(theme.palette.secondary.light, 0.05)
                        : theme => alpha(theme.palette.background.default, 0.5),
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
                          py: 0.25,
                          px: 1.5,
                          borderBottomLeftRadius: 8,
                          fontSize: '0.7rem',
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
                          py: 0.25,
                          px: 1.5,
                          borderBottomLeftRadius: 8,
                          fontSize: '0.7rem',
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
                          <AssignmentIcon color="primary" fontSize="small" />
                          <Typography variant="subtitle1" fontWeight="bold">
                            {correction.activity_name || 'Activité non spécifiée'}
                          </Typography>
                        </Box>
                        
                        {correction.submission_date && (
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1.5 }}>
                            <Chip
                              icon={<AccessTimeIcon fontSize="small" />}
                              label={format(new Date(correction.submission_date), 'PPP', { locale: fr })}
                              variant="outlined"
                              size="small"
                            />
                          </Box>
                        )}
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
                );
              })}
            </Stack>
          </Paper>
        );
      })}
    </Stack>
  );
}
