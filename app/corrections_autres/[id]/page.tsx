'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useIsomorphicLayoutEffect } from '@/utils/client-hooks';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CorrectionAutre, ActivityAutre, Student } from '@/lib/types';
import dayjs from 'dayjs';

import { ContentItem } from '@/types/correction';
import { generateHtmlFromItems, extractFormattedText } from '@/utils/htmlUtils';
import { copyToClipboard } from '@/utils/clipboardUtils';
import EmailFeedbackAutre from '@/components/corrections/EmailFeedbackAutre';

import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Chip,
  IconButton,
  Divider,
  CircularProgress,
  Alert,
  AlertTitle,
  Card,
  alpha,
  useTheme,
  Drawer,
  Zoom,
  Tooltip,
  Grid
} from '@mui/material';

import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ScienceIcon from '@mui/icons-material/Science';
import AssignmentIcon from '@mui/icons-material/Assignment';
import DescriptionIcon from '@mui/icons-material/Description';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

import { useSnackbar } from 'notistack';
import GradientBackground from '@/components/ui/GradientBackground';
import PatternBackground from '@/components/ui/PatternBackground';
import LoadingSpinner from '@/components/LoadingSpinner';
import CorrectionHeader from '@/components/corrections/CorrectionHeader';
import DatePickerSection from '@/components/corrections/DatePickerSection';
import CorrectionContentEditor from '@/components/corrections/CorrectionContentEditor';
import ActionButtons from '@/components/corrections/ActionButtons';
import GradingSection from '@/components/corrections/GradingSection';
import StatusMessages from '@/components/corrections/StatusMessages';
import EmailFeedback from '@/components/corrections/EmailFeedback';
import DuplicateCorrection from '@/components/corrections/DuplicateCorrection';
import { FragmentsSidebar } from '@/components/fragments';
import ContentEditor from '@/components/editor/ContentEditor';

// Use our custom hooks
import { useFragments } from '@/lib/hooks/useFragments';
import { useCorrections } from '@/lib/hooks/useCorrections';

