import React from 'react';
import { 
  Grid, 
  Paper, 
  Typography, 
  Box,
  TableContainer, 
  Table, 
  TableHead, 
  TableRow, 
  TableCell, 
  TableBody, 
  Chip, 
  Alert
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import GradeDistributionChart from './charts/GradeDistributionChart';
import { Correction, StudentStats } from './types';
import { getGradeColor, getMuiColorProps } from './utils/gradeUtils';

interface StudentStatisticsProps {
  corrections: Correction[];
  stats: StudentStats;
}

export default function StudentStatistics({ corrections, stats }: StudentStatisticsProps) {
  const getActivityDistributionData = () => {
    const activityMap = new Map();
    
    corrections
      .filter(c => c.grade !== null && c.activity_id)
      .forEach(c => {
        const activityName = c.activity_name || `Activité ${c.activity_id}`;
        if (!activityMap.has(activityName)) {
          activityMap.set(activityName, {
            id: c.activity_id,
            name: activityName,
            count: 0,
            totalGrade: 0
          });
        }
        
        const activityData = activityMap.get(activityName);
        activityData.count++;
        activityData.totalGrade += c.grade || 0;
      });
    
    return Array.from(activityMap.values()).map(activity => ({
      ...activity,
      averageGrade: activity.count > 0 ? (activity.totalGrade / activity.count).toFixed(1) : 0
    }));
  };

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 6 }}>
        <GradeDistributionChart corrections={corrections} stats={stats} />
      </Grid>
      
      <Grid size={{ xs: 12, md: 6 }}>
        <Paper elevation={2} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
          <Typography variant="h6" gutterBottom>
            Détails par activité
          </Typography>
          
          {getActivityDistributionData().length > 0 ? (
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Activité</TableCell>
                    <TableCell align="center">Nombre de corrections</TableCell>
                    <TableCell align="center">Note moyenne</TableCell>
                    <TableCell>Écart par rapport à la moyenne</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {getActivityDistributionData().map((activity) => (
                    <TableRow key={`activity-${activity.id}`} hover>
                      <TableCell>{activity.name}</TableCell>
                      <TableCell align="center">{activity.count}</TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={`${activity.averageGrade}/20`}
                          color={getGradeColor(parseFloat(activity.averageGrade))}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {stats && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {parseFloat(activity.averageGrade) > stats.averageGrade ? (
                              <TrendingUpIcon color="success" />
                            ) : parseFloat(activity.averageGrade) < stats.averageGrade ? (
                              <TrendingDownIcon color="error" />
                            ) : (
                              <span>⟺</span>
                            )}
                            <Typography variant="body2">
                              {(parseFloat(activity.averageGrade) - stats.averageGrade).toFixed(1)} pts
                            </Typography>
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity="info">
              Aucune activité disponible pour afficher les détails.
            </Alert>
          )}
        </Paper>
      </Grid>
    </Grid>
  );
}
