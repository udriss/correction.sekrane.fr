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

interface StudentsListAutresProps {
  filteredCorrections: CorrectionAutreEnriched[];
  error: Error | null;
  activeFilters: string[];
  handleClearAllFilters: () => void;
  getGradeColor: (grade: number) => "success" | "info" | "primary" | "warning" | "error";
  highlightedIds?: string[];
  recentFilter?: boolean;
  refreshCorrections?: () => Promise<void>;
}

interface StudentGroup {
  studentName: string;
  studentId: number | null;
  corrections: CorrectionAutreEnriched[];
  averageGrade: number;
  totalCorrections: number;
  className: string;
}

export default function StudentsListAutres({
  filteredCorrections,
  error,
  activeFilters,
  handleClearAllFilters,
  getGradeColor,
  highlightedIds = [],
  recentFilter = false,
  refreshCorrections
}: StudentsListAutresProps) {
  // Grouper les corrections par étudiant
  const studentGroups = useMemo(() => {
    const groups = new Map<string, CorrectionAutreEnriched[]>();
    
    filteredCorrections.forEach(correction => {
      const studentKey = correction.student_id ? 
        `${correction.student_id}-${correction.student_name}` : 
        'Sans étudiant';
      
      if (!groups.has(studentKey)) {
        groups.set(studentKey, []);
      }
      groups.get(studentKey)?.push(correction);
    });

    // Convertir la Map en tableau et calculer les statistiques
    return Array.from(groups.entries()).map(([studentKey, corrections]): StudentGroup => {
      const firstCorrection = corrections[0];
      const validGrades = corrections.filter(c => typeof c.grade === 'number').map(c => c.grade as number);
      const averageGrade = validGrades.length > 0
        ? validGrades.reduce((sum, grade) => sum + grade, 0) / validGrades.length
        : 0;

      return {
        studentName: firstCorrection.student_name || 'Étudiant inconnu',
        studentId: firstCorrection.student_id,
        corrections,
        averageGrade,
        totalCorrections: corrections.length,
        className: firstCorrection.class_name || 'Classe inconnue'
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
      {studentGroups.map(({ studentName, studentId, corrections, averageGrade, totalCorrections, className }) => (
        <Accordion key={`${studentId}-${studentName}`} defaultExpanded={studentGroups.length === 1}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
              <Box>
                <Typography variant="h6">{studentName}</Typography>
                <Typography variant="body2" color="text.secondary">{className}</Typography>
              </Box>
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
                                <ExpandMoreIcon />
                              </Tooltip>
                            </IconButton>
                          </Link>
                        </Box>

                        <Typography variant="h6" component="div" gutterBottom noWrap>
                          {correction.activity_name || 'Activité inconnue'}
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