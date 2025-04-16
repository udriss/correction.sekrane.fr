import React, { useState, useEffect, useRef } from 'react';
import { Typography, Slider, Box, Grid, Alert, FormControlLabel, Checkbox, CircularProgress } from '@mui/material';
import { useSnackbar } from 'notistack';

interface GradingSectionAutresProps {
  pointsEarned: number[]; // Tableau des points gagnés pour chaque partie
  totalPoints: number[]; // Tableau des points maximums pour chaque partie
  partNames: string[]; // Noms des différentes parties
  isPenaltyEnabled: boolean;
  penalty: string;
  setPointsEarned: (index: number, value: number) => void;
  setPenalty: (penalty: string) => void;
  saveGradeTimeout: NodeJS.Timeout | null;
  setSaveGradeTimeout: (timeout: NodeJS.Timeout | null) => void;
  correction: any;
  handleUpdatePenalty?: (penalty: number) => Promise<any>;
  saving?: boolean; // Indicateur si une sauvegarde est en cours
  setSaving?: (isSaving: boolean) => void; // Fonction pour mettre à jour l'état de sauvegarde
}

const GradingSectionAutres: React.FC<GradingSectionAutresProps> = ({
  pointsEarned,
  totalPoints,
  partNames,
  isPenaltyEnabled,
  penalty,
  setPointsEarned,
  setPenalty,
  saveGradeTimeout,
  setSaveGradeTimeout,
  correction,
  handleUpdatePenalty,
  saving = false,
  setSaving = () => {}
}) => {
  // État pour le checkbox "Travail non rendu"
  const [neverSubmitted, setNeverSubmitted] = useState(false);
  // Référence pour stocker la dernière requête API
  const apiCallInProgressRef = useRef(false);
  // État pour désactiver les sliders pendant la mise à jour
  const [isUpdating, setIsUpdating] = useState(false);
  // Hook pour les notifications
  const { enqueueSnackbar } = useSnackbar();
  // Référence pour contrôler la fréquence des notifications
  const lastNotificationTimeRef = useRef<number>(0);
  // Délai minimum entre les notifications en millisecondes (5 secondes)
  const MIN_NOTIFICATION_DELAY = 5000;
  
  // Fonction pour afficher des notifications avec contrôle de fréquence
  const showNotification = (message: string, variant: 'success' | 'error' | 'info' | 'warning') => {
    const now = Date.now();
    // Vérifier si suffisamment de temps s'est écoulé depuis la dernière notification
    if (now - lastNotificationTimeRef.current > MIN_NOTIFICATION_DELAY) {
      enqueueSnackbar(message, { variant });
      lastNotificationTimeRef.current = now;
    }
  };
  
  // Vérifier si la pénalité actuelle correspond au cas "travail non rendu"
  useEffect(() => {
    // Si la pénalité est de 15 points, c'est probablement un travail non rendu
    const currentPenalty = parseFloat(penalty) || 0;
    const totalEarned = pointsEarned.reduce((sum, points) => sum + points, 0);
    const maxTotal = totalPoints.reduce((sum, points) => sum + points, 0);
    
    // Si pénalité de 15 et note maximale, c'est un travail non rendu
    if (isPenaltyEnabled && currentPenalty === 15 && totalEarned === maxTotal) {
      setNeverSubmitted(true);
    } else {
      setNeverSubmitted(false);
    }
  }, [isPenaltyEnabled, penalty, pointsEarned, totalPoints]);
  
  // Fonction pour sauvegarder les notes avec un délai
  const saveGradeWithDebounce = (newPointsEarned: number[], penaltyValue: number) => {
    // Annuler tout timeout en cours
    if (saveGradeTimeout) {
      clearTimeout(saveGradeTimeout);
    }
    
    // Configurer un nouveau timeout pour la sauvegarde différée
    const timeout = setTimeout(() => {
      // Vérifier si une requête API est déjà en cours
      if (!apiCallInProgressRef.current && correction) {
        apiCallInProgressRef.current = true;
        setIsUpdating(true);
        setSaving(true); // Indiquer que la sauvegarde est en cours
        
        // Calculer la note totale et la note finale
        const totalEarned = newPointsEarned.reduce((sum, points) => sum + points, 0);
        const grade = totalEarned;
        const finalGrade = calculateFinalGrade(grade, penaltyValue);
        

        // Appeler l'API
        fetch(`/api/corrections_autres/${correction.id}/grade`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            points_earned: newPointsEarned,
            grade: grade,
            final_grade: finalGrade,
            penalty: penaltyValue
          }),
        })
          .then(response => {
            if (!response.ok) throw new Error('Failed to update grade');
            return response.json();
          })
          .then((data) => {
            // Notification de succès
            showNotification('Note mise à jour avec succès', 'success');
            
            // Mise à jour de l'état local de correction avec les nouvelles valeurs
            // pour éviter que l'interface ne se désynchronise avec la base de données
            if (data && data.points_earned) {
              const event = new CustomEvent('gradeUpdated', { 
                detail: { 
                  message: 'Note mise à jour',
                  correction: data 
                } 
              });
              window.dispatchEvent(event);
            }
          })
          .catch(err => {
            console.error('Erreur lors de la mise à jour de la note:', err);
            showNotification('Erreur lors de la mise à jour de la note', 'error');
            
            const event = new CustomEvent('gradeError', { 
              detail: { message: 'Erreur lors de la mise à jour de la note' } 
            });
            window.dispatchEvent(event);
          })
          .finally(() => {
            apiCallInProgressRef.current = false;
            setIsUpdating(false);
            setSaving(false); // Indiquer que la sauvegarde est terminée
          });
      }
    }, 2000); // Délai de 2 secondes
    
    setSaveGradeTimeout(timeout);
  };

  // Fonction pour mettre à jour uniquement la pénalité
  const updatePenaltyOnly = (newPenaltyValue: number) => {
    // Annuler tout timeout en cours
    if (saveGradeTimeout) {
      clearTimeout(saveGradeTimeout);
    }
    
    // Configurer un nouveau timeout
    const timeout = setTimeout(() => {
      setIsUpdating(true);
      setSaving(true); // Indiquer que la sauvegarde est en cours
      
      // Si la fonction handleUpdatePenalty est disponible, l'utiliser
      if (handleUpdatePenalty) {
        handleUpdatePenalty(newPenaltyValue)
          .then(() => {
            showNotification('Pénalité mise à jour avec succès', 'success');
            
            const event = new CustomEvent('penaltyUpdated', { 
              detail: { message: 'Pénalité mise à jour' } 
            });
            window.dispatchEvent(event);
          })
          .catch(err => {
            console.error('Erreur lors de la mise à jour de la pénalité:', err);
            showNotification('Erreur lors de la mise à jour de la pénalité', 'error');
          })
          .finally(() => {
            setIsUpdating(false);
            setSaving(false); // Indiquer que la sauvegarde est terminée
          });
      } else {
        // Fallback à la méthode complète
        saveGradeWithDebounce([...pointsEarned], newPenaltyValue);
      }
    }, 2000);
    
    setSaveGradeTimeout(timeout);
  };

  // Fonction pour gérer le changement sur un slider de points
  const handlePointsChange = (index: number, newValue: number) => {
    // Mettre à jour l'état local
    const newPointsEarned = [...pointsEarned];
    newPointsEarned[index] = newValue;
    
    // Appeler la fonction de mise à jour fournie
    setPointsEarned(index, newValue);
    
    // Sauvegarder après un délai
    saveGradeWithDebounce(
      newPointsEarned,
      isPenaltyEnabled ? parseFloat(penalty || '0') : 0
    );
  };

  // Fonction pour appliquer la notation "travail non rendu"
  const handleNeverSubmittedChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = event.target.checked;
    setNeverSubmitted(isChecked);
    
    if (isChecked) {
      // Pour travail non rendu, on met les points au maximum et on applique une pénalité de 15 points
      const maxPoints = [...totalPoints];
      
      // Mettre à jour tous les points au maximum
      maxPoints.forEach((maxPoint, index) => {
        setPointsEarned(index, maxPoint);
      });
      
      // Appliquer la pénalité maximale
      setPenalty('15');
      
      // Utiliser la fonction dédiée à la mise à jour de la pénalité
      updatePenaltyOnly(15);
      
      // Mettre à jour les points dans la base de données
      saveGradeWithDebounce(maxPoints, 15);
    } else {
      // Si on décoche, enlever la pénalité mais garder les points
      setPenalty('0');
      updatePenaltyOnly(0);
    }
  };

  // Calculer la note finale selon la règle demandée
  const calculateFinalGrade = (grade: number, penalty: number): number => {
    if (grade < 5) {
      // Si la note est inférieure à 6, on garde la note originale
      return grade;
    } else {
      // Sinon, on prend le maximum entre (note-pénalité) et 6
      return Math.max(grade - penalty, 5);
    }
  };

  // Calculer la note totale
  const calculateTotalGrade = (): number => {
    return pointsEarned.reduce((sum, points) => sum + points, 0);
  };

  // Calculer la note finale (avec application de la pénalité si nécessaire)
  const getFinalGrade = (): number => {
    const totalGrade = calculateTotalGrade();
    const penaltyValue = parseFloat(penalty) || 0;
    
    return calculateFinalGrade(totalGrade, penaltyValue);
  };
  
  // Calculer le pourcentage obtenu
  const getPercentage = (): number => {
    const totalEarned = calculateTotalGrade();
    const totalMaxPoints = totalPoints.reduce((sum, points) => sum + points, 0);
    
    return totalMaxPoints > 0 ? (totalEarned / totalMaxPoints) * 100 : 0;
  };

  // Fonction pour stocker temporairement les valeurs pendant le glissement
  const tempValuesRef = useRef<{ [key: string | number]: number }>({});

  // Fonction pour gérer le changement pendant que le slider est déplacé (sans sauvegarder)
  const handleSliderDrag = (index: number, newValue: number) => {
    // Mettre à jour l'état local (visuel uniquement)
    const newPointsEarned = [...pointsEarned];
    newPointsEarned[index] = newValue;
    
    // Stocker la valeur temporaire
    tempValuesRef.current[index] = newValue;
    
    // Mettre à jour l'affichage seulement
    setPointsEarned(index, newValue);
  };

  // Fonction pour gérer la fin du glissement (relâchement du slider)
  const handleSliderCommit = (index: number) => {
    // Récupérer la valeur temporaire stockée
    const newValue = tempValuesRef.current[index];
    if (newValue === undefined) return;
    
    // Mettre à jour avec la valeur finale
    const newPointsEarned = [...pointsEarned];
    newPointsEarned[index] = newValue;
    
    // Sauvegarder après relâchement du slider
    saveGradeWithDebounce(
      newPointsEarned,
      isPenaltyEnabled ? parseFloat(penalty || '0') : 0
    );
    
    // Nettoyer la référence temporaire
    delete tempValuesRef.current[index];
  };

  // Fonction pour gérer le glissement du slider de pénalité
  const handlePenaltyDrag = (newValue: number) => {
    const newPenalty = String(newValue);
    setPenalty(newPenalty);
    tempValuesRef.current['penalty'] = newValue;
  };

  // Fonction pour gérer le relâchement du slider de pénalité
  const handlePenaltyCommit = () => {
    const newValue = tempValuesRef.current['penalty'];
    if (newValue === undefined) return;
    
    // Mettre à jour la pénalité après relâchement
    updatePenaltyOnly(newValue);
    
    // Nettoyer la référence temporaire
    delete tempValuesRef.current['penalty'];
  };
  
  return (
    <>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6">
          Notation sur {totalPoints.reduce((sum, points) => sum + points, 0)} points
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

      <Grid container spacing={3}>
        {/* Sliders pour chaque partie */}
        {partNames.map((partName, index) => (
          <Grid size={{ xs: 12, md: 6 }} key={index}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
              <Typography variant="body2" id={`slider-${index}`} gutterBottom>
                {partName}
              </Typography>
              <Slider
                aria-labelledby={`slider-${index}`}
                value={pointsEarned[index] || 0}
                onChange={(_, newValue) => {
                  handleSliderDrag(index, newValue as number);
                }}
                onChangeCommitted={() => handleSliderCommit(index)}
                min={0}
                max={totalPoints[index]}
                step={0.5}
                valueLabelDisplay="auto"
                marks
                disabled={neverSubmitted || isUpdating || saving}
                sx={{ 
                  width: "90%",
                  color: index % 2 === 0 ? 'primary.main' : 'secondary.main',
                  '& .MuiSlider-thumb': {
                    height: 20,
                    width: 20,
                  },
                  '& .MuiSlider-rail': {
                    opacity: 0.5,
                  }
                }}
              />
              {saving && index === 0 && (
                <CircularProgress
                  size={24}
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    right: '5%',
                    marginTop: '-12px',
                  }}
                />
              )}
              <Typography variant="caption" color="text.secondary" align="center" sx={{ mt: 1 }}>
                {pointsEarned[index] || '0'} / {totalPoints[index]}
              </Typography>
            </Box>
          </Grid>
        ))}

        {/* Section pour la pénalité */}
        {isPenaltyEnabled && (
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
              <Typography variant="body2" id="penalty-slider" gutterBottom>
                Pénalité
              </Typography>
              <Slider
                aria-labelledby="penalty-slider"
                value={parseFloat(penalty) || 0}
                onChange={(_, newValue) => {
                  handlePenaltyDrag(newValue as number);
                }}
                onChangeCommitted={handlePenaltyCommit}
                min={0}
                max={16}
                step={0.5}
                valueLabelDisplay="auto"
                marks
                disabled={neverSubmitted || isUpdating || saving}
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
              {saving && (
                <CircularProgress
                  size={24}
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    right: '5%',
                    marginTop: '-12px',
                  }}
                />
              )}
              <Typography variant="caption" color="text.secondary" align="center" sx={{ mt: 1 }}>
                {penalty || '0'} points
              </Typography>
            </Box>
          </Grid>
        )}

        {/* Section pour la note totale */}
        <Grid size={{ xs: 12 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2 }}>
            <Typography variant="body2" id="total-grade-slider" gutterBottom>
              Note totale ({getPercentage().toFixed(1)}%)
            </Typography>
            <Slider
              aria-labelledby="total-grade-slider"
              value={getFinalGrade()}
              max={totalPoints.reduce((sum, points) => sum + points, 0)}
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
              {getFinalGrade().toFixed(1)} / {totalPoints.reduce((sum, points) => sum + points, 0)}
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </>
  );
};

export default GradingSectionAutres;