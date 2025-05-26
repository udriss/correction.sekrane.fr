import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Alert, Paper, Typography, Button, Divider,
  CircularProgress
} from '@mui/material';
import CorrectionCardAutre from '@/components/allCorrectionsAutres/CorrectionCard';
import Pagination from '@/components/Pagination';
import { useSnackbar } from 'notistack';
import ErrorDisplay from '@/components/ui/ErrorDisplay';
import { changeCorrectionAutreStatus } from '@/lib/services/correctionsAutresService';
import { CorrectionAutreEnriched } from '@/lib/types';
import { getBatchShareCodes } from '@/lib/services/shareService';
import { useCorrectionsAutres } from '@/app/components/CorrectionsAutresDataProvider';

interface ChronologyListAutresProps {
  error: Error | null;
  activeFilters: string[];
  handleClearAllFilters: () => void;
  getGradeColor: (grade: number) => "success" | "info" | "primary" | "warning" | "error";
  highlightedIds?: string[];
  recentFilter?: boolean;
  getStudentById?: (studentId: number | null) => any;
}

interface DateGroup {
  date: string;
  corrections: CorrectionAutreEnriched[];
  averageGrade: number;
  totalCorrections: number;
}

export default function ChronologyListAutres({
  error,
  activeFilters,
  handleClearAllFilters,
  getGradeColor,
  highlightedIds = [],
  recentFilter = false,
  getStudentById
}: ChronologyListAutresProps) {
  const { enqueueSnackbar } = useSnackbar();
  const { 
    corrections: filteredCorrections, 
    pagination, 
    goToPage, 
    setItemsPerPage, 
    isLoading,
    refreshCorrections
  } = useCorrectionsAutres();
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

  // Grouper les corrections par date de soumission
  const dateGroups = useMemo(() => {
    const groups = new Map<string, CorrectionAutreEnriched[]>();
    
    filteredCorrections.forEach(correction => {
      // Vérifier que submission_date existe avant de l'utiliser
      if (!correction.submission_date) {
        return; // Ignorer les corrections sans date de soumission
      }
      
      const submissionDate = new Date(correction.submission_date);
      const dateKey = submissionDate.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }
      groups.get(dateKey)!.push(correction);
    });

    // Convertir la Map en tableau et calculer les statistiques
    return Array.from(groups.entries())
      .map(([date, corrections]): DateGroup => {
        const totalGrade = corrections.reduce((sum, correction) => sum + (correction.grade || 0), 0);
        const averageGrade = corrections.length > 0 ? totalGrade / corrections.length : 0;
        
        return {
          date,
          corrections: corrections.sort((a, b) => {
            // Vérifier que les dates existent avant de les comparer
            if (!a.submission_date || !b.submission_date) return 0;
            return new Date(b.submission_date).getTime() - new Date(a.submission_date).getTime();
          }),
          averageGrade,
          totalCorrections: corrections.length
        };
      })
      .sort((a, b) => {
        // Trier par date (plus récent en premier)
        // Vérifier que les corrections existent et ont des dates avant de les comparer
        const firstCorrectionA = a.corrections[0];
        const firstCorrectionB = b.corrections[0];
        
        if (!firstCorrectionA?.submission_date || !firstCorrectionB?.submission_date) {
          return 0;
        }
        
        const dateA = new Date(firstCorrectionA.submission_date);
        const dateB = new Date(firstCorrectionB.submission_date);
        return dateB.getTime() - dateA.getTime();
      });
  }, [filteredCorrections]);

  if (error) {
    return <ErrorDisplay error={error} />;
  }

  // Afficher un spinner pendant le chargement
  if (isLoading && (!filteredCorrections || filteredCorrections.length === 0)) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
        <CircularProgress sx={{ mb: 2 }} />
        <Typography variant="body1" color="text.secondary">
          Chargement des corrections en cours...
        </Typography>
      </Box>
    );
  }

  return (
    <>
      {/* Pagination en haut */}
      {filteredCorrections.length > 0 && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          itemsPerPage={pagination.itemsPerPage}
          onPageChange={goToPage}
          onItemsPerPageChange={setItemsPerPage}
          disabled={isLoading}
        />
      )}

      {/* Message "Aucune correction trouvée" uniquement s'il n'y a pas de chargement ET que la liste est vide */}
      {!isLoading && (!filteredCorrections || filteredCorrections.length === 0) && (
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
      )}

      <Box>
        {dateGroups.map(({ date, corrections, averageGrade, totalCorrections }) => (
          <Paper key={date} sx={{ mb: 3, p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" color="primary">
                {date}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Moyenne: <strong>{averageGrade.toFixed(2)}/20</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {totalCorrections} correction{totalCorrections > 1 ? 's' : ''}
                </Typography>
              </Box>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
              {corrections.map((correction) => {
                const isHighlighted = highlightedIds.includes(correction.id.toString());

                return (
                  <CorrectionCardAutre 
                    key={correction.id}
                    correction={correction}
                    highlighted={isHighlighted}
                    getGradeColor={getGradeColor}
                    showStudent={true}
                    showClass={true}
                    showActivity={true}
                    onChangeStatus={handleChangeStatus}
                    preloadedShareCode={shareCodesMap.get(correction.id.toString())}
                    studentSubClass={getStudentById && correction.student_id ? getStudentById(correction.student_id)?.sub_class : null}
                  />
                );
              })}
            </Box>
          </Paper>
        ))}
      </Box>

      {/* Pagination en bas */}
      {filteredCorrections.length > 0 && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          itemsPerPage={pagination.itemsPerPage}
          onPageChange={goToPage}
          onItemsPerPageChange={setItemsPerPage}
          disabled={isLoading}
        />
      )}
    </>
  );
}