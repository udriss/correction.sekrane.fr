'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Container, Paper, Typography, Box, Chip, Button, 
  IconButton, Menu, MenuItem, TextField, FormControl,
  InputLabel, Select, Badge, Divider, ListItemIcon, ListItemText,
  SelectChangeEvent, InputAdornment, Tabs, Tab, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination,
  ToggleButton, ToggleButtonGroup
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { useSnackbar } from 'notistack';
import { Correction, CorrectionWithShareCode } from '@/lib/types';
import { Student as BaseStudent } from '@/lib/types';
import { Correction as ProviderCorrection } from '@/app/components/CorrectionsDataProvider';
import ExportPDFComponent from '@/components/pdf/ExportPDFComponent';
import ExportPDFComponentAllCorrections from '@/components/pdf/ExportPDFComponentAllCorrections';

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
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ErrorDisplay from '@/components/ui/ErrorDisplay';

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
  // State pour la gestion des menus
  const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  
  // Add state for available sub-classes
  const [availableSubClasses, setAvailableSubClasses] = useState<{id: string, name: string}[]>([]);
  
  // Add state for scroll tracking
  const [stickyButtons, setStickyButtons] = useState(false);
  
  // États pour la pagination du tableau d'aperçu des corrections
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // États pour ExportPDFComponent
  const [classData, setClassData] = useState<any>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [classStudents, setClassStudents] = useState<any[]>([]);
  const [students, setStudents] = useState<ClassStudent[]>([]);
  const [filterActivity, setFilterActivity] = useState<number | 'all'>('all');
  const [filterSubClass, setFilterSubClass] = useState<string | 'all'>('all');
  
  // Add state for delete confirmation modal
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  
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
    refreshCorrections
  } = useCorrections();
  
  const { 
    batchDeleteMode, 
    setBatchDeleteMode, 
    selectedCorrections, 
    setSelectedCorrections,
    deletingCorrections,
    setDeletingCorrection
  } = useBatchDelete();
  
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

  // État pour suivre quel sous-onglet d'export est actif
  const [exportTabValue, setExportTabValue] = useState<number>(0);
  
  // Fonction pour gérer le changement de sous-onglet d'export
  const handleExportTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setExportTabValue(newValue);
  };

  


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

  // Effet pour récupérer les données pour ExportPDFComponent si on est sur l'onglet 4
  useEffect(() => {
    if (tabValue === 4) {
      const fetchExportData = async () => {
        try {
          // Récupérer toutes les corrections via l'API
          const correctionsResponse = await fetch('/api/corrections/all');
          if (!correctionsResponse.ok) {
            throw new Error('Erreur lors du chargement des corrections');
          }
          
          // Récupérer tous les étudiants
          const allStudentsResponse = await fetch('/api/students');
          if (!allStudentsResponse.ok) {
            throw new Error('Erreur lors du chargement des étudiants');
          }
          
          
          const studentsData = await allStudentsResponse.json();
          setStudents(studentsData);
          

          // Récupérer toutes les activités
          const allActivitiesResponse = await fetch('/api/activities');
          if (!allActivitiesResponse.ok) {
            throw new Error('Erreur lors du chargement des activités');
          }
          
          const activitiesData = await allActivitiesResponse.json();
          setActivities(activitiesData);
          
          // Si un filtre de classe est en place (vérification que classId n'est pas une chaîne vide)
          if (filters.classId && filters.classId.trim() !== '') {
            const classId = parseInt(filters.classId);
            
            // Récupérer les données de la classe
            const classResponse = await fetch(`/api/classes/${classId}`);
            if (classResponse.ok) {
              const classDataResult = await classResponse.json();
              setClassData(classDataResult);
              
              // Récupérer les étudiants pour cette classe spécifique
              const classStudentsResponse = await fetch(`/api/classes/${classId}/students`);
              if (classStudentsResponse.ok) {
                const classStudentsData = await classStudentsResponse.json();
                setClassStudents(classStudentsData);
              }
            }
          } else {
            // Récupérer toutes les classes pour que l'utilisateur puisse en sélectionner une
            const allClassesResponse = await fetch('/api/classes');
            if (!allClassesResponse.ok) {
              throw new Error('Erreur lors du chargement des classes');
            }
            
            const allClassesData = await allClassesResponse.json();
          }
        } catch (error) {
          console.error('Erreur lors de la récupération des données pour l\'export:', error);
          enqueueSnackbar(`Erreur: ${error instanceof Error ? error.message : 'Problème de chargement des données'}`, { 
            variant: 'error',
            autoHideDuration: 5000
          });
        }
      };
      
      fetchExportData();
    }
  }, [tabValue, filters.classId, enqueueSnackbar]);

  // Calculer les données de sous-classes uniques pour ExportPDFComponent
  const uniqueSubClasses = useMemo(() => {
    if (!classData?.nbre_subclasses) return [];
    return Array.from({ length: classData.nbre_subclasses }, (_, i) => ({
      id: i + 1,
      name: `Groupe ${i + 1}`
    }));
  }, [classData]);
  
  // Calculer les activités uniques pour ExportPDFComponent
  const uniqueActivities = useMemo(() => {
    // Obtenir les IDs d'activité uniques des corrections
    const uniqueIds = new Set(filteredCorrections.map(c => c.activity_id));
    
    // Créer un tableau d'activités uniques avec noms appropriés
    const uniqueActivitiesArray = Array.from(uniqueIds).map(id => {
      const activityData = activities.find(a => a.id === id);
      return {
        id,
        name: activityData?.name || `Activité ${id}`
      };
    });
    
    return uniqueActivitiesArray;
  }, [filteredCorrections, activities]);
  
    // Fonctions utilitaires pour ExportPDFComponent
    const getActivityById = (activityId: number) => {
      return activities.find(a => a.id === activityId);
    };
  
  const getStudentById = (studentId: number | null): ClassStudent | undefined => {
    if (!studentId) return undefined;
    return students.find(s => s.id === studentId);
  };
  

  

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
  
  // Extended interface for students with sub-class information
  interface ClassStudent extends BaseStudent {
    sub_class?: number;
  }
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
  
  // Si une erreur est présente, afficher le composant ErrorDisplay
  if (error) {
    return (
      <Box sx={{ mt: 2 }}>
        <ErrorDisplay 
          error={error} 
          withRefreshButton={true}
          onRefresh={refreshCorrections}
        />
      </Box>
    );
  }

  // Get a display text for active filter
  const getActiveFilterText = () => {
    if (activeFilters.includes('hideInactive')) {
      return 'Affiche uniquement les corrections actives';
    } else if (activeFilters.includes('showOnlyInactive')) {
      return 'Affiche uniquement les corrections inactives';
    } else {
      return 'Affiche toutes les corrections, y compris celles qui sont inactives';
    }
  };


  


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
              {activeFilters.includes('hideInactive') && (
                <Chip 
                  icon={<VisibilityIcon />}
                  label="Actives uniquement"
                  onDelete={() => handleRemoveFilter('hideInactive')}
                  color="success"
                  variant="outlined"
                  sx={{ 
                    borderRadius: 3, 
                    '& .MuiChip-deleteIcon': { 
                      color: 'success.dark',
                      '&:hover': { color: 'error.main' } 
                    },
                    py: 0.5,
                    fontWeight: 500,
                    borderWidth: 1.5
                  }}
                />
              )}
              
              {activeFilters.includes('showOnlyInactive') && (
                <Chip 
                  icon={<VisibilityOffIcon />}
                  label="Inactives uniquement"
                  onDelete={() => handleRemoveFilter('showOnlyInactive')}
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
                        // Utiliser final_grade s'il est disponible, sinon utiliser grade
                        const gradeValue = c.final_grade !== undefined ? c.final_grade : c.grade;
                        const grade = typeof gradeValue === 'string' ? parseFloat(gradeValue) : (gradeValue ?? 0);
                        return sum + grade;
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
        {/* Filter Menu */}
        <FormControl fullWidth>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Statut des corrections
          </Typography>
          <ToggleButtonGroup
            value={activeFilters.includes('hideInactive') 
              ? 'active' 
              : activeFilters.includes('showOnlyInactive') 
                ? 'inactive' 
                : 'all'}
            exclusive
            onChange={(event, newValue) => {
              // On commence par réinitialiser complètement les filtres d'activité
              setActiveFilters(prev => prev.filter(f => f !== 'hideInactive' && f !== 'showOnlyInactive'));
              setFilters(prev => ({
                ...prev,
                hideInactive: false,
                showOnlyInactive: false
              }));

              // On attend que la réinitialisation soit terminée avant d'appliquer le nouveau filtre
              setTimeout(() => {
                if (newValue === 'active') {
                  setFilters(prev => ({ ...prev, hideInactive: true }));
                  setActiveFilters(prev => [...prev, 'hideInactive']);
                } else if (newValue === 'inactive') {
                  setFilters(prev => ({ ...prev, showOnlyInactive: true }));
                  setActiveFilters(prev => [...prev, 'showOnlyInactive']);
                }
                // Pour 'all', on ne fait rien car on a déjà tout réinitialisé
              }, 0);
            }}
            size="small"
            color="primary"
            sx={{
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              '& .MuiToggleButtonGroup-grouped': {
                px: 3,
                py: 1
              }
            }}
          >
            <ToggleButton 
              value="active"
              sx={{
                fontWeight: activeFilters.includes('hideInactive') ? 'medium' : 'normal',
                transition: 'all 0.2s'
              }}
            >
              <VisibilityIcon sx={{ mr: 1, fontSize: '1rem' }} />
              Actives uniquement
            </ToggleButton>
            <ToggleButton 
              value="inactive"
              sx={{
                fontWeight: activeFilters.includes('showOnlyInactive') ? 'medium' : 'normal',
                transition: 'all 0.2s'
              }}
            >
              <VisibilityOffIcon sx={{ mr: 1, fontSize: '1rem' }} />
              Inactives uniquement
            </ToggleButton>
            <ToggleButton 
              value="all"
              sx={{
                fontWeight: !activeFilters.includes('hideInactive') && !activeFilters.includes('showOnlyInactive') ? 'medium' : 'normal',
                transition: 'all 0.2s'
              }}
            >
              <FilterAltIcon sx={{ mr: 1, fontSize: '1rem' }} />
              Toutes les corrections
            </ToggleButton>
          </ToggleButtonGroup>
          <Typography variant="overline" sx={{ mt: 1, display: 'block', color: theme => theme.palette.error.dark }}>
            {getActiveFilterText()}
          </Typography>
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
        <Box>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              Options d'export PDF
            </Typography>
              < ExportPDFComponentAllCorrections
                corrections={filteredCorrections}
                activities={activities}
                students={students}
                filterActivity={filterActivity}
                setFilterActivity={setFilterActivity}
                uniqueActivities={uniqueActivities}
                getActivityById={getActivityById}
                getStudentById={getStudentById}
                getAllClasses={async () => {
                  try {
                    const response = await fetch('/api/classes');
                    if (!response.ok) throw new Error('Erreur lors du chargement des classes');
                    return await response.json();
                  } catch (error) {
                    console.error('Erreur:', error);
                    enqueueSnackbar('Erreur lors du chargement des classes', { variant: 'error' });
                    return [];
                  }
                }}
              />
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
