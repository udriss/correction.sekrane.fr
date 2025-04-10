import React, { useState, useEffect, useRef } from 'react';
import { Paper, Typography, Slider, Box, Grid, Divider, FormControlLabel, Checkbox, Alert } from '@mui/material';
import { useSnackbar } from 'notistack';

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
  // Nouvel argument pour mettre à jour uniquement la pénalité
  handleUpdatePenalty?: (penalty: number) => Promise<any>;
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
  correction,
  handleUpdatePenalty
}) => {
  // État pour le checkbox "Travail non rendu"
  const [neverSubmitted, setNeverSubmitted] = useState(false);
  // Référence pour stocker la dernière requête API
  const apiCallInProgressRef = useRef(false);
  // État pour désactiver les sliders pendant la mise à jour
  const [isUpdating, setIsUpdating] = useState(false);
  // Hook pour les notifications
  const { enqueueSnackbar } = useSnackbar();
  
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
    
    // Configurer un nouveau timeout pour la sauvegarde différée (2 secondes au lieu de 500ms)
    const timeout = setTimeout(() => {
      // Vérifier si une requête API est déjà en cours
      if (!apiCallInProgressRef.current && correction) {
        apiCallInProgressRef.current = true; // Marquer une requête en cours
        setIsUpdating(true); // Désactiver les sliders pendant la mise à jour
        
        // Appeler l'API directement au lieu d'utiliser correctionsHook
        fetch(`/api/corrections/${correction.id}/grade`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            grade: exp + theo,
            final_grade: getFinalGrade(),
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
            // Notification de succès avec enqueueSnackbar
            enqueueSnackbar('Note mise à jour avec succès', { variant: 'success' });
            
            // Mise à jour des messages de statut uniquement, pas de mise à jour de l'état global
            const event = new CustomEvent('gradeUpdated', { 
              detail: { message: 'Note mise à jour' } 
            });
            window.dispatchEvent(event);
          })
          .catch(err => {
            console.error('Erreur lors de la mise à jour de la note:', err);
            // Notification d'erreur avec enqueueSnackbar
            enqueueSnackbar('Erreur lors de la mise à jour de la note', { variant: 'error' });
            
            const event = new CustomEvent('gradeError', { 
              detail: { message: 'Erreur lors de la mise à jour de la note' } 
            });
            window.dispatchEvent(event);
          })
          .finally(() => {
            apiCallInProgressRef.current = false; // Marquer la fin de la requête
            setIsUpdating(false); // Réactiver les sliders
          });
      }
    }, 2000); // Délai de 2 secondes avant l'appel API
    
    setSaveGradeTimeout(timeout);
  };

  // Fonction pour mettre à jour uniquement la pénalité
  const updatePenaltyOnly = (newPenaltyValue: number) => {
    // Annuler tout timeout en cours
    if (saveGradeTimeout) {
      clearTimeout(saveGradeTimeout);
    }
    
    // Configurer un nouveau timeout pour la sauvegarde différée (2 secondes)
    const timeout = setTimeout(() => {
      setIsUpdating(true); // Désactiver les sliders pendant la mise à jour
      
      // Si la fonction handleUpdatePenalty est disponible, l'utiliser
      if (handleUpdatePenalty) {
        handleUpdatePenalty(newPenaltyValue)
          .then(() => {
            // Notification de succès avec enqueueSnackbar
            enqueueSnackbar('Pénalité mise à jour avec succès', { variant: 'success' });
            
            // Pas besoin de mettre à jour l'UI car le composant parent le fera
            const event = new CustomEvent('penaltyUpdated', { 
              detail: { message: 'Pénalité mise à jour' } 
            });
            window.dispatchEvent(event);
          })
          .catch(err => {
            console.error('Erreur lors de la mise à jour de la pénalité:', err);
            // Notification d'erreur
            enqueueSnackbar('Erreur lors de la mise à jour de la pénalité', { variant: 'error' });
          })
          .finally(() => {
            setIsUpdating(false); // Réactiver les sliders
          });
      } else {
        // Fallback à l'ancienne méthode
        const currentExpGrade = parseFloat(experimentalGrade) || 0;
        const currentTheoGrade = parseFloat(theoreticalGrade) || 0;
        saveGradeWithDebounce(currentExpGrade, currentTheoGrade, newPenaltyValue);
      }
    }, 2000); // Délai de 2 secondes
    
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
      
      // Utiliser la fonction dédiée à la mise à jour de la pénalité
      updatePenaltyOnly(15);
    } else {
      // Si on décoche, enlever la pénalité mais garder les notes
      setPenalty('0');
      updatePenaltyOnly(0);
    }
  };

  // Calculer la note finale selon la règle demandée
  const calculateFinalGrade = (grade: number, penalty: number): number => {
    if (grade < 6) {
      // Si la note est inférieure à 6, on garde la note originale
      return grade;
    } else {
      // Sinon, on prend le maximum entre (note-pénalité) et 6
      return Math.max(grade - penalty, 6);
    }
  };

  // Calculer la note totale
  const calculateTotalGrade = (): number => {
    const experimentalValue = parseFloat(experimentalGrade) || 0;
    const theoreticalValue = parseFloat(theoreticalGrade) || 0;
    return experimentalValue + theoreticalValue;
  };

  // Calculer la note finale (avec application de la pénalité si nécessaire)
  const getFinalGrade = (): number => {
    const totalGrade = calculateTotalGrade();
    const penaltyValue = parseFloat(penalty) || 0;
    
    return calculateFinalGrade(totalGrade, penaltyValue);
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
              disabled={neverSubmitted || isUpdating}
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
              disabled={neverSubmitted || isUpdating}
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
                    updatePenaltyOnly(parseFloat(newPenalty));
                  }}
                  min={0}
                  max={16}
                  step={0.5}
                  valueLabelDisplay="auto"
                  marks
                  disabled={neverSubmitted || isUpdating}
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
                  const rawTotal = expGrade + theoGrade;
                  
                  // Appliquer la règle pour la note finale
                  let finalGrade;
                  if (rawTotal < 6) {
                    // Si la note brute est < 6, on garde cette note
                    finalGrade = Math.max(0, rawTotal);
                  } else {
                    // Sinon, on prend le maximum entre (note-pénalité) et 6
                    finalGrade = Math.max(rawTotal - penaltyValue, 6);
                  }
                  
                  return isNaN(finalGrade) ? 0 : finalGrade;
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
                  const rawTotal = expGrade + theoGrade;
                  
                  // Appliquer la règle pour la note finale
                  let finalGrade;
                  if (rawTotal < 6) {
                    // Si la note brute est < 6, on garde cette note
                    finalGrade = Math.max(0, rawTotal);
                  } else {
                    // Sinon, on prend le maximum entre (note-pénalité) et 6
                    finalGrade = Math.max(rawTotal - penaltyValue, 6);
                  }
                  
                  // Toujours s'assurer que la note n'est pas négative
                  finalGrade = Math.max(0, finalGrade);
                  
                  return isNaN(finalGrade) ? 0 : finalGrade.toFixed(1);
                })()} / {experimentalPoints + theoreticalPoints}
              </Typography>
            </Box>
      </Grid>
    </>
  );
};

export default GradingSection;
