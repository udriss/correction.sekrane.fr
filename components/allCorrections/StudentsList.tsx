import React, { useMemo, useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, Divider, Grid, Alert } from '@mui/material';
import { Correction } from '@/app/components/CorrectionsDataProvider';
import CorrectionCard from './CorrectionCard';
import { getBatchShareCodes } from '@/lib/services/shareService';
import { useSnackbar } from 'notistack';
import ErrorDisplay from '@/components/ui/ErrorDisplay';

interface StudentsListProps {
  filteredCorrections: Correction[];
  error: Error | null;
  activeFilters: string[];
  handleClearAllFilters: () => void;
  getGradeColor: (grade: number) => "success" | "info" | "primary" | "warning" | "error";
  highlightedIds: string[];
  recentFilter: boolean;
  refreshCorrections?: () => Promise<void>;
}

const StudentsList: React.FC<StudentsListProps> = ({
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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update correction status');
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
    return <ErrorDisplay error={error} />;
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
                  onToggleActive={handleToggleActive}
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
