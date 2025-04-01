import React from 'react';
import {
  Box, Alert, Paper, Typography, Button, Accordion, AccordionSummary, 
  AccordionDetails, Chip, Divider
} from '@mui/material';
import CancelIcon from '@mui/icons-material/Cancel';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SchoolIcon from '@mui/icons-material/School';
import CorrectionCard from '@/components/allCorrections/CorrectionCard';
import Grid from '@mui/material/Grid';
import { Correction as ProviderCorrection } from '@/app/components/CorrectionsDataProvider';

interface ClassesListProps {
  filteredCorrections: ProviderCorrection[];
  error: string | null;
  activeFilters: string[];
  handleClearAllFilters: () => void;
  getGradeColor: (grade: number) => string;
}

const ClassesList: React.FC<ClassesListProps> = ({
  filteredCorrections,
  error,
  activeFilters,
  handleClearAllFilters,
  getGradeColor
}) => {
  // Grouper les corrections par classe
  const correctionsByClass = filteredCorrections.reduce((acc, correction) => {
    const classId = correction.class_id;
    const className = correction.class_name;
    
    // Skip corrections with null classId
    if (classId === null) return acc;
    
    if (!acc[classId]) {
      acc[classId] = {
        className,
        corrections: []
      };
    }
    
    acc[classId].corrections.push(correction);
    return acc;
  }, {} as Record<string, {className: string, corrections: ProviderCorrection[]}>);
  
  // Trier les classes par ordre alphabétique
  const sortedClasses = Object.keys(correctionsByClass).sort((a, b) => 
    correctionsByClass[a].className.localeCompare(correctionsByClass[b].className)
  );

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
        <Box>
          {sortedClasses.map((classId) => (
            <Accordion key={classId} defaultExpanded sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <SchoolIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6">{correctionsByClass[classId].className}</Typography>
                  <Chip 
                    label={`${correctionsByClass[classId].corrections.length} corrections`} 
                    size="small" 
                    color="primary" 
                    sx={{ ml: 2 }}
                  />
                  <Typography variant="body2" sx={{ ml: 'auto' }}>
                    Moyenne : {(correctionsByClass[classId].corrections.reduce((sum, c) => sum + c.grade, 0) / 
                    correctionsByClass[classId].corrections.length).toFixed(1)} / 20
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={3}>
                
                  {correctionsByClass[classId].corrections.map(correction => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={correction.id}>
                    <CorrectionCard 
                      key={correction.id} 
                      correction={correction} 
                      getGradeColor={getGradeColor} 
                    />
                    </Grid>
                  ))}
                </Grid>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default ClassesList;
