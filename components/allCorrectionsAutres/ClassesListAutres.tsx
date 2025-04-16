import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Alert, Paper, Typography, Button, Divider, Grid,
  Accordion, AccordionSummary, AccordionDetails, Chip,
  CircularProgress
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CorrectionCardAutre from '@/components/allCorrections/CorrectionCard';
import { useSnackbar } from 'notistack';
import ErrorDisplay from '@/components/ui/ErrorDisplay';
import { changeCorrectionAutreStatus } from '@/lib/services/correctionsAutresService';
import { CorrectionAutreEnriched } from '@/lib/types';

interface ClassesListAutresProps {
  filteredCorrections: CorrectionAutreEnriched[];
  error: Error | null;
  activeFilters: string[];
  handleClearAllFilters: () => void;
  getGradeColor: (grade: number) => "success" | "info" | "primary" | "warning" | "error";
  highlightedIds?: string[]; // IDs explicitement mis en évidence
  recentFilter?: boolean; // Indique si le filtre "recent" est actif
  subClassFilter?: string; // Make sure this is optional and of type string
  refreshCorrections?: () => Promise<void>;
  isLoading?: boolean; // Ajout d'une propriété pour indiquer l'état de chargement
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
  refreshCorrections,
  isLoading = false
}: ClassesListAutresProps) {
  const { enqueueSnackbar } = useSnackbar();

  // Handle changing the status of a correction to a specific value
  const handleChangeStatus = async (correctionId: number, newStatus: string): Promise<void> => {
    try {
      await changeCorrectionAutreStatus(correctionId, newStatus);
      
      // Rafraîchir la liste des corrections si nécessaire
      if (refreshCorrections) {
        await refreshCorrections();
      }
      
      enqueueSnackbar(`Statut de la correction mis à jour avec succès`, { variant: 'success' });
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
      enqueueSnackbar(`Erreur lors de la mise à jour du statut: ${error instanceof Error ? error.message : 'Erreur inconnue'}`, { variant: 'error' });
    }
  };

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

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
        <CircularProgress sx={{ mb: 2 }} />
        <Typography variant="body1" color="text.secondary">
          Chargement des corrections en cours...
        </Typography>
      </Box>
    );
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
                  <Grid size={{ xs: 12, md: 6, lg: 4 }} key={correction.id}>
                    <CorrectionCardAutre 
                      correction={correction}
                      highlighted={isHighlighted}
                      getGradeColor={getGradeColor}
                      showClass={false}
                      showStudent={true}
                      showActivity={true}
                      onChangeStatus={handleChangeStatus}
                    />
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