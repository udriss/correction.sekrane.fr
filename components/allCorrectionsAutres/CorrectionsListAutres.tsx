import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Button,
  Alert,
  CircularProgress,
  Typography
} from '@mui/material';
import ErrorDisplay from '../ui/ErrorDisplay';
import CorrectionCardAutre from '@/components/allCorrectionsAutres/CorrectionCard';
import { CorrectionAutreEnriched } from '@/lib/types';
import { useBatchDelete } from '@/hooks/useBatchDelete';
import { changeCorrectionAutreStatus } from '@/lib/services/correctionsAutresService';
import { useSnackbar } from 'notistack';
import { getBatchShareCodes } from '@/lib/services/shareService';


interface CorrectionsListAutresProps {
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

export default function CorrectionsListAutres({
  filteredCorrections,
  error,
  activeFilters,
  handleClearAllFilters,
  getGradeColor,
  highlightedIds = [],
  recentFilter = false,
  refreshCorrections,
  isLoading = false,
  getStudentById
}: CorrectionsListAutresProps) {
  const { batchDeleteMode, selectedCorrections, setSelectedCorrections, deletingCorrections } = useBatchDelete();
  const { enqueueSnackbar } = useSnackbar();

  const [localSelected, setLocalSelected] = useState<string[]>([]);
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

  // Gestion de la sélection des corrections pour la suppression par lot
  const handleCorrectionSelect = (correctionId: string) => {
    const newSelected = localSelected.includes(correctionId) 
      ? localSelected.filter(id => id !== correctionId)
      : [...localSelected, correctionId];
    setLocalSelected(newSelected);
    setSelectedCorrections(newSelected);
  };

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

  // Si une erreur est présente, on l'affiche
  if (error) {
    return <ErrorDisplay error={error} />;
  }

  // Afficher un spinner pendant le chargement
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

  // Si aucune correction n'est trouvée
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
    <Grid container spacing={2}>
      {filteredCorrections.map((correction) => {
        const isHighlighted = highlightedIds.includes(correction.id.toString());

        return (
          <Grid 
            size={{ xs: 12, md: 6, lg: 4 }}
            key={correction.id}
          >
            <CorrectionCardAutre 
              correction={correction}
              highlighted={isHighlighted}
              getGradeColor={getGradeColor}
              showClass={true}
              showStudent={true}
              showActivity={true}
              onChangeStatus={handleChangeStatus}
              preloadedShareCode={shareCodesMap.get(correction.id.toString())}
              studentSubClass={getStudentById && correction.student_id ? getStudentById(correction.student_id)?.sub_class : null}
            />
          </Grid>
        );
      })}
    </Grid>
  );
}