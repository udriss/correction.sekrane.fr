import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  Button,
  Alert,
  Divider,
} from '@mui/material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import ErrorDisplay from '../ui/ErrorDisplay';
import { CorrectionAutreEnriched } from '@/lib/types';
import Link from 'next/link';
import { alpha } from '@mui/material/styles';
import VisibilityIcon from '@mui/icons-material/Visibility';

interface ChronologyListAutresProps {
  filteredCorrections: CorrectionAutreEnriched[];
  error: Error | null;
  activeFilters: string[];
  handleClearAllFilters: () => void;
  getGradeColor: (grade: number) => "success" | "info" | "primary" | "warning" | "error";
  highlightedIds?: string[];
  recentFilter?: boolean;
}

type GroupedCorrections = {
  [key: string]: CorrectionAutreEnriched[];
};

export default function ChronologyListAutres({
  filteredCorrections,
  error,
  activeFilters,
  handleClearAllFilters,
  getGradeColor,
  highlightedIds = [],
  recentFilter = false
}: ChronologyListAutresProps) {
  if (error) {
    return <ErrorDisplay error={error} />;
  }

  if (!filteredCorrections || filteredCorrections.length === 0) {
    return (
      <Alert 
        severity="info" 
        sx={{ 
          mt: 2,
          display: 'flex',
          alignItems: 'center',
          '& .MuiAlert-message': { flex: 1 }
        }}
        action={
          activeFilters.length > 0 ? (
            <Button color="inherit" size="small" onClick={handleClearAllFilters}>
              Effacer les filtres
            </Button>
          ) : undefined
        }
      >
        Aucune correction trouvée
        {activeFilters.length > 0 && " avec les filtres actuels"}
      </Alert>
    );
  }

  // Grouper les corrections par date
  const groupedCorrections = filteredCorrections.reduce((acc: GroupedCorrections, correction) => {
    const date = correction.submission_date 
      ? format(new Date(correction.submission_date), 'PP', { locale: fr })
      : 'Date non spécifiée';

    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(correction);
    return acc;
  }, {});


  return (
    <Box>
      {Object.entries(groupedCorrections)
        .sort(([dateA], [dateB]) => {
          if (dateA === 'Date non spécifiée') return 1;
          if (dateB === 'Date non spécifiée') return -1;
          return new Date(dateB).getTime() - new Date(dateA).getTime();
        })
        .map(([date, corrections]) => (
          <Box key={date} sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              {date}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              {corrections.map((correction) => {
                const isHighlighted = highlightedIds.includes(correction.id.toString());

                return (
                  <Grid size={{ xs: 12, sm:6, md: 4 }} key={correction.id} component="div">
                    <Card 
                      sx={{ 
                        position: 'relative',
                        height: '100%',
                        ...(isHighlighted && {
                          border: '2px solid',
                          borderColor: 'primary.main',
                          boxShadow: (theme) => `0 0 15px ${alpha(theme.palette.primary.main, 0.5)}`
                        })
                      }}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Chip 
                            label={correction.grade?.toFixed(2)}
                            color={getGradeColor(correction.grade || 0)}
                            size="medium"
                          />
                          <Link href={`/corrections_autres/${correction.id}`} passHref>
                            <IconButton size="small" component="a">
                              <Tooltip title="Voir les détails">
                                <VisibilityIcon />
                              </Tooltip>
                            </IconButton>
                          </Link>
                        </Box>

                        <Typography variant="h6" component="div" gutterBottom noWrap>
                          {correction.activity_name || 'Activité inconnue'}
                        </Typography>

                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {correction.student_name || 'Étudiant inconnu'}
                        </Typography>

                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {correction.class_name || 'Classe inconnue'}
                        </Typography>

                        {/* Points par partie */}
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="caption" color="text.secondary">
                            Points par partie:
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                            {correction.points_earned.map((points, index) => (
                              <Chip
                                key={index}
                                label={`P${index + 1}: ${points}`}
                                size="small"
                                variant="outlined"
                              />
                            ))}
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        ))}
    </Box>
  );
}