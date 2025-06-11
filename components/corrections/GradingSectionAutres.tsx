import React, { useState, useEffect, useRef } from 'react';
import { Typography, Slider, Box, Grid, Alert, FormControlLabel, Checkbox, CircularProgress, Stack, Fade, Button, IconButton, Tooltip } from '@mui/material';
import { useSnackbar } from 'notistack';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import DoneIcon from '@mui/icons-material/Done';
import CloseIcon from '@mui/icons-material/Close';
import { validateGradeConstraint } from '@/lib/correctionAutre';

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
  disabledParts?: boolean[]; // Tableau des parties désactivées
  setDisabledParts?: (disabledParts: boolean[]) => void; // Fonction pour gérer les parties désactivées
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
  setSaving = () => {},
  disabledParts = [],
  setDisabledParts,
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
  // Fonction pour stocker temporairement les valeurs pendant le glissement
  const tempValuesRef = useRef<{ [key: string | number]: number }>({});
  // Référence pour garder la dernière valeur valide du slider d'ajustement
  const lastValidAdjustmentRef = useRef<number>(0);
  // Référence pour stocker la dernière note finale valide (pour éviter les resets du slider)
  const lastValidFinalGradeRef = useRef<number | null>(null);

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

  // Fonction pour gérer la désactivation/activation d'une partie
  const handleTogglePartDisabled = (partIndex: number) => {
    if (!setDisabledParts) return;
    
    const newDisabledParts = [...disabledParts];
    
    // Debug: log de l'état avant modification
    console.log('handleTogglePartDisabled - avant:', { partIndex, disabledParts, newDisabledParts });
    
    // Assurer que le tableau a la bonne taille
    while (newDisabledParts.length < partNames.length) {
      newDisabledParts.push(false);
    }
    
    // Basculer l'état de la partie
    newDisabledParts[partIndex] = !newDisabledParts[partIndex];
    
    // Debug: log de l'état après modification
    console.log('handleTogglePartDisabled - après:', { partIndex, newDisabledParts });
    
    // Si on désactive la partie, remettre ses points à 0
    if (newDisabledParts[partIndex]) {
      setPointsEarned(partIndex, 0);
      showNotification(`Partie "${partNames[partIndex]}" désactivée pour cette correction`, 'warning');
    } else {
      showNotification(`Partie "${partNames[partIndex]}" réactivée pour cette correction`, 'info');
    }
    
    // Mettre à jour les parties désactivées (cela déclenchera automatiquement l'auto-save dans le parent)
    setDisabledParts(newDisabledParts);
    
    // Déclencher aussi la sauvegarde immédiate des notes pour persister l'état
    setTimeout(() => {
      const newPointsEarned = [...pointsEarned];
      if (newDisabledParts[partIndex]) {
        newPointsEarned[partIndex] = 0;
      }
      
      // TOUJOURS sauvegarder, que ce soit pour désactiver ou réactiver une partie
      // Passer explicitement les nouvelles parties désactivées
      saveGradeWithDebounce(
        newPointsEarned,
        isPenaltyEnabled ? parseFloat(penalty || '0') : 0,
        isBonusEnabled ? parseFloat(bonus || '0') : 0,
        newDisabledParts // Passer les parties désactivées mises à jour
      );
    }, 100);
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
  
  // Initialiser la référence de la dernière valeur valide au montage
  useEffect(() => {
    const penaltyValue = parseFloat(penalty) || 0;
    const bonusValue = parseFloat(bonus) || 0;
    
    if (bonusValue > 0) {
      lastValidAdjustmentRef.current = bonusValue;
    } else if (penaltyValue > 0) {
      lastValidAdjustmentRef.current = -penaltyValue;
    } else {
      lastValidAdjustmentRef.current = 0;
    }
    
    // Initialiser aussi la note finale si elle existe dans les props
    if (correction && correction.final_grade !== null && correction.final_grade !== undefined) {
      const correctionFinalGrade = parseFloat(String(correction.final_grade));
      if (!isNaN(correctionFinalGrade)) {
        lastValidFinalGradeRef.current = correctionFinalGrade;
      }
    }
  }, []); // Seulement au montage
  
  // Réinitialiser la valeur locale du slider quand les props penalty/bonus changent
  useEffect(() => {
    // Si nous ne sommes pas en train de faire un drag et que la sauvegarde est terminée
    if (!tempValuesRef.current['adjustment'] && !saving && !isUpdating) {
      // Toujours réinitialiser pour forcer la synchronisation avec les props
      // mais avec un petit délai pour laisser les props se mettre à jour
      const timer = setTimeout(() => {
        setLocalAdjustmentValue(null);
      }, 150);
      
      return () => clearTimeout(timer);
    }
  }, [penalty, bonus, saving, isUpdating]); // Ajouter saving et isUpdating pour déclencher après sauvegarde
  
  // Fonction pour sauvegarder les notes avec un délai
  const saveGradeWithDebounce = (newPointsEarned: number[], penaltyValue: number, bonusValue: number = 0, customDisabledParts?: boolean[]) => {
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
        
        // Valider les valeurs d'entrée uniquement (laisser l'API calculer grade et final_grade)
        const validatedPenalty = validateGradeConstraint(penaltyValue, 'penalty');
        const validatedBonus = validateGradeConstraint(bonusValue, 'bonus');
        
        // Valider les points earned individuellement
        const validatedPointsEarned = newPointsEarned.map((points, index) => 
          validateGradeConstraint(points, `points_earned[${index}]`)
        );
        
        // Utiliser les parties désactivées personnalisées si fournies, sinon utiliser l'état actuel
        const partsToSave = customDisabledParts !== undefined ? customDisabledParts : disabledParts;
        
        // Debug: vérifier que les parties désactivées sont correctement transmises
        console.log('saveGradeWithDebounce - disabledParts à sauvegarder:', partsToSave);
        
        // Appeler l'API en laissant le serveur calculer grade et final_grade
        // en passant les parties désactivées
        fetch(`/api/corrections_autres/${correction.id}/grade`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            points_earned: validatedPointsEarned,
            penalty: validatedPenalty,
            bonus: validatedBonus,
            disabledParts: partsToSave
          }),
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
          })
          .then((data) => {
            // Mise à jour de l'état local de correction avec les nouvelles valeurs
            if (data && data.points_earned !== undefined) {
              // Mettre à jour la référence de la note finale si disponible
              if (data.final_grade !== null && data.final_grade !== undefined) {
                lastValidFinalGradeRef.current = data.final_grade;
              }
              
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
    }, 500); // Délai de 500ms

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
        
        // Appeler l'API avec les valeurs de pénalité/bonus et laisser le serveur calculer grade et final_grade
        // en passant les parties désactivées
        fetch(`/api/corrections_autres/${correction.id}/grade`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            points_earned: [...pointsEarned],
            penalty: validatedPenalty,
            bonus: validatedBonus,
            disabledParts: disabledParts
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
            
            // Mettre à jour la référence de la note finale pour éviter les resets
            if (data.final_grade !== null && data.final_grade !== undefined) {
              lastValidFinalGradeRef.current = data.final_grade;
            }
            
            // La synchronisation de localAdjustmentValue sera gérée par les useEffect
            
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
    }, 500);
    
    setSaveGradeTimeout(timeout);
  };

  // Fonction pour appliquer la notation "travail non rendu"
  const handleNeverSubmittedChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = event.target.checked;
    setIsUpdating(true);
    setSaving(true); // Indiquer que la sauvegarde est en cours
    setNeverSubmitted(isChecked);
    
    
    if (isChecked) {
      
      // Pour un travail non rendu, on attribue directement 25% des points max (en excluant les parties désactivées)
      const totalMaxPoints = totalPoints.reduce((sum, points, index) => {
        // Exclure les parties désactivées du calcul du total maximum
        if (disabledParts[index]) {
          return sum;
        }
        return sum + points;
      }, 0);
      const grade25Percent = totalMaxPoints * 0.25; // 25% des points maximums ajustés
      
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
            status: 'NON_RENDU', // Ajouter le statut explicite
            disabledParts: disabledParts // Passer les parties désactivées
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
            
            // Mettre à jour la référence de la note finale
            lastValidFinalGradeRef.current = validatedGrade25;
            
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
            status: 'ACTIVE', // Réinitialiser le statut
            disabledParts: disabledParts // Passer les parties désactivées
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
            
            // Mettre à jour la référence de la note finale
            lastValidFinalGradeRef.current = 0;
            
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
    // Calculer le total maximum en excluant les parties désactivées
    const totalMaxPoints = totalPoints.reduce((sum, points, index) => {
      // Exclure les parties désactivées du calcul du total maximum
      if (disabledParts[index]) {
        return sum;
      }
      return sum + points;
    }, 0);
    
    // Utiliser la même logique que le serveur (lib/correctionAutre.ts)
    let finalGrade;
    if (grade < 5) {
      // Si la note est inférieure à 5, on conserve la note initiale mais on peut appliquer le bonus
      finalGrade = Math.max(grade + bonus, grade);
    } else {
      // Sinon, on applique la pénalité et le bonus mais ne descend pas en dessous de 5
      finalGrade = Math.max(5, grade - penalty + bonus);
    }
    
    // S'assurer que la note finale ne dépasse pas le maximum possible
    return Math.min(finalGrade, totalMaxPoints);
  };

  // Calculer la note totale
  const calculateTotalGrade = (): number => {
    return pointsEarned.reduce((sum, points, index) => {
      // Exclure les parties désactivées du calcul
      if (disabledParts[index]) {
        return sum;
      }
      return sum + points;
    }, 0);
  };

  // Calculer la note finale (avec application de la pénalité et du bonus si nécessaire)
  const getFinalGrade = (): number => {
    // Si c'est un travail non rendu, renvoyer 25% des points max (en excluant les parties désactivées)
    if (neverSubmitted) {
      const totalMaxPoints = totalPoints.reduce((sum, points, index) => {
        // Exclure les parties désactivées du calcul du total maximum
        if (disabledParts[index]) {
          return sum;
        }
        return sum + points;
      }, 0);
      const finalGrade = totalMaxPoints * 0.25;
      lastValidFinalGradeRef.current = finalGrade;
      return finalGrade;
    }
    
    const totalGrade = calculateTotalGrade();
    const penaltyValue = parseFloat(penalty) || 0;
    const bonusValue = parseFloat(bonus) || 0;
    
    // Calculer la note finale normalement
    const calculatedFinalGrade = calculateFinalGrade(totalGrade, penaltyValue, bonusValue);
    
    // Si on a une note finale calculée valide (non zéro ou avec des adjustements), la sauvegarder et l'utiliser
    if (calculatedFinalGrade > 0 || penaltyValue > 0 || bonusValue > 0) {
      lastValidFinalGradeRef.current = calculatedFinalGrade;
      return calculatedFinalGrade;
    }
    
    // Si on a une note finale depuis les props de correction, l'utiliser comme fallback
    if (correction && correction.final_grade !== null && correction.final_grade !== undefined) {
      const correctionFinalGrade = parseFloat(String(correction.final_grade));
      if (!isNaN(correctionFinalGrade)) {
        lastValidFinalGradeRef.current = correctionFinalGrade;
        return correctionFinalGrade;
      }
    }
    
    // En dernier recours, utiliser la dernière valeur valide connue si elle existe
    if (lastValidFinalGradeRef.current !== null && lastValidFinalGradeRef.current > 0) {
      return lastValidFinalGradeRef.current;
    }
    
    // Sinon, retourner la valeur calculée (même si c'est 0)
    return calculatedFinalGrade;
  };
  
  // Calculer le pourcentage obtenu
  const getPercentage = (): number => {
    // Si c'est un travail non rendu, renvoyer 25%
    if (neverSubmitted) {
      return 25;
    }
    
    const totalEarned = calculateTotalGrade();
    // Calculer le total maximum en excluant les parties désactivées
    const totalMaxPoints = totalPoints.reduce((sum, points, index) => {
      // Exclure les parties désactivées du calcul du total maximum
      if (disabledParts[index]) {
        return sum;
      }
      return sum + points;
    }, 0);
    
    return totalMaxPoints > 0 ? (totalEarned / totalMaxPoints) * 100 : 0;
  };

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
    // Mettre à jour aussi la référence de la dernière valeur valide
    lastValidAdjustmentRef.current = newValue;
    
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
      // Mettre à jour la dernière valeur valide
      lastValidAdjustmentRef.current = localAdjustmentValue;
      return localAdjustmentValue;
    }
    
    // Sinon, utiliser les valeurs des props
    const penaltyValue = parseFloat(penalty) || 0;
    const bonusValue = parseFloat(bonus) || 0;
    
    // Calculer la valeur selon les props
    let adjustmentFromProps = 0;
    if (bonusValue > 0) {
      adjustmentFromProps = bonusValue; // Retourner la valeur positive pour le bonus
    } else if (penaltyValue > 0) {
      adjustmentFromProps = -penaltyValue; // Retourner une valeur négative pour la pénalité
    }
    
    // Si on a une valeur valide depuis les props, l'utiliser et la sauvegarder
    if (adjustmentFromProps !== 0) {
      lastValidAdjustmentRef.current = adjustmentFromProps;
      return adjustmentFromProps;
    }
    
    // En dernier recours, utiliser la dernière valeur valide connue
    // Cela évite que le slider revienne à 0 pendant les transitions
    return lastValidAdjustmentRef.current;
  };
  
  // État pour suivre si une sauvegarde a été réussie récemment
  const [saveSuccess, setSaveSuccess] = useState(false);
  // État pour suivre si une erreur s'est produite récemment
  const [saveError, setSaveError] = useState(false);
  // Durée d'affichage des indicateurs de succès/erreur (en ms)
  const INDICATOR_DISPLAY_DURATION = 1000;
  
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
      
      // Appeler l'API de recalcul de note finale en passant les parties désactivées
      const response = await fetch(`/api/corrections_autres/${correction.id}/recalculate-grade`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          disabledParts: disabledParts
        })
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
          <span>
            Notation sur {totalPoints.reduce((sum, points, index) => {
              // Exclure les parties désactivées du calcul du total pour l'affichage
              if (disabledParts[index]) {
                return sum;
              }
              return sum + points;
            }, 0)} points
            {disabledParts.some(disabled => disabled) && (
              <span style={{ color: '#ff9800', fontSize: '0.8rem', marginLeft: '8px' }}>
                (sur {totalPoints.reduce((sum, points) => sum + points, 0)} total)
              </span>
            )}
          </span>
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
              {/* Titre de la partie avec bouton de désactivation */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
                <Typography 
                  variant="body2" 
                  id={`slider-${index}`} 
                  sx={{
                    textDecoration: disabledParts[index] ? 'line-through' : 'none',
                    opacity: disabledParts[index] ? 0.5 : 1,
                    color: disabledParts[index] ? 'text.disabled' : 'inherit'
                  }}
                >
                  {partName}
                </Typography>
                {setDisabledParts && (
                  <Tooltip title={disabledParts[index] ? "Réactiver cette partie" : "Désactiver cette partie"}>
                    <IconButton
                      size="small"
                      onClick={() => handleTogglePartDisabled(index)}
                      disabled={neverSubmitted || isUpdating || saving}
                      sx={{
                        color: disabledParts[index] ? 'error.main' : 'text.secondary',
                        '&:hover': {
                          color: disabledParts[index] ? 'error.dark' : 'error.main',
                          backgroundColor: disabledParts[index] ? 'error.lighter' : 'action.hover'
                        },
                        transition: 'all 0.2s'
                      }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
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
                disabled={neverSubmitted || isUpdating || saving || disabledParts[index]}
                sx={{ 
                  width: "90%",
                  color: index % 2 === 0 ? 'primary.main' : 'secondary.main',
                  opacity: disabledParts[index] ? 0.4 : 1,
                  '& .MuiSlider-thumb': {
                    height: 20,
                    width: 20,
                  },
                  '& .MuiSlider-rail': {
                    opacity: 0.5,
                  }
                }}
              />
              <Typography 
                variant="caption" 
                align="center" 
                sx={{ 
                  mt: 1,
                  opacity: disabledParts[index] ? 0.5 : 1,
                  color: disabledParts[index] ? 'text.disabled' : 'text.secondary',
                  textDecoration: disabledParts[index] ? 'line-through' : 'none'
                }}
              >
                {disabledParts[index] ? 'Désactivé' : `${localPointsEarned[index] || '0'} / ${totalPoints[index]}`}
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
              max={totalPoints.reduce((sum, points, index) => {
                // Exclure les parties désactivées du calcul du maximum pour l'affichage
                if (disabledParts[index]) {
                  return sum;
                }
                return sum + points;
              }, 0)}
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
              {getFinalGrade().toFixed(1)} / {totalPoints.reduce((sum, points, index) => {
                // Afficher le total ajusté en excluant les parties désactivées
                if (disabledParts[index]) {
                  return sum;
                }
                return sum + points;
              }, 0)}
              {disabledParts.some(disabled => disabled) && (
                <span style={{ color: '#ff9800', marginLeft: '8px' }}>
                  (Parties désactivées exclues)
                </span>
              )}
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </>
  );
};

export default GradingSectionAutres;