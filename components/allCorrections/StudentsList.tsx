import React from 'react';
import {
  Box, Alert, Paper, Typography, Button, Accordion, AccordionSummary, 
  AccordionDetails, Chip, Divider, Avatar
} from '@mui/material';
import CancelIcon from '@mui/icons-material/Cancel';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PersonIcon from '@mui/icons-material/Person';
import CorrectionCard from './CorrectionCard';
import Grid from '@mui/material/Grid';
import { Correction as ProviderCorrection } from '@/app/components/CorrectionsDataProvider';

interface StudentsListProps {
  filteredCorrections: ProviderCorrection[];
  error: string | null;
  activeFilters: string[];
  handleClearAllFilters: () => void;
  getGradeColor: (grade: number) => string;
}

const StudentsList: React.FC<StudentsListProps> = ({
  filteredCorrections,
  error,
  activeFilters,
  handleClearAllFilters,
  getGradeColor
}) => {
  // Grouper les corrections par étudiant
  const correctionsByStudent = filteredCorrections.reduce((acc, correction) => {
    const studentId = correction.student_id;
    const studentName = correction.student_name;
    
    if (!acc[studentId]) {
      acc[studentId] = {
        studentName,
        className: correction.class_name,
        corrections: []
      };
    }
    
    acc[studentId].corrections.push(correction);
    return acc;
  }, {} as Record<string, {studentName: string, className: string, corrections: ProviderCorrection[]}>);
  
  // Trier les étudiants par ordre alphabétique
  const sortedStudents = Object.keys(correctionsByStudent).sort((a, b) => 
    correctionsByStudent[a].studentName.localeCompare(correctionsByStudent[b].studentName)
  );

  // Fonction pour générer les initiales à partir du nom
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

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
          {sortedStudents.map((studentId) => (
            <Accordion key={studentId} defaultExpanded sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                    {getInitials(correctionsByStudent[studentId].studentName)}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{correctionsByStudent[studentId].studentName}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {correctionsByStudent[studentId].className}
                    </Typography>
                  </Box>
                  <Chip 
                    label={`${correctionsByStudent[studentId].corrections.length} corrections`} 
                    size="small" 
                    color="primary" 
                    sx={{ ml: 2 }}
                  />
                  <Typography variant="body2" sx={{ ml: 'auto' }}>
                    Moyenne: {(correctionsByStudent[studentId].corrections.reduce((sum, c) => sum + c.grade, 0) / 
                    correctionsByStudent[studentId].corrections.length).toFixed(1)} / 20
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={3}>
                  {correctionsByStudent[studentId].corrections.map(correction => (
                    <CorrectionCard 
                      key={correction.id} 
                      correction={correction} 
                      getGradeColor={getGradeColor} 
                    />
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

export default StudentsList;
