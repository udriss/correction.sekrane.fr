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
import Pagination from '@/components/Pagination';
import { changeCorrectionAutreStatus } from '@/lib/services/correctionsAutresService';
import { useSnackbar } from 'notistack';
import { getBatchShareCodes } from '@/lib/services/shareService';
import { useCorrectionsAutres } from '@/app/components/CorrectionsAutresDataProvider';


interface CorrectionsListAutresProps {
  error: Error | null;
  activeFilters: string[];
  handleClearAllFilters: () => void;
  getGradeColor: (grade: number) => "success" | "info" | "primary" | "warning" | "error";
  highlightedIds?: string[];
  recentFilter?: boolean;
  refreshCorrections?: () => Promise<void>;
  getStudentById?: (studentId: number | null) => any;
}

export default function CorrectionsListAutres({
  error,
  activeFilters,
  handleClearAllFilters,
  getGradeColor,
  highlightedIds = [],
  recentFilter = false,
  refreshCorrections,
  getStudentById
}: CorrectionsListAutresProps) {
  const { enqueueSnackbar } = useSnackbar();
  const { 
    corrections: filteredCorrections, 
    pagination, 
    goToPage, 
    setItemsPerPage, 
    isLoading 
  } = useCorrectionsAutres();

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

  // Afficher un spinner pendant le chargement uniquement s'il n'y a pas déjà des corrections filtrées
  if (isLoading && (!filteredCorrections || filteredCorrections.length === 0)) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
        <CircularProgress sx={{ mb: 2 }} />
        <Typography variant="body1" color="text.secondary">
          Chargement des corrections en cours...
        </Typography>
      </Box>
    );
  }

  return (
    <>
      {/* Message "Aucune correction disponible" uniquement s'il n'y a pas de chargement ET filteredCorrections indispo */}
      {isLoading === false && (!filteredCorrections) && (
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
          Aucune correction disponible
          {activeFilters.length > 0 && " avec les filtres actuels"}
        </Alert>
      )}

      {/* Message "Aucune correction trouvée" uniquement s'il n'y a pas de chargement ET que la liste est vide */}
      {isLoading === false && (filteredCorrections.length === 0) && (
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
      
      {/* Pagination en haut */}
      {filteredCorrections.length > 0 && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          itemsPerPage={pagination.itemsPerPage}
          onPageChange={goToPage}
          onItemsPerPageChange={setItemsPerPage}
          disabled={isLoading}
        />
      )}
      
      {/* Liste des corrections */}
      {filteredCorrections && filteredCorrections.length > 0 && (
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
      )}

      {/* Pagination en bas */}
      {filteredCorrections.length > 0 && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          itemsPerPage={pagination.itemsPerPage}
          onPageChange={goToPage}
          onItemsPerPageChange={setItemsPerPage}
          disabled={isLoading}
        />
      )}
    </>
  );
}