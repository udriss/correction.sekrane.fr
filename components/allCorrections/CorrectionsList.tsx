import React from 'react';
import {
  Box, Alert, Paper, Typography, Button, Grid, Card, CardContent, Chip
} from '@mui/material';
import CorrectionCard from '@/components/allCorrections/CorrectionCard';
import { alpha } from '@mui/material/styles';
import EmptyState from '@/components/ui/EmptyState';
import { Correction as ProviderCorrection } from '@/app/components/CorrectionsDataProvider';
import dayjs from 'dayjs';

// Utiliser le type du provider ou ajuster votre interface
interface CorrectionsListProps {
  filteredCorrections: ProviderCorrection[];
  error: string | null;
  activeFilters: string[];
  handleClearAllFilters: () => void;
  getGradeColor: (grade: number) => string;
  highlightedIds?: string[]; // IDs explicitement mis en évidence
  recentFilter?: boolean; // Indique si le filtre "recent" est actif
}

const CorrectionsList: React.FC<CorrectionsListProps> = ({
  filteredCorrections,
  error,
  activeFilters,
  handleClearAllFilters,
  getGradeColor,
  highlightedIds = [], // Valeur par défaut vide
  recentFilter = false // Par défaut, le filtre recent n'est pas actif
}) => {
  if (error) {
    return (
      <Alert severity="error" variant="filled">
        {error}
      </Alert>
    );
  }

  if (filteredCorrections.length === 0) {
    return (
      <EmptyState 
        title="Aucune correction trouvée"
        description={activeFilters.length > 0 
          ? "Aucune correction ne correspond aux filtres appliqués." 
          : "Il n'y a pas encore de corrections dans le système."}
        action={activeFilters.length > 0 && (
          <Button variant="outlined" onClick={handleClearAllFilters}>
            Effacer les filtres
          </Button>
        )}
      />
    );
  }

  // Fonction pour déterminer si une correction doit être mise en évidence
  const shouldHighlight = (correction: ProviderCorrection) => {
    // Si l'ID est explicitement dans la liste des IDs à mettre en évidence
    if (highlightedIds.includes(correction.id.toString())) {
      return true;
    }
    
    // Si le filtre "recent" est actif, vérifier si c'est une correction récente (24h)
    if (recentFilter) {
      const recentDate = dayjs().subtract(24, 'hour');
      const correctionDate = dayjs(correction.created_at || correction.submission_date);
      return correctionDate.isAfter(recentDate);
    }
    
    return false;
  };

  return (
    <Box>
      <Grid container spacing={2}>
        {filteredCorrections.map((correction) => {
          // Vérifier si cette correction doit être mise en évidence
          const isHighlighted = shouldHighlight(correction);
          
          return (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={correction.id}>
                {/* Badge de nouvelle correction si mise en évidence */}
                {isHighlighted && (
                  <Chip
                    label="Nouveau"
                    color="secondary"
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      zIndex: 1,
                      fontWeight: 'bold'
                    }}
                  />
                )}
                
                {/* Contenu existant de la carte */}
                  <CorrectionCard 
                    key={correction.id} 
                    correction={correction} 
                    getGradeColor={getGradeColor} 
                    highlighted={isHighlighted}
                  />
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default CorrectionsList;