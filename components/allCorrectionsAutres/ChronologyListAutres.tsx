import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Alert, Paper, Typography, Button, Divider, Grid,
  CircularProgress
} from '@mui/material';
import CorrectionCardAutre from '@/components/allCorrections/CorrectionCard';
import { useSnackbar } from 'notistack';
import ErrorDisplay from '@/components/ui/ErrorDisplay';
import { changeCorrectionAutreStatus } from '@/lib/services/correctionsAutresService';
import { CorrectionAutreEnriched } from '@/lib/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ChronologyListAutresProps {
  filteredCorrections: CorrectionAutreEnriched[];
  error: Error | null;
  activeFilters: string[];
  handleClearAllFilters: () => void;
  getGradeColor: (grade: number) => "success" | "info" | "primary" | "warning" | "error";
  highlightedIds?: string[];
  recentFilter?: boolean;
  refreshCorrections?: () => Promise<void>;
  isLoading?: boolean; // Ajout d'une propriété pour indiquer l'état de chargement
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
  recentFilter = false,
  refreshCorrections,
  isLoading = false
}: ChronologyListAutresProps) {
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
                  <Grid size={{ xs: 12, md: 6, lg: 4 }} key={correction.id}>
                    <CorrectionCardAutre 
                      correction={correction}
                      highlighted={isHighlighted}
                      getGradeColor={getGradeColor}
                      showClass={true}
                      showStudent={true}
                      onChangeStatus={handleChangeStatus}
                    />
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        ))}
    </Box>
  );
}