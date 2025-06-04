'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Student } from '@/lib/types';
import dayjs from 'dayjs';

import { generateHtmlFromItems, extractFormattedText } from '@/utils/htmlUtils';
import { copyToClipboard } from '@/utils/clipboardUtils';
import EmailFeedbackAutre from '@/components/corrections/EmailFeedbackAutre';

import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  IconButton,
  CircularProgress,
  Card,
  alpha,
  useTheme,
  Drawer,
  Zoom,
  Tooltip,
  Fab,
} from '@mui/material';

import AssignmentIcon from '@mui/icons-material/Assignment';
import DescriptionIcon from '@mui/icons-material/Description';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

import { useSnackbar } from 'notistack';
import GradientBackground from '@/components/ui/GradientBackground';
import PatternBackground from '@/components/ui/PatternBackground';
import LoadingSpinner from '@/components/LoadingSpinner';
import CorrectionHeader from '@/components/corrections/CorrectionHeader';
import CorrectionContentEditor from '@/components/corrections/CorrectionContentEditor';
import ActionButtons from '@/components/corrections/ActionButtons';
import DuplicateCorrection from '@/components/corrections/DuplicateCorrection';
import { FragmentsSidebar } from '@/components/fragments';
import GradingSectionAutres from '@/components/corrections/GradingSectionAutres';
import DatePickerSection from '@/components/corrections/DatePickerSection';
import ErrorDisplay from '@/components/ui/ErrorDisplay';
import StatusMessages from '@/components/corrections/StatusMessages';
import ShareModal from '@/app/components/ShareModal';

// Use our custom hooks
import { useFragments } from '@/lib/hooks/useFragments';
import { useCorrectionsAutres } from '@/lib/hooks/useCorrectionsAutres';

