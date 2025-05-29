import React, { useState, useEffect, useRef } from 'react';
import { Typography, Slider, Box, Grid, Alert, FormControlLabel, Checkbox, CircularProgress, Stack, Fade, Button } from '@mui/material';
import { useSnackbar } from 'notistack';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import DoneIcon from '@mui/icons-material/Done';
import { validateGradeConstraint } from '@/lib/correctionAutre';

/**
 * Valide qu'une valeur respecte les contraintes de la base de données decima  // Nouveau slider unifié - Fonction pour gérer le changement pendant le glissement
  const handleAdjustmentChange = (newValue: number) => {
    // Valider la valeur avant de l'appliquer
    const validatedValue = validateGradeConstraint(Math.abs(newValue), 'adjustment');
    const adjustedValue = newValue < 0 ? -validatedValue : validatedValue;
    
    if (adjustedValue < 0) {
      // Valeur négative = pénalité
      const penaltyValue = Math.abs(adjustedValue);
      setPenalty(String(penaltyValue));
      setBonus('0');
      tempValuesRef.current['penalty'] = penaltyValue;
      tempValuesRef.current['bonus'] = 0;
    } else {
      // Valeur positive = bonus
      setPenalty('0');
      setBonus(String(adjustedValue));
      tempValuesRef.current['penalty'] = 0;
      tempValuesRef.current['bonus'] = adjustedValue;
    }
    tempValuesRef.current['adjustment'] = adjustedValue;
/**
 * Valide qu'une valeur respecte les contraintes de la base de données decimal(4,2)
 * Les colonnes grade, penalty, bonus, final_grade ont une limite max de 99.99
 */

interface GradingSectionAutresProps {
  pointsEarned: number[]; // Tableau des points gagnés pour chaque partie
  totalPoints: number[]; // Tableau des points maximums pour chaque partie
  partNames: string[]; // Noms des différentes parties
  isPenaltyEnabled: boolean;
  penalty: string;
  isBonusEnabled: boolean;
  bonus: string;
  setPointsEarned: (index: number, value: number) => void;
  setPenalty: (penalty: string) => void;
  setBonus: (bonus: string) => void;
  saveGradeTimeout: NodeJS.Timeout | null;
  setSaveGradeTimeout: (timeout: NodeJS.Timeout | null) => void;
  correction: any;
  handleUpdatePenalty?: (penalty: number) => Promise<any>;
  handleUpdateBonus?: (bonus: number) => Promise<any>;
  saving?: boolean; // Indicateur si une sauvegarde est en cours
  setSaving?: (isSaving: boolean) => void; // Fonction pour mettre à jour l'état de sauvegarde
}

