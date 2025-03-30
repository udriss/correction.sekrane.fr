'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Container, Paper, Typography, Box, Chip, Button, 
  IconButton, Menu, MenuItem, TextField, FormControl,
  InputLabel, Select, Badge, Divider, ListItemIcon, ListItemText,
  SelectChangeEvent, InputAdornment, Tabs, Tab, 
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import Grid from '@mui/material/Grid';

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
import CancelIcon from '@mui/icons-material/Cancel';
import dayjs from 'dayjs';
import LoadingSpinner from '@/components/LoadingSpinner';
import GradientBackground from '@/components/ui/GradientBackground';
import PatternBackground from '@/components/ui/PatternBackground';
import H1Title from '@/components/ui/H1Title';
import Link from 'next/link';
import CorrectionsProvider, { useCorrections } from '@/app/components/CorrectionsDataProvider';
import CorrectionsList from '@/components/allCorrections/CorrectionsList';
import ClassesList from '@/components/allCorrections/ClassesList';
import StudentsList from '@/components/allCorrections/StudentsList';
import ChronologyList from '@/components/allCorrections/ChronologyList';
import HomeIcon from '@mui/icons-material/Home';


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
  };
  
  const initialSort = {
    field: (searchParams?.get('sortBy') || 'submission_date') as 'submission_date' | 'grade' | 'student_name' | 'activity_name' | 'class_name',
    direction: (searchParams?.get('sortDir') || 'desc') as 'asc' | 'desc'
  };
  
  return (
    <CorrectionsProvider initialFilters={initialFilters} initialSort={initialSort}>
      <CorrectionsContent />
    </CorrectionsProvider>
  );
}