export default function CorrectionAutreDetail({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap the Promise for params using React.use in client components
  const { id } = React.use(params);
  const correctionId = id;
  
  const router = useRouter();
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const [shareModalOpen, setShareModalOpen] = useState(false)
  // Use our custom hooks
  const fragmentsHook = useFragments();
  const correctionsHook = useCorrectionsAutres(correctionId);

  // Destructure values from correction hook
  const {
    correction,
    contentItems,
    history,
    loading,
    saving,
    error,
    successMessage,
    editedName,
    isEditingName,
    confirmingDelete,
    correctionNotFound,
    activity,
    setContentItems,
    setError,
    clearError,
    setSuccessMessage,
    setEditedName,
    setIsEditingName,
    saveToHistory,
    handleUndo,
    fetchCorrectionData,
    handleSaveCorrection,
    handleSaveName,
    handleDelete,
    handleCancelDelete,
    handleToggleActive,
    handleChangeStatus,
    updatePointsEarned,
    setCorrection,
    saveDates,
    setSaving,
    firstName,
    lastName,
    email,
    setFirstName,
    setLastName,
    setEmail,
    correctionStatus,
  } = correctionsHook;

  // Local state for this component (uniquement ceux qui ne sont pas fournis par le hook)
  const [renderedHtml, setRenderedHtml] = useState<string>('');
  const [copiedMessage, setCopiedMessage] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false); // Changer à false pour que le drawer soit fermé par défaut
  const [autoSaveActive, setAutoSaveActive] = useState(true);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout>();
  const [deadlineDate, setDeadlineDate] = useState<dayjs.Dayjs | null>(null);
  const [submissionDate, setSubmissionDate] = useState<dayjs.Dayjs | null>(null);
  const [saveDateTimeout, setSaveDateTimeout] = useState<NodeJS.Timeout | null>(null);
  const [saveGradeTimeout, setSaveGradeTimeout] = useState<NodeJS.Timeout | null>(null);

  // État pour suivre si des changements sont en attente d'auto-sauvegarde
  const [changesDetected, setChangesDetected] = useState(false);
  const [contentChangeTimestamp, setContentChangeTimestamp] = useState<number | null>(null);

  // Fonction pour detecter les changements dans le contenu
  const handleContentChange = useCallback(() => {
    // Marquer qu'il y a des changements à sauvegarder
    setChangesDetected(true);
    // Enregistrer le timestamp du changement
    setContentChangeTimestamp(Date.now());
    
    
  }, []);

  // Pour le calcul du pourcentage et de la note finale
  const totalPointsEarned = correction?.points_earned?.reduce((sum, points) => sum + points, 0) || 0;
  const totalPossiblePoints = activity?.points?.reduce((sum, points) => sum + points, 0) || 0;
  const percentage = totalPossiblePoints > 0 ? (totalPointsEarned / totalPossiblePoints) * 100 : 0;

  // État pour indiquer si la pénalité est activée
  const isPenaltyEnabled = correction?.penalty !== undefined && correction?.penalty !== null;

  // Initialiser les dates lorsque correction change
  useEffect(() => {
    if (correction) {
      // Conversion des dates au format dayjs si elles existent
      setDeadlineDate(correction.deadline ? dayjs(correction.deadline) : null);
      setSubmissionDate(correction.submission_date ? dayjs(correction.submission_date) : null);
    }
  }, [correction]);

  // Fonction de sauvegarde des dates
  const handleSaveDates = async (deadline: string | null, submissionDate: string | null) => {
    try {
      if (!correction) {
        throw new Error('Correction introuvable');
      }
      
      setError('');
      setSaving(true);
      
      const response = await fetch(`/api/corrections_autres/${correction.id || correctionId}/dates`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deadline: deadline,
          submission_date: submissionDate,
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        // Créer une instance d'Error et y attacher les détails
        const error: any = new Error('Erreur lors de la sauvegarde des dates : ' + (errorData.message || 'Échec de sauvegarde des dates'));
        error.details = errorData.details || {};
        error.status = response.status;
        error.statusText = response.statusText;
        setError(error);
        throw error;
      }
  
      const updatedCorrection = await response.json();
      
      // Mettre à jour l'état local avec les dates et garder toutes les autres propriétés
      setCorrection(prev => {
        if (!prev) return null;
        return {
          ...prev,
          deadline: updatedCorrection.deadline,
          submission_date: updatedCorrection.submission_date
        };
      });
  
      setSuccessMessage('Dates sauvegardées avec succès');
      setTimeout(() => setSuccessMessage(''), 3000);
      return true;
    } catch (err: any) {
      const errorMsg = err.message || "Erreur inconnue lors de la sauvegarde des dates";
      console.error("Erreur détaillée:", err);
      
      // Créer un objet d'erreur avec tous les détails disponibles
      const errorWithDetails: any = new Error(errorMsg);
      errorWithDetails.details = err.details || {};
      errorWithDetails.status = err.status;
      errorWithDetails.statusText = err.statusText;
      
      setError(errorWithDetails);
      return false;
    } finally {
      setSaving(false);
    }
  };

    // Function to update an item's content
    const updateItem = (index: number, content: string) => {
      saveToHistory();
      setContentItems(prevItems => {
        const newItems = [...prevItems];
        const item = newItems[index];
        
        if (item.isFromFragment && item.content !== content) {
          newItems[index] = {
            ...item,
            content: content,
            isFromFragment: false,
            wasFromFragment: true,
          };
        } else {
          newItems[index] = {
            ...item,
            content: content
          };
        }
        
        setTimeout(() => {
          const updatedHtml = generateHtmlFromItems(newItems);
          setRenderedHtml(updatedHtml);
        }, 0);
        
        return newItems;
      });
      
      // Déclencher la détection des changements pour l'auto-sauvegarde
      handleContentChange();
    };
  

  // Fonction pour calculer et appliquer la pénalité de retard
  const calculateAndApplyLatePenalty = (deadlineDate: dayjs.Dayjs, submissionDate: dayjs.Dayjs) => {
    // Prendre en compte le status NON_RENDU
    if (correction?.status === 'NON_RENDU') {
      handleUpdatePenaltyWithGrade(0, { forceNonRendu: true });
      return;
    }
    // Calculer les jours de retard
    const daysLate = submissionDate.diff(deadlineDate, 'day');
    
    // Appliquer la pénalité si plus d'un jour de retard (2 points par jour)
    if (daysLate > 1) {
      const calculatedPenalty = Math.min(15, (daysLate - 1) * 2); // Soustraire 1 jour de période de grâce, puis 2 points par jour
      
      // Mettre à jour uniquement la pénalité en utilisant l'endpoint dédié
      handleUpdatePenaltyWithGrade(calculatedPenalty)
        .then(() => {
          // Afficher une notification sur la pénalité automatique
          setSuccessMessage(`Pénalité de ${calculatedPenalty} points appliquée pour ${daysLate} jours de retard (1 jour de grâce accordé)`);
          setTimeout(() => setSuccessMessage(''), 5000);
        })
        .catch(err => {
          console.error("Erreur lors de l'application de la pénalité:", err);
          setError("Erreur lors de l'application de la pénalité");
          setTimeout(() => setError(''), 5000);
        });
    } else {
      // Si la soumission n'est pas en retard ou seulement 1 jour de retard, supprimer toute pénalité automatique existante
      if (isPenaltyEnabled) {
        // Mettre uniquement la pénalité à zéro en utilisant l'endpoint dédié
        handleUpdatePenaltyWithGrade(0)
          .then(() => {
            // Afficher une notification sur la suppression de la pénalité
            const message = daysLate === 1 
              ? 'Jour de grâce accordé : 1 jour de retard sans pénalité' 
              : 'Pénalité de retard supprimée car le rendu est à temps';
            
            setSuccessMessage(message);
            setTimeout(() => setSuccessMessage(''), 5000);
          })
          .catch(err => {
            console.error("Erreur lors de la suppression de la pénalité:", err);
            setError("Erreur lors de la suppression de la pénalité");
            setTimeout(() => setError(''), 5000);
          });
      }
    }
  };

  // Fonction qui met à jour à la fois la pénalité et recalcule la note finale
  const handleUpdatePenaltyWithGrade = async (penaltyValue: number, options?: { forceNonRendu?: boolean }) => {
    
    try {
      if (!correction || !activity) {
        throw new Error('Données de correction ou d\'activité manquantes');
      }
      // Si on force le NON_RENDU, appliquer la logique spéciale
      if (options?.forceNonRendu) {
        const totalMaxPoints = activity.points?.reduce((sum, points) => sum + points, 0) || 0;
        const grade25Percent = Math.round(totalMaxPoints * 0.25 * 100) / 100;
        const zeroPoints = (activity.points || []).map(() => 0);
        const response = await fetch(`/api/corrections_autres/${correction.id}/grade`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            points_earned: zeroPoints,
            grade: grade25Percent,
            final_grade: grade25Percent,
            penalty: 0,
            status: 'NON_RENDU'
          }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          const error: any = new Error('Erreur lors de la mise à jour de la note : ' + (errorData.message || 'Échec de mise à jour de la note'));
          error.details = errorData.details || {};
          error.status = response.status;
          error.statusText = response.statusText;
          setError(error);
          throw error;
        }
        const data = await response.json();
        setCorrection(prev => {
          if (!prev) return null;
          return {
            ...prev,
            penalty: 0,
            grade: grade25Percent,
            final_grade: grade25Percent,
            points_earned: zeroPoints,
            status: 'NON_RENDU'
          };
        });
        const event = new CustomEvent('gradeUpdated', { 
          detail: { 
            message: 'Note NON_RENDU appliquée',
            correction: {
              penalty: 0,
              grade: grade25Percent,
              final_grade: grade25Percent,
              points_earned: zeroPoints,
              status: 'NON_RENDU'
            }
          } 
        });
        window.dispatchEvent(event);
        return data;
      }

      // Récupérer les points actuels
      const currentPointsEarned = correction.points_earned || [];
      
      // Calculer la note totale et finale avec la nouvelle pénalité
      const totalEarned = currentPointsEarned.reduce((sum, points) => sum + points, 0);
      const currentBonus = correction.bonus || 0;
      
      // Calculer la note finale selon les règles
      let finalGrade;
      if (totalEarned < 5) {
        // Si note < 5, on conserve la note mais on peut appliquer le bonus
        finalGrade = Math.max(totalEarned + currentBonus, totalEarned);
      } else {
        // Sinon on prend max(note-pénalité+bonus, 5)
        finalGrade = Math.max(totalEarned - penaltyValue + currentBonus, 5);
      }

      // Envoyer à la fois la pénalité et la note finale mises à jour
      const response = await fetch(`/api/corrections_autres/${correction.id}/grade`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },          body: JSON.stringify({
            points_earned: currentPointsEarned,
            grade: totalEarned,
            final_grade: finalGrade,
            penalty: penaltyValue,
            bonus: currentBonus
          }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        // Créer une instance d'Error et y attacher les détails
        const error: any = new Error('Erreur lors de la mise à jour de la note : ' + (errorData.message || 'Échec de mise à jour de la note'));
        error.details = errorData.details || {};
        error.status = response.status;
        error.statusText = response.statusText;
        setError(error);
        throw error;
      }
      
      const data = await response.json();
      
      // Mettre à jour l'état local avec toutes les valeurs mises à jour
      setCorrection(prev => {
        if (!prev) return null;
        return {
          ...prev,
          penalty: penaltyValue,
          grade: totalEarned,
          final_grade: finalGrade
        };
      });
      
      // Émettre un événement pour informer les autres composants
      const event = new CustomEvent('gradeUpdated', { 
        detail: { 
          message: 'Pénalité mise à jour',
          correction: {
            penalty: penaltyValue,
            grade: totalEarned,
            final_grade: finalGrade
          }
        } 
      });
      window.dispatchEvent(event);
      
      return data;
    } catch (error: any) {
      console.error("Erreur lors de la mise à jour de la pénalité:", error);
      
      // S'assurer que l'erreur a tous les détails nécessaires
      if (!error.details) {
        const errorWithDetails: any = new Error(error.message || "Erreur lors de la mise à jour de la pénalité");
        errorWithDetails.details = error.details || {};
        error.status = error.status;
        error.statusText = error.statusText;
        setError(errorWithDetails);
      } else {
        setError(error);
      }
      
      throw error;
    }
  };

  // Gestionnaires de modification de date
  const handleDeadlineDateChange = (newDate: dayjs.Dayjs | null) => {
    setDeadlineDate(newDate);
    
    // Effacer tout timeout existant
    if (saveDateTimeout) {
      clearTimeout(saveDateTimeout);
    }
    
    // Définir un nouveau timeout pour sauvegarder après 1 seconde d'inactivité
    const timeout = setTimeout(() => {
      if (correction) {
        // Utiliser la fonction qui ne touche pas aux notes
        handleSaveDates(
          newDate ? newDate.format('YYYY-MM-DD') : null,
          submissionDate ? submissionDate.format('YYYY-MM-DD') : null
        ).then(() => {
          // Calculer la pénalité si les deux dates sont définies
          if (newDate && submissionDate) {
            calculateAndApplyLatePenalty(newDate, submissionDate);
          }
        });
      }
    }, 500);
    
    setSaveDateTimeout(timeout);
  };

  const handleSubmissionDateChange = (newDate: dayjs.Dayjs | null) => {
    setSubmissionDate(newDate);
    
    // Effacer tout timeout existant
    if (saveDateTimeout) {
      clearTimeout(saveDateTimeout);
    }
    
    // Définir un nouveau timeout pour sauvegarder après 1 seconde d'inactivité
    const timeout = setTimeout(() => {
      if (correction) {
        // Utiliser la fonction qui ne touche pas aux notes
        handleSaveDates(
          deadlineDate ? deadlineDate.format('YYYY-MM-DD') : null,
          newDate ? newDate.format('YYYY-MM-DD') : null
        ).then(() => {
          // Calculer la pénalité si les deux dates sont définies
          if (deadlineDate && newDate) {
            calculateAndApplyLatePenalty(deadlineDate, newDate);
          }
        });
      }
    }, 500);
    
    setSaveDateTimeout(timeout);
  };

  // Destructure values from fragment hook
 const {
  setSelectedActivityId,
  fetchFragmentsForActivity,
  fetchAllActivities,
  handleAddFragment: addFragment,
} = fragmentsHook;




  // Initialize data on component mount
  useEffect(() => {
    // Fetch activities and correction, then set selected activity to the correction's activity
    fetchAllActivities();
    fetchCorrectionData(activityId => {
      setSelectedActivityId(activityId);
      fetchFragmentsForActivity(activityId);
    });
  }, [fetchAllActivities, fetchCorrectionData, setSelectedActivityId, fetchFragmentsForActivity]);

  // Effect to handle auto-save functionality
  useEffect(() => {
    if (correction) {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
      
      // Configure l'intervalle qui s'exécute toutes les 70 secondes
      // indépendamment de tout changement d'état
      autoSaveTimerRef.current = setInterval(() => {
        // Vérifie l'état actuel de autoSaveActive au moment de l'exécution
        if (autoSaveActive) {
          
          handleSaveCorrection()
            .then(() => {
              setLastAutoSave(new Date());
              
            })
            .catch(err => {
              console.error('Auto-save failed:', err);
              // Ne pas désactiver l'auto-sauvegarde en cas d'erreur
            });
        } else {
          
        }
      }, 70000); // Auto-save every 70 seconds
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [correction, handleSaveCorrection]); // Ne pas inclure autoSaveActive dans les dépendances

  // Écouter les événements de mise à jour des grades/pénalités
  useEffect(() => {
    // Fonction pour mettre à jour la correction à partir des événements
    const handleGradeUpdate = (event: CustomEvent) => {
      if (event.detail) {
        const updateType = event.detail.updateType;
        const correctionUpdate = event.detail.correction;

        // Mise à jour partielle (seulement la note ou la pénalité) - pas besoin de recharger les fragments
        if (updateType === 'gradeOnly' || updateType === 'penaltyOnly') {
          // Mettre à jour l'objet correction sans recharger la page
          setCorrection(prev => {
            if (!prev) return null;
            return {
              ...prev,
              ...correctionUpdate
            };
          });
        } 
        // Mise à jour complète - pourrait nécessiter de recharger les fragments
        else {
          // Mettre à jour l'objet correction sans recharger la page
          setCorrection(prev => {
            if (!prev) return null;
            return {
              ...prev,
              ...correctionUpdate
            };
          });
        }
      }
    };

    // Gérer les erreurs spécifiques aux notes
    const handleGradeError = (event: CustomEvent) => {
      if (event.detail && event.detail.message) {
        setError(event.detail.message);
        setTimeout(() => setError(''), 5000);
      }
    };

    // Ajouter les écouteurs d'événements
    window.addEventListener('gradeUpdated', handleGradeUpdate as EventListener);
    window.addEventListener('penaltyUpdated', handleGradeUpdate as EventListener);
    window.addEventListener('gradeError', handleGradeError as EventListener);
    
    // Nettoyer les écouteurs lors du démontage du composant
    return () => {
      window.removeEventListener('gradeUpdated', handleGradeUpdate as EventListener);
      window.removeEventListener('penaltyUpdated', handleGradeUpdate as EventListener);
      window.removeEventListener('gradeError', handleGradeError as EventListener);
    };
  }, [setCorrection, setError]);

  // Effect pour exécuter la logique d'auto-sauvegarde basée sur les changements
  useEffect(() => {
    // Ne rien faire si l'auto-save est désactivé ou s'il n'y a pas de changements
    if (!autoSaveActive || !changesDetected || !contentChangeTimestamp || !correction) {
      return;
    }
    
    // Calculer le temps restant avant la sauvegarde (70 secondes après le dernier changement)
    const timeElapsed = Date.now() - contentChangeTimestamp;
    const timeToWait = Math.max(0, 70000 - timeElapsed);
    
    
    
    // Configurer un timeout pour sauvegarder après le délai
    const autoSaveTimeout = setTimeout(() => {
      if (autoSaveActive && changesDetected) {
        
        
        handleSaveCorrection()
          .then(() => {
            setLastAutoSave(new Date());
            // Réinitialiser le détecteur de changements après sauvegarde réussie
            setChangesDetected(false);
            setContentChangeTimestamp(null);
            
          })
          .catch(err => {
            console.error('Auto-save failed:', err);
            // Garder changesDetected à true pour réessayer plus tard
          });
      }
    }, timeToWait);
    
    // Nettoyer le timeout si le composant est démonté ou si les dépendances changent
    return () => {
      clearTimeout(autoSaveTimeout);
    };
  }, [
    autoSaveActive, 
    changesDetected,
    contentChangeTimestamp,
    correction,
    handleSaveCorrection
  ]);

  // Function to update an item's content
  // Move an item (for drag and drop)
  const moveItem = (dragIndex: number, hoverIndex: number) => {
    saveToHistory();
    const newItems = [...contentItems];
    const draggedItem = newItems[dragIndex];
    newItems.splice(dragIndex, 1);
    newItems.splice(hoverIndex, 0, draggedItem);
    
    setContentItems(newItems);
    handleContentChange();
  };

  // Remove an item
  const removeItem = (index: number) => {
    saveToHistory();
    
    const itemToRemove = contentItems[index];
    if (itemToRemove.type === 'list') {
      setContentItems(items => 
        items.filter(item => item.id !== itemToRemove.id && item.parentId !== itemToRemove.id)
      );
    } else {
      setContentItems(items => {
        const newItems = [...items];
        newItems.splice(index, 1);
        return newItems;
      });
    }
    handleContentChange();
  };

  // Add a new paragraph
  const addNewParagraph = () => {
    saveToHistory();
    const newItem = {
      id: `item-${Date.now()}`,
      type: 'text' as const,
      content: 'Nouveau paragraphe',
      isFromFragment: false
    };
    
    setContentItems(prev => [...prev, newItem]);
    handleContentChange();
  };

  // Add a new image
  const addNewImage = (imageUrl: string) => {
    saveToHistory();
    const newItem = {
      id: `image-${Date.now()}`,
      type: 'image' as const,
      src: imageUrl,
      alt: 'Image uploadée',
      content: '',
      isFromFragment: false
    };
    
    setContentItems(prev => [...prev, newItem]);
    handleContentChange();
  };

  // Add a new audio
  const addNewAudio = (audioUrl: string) => {
    saveToHistory();
    const newItem = {
      id: `audio-${Date.now()}`,
      type: 'audio' as const,
      src: audioUrl,
      content: '',
      isFromFragment: false
    };
    
    setContentItems(prev => [...prev, newItem]);
    handleContentChange();
  };

  // Handle fragment addition
  const handleAddFragmentToCorrection = (fragment: any) => {
    saveToHistory();
    
    const newItems = fragment.content.split("\n\n")
      .filter((text: string) => text.trim())
      .map((text: string) => ({
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
        type: 'text' as const,
        content: text.trim(),
        isFromFragment: true,
        originalFragmentId: fragment.id,
        originalContent: text.trim()
      }));
    
    setContentItems(prev => [...prev, ...newItems]);
    handleContentChange();
  };




  // Function to toggle drawer open/close
  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  // Function to update preview
  const updatePreview = useCallback(() => {
    const html = generateHtmlFromItems(contentItems);
    setRenderedHtml(html);
  }, [contentItems]);

  // Update rendered HTML when contentItems change
  useEffect(() => {
    updatePreview();
  }, [contentItems, updatePreview]);

  // Function to handle copy to clipboard
  const handleCopyToClipboard = () => {
    const formattedText = extractFormattedText(contentItems);
    copyToClipboard(
      formattedText,
      (message) => {
        setCopiedMessage(message);
        setTimeout(() => setCopiedMessage(''), 3000);
      },
      (errorMsg) => setError(errorMsg)
    );
  };

  if (loading) {
    return (
      <div className="container max-w-[400px] mx-auto px-4 py-8 flex justify-center">
        <LoadingSpinner size="lg" text="Chargement des données" />
      </div>
    );
  }

  
  // Utiliser le composant ErrorDisplay avec les paramètres supportés
  // Plus besoin de transformer l'erreur, le composant ErrorDisplay s'en charge
  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <ErrorDisplay 
          error={error}
          errorDetails={typeof error === 'object' && error !== null ? (error as any).details : undefined}
          withRefreshButton={true}
          onRefresh={() => {
            setError('');
            window.location.reload();
          }}
        />
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Button 
            variant="outlined" 
            component={Link} 
            href="/activities" 
          >
            Retour aux activités
          </Button>
        </Box>
      </Container>
    );
  }

  if (!correction || !activity) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <ErrorDisplay 
          error="Correction introuvable"
        />
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Button 
            variant="outlined" 
            component={Link} 
            href="/activities"
          >
            Retour aux activités
          </Button>
        </Box>
      </Container>
    );
  }

  // Calculate drawer width
  const drawerWidth = 555;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Container sx={{ py: 5, px: { xs: 2, sm: 2, md: 2 }, maxWidth: '100%' }}>
        <Zoom in={true} timeout={500}>
          <Paper 
            elevation={3} 
            sx={{ 
              borderRadius: 3,
              overflow: 'hidden',
              boxShadow: theme => `0 8px 30px ${alpha(theme.palette.primary.main, 0.1)}`,
              transition: 'all 0.3s ease',
              minHeight: '90vh',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header with gradient */}
            <Box sx={{ position: 'relative' }}>
              <GradientBackground variant="primary" sx={{ position: 'relative', zIndex: 1, p: { xs: 2, sm: 3 } }}>
                <PatternBackground 
                  pattern='dots'
                  opacity={0.05}
                  sx={{ 
                    position: 'absolute', 
                    top: 0, 
                    left: 0, 
                    right: 0, 
                    bottom: 0, 
                    zIndex: -1 
                  }}
                />
                
                <CorrectionHeader
                  activityName={activity.name}
                  correction={correction}
                  editedName={editedName}
                  isEditingName={isEditingName}
                  confirmingDelete={confirmingDelete}
                  saving={saving}
                  setEditedName={setEditedName}
                  setIsEditingName={setIsEditingName}
                  handleSaveName={handleSaveName}
                  handleDelete={handleDelete}
                  handleCancelDelete={handleCancelDelete}
                  handleToggleActive={handleToggleActive}
                  firstName={firstName  || 'Étudiant'}
                  lastName={lastName || '#'}
                  setFirstName={(value) => setFirstName?.(value)}
                  setLastName={(value) => setLastName?.(value)}
                  email={email || 'Adresse mail introuvable'}
                  setEmail={(value) => setEmail?.(value)}
                  correctionStatus={correctionStatus}
                  handleChangeStatus={handleChangeStatus}
                />
              </GradientBackground>
            </Box>
            
            {/* Structure à deux colonnes sans onglets */}
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', lg: 'row' },
              flexGrow: 1,
              position: 'relative',
              overflow: 'auto' // Changer 'hidden' en 'auto' pour permettre le défilement
            }}>
              {/* Colonne principale - Éditeur de correction */}
              <Box sx={{ 
                p: { xs: 2, sm: 3 },
                flexGrow: 1,
                width: { xs: '100%', lg: drawerOpen ? '60%' : '75%' },
                transition: 'width 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                borderRight: { xs: 'none', lg: `1px solid ${alpha(theme.palette.divider, 0.3)}` }
              }}>
                {/* Titre de section */}
              
                <Box sx={{ display: 'flex', justifyContent:'space-around', gap: 2, mb: 3 }}>
                  <EmailFeedbackAutre 
                    correctionId={correctionId} 
                    student={correction.student_data as Student}
                    points_earned={correction.points_earned}
                    activityName={activity?.name}
                    activity_parts_names={activity?.parts_names}
                    activity_points={activity?.points}
                    penalty={correction.penalty?.toString()}
                  />
                  <DuplicateCorrection correctionId={correctionId} />
                </Box>
                
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AssignmentIcon color="secondary" />
                  Contenu de la correction
                </Typography>
                {/* Content editor component */}
                <Card sx={{ 
                  flexGrow: 1, 
                  mt: 2, 
                  p: 2,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: alpha(theme.palette.primary.main, 0.2),
                  boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.08)}`
                }}>
                  <CorrectionContentEditor
                    contentItems={contentItems}
                    moveItem={moveItem}
                    updateItem={updateItem}
                    removeItem={removeItem}
                    addNewParagraph={addNewParagraph}
                    addNewImage={addNewImage}
                    activityId={correction.activity_id}
                    correctionId={correctionId}
                  />
                </Card>
                
                {/* Action buttons component */}
                <Box sx={{ mt: 2 }}>
                  <ActionButtons
                    addNewParagraph={addNewParagraph}
                    addNewImage={addNewImage}
                    addNewAudio={addNewAudio}
                    handleUndo={handleUndo}
                    handleSaveCorrection={handleSaveCorrection}
                    updatePreview={updatePreview}
                    handleCopyToClipboard={handleCopyToClipboard}
                    setShareModalOpen={setShareModalOpen}
                    saving={saving}
                    historyLength={history.length}
                    activityId={correction.activity_id}
                    correctionId={correctionId}
                    autoSaveActive={autoSaveActive}
                    setAutoSaveActive={setAutoSaveActive}
                    lastAutoSave={lastAutoSave}
                  />
                </Box>

                {/* Erreur et messages de statut */}
                <ErrorDisplay 
                  error={error} 
                  errorDetails={typeof error === 'object' && error !== null ? (error as any).details : undefined}
                  onRefresh={() => {
                setError('');
                window.location.reload();
              }}
                />
                
                {/* Status messages component */}
                <StatusMessages
                  successMessage={successMessage}
                  copiedMessage={copiedMessage}
                  error={''} // Remplacer error par une chaîne vide puisque nous utilisons ErrorDisplay
                />

                {/* Titre de section */}
                <Typography variant="h6" fontWeight="bold" sx={{ mt: 4, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <DescriptionIcon color="secondary" />
                  Informations et notation
                </Typography>

                {/* Container pour les cartes avec position relative pour le CircularProgress */}
                <Box sx={{ position: 'relative' }}>
                  {/* Overlay de chargement global */}
                  {saving && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: theme => alpha(theme.palette.background.paper, 0.7),
                        zIndex: 5,
                        borderRadius: 2,
                        backdropFilter: 'blur(2px)'
                      }}
                    >
                      <CircularProgress size={50} thickness={4} />
                    </Box>
                  )}

                  {/* Date picker section */}
                  <Card sx={{ 
                    p: 3, 
                    borderRadius: 2,
                    mb: 3,
                    border: '1px solid',
                    borderColor: alpha(theme.palette.primary.main, 0.2)
                  }}>
                    <DatePickerSection
                      deadlineDate={deadlineDate}
                      submissionDate={submissionDate}
                      handleDeadlineDateChange={handleDeadlineDateChange}
                      handleSubmissionDateChange={handleSubmissionDateChange}
                      saving={false} /* Désactive le CircularProgress local */
                    />
                  </Card>

                  {/* Grading section component */}
                  <Card sx={{ 
                    p: 3, 
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: alpha(theme.palette.primary.main, 0.2)
                  }}>
                    <GradingSectionAutres
                      pointsEarned={correction.points_earned || []}
                      totalPoints={activity.points || []}
                      partNames={activity.parts_names || []}
                      isPenaltyEnabled={correction.penalty !== undefined && correction.penalty !== null}
                      penalty={correction.penalty?.toString() || '0'}
                      isBonusEnabled={correction.bonus !== undefined && correction.bonus !== null}
                      bonus={correction.bonus?.toString() || '0'}
                      setPointsEarned={(index, value) => {
                        const newPointsEarned = [...(correction.points_earned || [])];
                        newPointsEarned[index] = value;
                        // updatePointsEarned(newPointsEarned);
                        // Ne pas déclencher l'auto-sauvegarde pour les modifications de points
                      }}
                      setPenalty={(value) => {
                        setCorrection(prev => ({
                          ...prev!,
                          penalty: parseFloat(value)
                        }));
                        // Ne pas déclencher l'auto-sauvegarde pour les modifications de pénalité
                      }}
                      setBonus={(value) => {
                        setCorrection(prev => ({
                          ...prev!,
                          bonus: parseFloat(value)
                        }));
                        // Ne pas déclencher l'auto-sauvegarde pour les modifications de bonus
                      }}
                      saveGradeTimeout={saveGradeTimeout}
                      setSaveGradeTimeout={setSaveGradeTimeout}
                      correction={correction}
                      saving={false} /* Désactive le CircularProgress local */
                      setSaving={(value) => {
                        // Réutiliser la fonction setSaving du hook ou la simuler si non disponible
                        if (correctionsHook.setSaving) {
                          correctionsHook.setSaving(value);
                        } else {
                          // Fallback en utilisant l'état local
                          // Cette partie est exécutée seulement si setSaving n'est pas disponible dans le hook
                        }
                      }}
                      // Fonction pour mettre à jour uniquement la pénalité
                      handleUpdatePenalty={async (penaltyValue) => {
                        try {
                          const response = await fetch(`/api/corrections_autres/${correction.id}/penalty`, {
                            method: 'PUT',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              penalty: penaltyValue
                            }),
                          });
                          
                          if (!response.ok) {
                            const errorData = await response.json();
                            // Créer une instance d'Error et y attacher les détails
                            const error: any = new Error('Erreur lors de la mise à jour de la pénalité : ' + (errorData.message || 'Échec de mise à jour'));
                            error.details = errorData.details || {};
                            error.status = response.status;
                            error.statusText = response.statusText;
                            setError(error);
                            throw error;
                          }
                          
                          // Mettre à jour l'état local
                          setCorrection(prev => ({
                            ...prev!,
                            penalty: penaltyValue
                          }));
                          
                          return await response.json();
                        } catch (error: any) {
                          console.error("Erreur lors de la mise à jour de la pénalité:", error);
                          
                          // S'assurer que l'erreur a tous les détails nécessaires
                          if (!error.details) {
                            const errorWithDetails: any = new Error(error.message || "Erreur lors de la mise à jour de la pénalité");
                            errorWithDetails.details = error.details || {};
                            error.status = error.status;
                            error.statusText = error.statusText;
                            setError(errorWithDetails);
                          } else {
                            setError(error);
                          }
                          
                          throw error;
                        }
                      }}
                      // Fonction pour mettre à jour uniquement le bonus
                      handleUpdateBonus={async (bonusValue) => {
                        try {
                          const response = await fetch(`/api/corrections_autres/${correction.id}/bonus`, {
                            method: 'PUT',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              bonus: bonusValue
                            }),
                          });
                          
                          if (!response.ok) {
                            const errorData = await response.json();
                            // Créer une instance d'Error et y attacher les détails
                            const error: any = new Error('Erreur lors de la mise à jour du bonus : ' + (errorData.message || 'Échec de mise à jour'));
                            error.details = errorData.details || {};
                            error.status = response.status;
                            error.statusText = response.statusText;
                            setError(error);
                            throw error;
                          }
                          
                          // Mettre à jour l'état local
                          setCorrection(prev => ({
                            ...prev!,
                            bonus: bonusValue
                          }));
                          
                          return await response.json();
                        } catch (error: any) {
                          console.error("Erreur lors de la mise à jour du bonus:", error);
                          
                          // S'assurer que l'erreur a tous les détails nécessaires
                          if (!error.details) {
                            const errorWithDetails: any = new Error(error.message || "Erreur lors de la mise à jour du bonus");
                            errorWithDetails.details = error.details || {};
                            error.status = error.status;
                            error.statusText = error.statusText;
                            setError(errorWithDetails);
                          } else {
                            setError(error);
                          }
                          
                          throw error;
                        }
                      }}
                    />
                  </Card>
                </Box>
              </Box>

              {/* Colonne latérale - Fragments */}
              <Box sx={{ 
                width: { xs: '100%', lg: drawerWidth }, 
                p: 2,
                display: { xs: 'none', lg: 'block' },
                flexGrow: 1,
                pt: 2
              }}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FormatQuoteIcon color="secondary" />
                  Fragments et modèles
                </Typography>
                <FragmentsSidebar 
                  correctionActivityId={correction.activity_id}
                  onAddFragmentToCorrection={handleAddFragmentToCorrection}
                  inCorrectionContext={true}
                />
              </Box>
            
              {/* Drawer pour les fragments sur petits écrans */}
              <Drawer
                anchor="right"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                sx={{
                  width: drawerWidth,
                  flexShrink: 0,
                  display: { xs: 'block', lg: 'none' },
                  '& .MuiDrawer-paper': {
                    width: drawerWidth,
                    boxSizing: 'border-box',
                    p: 2,
                    overflow: 'auto' // Ajouter la propriété overflow pour permettre le défilement
                  },
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FormatQuoteIcon color="secondary" />
                    Fragments et modèles
                  </Typography>
                  <IconButton onClick={() => setDrawerOpen(false)}>
                    <ChevronRightIcon />
                  </IconButton>
                </Box>
                <FragmentsSidebar 
                  correctionActivityId={correction.activity_id}
                  onAddFragmentToCorrection={handleAddFragmentToCorrection}
                  inCorrectionContext={true}
                />
              </Drawer>

              {/* Bouton flottant pour ouvrir les fragments sur petits écrans */}
              <Zoom in={!drawerOpen}>
                <Fab 
                  color="primary" 
                  aria-label="Fragments"
                  onClick={() => setDrawerOpen(true)}
                  sx={{ 
                    position: 'fixed', 
                    bottom: 16, 
                    right: 16,
                    display: { xs: 'flex', lg: 'none' },
                    zIndex: (theme) => theme.zIndex.drawer - 1 
                  }}
                >
                  <FormatQuoteIcon />
                </Fab>
              </Zoom>
            </Box>
          </Paper>
        </Zoom>

        {/* Share modal */}
        <ShareModal
          open={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          correctionId={correctionId}
        />
      </Container>
    </LocalizationProvider>
  );
}