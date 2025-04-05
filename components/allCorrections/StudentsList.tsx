import React, { useState, useEffect } from 'react';
import {
  Box, Alert, Paper, Typography, Button, Accordion, AccordionSummary, 
  AccordionDetails, Chip, Divider, Avatar, Card
} from '@mui/material';
import CancelIcon from '@mui/icons-material/Cancel';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CorrectionCard from '@/components/allCorrections/CorrectionCard';
import Grid from '@mui/material/Grid';
import { Correction as ProviderCorrection } from '@/app/components/CorrectionsDataProvider';
import dayjs from 'dayjs';
import { alpha } from '@mui/material/styles';
import { getBatchShareCodes } from '@/lib/services/shareService';

interface StudentsListProps {
  filteredCorrections: ProviderCorrection[];
  error: string | null;
  activeFilters: string[];
  handleClearAllFilters: () => void;
  getGradeColor: (grade: number) => 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  highlightedIds?: string[];
  recentFilter?: boolean; // Nouvel ajout pour supporter le filtre recent
}

const StudentsList: React.FC<StudentsListProps> = ({
  filteredCorrections,
  error,
  activeFilters,
  handleClearAllFilters,
  getGradeColor,
  highlightedIds = [],
  recentFilter = false // Valeur par défaut false
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
                  {correctionsByStudent[studentId].corrections.map(correction => {
                    // Vérifier si cette correction doit être mise en évidence
                    const isHighlighted = shouldHighlight(correction);
                    
                    return (
                      <Grid size={{ xs: 12, sm: 6, md: 4 }} key={correction.id}>
                          <CorrectionCard 
                            key={correction.id} 
                            correction={correction} 
                            getGradeColor={getGradeColor} 
                            highlighted={isHighlighted}
                            preloadedShareCode={shareCodesMap.get(correction.id.toString())}
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

export default StudentsList;
