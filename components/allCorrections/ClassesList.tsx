import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Alert, Paper, Typography, Button,  Divider, Grid
} from '@mui/material';
import CorrectionCard from '@/components/allCorrections/CorrectionCard';
import { Correction as ProviderCorrection } from '@/app/components/CorrectionsDataProvider';
import { getBatchShareCodes } from '@/lib/services/shareService';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';


interface ClassesListProps {
  filteredCorrections: ProviderCorrection[];
  error: Error | null;
  activeFilters: string[];
  handleClearAllFilters: () => void;
  getGradeColor: (grade: number) => "success" | "info" | "primary" | "warning" | "error";
  highlightedIds?: string[]; // IDs explicitement mis en évidence
  recentFilter?: boolean; // Indique si le filtre "recent" est actif
  subClassFilter?: string; // Make sure this is optional and of type string
}

const ClassesList: React.FC<ClassesListProps> = ({
  filteredCorrections,
  error,
  activeFilters,
  handleClearAllFilters,
  getGradeColor,
  highlightedIds = [], // Valeur par défaut vide
  recentFilter = false, // Par défaut, le filtre recent n'est pas actif
  subClassFilter // New prop
}) => {
  const [shareCodesMap, setShareCodesMap] = useState<Map<string, string>>(new Map());
  
  // The useEffect for loading shareCodes should depend on filteredCorrections
  useEffect(() => {
    const loadShareCodes = async () => {
      if (filteredCorrections.length > 0) {
        const correctionIds = filteredCorrections.map(c => c.id.toString());
        const shareCodes = await getBatchShareCodes(correctionIds);
        setShareCodesMap(shareCodes);
      } else {
        setShareCodesMap(new Map());
      }
    };
    
    loadShareCodes();
  }, [filteredCorrections]);
  
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
  
  // Grouper les corrections par classe
  const correctionsByClass = useMemo(() => {
    const classGroups: Record<string, {
      id: number;
      name: string;
      corrections: ProviderCorrection[];
    }> = {};
    
    filteredCorrections.forEach(correction => {
      const classId = correction.class_id?.toString() || 'unknown';
      const className = correction.class_name || 'Classe inconnue';
      
      if (!classGroups[classId]) {
        classGroups[classId] = {
          id: parseInt(classId) || 0,
          name: className,
          corrections: []
        };
      }
      
      // Filter by subclass if needed
      if (subClassFilter) {
        // Vérifier si l'étudiant appartient à la sous-classe directement depuis la propriété student_sub_class
        if (correction.student_sub_class?.toString() === subClassFilter) {
          classGroups[classId].corrections.push(correction);
        }
      } else {
        classGroups[classId].corrections.push(correction);
      }
    });
    
    return Object.values(classGroups);
  }, [filteredCorrections, subClassFilter]);
  
  // Fonction séparée pour éviter l'appel à une API dans useMemo
  useEffect(() => {
    // Si on a besoin de récupérer des données supplémentaires sur les sous-classes
    if (subClassFilter && filteredCorrections.length > 0) {
      // La logique peut être étendue ici si nécessaire
      
    }
  }, [subClassFilter, filteredCorrections]);

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 4 }}>
        Erreur lors du chargement des corrections: {error.message || String(error)}
      </Alert>
    );
  }
  
  if (filteredCorrections.length === 0) {
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
  
  if (correctionsByClass.length === 0) {
    return (
      <Alert severity="info" sx={{ mt: 4 }}>
        Aucune classe trouvée avec les filtres actuels.
      </Alert>
    );
  }
  
  return (
    <Box>
      {correctionsByClass.map(classGroup => (
        <Paper 
          key={classGroup.id} 
          sx={{ 
            mb: 4, 
            p: 2, 
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              {classGroup.name} 
              <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                ({classGroup.corrections.length} correction{classGroup.corrections.length > 1 ? 's' : ''})
              </Typography>
            </Typography>
          </Box>
          
          <Divider sx={{ mb: 2 }} />
          
          <Grid container spacing={2}>
            {classGroup.corrections.map(correction => (
              <Grid key={correction.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <CorrectionCard
                  correction={correction}
                  getGradeColor={getGradeColor}
                  preloadedShareCode={shareCodesMap.get(correction.id.toString())}
                  highlighted={shouldHighlight(correction)}
                  showClass={false}
                />
              </Grid>
            ))}
          </Grid>
        </Paper>
      ))}
    </Box>
  );
};

export default ClassesList;
