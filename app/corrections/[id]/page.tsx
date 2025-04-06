'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useIsomorphicLayoutEffect } from '@/utils/client-hooks';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';

import { ContentItem } from '@/types/correction';
import { generateHtmlFromItems, extractFormattedText } from '@/utils/htmlUtils';
import { copyToClipboard } from '@/utils/clipboardUtils';
import { 
  Paper, Alert, Box, Container, Divider, Fade, Zoom, 
  Typography, useTheme, alpha, Drawer, IconButton, 
  Tooltip, Card, Tab, Tabs, Link
} from '@mui/material';

// Import our new hooks
import { useFragments } from '@/lib/hooks/useFragments';
import { useCorrections } from '@/lib/hooks/useCorrections';

// Import components
import ShareModal from '@/app/components/ShareModal';
import CorrectionHeader from '@/components/corrections/CorrectionHeader';
import DatePickerSection from '@/components/corrections/DatePickerSection';
import CorrectionContentEditor from '@/components/corrections/CorrectionContentEditor';
import ActionButtons from '@/components/corrections/ActionButtons';
import GradingSection from '@/components/corrections/GradingSection';
import StatusMessages from '@/components/corrections/StatusMessages';
import LoadingErrorStates from '@/components/corrections/LoadingErrorStates';
import EmailFeedback from '@/components/corrections/EmailFeedback';
import H1Title from '@/components/ui/H1Title';
import GradientBackground from '@/components/ui/GradientBackground';
import PatternBackground from '@/components/ui/PatternBackground';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DescriptionIcon from '@mui/icons-material/Description';
import AssignmentIcon from '@mui/icons-material/Assignment';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';

// Import the new combined fragment component
import { FragmentsSidebar } from '@/components/fragments';

// Importez le composant DuplicateCorrection
import DuplicateCorrection from '@/components/corrections/DuplicateCorrection';

