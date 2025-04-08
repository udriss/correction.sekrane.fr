'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Container, Paper, Typography, Box, Chip, Button, 
  IconButton, Menu, MenuItem, TextField, FormControl,
  InputLabel, Select, Badge, Divider, ListItemIcon, ListItemText,
  SelectChangeEvent, InputAdornment, Tabs, Tab, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { useSnackbar } from 'notistack';
import { Correction, CorrectionWithShareCode } from '@/lib/types';

import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { alpha } from '@mui/material/styles';
import SortIcon from '@mui/icons-material/Sort';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';
import CheckIcon from '@mui/icons-material/Check';
import CalendarIcon from '@mui/icons-material/CalendarMonth';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import GradeIcon from '@mui/icons-material/Grade';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import RecentActorsIcon from '@mui/icons-material/RecentActors';
import dayjs from 'dayjs';
import LoadingSpinner from '@/components/LoadingSpinner';
import GradientBackground from '@/components/ui/GradientBackground';
import PatternBackground from '@/components/ui/PatternBackground';
import CorrectionsProvider, { useCorrections } from '@/app/components/CorrectionsDataProvider';
import CorrectionsList from '@/components/allCorrections/CorrectionsList';
import ClassesList from '@/components/allCorrections/ClassesList';
import StudentsList from '@/components/allCorrections/StudentsList';
import ChronologyList from '@/components/allCorrections/ChronologyList';
import { generateQRCodePDF } from '@/utils/qrGeneratorPDF';
import QrCodeIcon from '@mui/icons-material/QrCode';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import VisibilityIcon from '@mui/icons-material/Visibility';
import GroupIcon from '@mui/icons-material/Group';
import DeleteIcon from '@mui/icons-material/Delete';
import { BatchDeleteProvider, useBatchDelete } from '@/hooks/useBatchDelete';

// Composant principal qui utilise le provider
export default function CorrectionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Récupérer les paramètres de l'URL pour l'initialisation
  const initialFilters = {
    search: searchParams?.get('search') || '',
    classId: searchParams?.get('classId') || '',
    studentId: searchParams?.get('studentId') || '',
    activityId: searchParams?.get('activityId') || '',
    recent: searchParams?.get('recent') === 'true',
    highlight: searchParams?.get('highlight') || '',
    correctionId: searchParams?.get('correctionId') || '',
    subClassId: searchParams?.get('subClassId') || '', // Add subClassId to initialFilters
  };
  
  const initialSort = {
    field: (searchParams?.get('sortBy') || 'submission_date') as 'submission_date' | 'grade' | 'student_name' | 'activity_name' | 'class_name',
    direction: (searchParams?.get('sortDir') || 'desc') as 'asc' | 'desc'
  };
  
  return (
    <CorrectionsProvider initialFilters={initialFilters} initialSort={initialSort}>
      <BatchDeleteProvider>
        <CorrectionsContent />
      </BatchDeleteProvider>
    </CorrectionsProvider>
  );
}

