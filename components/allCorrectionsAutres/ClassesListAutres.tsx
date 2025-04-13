import React, { useMemo } from 'react';
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
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import ErrorDisplay from '../ui/ErrorDisplay';
import { CorrectionAutreEnriched } from '@/lib/types';
import Link from 'next/link';
import { alpha } from '@mui/material/styles';

interface ClassesListAutresProps {
  filteredCorrections: CorrectionAutreEnriched[];
  error: Error | null;
  activeFilters: string[];
  handleClearAllFilters: () => void;
  getGradeColor: (grade: number) => "success" | "info" | "primary" | "warning" | "error";
  highlightedIds?: string[];
  refreshCorrections?: () => Promise<void>;
}

interface ClassGroup {
  className: string;
  corrections: CorrectionAutreEnriched[];
  averageGrade: number;
  totalCorrections: number;
}

export default function ClassesListAutres({
  filteredCorrections,
  error,
  activeFilters,
  handleClearAllFilters,
  getGradeColor,
  highlightedIds = [],
  refreshCorrections
}: ClassesListAutresProps) {
  // Grouper les corrections par classe
  const classGroups = useMemo(() => {
    const groups = new Map<string, CorrectionAutreEnriched[]>();
    
    filteredCorrections.forEach(correction => {
      const className = correction.class_name || 'Sans classe';
      if (!groups.has(className)) {
        groups.set(className, []);
      }
      groups.get(className)?.push(correction);
    });

    // Convertir la Map en tableau et calculer les statistiques
    return Array.from(groups.entries()).map(([className, corrections]): ClassGroup => {
      const validGrades = corrections.filter(c => typeof c.grade === 'number').map(c => c.grade as number);
      const averageGrade = validGrades.length > 0
        ? validGrades.reduce((sum, grade) => sum + grade, 0) / validGrades.length
        : 0;

      return {
        className,
        corrections,
        averageGrade,
        totalCorrections: corrections.length
      };
    }).sort((a, b) => b.averageGrade - a.averageGrade);
  }, [filteredCorrections]);

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

  return (
    <Box>
      {classGroups.map(({ className, corrections, averageGrade, totalCorrections }) => (
        <Accordion key={className} defaultExpanded={classGroups.length === 1}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
              <Typography variant="h6">{className}</Typography>
              <Chip 
                label={`${averageGrade.toFixed(2)}/20`}
                color={getGradeColor(averageGrade)}
                size="small"
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
                {totalCorrections} correction{totalCorrections > 1 ? 's' : ''}
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              {corrections.map((correction) => {
                const isHighlighted = highlightedIds.includes(correction.id.toString());

                return (
                  <Grid 
                  size={{ xs: 12, sm:6, md: 4 }}
                    key={correction.id}
                  >
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
                                <ExpandMoreIcon />
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

                        {/* Points par partie */}
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="caption" color="text.secondary">
                            Points par partie:
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                            {correction.points_earned.map((points: number, index: number) => (
                              <Chip
                                key={index}
                                label={`P${index + 1}: ${points}`}
                                size="small"
                                variant="outlined"
                              />
                            ))}
                          </Box>
                        </Box>

                        <Typography 
                          variant="caption" 
                          color="text.secondary"
                          sx={{ 
                            display: 'block',
                            mt: 2,
                            fontStyle: 'italic'
                          }}
                        >
                          {correction.submission_date 
                            ? format(new Date(correction.submission_date), 'PP', { locale: fr })
                            : 'Date non spécifiée'}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}