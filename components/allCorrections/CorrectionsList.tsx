import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Grid, Alert } from '@mui/material';
import { Correction } from '@/app/components/CorrectionsDataProvider';
import CorrectionCard from './CorrectionCard';
import { getBatchShareCodes } from '@/lib/services/shareService';

interface CorrectionsListProps {
  filteredCorrections: Correction[];
  error: Error | null;
  activeFilters: string[];
  handleClearAllFilters: () => void;
  getGradeColor: (grade: number) => "success" | "info" | "primary" | "warning" | "error";
  highlightedIds: string[];
  recentFilter: boolean;
}

const CorrectionsList: React.FC<CorrectionsListProps> = ({
  filteredCorrections,
  error,
  activeFilters,
  handleClearAllFilters,
  getGradeColor,
  highlightedIds,
  recentFilter
}) => {
  // État pour stocker les codes de partage
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

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 4 }}>
        Erreur lors du chargement des corrections: {error.message}
      </Alert>
    );
  }
  
  // Ensure filteredCorrections is always an array
  const corrections = Array.isArray(filteredCorrections) ? filteredCorrections : [];
  
  if (corrections.length === 0) {
    return (
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          {activeFilters.length > 0 
            ? "Aucune correction ne correspond aux filtres sélectionnés"
            : "Aucune correction n'a été créée pour le moment"}
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
          />
        </Grid>
      ))}
    </Grid>
  );
};

export default CorrectionsList;