import React, { useState, useEffect, useRef } from 'react';
import { Typography, Slider, Box, Grid, Alert, FormControlLabel, Checkbox, CircularProgress, Stack, Fade } from '@mui/material';
import { useSnackbar } from 'notistack';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

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
  
  // État pour suivre les sections qui viennent d'être sauvegardées avec succès
  const [savedSections, setSavedSections] = useState<{[key: string]: boolean}>({});
  // État pour suivre les sections qui ont eu une erreur lors de la sauvegarde
  const [errorSections, setErrorSections] = useState<{[key: string]: boolean}>({});
  // Durée d'affichage des badges de validation (en ms)
  const BADGE_DISPLAY_DURATION = 3000;
  
  // Fonction pour marquer une section comme sauvegardée avec succès
  const markSectionAsSaved = (sectionKey: string) => {
    setSavedSections(prev => ({ ...prev, [sectionKey]: true }));
    
    // Planifier la disparition du badge après quelques secondes
    setTimeout(() => {
      setSavedSections(prev => ({ ...prev, [sectionKey]: false }));
    }, BADGE_DISPLAY_DURATION);
  };
  
  // Fonction pour marquer une section comme ayant eu une erreur
  const markSectionAsError = (sectionKey: string) => {
    setErrorSections(prev => ({ ...prev, [sectionKey]: true }));
    
    // Planifier la disparition du badge après quelques secondes
    setTimeout(() => {
      setErrorSections(prev => ({ ...prev, [sectionKey]: false }));
    }, BADGE_DISPLAY_DURATION);
  };
  
  // Fonction pour afficher des notifications avec contrôle de fréquence
  const showNotification = (message: string, variant: 'success' | 'error' | 'info' | 'warning') => {
    const now = Date.now();
    // Vérifier si suffisamment de temps s'est écoulé depuis la dernière notification
    if (now - lastNotificationTimeRef.current > MIN_NOTIFICATION_DELAY) {
      enqueueSnackbar(message, { variant });
      lastNotificationTimeRef.current = now;
    }
  };
  
  // Vérifier si la notation correspond au cas "travail non rendu"
  useEffect(() => {
    // Vérification uniquement basée sur la nouvelle méthode (25% des points max)
    const totalEarned = pointsEarned.reduce((sum, points) => sum + (points || 0), 0);
    const maxTotal = totalPoints.reduce((sum, points) => sum + points, 0);
    const grade25Percent = maxTotal * 0.25; // 25% des points max
    
    // Vérifier uniquement la nouvelle méthode (25% des points)
    const isNeverSubmitted = totalEarned === 0 && correction && 
                           (Math.abs(correction.grade - grade25Percent) < 0.01 || 
                            Math.abs(correction.final_grade - grade25Percent) < 0.01);
    
    setNeverSubmitted(isNeverSubmitted);
  }, [pointsEarned, totalPoints, correction]);
  
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
          .then((response) => response.json())
          .then((data) => {
            // Mise à jour de l'état local de correction avec les nouvelles valeurs
            if (data && data.points_earned) {
              const event = new CustomEvent('gradeUpdated', { 
                detail: { 
                  message: 'Note mise à jour',
                  correction: data 
                } 
              });
              window.dispatchEvent(event);
            }
            
            // Afficher l'indicateur de succès central
            markSaveSuccess();
          })
          .catch(err => {
            console.error('Erreur lors de la mise à jour de la note:', err);
            showNotification('Erreur lors de la mise à jour de la note', 'error');
            
            const event = new CustomEvent('gradeError', { 
              detail: { message: 'Erreur lors de la mise à jour de la note' } 
            });
            window.dispatchEvent(event);
            
            // Afficher l'indicateur d'erreur central
            markSaveError();
          })
          .finally(() => {
            apiCallInProgressRef.current = false;
            setIsUpdating(false);
            setSaving(false); // Indiquer que la sauvegarde est terminée
          });
      }
    }, 3000); // Délai de 2 secondes
    
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
            const event = new CustomEvent('penaltyUpdated', { 
              detail: { message: 'Pénalité mise à jour' } 
            });
            window.dispatchEvent(event);
            
            // Afficher l'indicateur de succès central
            markSaveSuccess();
          })
          .catch(err => {
            console.error('Erreur lors de la mise à jour de la pénalité:', err);
            showNotification('Erreur lors de la mise à jour de la pénalité', 'error');
            
            // Afficher l'indicateur d'erreur central
            markSaveError();
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
      // Pour un travail non rendu, on attribue directement 25% des points max
      const totalMaxPoints = totalPoints.reduce((sum, points) => sum + points, 0);
      const grade25Percent = totalMaxPoints * 0.25; // 25% des points maximums
      
      // Créer un tableau de zéros avec la même longueur que totalPoints
      const zeroPoints = new Array(totalPoints.length).fill(0);
      
      // Réinitialiser les points de chaque section à zéro (visuellement)
      pointsEarned.forEach((_, index) => {
        setPointsEarned(index, 0);
      });
      
      // Désactiver la pénalité
      setPenalty('0');
      
      // Annuler tout timeout en cours
      if (saveGradeTimeout) {
        clearTimeout(saveGradeTimeout);
      }
      
      // Configurer un nouveau timeout pour la sauvegarde différée
      const timeout = setTimeout(() => {
        if (!apiCallInProgressRef.current && correction) {
          apiCallInProgressRef.current = true;
          setIsUpdating(true);
          setSaving(true); // Indiquer que la sauvegarde est en cours
          
          // Appeler l'API avec un tableau de zéros au lieu de null
          fetch(`/api/corrections_autres/${correction.id}/grade`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              points_earned: zeroPoints, // Utiliser le tableau de zéros
              grade: grade25Percent,
              final_grade: grade25Percent,
              penalty: 0
            }),
          })
            .then((response) => {
              if (!response.ok) throw new Error('Failed to update grade');
              return response.json();
            })
            .then((data) => {
              // Mise à jour de l'objet correction avec les nouvelles valeurs
              if (correction) {
                correction.grade = grade25Percent;
                correction.final_grade = grade25Percent;
                correction.points_earned = zeroPoints; // Utiliser le tableau de zéros
                correction.penalty = 0;
              }
              
              // Afficher l'indicateur de succès central
              markSaveSuccess();
              
              const event = new CustomEvent('gradeUpdated', { 
                detail: { 
                  message: 'Note de travail non rendu appliquée',
                  correction: data 
                } 
              });
              window.dispatchEvent(event);
            })
            .catch(err => {
              console.error('Erreur lors de la mise à jour de la note:', err);
              
              // Afficher l'indicateur d'erreur central
              markSaveError();
              
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
      }, 2000);
      
      setSaveGradeTimeout(timeout);
    } else {
      // Si on décoche, réinitialiser à zéro
      pointsEarned.forEach((_, index) => {
        setPointsEarned(index, 0);
      });
      setPenalty('0');
      
      // Sauvegarder les modifications
      saveGradeWithDebounce(new Array(pointsEarned.length).fill(0), 0);
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
    // Si c'est un travail non rendu, renvoyer 25% des points max
    if (neverSubmitted) {
      const totalMaxPoints = totalPoints.reduce((sum, points) => sum + points, 0);
      return totalMaxPoints * 0.25;
    }
    
    const totalGrade = calculateTotalGrade();
    const penaltyValue = parseFloat(penalty) || 0;
    
    return calculateFinalGrade(totalGrade, penaltyValue);
  };
  
  // Calculer le pourcentage obtenu
  const getPercentage = (): number => {
    // Si c'est un travail non rendu, renvoyer 25%
    if (neverSubmitted) {
      return 25;
    }
    
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
  
  // État pour suivre si une sauvegarde a été réussie récemment
  const [saveSuccess, setSaveSuccess] = useState(false);
  // État pour suivre si une erreur s'est produite récemment
  const [saveError, setSaveError] = useState(false);
  // Durée d'affichage des indicateurs de succès/erreur (en ms)
  const INDICATOR_DISPLAY_DURATION = 3000;
  
  // Fonction pour indiquer une sauvegarde réussie
  const markSaveSuccess = () => {
    setSaveSuccess(true);
    
    // Planifier la disparition de l'indicateur après quelques secondes
    setTimeout(() => {
      setSaveSuccess(false);
    }, INDICATOR_DISPLAY_DURATION);
  };
  
  // Fonction pour indiquer une erreur de sauvegarde
  const markSaveError = () => {
    setSaveError(true);
    
    // Planifier la disparition de l'indicateur après quelques secondes
    setTimeout(() => {
      setSaveError(false);
    }, INDICATOR_DISPLAY_DURATION);
  };
  
  // État pour gérer l'animation de l'icône de succès
  const [successAnimation, setSuccessAnimation] = useState<'enter' | 'exit' | null>(null);
  // État pour gérer l'animation de l'icône d'erreur
  const [errorAnimation, setErrorAnimation] = useState<'enter' | 'exit' | null>(null);

  // Effet pour gérer l'animation de l'icône de succès
  useEffect(() => {
    if (saveSuccess) {
      setSuccessAnimation('enter');
      
      // Planifier l'animation de sortie avant la disparition complète
      const exitTimer = setTimeout(() => {
        setSuccessAnimation('exit');
      }, INDICATOR_DISPLAY_DURATION - 500); // Commencer l'animation de sortie 500ms avant la fin
      
      return () => clearTimeout(exitTimer);
    }
  }, [saveSuccess]);

  // Effet pour gérer l'animation de l'icône d'erreur
  useEffect(() => {
    if (saveError) {
      setErrorAnimation('enter');
      
      // Planifier l'animation de sortie avant la disparition complète
      const exitTimer = setTimeout(() => {
        setErrorAnimation('exit');
      }, INDICATOR_DISPLAY_DURATION - 500); // Commencer l'animation de sortie 500ms avant la fin
      
      return () => clearTimeout(exitTimer);
    }
  }, [saveError]);
  
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
            Note automatique de 25% des points maximums appliquée (travail non rendu)
          </Alert>
        )}
      </Box>
      
      {/* Indicateur central de chargement et de succès 
      {(saving || saveSuccess || saveError) && (
      */}
      {(saving || saveSuccess || saveError) && (
        <Box sx={{ 
          position: 'absolute', 
          margin: 'auto',
          left: 0, 
          right: 0,
          top: 0,
          bottom: 0,
          // transform: 'translate(-50%, -50%)', 
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'rgba(255, 255, 255, 0.8)',
          borderRadius: 2,
          p: 3,
          width: 120,
          height: 120,
          textAlign: 'center'
        }}>
          {saving && (
            <CircularProgress size={120} color="primary" />
          )}
          {!saveSuccess && saving && (
            <Box sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              animation: successAnimation === 'enter' 
                ? 'zoomIn 0.5s ease forwards' 
                : successAnimation === 'exit' 
                  ? 'zoomOutFade 0.5s ease forwards' 
                  : 'none',
              '@keyframes zoomIn': {
                '0%': {
                  opacity: 0,
                  transform: 'scale(0.5)'
                },
                '70%': {
                  opacity: 1,
                  transform: 'scale(1.2)'
                },
                '100%': {
                  opacity: 1,
                  transform: 'scale(1)'
                }
              },
              '@keyframes zoomOutFade': {
                '0%': {
                  opacity: 1,
                  transform: 'scale(1)'
                },
                '100%': {
                  opacity: 0,
                  transform: 'scale(1.5)'
                }
              }
            }}>
              <CheckCircleOutlineIcon color="success" sx={{ fontSize: 120 }} />
            </Box>
          )}
          {saveError && !saving && (
            <Box sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              animation: errorAnimation === 'enter' 
                ? 'zoomIn 0.5s ease forwards' 
                : errorAnimation === 'exit' 
                  ? 'zoomOutFade 0.5s ease forwards' 
                  : 'none'
            }}>
              <ErrorOutlineIcon color="error" sx={{ fontSize: 80 }} />
            </Box>
          )}
        </Box>
      )}

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
              <Typography variant="caption" color="text.secondary" align="center" sx={{ mt: 1 }}>
                {penalty || '0'} points
              </Typography>
            </Box>
          </Grid>
        )}

        {/* Section pour la note totale */}
        <Grid size={{ xs: 12 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2, position: 'relative' }}>
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