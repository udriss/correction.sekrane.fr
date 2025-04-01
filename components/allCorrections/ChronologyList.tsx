import React from 'react';
import {
  Box, Alert, Paper, Typography, Button, Card, CardContent, Chip, Divider
} from '@mui/material';
import {
  Timeline, TimelineItem, TimelineContent, TimelineSeparator, 
  TimelineDot, TimelineConnector, TimelineOppositeContent
} from '@mui/lab';

import CancelIcon from '@mui/icons-material/Cancel';
import CalendarIcon from '@mui/icons-material/CalendarMonth';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';
import Link from 'next/link';
import dayjs from 'dayjs';
import { Correction as ProviderCorrection } from '@/app/components/CorrectionsDataProvider';
import { alpha } from '@mui/material/styles';

interface ChronologyListProps {
  filteredCorrections: ProviderCorrection[];
  error: string | null;
  activeFilters: string[];
  handleClearAllFilters: () => void;
  getGradeColor: (grade: number) => string;
  highlightedIds?: string[];
  recentFilter?: boolean; // Nouvel ajout pour supporter le filtre recent
}

const ChronologyList: React.FC<ChronologyListProps> = ({
  filteredCorrections,
  error,
  activeFilters,
  handleClearAllFilters,
  getGradeColor,
  highlightedIds = [],
  recentFilter = false // Valeur par défaut false
}) => {
  // Trier les corrections par date (plus récent en premier)
  const sortedCorrections = [...filteredCorrections].sort((a, b) => 
    new Date(b.submission_date).getTime() - new Date(a.submission_date).getTime()
  );

  // Grouper par mois/année pour une meilleure organisation
  const groupedByMonth: Record<string, ProviderCorrection[]> = {};
  
  sortedCorrections.forEach(correction => {
    const date = dayjs(correction.submission_date);
    const monthKey = date.format('YYYY-MM');
    const monthDisplay = date.format('MMMM YYYY');
    
    if (!groupedByMonth[monthKey]) {
      groupedByMonth[monthKey] = [];
    }
    
    groupedByMonth[monthKey].push(correction);
  });

  // Fonction pour déterminer si une correction doit être mise en évidence
  const shouldHighlight = (correction: ProviderCorrection) => {
    // Si l'ID est explicitement dans la liste des IDs à mettre en évidence
    if (highlightedIds.includes(correction.id.toString())) {
      return true;
    }
    
    // Si le filtre "recent" est actif, vérifier si c'est une correction récente (24h)
    if (recentFilter) {
      const recentDate = dayjs().subtract(24, 'hour');
      const correctionDate = dayjs(correction.created_at || correction.submission_date);
      return correctionDate.isAfter(recentDate);
    }
    
    return false;
  };

  return (
    <Box>
      {error ? (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3,
            p: 0,
            border: 1,
            borderColor: 'error.main',
            '& .MuiAlert-icon': {
              color: 'error.main'
            }
          }}
        >
          {error}
        </Alert>
      ) : filteredCorrections.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>Aucune correction trouvée</Typography>
          <Typography variant="body2" color="text.secondary">
            Ajustez vos filtres ou ajoutez des corrections
          </Typography>
          {activeFilters.length > 0 && (
            <Button 
              variant="outlined" 
              onClick={handleClearAllFilters} 
              startIcon={<CancelIcon />}
              sx={{ mt: 2 }}
            >
              Effacer tous les filtres
            </Button>
          )}
        </Paper>
      ) : (
        <Box>
          {Object.entries(groupedByMonth).map(([monthKey, monthCorrections]) => (
            <Box key={monthKey} sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2, textTransform: 'capitalize' }}>
                {dayjs(monthKey).locale('fr').format('MMMM YYYY')}
              </Typography>
              <Timeline position="alternate" sx={{ p: 0 }}>
                {monthCorrections.map(correction => {
                  // Vérifier si cette correction doit être mise en évidence
                  const isHighlighted = shouldHighlight(correction);
                  
                  return (
                    <TimelineItem key={correction.id}>
                      <TimelineOppositeContent sx={{ color: 'text.secondary' }}>
                        {dayjs(correction.submission_date).locale('fr').format('DD MMM YYYY - HH:mm')}
                      </TimelineOppositeContent>
                      <TimelineSeparator>
                        <TimelineDot color={getGradeColor(correction.grade) as "success" | "error" | "info" | "warning" | "primary" | "secondary" | "grey" | undefined}>
                          <AssignmentIcon />
                        </TimelineDot>
                        <TimelineConnector />
                      </TimelineSeparator>
                      <TimelineContent>
                        <Card 
                          variant="outlined" 
                          sx={{ 
                            mt: 1, 
                            mb: 3,
                            // Styles spécifiques pour les corrections mises en évidence
                            border: isHighlighted ? '2px solid' : '1px solid',
                            borderColor: isHighlighted ? 'secondary.main' : 'divider',
                            boxShadow: isHighlighted ? (theme) => `0 0 15px ${alpha(theme.palette.secondary.main, 0.5)}` : 'none',
                            position: 'relative'
                          }}
                        >
                          {/* Badge "Nouveau" pour les corrections mises en évidence */}
                          {isHighlighted && (
                            <Chip
                              label="Nouveau"
                              color="secondary"
                              size="small"
                              sx={{
                                position: 'absolute',
                                top: 10,
                                right: 10,
                                zIndex: 1,
                                fontWeight: 'bold'
                              }}
                            />
                          )}
                          
                          <CardContent>
                            <Link href={`/corrections/${correction.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                              <Typography variant="h6" component="div">
                                {correction.activity_name}
                              </Typography>
                            </Link>
                            <Divider sx={{ my: 1 }} />
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <PersonIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                              <Typography variant="body2" color="text.secondary">
                                {correction.student_name}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <SchoolIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                              <Typography variant="body2" color="text.secondary">
                                {correction.class_name}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                              <Chip 
                                size="small" 
                                color={getGradeColor(correction.grade) as "success" | "error" | "info" | "warning" | "primary" | "secondary" | "default"} 
                                label={`${correction.grade} / 20`}
                              />
                              <Typography variant="caption" color="text.secondary">
                                Corrigé le {dayjs(correction.updated_at).locale('fr').format('DD/MM/YYYY')}
                              </Typography>
                            </Box>
                          </CardContent>
                        </Card>
                      </TimelineContent>
                    </TimelineItem>
                  );
                })}
              </Timeline>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default ChronologyList;
