import React, { useState, useEffect, useRef } from 'react';
import { Paper, Typography, Slider, Box, Grid, Divider, FormControlLabel, Checkbox, Alert } from '@mui/material';

interface GradingSectionProps {
  experimentalGrade: string;
  theoreticalGrade: string;
  experimentalPoints: number;
  theoreticalPoints: number;
  isPenaltyEnabled: boolean;
  penalty: string;
  setExperimentalGrade: (grade: string) => void;
  setTheoreticalGrade: (grade: string) => void;
  setPenalty: (penalty: string) => void;
  saveGradeTimeout: NodeJS.Timeout | null;
  setSaveGradeTimeout: (timeout: NodeJS.Timeout | null) => void;
  correctionsHook: {
    saveGradeAndPenalty: (exp: number, theo: number, penalty: number) => void;
  };
  correction: any;
}

const GradingSection: React.FC<GradingSectionProps> = ({
  experimentalGrade,
  theoreticalGrade,
  experimentalPoints,
  theoreticalPoints,
  isPenaltyEnabled,
  penalty,
  setExperimentalGrade,
  setTheoreticalGrade,
  setPenalty,
  saveGradeTimeout,
  setSaveGradeTimeout,
  correctionsHook,
  correction
}) => {
  // État pour le checkbox "Travail non rendu"
  const [neverSubmitted, setNeverSubmitted] = useState(false);
  // Référence pour stocker la dernière requête API
  const apiCallInProgressRef = useRef(false);
  
  // Vérifier si la pénalité actuelle correspond au cas "travail non rendu"
  useEffect(() => {
    // Si la pénalité est de 15 points et la note est de 5/20, c'est probablement un travail non rendu
    const currentPenalty = parseFloat(penalty) || 0;
    const expGrade = parseFloat(experimentalGrade) || 0;
    const theoGrade = parseFloat(theoreticalGrade) || 0;
    const totalWithoutPenalty = expGrade + theoGrade;
    
    // Si pénalité de 15 et note totale de 20, c'est un travail non rendu
    if (isPenaltyEnabled && currentPenalty === 15 && totalWithoutPenalty === 20) {
      setNeverSubmitted(true);
    } else {
      setNeverSubmitted(false);
    }
  }, [isPenaltyEnabled, penalty, experimentalGrade, theoreticalGrade]);
  
  // Fonction optimisée pour sauvegarder les notes sans rafraîchir toute la page
  const saveGradeWithDebounce = (exp: number, theo: number, pen: number) => {
    // Annuler tout timeout en cours
    if (saveGradeTimeout) {
      clearTimeout(saveGradeTimeout);
    }
    
    // Configurer un nouveau timeout pour la sauvegarde différée
    const timeout = setTimeout(() => {
      // Vérifier si une requête API est déjà en cours
      if (!apiCallInProgressRef.current && correction) {
        apiCallInProgressRef.current = true; // Marquer une requête en cours
        
        // Appeler l'API directement au lieu d'utiliser correctionsHook
        fetch(`/api/corrections/${correction.id}/grade`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            grade: exp + theo,
            experimental_points_earned: exp,
            theoretical_points_earned: theo,
            penalty: pen
          }),
        })
          .then(response => {
            if (!response.ok) throw new Error('Failed to update grade');
            return response.json();
          })
          .then(() => {
            // Mise à jour des messages de statut uniquement, pas de mise à jour de l'état global
            const event = new CustomEvent('gradeUpdated', { 
              detail: { message: 'Note mise à jour' } 
            });
            window.dispatchEvent(event);
          })
          .catch(err => {
            console.error('Erreur lors de la mise à jour de la note:', err);
            const event = new CustomEvent('gradeError', { 
              detail: { message: 'Erreur lors de la mise à jour de la note' } 
            });
            window.dispatchEvent(event);
          })
          .finally(() => {
            apiCallInProgressRef.current = false; // Marquer la fin de la requête
          });
      }
    }, 500);
    
    setSaveGradeTimeout(timeout);
  };

  // Fonction pour appliquer la notation "travail non rendu"
  const handleNeverSubmittedChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = event.target.checked;
    setNeverSubmitted(isChecked);
    
    if (isChecked) {
      // Pour travail non rendu, on garde les mêmes notes théorique et expérimentale
      // mais on applique une pénalité maximale de 15 points
      
      // Récupérer les notes actuelles
      const currentExpGrade = parseFloat(experimentalGrade) || 0;
      const currentTheoGrade = parseFloat(theoreticalGrade) || 0;
      
      // Appliquer la pénalité maximale
      setPenalty('15');
      
      // Sauvegarder avec la pénalité, mais sans modifier les notes
      saveGradeWithDebounce(currentExpGrade, currentTheoGrade, 15);
    } else {
      // Si on décoche, enlever la pénalité mais garder les notes
      const currentExpGrade = parseFloat(experimentalGrade) || 0;
      const currentTheoGrade = parseFloat(theoreticalGrade) || 0;
      
      setPenalty('0');
      saveGradeWithDebounce(currentExpGrade, currentTheoGrade, 0);
    }
  };
  
  return (
    <>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6">
          Notation sur {experimentalPoints + theoreticalPoints} points
        </Typography>
        
        {/* Checkbox pour les travaux non rendus */}
        <FormControlLabel
          control={
            <Checkbox
              checked={neverSubmitted}
              onChange={handleNeverSubmittedChange}
              color="error"
            />
          }
          label="Travail non rendu"
          sx={{ mt: 1 }}
        />
        
        {neverSubmitted && (
          <Alert severity="warning" sx={{ mt: 1, mb: 2 }}>
            Note automatique de 5/20 appliquée (pénalité de 15 points)
          </Alert>
        )}
      </Box>

      <Grid container spacing={4} justifyContent="center">
        {/* Experimental Grade Section */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography variant="body2" id="experimental-slider" gutterBottom>
              Partie expérimentale
            </Typography>
            <Slider
              aria-labelledby="experimental-slider"
              value={parseFloat(experimentalGrade) || 0}
              onChange={(_, newValue) => {
                const newGrade = String(newValue);
                setExperimentalGrade(newGrade);
                
                // Utiliser la nouvelle fonction de sauvegarde optimisée
                saveGradeWithDebounce(
                  parseFloat(newGrade),
                  parseFloat(theoreticalGrade || '0'),
                  isPenaltyEnabled ? parseFloat(penalty || '0') : 0
                );
              }}
              min={0}
              max={experimentalPoints}
              step={0.5}
              valueLabelDisplay="auto"
              marks
              disabled={neverSubmitted}
              sx={{ 
                width: "90%",
                color: 'primary.main',
                '& .MuiSlider-thumb': {
                  height: 20,
                  width: 20,
                },
                '& .MuiSlider-rail': {
                  opacity: 0.5,
                }
              }}
            />
            <Typography variant="caption" color="text.secondary" align="center" sx={{ mt: 1 }}>
              {experimentalGrade || '0'} / {experimentalPoints}
            </Typography>
          </Box>
        </Grid>

        {/* Theoretical Grade Section */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography variant="body2" id="theoretical-slider" gutterBottom>
              Partie théorique
            </Typography>
            <Slider
              aria-labelledby="theoretical-slider"
              value={parseFloat(theoreticalGrade) || 0}
              onChange={(_, newValue) => {
                const newGrade = String(newValue);
                setTheoreticalGrade(newGrade);
                
                // Utiliser la nouvelle fonction de sauvegarde optimisée
                saveGradeWithDebounce(
                  parseFloat(experimentalGrade || '0'),
                  parseFloat(newGrade),
                  isPenaltyEnabled ? parseFloat(penalty || '0') : 0
                );
              }}
              min={0}
              max={theoreticalPoints}
              step={0.5}
              valueLabelDisplay="auto"
              marks
              disabled={neverSubmitted}
              sx={{ 
                width: "90%",
                color: 'secondary.main', 
                '& .MuiSlider-thumb': {
                  height: 20,
                  width: 20,
                },
                '& .MuiSlider-rail': {
                  opacity: 0.5,
                }
              }}
            />
            <Typography variant="caption" color="text.secondary" align="center" sx={{ mt: 1 }}>
              {theoreticalGrade || '0'} / {theoreticalPoints}
            </Typography>
          </Box>
        </Grid>

        {/* Right Side - Penalty and Total */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center' }}>
            {/* Penalty Section */}
            {isPenaltyEnabled && (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography variant="body2" id="penalty-slider" gutterBottom>
                  Pénalité
                </Typography>
                <Slider
                  aria-labelledby="penalty-slider"
                  value={parseFloat(penalty) || 0}
                  onChange={(_, newValue) => {
                    const newPenalty = String(newValue);
                    setPenalty(newPenalty);
                    
                    // Utiliser la nouvelle fonction de sauvegarde optimisée
                    saveGradeWithDebounce(
                      parseFloat(experimentalGrade || '0'),
                      parseFloat(theoreticalGrade || '0'),
                      parseFloat(newPenalty)
                    );
                  }}
                  min={0}
                  max={16}
                  step={0.5}
                  valueLabelDisplay="auto"
                  marks
                  disabled={neverSubmitted}
                  sx={{ 
                    width: "90%",
                    color: 'error.main',
                    '& .MuiSlider-thumb': {
                      height: 20,
                      width: 20,
                    },
                    '& .MuiSlider-rail': {
                      opacity: 0.5,
                    }
                  }}
                />
                <Typography variant="caption" color="text.secondary" align="center" sx={{ mt: 1 }}>
                  {penalty || '0'} points
                </Typography>
              </Box>
            )}
          </Box>
        </Grid>
            {/* Total Grade Section */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography variant="body2" id="total-grade-slider" gutterBottom>
                Note totale
              </Typography>
              <Slider
                aria-labelledby="total-grade-slider"
                value={(() => {
                  const expGrade = parseFloat(experimentalGrade) || 0;
                  const theoGrade = parseFloat(theoreticalGrade) || 0;
                  const penaltyValue = isPenaltyEnabled ? (parseFloat(penalty) || 0) : 0;
                  const totalGrade = expGrade + theoGrade - penaltyValue;
                  return isNaN(totalGrade) ? 0 : Math.max(0, totalGrade);
                })()}
                max={experimentalPoints + theoreticalPoints}
                disabled
                sx={{ 
                  width: 280,
                  color: 'success.main',
                  '& .MuiSlider-thumb': {
                    height: 20,
                    width: 20,
                  },
                  '& .MuiSlider-rail': {
                    opacity: 0.5,
                  }
                }}
              />
              <Typography variant="caption" color="text.secondary" align="center" sx={{ fontSize: "1rem", mt: 1 }}>
                {(() => {
                  const expGrade = parseFloat(experimentalGrade) || 0;
                  const theoGrade = parseFloat(theoreticalGrade) || 0;
                  const penaltyValue = isPenaltyEnabled ? (parseFloat(penalty) || 0) : 0;
                  const totalGrade = expGrade + theoGrade - penaltyValue;
                  return isNaN(totalGrade) ? 0 : Math.max(0, totalGrade).toFixed(1);
                })()} / {experimentalPoints + theoreticalPoints}
              </Typography>
            </Box>
      </Grid>
    </>
  );
};

export default GradingSection;
