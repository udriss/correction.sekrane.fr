'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Container, Paper, Typography, Box, Chip, Button, Menu, MenuItem, TextField, FormControl,
  InputLabel, Select, ListItemIcon, ListItemText, Divider, InputAdornment, SelectChangeEvent,
  Tabs, Tab, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
  ToggleButton, ToggleButtonGroup
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { useSnackbar } from 'notistack';
import { ActivityAutre } from '@/lib/types';
import { Student as BaseStudent } from '@/lib/types';

// Date management
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';

// Icons
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import DeleteIcon from '@mui/icons-material/Delete';
import SortIcon from '@mui/icons-material/Sort';
import GradeIcon from '@mui/icons-material/Grade';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CalendarIcon from '@mui/icons-material/CalendarToday';
import SearchIcon from '@mui/icons-material/Search';
import CheckIcon from '@mui/icons-material/Check';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { alpha, useTheme } from '@mui/material/styles';
import GradientBackground from '@/components/ui/GradientBackground';
import PatternBackground from '@/components/ui/PatternBackground';
import dayjs from 'dayjs';

// Custom hooks and providers
import { BatchDeleteProvider, useBatchDelete } from '@/hooks/useBatchDelete';
import CorrectionsAutresProvider, { useCorrectionsAutres } from '@/app/components/CorrectionsAutresDataProvider';

// Components
import CorrectionsListAutres from '@/components/allCorrectionsAutres/CorrectionsListAutres';
import ClassesListAutres from '@/components/allCorrectionsAutres/ClassesListAutres';
import StudentsListAutres from '@/components/allCorrectionsAutres/StudentsListAutres';
import ChronologyListAutres from '@/components/allCorrectionsAutres/ChronologyListAutres';
import ExportPDFComponentAllCorrectionsAutresContainer from '@/components/pdfAutre/ExportPDFComponentAllCorrectionsAutresContainer';
import { buildUrl } from '@/lib/utils/urlUtils';



export default function CorrectionsAutresPage() {
  const searchParams = useSearchParams();
  
  // Récupération des paramètres de date depuis l'URL
  const dateFromParam = searchParams?.get('dateFrom');
  const dateToParam = searchParams?.get('dateTo');
  
  const initialFilters = {
    search: searchParams?.get('search') || '',
    classId: searchParams?.get('classId') || '',
    studentId: searchParams?.get('studentId') || '',
    activityId: searchParams?.get('activityId') || '',
    recent: searchParams?.get('recent') === 'true',
    highlight: searchParams?.get('highlight') || '',
    correctionId: searchParams?.get('correctionId') || '',
    selectedCorrectionIds: searchParams?.get('selectedCorrectionIds') || '',
    subClassId: searchParams?.get('subClassId') || '',
    hideInactive: false,
    showOnlyInactive: false,
    dateFrom: searchParams?.get('dateFrom') || undefined,
    dateTo: searchParams?.get('dateTo') || undefined,
    minGrade: '',
    maxGrade: '',
  };

  const initialSort = {
    field: (searchParams?.get('sortBy') || 'submission_date') as 'submission_date' | 'grade' | 'student_name' | 'activity_name',
    direction: (searchParams?.get('sortDir') || 'desc') as 'asc' | 'desc'
  };
  
  return (
    <CorrectionsAutresProvider initialFilters={initialFilters} initialSort={initialSort}>
      <BatchDeleteProvider>
        <CorrectionsContent />
      </BatchDeleteProvider>
    </CorrectionsAutresProvider>
  );
}

