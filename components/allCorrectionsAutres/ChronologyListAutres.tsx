import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Alert, Typography, Button, Divider, Grid,
  CircularProgress
} from '@mui/material';
import CorrectionCardAutre from '@/components/allCorrectionsAutres/CorrectionCard';
import { useSnackbar } from 'notistack';
import ErrorDisplay from '@/components/ui/ErrorDisplay';
import { changeCorrectionAutreStatus } from '@/lib/services/correctionsAutresService';
import { CorrectionAutreEnriched } from '@/lib/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getBatchShareCodes } from '@/lib/services/shareService';

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
  getStudentById?: (studentId: number | null) => any; // Fonction pour récupérer un étudiant par son ID
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
  isLoading,
  getStudentById
}: ChronologyListAutresProps) {
  const { enqueueSnackbar } = useSnackbar();
  const [shareCodesMap, setShareCodesMap] = useState<Map<string, string>>(new Map());

  // Chargement en masse des codes de partage quand les corrections changent
  useEffect(() => {
    const loadShareCodes = async () => {
      if (filteredCorrections && filteredCorrections.length > 0) {
        const correctionIds = filteredCorrections.map(c => c.id.toString());
        const shareCodes = await getBatchShareCodes(correctionIds);
        setShareCodesMap(shareCodes);
      } else {
        setShareCodesMap(new Map());
      }
    };
    
    loadShareCodes();
  }, [filteredCorrections]);

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

  // Message "Aucune correction trouvée" uniquement s'il n'y a pas de chargement ET que la liste est vide
  if (!isLoading && (!filteredCorrections || filteredCorrections.length === 0)) {
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
    <>
          {/* Message "Aucune correction trouvée" uniquement s'il n'y a pas de chargement ET que la liste est vide */}
          {!isLoading && (!filteredCorrections || filteredCorrections.length === 0) && (
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
          )}

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
                      preloadedShareCode={shareCodesMap.get(correction.id.toString())}
                      studentSubClass={getStudentById && correction.student_id ? getStudentById(correction.student_id)?.sub_class : null}
                    />
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        ))}
    </Box>
    </>
  );
}