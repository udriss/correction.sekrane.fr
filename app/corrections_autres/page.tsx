'use client';

import React, { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Container, Paper, Typography, Box, Chip, Button, Menu, MenuItem, TextField, FormControl,
  InputLabel, Select, ListItemIcon, ListItemText,
   Tabs, Tab, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { useSnackbar } from 'notistack';
import { ActivityAutre } from '@/lib/types';
import { Student as BaseStudent } from '@/lib/types';


// Icons
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import SortIcon from '@mui/icons-material/Sort';
import GradeIcon from '@mui/icons-material/Grade';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CalendarIcon from '@mui/icons-material/CalendarToday';
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
import ExportPDFComponentAllCorrectionsAutres from '@/components/pdf/ExportPDFComponentAllCorrectionsAutres';



export default function CorrectionsAutresPage() {
  const searchParams = useSearchParams();
  
  const initialFilters = {
    search: searchParams?.get('search') || '',
    classId: searchParams?.get('classId') || '',
    studentId: searchParams?.get('studentId') || '',
    activityId: searchParams?.get('activityId') || '',
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
  const [tabValue, setTabValue] = useState(0);
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
    removeFilter,
    clearAllFilters,
    refreshCorrections,
    errorString
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
    router.push(`/corrections_autres?${newParams.toString()}`);
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
    router.push(`/corrections_autres?${newParams.toString()}`);
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
        return `Depuis: ${dayjs(filters.dateFrom).format('DD/MM/YYYY')}`;
      case 'dateTo':
        return `Jusqu'au: ${dayjs(filters.dateTo).format('DD/MM/YYYY')}`;
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
        experimental_points_earned: earnedPoints,
        theoretical_points_earned: 0,
        grade: calculatedGrade,
        score_percentage: (calculatedGrade / 20) * 100,
      };
    });
  }, [filteredCorrections, metaData]);

  

  
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
                  <Typography variant='h4' fontWeight={700} color='text.primary'>Corrections avec barème dynamique</Typography>
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
                  color="inherit"
                >
                  Trier
                </Button>

                {/* Filter button */}
                <Button
                  variant="outlined"
                  onClick={handleFilterClick}
                  startIcon={<FilterAltIcon />}
                  color="inherit"
                >
                  Filtrer
                </Button>

                {/* Add new correction button */}
                <Button
                  variant="contained"
                  color="primary"
                  href="/corrections_autres/new"
                >
                  Nouvelle correction
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
                        onDelete={() => removeFilter(filter)}
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
                bgcolor: (theme) => alpha(theme.palette.myBoxes.primary, 0.5),
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
      <Box sx={{ mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Toutes les corrections" />
          <Tab label="Par classe" />
          <Tab label="Par étudiant" />
          <Tab label="Chronologie" />
          <Tab label="Export PDF" />
        </Tabs>
      </Box>

      {/* Content based on selected tab */}
      {tabValue === 0 && (
        <CorrectionsListAutres
          filteredCorrections={adaptCorrections}
          error={error}
          activeFilters={activeFilters}
          handleClearAllFilters={clearAllFilters}
          getGradeColor={getGradeColor}
          highlightedIds={searchParams?.get('highlight')?.split(',').filter(Boolean) || []}
          recentFilter={activeFilters.includes('recent')}
          refreshCorrections={refreshCorrections}
        />
      )}

      {tabValue === 1 && (
        <ClassesListAutres
          filteredCorrections={adaptCorrections}
          error={error}
          activeFilters={activeFilters}
          handleClearAllFilters={clearAllFilters}
          highlightedIds={searchParams?.get('highlight')?.split(',').filter(Boolean) || []}
          getGradeColor={getGradeColor}
          refreshCorrections={refreshCorrections}
        />
      )}

      {tabValue === 2 && (
        <StudentsListAutres
          filteredCorrections={adaptCorrections}
          error={error}
          activeFilters={activeFilters}
          handleClearAllFilters={clearAllFilters}
          getGradeColor={getGradeColor}
          highlightedIds={searchParams?.get('highlight')?.split(',').filter(Boolean) || []}
          recentFilter={activeFilters.includes('recent')}
          refreshCorrections={refreshCorrections}
        />
      )}

      {tabValue === 3 && (
        <ChronologyListAutres
          filteredCorrections={adaptCorrections}
          error={error}
          activeFilters={activeFilters}
          handleClearAllFilters={clearAllFilters}
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
            <ExportPDFComponentAllCorrectionsAutres
              corrections={adaptCorrections}
              activities={metaData.activities}
              students={metaData.students}
              filterActivity={filterActivity}
              setFilterActivity={setFilterActivity}
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

      {/* Filter menu */}
      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={handleFilterClose}
      >
        <MenuItem>
          <FormControl fullWidth>
            <TextField
              label="Recherche"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              size="small"
            />
          </FormControl>
        </MenuItem>
        <MenuItem>
          <FormControl fullWidth>
            <InputLabel>Classe</InputLabel>
            <Select
              value={filters.classId}
              onChange={(e) => setFilters({ ...filters, classId: e.target.value })}
              label="Classe"
            >
              <MenuItem value="">Toutes les classes</MenuItem>
              {metaData.classes.map((c: { id: number; name: string }) => (
                <MenuItem key={c.id} value={c.id.toString()}>{c.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </MenuItem>
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