function CorrectionsContent() {
  const theme = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { enqueueSnackbar } = useSnackbar();
  
  // States for UI elements
  const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  
  // Récupérer l'onglet à partir de l'URL lors du chargement initial
  const initialTabValue = searchParams?.get('tab') ? parseInt(searchParams.get('tab') || '0', 10) : 0;
  const [tabValue, setTabValue] = useState(initialTabValue);
  
  const [filterActivity, setFilterActivity] = useState<number | 'all'>('all');
  const [stickyButtons, setStickyButtons] = useState(false);

  const {
    corrections: filteredCorrections,
    metaData,
    sortOptions,
    setSortOptions,
    filters,
    setFilters,
    activeFilters,
    setActiveFilters,
    applyFilter,
    refreshCorrections,
    errorString,
    isLoading
  } = useCorrectionsAutres();

  const { 
    batchDeleteMode, 
    setBatchDeleteMode, 
    selectedCorrections, 
    setSelectedCorrections,
    deletingCorrections,
    setDeletingCorrection
  } = useBatchDelete();

  const error = errorString ? new Error(errorString) : null;

  // Functions to handle activities and students data
  const getActivityById = (activityId: number): ActivityAutre | undefined => {
    return metaData.activities.find((a: ActivityAutre) => a.id === activityId);
  };

  const getStudentById = (studentId: number | null): BaseStudent | undefined => {
    if (!studentId) return undefined;
    return metaData.students.find((s: BaseStudent) => s.id === studentId);
  };

  // Get card status color based on grade
  const getGradeColor = (grade: number): "success" | "info" | "primary" | "warning" | "error" => {
    if (grade >= 16) return 'success';
    if (grade >= 12) return 'info';
    if (grade >= 10) return 'primary';
    if (grade >= 8) return 'warning';
    return 'error';
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

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    const newParams = new URLSearchParams(searchParams?.toString());
    newParams.set('tab', newValue.toString());
    
    // Utilisation de la fonction utilitaire pour construire l'URL
    router.push(buildUrl('/corrections', newParams), { scroll: false });
  };

  // Handle date filter changes
  const handleDateChange = (dateType: 'dateFrom' | 'dateTo', date: dayjs.Dayjs | null) => {
    setFilters(prev => ({
      ...prev,
      [dateType]: date ? dayjs(date) : null
    }));
  };

  const handleSortSelect = (field: 'submission_date' | 'grade' | 'student_name' | 'activity_name') => {
    const newDirection = field === sortOptions.field && sortOptions.direction === 'desc' ? 'asc' : 'desc';
    
    setSortOptions({
      field,
      direction: newDirection
    });
    
    handleSortClose();
    
    const newParams = new URLSearchParams(searchParams?.toString());
    newParams.set('sortBy', field);
    newParams.set('sortDir', newDirection);
    
    // Utiliser la fonction utilitaire pour construire l'URL
    router.push(buildUrl('/corrections', newParams), { scroll: false });
  };

  // Function to handle batch deletion
  const handleBatchDelete = async () => {
    if (!selectedCorrections || selectedCorrections.length === 0) return;
    
    try {
      setConfirmDeleteOpen(false);
      
      let successCount = 0;
      let failCount = 0;
      const deletedIds: string[] = [];
      
      for (const correctionId of selectedCorrections) {
        try {
          setDeletingCorrection(correctionId, true);
          
          const response = await fetch(`/api/corrections_autres/${correctionId}`, {
            method: 'DELETE'
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
          setDeletingCorrection(correctionId, false);
        }
      }
      
      if (successCount > 0) {
        enqueueSnackbar(`${successCount} correction(s) supprimée(s) avec succès`, { 
          variant: 'success',
          autoHideDuration: 3000
        });
      }
      
      if (failCount > 0) {
        enqueueSnackbar(`Échec de la suppression de ${failCount} correction(s)`, { 
          variant: 'error',
          autoHideDuration: 5000
        });
      }
      
      setBatchDeleteMode(false);
      setSelectedCorrections([]);
      
      if (refreshCorrections) {
        await refreshCorrections();
      }
      
    } catch (error) {
      console.error('Error in batch delete operation:', error);
      enqueueSnackbar('Une erreur est survenue lors de la suppression', { 
        variant: 'error',
        autoHideDuration: 5000
      });
      
      selectedCorrections.forEach(id => setDeletingCorrection(id, false));
    }
  };

    // Function to cancel batch delete mode
    const handleCancelBatchDelete = () => {
      setBatchDeleteMode(false);
      setSelectedCorrections([]);
    };
    
  const getFilterLabel = (filter: string) => {
    switch (filter) {
      case 'search':
        return `Recherche: ${filters.search}`;
      case 'classId':
        return `Classe: ${metaData.classes.find((c: { id: number }) => c.id.toString() === filters.classId)?.name || 'Inconnue'}`;
      case 'activityId':
        return `Activité: ${metaData.activities.find((a: ActivityAutre) => a.id.toString() === filters.activityId)?.name || 'Inconnue'}`;
      case 'studentId':
        const student = metaData.students.find((s: BaseStudent) => s.id.toString() === filters.studentId);
        return `Étudiant: ${student ? `${student.last_name} ${student.first_name}` : 'Inconnu'}`;
      case 'recent':
        return 'Dernières 24h';
      case 'dateFrom':
        // Vérifier si la date est valide avant d'essayer de la formater
        return `Depuis: ${filters.dateFrom && dayjs(filters.dateFrom).isValid() 
          ? dayjs(filters.dateFrom).format('DD/MM/YYYY') 
          : searchParams?.get('dateFrom') || 'Date non spécifiée'}`;
      case 'dateTo':
        // Vérifier si la date est valide avant d'essayer de la formater
        return `Jusqu'au: ${filters.dateTo && dayjs(filters.dateTo).isValid() 
          ? dayjs(filters.dateTo).format('DD/MM/YYYY') 
          : searchParams?.get('dateTo') || 'Date non spécifiée'}`;
      case 'minGrade':
        return `Note min: ${filters.minGrade}`;
      case 'maxGrade':
        return `Note max: ${filters.maxGrade}`;
      case 'hideInactive':
        return 'Actives uniquement';
      case 'showOnlyInactive':
        return 'Inactives uniquement';
      case 'correctionId':
        return `ID: ${filters.correctionId}`;
      case 'subClassId':
        return `Sous-classe: ${filters.subClassId}`;
      case 'selectedCorrectionIds':
        return `IDs: ${filters.selectedCorrectionIds}`;
      case 'highlight':
        const highlightIds = searchParams?.get('highlight')?.split(',').filter(Boolean) || [];
        return `En surbrillance: ${highlightIds.join(', ')}`;
      default:
        return filter;
    }
  };
  

  // Convert CorrectionAutre to the format expected by components
  const adaptCorrections = useMemo(() => {
    return filteredCorrections.map(correction => {
      const activity = metaData.activities.find(a => a.id === correction.activity_id);
      const student = metaData.students.find(s => s.id === correction.student_id);
      const classInfo = metaData.classes.find(c => c.id === correction.class_id);
      // Calculate total points and grade
      const totalPoints = activity ? activity.points.reduce((sum, p) => sum + p, 0) : 20;
      const earnedPoints = correction.points_earned ? correction.points_earned.reduce((sum, p) => sum + p, 0) : 0;
      const calculatedGrade = (earnedPoints / totalPoints) * 20;

      return {
        ...correction,
        activity_name: activity?.name || 'Activité inconnue',
        student_name: student ? `${student.last_name} ${student.first_name}` : 'Étudiant inconnu',
        class_name: classInfo?.name || 'Classe inconnue',
        points_earned: correction.points_earned || [],
        grade: calculatedGrade,
        score_percentage: (calculatedGrade / 20) * 100,
        sub_class : student?.sub_class
      };
    });
  }, [filteredCorrections, metaData]);



  // Track scroll position
  useEffect(() => {
    const handleScroll = () => {
      // Determine if buttons should be sticky (when scrolled past 100px)
      const tabsElement = document.getElementById('correction-tabs-container');
      if (tabsElement) {
        const tabsRect = tabsElement.getBoundingClientRect();
        setStickyButtons(tabsRect.top < 100);
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fonction pour préserver les paramètres communs lors de la mise à jour de l'URL
  const preserveCommonParams = (newParams: URLSearchParams) => {
    // Préserver le paramètre tab s'il existe
    const currentTab = searchParams?.get('tab');
    if (currentTab) {
      newParams.set('tab', currentTab);
    }
    
    // Préserver les paramètres de tri s'ils existent
    const sortBy = searchParams?.get('sortBy');
    const sortDir = searchParams?.get('sortDir');
    if (sortBy) {
      newParams.set('sortBy', sortBy);
    }
    if (sortDir) {
      newParams.set('sortDir', sortDir);
    }
    
    return newParams;
  };
  
  // Fonction pour appliquer un filtre et mettre à jour l'URL
  const applyFilterAndUpdateURL = useCallback((filterName: string) => {
    // S'assurer que le filtre n'est ajouté qu'une seule fois en le supprimant d'abord s'il existe déjà
    setActiveFilters(prev => {
      // Supprimer le filtre s'il existe déjà
      const filtered = prev.filter(f => f !== filterName);
      // Puis l'ajouter à nouveau (une seule fois)
      return [...filtered, filterName];
    });
    
    // Mettre à jour l'URL avec la nouvelle valeur de filtre
    const newParams = new URLSearchParams(searchParams?.toString() || "");
    
    // Traitement spécifique selon le type de filtre
    switch (filterName) {
      case 'dateFrom':
      case 'dateTo':
        if (filters[filterName]) {
          // Format YYYY-MM-DD pour les dates
          newParams.set(filterName, filters[filterName].format('YYYY-MM-DD'));
        } else {
          // Si la date est null, supprimer le paramètre
          newParams.delete(filterName);
        }
        break;
      case 'hideInactive':
      case 'showOnlyInactive':
      case 'recent':
        // Pour les filtres booléens, nous utilisons 'true' comme valeur dans l'URL
        newParams.set(filterName, 'true');
        break;
      default:
        // Pour les filtres de type chaîne, vérifier que la valeur n'est pas vide
        if (typeof filters[filterName as keyof typeof filters] === 'string' && 
            filters[filterName as keyof typeof filters] !== '') {
          newParams.set(filterName, filters[filterName as keyof typeof filters] as string);
        } else {
          // Si la valeur est vide, supprimer le paramètre
          newParams.delete(filterName);
        }
    }
    
    // Conserver le paramètre tab et les paramètres de tri
    preserveCommonParams(newParams);
    
    // Mettre à jour l'URL sans rechargement de page en utilisant buildUrl
    router.push(buildUrl('/corrections', newParams), { scroll: false });
    
    // Ne pas appeler applyFilter du provider car nous avons déjà mis à jour activeFilters ci-dessus
    // applyFilter(filterName); <- Cette ligne est supprimée pour éviter la duplication
  }, [activeFilters, filters, router, searchParams, preserveCommonParams]);



  // Remplacement de la fonction removeFilter existante par une version améliorée
  const removeFilterAndUpdateURL = useCallback((filterName: string) => {
    // Supprimer le filtre du tableau des filtres actifs
    setActiveFilters(prev => prev.filter(f => f !== filterName));
    
    // Réinitialiser la valeur du filtre
    setFilters(prev => ({
      ...prev,
      [filterName]: typeof prev[filterName as keyof typeof prev] === 'boolean' ? false : 
                  typeof prev[filterName as keyof typeof prev] === 'string' ? '' : null
    }));
  
    // Mettre à jour l'URL pour refléter la suppression du filtre
    const newParams = new URLSearchParams(searchParams?.toString());
    newParams.delete(filterName); // Supprimer le paramètre de l'URL
    
    // Préserver les paramètres communs
    preserveCommonParams(newParams);
    
    // Mettre à jour l'URL sans rechargement de page
    router.push(buildUrl('/corrections', newParams), { scroll: false });
  }, [router, searchParams, setActiveFilters, setFilters]);

  // Fonction modifiée pour mettre à jour l'URL lors de la suppression de tous les filtres
  const clearAllFilters = useCallback(() => {
    // Réinitialiser les filtres dans l'état local
    setActiveFilters([]);
    setFilters({
      search: '',
      classId: '',
      studentId: '',
      activityId: '',
      dateFrom: null,
      dateTo: null,
      minGrade: '',
      maxGrade: '',
      correctionId: '',
      hideInactive: false,
      showOnlyInactive: false,
      subClassId: '',
      recent: false,
      selectedCorrectionIds: ''
    });
    
    // Mettre à jour l'URL en ne conservant que le paramètre tab et les paramètres de tri
    const newParams = new URLSearchParams();
    preserveCommonParams(newParams);
    
    // Mettre à jour l'URL sans rechargement de page
    router.push(buildUrl('/corrections', newParams), { scroll: false });
  }, [router, searchParams, setActiveFilters, setFilters]);

  // Fonction utilitaire pour construire les URL de manière cohérente
  const buildUrlWithParams = useCallback((newParams: URLSearchParams) => {
    // Utiliser notre fonction utilitaire pour construire l'URL sans encoder les paramètres
    return buildUrl('/corrections', newParams);
  }, []);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Paper elevation={3} sx={{ borderRadius: 3, overflow: 'hidden', mb: 4 }}>
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
                  <Typography variant='body1' color='text.secondary' sx={{ mt: 0.5 }}>
                    Gérez les corrections avec des points personnalisés par partie
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 1 }}>
                {/* Sort button */}
                <Button
                  variant="outlined"
                  onClick={handleSortClick}
                  startIcon={<SortIcon />}
                  sx={{
                    color: (theme) => theme.palette.secondary.dark,
                  }}
                >
                  Trier
                </Button>

                {/* Filter button */}
                <Button
                  variant="outlined"
                  onClick={handleFilterClick}
                  startIcon={<FilterAltIcon />}
                  sx={{
                    color: (theme) => theme.palette.secondary.dark,
                  }}
                >
                  Filtrer
                </Button>

                {/* Add new correction button */}
                <Button
                  variant="contained"
                  color="primary"
                  href="/corrections/new"
                >
                  Nouvelle correction
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
              </Box>
              </Box>


            {/* Active filters display */}
            {activeFilters.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                    {activeFilters.map((filter: string) => (
                      <Chip
                        key={filter}
                        label={getFilterLabel(filter)}
                        onDelete={() => removeFilterAndUpdateURL(filter)}
                        color="primary"
                        variant="outlined"
                        size="small"
                      />
                    ))}
                  </Box>
                  <Button
                    size="small"
                    onClick={clearAllFilters}
                    sx={{ ml: 'auto' }}
                  >
                    Effacer tous les filtres
                  </Button>
                </Box>
              </Box>
            )}
          </PatternBackground>
        </GradientBackground>

        {/* Stats summary */}
        <Box sx={{ p: 2 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm:6, md: 3 }}>
              <Paper sx={{ 
                p: 2, 
                textAlign: 'center',
                bgcolor: (theme) => alpha(theme.palette.myBoxes?.primary || '#f0f0f0', 0.5),
                backdropFilter: 'blur(5px)',
                borderRadius: 2,
              }}>
                <Typography variant="overline" color="text.secondary">Total</Typography>
                <Typography variant="h3" fontWeight="bold" color="text.primary">
                  {filteredCorrections.length}
                </Typography>
                <Typography variant="overline" color="text.secondary">
                  {filteredCorrections.length === 1 ? 'correction' : 'corrections'}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Tabs and content */}
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
          <Tab label="Toutes les corrections" />
          <Tab label="Par classe" />
          <Tab label="Par étudiant" />
          <Tab label="Chronologie" />
          <Tab label="Export PDF" />
        </Tabs>
        <Divider sx={{ my: 2 }} />

      </Box>


      {/* Filter toggle group for active/inactive corrections */}
      <Box sx={{ mb: 2 }}>
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
                  
                  // Utiliser applyFilterAndUpdateURL au lieu de simplement mettre à jour l'état
                  setTimeout(() => applyFilterAndUpdateURL('hideInactive'), 0);
                } else if (newValue === 'inactive') {
                  setFilters(prev => ({ ...prev, showOnlyInactive: true }));
                  
                  // Utiliser applyFilterAndUpdateURL au lieu de simplement mettre à jour l'état
                  setTimeout(() => applyFilterAndUpdateURL('showOnlyInactive'), 0);
                } else {
                  // Pour 'all', on a déjà tout réinitialisé, mais il faut aussi mettre à jour l'URL
                  const newParams = new URLSearchParams(searchParams?.toString());
                  newParams.delete('hideInactive');
                  newParams.delete('showOnlyInactive');
                  
                  // Préserver le paramètre tab s'il existe
                  const currentTab = searchParams?.get('tab');
                  if (currentTab) {
                    newParams.set('tab', currentTab);
                  }
                  
                  // Préserver les paramètres de tri s'ils existent
                  const sortBy = searchParams?.get('sortBy');
                  const sortDir = searchParams?.get('sortDir');
                  if (sortBy) {
                    newParams.set('sortBy', sortBy);
                  }
                  if (sortDir) {
                    newParams.set('sortDir', sortDir);
                  }
                  
                  // Mettre à jour l'URL sans rechargement de page
                  router.push(`/corrections?${newParams.toString()}`, { scroll: false });
                }
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
          <Typography variant="overline" sx={{ mt: 1, display: 'block', color: theme => theme.palette.secondary.dark }}>
            {activeFilters.includes('hideInactive')
              ? 'Affiche uniquement les corrections actives'
              : activeFilters.includes('showOnlyInactive')
                ? 'Affiche uniquement les corrections inactives'
                : 'Affiche toutes les corrections, y compris celles qui sont inactives'}
          </Typography>
        </FormControl>
      </Box>



        {/* Sticky Batch Delete Button Container */}
        {batchDeleteMode && (
        <Box 
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 1,
            position: stickyButtons ? 'fixed' : 'static',
            top: stickyButtons ? '100px' : 'auto', //
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
      {/* Content based on selected tab */}
      {tabValue === 0 && (
        <CorrectionsListAutres
          error={error}
          activeFilters={activeFilters}
          handleClearAllFilters={clearAllFilters}
          getGradeColor={getGradeColor}
          highlightedIds={searchParams?.get('highlight')?.split(',').filter(Boolean) || []}
          recentFilter={activeFilters.includes('recent')}
          refreshCorrections={refreshCorrections}
          getStudentById={getStudentById}
        />
      )}

      {tabValue === 1 && (
        <ClassesListAutres
          error={error}
          activeFilters={activeFilters}
          handleClearAllFilters={clearAllFilters}
          highlightedIds={searchParams?.get('highlight')?.split(',').filter(Boolean) || []}
          getGradeColor={getGradeColor}
          refreshCorrections={refreshCorrections}
          getStudentById={getStudentById}
        />
      )}

      {tabValue === 2 && (
        <StudentsListAutres
          error={error}
          activeFilters={activeFilters}
          handleClearAllFilters={clearAllFilters}
          getGradeColor={getGradeColor}
          highlightedIds={searchParams?.get('highlight')?.split(',').filter(Boolean) || []}
          recentFilter={activeFilters.includes('recent')}
          refreshCorrections={refreshCorrections}
          getStudentById={getStudentById}
        />
      )}

      {tabValue === 3 && (
        <ChronologyListAutres
          error={error}
          activeFilters={activeFilters}
          handleClearAllFilters={clearAllFilters}
          getGradeColor={getGradeColor}
          highlightedIds={searchParams?.get('highlight')?.split(',').filter(Boolean) || []}
          recentFilter={activeFilters.includes('recent')}
          getStudentById={getStudentById}
        />
      )}

      {tabValue === 4 && (
        <Box className="max-w-4xl" sx={{ 
          mx: 'auto',
          mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
          }}  >
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              Options d'export PDF
            </Typography>
            <ExportPDFComponentAllCorrectionsAutresContainer
              corrections={adaptCorrections}
              activities={metaData.activities}
              students={metaData.students}
              uniqueActivities={metaData.activities.map(a => ({ id: a.id, name: a.name }))}
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

      {/* Sort menu */}
      <Menu
        anchorEl={sortAnchorEl}
        open={Boolean(sortAnchorEl)}
        onClose={handleSortClose}
      >
        <MenuItem onClick={() => handleSortSelect('submission_date')}>
          <ListItemIcon>
            <CalendarIcon />
          </ListItemIcon>
          <ListItemText>Date</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleSortSelect('grade')}>
          <ListItemIcon>
            <GradeIcon />
          </ListItemIcon>
          <ListItemText>Note</ListItemText>
        </MenuItem>
      </Menu>

      {/* Filter menu - Updated with additional filters */}
      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={handleFilterClose}
        slotProps ={{
          paper: {
            sx: {
              width: 300,
              maxHeight: '80vh',
              p: 2
            }
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
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
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
            onClick={() => applyFilterAndUpdateURL('search')}
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
              onChange={(e: SelectChangeEvent) => {
                // Réinitialiser le filtre de sous-classe lorsqu'une autre classe est sélectionnée
                setFilters({ 
                  ...filters, 
                  classId: e.target.value,
                  subClassId: '' 
                });
              }}
              label="Classe"
            >
              <MenuItem value="">
                <em>Toutes les classes</em>
              </MenuItem>
              {metaData.classes.map((c: { id: number; name: string }) => (
                <MenuItem key={c.id} value={c.id.toString()}>{c.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button 
            variant="text" 
            size="small" 
            onClick={() => applyFilterAndUpdateURL('classId')}
            disabled={!filters.classId}
            sx={{ mt: 0.5 }}
          >
            Appliquer
          </Button>
        </Box>
        
        {/* Sous-classe filtrage - affiché uniquement quand une classe est sélectionnée */}
        {filters.classId && (
          <Box sx={{ mb: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Sous-classe</InputLabel>
              <Select
                name="subClassId"
                value={filters.subClassId}
                onChange={(e) => setFilters({ ...filters, subClassId: e.target.value })}
                label="Sous-classe"
              >
                <MenuItem value="">
                  <em>Toutes les sous-classes</em>
                </MenuItem>
                {/* Récupère uniquement les étudiants de la classe sélectionnée */}
                {metaData.students
                  .filter(s => s.classId?.toString() === filters.classId && s.sub_class)
                  // Crée un ensemble unique de sous-classes
                  .reduce((unique, student) => {
                    if (student.sub_class && !unique.some(item => item.id === student.sub_class)) {
                      unique.push({ id: student.sub_class, name: student.sub_class });
                    }
                    return unique;
                  }, [] as { id: string | number; name: string | number }[])
                  .sort((a, b) => a.name.toString().localeCompare(b.name.toString()))
                  .map(subClass => (
                    <MenuItem key={subClass.id} value={subClass.id.toString()}>
                      {subClass.name}
                    </MenuItem>
                  ))
                }
              </Select>
            </FormControl>
            <Button 
              variant="text" 
              size="small" 
              onClick={() => applyFilterAndUpdateURL('subClassId')}
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
              onChange={(e) => setFilters({ ...filters, studentId: e.target.value })}
              label="Étudiant"
            >
              <MenuItem value="">
                <em>Tous les étudiants</em>
              </MenuItem>
              {metaData.students.map((s: BaseStudent) => (
                <MenuItem key={s.id} value={s.id.toString()}>
                  {s.last_name} {s.first_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button 
            variant="text" 
            size="small" 
            onClick={() => applyFilterAndUpdateURL('studentId')}
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
              onChange={(e) => setFilters({ ...filters, activityId: e.target.value })}
              label="Activité"
            >
              <MenuItem value="">
                <em>Toutes les activités</em>
              </MenuItem>
              {metaData.activities.map((a: ActivityAutre) => (
                <MenuItem key={a.id} value={a.id.toString()}>{a.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button 
            variant="text" 
            size="small" 
            onClick={() => applyFilterAndUpdateURL('activityId')}
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
                key="dateFromPicker"
                label="Date début"
                value={filters.dateFrom ? dayjs(filters.dateFrom) : null}
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
                onClick={() => applyFilterAndUpdateURL('dateFrom')}
                disabled={!filters.dateFrom}
              >
                <CheckIcon fontSize="small" />
              </Button>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <DatePicker
                key="dateToPicker"
                label="Date fin"
                value={filters.dateTo ? dayjs(filters.dateTo) : null}
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
                onClick={() => applyFilterAndUpdateURL('dateTo')}
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
              onChange={(e) => setFilters({ ...filters, minGrade: e.target.value })}
              slotProps={{
                input: {
                  inputProps: { min: 0, step: 0.5 },
                }
              }}
            />
            <Button 
              variant="text" 
              size="small" 
              onClick={() => applyFilterAndUpdateURL('minGrade')}
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
              onChange={(e) => setFilters({ ...filters, maxGrade: e.target.value })}
              slotProps={{
                input: {
                  inputProps: { min: 0, step: 0.5 },
                }
              }}
            />
            <Button 
              variant="text" 
              size="small" 
              onClick={() => applyFilterAndUpdateURL('maxGrade')}
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
            onChange={(e) => setFilters({ ...filters, correctionId: e.target.value })}
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
            onClick={() => applyFilterAndUpdateURL('correctionId')}
            disabled={!filters.correctionId}
            sx={{ mt: 0.5 }}
          >
            Appliquer
          </Button>
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <TextField
            name="selectedCorrectionIds"
            label="Plusieurs IDs de correction (séparés par des virgules)"
            fullWidth
            size="small"
            value={filters.selectedCorrectionIds}
            onChange={(e) => {
                // Mettre à jour le filtre localement
                setFilters({ ...filters, selectedCorrectionIds: e.target.value });
                
                // Mettre à jour l'URL
                const newParams = new URLSearchParams(searchParams?.toString());
                
                // Ajouter ou supprimer le paramètre en fonction de sa valeur
                if (e.target.value) {
                  newParams.set('selectedCorrectionIds', e.target.value);
                } else {
                  newParams.delete('selectedCorrectionIds');
                }
                
                // Préserver le paramètre tab et les paramètres de tri
                const currentTab = searchParams?.get('tab');
                if (currentTab) {
                  newParams.set('tab', currentTab);
                }
                
                const sortBy = searchParams?.get('sortBy');
                const sortDir = searchParams?.get('sortDir');
                if (sortBy) {
                  newParams.set('sortBy', sortBy);
                }
                if (sortDir) {
                  newParams.set('sortDir', sortDir);
                }
                
                // Gérer les filtres actifs
                if (e.target.value && !activeFilters.includes('selectedCorrectionIds')) {
                  setActiveFilters(prev => [...prev, 'selectedCorrectionIds']);
                }
                else if (!e.target.value && activeFilters.includes('selectedCorrectionIds')) {
                  setActiveFilters(prev => prev.filter(f => f !== 'selectedCorrectionIds'));
                }
                
                // Utiliser la fonction utilitaire pour construire l'URL
                router.push(buildUrl('/corrections', newParams), { scroll: false });
              }}
            placeholder="Ex: 603, 605, 607"
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
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <Button
            fullWidth
            variant="outlined"
            sx={{ color: theme => theme.palette.text.primary, 
              bgcolor: theme => alpha(theme.palette.secondary.main, 0.1),
              borderColor: theme => theme.palette.secondary.dark }}
            onClick={() => applyFilterAndUpdateURL('recent')}
            startIcon={<CalendarIcon />}
          >
            Corrections des dernières 24h
          </Button>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Button variant="text" onClick={clearAllFilters}>
            Tout effacer
          </Button>
          <Button variant="contained" onClick={handleFilterClose}>
            Fermer
          </Button>
        </Box>
      </Menu>

      {/* Confirm delete dialog - fixed syntax */}
      <Dialog 
        open={confirmDeleteOpen} 
        onClose={() => setConfirmDeleteOpen(false)}
      >
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {selectedCorrections.length === 1 
              ? "Vous êtes sur le point de supprimer 1 correction. " 
              : `Vous êtes sur le point de supprimer ${selectedCorrections.length} corrections. `}
            Cette action est irréversible. Voulez-vous continuer ?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteOpen(false)}>Annuler</Button>
          <Button onClick={handleBatchDelete} color="error" variant="contained">
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}