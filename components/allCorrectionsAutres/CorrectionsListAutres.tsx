import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  Button,
  Alert,
  Paper
} from '@mui/material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ErrorDisplay from '../ui/ErrorDisplay';
import LoadingSpinner from '../LoadingSpinner';
import { CorrectionAutreEnriched } from '@/lib/types';
import Link from 'next/link';
import { useBatchDelete } from '@/hooks/useBatchDelete';
import { alpha } from '@mui/material/styles';

interface CorrectionsListAutresProps {
  filteredCorrections: CorrectionAutreEnriched[];
  error: Error | null;
  activeFilters: string[];
  handleClearAllFilters: () => void;
  getGradeColor: (grade: number) => "success" | "info" | "primary" | "warning" | "error";
  highlightedIds?: string[];
  recentFilter?: boolean;
  refreshCorrections?: () => Promise<void>;
}

export default function CorrectionsListAutres({
  filteredCorrections,
  error,
  activeFilters,
  handleClearAllFilters,
  getGradeColor,
  highlightedIds = [],
  recentFilter = false,
  refreshCorrections
}: CorrectionsListAutresProps) {
  const { batchDeleteMode, selectedCorrections, setSelectedCorrections, deletingCorrections } = useBatchDelete();

  const [localSelected, setLocalSelected] = useState<string[]>([]);

  // Gestion de la sélection des corrections pour la suppression par lot
  const handleCorrectionSelect = (correctionId: string) => {
    const newSelected = localSelected.includes(correctionId) 
      ? localSelected.filter(id => id !== correctionId)
      : [...localSelected, correctionId];
    setLocalSelected(newSelected);
    setSelectedCorrections(newSelected);
  };

  // Si une erreur est présente, on l'affiche
  if (error) {
    return <ErrorDisplay error={error} />;
  }

  // Si aucune correction n'est trouvée
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
    <Grid container spacing={2}>
      {filteredCorrections.map((correction) => {
        const isHighlighted = highlightedIds.includes(correction.id.toString());
        const isSelected = selectedCorrections.includes(correction.id.toString());
        const isDeleting = Boolean(deletingCorrections.has(correction.id.toString()));

        return (
          <Grid 
          size={{ xs: 12, sm:6, md: 4 }}
            key={correction.id}
          >
            <Card 
              sx={{ 
                position: 'relative',
                height: '100%',
                transition: 'all 0.2s ease-in-out',
                ...(isHighlighted && {
                  border: '2px solid',
                  borderColor: 'primary.main',
                  boxShadow: (theme) => `0 0 15px ${alpha(theme.palette.primary.main, 0.5)}`
                }),
                ...(isSelected && {
                  border: '2px solid',
                  borderColor: 'secondary.main',
                  boxShadow: (theme) => `0 0 15px ${alpha(theme.palette.secondary.main, 0.5)}`
                })
              }}
            >
              <CardContent>
                {/* En-tête avec la note */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Chip 
                    label={correction.grade?.toFixed(2)}
                    color={getGradeColor(correction.grade || 0)}
                    size="medium"
                    sx={{ fontSize: '1.1rem', fontWeight: 'bold' }}
                  />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {/* Actions sur la correction */}
                    <Tooltip title="Voir">
                      <IconButton 
                        size="small"
                        component={Link}
                        href={`/corrections_autres/${correction.id}`}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Modifier">
                      <IconButton 
                        size="small"
                        component={Link}
                        href={`/corrections_autres/${correction.id}/edit`}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {batchDeleteMode && (
                      <Tooltip title={isSelected ? "Désélectionner" : "Sélectionner"}>
                        <IconButton
                          size="small"
                          onClick={() => handleCorrectionSelect(correction.id.toString())}
                          color={isSelected ? "secondary" : "default"}
                          disabled={isDeleting}
                        >
                          {isDeleting ? (
                            <Box sx={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <LoadingSpinner />
                            </Box>
                          ) : (
                            <DeleteIcon fontSize="small" />
                          )}
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </Box>

                {/* Informations principales */}
                <Typography variant="h6" component="div" gutterBottom noWrap>
                  {correction.activity_name || 'Activité inconnue'}
                </Typography>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {correction.student_name || 'Étudiant inconnu'}
                </Typography>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {correction.class_name || 'Classe inconnue'}
                </Typography>

                {/* Points par partie */}
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Points par partie:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                    {correction.points_earned.map((points, index) => (
                      <Chip
                        key={index}
                        label={`P${index + 1}: ${points}`}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Box>

                {/* Date de soumission */}
                <Typography 
                  variant="caption" 
                  color="text.secondary" 
                  sx={{ 
                    display: 'block',
                    mt: 2,
                    fontStyle: 'italic'
                  }}
                >
                  {correction.submission_date 
                    ? format(new Date(correction.submission_date), 'PP', { locale: fr })
                    : 'Date non spécifiée'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
}