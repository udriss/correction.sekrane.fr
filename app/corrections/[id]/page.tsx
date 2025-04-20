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
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [autoSaveActive, setAutoSaveActive] = useState(true);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout>();
  const [deadlineDate, setDeadlineDate] = useState<dayjs.Dayjs | null>(null);
  const [submissionDate, setSubmissionDate] = useState<dayjs.Dayjs | null>(null);
  const [saveDateTimeout, setSaveDateTimeout] = useState<NodeJS.Timeout | null>(null);
  const [saveGradeTimeout, setSaveGradeTimeout] = useState<NodeJS.Timeout | null>(null);
  // Determine if the correction is active
  const isActive = correction?.active === 1 || correction?.status === 'ACTIVE';

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
        throw new Error('Correction non trouvée');
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
        const error = new Error('Erreur lors de la sauvegarde des dates : ' + (errorData.message || 'Échec de sauvegarde des dates'));
        (error as any).details = errorData.details || {};
        setError(error.message);
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
      setError(`Erreur lors de la sauvegarde des dates: ${err.message}`);
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
    };
  

  // Fonction pour calculer et appliquer la pénalité de retard
  const calculateAndApplyLatePenalty = (deadlineDate: dayjs.Dayjs, submissionDate: dayjs.Dayjs) => {
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
  const handleUpdatePenaltyWithGrade = async (penaltyValue: number) => {
    try {
      if (!correction || !activity) {
        throw new Error('Données de correction ou d\'activité manquantes');
      }

      // Récupérer les points actuels
      const currentPointsEarned = correction.points_earned || [];
      
      // Calculer la note totale et finale avec la nouvelle pénalité
      const totalEarned = currentPointsEarned.reduce((sum, points) => sum + points, 0);
      
      // Calculer la note finale selon les règles
      let finalGrade;
      if (totalEarned < 5) {
        // Si note < 5, on garde cette note
        finalGrade = totalEarned;
      } else {
        // Sinon on prend max(note-pénalité, 5)
        finalGrade = Math.max(totalEarned - penaltyValue, 5);
      }

      // Envoyer à la fois la pénalité et la note finale mises à jour
      const response = await fetch(`/api/corrections_autres/${correction.id}/grade`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          points_earned: currentPointsEarned,
          grade: totalEarned,
          final_grade: finalGrade,
          penalty: penaltyValue
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update penalty and grade');
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
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la pénalité:", error);
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
    }, 1000);
    
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
    }, 1000);
    
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
    if (correction && autoSaveActive) {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
      
      autoSaveTimerRef.current = setInterval(() => {
        if (history.length > 0 || contentItems.length > 0) {
          handleSaveCorrection()
            .then(() => {
              setLastAutoSave(new Date());
            })
            .catch(err => {
              console.error('Auto-save failed:', err);
              setAutoSaveActive(false);
            });
        }
      }, 70000); // Auto-save every 70 seconds
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [correction, autoSaveActive, history.length, contentItems]);

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

  // Function to update an item's content
  // Move an item (for drag and drop)
  const moveItem = (dragIndex: number, hoverIndex: number) => {
    saveToHistory();
    const newItems = [...contentItems];
    const draggedItem = newItems[dragIndex];
    newItems.splice(dragIndex, 1);
    newItems.splice(hoverIndex, 0, draggedItem);
    
    setContentItems(newItems);
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
          error="Correction non trouvée"
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
  const drawerWidth = 340;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Container maxWidth="xl" sx={{ py: 4, px: { xs: 2, sm: 3, md: 4 } }}>
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
              overflow: 'hidden'
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
                      setPointsEarned={(index, value) => {
                        const newPointsEarned = [...(correction.points_earned || [])];
                        newPointsEarned[index] = value;
                        updatePointsEarned(newPointsEarned);
                      }}
                      setPenalty={(value) => {
                        setCorrection(prev => ({
                          ...prev!,
                          penalty: parseFloat(value)
                        }));
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
                          
                          if (!response.ok) throw new Error('Failed to update penalty');
                          
                          // Mettre à jour l'état local
                          setCorrection(prev => ({
                            ...prev!,
                            penalty: penaltyValue
                          }));
                          
                          return await response.json();
                        } catch (error) {
                          console.error("Erreur lors de la mise à jour de la pénalité:", error);
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
            
              {/* Panneau flottant des fragments - pour les petits écrans */}
              <Drawer
                variant="persistent"
                anchor="right"
                open={drawerOpen && window.innerWidth < theme.breakpoints.values.lg}
                sx={{
                  width: drawerWidth,
                  flexShrink: 0,
                  display: { xs: 'block', lg: 'none' },
                  '& .MuiDrawer-paper': {
                    width: drawerWidth,
                    border: 'none',
                    borderLeft: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
                    boxSizing: 'border-box',
                  },
                }}
              >
                {/* Contenu du drawer pour les fragments */}
                <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="h6" fontWeight="bold">Fragments</Typography>
                  <IconButton onClick={toggleDrawer} size="small"><ChevronRightIcon /></IconButton>
                </Box>
                <FragmentsSidebar 
                  correctionActivityId={correction.activity_id}
                  onAddFragmentToCorrection={handleAddFragmentToCorrection}
                  inCorrectionContext={true}
                />
              </Drawer>

              {/* Bouton flottant pour ouvrir les fragments (petits écrans) */}
              {!drawerOpen && (
                <Tooltip title="Afficher les fragments">
                  <IconButton 
                    onClick={toggleDrawer} 
                    size="small" 
                    sx={{ 
                      position: 'fixed', 
                      right: 20, 
                      bottom: 20, 
                      bgcolor: theme.palette.primary.main,
                      color: 'white',
                      '&:hover': {
                        bgcolor: theme.palette.primary.dark,
                      },
                      zIndex: 10,
                      display: { xs: 'flex', lg: 'none' }
                    }}
                  >
                    <FormatQuoteIcon />
                  </IconButton>
                </Tooltip>
              )}
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