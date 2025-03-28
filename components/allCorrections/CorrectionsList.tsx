import React from 'react';
import {
  Box, Alert, Paper, Typography, Button
} from '@mui/material';
import CancelIcon from '@mui/icons-material/Cancel';
import CorrectionCard from './CorrectionCard';
import Grid from '@mui/material/Grid';
import { Correction as ProviderCorrection } from '@/app/components/CorrectionsDataProvider';

// Utiliser le type du provider ou ajuster votre interface
interface CorrectionsListProps {
  filteredCorrections: ProviderCorrection[];
  error: string | null;
  activeFilters: string[];
  handleClearAllFilters: () => void;
  getGradeColor: (grade: number) => string;
}

const CorrectionsList: React.FC<CorrectionsListProps> = ({
  filteredCorrections,
  error,
  activeFilters,
  handleClearAllFilters,
  getGradeColor
}) => {
  return (
    <Box>
      {error ? (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3,
            p: 0,
            border: 1,
            borderColor: 'error.main',
            '& .MuiAlert-icon': {
              color: 'error.main'
            }
          }}
        >
          {error}
        </Alert>
      ) : filteredCorrections.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>Aucune correction trouvée</Typography>
          <Typography variant="body2" color="text.secondary">
            Ajustez vos filtres ou ajoutez des corrections
          </Typography>
          {activeFilters.length > 0 && (
            <Button 
              variant="outlined" 
              onClick={handleClearAllFilters} 
              startIcon={<CancelIcon />}
              sx={{ mt: 2 }}
            >
              Effacer tous les filtres
            </Button>
          )}
        </Paper>
      ) : (
        <Grid container spacing={4}>
          {filteredCorrections.map(correction => (
            <CorrectionCard 
              key={correction.id} 
              correction={correction} 
              getGradeColor={getGradeColor} 
            />
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default CorrectionsList;