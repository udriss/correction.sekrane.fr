import React, { useMemo, useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, Divider, Grid, Alert } from '@mui/material';
import { Correction } from '@/app/components/CorrectionsDataProvider';
import CorrectionCard from './CorrectionCard';
import { getBatchShareCodes } from '@/lib/services/shareService';

interface StudentsListProps {
  filteredCorrections: Correction[];
  error: Error | null;
  activeFilters: string[];
  handleClearAllFilters: () => void;
  getGradeColor: (grade: number) => "success" | "info" | "primary" | "warning" | "error";
  highlightedIds: string[];
  recentFilter: boolean;
}

const StudentsList: React.FC<StudentsListProps> = ({
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
  
  // Ensure filteredCorrections is always an array
  const corrections = Array.isArray(filteredCorrections) ? filteredCorrections : [];
  
  // Chargement en masse des codes de partage quand les corrections changent
  useEffect(() => {
    const loadShareCodes = async () => {
      if (corrections.length > 0) {
        const correctionIds = corrections.map(c => c.id.toString());
        const shareCodes = await getBatchShareCodes(correctionIds);
        setShareCodesMap(shareCodes);
      } else {
        setShareCodesMap(new Map());
      }
    };
    
    loadShareCodes();
  }, [corrections]);
  
  // Group corrections by student
  const correctionsByStudent = useMemo(() => {
    const studentGroups: Record<string, {
      id: number;
      name: string;
      corrections: Correction[];
      className?: string;
    }> = {};
    
    corrections.forEach(correction => {
      const studentId = correction.student_id;
      const studentName = correction.student_name || 'Étudiant inconnu';
      
      if (studentId !== null && !studentGroups[studentId]) {
        studentGroups[studentId] = {
          id: studentId,
          name: studentName,
          corrections: [],
          className: correction.class_name
        };
      }
      
      if (studentId !== null) {
        studentGroups[studentId].corrections.push(correction);
      }
    });
    
    return Object.values(studentGroups);
  }, [corrections]);
  
  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 4 }}>
        Erreur lors du chargement des corrections: {error.message}
      </Alert>
    );
  }
  
  if (corrections.length === 0) {
    return (
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          {activeFilters.length > 0 
            ? "Aucune correction ne correspond aux filtres sélectionnés"
            : "Aucune correction disponible pour le moment"}
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
  
  if (correctionsByStudent.length === 0) {
    return (
      <Alert severity="info" sx={{ mt: 4 }}>
        Aucun étudiant trouvé avec les filtres actuels.
      </Alert>
    );
  }
  
  return (
    <Box>
      {correctionsByStudent.map(studentGroup => (
        <Paper 
          key={studentGroup.id} 
          sx={{ 
            mb: 4, 
            p: 2, 
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="h6">
                {studentGroup.name}
              </Typography>
              {studentGroup.className && (
                <Typography variant="body2" color="text.secondary">
                  {studentGroup.className}
                </Typography>
              )}
            </Box>
            <Typography variant="body2" color="text.secondary">
              {studentGroup.corrections.length} correction{studentGroup.corrections.length > 1 ? 's' : ''}
            </Typography>
          </Box>
          
          <Divider sx={{ mb: 2 }} />
          
          <Grid container spacing={2}>
            {studentGroup.corrections.map(correction => (
              <Grid key={correction.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <CorrectionCard
                  correction={correction}
                  getGradeColor={getGradeColor}
                  highlight={highlightedIds.includes(correction.id?.toString() || '')}
                  showStudent={false}
                  showTopLabel={recentFilter && new Date(correction.submission_date).getTime() > Date.now() - 24 * 60 * 60 * 1000 ? '24h' : undefined}
                />
              </Grid>
            ))}
          </Grid>
        </Paper>
      ))}
    </Box>
  );
};

export default StudentsList;
