import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Alert, Paper, Typography, Button, Divider, Grid,
  Accordion, AccordionSummary, AccordionDetails, Chip,
  CircularProgress
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CorrectionCardAutre from '@/components/allCorrections/CorrectionCard';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useSnackbar } from 'notistack';
import ErrorDisplay from '@/components/ui/ErrorDisplay';
import { changeCorrectionAutreStatus } from '@/lib/services/correctionsAutresService';
import { CorrectionAutreEnriched } from '@/lib/types';
import { getBatchShareCodes } from '@/lib/services/shareService';


interface StudentsListAutresProps {
  filteredCorrections: CorrectionAutreEnriched[];
  error: Error | null;
  activeFilters: string[];
  handleClearAllFilters: () => void;
  getGradeColor: (grade: number) => "success" | "info" | "primary" | "warning" | "error";
  highlightedIds?: string[];
  recentFilter?: boolean;
  refreshCorrections?: () => Promise<void>;
  isLoading?: boolean; // Ajout d'une propriété pour indiquer l'état de chargement
  getStudentById?: (studentId: number | null) => any; // Fonction pour récupérer un étudiant par son ID
}

interface StudentGroup {
  studentName: string;
  studentId: number | null;
  corrections: CorrectionAutreEnriched[];
  averageGrade: number;
  totalCorrections: number;
  className: string;
}

export default function StudentsListAutres({
  filteredCorrections,
  error,
  activeFilters,
  handleClearAllFilters,
  getGradeColor,
  highlightedIds = [],
  recentFilter = false,
  refreshCorrections,
  isLoading = false,
  getStudentById
}: StudentsListAutresProps) {
  const { enqueueSnackbar } = useSnackbar();
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

  // Grouper les corrections par étudiant
  const studentGroups = useMemo(() => {
    const groups = new Map<string, CorrectionAutreEnriched[]>();
    
    filteredCorrections.forEach(correction => {
      const studentKey = correction.student_id ? 
        `${correction.student_id}-${correction.student_name}` : 
        'Sans étudiant';
      
      if (!groups.has(studentKey)) {
        groups.set(studentKey, []);
      }
      groups.get(studentKey)?.push(correction);
    });

    // Convertir la Map en tableau et calculer les statistiques
    return Array.from(groups.entries()).map(([studentKey, corrections]): StudentGroup => {
      const firstCorrection = corrections[0];
      const validGrades = corrections.filter(c => typeof c.grade === 'number').map(c => c.grade as number);
      const averageGrade = validGrades.length > 0
        ? validGrades.reduce((sum, grade) => sum + grade, 0) / validGrades.length
        : 0;

      return {
        studentName: firstCorrection.student_name || 'Étudiant inconnu',
        studentId: firstCorrection.student_id,
        corrections,
        averageGrade,
        totalCorrections: corrections.length,
        className: firstCorrection.class_name || 'Classe inconnue'
      };
    }).sort((a, b) => b.averageGrade - a.averageGrade);
  }, [filteredCorrections]);

  if (error) {
    return <ErrorDisplay error={error} />;
  }

  // Afficher un spinner pendant le chargement
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
        <CircularProgress sx={{ mb: 2 }} />
        <Typography variant="body1" color="text.secondary">
          Chargement des corrections en cours
        </Typography>
      </Box>
    );
  }

  if (!filteredCorrections || filteredCorrections.length === 0) {
    return (
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
    );
  }

  return (
    <Box>
      {studentGroups.map(({ studentName, studentId, corrections, averageGrade, totalCorrections, className }) => (
        <Accordion key={`${studentId}-${studentName}`} defaultExpanded={studentGroups.length === 1}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
              <Box>
                <Typography variant="h6">{studentName}</Typography>
                <Typography variant="body2" color="text.secondary">{className}</Typography>
              </Box>
              <Chip 
                label={`${averageGrade.toFixed(2)}/20`}
                color={getGradeColor(averageGrade)}
                size="small"
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
                {totalCorrections} correction{totalCorrections > 1 ? 's' : ''}
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              {corrections.map((correction) => {
                const isHighlighted = highlightedIds.includes(correction.id.toString());

                return (
                  <Grid size={{ xs: 12, md: 6, lg: 4 }} key={correction.id}>
                    <CorrectionCardAutre 
                      correction={correction}
                      highlighted={isHighlighted}
                      getGradeColor={getGradeColor}
                      showStudent={false}
                      showClass={false}
                      showActivity={true}
                      onChangeStatus={handleChangeStatus}
                      preloadedShareCode={shareCodesMap.get(correction.id.toString())}
                      studentSubClass={getStudentById && correction.student_id ? getStudentById(correction.student_id)?.sub_class : null}
                    />
                  </Grid>
                );
              })}
            </Grid>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}