// Composant qui affiche le contenu
function CorrectionsContent() {
  const router = useRouter();
  // Fix the type error by directly using useSearchParams without React.use
  const searchParams = useSearchParams();
  const { enqueueSnackbar } = useSnackbar();
  
  // Utiliser le hook pour accéder aux données et fonctions
  const { 
    filteredCorrections, 
    loading, 
    error, 
    metaData,
    filters,
    setFilters,
    sortOptions,
    setSortOptions,
    activeFilters,
    setActiveFilters,
    applyFilter,
    removeFilter,
    clearAllFilters,
    refreshCorrections // Add this new method from the context
  } = useCorrections();
  
  // State pour la gestion des menus
  const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  
  // Add state for available sub-classes
  const [availableSubClasses, setAvailableSubClasses] = useState<{id: string, name: string}[]>([]);
  
  // Add state for scroll tracking
  const [stickyButtons, setStickyButtons] = useState(false);
  
  // Track scroll position
  useEffect(() => {
    const handleScroll = () => {
      // Determine if buttons should be sticky (when scrolled past 100px)
      const tabsElement = document.getElementById('correction-tabs-container');
      if (tabsElement) {
        const tabsRect = tabsElement.getBoundingClientRect();
        setStickyButtons(tabsRect.top < 0);
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Gérer l'initialisation des filtres actifs à partir de l'URL
  useEffect(() => {
    const newActiveFilters: string[] = [];
    if (searchParams?.get('search')) newActiveFilters.push('search');
    if (searchParams?.get('classId')) newActiveFilters.push('classId');
    if (searchParams?.get('studentId')) newActiveFilters.push('studentId');
    if (searchParams?.get('activityId')) newActiveFilters.push('activityId');
    if (searchParams?.get('recent') === 'true') newActiveFilters.push('recent');
    if (searchParams?.get('correctionId')) newActiveFilters.push('correctionId');
    if (searchParams?.get('subClassId')) newActiveFilters.push('subClassId'); // Add subClassId check
    
    setActiveFilters(newActiveFilters);
  }, [searchParams, setActiveFilters]);
  
  // Add effect to fetch sub-classes when a class is selected
  useEffect(() => {
    const fetchSubClasses = async () => {
      if (filters.classId) {
        try {
          const response = await fetch(`/api/classes/${filters.classId}`);
          if (response.ok) {
            const classData = await response.json();
            if (classData.nbre_subclasses && classData.nbre_subclasses > 0) {
              // Create sub-classes array
              const subClasses = Array.from(
                { length: classData.nbre_subclasses },
                (_, index) => ({
                  id: (index + 1).toString(),
                  name: `Groupe ${index + 1}`
                })
              );
              setAvailableSubClasses(subClasses);
              
              // Vérifier si la valeur actuelle de subClassId est valide pour cette nouvelle liste
              if (filters.subClassId) {
                const isValidSubClassId = subClasses.some(sc => sc.id === filters.subClassId);
                if (!isValidSubClassId) {
                  // Si la valeur n'est pas valide, la réinitialiser
                  setFilters(prev => ({ ...prev, subClassId: '' }));
                  // Si le filtre était actif, le retirer
                  if (activeFilters.includes('subClassId')) {
                    removeFilter('subClassId');
                  }
                }
              }
            } else {
              setAvailableSubClasses([]);
              // Réinitialiser le subClassId si la classe n'a pas de sous-classes
              if (filters.subClassId) {
                setFilters(prev => ({ ...prev, subClassId: '' }));
                if (activeFilters.includes('subClassId')) {
                  removeFilter('subClassId');
                }
              }
            }
          }
        } catch (error) {
          console.error("Error fetching sub-classes:", error);
          setAvailableSubClasses([]);
          // Réinitialiser en cas d'erreur
          if (filters.subClassId) {
            setFilters(prev => ({ ...prev, subClassId: '' }));
            if (activeFilters.includes('subClassId')) {
              removeFilter('subClassId');
            }
          }
        }
      } else {
        setAvailableSubClasses([]);
        // Clear subClassId if class is cleared
        if (filters.subClassId) {
          setFilters(prev => ({ ...prev, subClassId: '' }));
          if (activeFilters.includes('subClassId')) {
            removeFilter('subClassId');
          }
        }
      }
    };
    
    fetchSubClasses();
  }, [filters.classId]);
  
  // Menu handlers
  const handleSortClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setSortAnchorEl(event.currentTarget);
  };
  
  const handleFilterClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };
  
  const handleSortClose = () => {
    setSortAnchorEl(null);
  };
  
  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };
  
  // Handle sort selection
  const handleSortSelect = (field: 'submission_date' | 'grade' | 'student_name' | 'activity_name' | 'class_name') => {
    const newDirection = field === sortOptions.field && sortOptions.direction === 'desc' ? 'asc' : 'desc';
    
    setSortOptions({
      field,
      direction: newDirection
    });
    
    handleSortClose();
    
    // Update URL
    updateQueryParams({
      sortBy: field,
      sortDir: newDirection
    });
  };
  
  // Handle filter changes
  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const name = event.target.name as keyof typeof filters;
    const value = event.target.value as string;
    
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle date filter changes
  const handleDateChange = (dateType: 'dateFrom' | 'dateTo', date: dayjs.Dayjs | null) => {
    setFilters(prev => ({
      ...prev,
      [dateType]: date
    }));
  };
  
  // Apply filter and update URL
  const handleApplyFilter = (filterName: string) => {
    applyFilter(filterName);
    handleFilterClose();
    
    // Update URL for certain filters, including subClassId
    if (['classId', 'studentId', 'activityId', 'search', 'recent', 'correctionId', 'subClassId'].includes(filterName)) {
      if (filterName === 'recent') {
        updateQueryParams({ recent: 'true' });
      } else {
        updateQueryParams({ [filterName]: filters[filterName as keyof typeof filters] as string });
      }
    }
  };
  
  // Remove filter and update URL
  const handleRemoveFilter = (filterName: string) => {
    removeFilter(filterName);
    
    // Remove from URL
    if (['classId', 'studentId', 'activityId', 'search', 'correctionId', 'recent', 'subClassId'].includes(filterName)) {
      const newParams = new URLSearchParams(searchParams?.toString());
      newParams.delete(filterName);
      router.push(`/corrections?${newParams.toString()}`);
      
      // When removing classId, also remove subClassId filter
      if (filterName === 'classId' && activeFilters.includes('subClassId')) {
        removeFilter('subClassId');
        newParams.delete('subClassId');
        router.push(`/corrections?${newParams.toString()}`);
      }
    }
  };
  
  // Clear all filters and update URL
  const handleClearAllFilters = () => {
    clearAllFilters();
    
    // Clear URL params but keep sorting
    const newParams = new URLSearchParams();
    newParams.set('sortBy', sortOptions.field);
    newParams.set('sortDir', sortOptions.direction);
    router.push(`/corrections?${newParams.toString()}`);
  };
  
  // Helper to update query params
  const updateQueryParams = (params: Record<string, string>) => {
    const newParams = new URLSearchParams(searchParams?.toString());
    
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });
    
    router.push(`/corrections?${newParams.toString()}`);
  };
  
  // Récupérer le tab initial depuis l'URL ou utiliser 0 par défaut
  const initialTabValue = useMemo(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam !== null) {
      const tabIndex = parseInt(tabParam, 10);
      // Vérifier que le tab est valide (entre 0 et 4)
      if (!isNaN(tabIndex) && tabIndex >= 0 && tabIndex <= 4) {
        return tabIndex;
      }
    }
    return 0;
  }, [searchParams]);
  
  const [tabValue, setTabValue] = useState(initialTabValue);
  
  // Handle tab change
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    
    // Mettre à jour l'URL avec le nouveau tab
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', newValue.toString());
    
    // Utiliser router.replace pour éviter d'ajouter une entrée dans l'historique
    router.replace(`/corrections?${params.toString()}`, { scroll: false });
  };

  // Define the Activity type
  interface Activity {
    id: number;
    name: string;
    experimental_points?: number | null;
    theoretical_points?: number | null;
  }
  
  // Get card status color based on grade
  const getGradeColor = (grade: number): "success" | "info" | "primary" | "warning" | "error" => {
    if (grade >= 16) return 'success';
    if (grade >= 12) return 'info';
    if (grade >= 10) return 'primary';
    if (grade >= 8) return 'warning';
    return 'error';
  };

  const { 
    batchDeleteMode, 
    setBatchDeleteMode, 
    selectedCorrections, 
    setSelectedCorrections,
    deletingCorrections,
    setDeletingCorrection
  } = useBatchDelete();
  
  // Add state for delete confirmation modal
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  
  // Function to cancel batch delete mode
  const handleCancelBatchDelete = () => {
    setBatchDeleteMode(false);
    setSelectedCorrections([]);
  };

  // Function to handle batch deletion
  const handleBatchDelete = async () => {
    if (!selectedCorrections || selectedCorrections.length === 0) return;
    
    try {
      // Close confirmation modal
      setConfirmDeleteOpen(false);
      
      // Process deletions sequentially
      let successCount = 0;
      let failCount = 0;
      const deletedIds: string[] = [];
      
      for (const correctionId of selectedCorrections) {
        try {
          // Set this correction as currently being deleted
          setDeletingCorrection(correctionId, true);
          
          const response = await fetch(`/api/corrections/${correctionId}`, {
            method: 'DELETE',
            headers: {
              'X-Batch-Delete': 'true', // Add a header to indicate batch delete
              'X-Selected-Count': selectedCorrections.length.toString()
            }
          });
          
          if (response.ok) {
            successCount++;
            deletedIds.push(correctionId);
          } else {
            failCount++;
          }
        } catch (error) {
          console.error(`Error deleting correction ${correctionId}:`, error);
          failCount++;
        } finally {
          // Clear the deleting status regardless of success/failure
          setDeletingCorrection(correctionId, false);
        }
      }
      
      // After all deletions, log the batch operation
      if (successCount > 0) {
        try {
          await fetch('/api/logs', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action_type: 'BATCH_DELETE_CORRECTIONS',
              description: `Suppression groupée de ${successCount} correction(s)`,
              metadata: {
                success_count: successCount,
                fail_count: failCount,
                deleted_ids: deletedIds,
                total_selected: selectedCorrections.length
              }
            })
          });
        } catch (logError) {
          console.error('Error logging batch delete:', logError);
        }
        
        // Show success message
        enqueueSnackbar(`${successCount} correction(s) supprimée(s) avec succès`, { 
          variant: 'success',
          autoHideDuration: 5000
        });
      }
      
      if (failCount > 0) {
        enqueueSnackbar(`Échec de la suppression pour ${failCount} correction(s)`, { 
          variant: 'error',
          autoHideDuration: 5000
        });
      }
      
      // Exit batch delete mode and clear selection
      setBatchDeleteMode(false);
      setSelectedCorrections([]);
      
      // Refresh the corrections data instead of reloading the page
      if (refreshCorrections) {
        await refreshCorrections();
      }
      
    } catch (error) {
      console.error('Error in batch delete operation:', error);
      enqueueSnackbar('Une erreur est survenue lors de la suppression', { 
        variant: 'error',
        autoHideDuration: 5000
      });
      
      // Clear all deleting statuses in case of an error
      selectedCorrections.forEach(id => setDeletingCorrection(id, false));
    }
  };

  // États pour la pagination du tableau d'aperçu des corrections
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Gestion du changement de page
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  // Gestion du changement du nombre d'éléments par page
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (loading && !filteredCorrections.length) {
    return (
      <Container sx={{ py: 4 }}>
        <Box className='max-w-[400px]' sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8, mx: 'auto' }}>
          <LoadingSpinner size="lg" text="Chargement des corrections" />
        </Box>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Paper 
        elevation={3} 
        sx={{ 
          borderRadius: 3,
          overflow: 'hidden',
          mb: 4,
        }}
      >
        <GradientBackground variant="primary" sx={{ p: 0 }}>
          <PatternBackground 
            pattern="dots" 
            opacity={0.05} 
            color="black" 
            size={100}
            sx={{ p: 4, borderRadius: 2 }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                    p: 1.5,
                    borderRadius: '50%',
                    display: 'flex',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                  }}
                >
                  <AssignmentIcon sx={{ fontSize: 50, color: (theme) => theme.palette.text.primary }} />
                </Box>
                
                <Box>
                  <Typography variant='h4' fontWeight={700} color='text.primary'>Corrections</Typography>
                  <Typography variant="subtitle1" color='text.secondary' sx={{ opacity: 0.9 }}>
                    Gérez et analysez toutes les corrections des activités
                  </Typography>
                </Box>
              </Box>
            </Box>
          
            {/* Filters display */}
            {activeFilters.length > 0 && (
          <Box sx={{ 
            bgcolor: (theme) => alpha(theme.palette.background.paper,1),
            borderRadius: 2,
            boxShadow: 3,
            mt: 2,
            p: 2,
            border: '1px solid',
            borderColor: (theme) => alpha(theme.palette.primary.main, 0.2),
            position: 'relative',
            overflow: 'hidden'
          }}>

            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mb: 2,
              pl: 1
            }}>
              <FilterAltIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  fontWeight: 600,
                  color: 'text.primary'
                }}
              >
                Filtres actifs ({activeFilters.length})
              </Typography>
              <Button 
                size="small" 
                onClick={handleClearAllFilters}
                variant="outlined"
                startIcon={<CloseIcon />}
                sx={{ 
                  ml: 'auto',
                  borderRadius: 4,
                  textTransform: 'none',
                  px: 2
                }}
              >
                Tout effacer
              </Button>
            </Box>
            
            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 1.2,
              pl: 1
            }}>
              {activeFilters.includes('search') && (
                <Chip 
                  label={`Recherche: ${filters.search}`} 
                  onDelete={() => handleRemoveFilter('search')}
                  color="primary"
                  variant="outlined"
                  sx={{ 
                    borderRadius: 3, 
                    '& .MuiChip-deleteIcon': { 
                      color: 'primary.light',
                      '&:hover': { color: 'error.main' } 
                    },
                    py: 0.5,
                    fontWeight: 500,
                    borderWidth: 1.5
                  }}
                />
              )}
              
              {activeFilters.includes('classId') && (
                <Chip 
                  icon={<SchoolIcon />}
                  label={`Classe: ${metaData.classes.find(c => c.id.toString() === filters.classId)?.name || 'Inconnue'}`}
                  onDelete={() => handleRemoveFilter('classId')}
                  color="primary"
                  variant="outlined"
                  sx={{ 
                    borderRadius: 3, 
                    '& .MuiChip-deleteIcon': { 
                      color: 'primary.light',
                      '&:hover': { color: 'error.main' } 
                    },
                    py: 0.5,
                    fontWeight: 500,
                    borderWidth: 1.5
                  }}
                />
              )}
              
              {activeFilters.includes('studentId') && (
                <Chip 
                  icon={<PersonIcon />}
                  label={`Étudiant: ${metaData.students.find(s => s.id.toString() === filters.studentId)?.name || 'Inconnu'}`}
                  onDelete={() => handleRemoveFilter('studentId')}
                  color="primary"
                  variant="outlined"
                  sx={{ 
                    borderRadius: 3, 
                    '& .MuiChip-deleteIcon': { 
                      color: 'primary.light',
                      '&:hover': { color: 'error.main' } 
                    },
                    py: 0.5,
                    fontWeight: 500,
                    borderWidth: 1.5
                  }}
                />
              )}
              
              {activeFilters.includes('activityId') && (
                <Chip 
                  icon={<AssignmentIcon sx={{color: 'secondary.dark'}} />}
                  label={`Activité: ${metaData.activities.find(a => a.id.toString() === filters.activityId)?.name || 'Inconnue'}`}
                  onDelete={() => handleRemoveFilter('activityId')}
                  color="primary"
                  variant="outlined"
                  sx={{ 
                    borderRadius: 3, 
                    '& .MuiChip-deleteIcon': { 
                      color: 'primary.light',
                      '&:hover': { color: 'error.main' } 
                    },
                    py: 0.5,
                    fontWeight: 500,
                    borderWidth: 1.5
                  }}
                />
              )}
              
              {activeFilters.includes('recent') && (
                <Chip 
                  icon={<CalendarIcon sx={{color: 'secondary.dark'}} />}
                  label="Dernières 24h"
                  onDelete={() => handleRemoveFilter('recent')}
                  color="secondary"
                  variant="outlined"
                  sx={{ 
                    color:"text.primary",
                    borderRadius: 3, 
                    '& .MuiChip-deleteIcon': { 
                      color: 'secondary.dark',
                      '&:hover': { color: 'error.main' } 
                    },
                    py: 0.5,
                    fontWeight: 500,
                    borderWidth: 1.5
                  }}
                />
              )}
              
              {activeFilters.includes('dateFrom') && (
                <Chip 
                  icon={<CalendarIcon sx={{color: 'secondary.dark'}} />}
                  label={`Depuis: ${dayjs(filters.dateFrom).format('DD/MM/YYYY')}`}
                  onDelete={() => handleRemoveFilter('dateFrom')}
                  variant="outlined"
                  sx={{ 
                    borderRadius: 3, 
                    color:"text.primary",
                    '& .MuiChip-deleteIcon': { 
                      color: 'secondary.dark',
                      '&:hover': { color: 'error.main' } 
                    },
                    py: 0.5,
                    fontWeight: 500,
                    borderWidth: 1.5
                  }}
                />
              )}
              
              {activeFilters.includes('dateTo') && (
                <Chip 
                  icon={<CalendarIcon sx={{color: 'secondary.dark'}} />}
                  label={`Jusqu'à: ${dayjs(filters.dateTo).format('DD/MM/YYYY')}`}
                  onDelete={() => handleRemoveFilter('dateTo')}
                  color="secondary"
                  variant="outlined"
                  sx={{ 
                    color:"text.primary",
                    borderRadius: 3, 
                    '& .MuiChip-deleteIcon': { 
                      color: 'secondary.dark',
                      '&:hover': { color: 'error.main' } 
                    },
                    py: 0.5,
                    fontWeight: 500,
                    borderWidth: 1.5
                  }}
                />
              )}
              
              {activeFilters.includes('minGrade') && (
                <Chip 
                  icon={<GradeIcon sx={{color: 'secondary.dark'}} />}
                  label={`Note min: ${filters.minGrade}`}
                  onDelete={() => handleRemoveFilter('minGrade')}
                  color="info"
                  variant="outlined"
                  sx={{ 
                    borderRadius: 3, 
                    '& .MuiChip-deleteIcon': { 
                      color: 'info.dark',
                      '&:hover': { color: 'error.main' } 
                    },
                    py: 0.5,
                    fontWeight: 500,
                    borderWidth: 1.5
                  }}
                />
              )}
              
              {activeFilters.includes('maxGrade') && (
                <Chip 
                  icon={<GradeIcon sx={{color: 'secondary.dark'}} />}
                  label={`Note max: ${filters.maxGrade}`}
                  onDelete={() => handleRemoveFilter('maxGrade')}
                  color="info"
                  variant="outlined"
                  sx={{ 
                    borderRadius: 3, 
                    '& .MuiChip-deleteIcon': { 
                      color: 'info.dark',
                      '&:hover': { color: 'error.main' } 
                    },
                    py: 0.5,
                    fontWeight: 500,
                    borderWidth: 1.5
                  }}
                />
              )}
              
              {activeFilters.includes('correctionId') && (
                <Chip 
                  icon={<AssignmentIcon />}
                  label={`ID: ${filters.correctionId}`}
                  onDelete={() => handleRemoveFilter('correctionId')}
                  color="warning"
                  variant="outlined"
                  sx={{ 
                    borderRadius: 3, 
                    '& .MuiChip-deleteIcon': { 
                      color: 'warning.dark',
                      '&:hover': { color: 'error.main' } 
                    },
                    py: 0.5,
                    fontWeight: 500,
                    borderWidth: 1.5
                  }}
                />
              )}
              
              {activeFilters.includes('subClassId') && (
                <Chip 
                  icon={<RecentActorsIcon />}
                  label={`Groupe: ${filters.subClassId}`}
                  onDelete={() => handleRemoveFilter('subClassId')}
                  color="info"
                  variant="outlined"
                  sx={{ 
                    borderRadius: 3, 
                    '& .MuiChip-deleteIcon': { 
                      color: 'info.light',
                      '&:hover': { color: 'error.main' } 
                    },
                    py: 0.5,
                    fontWeight: 500,
                    borderWidth: 1.5
                  }}
                />
              )}
            </Box>
          </Box>
            )}
          </PatternBackground>
        </GradientBackground>
        
        {/* Stats summary */}
        <Box sx={{ p: 2 }}>
          <Grid container spacing={2} sx={{ display: 'flex', justifyContent: 'space-around', }}>
            <Grid size={{ xs: 12, sm:6, md: 2 }}>
              <Paper sx={{ 
                p: 2, 
                textAlign: 'center', 
                height: '100%',
                bgcolor: (theme) => alpha(theme.palette.myBoxes.primary, 0.5),
                backdropFilter: 'blur(5px)',
                borderRadius: 2,
              }}>
                <Typography variant="overline" color="text.secondary">Total</Typography>
                <Typography variant="h3" fontWeight="bold" color="text.primary">{filteredCorrections.length}</Typography>
                <Typography variant="overline" color="text.secondary">
                  {filteredCorrections.length === 1 ? 'correction' : 'corrections'}
                </Typography>
              </Paper>
            </Grid>
            
            <Grid size={{ xs: 12, sm:6, md: 2 }}>
              <Paper sx={{ 
                p: 2, 
                textAlign: 'center', 
                height: '100%',
                bgcolor: (theme) => alpha(theme.palette.myBoxes.primary, 0.5),
                backdropFilter: 'blur(5px)',
                borderRadius: 2,
              }}>
                <Typography variant="overline" color="text.secondary">Moyenne</Typography>
                <Typography variant="h3" fontWeight="bold" color="text.primary">
                  {filteredCorrections.length 
                    ? (filteredCorrections.reduce((sum, c) => {
                        // Trouver l'activité correspondante pour obtenir le barème total
                        const activity = metaData.activities.find(a => a.id === c.activity_id);
                        const totalPoints = activity 
                          ? ((activity as Activity).experimental_points || 0) + ((activity as Activity).theoretical_points || 0) 
                          : 20;
                        
                        // Normaliser la note sur 20 points
                        const grade = typeof c.grade === 'string' ? parseFloat(c.grade) : c.grade;
                        const normalizedGrade = totalPoints > 0 ? (grade / totalPoints) * 20 : grade;
                        
                        return sum + normalizedGrade;
                      }, 0) / filteredCorrections.length).toFixed(1)
                    : '-'}
                </Typography>
                <Typography variant="overline" color="text.secondary">/ 20</Typography>
              </Paper>
            </Grid>
            
            <Grid size={{ xs: 12, sm:6, md: 2 }}>
              <Paper sx={{ 
                p: 2, 
                textAlign: 'center', 
                height: '100%',
                bgcolor: (theme) => alpha(theme.palette.myBoxes.primary, .5),
                backdropFilter: 'blur(5px)',
                borderRadius: 2,
              }}>
                <Typography variant="overline" color="text.secondary">Classes</Typography>
                <Typography variant="h3" fontWeight="bold" color="text.primary">
                  {new Set(filteredCorrections.map(c => c.class_id)).size}
                </Typography>
                <Typography variant="overline" color="text.secondary" >
                  {new Set(filteredCorrections.map(c => c.class_id)).size <= 1 ? 'unique' : 'uniques'}
                </Typography>
              </Paper>
            </Grid>
            
            <Grid size={{ xs: 12, sm:6, md: 2 }}>
              <Paper sx={{ 
                p: 2, 
                textAlign: 'center', 
                height: '100%',
                bgcolor: (theme) => alpha(theme.palette.myBoxes.primary, 0.5),
                backdropFilter: 'blur(5px)',
                borderRadius: 2,
              }}>
                <Typography variant="overline" color="text.secondary">Étudiants</Typography>
                <Typography variant="h3" fontWeight="bold" color="text.primary">
                  {new Set(filteredCorrections.map(c => c.student_id)).size}
                </Typography>
                <Typography variant="overline" color="text.secondary">
                  {new Set(filteredCorrections.map(c => c.student_id)).size <= 1 ? 'unique' : 'uniques'}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Paper>
      
      {/* Tabs for different views with filter & sort buttons */}
      <Box 
        id="correction-tabs-container"
        sx={{ 
          mb: 3, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: 1,
          borderColor: 'divider',
          position: 'relative',
          zIndex: 10
        }}
      >
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '1rem',
            },
            flexGrow: 1, // Permet aux tabs de prendre l'espace disponible
            maxWidth: { xs: '100%', sm: '70%' } // Limite la largeur sur grand écran
          }}
        >
          <Tab icon={<AssignmentIcon />} label="Toutes les corrections" />
          <Tab icon={<SchoolIcon />} label="Par classe" />
          <Tab icon={<PersonIcon />} label="Par étudiant" />
          <Tab icon={<CalendarIcon />} label="Chronologie" />
          <Tab icon={<QrCodeIcon />} label="Export PDF" />
        </Tabs>
        
        {/* Boutons de filtre, tri et suppression en lot */}
        <Box sx={{ 
          display: 'flex', 
          gap: 1,
          ml: 2,
          flexShrink: 0, // Empêche les boutons de se rétrécir
          transition: 'all 0.3s ease',
        }}>
          {/* When not in batch delete mode, show normal buttons */}
          {!batchDeleteMode ? (
            <>
              <Badge 
                badgeContent={activeFilters.length} 
                color="error" 
                sx={{ '& .MuiBadge-badge': { top: 8, right: 8 } }}
              >
                <Button
                  variant="contained"
                  onClick={handleFilterClick}
                  startIcon={<FilterAltIcon />}
                  size="small"
                >
                  Filtres
                </Button>
              </Badge>
              
              <Button
                variant="contained"
                onClick={handleSortClick}
                startIcon={<SortIcon />}
                size="small"
              >
                Trier
              </Button>
              
              <Button
                variant="contained"
                color="error"
                onClick={() => setBatchDeleteMode(true)}
                startIcon={<DeleteIcon />}
                size="small"
                disabled={filteredCorrections.length === 0}
              >
                Suppression en lot
              </Button>
            </>
          ) : null}
        </Box>
      </Box>
      
      {/* Sticky Batch Delete Button Container */}
      {batchDeleteMode && (
        <Box 
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 1,
            position: stickyButtons ? 'fixed' : 'static',
            top: stickyButtons ? '15px' : 'auto',
            right: stickyButtons ? '15px' : 'auto',
            zIndex: 1100,
            transition: 'all 0.3s ease',
            py: 1,
            px: 2,
            bgcolor: theme => stickyButtons ? alpha(theme.palette.background.paper, 0.9) : 'transparent',
            backdropFilter: stickyButtons ? 'blur(8px)' : 'none',
            borderRadius: stickyButtons ? 2 : 0,
            boxShadow: stickyButtons ? 3 : 0,
          }}
        >
          <Button
            variant="contained"
            color="error"
            onClick={() => setConfirmDeleteOpen(true)}
            startIcon={<DeleteIcon />}
            size="small"
            disabled={selectedCorrections.length === 0}
          >
            Supprimer ({selectedCorrections.length})
          </Button>
          <Button
            variant="outlined"
            onClick={handleCancelBatchDelete}
            size="small"
          >
            Annuler
          </Button>
        </Box>
      )}
      
      <Box sx={{ mb: 2 }}>
          <FormControl fullWidth>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Statut des corrections
            </Typography>
            <Button
              fullWidth
              variant={activeFilters.includes('showInactive') ? "outlined" : "outlined"}
              sx={{
                color: activeFilters.includes ('showInactive') ? "primary" : theme => theme.palette.warning.dark,
                borderColor: activeFilters.includes ('showInactive') ? theme => alpha(theme.palette.primary.dark, 1) : theme => alpha(theme.palette.warning.dark, 1),
                backgroundColor: activeFilters.includes ('showInactive') ? theme => alpha(theme.palette.primary.dark, 0.05) : theme => alpha(theme.palette.warning.dark, 0.1),
                '&:hover': {
                  backgroundColor: activeFilters.includes ('showInactive') ? theme => alpha(theme.palette.primary.dark, 0.2) : theme => alpha(theme.palette.warning.dark, 0.2),
                  borderColor: activeFilters.includes ('showInactive') ? "transparent" : theme => alpha(theme.palette.warning.dark, 1),
                },
              }}
              onClick={() => {
                if (activeFilters.includes('showInactive')) {
                  // Remove the filter if it's active
                  handleRemoveFilter('showInactive');
                } else {
                  // Set showInactive to true and apply the filter
                  setFilters(prev => ({ ...prev, showInactive: true }));
                  handleApplyFilter('showInactive');
                }
              }}
              startIcon={<VisibilityIcon />}
            >
              {activeFilters.includes('showInactive') ? "Toutes les corrections (actives et inactives)" : "Uniquement les corrections actives"}
            </Button>
          </FormControl>
        </Box>
        
      {/* Content based on selected tab */}
      {tabValue === 0 && (
        <CorrectionsList
          filteredCorrections={filteredCorrections}
          error={error}
          activeFilters={activeFilters}
          handleClearAllFilters={handleClearAllFilters}
          getGradeColor={getGradeColor}
          highlightedIds={searchParams?.get('highlight')?.split(',').filter(Boolean) || []}
          recentFilter={activeFilters.includes('recent')}
          refreshCorrections={refreshCorrections}
        />
      )}
      
      {tabValue === 1 && (
        <ClassesList
          filteredCorrections={filteredCorrections}
          error={error}
          activeFilters={activeFilters}
          handleClearAllFilters={handleClearAllFilters}
          highlightedIds={searchParams?.get('highlight')?.split(',').filter(Boolean) || []}
          getGradeColor={getGradeColor}
          subClassFilter={filters.subClassId} // Add subClassFilter prop
          refreshCorrections={refreshCorrections}
        />
      )}
      
      {tabValue === 2 && (
        <StudentsList
          filteredCorrections={filteredCorrections}
          error={error}
          activeFilters={activeFilters}
          handleClearAllFilters={handleClearAllFilters}
          getGradeColor={getGradeColor}
          highlightedIds={searchParams?.get('highlight')?.split(',').filter(Boolean) || []}
          recentFilter={activeFilters.includes('recent')}
          refreshCorrections={refreshCorrections}
        />
      )}
      
      {tabValue === 3 && (
        <ChronologyList
          filteredCorrections={filteredCorrections}
          error={error}
          activeFilters={activeFilters}
          handleClearAllFilters={handleClearAllFilters}
          getGradeColor={getGradeColor}
          highlightedIds={searchParams?.get('highlight')?.split(',').filter(Boolean) || []}
          recentFilter={activeFilters.includes('recent')}
        />
      )}
      
      {tabValue === 4 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            Export des QR codes de feedback
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Générez un document PDF contenant les QR codes d'accès aux corrections pour chaque étudiant. Les étudiants peuvent scanner ces codes pour voir leurs résultats.
          </Typography>
          
          <Paper variant="outlined" sx={{ p: 3, mt: 2 }}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="activity-select-label">Activité</InputLabel>
                  <Select
                    labelId="activity-select-label"
                    value={filters.activityId}
                    onChange={handleFilterChange as (event: SelectChangeEvent<string>) => void}
                    name="activityId"
                    label="Activité"
                    startAdornment={
                      <AssignmentIcon sx={{ ml: 1, mr: 0.5, color: 'secondary.main' }} />
                    }
                  >
                    <MenuItem value="">Toutes les activités</MenuItem>
                    {metaData.activities.map(a => (
                      <MenuItem key={a.id} value={a.id.toString()}>{a.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button 
                  variant="text" 
                  size="small" 
                  onClick={() => handleApplyFilter('activityId')}
                  disabled={!filters.activityId}
                  sx={{ mt: 0.5 }}
                >
                  Appliquer
                </Button>
              </Grid>
              
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="class-select-label">Classe</InputLabel>
                  <Select
                    labelId="class-select-label"
                    value={filters.classId}
                    onChange={handleFilterChange as (event: SelectChangeEvent<string>) => void}
                    name="classId"
                    label="Classe"
                    startAdornment={
                      <SchoolIcon sx={{ ml: 1, mr: 0.5, color: 'primary.main' }} />
                    }
                  >
                    <MenuItem value="">Toutes les classes</MenuItem>
                    {metaData.classes.map(c => (
                      <MenuItem key={c.id} value={c.id.toString()}>{c.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button 
                  variant="text" 
                  size="small" 
                  onClick={() => handleApplyFilter('classId')}
                  disabled={!filters.classId}
                  sx={{ mt: 0.5 }}
                >
                  Appliquer
                </Button>
              </Grid>
              
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth size="small" disabled={!filters.classId || availableSubClasses.length === 0}>
                  <InputLabel id="subgroup-select-label">Sous-groupe</InputLabel>
                  <Select
                    labelId="subgroup-select-label"
                    value={filters.subClassId}
                    onChange={handleFilterChange as (event: SelectChangeEvent<string>) => void}
                    name="subClassId"
                    label="Sous-groupe"
                    startAdornment={
                      <GroupIcon sx={{ ml: 1, mr: 0.5, color: 'secondary.main' }} />
                    }
                  >
                    <MenuItem value="">Tous les sous-groupes</MenuItem>
                    {availableSubClasses.map(group => (
                      <MenuItem key={group.id} value={group.id}>{group.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button 
                  variant="text" 
                  size="small" 
                  onClick={() => handleApplyFilter('subClassId')}
                  disabled={!filters.subClassId || !filters.classId}
                  sx={{ mt: 0.5 }}
                >
                  Appliquer
                </Button>
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 3 }} />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2">
                {filteredCorrections.length} correction(s) sélectionnée(s)
              </Typography>
              <Button
                variant="outlined"
                color="success"
                startIcon={<PictureAsPdfIcon />}
                disabled={filteredCorrections.length === 0}
                onClick={async () => {
                  try {
                    // Vérifier et créer des codes de partage pour toutes les corrections qui en ont besoin
                    const correctionsWithoutShareCodes = filteredCorrections.filter(c => 
                      // Vérifier si la propriété shareCode n'existe pas ou est nulle
                      !('shareCode' in c) || !(c as any).shareCode
                    );
                    
                    if (correctionsWithoutShareCodes.length > 0) {
                      // Récupérer uniquement les IDs des corrections sans codes de partage
                      const correctionIds = correctionsWithoutShareCodes.map(c => c.id!);
                      
                      // Créer des codes de partage par lots
                      const response = await fetch('/api/share/batch', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ correctionIds }),
                      });
                      
                      if (!response.ok) {
                        throw new Error('Erreur lors de la création des codes de partage');
                      }
                    }
                    
                    // Générer le PDF de codes QR
                    const groupName = filters.subClassId ? 
                      availableSubClasses.find(g => g.id === filters.subClassId)?.name || 'Groupe' : 
                      filters.classId ? 
                        metaData.classes.find(c => c.id.toString() === filters.classId)?.name || 'Classe' : 
                        'Toutes les corrections';
                    
                    const activityName = filters.activityId ? 
                      metaData.activities.find(a => a.id.toString() === filters.activityId)?.name || 'Activité' : 
                      'Toutes les activités';

                    const pdfFileName = await generateQRCodePDF({
                      corrections: filteredCorrections,
                      group: {
                        name: groupName,
                        activity_name: activityName
                      },
                      generateShareCode: async (correctionId) => {
                        const response = await fetch(`/api/corrections/${correctionId}/share`, {
                          method: 'POST',
                        });
                        const data = await response.json();
                        return { isNew: true, code: data.code };
                      },
                      getExistingShareCode: async (correctionId) => {
                        const response = await fetch(`/api/corrections/${correctionId}/share`);
                        const data = await response.json();
                        return { exists: data.exists, code: data.code };
                      },
                      students: metaData.students.map(student => ({
                        id: parseInt(student.id.toString()),
                        first_name: student.name.split(' ')[0] || '',
                        last_name: student.name.split(' ').slice(1).join(' ') || ''
                      })),
                      activities: metaData.activities.map(activity => ({
                        id: parseInt(activity.id.toString()),
                        name: activity.name
                      }))
                    });
                    
                    if (pdfFileName) {
                      enqueueSnackbar(`PDF généré avec succès : ${pdfFileName}`, { variant: 'success', autoHideDuration: 5000 });
                    } else {
                      throw new Error('Erreur lors de la génération du PDF');
                    }
                  } catch (error) {
                    console.error('Erreur:', error);
                    enqueueSnackbar(`Erreur lors de l'export PDF: ${(error as Error).message}`, { variant: 'error', autoHideDuration: 5000 });
                  }
                }}
              >
                Générer PDF
              </Button>
            </Box>
            
            {filteredCorrections.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Aperçu des corrections sélectionnées:
                </Typography>
                <TableContainer component={Paper} sx={{ maxHeight: 400, overflow: 'auto' }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Étudiant</TableCell>
                        <TableCell>Activité</TableCell>
                        <TableCell>Classe</TableCell>
                        <TableCell align="center">Note</TableCell>
                        <TableCell align="center">Lien de partage</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredCorrections
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((correction) => {
                        const student = metaData.students.find(s => s.id === correction.student_id);
                        const activity = metaData.activities.find(a => a.id === correction.activity_id);
                        const classInfo = metaData.classes.find(c => c.id === correction.class_id);
                        const isActive = correction.active !== 0; // Considère la correction comme active par défaut (0 = inactive, 1 = active)
                        
                        return (
                          <TableRow 
                            key={correction.id} 
                            hover
                            sx={{ 
                              '&:last-child td, &:last-child th': { border: 0 },
                              bgcolor: !isActive ? alpha('#f5f5f5', 0.4) : 'inherit'
                            }}
                          >
                            <TableCell>{student?.name || `ID: ${correction.student_id}`}</TableCell>
                            <TableCell>{activity?.name || `ID: ${correction.activity_id}`}</TableCell>
                            <TableCell>{classInfo?.name || `ID: ${correction.class_id}`}</TableCell>
                            <TableCell align="center">
                              {isActive ? (
                                <Chip 
                                  label={`${correction.grade}/20`} 
                                  size="small"
                                  color={getGradeColor(correction.grade)}
                                  variant="outlined"
                                />
                              ) : (
                                <Chip 
                                  label="Correction inactive" 
                                  size="small"
                                  color="warning"
                                  sx={{ 
                                    bgcolor: theme => alpha(theme.palette.warning.dark, 0.1),
                                    color: theme => theme.palette.warning.dark,
                                    borderColor: theme => theme.palette.warning.dark,
                                  }}
                                />
                              )}
                            </TableCell>
                            <TableCell align="center">
                              {((correction as unknown) as CorrectionWithShareCode).shareCode ? (
                                <Chip
                                  size="small"
                                  icon={<QrCodeIcon />}
                                  label="Prêt"
                                  color="success"
                                  variant="outlined"
                                />
                              ) : (
                                <Chip
                                  size="small"
                                  icon={<QrCodeIcon />}
                                  label="Manquant"
                                  color="warning"
                                  variant="outlined"
                                />
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  component="div"
                  count={filteredCorrections.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  labelRowsPerPage="Lignes par page:"
                  labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
                />
              </Box>
            )}
          </Paper>
        </Box>
      )}
      
      {/* Sort Menu */}
      <Menu
        anchorEl={sortAnchorEl}
        open={Boolean(sortAnchorEl)}
        onClose={handleSortClose}
        slotProps={{
          paper: {
            elevation: 3,
            sx: {
              minWidth: 200,
              '& .MuiMenuItem-root': { py: 1.5 }
            }
          }
        }}
      >
        <MenuItem 
          onClick={() => handleSortSelect('submission_date')}
          selected={sortOptions.field === 'submission_date'}
        >
          <ListItemIcon>
            <CalendarIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Date</ListItemText>
          {sortOptions.field === 'submission_date' && (
            <ListItemIcon sx={{ justifyContent: 'flex-end' }}>
              {sortOptions.direction === 'desc' ? 
                <ArrowDownwardIcon fontSize="small" /> : 
                <ArrowUpwardIcon fontSize="small" />
              }
            </ListItemIcon>
          )}
        </MenuItem>
        
        <MenuItem 
          onClick={() => handleSortSelect('grade')}
          selected={sortOptions.field === 'grade'}
        >
          <ListItemIcon>
            <GradeIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Note</ListItemText>
          {sortOptions.field === 'grade' && (
            <ListItemIcon sx={{ justifyContent: 'flex-end' }}>
              {sortOptions.direction === 'desc' ? 
                <ArrowDownwardIcon fontSize="small" /> : 
                <ArrowUpwardIcon fontSize="small" />
              }
            </ListItemIcon>
          )}
        </MenuItem>
        
        <MenuItem 
          onClick={() => handleSortSelect('student_name')}
          selected={sortOptions.field === 'student_name'}
        >
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Étudiant</ListItemText>
          {sortOptions.field === 'student_name' && (
            <ListItemIcon sx={{ justifyContent: 'flex-end' }}>
              {sortOptions.direction === 'desc' ? 
                <ArrowDownwardIcon fontSize="small" /> : 
                <ArrowUpwardIcon fontSize="small" />
              }
            </ListItemIcon>
          )}
        </MenuItem>
        
        <MenuItem 
          onClick={() => handleSortSelect('activity_name')}
          selected={sortOptions.field === 'activity_name'}
        >
          <ListItemIcon>
            <AssignmentIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Activité</ListItemText>
          {sortOptions.field === 'activity_name' && (
            <ListItemIcon sx={{ justifyContent: 'flex-end' }}>
              {sortOptions.direction === 'desc' ? 
                <ArrowDownwardIcon fontSize="small" /> : 
                <ArrowUpwardIcon fontSize="small" />
              }
            </ListItemIcon>
          )}
        </MenuItem>
        
        <MenuItem 
          onClick={() => handleSortSelect('class_name')}
          selected={sortOptions.field === 'class_name'}
        >
          <ListItemIcon>
            <SchoolIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Classe</ListItemText>
          {sortOptions.field === 'class_name' && (
            <ListItemIcon sx={{ justifyContent: 'flex-end' }}>
              {sortOptions.direction === 'desc' ? 
                <ArrowDownwardIcon fontSize="small" /> : 
                <ArrowUpwardIcon fontSize="small" />
              }
            </ListItemIcon>
          )}
        </MenuItem>
      </Menu>
      
      {/* Filter Menu */}
      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={handleFilterClose}
        PaperProps={{
          elevation: 3,
          sx: {
            width: 300,
            maxHeight: '80vh',
            p: 2
          }
        }}
      >
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          Filtrer les corrections
        </Typography>
        
        <Divider sx={{ mb: 2 }} />
        
        <Box sx={{ mb: 2 }}>
          <TextField
            name="search"
            label="Recherche"
            fullWidth
            size="small"
            value={filters.search}
            onChange={handleFilterChange}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }
            }}
          />
          <Button 
            variant="text" 
            size="small" 
            onClick={() => handleApplyFilter('search')}
            disabled={!filters.search}
            sx={{ mt: 0.5 }}
          >
            Appliquer
          </Button>
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Classe</InputLabel>
            <Select
              name="classId"
              value={filters.classId}
              onChange={handleFilterChange as (event: SelectChangeEvent<string>) => void}
              label="Classe"
            >
              <MenuItem value="">
                <em>Toutes les classes</em>
              </MenuItem>
              {metaData.classes.map(c => (
                <MenuItem key={c.id} value={c.id.toString()}>{c.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button 
            variant="text" 
            size="small" 
            onClick={() => handleApplyFilter('classId')}
            disabled={!filters.classId}
            sx={{ mt: 0.5 }}
          >
            Appliquer
          </Button>
        </Box>
        
        {availableSubClasses.length > 0 && filters.classId && (
          <Box sx={{ mb: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Groupe</InputLabel>
              <Select
                name="subClassId"
                value={filters.subClassId}
                onChange={handleFilterChange as (event: SelectChangeEvent<string>) => void}
                label="Groupe"
              >
                <MenuItem value="">
                  <em>Tous les groupes</em>
                </MenuItem>
                {availableSubClasses.map(group => (
                  <MenuItem key={group.id} value={group.id}>
                    {group.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button 
              variant="text" 
              size="small" 
              onClick={() => handleApplyFilter('subClassId')}
              disabled={!filters.subClassId}
              sx={{ mt: 0.5 }}
            >
              Appliquer
            </Button>
          </Box>
        )}
        
        <Box sx={{ mb: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Étudiant</InputLabel>
            <Select
              name="studentId"
              value={filters.studentId}
              onChange={handleFilterChange as (event: SelectChangeEvent<string>) => void}
              label="Étudiant"
            >
              <MenuItem value="">
                <em>Tous les étudiants</em>
              </MenuItem>
              {metaData.students.map(s => (
                <MenuItem key={s.id} value={s.id.toString()}>{s.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button 
            variant="text" 
            size="small" 
            onClick={() => handleApplyFilter('studentId')}
            disabled={!filters.studentId}
            sx={{ mt: 0.5 }}
          >
            Appliquer
          </Button>
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Activité</InputLabel>
            <Select
              name="activityId"
              value={filters.activityId}
              onChange={handleFilterChange as (event: SelectChangeEvent<string>) => void}
              label="Activité"
            >
              <MenuItem value="">
                <em>Toutes les activités</em>
              </MenuItem>
              {metaData.activities.map(a => (
                <MenuItem key={a.id} value={a.id.toString()}>{a.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button 
            variant="text" 
            size="small" 
            onClick={() => handleApplyFilter('activityId')}
            disabled={!filters.activityId}
            sx={{ mt: 0.5 }}
          >
            Appliquer
          </Button>
        </Box>
        
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Période
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <DatePicker
                label="Date début"
                value={filters.dateFrom}
                onChange={(date) => handleDateChange('dateFrom', date)}
                slotProps={{
                  textField: {
                    size: 'small',
                    fullWidth: true
                  }
                }}
              />
              <Button 
                variant="text" 
                size="small" 
                onClick={() => handleApplyFilter('dateFrom')}
                disabled={!filters.dateFrom}
              >
                <CheckIcon fontSize="small" />
              </Button>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <DatePicker
                label="Date fin"
                value={filters.dateTo}
                onChange={(date) => handleDateChange('dateTo', date)}
                slotProps={{
                  textField: {
                    size: 'small',
                    fullWidth: true
                  }
                }}
              />
              <Button 
                variant="text" 
                size="small" 
                onClick={() => handleApplyFilter('dateTo')}
                disabled={!filters.dateTo}
              >
                <CheckIcon fontSize="small" />
              </Button>
            </Box>
          </Box>
        </LocalizationProvider>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Plage de notes
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
            <TextField
              name="minGrade"
              label="Note min"
              type="number"
              size="small"
              fullWidth
              value={filters.minGrade}
              onChange={handleFilterChange}
              slotProps={{
                input: { inputProps: { min: 0, max: 20, step: 0.5 } }
              }}
            />
            <Button 
              variant="text" 
              size="small" 
              onClick={() => handleApplyFilter('minGrade')}
              disabled={!filters.minGrade}
            >
              <CheckIcon fontSize="small" />
            </Button>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              name="maxGrade"
              label="Note max"
              type="number"
              size="small"
              fullWidth
              value={filters.maxGrade}
              onChange={handleFilterChange}
              slotProps={{
                input: { inputProps: { min: 0, max: 20, step: 0.5 } }
              }}
            />
            <Button 
              variant="text" 
              size="small" 
              onClick={() => handleApplyFilter('maxGrade')}
              disabled={!filters.maxGrade}
            >
              <CheckIcon fontSize="small" />
            </Button>
          </Box>
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <TextField
            name="correctionId"
            label="ID de correction"
            fullWidth
            size="small"
            value={filters.correctionId}
            onChange={handleFilterChange}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <AssignmentIcon fontSize="small" />
                  </InputAdornment>
                ),
              }
            }}
          />
          <Button 
            variant="text" 
            size="small" 
            onClick={() => handleApplyFilter('correctionId')}
            disabled={!filters.correctionId}
            sx={{ mt: 0.5 }}
          >
            Appliquer
          </Button>
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <Button
            fullWidth
            variant="outlined"
            sx={{ color: theme => theme.palette.text.primary, 
              bgcolor: theme => alpha(theme.palette.secondary.main, 0.1),
              borderColor: theme => theme.palette.secondary.dark }}
            onClick={() => handleApplyFilter('recent')}
            startIcon={<CalendarIcon />}
          >
            Corrections des dernières 24h
          </Button>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Button variant="text" onClick={handleClearAllFilters}>
            Tout effacer
          </Button>
          <Button variant="contained" onClick={handleFilterClose}>
            Fermer
          </Button>
        </Box>
      </Menu>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Confirmer la suppression
        </DialogTitle>
        <DialogContent>
            <DialogContentText id="delete-dialog-description">
            {selectedCorrections.length === 1 
              ? "Vous êtes sur le point de supprimer 1 correction. " 
              : `Vous êtes sur le point de supprimer ${selectedCorrections.length} corrections. `}
            Cette action est irréversible. Voulez-vous continuer ?
            </DialogContentText>
          
          {selectedCorrections.length > 0 && (
            <Box sx={{ mt: 2, maxHeight: '200px', overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Corrections sélectionnées :
              </Typography>
              {selectedCorrections.map(id => {
                const correction = filteredCorrections.find(c => c.id === parseInt(id));
                const student = correction ? metaData.students.find(s => s.id === correction.student_id) : null;
                const activity = correction ? metaData.activities.find(a => a.id === correction.activity_id) : null;
                
                return (
                  <Box key={id} sx={{ mb: 1, pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="body2" component="div">
                      {student?.name || 'Étudiant inconnu'} - {activity?.name || 'Activité inconnue'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ID: {id} {correction && ` - Note: ${correction.grade}`}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteOpen(false)} color="primary">
            Annuler
          </Button>
          <Button onClick={handleBatchDelete} color="error" variant="contained">
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
