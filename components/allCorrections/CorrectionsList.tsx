import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Grid, Alert } from '@mui/material';
import { Correction } from '@/app/components/CorrectionsDataProvider';
import CorrectionCard from './CorrectionCard';
import { getBatchShareCodes } from '@/lib/services/shareService';
import { useSnackbar } from 'notistack';
import ErrorDisplay from '@/components/ui/ErrorDisplay';
import { toggleCorrectionActive, changeCorrectionStatus } from '@/lib/services/correctionService';

interface CorrectionsListProps {
  filteredCorrections: Correction[];
  error: Error | null;
  activeFilters: string[];
  handleClearAllFilters: () => void;
  getGradeColor: (grade: number) => "success" | "info" | "primary" | "warning" | "error";
  highlightedIds: string[];
  recentFilter: boolean;
  refreshCorrections?: () => Promise<void>;
}

const CorrectionsList: React.FC<CorrectionsListProps> = ({
  filteredCorrections,
  error,
  activeFilters,
  handleClearAllFilters,
  getGradeColor,
  highlightedIds,
  recentFilter,
  refreshCorrections
}) => {
  // État pour stocker les codes de partage
  const [shareCodesMap, setShareCodesMap] = useState<Map<string, string>>(new Map());
  const { enqueueSnackbar } = useSnackbar();
  
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
  const handleChangeStatus = async (correctionId: number, newStatus: string) => {
    try {
      // Utiliser la fonction utilitaire du service
      await changeCorrectionStatus(correctionId, newStatus);
      
      // Map status to readable name for the toast message
      const statusNames: Record<string, string> = {
        'ACTIVE': 'activée',
        'DEACTIVATED': 'désactivée',
        'ABSENT': 'marquée comme absent',
        'NON_RENDU': 'marquée comme non rendue',
        'NON_NOTE': 'marquée comme non notée'
      };
      
      // Show success message
      enqueueSnackbar(`Correction ${statusNames[newStatus] || 'mise à jour'} avec succès`, {
        variant: 'success',
        autoHideDuration: 3000,
      });
      
      // Refresh corrections data if a refresh function is provided
      if (refreshCorrections) {
        await refreshCorrections();
      }
      
    } catch (error) {
      console.error('Error changing correction status:', error);
      enqueueSnackbar(`Erreur: ${error instanceof Error ? error.message : 'Échec de la mise à jour'}`, {
        variant: 'error',
        autoHideDuration: 5000,
      });
      throw error; // Re-throw to let the CorrectionCard component know there was an error
    }
  };

  if (error) {
    return <ErrorDisplay error={error} />;
  }
  
  // Ensure filteredCorrections is always an array
  const corrections = Array.isArray(filteredCorrections) ? filteredCorrections : [];
  
  if (corrections.length === 0) {
    return (
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          {activeFilters.length > 0 
            ? "Aucune correction ne correspond aux filtres sélectionnés"
            : "Aucune correction n'a été ajoutée pour le moment"}
        </Typography>
        
        {activeFilters.length > 0 && (
          <Button 
            variant="outlined" 
            onClick={handleClearAllFilters}
            sx={{ mt: 2 }}
          >
            Effacer tous les filtres
          </Button>
        )}
      </Box>
    );
  }
  
  return (
    <Grid container spacing={2}>
      {corrections.map(correction => (
        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={correction.id}>
          <CorrectionCard
            correction={correction}
            getGradeColor={getGradeColor}
            preloadedShareCode={shareCodesMap.get(correction.id.toString())}
            highlighted={highlightedIds.includes(correction.id?.toString() || '')}
            showTopLabel={recentFilter && new Date(correction.submission_date).getTime() > Date.now() - 24 * 60 * 60 * 1000 ? '24h' : undefined}
            onChangeStatus={handleChangeStatus}
          />
        </Grid>
      ))}
    </Grid>
  );
};

export default CorrectionsList;