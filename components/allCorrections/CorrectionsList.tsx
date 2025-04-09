import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Grid, Alert } from '@mui/material';
import { Correction } from '@/app/components/CorrectionsDataProvider';
import CorrectionCard from './CorrectionCard';
import { getBatchShareCodes } from '@/lib/services/shareService';
import { useSnackbar } from 'notistack';
import ErrorDisplay from '@/components/ui/ErrorDisplay';

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

  // Handle toggling the active status of a correction
  const handleToggleActive = async (correctionId: number, newActiveState: boolean) => {
    try {
      const response = await fetch(`/api/corrections/${correctionId}/toggle-active`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ active: newActiveState }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        
        // throw new Error(errorData || 'Failed to update correction status');
      }
      
      // Show success message
      enqueueSnackbar(`Correction ${newActiveState ? 'activée' : 'désactivée'} avec succès`, {
        variant: 'success',
        autoHideDuration: 3000,
      });
      
      // Refresh corrections data if a refresh function is provided
      if (refreshCorrections) {
        await refreshCorrections();
      }
      
    } catch (error) {
      console.error('Error toggling correction active status:', error);
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
            onToggleActive={handleToggleActive}
          />
        </Grid>
      ))}
    </Grid>
  );
};

export default CorrectionsList;