// Composant qui affiche le contenu
function CorrectionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
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
    clearAllFilters
  } = useCorrections();
  
  // State pour la gestion des menus
  const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [tabValue, setTabValue] = useState(0);
  
  // Gérer l'initialisation des filtres actifs à partir de l'URL
  useEffect(() => {
    const newActiveFilters: string[] = [];
    if (searchParams?.get('search')) newActiveFilters.push('search');
    if (searchParams?.get('classId')) newActiveFilters.push('classId');
    if (searchParams?.get('studentId')) newActiveFilters.push('studentId');
    if (searchParams?.get('activityId')) newActiveFilters.push('activityId');
    
    setActiveFilters(newActiveFilters);
  }, [searchParams, setActiveFilters]);
  
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
    
    // Update URL for certain filters
    if (['classId', 'studentId', 'activityId', 'search'].includes(filterName)) {
      updateQueryParams({ [filterName]: filters[filterName as keyof typeof filters] as string });
    }
  };
  
  // Remove filter and update URL
  const handleRemoveFilter = (filterName: string) => {
    removeFilter(filterName);
    
    // Remove from URL
    if (['classId', 'studentId', 'activityId', 'search'].includes(filterName)) {
      const newParams = new URLSearchParams(searchParams?.toString());
      newParams.delete(filterName);
      router.push(`/corrections?${newParams.toString()}`);
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
  
  // Handle tab change
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Define the Activity type
  interface Activity {
    id: number;
    name: string;
    experimental_points?: number | null;
    theoretical_points?: number | null;
  }
  
  // Get card status color based on grade
  const getGradeColor = (grade: number) => {
    if (grade >= 16) return 'success';
    if (grade >= 12) return 'info';
    if (grade >= 10) return 'primary';
    if (grade >= 8) return 'warning';
    return 'error';
  };

  
  
  if (loading && !filteredCorrections.length) {
    return (
      <Container sx={{ py: 4 }}>
        <Box className='max-w-[400px]' sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
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
                <AssignmentIcon sx={{ fontSize: 36, color: (theme) => theme.palette.text.primary }} />
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
          <Box sx={{ bgcolor: 'background.paper', p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2" sx={{ mr: 2 }}>Filtres actifs :</Typography>
              <Button 
                size="small" 
                onClick={handleClearAllFilters}
                startIcon={<CloseIcon />}
                sx={{ ml: 'auto' }}
              >
                Tout effacer
              </Button>
            </Box>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {activeFilters.includes('search') && (
                <Chip 
                  label={`Recherche: ${filters.search}`} 
                  onDelete={() => handleRemoveFilter('search')}
                  color="primary"
                  variant="filled"
                />
              )}
              
              {activeFilters.includes('classId') && (
                <Chip 
                  icon={<SchoolIcon />}
                  label={`Classe: ${metaData.classes.find(c => c.id.toString() === filters.classId)?.name || 'Inconnue'}`}
                  onDelete={() => handleRemoveFilter('classId')}
                  color="primary"
                  variant="filled"
                />
              )}
              
              {activeFilters.includes('studentId') && (
                <Chip 
                  icon={<PersonIcon />}
                  label={`Étudiant: ${metaData.students.find(s => s.id.toString() === filters.studentId)?.name || 'Inconnu'}`}
                  onDelete={() => handleRemoveFilter('studentId')}
                  color="primary"
                  variant="filled"
                />
              )}
              
              {activeFilters.includes('activityId') && (
                <Chip 
                  icon={<AssignmentIcon />}
                  label={`Activité: ${metaData.activities.find(a => a.id.toString() === filters.activityId)?.name || 'Inconnue'}`}
                  onDelete={() => handleRemoveFilter('activityId')}
                  color="primary"
                  variant="filled"
                />
              )}
              
              {activeFilters.includes('dateFrom') && (
                <Chip 
                  icon={<CalendarIcon />}
                  label={`Depuis: ${dayjs(filters.dateFrom).format('DD/MM/YYYY')}`}
                  onDelete={() => handleRemoveFilter('dateFrom')}
                  color="primary"
                  variant="filled"
                />
              )}
              
              {activeFilters.includes('dateTo') && (
                <Chip 
                  icon={<CalendarIcon />}
                  label={`Jusqu'à: ${dayjs(filters.dateTo).format('DD/MM/YYYY')}`}
                  onDelete={() => handleRemoveFilter('dateTo')}
                  color="primary"
                  variant="filled"
                />
              )}
              
              {activeFilters.includes('minGrade') && (
                <Chip 
                  icon={<GradeIcon />}
                  label={`Note min: ${filters.minGrade}`}
                  onDelete={() => handleRemoveFilter('minGrade')}
                  color="primary"
                  variant="filled"
                />
              )}
              
              {activeFilters.includes('maxGrade') && (
                <Chip 
                  icon={<GradeIcon />}
                  label={`Note max: ${filters.maxGrade}`}
                  onDelete={() => handleRemoveFilter('maxGrade')}
                  color="primary"
                  variant="filled"
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
      <Box sx={{ 
        mb: 3, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: 1,
        borderColor: 'divider' 
      }}>
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
        </Tabs>
        
        {/* Boutons de filtre et tri */}
        <Box sx={{ 
          display: 'flex', 
          gap: 1,
          ml: 2,
          flexShrink: 0 // Empêche les boutons de se rétrécir
        }}>
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
        </Box>
      </Box>
      
      {/* Content based on selected tab */}
      {tabValue === 0 && (
        <CorrectionsList
          filteredCorrections={filteredCorrections}
          error={error}
          activeFilters={activeFilters}
          handleClearAllFilters={handleClearAllFilters}
          getGradeColor={getGradeColor}
        />
      )}
      
      {tabValue === 1 && (
        <ClassesList
          filteredCorrections={filteredCorrections}
          error={error}
          activeFilters={activeFilters}
          handleClearAllFilters={handleClearAllFilters}
          getGradeColor={getGradeColor}
        />
      )}
      
      {tabValue === 2 && (
        <StudentsList
          filteredCorrections={filteredCorrections}
          error={error}
          activeFilters={activeFilters}
          handleClearAllFilters={handleClearAllFilters}
          getGradeColor={getGradeColor}
        />
      )}
      
      {tabValue === 3 && (
        <ChronologyList
          filteredCorrections={filteredCorrections}
          error={error}
          activeFilters={activeFilters}
          handleClearAllFilters={handleClearAllFilters}
          getGradeColor={getGradeColor}
        />
      )}
      
      {/* Sort Menu */}
      <Menu
        anchorEl={sortAnchorEl}
        open={Boolean(sortAnchorEl)}
        onClose={handleSortClose}
        PaperProps={{
          elevation: 3,
          sx: {
            minWidth: 200,
            '& .MuiMenuItem-root': { py: 1.5 }
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
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
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
              InputProps={{ inputProps: { min: 0, max: 20, step: 0.5 } }}
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
              InputProps={{ inputProps: { min: 0, max: 20, step: 0.5 } }}
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
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Button variant="text" onClick={handleClearAllFilters}>
            Tout effacer
          </Button>
          <Button variant="contained" onClick={handleFilterClose}>
            Fermer
          </Button>
        </Box>
      </Menu>
    </Container>
  );
}
