'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useIsomorphicLayoutEffect } from '@/utils/client-hooks';
import Link from 'next/link';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

import { ContentItem } from '@/types/correction';
import DraggableItem from '@/app/components/DraggableItem';
import FragmentItem from '@/app/components/FragmentItem';
import { generateHtmlFromItems, extractFormattedText } from '@/utils/htmlUtils';
import { copyToClipboard } from '@/utils/clipboardUtils';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
// Add Material UI imports
import { 
  Button, 
  IconButton,
  TextField,
  Paper,
  Typography,
  Box,
  Divider,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Slider
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import UndoIcon from '@mui/icons-material/Undo';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

// Importer le composant ShareModal
import ShareModal from '@/app/components/ShareModal';
import { Share as ShareIcon } from '@mui/icons-material';

// Import our new hooks
import { useFragments } from '@/lib/hooks/useFragments';
import { useCorrections } from '@/lib/hooks/useCorrections';

import ImageUploader from '@/app/components/ImageUploader';

export default function CorrectionDetail({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap the Promise for params using React.use in client components
  const { id } = React.use(params);
  const correctionId = id;
  
  // Use our custom hooks
  const fragmentsHook = useFragments();
  const correctionsHook = useCorrections(correctionId);
  
  // Local state for this component
  const [renderedHtml, setRenderedHtml] = useState<string>('');
  const [newFragmentContent, setNewFragmentContent] = useState('');
  const [showAddFragment, setShowAddFragment] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState('');
  const [shareModalOpen, setShareModalOpen] = useState(false);
  
  // Add state for date pickers - update variable names for clarity
  const [deadlineDate, setDeadlineDate] = useState<dayjs.Dayjs | null>(null);  // Changed from dueDate
  const [submissionDate, setSubmissionDate] = useState<dayjs.Dayjs | null>(null);
  const [saveDateTimeout, setSaveDateTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // Destructure values from fragment hook
  const {
    fragments,
    activities,
    selectedActivityId,
    loadingActivities,
    loadingFragments,
    addingFragment,
    editingFragmentId,
    editedFragmentContent,
    savingFragment,
    deletingIds,
    setSelectedActivityId,
    setEditedFragmentContent,
    fetchFragmentsForActivity,
    fetchAllActivities,
    handleAddFragment: addFragment,
    handleDeleteFragment,
    handleCreateNewFragment,
    handleEditFragment,
    handleCancelEditFragment,
    handleSaveFragment,
    moveFragment,
  } = fragmentsHook;
  
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
    setContentItems,
    setError,
    setSuccessMessage,
    setEditedName,
    setIsEditingName,
    saveToHistory,
    handleUndo,
    fetchCorrectionData,
    handleSaveCorrection,
    handleSaveName,
    handleDelete,
    handleCancelDelete
  } = correctionsHook;

  // Add state for experimental and theoretical grades
  const [experimentalGrade, setExperimentalGrade] = useState<string>('');
  const [theoreticalGrade, setTheoreticalGrade] = useState<string>('');
  const [isPenaltyEnabled, setIsPenaltyEnabled] = useState(false);
  const [penalty, setPenalty] = useState<string>('');
  const [saveGradeTimeout, setSaveGradeTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // Ajouter des états pour les points expérimentaux et théoriques
  const [experimentalPoints, setExperimentalPoints] = useState<number>(0);
  const [theoreticalPoints, setTheoreticalPoints] = useState<number>(0);

  // Initialize data on component mount
  useEffect(() => {
    // Fetch activities and correction, then set selected activity to the correction's activity
    fetchAllActivities();
    fetchCorrectionData(activityId => {
      setSelectedActivityId(activityId);
      fetchFragmentsForActivity(activityId);
    });
  }, [fetchAllActivities, fetchCorrectionData, setSelectedActivityId, fetchFragmentsForActivity]);

  // Fonction pour mettre à jour l'aperçu complet de façon fiable
  const updatePreview = useCallback(() => {
    const html = generateHtmlFromItems(contentItems);
    setRenderedHtml(html);
  }, [contentItems]);

  // Update rendered HTML when contentItems change
  useEffect(() => {
    updatePreview();
  }, [contentItems, updatePreview]);

  // Récupérer les détails de l'activité pour obtenir les points expérimentaux et théoriques
  useEffect(() => {
    if (correction?.activity_id) {
      const fetchActivityDetails = async () => {
        try {
          const response = await fetch(`/api/activities/${correction.activity_id}`);
          if (response.ok) {
            const activityData = await response.json();
            setExperimentalPoints(activityData.experimental_points || 5);
            setTheoreticalPoints(activityData.theoretical_points || 15);
          }
        } catch (error) {
          console.error("Erreur lors de la récupération des détails de l'activité:", error);
        }
      };
      fetchActivityDetails();
    }
  }, [correction]);

  // Add effect to initialize grades when correction loads
  useEffect(() => {
    if (correction) {
      // Use explicit type checking for grade and penalty
      const hasGrade = correction.grade !== undefined && correction.grade !== null;
      if (hasGrade) {
        // Calculate experimental and theoretical grades from the total grade
        const totalGrade = parseFloat(String(correction.grade));
        const expGrade = (totalGrade * (experimentalPoints || 5)) / 20;
        const theoGrade = (totalGrade * (theoreticalPoints || 15)) / 20;
        
        setExperimentalGrade(expGrade.toFixed(1));
        setTheoreticalGrade(theoGrade.toFixed(1));
      }
      
      const hasPenalty = correction.penalty !== undefined && correction.penalty !== null;
      setIsPenaltyEnabled(hasPenalty);
      if (hasPenalty) {
        setPenalty(String(correction.penalty));
      }
    }
  }, [correction, experimentalPoints, theoreticalPoints]);

  // Add effect to initialize dates when correction loads
  useEffect(() => {
    if (correction) {
      // Set dates if they exist in the correction data - update field references
      if (correction.deadline) {   // Changed from due_date
        setDeadlineDate(dayjs(correction.deadline));   // Changed variable name
      }
      if (correction.submission_date) {
        setSubmissionDate(dayjs(correction.submission_date));
      }
    }
  }, [correction]);

  // Add effect to initialize grades from DB values when correction loads
  useEffect(() => {
    if (correction) {
      // Use explicit type checking and check for the new fields
      if (correction.experimental_points_earned !== undefined && correction.experimental_points_earned !== null) {
        setExperimentalGrade(String(correction.experimental_points_earned));
      } else if (correction.grade !== undefined && correction.grade !== null) {
        // Fallback to calculating from grade if we don't have the specific fields
        const totalGrade = parseFloat(String(correction.grade));
        const expGrade = (totalGrade * (experimentalPoints || 5)) / 20;
        setExperimentalGrade(expGrade.toFixed(1));
      }
      
      if (correction.theoretical_points_earned !== undefined && correction.theoretical_points_earned !== null) {
        setTheoreticalGrade(String(correction.theoretical_points_earned));
      } else if (correction.grade !== undefined && correction.grade !== null) {
        // Fallback to calculating from grade if we don't have the specific fields
        const totalGrade = parseFloat(String(correction.grade));
        const theoGrade = (totalGrade * (theoreticalPoints || 15)) / 20;
        setTheoreticalGrade(theoGrade.toFixed(1));
      }
      
      const hasPenalty = correction.penalty !== undefined && correction.penalty !== null;
      setIsPenaltyEnabled(hasPenalty);
      if (hasPenalty) {
        setPenalty(String(correction.penalty));
      }
    }
  }, [correction, experimentalPoints, theoreticalPoints]);

  // Function to update an item's content with aperçu forcé
  const updateItem = (index: number, content: string) => {
    saveToHistory();
    setContentItems(prevItems => {
      const newItems = [...prevItems];
      const item = newItems[index];
      
      // Si l'item provient d'un fragment et est modifié pour la première fois,
      // on le "détache" du fragment original en supprimant le lien
      if (item.isFromFragment && item.content !== content) {
        newItems[index] = {
          ...item,
          content: content,
          isFromFragment: false, // Marquer comme n'étant plus un fragment original
          wasFromFragment: true, // Mais garder trace de son origine
        };
      } else {
        // Pour les autres items, mise à jour normale
        newItems[index] = {
          ...item,
          content: content
        };
      }
      
      // Force a re-render of HTML after state update
      setTimeout(() => {
        const updatedHtml = generateHtmlFromItems(newItems);
        setRenderedHtml(updatedHtml);
      }, 0);
      
      return newItems;
    });
  };

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
      // If it's a list, also remove its children
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
      isFromFragment: false // Marquer comme n'étant pas un fragment
    };
    
    setContentItems(prev => [...prev, newItem]);
  };

  // Ajouter une fonction pour ajouter une image
  const addNewImage = (imageUrl: string) => {
    saveToHistory();
    const newItem = {
      id: `image-${Date.now()}`,
      type: 'image' as const,
      src: imageUrl,
      alt: 'Image uploadée',
      content: '', // Garder le content pour la compatibilité
      isFromFragment: false // Marquer comme n'étant pas un fragment
    };
    
    setContentItems(prev => [...prev, newItem]);
  };

  // Copy content to clipboard
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

  // Create a new fragment
  const handleCreateNewFragmentWrapper = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFragmentContent.trim() || !correction) return;

    const newFragment = await handleCreateNewFragment(correction.activity_id, newFragmentContent);
    if (newFragment) {
      setNewFragmentContent('');
      setShowAddFragment(false);
    }
  };

  // Add fragment to correction
  const handleAddFragment = (fragment: any) => {
    saveToHistory();
    
    // Create completely new items by deep copying the fragment data
    const newItems = fragment.content.split("\n\n").filter((text: string) => text.trim()).map((text: string) => ({
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
      type: 'text' as const,
      content: text.trim(),
      isFromFragment: true, // Marquer ces items comme provenant d'un fragment
      originalFragmentId: fragment.id, // Stocker l'ID original du fragment
      originalContent: text.trim() // Garder une copie du contenu original
    }));
    
    setContentItems(prev => [...prev, ...newItems]);
  };

  // Handle activity change
  const handleActivityChange = (event: any) => {
    const newActivityId = Number(event.target.value);
    setSelectedActivityId(newActivityId);
    fetchFragmentsForActivity(newActivityId);
  };

  // Function to calculate the total grade from experimental and theoretical grades
  const calculateTotalGrade = useCallback(() => {
    // Convertir les valeurs des champs en nombres
    const expGrade = parseFloat(experimentalGrade || '0');
    const theoGrade = parseFloat(theoreticalGrade || '0');
    
    // Simplement additionner les notes des deux parties pour obtenir la note totale sur 20
    const totalGrade = expGrade + theoGrade;
    
    return totalGrade;
  }, [experimentalGrade, theoreticalGrade]);

  // Add handlers for experimental grade input
  const handleExperimentalGradeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newGrade = e.target.value;
    const maxPoints = experimentalPoints || 5;
    
    // Only allow numbers and up to 2 decimal places
    if (/^(\d{0,2}(\.\d{0,2})?)?$/.test(newGrade) && parseFloat(newGrade || '0') <= maxPoints) {
      setExperimentalGrade(newGrade);
      
      // Clear any existing timeout
      if (saveGradeTimeout) {
        clearTimeout(saveGradeTimeout);
      }
      
      // Set a new timeout to save after 1 second of inactivity
      const timeout = setTimeout(() => {
        if (correction) {
          // Utiliser newGrade au lieu de experimentalGrade pour capturer la valeur actuelle
          correctionsHook.saveGradeAndPenalty(
            parseFloat(newGrade || '0'),
            parseFloat(theoreticalGrade || '0'),
            isPenaltyEnabled ? parseFloat(penalty || '0') : 0
          );
        }
      }, 1000);
      
      setSaveGradeTimeout(timeout);
    }
  };

  // Add handlers for theoretical grade input
  const handleTheoreticalGradeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newGrade = e.target.value;
    const maxPoints = theoreticalPoints || 15;
    
    // Only allow numbers and up to 2 decimal places
    if (/^(\d{0,2}(\.\d{0,2})?)?$/.test(newGrade) && parseFloat(newGrade || '0') <= maxPoints) {
      setTheoreticalGrade(newGrade);
      
      // Clear any existing timeout
      if (saveGradeTimeout) {
        clearTimeout(saveGradeTimeout);
      }
      
      // Set a new timeout to save after 1 second of inactivity
      const timeout = setTimeout(() => {
        if (correction) {
          // Utiliser newGrade au lieu de theoreticalGrade pour capturer la valeur actuelle
          correctionsHook.saveGradeAndPenalty(
            parseFloat(experimentalGrade || '0'),
            parseFloat(newGrade || '0'),
            isPenaltyEnabled ? parseFloat(penalty || '0') : 0
          );
        }
      }, 1000);
      
      setSaveGradeTimeout(timeout);
    }
  };

  const handlePenaltyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPenalty = e.target.value;
    
    // Only allow numbers and up to 2 decimal places
    if (/^(\d{0,2}(\.\d{0,2})?)?$/.test(newPenalty) && parseFloat(newPenalty || '0') <= 20) {
      setPenalty(newPenalty);
      
      // Clear any existing timeout
      if (saveGradeTimeout) {
        clearTimeout(saveGradeTimeout);
      }
      
      // Set a new timeout to save after 1 second of inactivity
      const timeout = setTimeout(() => {
        if (correction) {
          // Modifier pour utiliser les trois paramètres
          correctionsHook.saveGradeAndPenalty(
            parseFloat(experimentalGrade || '0'),
            parseFloat(theoreticalGrade || '0'),
            parseFloat(newPenalty || '0')
          );
        }
      }, 1000);
      
      setSaveGradeTimeout(timeout);
    }
  };

  const handlePenaltyToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isEnabled = e.target.checked;
    setIsPenaltyEnabled(isEnabled);
    
    // If turning off penalty, save with penalty as 0
    if (!isEnabled && correction) {
      // Mise à jour pour utiliser les trois paramètres requis
      correctionsHook.saveGradeAndPenalty(
        parseFloat(experimentalGrade || '0'),
        parseFloat(theoreticalGrade || '0'),
        0
      );
    } else if (isEnabled && correction) {
      // Ajouter ce cas : si on active la pénalité, utiliser la valeur actuelle ou 0
      correctionsHook.saveGradeAndPenalty(
        parseFloat(experimentalGrade || '0'),
        parseFloat(theoreticalGrade || '0'),
        parseFloat(penalty || '0')
      );
    }
  };

  const calculateFinalGrade = () => {
    // Calculate total grade from experimental and theoretical components
    const totalGrade = calculateTotalGrade();
    // Subtract penalty if enabled
    const penaltyValue = isPenaltyEnabled ? parseFloat(penalty || '0') : 0;
    const finalGrade = Math.max(0, totalGrade - penaltyValue).toFixed(1);
    return finalGrade;
  };

  // Modify the date change handlers to auto-calculate penalties
  const handleDeadlineDateChange = (newDate: dayjs.Dayjs | null) => {  // Changed function name
    setDeadlineDate(newDate);  // Changed variable name
    
    // Clear any existing timeout
    if (saveDateTimeout) {
      clearTimeout(saveDateTimeout);
    }
    
    // Set a new timeout to save after 1 second of inactivity
    const timeout = setTimeout(() => {
      if (correction) {
        correctionsHook.saveDates(
          newDate ? newDate.format('YYYY-MM-DD') : null,
          submissionDate ? submissionDate.format('YYYY-MM-DD') : null
        );
        
        // Calculate penalty if both dates are set
        if (newDate && submissionDate) {
          calculateAndApplyLatePenalty(newDate, submissionDate);
        }
      }
    }, 1000);
    
    setSaveDateTimeout(timeout);
  };

  const handleSubmissionDateChange = (newDate: dayjs.Dayjs | null) => {
    setSubmissionDate(newDate);
    
    // Clear any existing timeout
    if (saveDateTimeout) {
      clearTimeout(saveDateTimeout);
    }
    
    // Set a new timeout to save after 1 second of inactivity
    const timeout = setTimeout(() => {
      if (correction) {
        correctionsHook.saveDates(
          deadlineDate ? deadlineDate.format('YYYY-MM-DD') : null,  // Changed variable name
          newDate ? newDate.format('YYYY-MM-DD') : null
        );
        
        // Calculate penalty if both dates are set
        if (deadlineDate && newDate) {  // Changed variable name
          calculateAndApplyLatePenalty(deadlineDate, newDate);  // Changed variable name
        }
      }
    }, 1000);
    
    setSaveDateTimeout(timeout);
  };

  // Add a function to calculate and apply late penalty
  const calculateAndApplyLatePenalty = (deadlineDate: dayjs.Dayjs, submissionDate: dayjs.Dayjs) => {
    // Calculate days late
    const daysLate = submissionDate.diff(deadlineDate, 'day');
    
    // Apply penalty if more than 1 day late (2 points per day)
    if (daysLate > 1) {
      const calculatedPenalty = Math.min(20, daysLate * 2); // Cap at 20 points
      
      // Enable penalty and set its value
      setIsPenaltyEnabled(true);
      setPenalty(calculatedPenalty.toFixed(1));
      
      // Save grade with penalty - use both grades and add the penalty parameter
      if (correction) {
        correctionsHook.saveGradeAndPenalty(
          parseFloat(experimentalGrade || '0'),
          parseFloat(theoreticalGrade || '0'),
          calculatedPenalty
        );
      }
      
      // Show notification about automatic penalty
      setSuccessMessage(`Pénalité de ${calculatedPenalty} points appliquée pour ${daysLate} jours de retard`);
      setTimeout(() => setSuccessMessage(''), 5000);
    } else {
      // If submission is not late or only 1 day late, remove any existing automatic penalty
      if (isPenaltyEnabled && correction?.penalty) {
        // Only reset if penalty was previously set automatically (don't reset manual penalties)
        
          // Disable penalty checkbox and reset penalty value
          setIsPenaltyEnabled(false);
          setPenalty('');
          
          // Save the grade without penalty - use both grades and add 0 for the penalty
          if (correction) {
            correctionsHook.saveGradeAndPenalty(
              parseFloat(experimentalGrade || '0'),
              parseFloat(theoreticalGrade || '0'),
              0
            );
          }
          
          // Show notification about penalty removal
          setSuccessMessage('Pénalité de retard supprimée car le rendu est à temps ou avec un retard acceptable');
          setTimeout(() => setSuccessMessage(''), 5000);
      }
    }
  };

  if (loading) {
    return (
      <div className="container max-w-[400px] mx-auto px-4 py-8 flex justify-center">
        <LoadingSpinner size="lg" text="Chargement de la correction " />
      </div>
    );
  }

  if (error && !successMessage) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <div className="w-full max-w-lg animate-slide-in">
          <Paper className="p-6 overflow-hidden relative" elevation={3}>
            <div className="flex items-start gap-4">
              <div className="text-red-500 animate-once">
                <ErrorOutlineIcon fontSize="large" />
              </div>
              <div className="flex-1">
                <Typography variant="h6" className="text-red-600 font-semibold mb-2">
                  {error}
                </Typography>
                <div className="flex justify-around items-center mt-4">
                  <Button 
                    variant="outlined" 
                    color="success" 
                    size="small" 
                    className="mt-4"
                    startIcon={<RefreshIcon />}
                    onClick={() => window.location.reload()}
                  >
                    Recharger
                  </Button>
                  <Button 
                    variant="outlined" 
                    size="small"
                    color="primary"
                    className="mt-4"
                    component={Link}
                    href="/"
                    startIcon={<ArrowBackIcon />}
                  >
                    Retour à l'accueil
                  </Button>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-1 left-0 w-full h-1">
              <div className="bg-red-500 h-full w-full animate-shrink"></div>
            </div>
          </Paper>
        </div>
      </div>
    );
  }

  if (!correction) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4">
          Correction non trouvée
        </div>
      </div>
    );
  }

  // Add type guards around student_name usage
  const displayName = correction.student_name || `${correction.activity_name || 'Activité'} - Sans nom`;
  
  return (
    <DndProvider backend={HTML5Backend}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <div className="container mx-auto px-4 py-8 min-h-[900px]">
          <div className="flex justify-between items-start mb-6">
            {/* Left side with student name */}
            <div>
              {isEditingName ? (
                <div className="flex items-center space-x-2">
                  <TextField
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="text-3xl font-bold"
                    placeholder="Nom de l'étudiant"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveName();
                      if (e.key === 'Escape') {
                        setIsEditingName(false);
                        setEditedName(correction?.student_name || ''); // Ensure empty string fallback
                      }
                    }}
                    autoFocus
                    variant="standard"
                  />
                  <IconButton
                    onClick={handleSaveName}
                    color="success"
                    title="Sauvegarder"
                    disabled={saving}
                    size="small"
                  >
                    <CheckIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => {
                      setIsEditingName(false);
                      setEditedName(correction?.student_name || ''); // Ensure empty string fallback
                    }}
                    color="error"
                    title="Annuler"
                    size="small"
                  >
                    <CloseIcon />
                  </IconButton>
                </div>
              ) : (
                <h1 className="text-3xl font-bold flex items-center">
                  {displayName}
                  <IconButton
                    onClick={() => setIsEditingName(true)}
                    color="primary"
                    title="Modifier le nom"
                    size="small"
                    className="ml-2"
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  
                  {confirmingDelete ? (
                    <>
                      <IconButton
                        onClick={handleDelete}
                        color="success"
                        title="Confirmer la suppression"
                        size="small"
                        className="ml-1"
                      >
                        <CheckIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        onClick={handleCancelDelete}
                        color="inherit"
                        title="Annuler la suppression"
                        size="small"
                        className="ml-1"
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </>
                  ) : (
                    <IconButton
                      onClick={handleDelete}
                      color="error"
                      title="Supprimer la correction"
                      size="small"
                      className="ml-1"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                </h1>
              )}
              <p className="text-gray-600">
                Activité : <Link href={`/activities/${correction.activity_id}`} className="text-blue-600 hover:underline">
                  {correction.activity_name}
                </Link>
              </p>
              {correction.created_at && (
                <p className="text-gray-500 text-sm mt-1">
                  Créée le {new Date(correction.created_at).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              )}
            </div>
          </div>

          {/* Add date pickers in a row below the header */}
          <div className="flex flex-wrap gap-4 mb-2">
            <Box>
              <DatePicker
                label="Date limite de rendu"
                value={deadlineDate}  // Changed variable name
                onChange={handleDeadlineDateChange}  // Changed function name
                slotProps={{ textField: { size: 'small' } }}
              />
            </Box>
            <Box>
              <DatePicker
                label="Date de rendu effective"
                value={submissionDate}
                onChange={handleSubmissionDateChange}
                slotProps={{ textField: { size: 'small' } }}
              />
            </Box>
          </div>
          <div className="flex justify-start items-center my-2 w-full">
                        {/* Show message if submitted late - update references to deadlineDate */}
                        {deadlineDate && submissionDate && submissionDate.isAfter(deadlineDate) && (  // Changed variable names
              <Box className="flex items-center">
                <Alert 
                  severity={submissionDate.diff(deadlineDate, 'day') > 1 ? "error" : "warning"}  // Changed variable
                  sx={{ py: 0.5 }}
                >
                  {submissionDate.diff(deadlineDate, 'day') <= 1 ? (  // Changed variable
                    `Rendu en retard de ${submissionDate.diff(deadlineDate, 'day')} jour(s)`  // Changed variable
                  ) : (
                    <>
                      Rendu en retard de {submissionDate.diff(deadlineDate, 'day')} jour(s)  {/* Changed variable */}
                      <strong className="ml-2">
                        (Pénalité automatique de {Math.min(20, submissionDate.diff(deadlineDate, 'day') * 2)} points)  {/* Changed variable */}
                      </strong>
                    </>
                  )}
                </Alert>
              </Box>
            )}
          </div>

          {/* Interface à deux colonnes: éditeur et fragments */}
          <div className="flex flex-col md:flex-row gap-6">
            {/* Colonne de gauche: éditeur de correction */}
            <div className="w-full md:w-2/3">
              {/* SECTION 1: Fragments à modifier */}
              <Paper className="p-4 shadow mb-6">
                <Typography variant="h6" className="mb-3">Contenu de la correction</Typography>
                <div className="border rounded-md p-4 bg-gray-50 mb-4 min-h-[200px]">
                  {contentItems.map((item, index) => (
                    !item.parentId && (
                      <DraggableItem
                        key={item.id}
                        item={item}
                        index={index}
                        moveItem={moveItem}
                        updateItem={updateItem}
                        removeItem={removeItem}
                      />
                    )
                  ))}
                </div>
                
                

              </Paper>

              {/* SECTION 5: Boutons d'action */}
              <Paper className="p-4 shadow mb-6 flex justify-between items-center">
                {/* SECTION 2: Boutons d'ajout de fragment et d'image */}
              <div className="flex space-x-2">
                    <IconButton
                      onClick={addNewParagraph}
                      color="primary"
                      size="medium"
                      title="Ajouter un paragraphe"
                    >
                      <AddIcon />
                    </IconButton>
                    
                    <ImageUploader 
                      activityId={correction.activity_id} 
                      correctionId={correctionId} // Add the correction ID here
                      onImageUploaded={addNewImage} 
                    />
                  </div>
                <div className="space-x-2 flex justify-end items-center">
                  <IconButton
                    onClick={handleUndo}
                    color="inherit"
                    disabled={history.length === 0}
                    size="medium"
                    title="Annuler la dernière modification"
                  >
                    <UndoIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => {
                      updatePreview();
                      handleSaveCorrection();
                    }}
                    color="primary"
                    size="medium"
                    disabled={saving}
                    title="Sauvegarder la correction"
                  >
                    {saving ? <CircularProgress size={20} /> : <SaveIcon />}
                  </IconButton>
                  <IconButton
                    color="primary"
                    onClick={() => setShareModalOpen(true)}
                    size="medium"
                    title="Partager la correction"
                  >
                    <ShareIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => {
                      updatePreview();
                      handleCopyToClipboard();
                    }}
                    color="success"
                    size="medium"
                    title="Copier dans le presse-papier"
                  >
                    <ContentCopyIcon />
                  </IconButton>
                </div>
              </Paper>

              {/* SECTION 3: Notation manuelle */}
              <Paper className="p-4 shadow mb-6">
                <div className="mb-3">
                <Typography variant="h6">
                  Notation sur {experimentalPoints + theoreticalPoints} points
                </Typography>
                </div>
                <div className="flex flex-col space-y-3">
  <div className="flex flex-row justify-around mx-2">
    <div className="flex flex-col items-center">
      <Typography variant="body2" id="experimental-slider" gutterBottom>
        Partie expérimentale
      </Typography>
      <Slider
        aria-labelledby="experimental-slider"
        value={parseFloat(experimentalGrade) || 0}
        onChange={(_, newValue) => {
          const newGrade = typeof newValue === 'number' ? newValue.toString() : newValue.toString();
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
        sx={{ 
          width: 180,
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
        {experimentalGrade || '0'}/{experimentalPoints}
      </Typography>
      
      <div className="mb-4"></div>
      
      <Typography variant="body2" id="theoretical-slider" gutterBottom>
        Partie théorique
      </Typography>
      <Slider
        aria-labelledby="theoretical-slider"
        value={parseFloat(theoreticalGrade) || 0}
        onChange={(_, newValue) => {
          const newGrade = typeof newValue === 'number' ? newValue.toString() : newValue.toString();
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
        sx={{ 
          width: 180,
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
        {theoreticalGrade || '0'}/{theoreticalPoints}
      </Typography>
    </div>
    
    {/* Si vous avez une section de pénalité, vous pouvez l'ajouter ici avec le même style */}
    {isPenaltyEnabled && (
      <div className="flex flex-col items-center ml-4">
        <Typography variant="body2" id="penalty-slider" gutterBottom>
          Pénalité
        </Typography>
        <Slider
          aria-labelledby="penalty-slider"
          value={parseFloat(penalty) || 0}
          onChange={(_, newValue) => {
            const newPenalty = typeof newValue === 'number' ? newValue.toString() : newValue.toString();
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
          max={14}
          step={0.5}
          valueLabelDisplay="auto"
          marks
          sx={{ 
            width: 180,
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
      </div>
    )}
  </div>
</div>
              </Paper>

              {/* SECTION 4: Aperçu final */}
              {/* Update grade display in preview - check for experimentalGrade or theoreticalGrade instead */}
              {/* Affichage de l'aperçu basé sur l'état actuel des contentItems (modifiés ou non) */}
              {/*<Paper className='p-4 shadow mb-6'>
                <Typography variant="h6" className="mb-3">Aperçu</Typography>
                <Paper 
                  className="p-4 rounded-lg mb-4" 
                  elevation={0}
                  variant="outlined"
                >
                  
                  {(experimentalGrade || theoreticalGrade) && (
                    <div className="mb-4 pb-2 border-b">
                      <Typography variant="h6" className="font-bold mb-2">Évaluation:</Typography>
                      <div className="flex flex-col">
                        <div className="grid grid-cols-2 gap-2">
                          <Typography variant="body1">Partie expérimentale :</Typography>
                          <Typography variant="body1" className="text-right">
                            {experimentalGrade} / {experimentalPoints}
                          </Typography>
                          
                          <Typography variant="body1">Partie théorique :</Typography>
                          <Typography variant="body1" className="text-right">
                            {theoreticalGrade} / {theoreticalPoints}
                          </Typography>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  
                  <div 
                    className="preview-content" 
                    dangerouslySetInnerHTML={{ __html: renderedHtml }} 
                  />
                </Paper>
              </Paper> */}
                

                
              {/* Messages d'information */}
              <div className="mt-2">
                {successMessage && (
                  <Paper className="shadow mt-2">
                    <Alert severity="success">
                      {successMessage}
                    </Alert>
                  </Paper>
                )}

                {copiedMessage && (
                  <Paper className="shadow mt-2">
                    <Alert severity="info">
                      {copiedMessage}
                    </Alert>
                  </Paper>
                )}
                
                {error && (
                  <Paper className="shadow mt-2">
                    <Alert severity="error">
                      {error}
                    </Alert>
                  </Paper>
                )}
              </div>
            </div>
            
            {/* Colonne de droite: fragments disponibles */}
            <div className="w-full md:w-1/3">
              <Paper className="p-4 shadow">
                <div className="flex flex-col space-y-2 mb-4">
                  <Typography variant="h6" className="mb-0">Fragments disponibles</Typography>
                  
                  {/* Activity selector dropdown */}
                  <FormControl fullWidth size="small" margin="normal">
                    <InputLabel id="activity-select-label">Activité</InputLabel>
                    <Select
                      labelId="activity-select-label"
                      value={selectedActivityId || ''}
                      onChange={handleActivityChange}
                      label="Activité"
                      disabled={loadingActivities}
                    >
                      {activities.map((activity) => (
                        <MenuItem key={activity.id} value={activity.id}>
                          {activity.name} 
                          {correction && activity.id === correction.activity_id ? ' (courante)' : ''}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </div>

                {loadingFragments ? (
                  <div className="flex justify-center p-4">
                    <CircularProgress size={24} />
                  </div>
                ) : fragments.length === 0 ? (
                  <Typography color="textSecondary" className="p-4 text-center italic">
                    Aucun fragment disponible pour cette activité.
                  </Typography>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto p-1">
                    {fragments.map((fragment, index) => (
                      <div key={fragment.id} className="relative">
                        <FragmentItem
                          index={index}
                          fragment={fragment}
                          moveFragment={moveFragment}
                          isEditing={editingFragmentId === fragment.id}
                          editedContent={editedFragmentContent}
                          onAddToCorrection={handleAddFragment}
                          savingFragment={savingFragment}
                          onEdit={handleEditFragment}
                          onDelete={handleDeleteFragment}
                          onSave={handleSaveFragment}
                          onCancel={handleCancelEditFragment}
                          onContentChange={setEditedFragmentContent}
                        />
                        {typeof fragment.id === 'number' && deletingIds.includes(fragment.id) && (
                          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
                            <CircularProgress size={24} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Add fragment section - only show if the selected activity matches the correction's activity */}
                <Box className="flex flex-col space-y-4 my-4">
                  <Box className="flex items-center justify-between">
                    {selectedActivityId === correction?.activity_id && (
                      <Button
                        onClick={() => setShowAddFragment(!showAddFragment)}
                        color="primary"
                        variant="text"
                        size="small"
                      >
                        {showAddFragment ? 'Annuler' : 'Nouveau'}
                      </Button>
                    )}
                    <Button
                      component={Link}
                      href={`/activities/${selectedActivityId}/fragments`}
                      color="primary"
                      variant="text"
                      size="small"
                    >
                      Gérer les fragments
                    </Button>
                  </Box>

                  {/* Formulaire d'ajout de fragment - only show if current activity is selected */}
                  {showAddFragment && selectedActivityId === correction?.activity_id && (
                    <Paper variant="outlined" className="p-4">
                      <form onSubmit={handleCreateNewFragmentWrapper}>
                        <div className="mb-3">
                          <TextField
                            value={newFragmentContent}
                            onChange={(e) => setNewFragmentContent(e.target.value)}
                            className="w-full"
                            multiline
                            rows={3}
                            placeholder="Contenu du nouveau fragment..."
                            variant="outlined"
                            required
                            size="small"
                          />
                        </div>
                        <Button
                          type="submit"
                          disabled={addingFragment || !newFragmentContent.trim()}
                          variant="contained"
                          color="success"
                          size="small"
                        >
                          <AddIcon sx={{ mr: 0.2 }} />
                          {addingFragment ? 'Ajout en cours...' : 'Ajouter le fragment'}
                        </Button>
                      </form>
                    </Paper>
                  )}
                </Box>
              </Paper>
            </div>
          </div>
          
          {/* Modal de partage */}
          <ShareModal
            open={shareModalOpen}
            onClose={() => setShareModalOpen(false)}
            correctionId={correctionId}
          />
        </div>
      </LocalizationProvider>
    </DndProvider>
  );
}