const GradingSectionAutres: React.FC<GradingSectionAutresProps> = ({
  pointsEarned,
  totalPoints,
  partNames,
  isPenaltyEnabled,
  penalty,
  isBonusEnabled,
  bonus,
  setPointsEarned,
  setPenalty,
  setBonus,
  saveGradeTimeout,
  setSaveGradeTimeout,
  correction,
  handleUpdatePenalty,
  handleUpdateBonus,
  saving = false,
  setSaving = () => {}
}) => {
  // État pour le checkbox "Travail non rendu"
  const [neverSubmitted, setNeverSubmitted] = useState(false);
  // Référence pour stocker la dernière requête API
  const apiCallInProgressRef = useRef(false);
  // État pour désactiver les sliders pendant la mise à jour
  const [isUpdating, setIsUpdating] = useState(false);
  // État pour le chargement du calcul de note finale
  const [isCalculating, setIsCalculating] = useState(false);
  // État local pour la valeur du slider d'ajustement (pendant le drag)
  const [localAdjustmentValue, setLocalAdjustmentValue] = useState<number | null>(null);

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
  
  // Vérifier si la notation correspond au cas "travail non rendu"
  useEffect(() => {
    // Vérification du statut direct
    if (correction && correction.status === 'NON_RENDU') {
      setNeverSubmitted(true);
      return;
    }
    
    // Vérification basée sur la note (25% des points max)
    const totalEarned = pointsEarned.reduce((sum, points) => sum + (points || 0), 0);
    const maxTotal = totalPoints.reduce((sum, points) => sum + points, 0);
    const grade25Percent = maxTotal * 0.25; // 25% des points max
    
    // Vérifier uniquement la nouvelle méthode (25% des points)
    const isNeverSubmitted = totalEarned === 0 && correction && 
                           (Math.abs(correction.grade - grade25Percent) < 0.01 || 
                            Math.abs(correction.final_grade - grade25Percent) < 0.01);
    
    setNeverSubmitted(isNeverSubmitted);
  }, [pointsEarned, totalPoints, correction]);
  
  // Réinitialiser la valeur locale du slider quand les props penalty/bonus changent
  useEffect(() => {
    // Réinitialiser la valeur locale seulement si nous ne sommes pas en train de faire un drag
    // et que les props ont été mises à jour depuis l'extérieur (par exemple après handleRecalculateGrade)
    if (localAdjustmentValue !== null && !tempValuesRef.current['adjustment']) {
      const penaltyValue = parseFloat(penalty) || 0;
      const bonusValue = parseFloat(bonus) || 0;
      const currentAdjustmentFromProps = penaltyValue > 0 ? -penaltyValue : bonusValue;
      
      // Si la valeur calculée depuis les props est différente de la valeur locale, réinitialiser
      if (Math.abs(currentAdjustmentFromProps - localAdjustmentValue) > 0.01) {
        setLocalAdjustmentValue(null);
      }
    }
  }, [penalty, bonus]); // Enlever localAdjustmentValue des dépendances pour éviter la boucle
  
  // Fonction pour sauvegarder les notes avec un délai
  const saveGradeWithDebounce = (newPointsEarned: number[], penaltyValue: number, bonusValue: number = 0) => {
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
        
        // Calculer la note totale et la note finale avec validation des contraintes
        const totalEarned = newPointsEarned.reduce((sum, points) => sum + points, 0);
        const grade = validateGradeConstraint(totalEarned, 'grade');
        const finalGrade = validateGradeConstraint(calculateFinalGrade(grade, penaltyValue, bonusValue), 'final_grade');
        const validatedPenalty = validateGradeConstraint(penaltyValue, 'penalty');
        const validatedBonus = validateGradeConstraint(bonusValue, 'bonus');
        
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
            penalty: validatedPenalty,
            bonus: validatedBonus
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



  // Fonction pour mettre à jour à la fois la pénalité et le bonus (pour les transitions)
  const updateBothPenaltyAndBonus = (newPenaltyValue: number, newBonusValue: number) => {
    // Valider les contraintes avant de continuer
    const validatedPenalty = validateGradeConstraint(newPenaltyValue, 'penalty');
    const validatedBonus = validateGradeConstraint(newBonusValue, 'bonus');
    
    // Annuler tout timeout en cours
    if (saveGradeTimeout) {
      clearTimeout(saveGradeTimeout);
    }
    
    // Configurer un nouveau timeout
    const timeout = setTimeout(() => {
      setIsUpdating(true);
      setSaving(true);
      
      if (!apiCallInProgressRef.current && correction) {
        apiCallInProgressRef.current = true;
        
        // Calculer la note totale et la note finale avec validation des contraintes
        const totalEarned = pointsEarned.reduce((sum, points) => sum + points, 0);
        const grade = validateGradeConstraint(totalEarned, 'grade');
        const finalGrade = validateGradeConstraint(calculateFinalGrade(grade, validatedPenalty, validatedBonus), 'final_grade');
        
        // Appeler l'API avec les deux valeurs en même temps
        fetch(`/api/corrections_autres/${correction.id}/grade`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            points_earned: [...pointsEarned],
            grade: grade,
            final_grade: finalGrade,
            penalty: validatedPenalty,
            bonus: validatedBonus
          }),
        })
          .then((response) => {
            if (!response.ok) throw new Error('Erreur réseau');
            return response.json();
          })
          .then((data) => {
            // Mise à jour de l'objet correction avec les nouvelles valeurs
            if (correction) {
              correction.penalty = data.penalty;
              correction.bonus = data.bonus;
              correction.grade = data.grade;
              correction.final_grade = data.final_grade;
            }
            
            // Mettre à jour les états locaux pour que le slider reflète les bonnes valeurs
            setPenalty(String(data.penalty || 0));
            setBonus(String(data.bonus || 0));
            
            // NE PAS réinitialiser localAdjustmentValue ici - laisser le useEffect s'en charger
            
            // Afficher l'indicateur de succès central
            markSaveSuccess();
            
            const event = new CustomEvent('gradeUpdated', { 
              detail: { 
                message: 'Pénalité/Bonus mis à jour',
                correction: data 
              } 
            });
            window.dispatchEvent(event);
          })
          .catch(err => {
            console.error('Erreur lors de la mise à jour de la pénalité/bonus:', err);
            showNotification('Erreur lors de la mise à jour de la pénalité/bonus', 'error');
            
            // Afficher l'indicateur d'erreur central
            markSaveError();
            
            const event = new CustomEvent('gradeError', { 
              detail: { message: 'Erreur lors de la mise à jour de la pénalité/bonus' } 
            });
            window.dispatchEvent(event);
          })
          .finally(() => {
            apiCallInProgressRef.current = false;
            setIsUpdating(false);
            setSaving(false);
            
            // Réinitialiser la valeur locale seulement en cas d'erreur pour éviter qu'elle reste bloquée
            // En cas de succès, le useEffect se chargera de la réinitialisation quand nécessaire
          });
      }
    }, 2000);
    
    setSaveGradeTimeout(timeout);
  };

  // Fonction pour appliquer la notation "travail non rendu"
  const handleNeverSubmittedChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = event.target.checked;
    setIsUpdating(true);
    setSaving(true); // Indiquer que la sauvegarde est en cours
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
      
      // Désactiver la pénalité et le bonus
      setPenalty('0');
      setBonus('0');
      
      // Configurer un nouveau timeout pour la sauvegarde différée
      if (!apiCallInProgressRef.current && correction) {
        apiCallInProgressRef.current = true;
        
        // Appeler l'API avec un statut spécial pour "travail non rendu" et validation des contraintes
        const validatedGrade25 = validateGradeConstraint(grade25Percent, 'grade');
        
        fetch(`/api/corrections_autres/${correction.id}/grade`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            points_earned: zeroPoints, // Utiliser le tableau de zéros
            grade: validatedGrade25,
            final_grade: validatedGrade25,
            penalty: 0,
            bonus: 0,
            status: 'NON_RENDU' // Ajouter le statut explicite
          }),
        })
          .then((response) => {
            if (!response.ok) throw new Error('Failed to update grade');
            return response.json();
          })
          .then((data) => {
            // Mise à jour de l'objet correction avec les nouvelles valeurs
            if (correction) {
              correction.grade = validatedGrade25;
              correction.final_grade = validatedGrade25;
              correction.points_earned = zeroPoints; // Utiliser le tableau de zéros
              correction.penalty = 0;
              correction.bonus = 0;
              correction.status = 'NON_RENDU'; // Mettre à jour le statut localement aussi
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
      
    } else {
      
      // Si on décoche, réinitialiser à zéro mais changer le statut à ACTIVE
      pointsEarned.forEach((_, index) => {
        setPointsEarned(index, 0);
      });
      setPenalty('0');
      setBonus('0');
      
      // Annuler tout timeout en cours
      if (saveGradeTimeout) {
        clearTimeout(saveGradeTimeout);
      }
      
      // Configurer un nouveau timeout pour la sauvegarde différée
      if (!apiCallInProgressRef.current && correction) {
        apiCallInProgressRef.current = true;
        setIsUpdating(true);
        setSaving(true); // Indiquer que la sauvegarde est en cours
        
        // Appeler l'API avec un tableau de zéros mais statut normal
        fetch(`/api/corrections_autres/${correction.id}/grade`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            points_earned: new Array(pointsEarned.length).fill(0),
            grade: 0,
            final_grade: 0,
            penalty: 0,
            bonus: 0,
            status: 'ACTIVE' // Réinitialiser le statut
          }),
        })
          .then((response) => {
            if (!response.ok) throw new Error('Failed to update grade');
            return response.json();
          })
          .then((data) => {
            // Mise à jour de l'objet correction avec les nouvelles valeurs
            if (correction) {
              correction.grade = 0;
              correction.final_grade = 0;
              correction.points_earned = new Array(pointsEarned.length).fill(0);
              correction.penalty = 0;
              correction.bonus = 0;
              correction.status = 'ACTIVE';
            }
            
            // Afficher l'indicateur de succès central
            markSaveSuccess();
            
            const event = new CustomEvent('gradeUpdated', { 
              detail: { 
                message: 'Note réinitialisée',
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
    }
  };

  // Calculer la note finale selon la règle demandée
  const calculateFinalGrade = (grade: number, penalty: number, bonus: number = 0): number => {
    const totalMaxPoints = totalPoints.reduce((sum, points) => sum + points, 0);
    
    // Appliquer d'abord le bonus (sans dépasser le maximum)
    const gradeWithBonus = Math.min(grade + bonus, totalMaxPoints);
    
    if (gradeWithBonus < 5) {
      // Si la note est inférieure à 5, on garde la note originale
      return gradeWithBonus;
    } else {
      // Sinon, on prend le maximum entre (note+bonus-pénalité) et 5, sans dépasser le max
      return Math.min(Math.max(gradeWithBonus - penalty, 5), totalMaxPoints);
    }
  };

  // Calculer la note totale
  const calculateTotalGrade = (): number => {
    return pointsEarned.reduce((sum, points) => sum + points, 0);
  };

  // Calculer la note finale (avec application de la pénalité et du bonus si nécessaire)
  const getFinalGrade = (): number => {
    // Si c'est un travail non rendu, renvoyer 25% des points max
    if (neverSubmitted) {
      const totalMaxPoints = totalPoints.reduce((sum, points) => sum + points, 0);
      return totalMaxPoints * 0.25;
    }
    
    const totalGrade = calculateTotalGrade();
    const penaltyValue = parseFloat(penalty) || 0;
    const bonusValue = parseFloat(bonus) || 0;
    
    return calculateFinalGrade(totalGrade, penaltyValue, bonusValue);
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
  
  // État local pour les valeurs de points pendant le glissement
  const [localPointsEarned, setLocalPointsEarned] = useState<number[]>([]);
  
  // Initialiser les valeurs locales avec les valeurs des props
  useEffect(() => {
    setLocalPointsEarned([...pointsEarned]);
  }, [pointsEarned]);

  // Fonction pour gérer le changement pendant que le slider est déplacé (sans sauvegarder)
  const handleSliderDrag = (index: number, newValue: number) => {
    // Mettre à jour l'état local pour une réponse immédiate de l'interface
    const newPointsEarned = [...localPointsEarned];
    newPointsEarned[index] = newValue;
    setLocalPointsEarned(newPointsEarned);
    
    // Stocker la valeur temporaire pour la sauvegarde ultérieure
    tempValuesRef.current[index] = newValue;
    
    // Mettre également à jour le parent via la prop
    setPointsEarned(index, newValue);
  };

  // Fonction pour gérer la fin du glissement (relâchement du slider)
  const handleSliderCommit = (index: number) => {
    // Récupérer la valeur temporaire stockée
    const newValue = tempValuesRef.current[index];
    if (newValue === undefined) return;
    
    // Mettre à jour avec la valeur finale
    const newPointsEarned = [...localPointsEarned];
    newPointsEarned[index] = newValue;
    
    // Sauvegarder après relâchement du slider
    saveGradeWithDebounce(
      newPointsEarned,
      isPenaltyEnabled ? parseFloat(penalty || '0') : 0,
      isBonusEnabled ? parseFloat(bonus || '0') : 0
    );
    
    // Nettoyer la référence temporaire
    delete tempValuesRef.current[index];
  };



  // Nouveau slider unifié - Fonction pour gérer le glissement
  const handleAdjustmentDrag = (newValue: number) => {
    // Mettre à jour la valeur locale pour le slider
    setLocalAdjustmentValue(newValue);
    
    if (newValue < 0) {
      // Valeur négative = pénalité
      const penaltyValue = Math.abs(newValue);
      setPenalty(String(penaltyValue));
      setBonus('0');
      tempValuesRef.current['penalty'] = penaltyValue;
      tempValuesRef.current['bonus'] = 0;
    } else {
      // Valeur positive = bonus
      setPenalty('0');
      setBonus(String(newValue));
      tempValuesRef.current['penalty'] = 0;
      tempValuesRef.current['bonus'] = newValue;
    }
    tempValuesRef.current['adjustment'] = newValue;
  };

  // Nouveau slider unifié - Fonction pour gérer le relâchement
  const handleAdjustmentCommit = () => {
    const adjustmentValue = tempValuesRef.current['adjustment'];
    if (adjustmentValue === undefined) return;
    
    if (adjustmentValue < 0) {
      // Valeur négative = pénalité
      const penaltyValue = Math.abs(adjustmentValue);
      updateBothPenaltyAndBonus(penaltyValue, 0);
    } else {
      // Valeur positive = bonus
      updateBothPenaltyAndBonus(0, adjustmentValue);
    }
    
    // Nettoyer les références temporaires
    delete tempValuesRef.current['penalty'];
    delete tempValuesRef.current['bonus'];
    delete tempValuesRef.current['adjustment'];
    
    // NE PAS réinitialiser localAdjustmentValue ici - cela sera fait après la sauvegarde
  };

  // Fonction pour obtenir la valeur actuelle du slider unifié
  const getAdjustmentValue = () => {
    // Si on a une valeur locale (pendant le drag), l'utiliser
    if (localAdjustmentValue !== null) {
      return localAdjustmentValue;
    }
    
    // Sinon, utiliser les valeurs des props
    const penaltyValue = parseFloat(penalty) || 0;
    const bonusValue = parseFloat(bonus) || 0;
    
    if (penaltyValue > 0) {
      return -penaltyValue; // Retourner une valeur négative pour la pénalité
    }
    return bonusValue; // Retourner la valeur positive pour le bonus
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
  
  // Fonction pour recalculer et mettre à jour la note finale
  const handleRecalculateGrade = async () => {
    if (!correction || isCalculating) return;
    
    try {
      setIsCalculating(true);
      
      // Appeler l'API de recalcul de note finale
      const response = await fetch(`/api/corrections_autres/${correction.id}/recalculate-grade`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors du recalcul de la note finale');
      }
      
      const updatedCorrection = await response.json();
      
      // Émettre un événement pour informer les autres composants de la mise à jour
      const event = new CustomEvent('gradeUpdated', { 
        detail: { 
          message: 'Note finale recalculée avec succès',
          correction: updatedCorrection
        } 
      });
      window.dispatchEvent(event);
      
      // Afficher un message de succès
      showNotification('Note finale recalculée avec succès', 'success');
      
      // Afficher l'indicateur de succès central
      markSaveSuccess();
    } catch (error: any) {
      console.error('Erreur lors du recalcul de la note finale:', error);
      showNotification('Erreur lors du recalcul de la note finale', 'error');
      
      // Émettre un événement d'erreur
      const event = new CustomEvent('gradeError', { 
        detail: { message: error.message || 'Erreur lors du recalcul de la note finale' } 
      });
      window.dispatchEvent(event);
      
      // Afficher l'indicateur d'erreur central
      markSaveError();
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Notation sur {totalPoints.reduce((sum, points) => sum + points, 0)} points</span>
          <Button 
            variant="outlined" 
            size="small" 
            color="primary"
            startIcon={correction?.final_grade ? <RefreshIcon /> : <DoneIcon />}
            onClick={handleRecalculateGrade}
            disabled={saving || isCalculating}
          >
            {correction?.final_grade ? 'Recalculer la note finale' : 'Calculer la note finale'}
            {isCalculating && <CircularProgress size={16} color="inherit" sx={{ ml: 1 }} />}
          </Button>
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
      
      {/* Indicateur central de chargement et de succès */}
      {(saving || saveSuccess || saveError) && (
        <Box sx={{ 
          position: 'absolute', 
          margin: 'auto',
          left: 0, 
          right: 0,
          top: 0,
          bottom: 0,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'rgba(255, 255, 255, 0.8)',
          borderRadius: 2,
          p: 3,
          width: '100%',
          height: '100%',
          textAlign: 'center'
        }}>
          {saving && !saveSuccess && !saveError && (
            <CircularProgress size={120} color="primary" />
          )}
          {saveSuccess && (
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
          {saveError && (
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
                value={localPointsEarned[index] || 0}
                onChange={(_, newValue) => {
                  handleSliderDrag(index, newValue as number);
                }}
                onChangeCommitted={() => handleSliderCommit(index)}
                min={0}
                max={totalPoints[index]}
                step={0.25}
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
                {localPointsEarned[index] || '0'} / {totalPoints[index]}
              </Typography>
            </Box>
          </Grid>
        ))}

        {/* Section pour l'ajustement unifié (pénalité/bonus) */}
        {(isPenaltyEnabled || isBonusEnabled) && (
          <Grid size={{ xs: 12 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
              <Typography variant="body2" id="adjustment-slider" gutterBottom>
                Ajustement de points
              </Typography>
              <Slider
                aria-labelledby="adjustment-slider"
                value={getAdjustmentValue()}
                onChange={(_, newValue) => {
                  handleAdjustmentDrag(newValue as number);
                }}
                onChangeCommitted={handleAdjustmentCommit}
                min={-15}
                max={5}
                step={0.25}
                valueLabelDisplay="auto"
                marks={[
                  { value: -15, label: '-15' },
                  { value: -10, label: '-10' },
                  { value: -5, label: '-5' },
                  { value: -2.5, label: '-2.5' },
                  { value: 0, label: '0' },
                  { value: 2.5, label: '+2.5' },
                  { value: 5, label: '+5' }
                ]}
                disabled={neverSubmitted || isUpdating || saving}
                sx={{ 
                  width: "90%",
                  '& .MuiSlider-thumb': {
                    height: 20,
                    width: 20,
                    color: getAdjustmentValue() < 0 ? 'error.main' : 'success.main',
                  },
                  '& .MuiSlider-rail': {
                    opacity: 0.5,
                  },
                  '& .MuiSlider-track': {
                    color: getAdjustmentValue() < 0 ? 'error.main' : 'success.main',
                  },
                }}
              />
              <Typography 
                variant="caption" 
                color="text.secondary" 
                align="center" 
                sx={{ 
                  mt: 1,
                  color: getAdjustmentValue() < 0 ? 'error.main' : 
                         getAdjustmentValue() > 0 ? 'success.main' : 'text.secondary'
                }}
              >
                {getAdjustmentValue() === 0 ? 'Aucun ajustement' : 
                 getAdjustmentValue() < 0 ? `${getAdjustmentValue()} points (pénalité)` : 
                 `+${getAdjustmentValue()} points (bonus)`}
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