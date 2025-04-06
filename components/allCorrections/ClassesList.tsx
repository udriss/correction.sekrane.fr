import React, { useState, useEffect } from 'react';
import {
  Box, Alert, Paper, Typography, Button, Accordion, AccordionSummary, 
  AccordionDetails, Chip, Divider, Card
} from '@mui/material';
import CancelIcon from '@mui/icons-material/Cancel';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SchoolIcon from '@mui/icons-material/School';
import CorrectionCard from '@/components/allCorrections/CorrectionCard';
import Grid from '@mui/material/Grid';
import { Correction as ProviderCorrection } from '@/app/components/CorrectionsDataProvider';
import { getBatchShareCodes } from '@/lib/services/shareService';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import { alpha } from '@mui/material/styles';

interface ClassesListProps {
  filteredCorrections: ProviderCorrection[];
  error: string | null;
  activeFilters: string[];
  handleClearAllFilters: () => void;
  getGradeColor: (grade: number) => string;
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
  
  // Chargement en masse des codes de partage quand les corrections changent
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

  // Group corrections by class first, fixing the null index type issue
  const classGroups = React.useMemo(() => {
    const groups: Record<string, ProviderCorrection[]> = {}; // Use string as index type instead of number
    
    filteredCorrections.forEach(correction => {
      // Skip corrections with null or undefined class_id
      if (correction.class_id === null || correction.class_id === undefined) return;
      
      // Skip corrections that don't match the sub-class filter if it's active
      if (subClassFilter && correction.sub_class?.toString() !== subClassFilter) {
        return;
      }
      
      // Convert class_id to string for use as object key
      const classIdKey = correction.class_id.toString();
      
      if (!groups[classIdKey]) {
        groups[classIdKey] = [];
      }
      groups[classIdKey].push(correction);
    });
    
    return groups;
  }, [filteredCorrections, subClassFilter]);

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
                  <Typography variant="h6">
                    {correctionsByClass[classId].className}
                    {subClassFilter && (
                      <Chip 
                        size="small" 
                        label={`Groupe ${subClassFilter}`}
                        color="info"
                        sx={{ ml: 1, fontWeight: 500 }}
                      />
                    )}
                  </Typography>
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
                
                  {correctionsByClass[classId].corrections.map((correction,) => {
                    // Récupérer le code de partage préchargé pour cette correction
                    const preloadedShareCode = shareCodesMap.get(correction.id.toString());
                    const isHighlighted = shouldHighlight(correction);
                    

                    return (
                      <Grid size={{ xs: 12, sm: 6, md: 4 }} key={correction.id}>
                          <CorrectionCard 
                          key={correction.id} 
                          correction={correction} 
                          getGradeColor={getGradeColor} 
                          preloadedShareCode={preloadedShareCode}
                          highlighted={isHighlighted}
                        />
                      </Grid>
                    );
                  })}
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
