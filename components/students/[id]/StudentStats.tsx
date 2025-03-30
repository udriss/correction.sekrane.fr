import React from 'react';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  alpha,
  useTheme
} from '@mui/material';
import { StudentStats } from './types';
import { getGradeColor } from './utils/gradeUtils';

interface StudentStatsDisplayProps {
  stats: StudentStats;
}

export default function StudentStatsDisplay({ stats }: StudentStatsDisplayProps) {
  const theme = useTheme();

  // Get the color based on grade - handling variant colors like 'primary.light'
  const getGradeColorForTypography = (grade: number) => {
    const colorType = getGradeColor(grade);
    if (colorType.includes('.')) {
      const [base, variant] = colorType.split('.');
      // Type-safe access to palette properties
      const paletteColor = theme.palette[base as keyof typeof theme.palette];
      if (paletteColor && typeof paletteColor === 'object' && variant in paletteColor) {
        return (paletteColor as unknown as Record<string, string>)[variant];
      }
      return theme.palette.primary.main;
    }
    return `${colorType}.main`;
  };

  return (
    <Box sx={{ bgcolor: 'background.paper', p: 3 }}>
      <Grid container spacing={2} sx={{ display: 'flex', justifyContent: 'space-around' }}>
        <Grid size={{ xs: 6, sm: 6, md: 4, lg: 2 }} key="average-stat">
          <Paper sx={{ 
            p: 2, 
            textAlign: 'center', 
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            height: '100%',
            bgcolor: alpha(theme.palette.myBoxes.primary, 0.5),
            backdropFilter: 'blur(5px)',
            borderRadius: 2,
          }}>
            <Typography variant="overline" color="text.secondary">Moyenne</Typography>
            <Typography 
              variant="h3" 
              color={getGradeColorForTypography(isNaN(stats.averageGrade) ? 0 : stats.averageGrade)} 
              fontWeight="bold"
            >
              {isNaN(stats.averageGrade) || stats.gradedCount === 0 ? "N/A" : stats.averageGrade.toFixed(1)}
            </Typography>
            <Typography variant="overline" color="text.secondary">
              sur 20 
            </Typography>
            {stats.ungradedCount > 0 && (
              <Typography variant="caption" color="text.secondary" display="block">
                {stats.gradedCount}/{stats.totalCorrections} correction{stats.ungradedCount > 1 ? 's' : ''} non notée{stats.ungradedCount > 1 ? 's' : ''}
              </Typography>
            )}
          </Paper>
        </Grid>
        
        <Grid size={{ xs: 6, sm: 6, md: 4, lg: 2 }} key="best-grade-stat">
          <Paper sx={{ 
            p: 2, 
            textAlign: 'center', 
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            height: '100%',
            bgcolor: alpha(theme.palette.myBoxes.primary, 0.5),
            backdropFilter: 'blur(5px)',
            borderRadius: 2,
          }}>
            <Typography variant="overline" color="text.secondary">Meilleure note</Typography>
            <Typography 
              variant="h3" 
              color={getGradeColorForTypography(isNaN(stats.bestGrade) ? 0 : stats.bestGrade)} 
              fontWeight="bold"
            >
              {isNaN(stats.bestGrade) || stats.gradedCount === 0 ? "N/A" : stats.bestGrade.toFixed(1)}
            </Typography>
            <Typography variant="overline" color="text.secondary">
              sur 20
            </Typography>
          </Paper>
        </Grid>
        
        <Grid size={{ xs: 6, sm: 6, md: 4, lg: 2 }} key="worst-grade-stat">
          <Paper sx={{ 
            p: 2, 
            textAlign: 'center', 
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            height: '100%',
            bgcolor: alpha(theme.palette.myBoxes.primary, 0.5),
            backdropFilter: 'blur(5px)',
            borderRadius: 2,
          }}>
            <Typography variant="overline" color="text.secondary">Pire note</Typography>
            <Typography 
              variant="h3" 
              color={getGradeColorForTypography(isNaN(stats.worstGrade) ? 0 : stats.worstGrade)} 
              fontWeight="bold"
            >
              {isNaN(stats.worstGrade) || stats.gradedCount === 0 ? "N/A" : stats.worstGrade.toFixed(1)}
            </Typography>
            <Typography variant="overline" color="text.secondary">
              sur 20
            </Typography>
          </Paper>
        </Grid>
        
        <Grid size={{ xs: 6, sm: 6, md: 4, lg: 2.2 }} key="corrections-count-stat">
          <Paper sx={{ 
            p: 2, 
            textAlign: 'center', 
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            height: '100%',
            bgcolor: alpha(theme.palette.myBoxes.primary, 0.5),
            backdropFilter: 'blur(5px)',
            borderRadius: 2,
          }}>
            <Typography variant="h3" color="text.primary" fontWeight="bold">
              {stats.totalCorrections}
            </Typography>
            <Typography variant="overline" color="text.secondary">
              {stats.totalCorrections <= 1 ? 'correction rendue' : 'corrections rendues'}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              {stats.gradedCount} notée{stats.gradedCount > 1 ? 's' : ''} 
              {stats.ungradedCount > 0 ? ` et ${stats.ungradedCount} en attente` : ''}
            </Typography>
          </Paper>
        </Grid>
        
        <Grid size={{ xs: 6, sm: 6, md: 4, lg: 2 }} key="activities-count-stat">
          <Paper sx={{ 
            p: 2, 
            textAlign: 'center', 
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            height: '100%',
            bgcolor: alpha(theme.palette.myBoxes.primary, 0.5),
            backdropFilter: 'blur(5px)',
            borderRadius: 2,
          }}>
            <Typography variant="h3" color="text.primary" fontWeight="bold">
              {stats.totalActivities}
            </Typography>
            <Typography variant="overline" color="text.secondary">
              {stats.totalActivities <= 1 ? 'activité réalisée' : 'activités réalisées'}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