export default function CorrectionDetail({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap the Promise for params using React.use in client components
  const { id } = React.use(params);
  const correctionId = id;
  const theme = useTheme();
  
  // Use our custom hooks
  const fragmentsHook = useFragments();
  const correctionsHook = useCorrections(correctionId);
  
  // Local state for this component
  const [renderedHtml, setRenderedHtml] = useState<string>('');
  const [newFragmentContent, setNewFragmentContent] = useState('');
  const [showAddFragment, setShowAddFragment] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState('');
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [tabValue, setTabValue] = useState<number>(0);
  
  // Add state for date pickers - update variable names for clarity
  const [deadlineDate, setDeadlineDate] = useState<dayjs.Dayjs | null>(null);
  const [submissionDate, setSubmissionDate] = useState<dayjs.Dayjs | null>(null);
  const [saveDateTimeout, setSaveDateTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // Destructure values from fragment hook
  const {
    setSelectedActivityId,
    fetchFragmentsForActivity,
    fetchAllActivities,
    handleAddFragment: addFragment,

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

  // Gestion du changement d'onglet
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    // Only set valid tab values
    if (newValue === 0 || newValue === 1) {
      setTabValue(newValue);
    }
  };

  // Toggle drawer open/closed
  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  // Add state for auto-save feature
  const [autoSaveActive, setAutoSaveActive] = useState<boolean>(true);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

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
    // Only set up auto-save if correction exists and auto-save is active
        if (correction && autoSaveActive) {
      // Clear any existing timer
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
      
      // Create an interval that runs every 70 seconds
      console.log(`[Auto-save] Démarrage du système d'auto-sauvegarde (intervalle de 70 secondes)`);
      
      // Set up interval timer - save every 70 seconds
      autoSaveTimerRef.current = setInterval(() => {
        // Only auto-save if there are unsaved changes
        if (history.length > 0 || contentItems.length > 0) {
          console.log(`[Auto-save] Sauvegarde en cours...`);
          handleSaveCorrection();
          setLastAutoSave(new Date());
        } else {
          console.log(`[Auto-save] Aucune modification à sauvegarder`);
        }
      }, 70000); // 70 seconds
    }
    
    // Clean up timer on component unmount
    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [correction, autoSaveActive]);

  // Effect to handle beforeunload event to warn about unsaved changes
  useEffect(() => {
    // Function to handle beforeunload event
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Check if there are unsaved changes
      if (history.length > 0) {
        // Standard way to show confirmation dialog before leaving page
        // This works in all modern browsers
        const message = "Vous avez des modifications non enregistrées. Voulez-vous vraiment quitter la page?";
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };
    
    // Add event listener
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Clean up the event listener on component unmount
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [history.length]);
  
  // Add popstate event handling to catch browser back/forward navigation
  useEffect(() => {
    // Function to handle popstate events (browser back/forward buttons)
    const handlePopState = (e: PopStateEvent) => {
      // Check if there are unsaved changes
      if (history.length > 0) {
        // Show a confirmation dialog
        const message = "Vous avez des modifications non enregistrées. Voulez-vous vraiment quitter la page?";
        
        // This effectively blocks navigation until the user confirms
        if (window.confirm(message)) {
          // User confirmed, let them leave (data will be lost)
          // We can't automatically save here because the navigation already happened
        } else {
          // User cancelled, prevent navigation by pushing the current state again
          // This is a workaround to stay on the current page
          window.history.pushState(null, '', window.location.pathname);
          
          // Optional: offer to save
          if (window.confirm("Voulez-vous sauvegarder vos modifications?")) {
            handleSaveCorrection();
          }
        }
      }
    };
    
    // Add event listener for browser back/forward buttons
    window.addEventListener('popstate', handlePopState);
    
    // Set up initial history state to enable popstate capture
    if (history.length > 0) {
      window.history.pushState(null, '', window.location.pathname);
    }
    
    // Clean up the event listener on component unmount
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [history.length, handleSaveCorrection]);

  // Add handler for internal navigation to prevent data loss
  const handleInternalNavigation = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    // Only intercept navigation if there are unsaved changes
    if (history.length > 0) {
      e.preventDefault();
      
      const href = e.currentTarget.href;
      
      // Show confirm dialog
      if (window.confirm("Vous avez des modifications non enregistrées. Voulez-vous sauvegarder avant de quitter la page?")) {
        // Save changes first, then navigate
        handleSaveCorrection().then(() => {
          // Navigate after save completes
          window.location.href = href;
        });
      } else {
        // Navigate without saving
        window.location.href = href;
      }
    }
    // If no unsaved changes, let the navigation proceed normally
  };

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
      if (correction.deadline) {
        setDeadlineDate(dayjs(correction.deadline));
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

  // Create a new fragment with direct API call
  const handleCreateNewFragmentWrapper = async (e: React.FormEvent, categories: number[] = []) => {
    e.preventDefault();
    if (!newFragmentContent.trim() || !correction) return;
    
    // Set loading state
    const { setAddingFragment, setError } = fragmentsHook;
    setAddingFragment(true);
    setError('');
    
    
    
    try {
      // Directly call the API to create the fragment
      const response = await fetch('/api/fragments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activity_id: correction.activity_id,
          content: newFragmentContent.trim(),
          categories: categories // Pass categories directly to the API
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'ajout du fragment');
      }

      // Process the successful response
      const newFragment = await response.json();
      
      // Update fragments list with the new fragment
      fragmentsHook.fragments.unshift(newFragment); // Add to beginning of array
      
      // Reset form
      setNewFragmentContent('');
      setShowAddFragment(false);
      
      // Show success message
      setSuccessMessage('Fragment ajouté avec succès');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      console.error('Error creating fragment:', error);
      setError(error.message || 'Erreur lors de la création du fragment');
      setTimeout(() => setError(''), 5000);
    } finally {
      setAddingFragment(false);
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

  // Modify the date change handlers to auto-calculate penalties
  const handleDeadlineDateChange = (newDate: dayjs.Dayjs | null) => {
    setDeadlineDate(newDate);
    
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
          deadlineDate ? deadlineDate.format('YYYY-MM-DD') : null,
          newDate ? newDate.format('YYYY-MM-DD') : null
        );
        
        // Calculate penalty if both dates are set
        if (deadlineDate && newDate) {
          calculateAndApplyLatePenalty(deadlineDate, newDate);
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
      const calculatedPenalty = Math.min(15, daysLate * 2); // Cap at 15 points
      
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

  // Add fragment to correction (use this handler with the new component)
  const handleAddFragmentToCorrection = (fragment: any) => {
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

  // Check for loading and error conditions directly
  if (loading) {
    return (
      <LoadingErrorStates 
        loading={true} 
        error={''} 
        successMessage={''} 
      />
    );
  }

  if (error && !successMessage) {
    return (
      <LoadingErrorStates 
        loading={false} 
        error={error} 
        successMessage={''} 
      />
    );
  }

  if (!correction) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert 
          severity="warning" 
          variant="filled"
          sx={{ 
            borderRadius: 2,
            boxShadow: 2
          }}
        >
          Correction non trouvée
        </Alert>
      </Container>
    );
  }

  // Calculate drawer width
  const drawerWidth = 340;

  // Créer un wrapper pour les liens qui interceptera la navigation
  // en cas de modifications non enregistrées
  const SafeLink = ({ href, children, ...props }: React.ComponentProps<typeof Link>) => {
    return (
      <Link
        href={href}
        onClick={handleInternalNavigation}
        {...props}
      >
        {children}
      </Link>
    );
  };

  return (
    <DndProvider backend={HTML5Backend}>
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
                  
                  {/* Header component with enhanced styling */}
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
                    firstName={correction.student_data?.first_name || correction.student_first_name || ''}
                    lastName={correction.student_data?.last_name || correction.student_last_name || ''}
                    setFirstName={(value) => correctionsHook.setFirstName?.(value)}
                    setLastName={(value) => correctionsHook.setLastName?.(value)}
                    email={correction.student_data?.email || ''}
                    setEmail={(value) => correctionsHook.setEmail?.(value)}
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
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AssignmentIcon color="secondary" />
                    Contenu de la correction
                  </Typography>
                
                  {/* Email feedback button */}
                  <Box sx={{ display: 'flex', justifyContent:'space-around', gap: 2, mb: 3 }}>
                    <EmailFeedback correctionId={correctionId} studentData={correction.student_data} />
                    <DuplicateCorrection correctionId={correctionId} />
                  </Box>
                  
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
                  
                  {/* Status messages component */}
                  <StatusMessages
                    successMessage={successMessage}
                    copiedMessage={copiedMessage}
                    error={error}
                  />
                  {/* Titre de section */}
                  <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DescriptionIcon color="secondary" />
                    Informations et notation
                  </Typography>
                  {/* Date picker section */}
                  <Card sx={{ 
                    p: 3, 
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: alpha(theme.palette.primary.main, 0.2)
                  }}>
                    <DatePickerSection
                      deadlineDate={deadlineDate}
                      submissionDate={submissionDate}
                      handleDeadlineDateChange={handleDeadlineDateChange}
                      handleSubmissionDateChange={handleSubmissionDateChange}
                    />
                  </Card>
                  
                  {/* Grading section component */}
                  <Card sx={{ 
                    p: 3, 
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: alpha(theme.palette.primary.main, 0.2)
                  }}>
                    <GradingSection
                      experimentalGrade={experimentalGrade}
                      theoreticalGrade={theoreticalGrade}
                      experimentalPoints={experimentalPoints}
                      theoreticalPoints={theoreticalPoints}
                      isPenaltyEnabled={isPenaltyEnabled}
                      penalty={penalty}
                      setExperimentalGrade={setExperimentalGrade}
                      setTheoreticalGrade={setTheoreticalGrade}
                      setPenalty={setPenalty}
                      saveGradeTimeout={saveGradeTimeout}
                      setSaveGradeTimeout={setSaveGradeTimeout}
                      correctionsHook={correctionsHook}
                      correction={correction}
                    />
                  </Card>
                </Box>
                
                {/* Colonne d'informations - Dates et Notation */}
                <Box sx={{ 
                  p: { xs: 2, sm: 3 },
                  width: { xs: '100%', lg: '40%' },
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                  backgroundColor: alpha(theme.palette.background.paper, 0.4)
                }}>
                  
                    
                  {/* Panneau des fragments - accessible sur les grands écrans */}
                  <Box sx={{ 
                    display: { xs: 'none', lg: 'block' },
                    flexGrow: 1,
                    pt: 2
                  }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FormatQuoteIcon color="secondary" />
                      Fragments et modèles
                    </Typography>
                    <FragmentsSidebar 
                      correction={correction}
                      onAddFragmentToCorrection={handleAddFragmentToCorrection}
                      inCorrectionContext={true}
                    />
                  </Box>
                
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
                    correction={correction}
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
    </DndProvider>
  );
}