export default function CorrectionAutreDetail({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap the Promise for params using React.use in client components
  const { id } = React.use(params);
  const correctionId = id;
  
  const router = useRouter();
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();

  // Use our custom hooks
  const fragmentsHook = useFragments();
  const correctionsHook = useCorrections(correctionId);

  // Local state for this component
  const [renderedHtml, setRenderedHtml] = useState<string>('');
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [newFragmentContent, setNewFragmentContent] = useState('');
  const [showAddFragment, setShowAddFragment] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState('');
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [history, setHistory] = useState<ContentItem[][]>([]);
  const [autoSaveActive, setAutoSaveActive] = useState(true);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout>();

  const [deadlineDate, setDeadlineDate] = useState<dayjs.Dayjs | null>(null);
  const [submissionDate, setSubmissionDate] = useState<dayjs.Dayjs | null>(null);
  const [saveDateTimeout, setSaveDateTimeout] = useState<NodeJS.Timeout | null>(null);

  const [correction, setCorrection] = useState<CorrectionAutre | null>(null);
  const [activity, setActivity] = useState<ActivityAutre | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isStatusChanging, setIsStatusChanging] = useState(false);
  const [correctionStatus, setCorrectionStatus] = useState<string>('ACTIVE');
  const [isActive, setIsActive] = useState<boolean>(true);

  // Add missing state variables
  const [editedName, setEditedName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [saving, setSaving] = useState(false);

  // Pour le calcul du pourcentage et de la note finale
  const totalPointsEarned = correction?.points_earned?.reduce((sum, points) => sum + points, 0) || 0;
  const totalPossiblePoints = activity?.points?.reduce((sum, points) => sum + points, 0) || 0;
  const percentage = totalPossiblePoints > 0 ? (totalPointsEarned / totalPossiblePoints) * 100 : 0;

  // Fonction pour formater la date
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Non spécifiée';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  useEffect(() => {
    const fetchCorrectionDetails = async () => {
      try {
        setLoading(true);

        // Récupérer les détails de la correction
        const correctionResponse = await fetch(`/api/corrections_autres/${correctionId}`);
        if (!correctionResponse.ok) {
          throw new Error('Erreur lors du chargement de la correction');
        }
        const correctionData = await correctionResponse.json();
        setCorrection(correctionData);

        // Récupérer les détails de l'activité associée
        const activityResponse = await fetch(`/api/activities_autres/${correctionData.activity_id}`);
        if (!activityResponse.ok) {
          throw new Error('Erreur lors du chargement de l\'activité associée');
        }
        const activityData = await activityResponse.json();
        setActivity(activityData);

        // Récupérer les détails de l'étudiant si disponible
        if (correctionData.student_id) {
          const studentResponse = await fetch(`/api/students/${correctionData.student_id}`);
          if (studentResponse.ok) {
            const studentData = await studentResponse.json();
            setStudent(studentData);
          }
        }
      } catch (err) {
        console.error('Erreur:', err);
        setError(`Erreur: ${(err as Error).message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchCorrectionDetails();
  }, [correctionId]);

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

  // Function to save current state to history
  const saveToHistory = () => {
    setHistory(prev => [...prev, [...contentItems]]);
  };

  // Function to undo last change
  const handleUndo = () => {
    if (history.length > 0) {
      const previousState = history[history.length - 1];
      setContentItems(previousState);
      setHistory(prev => prev.slice(0, -1));
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

  // Function to save correction
  const handleSaveCorrection = async () => {
    try {
      // Get the formatted content from contentItems
      const formattedContent = extractFormattedText(contentItems);

      const response = await fetch(`/api/corrections_autres/${correctionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: formattedContent,
          // Include other fields that need to be updated
          deadline: deadlineDate?.toISOString(),
          submission_date: submissionDate?.toISOString(),
          active: isActive ? 1 : 0,
          status: correctionStatus
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save correction');
      }

      setHistory([]); // Clear history after successful save
      enqueueSnackbar('Correction sauvegardée avec succès', { variant: 'success' });
    } catch (error) {
      console.error('Error saving correction:', error);
      enqueueSnackbar('Erreur lors de la sauvegarde', { variant: 'error' });
      throw error;
    }
  };

  const handleEditClick = () => {
    router.push(`/corrections_autres/${correctionId}/edit`);
  };

  const handleDeleteClick = () => {
    setConfirmingDelete(true);
  };

  const handleCancelDelete = () => {
    setConfirmingDelete(false);
  };

  const handleConfirmDelete = async () => {
    try {
      const response = await fetch(`/api/corrections_autres/${correctionId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la suppression de la correction');
      }
      
      enqueueSnackbar('Correction supprimée avec succès', { variant: 'success' });
      
      // Rediriger vers la page de l'activité
      if (activity) {
        router.push(`/activities_autres/${activity.id}?tab=1`);
      } else {
        router.push('/activities_autres');
      }
    } catch (err) {
      console.error('Erreur:', err);
      enqueueSnackbar(`Erreur: ${(err as Error).message}`, { variant: 'error' });
      setConfirmingDelete(false);
    }
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

  // Function to handle name changes
  const handleSaveName = async () => {
    try {
      const response = await fetch(`/api/corrections_autres/${correctionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editedName
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update name');
      }

      setIsEditingName(false);
      setCorrection(prev => prev ? { ...prev, name: editedName } : null);
      enqueueSnackbar('Nom mis à jour avec succès', { variant: 'success' });
    } catch (error) {
      console.error('Error updating name:', error);
      enqueueSnackbar('Erreur lors de la mise à jour du nom', { variant: 'error' });
    }
  };

  // Function to handle deletion
  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/corrections_autres/${correctionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete correction');
      }

      enqueueSnackbar('Correction supprimée avec succès', { variant: 'success' });
      router.push('/activities_autres');
    } catch (error) {
      console.error('Error deleting correction:', error);
      enqueueSnackbar('Erreur lors de la suppression', { variant: 'error' });
    }
  };

  // Function to toggle active status
  const handleToggleActive = async () => {
    try {
      const newActive = !isActive;
      const response = await fetch(`/api/corrections_autres/${correctionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          active: newActive ? 1 : 0
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle active status');
      }

      setIsActive(newActive);
      setCorrection(prev => prev ? { ...prev, active: newActive ? 1 : 0 } : null);
      enqueueSnackbar('Statut mis à jour avec succès', { variant: 'success' });
    } catch (error) {
      console.error('Error toggling active status:', error);
      enqueueSnackbar('Erreur lors de la mise à jour du statut', { variant: 'error' });
    }
  };

  // Function to handle status changes
  const handleChangeStatus = async (newStatus: string) => {
    setIsStatusChanging(true);
    try {
      const response = await fetch(`/api/corrections_autres/${correctionId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      setCorrectionStatus(newStatus);
      setIsActive(newStatus === 'ACTIVE');
      enqueueSnackbar('Statut mis à jour avec succès', { variant: 'success' });
    } catch (error) {
      console.error('Error changing status:', error);
      enqueueSnackbar('Erreur lors de la mise à jour du statut', { variant: 'error' });
    } finally {
      setIsStatusChanging(false);
    }
  };

  if (loading) {
    return (
      <div className="container max-w-[400px] mx-auto px-4 py-8 flex justify-center">
        <LoadingSpinner size="lg" text="Chargement des données" />
      </div>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" className="py-8">
        <Paper className="p-6">
          <Alert severity="error">
            <AlertTitle>Erreur</AlertTitle>
            {error}
          </Alert>
          <Button 
            variant="outlined" 
            component={Link} 
            href="/activities_autres" 
            className="mt-4"
          >
            Retour aux activités
          </Button>
        </Paper>
      </Container>
    );
  }

  if (!correction || !activity) {
    return (
      <Container maxWidth="md" className="py-8">
        <Paper className="p-6">
          <Alert severity="warning">
            <AlertTitle>Attention</AlertTitle>
            Correction non trouvée
          </Alert>
          <Button 
            variant="outlined" 
            component={Link} 
            href="/activities_autres" 
            className="mt-4"
          >
            Retour aux activités
          </Button>
        </Paper>
      </Container>
    );
  }

  // Calculate drawer width
  const drawerWidth = 340;

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
                    firstName={student?.first_name  || ''}
                    lastName={student?.last_name || ''}
                    setFirstName={(value) => correctionsHook.setFirstName?.(value)}
                    setLastName={(value) => correctionsHook.setLastName?.(value)}
                    email={student?.email || ''}
                    setEmail={(value) => correctionsHook.setEmail?.(value)}
                    correctionStatus={correctionStatus}
                    handleChangeStatus={handleChangeStatus}
                    isStatusChanging={isStatusChanging}
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
                  <Box sx={{ display: 'flex', justifyContent:'space-around', gap: 2, mb: 3 }}>
                    <EmailFeedbackAutre 
                      correctionId={correctionId} 
                      student={student}
                      points_earned={correction.points_earned}
                      activityName={activity?.name}
                      activity_parts_names={activity?.parts_names}
                      activity_points={activity?.points}
                      penalty={correction.penalty?.toString()}
                    />
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
                </Box>

                {/* Content and grading section */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    Contenu et notation
                  </Typography>
                  <Grid container spacing={3}>
                    {/* Points earned input fields */}
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Points par partie
                      </Typography>
                      {activity?.parts_names.map((partName, index) => (
                        <Box key={index} sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            {partName} (max: {activity.points[index]} points)
                          </Typography>
                          <TextField
                            type="number"
                            value={correction.points_earned?.[index] || 0}
                            onChange={async (e) => {
                              const newValue = parseFloat(e.target.value);
                              const newPointsEarned = [...(correction.points_earned || [])];
                              newPointsEarned[index] = newValue;
                              
                              try {
                                const response = await fetch(`/api/corrections_autres/${correctionId}/points`, {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ points_earned: newPointsEarned })
                                });
                                
                                if (!response.ok) throw new Error('Failed to update points');
                                
                                setCorrection(prev => ({
                                  ...prev!,
                                  points_earned: newPointsEarned
                                }));
                                
                                enqueueSnackbar('Points mis à jour', { variant: 'success' });
                              } catch (error) {
                                console.error('Error updating points:', error);
                                enqueueSnackbar('Erreur lors de la mise à jour des points', { variant: 'error' });
                              }
                            }}
                            InputProps={{
                              inputProps: { 
                                min: 0, 
                                max: activity.points[index],
                                step: 0.5
                              }
                            }}
                            size="small"
                            fullWidth
                          />
                        </Box>
                      ))}
                    </Grid>

                    {/* Content editor */}
                    <Grid size={{ xs: 12 }}>
                      <ContentEditor
                        correction={correction}
                        activityName={activity?.name}
                        activityId={activity?.id}
                        studentData={student}
                        studentId={correction.student_id || undefined}
                        classId={correction.class_id || undefined}
                        points_earned={correction.points_earned || []}
                      />
                    </Grid>
                  </Grid>
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
                    correction={correction}
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
        </Container>
      </LocalizationProvider>
    </DndProvider>
  );
}