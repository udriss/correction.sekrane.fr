import React, { useState, useEffect } from 'react';
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
  
  // Fonction pour appliquer la notation "travail non rendu"
  const handleNeverSubmittedChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = event.target.checked;
    setNeverSubmitted(isChecked);
    
    if (isChecked) {
      // Appliquer la note de 5/20 (avec 15 points de pénalité)
      const maxPoints = experimentalPoints + theoreticalPoints;
      const expPoints = (experimentalPoints / maxPoints) * 20;
      const theoPoints = (theoreticalPoints / maxPoints) * 20;
      
      // Mettre à jour les notes et la pénalité
      setExperimentalGrade(expPoints.toFixed(1));
      setTheoreticalGrade(theoPoints.toFixed(1));
      setPenalty('15');
      
      // Sauvegarder les modifications
      if (saveGradeTimeout) {
        clearTimeout(saveGradeTimeout);
      }
      
      const timeout = setTimeout(() => {
        if (correction) {
          correctionsHook.saveGradeAndPenalty(
            expPoints,
            theoPoints,
            15
          );
        }
      }, 500);
      
      setSaveGradeTimeout(timeout);
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
                
                if (saveGradeTimeout) {
                  clearTimeout(saveGradeTimeout);
                }
                
                const timeout = setTimeout(() => {
                  if (correction) {
                    correctionsHook.saveGradeAndPenalty(
                      parseFloat(newGrade),
                      parseFloat(theoreticalGrade || '0'),
                      isPenaltyEnabled ? parseFloat(penalty || '0') : 0
                    );
                  }
                }, 500);
                
                setSaveGradeTimeout(timeout);
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
                
                if (saveGradeTimeout) {
                  clearTimeout(saveGradeTimeout);
                }
                
                const timeout = setTimeout(() => {
                  if (correction) {
                    correctionsHook.saveGradeAndPenalty(
                      parseFloat(experimentalGrade || '0'),
                      parseFloat(newGrade),
                      isPenaltyEnabled ? parseFloat(penalty || '0') : 0
                    );
                  }
                }, 500);
                
                setSaveGradeTimeout(timeout);
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
                    
                    if (saveGradeTimeout) {
                      clearTimeout(saveGradeTimeout);
                    }
                    
                    const timeout = setTimeout(() => {
                      if (correction) {
                        correctionsHook.saveGradeAndPenalty(
                          parseFloat(experimentalGrade || '0'),
                          parseFloat(theoreticalGrade || '0'),
                          parseFloat(newPenalty)
                        );
                      }
                    }, 500);
                    
                    setSaveGradeTimeout(timeout);
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
