'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Container, 
  Typography, 
  Paper, 
  Box, 
  Tabs, 
  Tab, 
  Grid, 
  Card, 
  CardContent,
  CircularProgress,
  Alert,
  Divider,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  SelectChangeEvent,
  Badge,
  Menu,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControlLabel,
  Switch,
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import PeopleIcon from '@mui/icons-material/People';
import TimelineIcon from '@mui/icons-material/Timeline';
import EqualizerIcon from '@mui/icons-material/Equalizer';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import CloseIcon from '@mui/icons-material/Close';
import { useRouter, useSearchParams } from 'next/navigation';
import GradientBackground from '@/components/ui/GradientBackground';
import PatternBackground from '@/components/ui/PatternBackground';
import ClassesBreadcrumbs from '@/components/ui/ClassesBreadcrumbs';
import ActivitiesBreadcrumbs from '@/components/ui/ActivitiesBreadcrumbs';

// Import des composants de graphiques
import dynamic from 'next/dynamic';

// Charger les composants de graphiques de manière dynamique pour éviter les erreurs SSR
const GradeDistributionChart = dynamic(() => import('@/components/stats/GradeDistributionChart'), { ssr: false });
const ActivityComparisonChart = dynamic(() => import('@/components/stats/ActivityComparisonChart'), { ssr: false });
const GradeEvolutionChart = dynamic(() => import('@/components/stats/GradeEvolutionChart'), { ssr: false });
const ClassComparisonChart = dynamic(() => import('@/components/stats/ClassComparisonChart'), { ssr: false });
const TopActivitiesChart = dynamic(() => import('@/components/stats/TopActivitiesChart'), { ssr: false });

// Interface pour les stats
interface StatsData {
  globalStats: {
    total_corrections: number;
    average_grade: number;
    highest_grade: number;
    lowest_grade: number;
    total_students: number;
    total_activities: number;
    average_percentage: number; // Pourcentage moyen de réussite normalisé
  };
  gradeDistribution: Array<{
    grade_range: string;
    count: number;
  }>;
  partPercentages: Array<{
    name: string;
    percentage: number;
    count: number;
  }>;
  activityStats: Array<{
    activity_id: number;
    activity_name: string;
    correction_count: number;
    average_grade: number;
    highest_grade: number;
    lowest_grade: number;
    average_percentage: number; // Pourcentage moyen de réussite
    points: number[]; // Maximum possible points per part
    parts_names: string[]; // Names of the parts
  }>;
  classStats: Array<{
    class_id: number;
    class_name: string;
    correction_count: number;
    student_count: number;
    average_grade: number;
  }>;
  gradeEvolution: Array<{
    month: string;
    percentage: number; // Pourcentage de réussite au lieu de average_grade
    correction_count: number;
    average_grade: number; // Ajout pour compatibilité avec GradeEvolutionChart
  }>;
  topActivities: Array<{
    activity_id: number;
    activity_name: string;
    correction_count: number;
    average_percentage: number; // Pourcentage de réussite au lieu de average_grade
    average_grade: number; // Ajout pour compatibilité avec TopActivitiesChart
    points?: number[]; // Maximum possible points per part
    parts_names?: string[]; // Names of the parts
  }>;
  inactiveCount: number; // Nombre de corrections inactives
  metaData?: {
    classes: Array<{id: number, name: string}>;
    activities: Array<{id: number, name: string}>;
    subClasses?: Array<{id: number, name: string}>; // This will now be dynamically generated
    students?: Array<{id: number, name: string}>; // Add students to metaData
    showInactive?: boolean; // Option pour afficher les corrections inactives
  };
}

// Enum pour les onglets
enum TabValue {
  Overview = 0,
  Activities = 1,
  Classes = 2,
  Trends = 3
}

// Interface pour les filtres
interface FiltersState {
  classId: string;
  subClassId: string; // Ajout du filtre de sous-classe
  activityId: string;
  studentId: string;
  showInactive: boolean; // Nouvel état pour les corrections inactives
}

export default function StatsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Récupération du tab actif depuis l'URL et conversion en valeur numérique
  const tabFromUrl = searchParams?.get('tab');
  const initialTab = tabFromUrl ? parseInt(tabFromUrl, 10) : TabValue.Overview;
  const [tabValue, setTabValue] = useState<TabValue>(initialTab);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Références pour stocker l'état des filtres et les paramètres de requête API
  const currentApiParams = useRef<string>('');
  const dataFetched = useRef<boolean>(false);
  
  // États pour les filtres
  const [filters, setFilters] = useState<FiltersState>({
    classId: searchParams?.get('classId') || '',
    subClassId: searchParams?.get('subClassId') || '', // Ajout du filtre de sous-classe
    activityId: searchParams?.get('activityId') || '',
    studentId: searchParams?.get('studentId') || '',
    showInactive: searchParams?.get('showInactive') === 'true' || false, // Initialiser showInactive
  });
  
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [students, setStudents] = useState<Array<{id: number, name: string}>>([]);

  // Fonction utilitaire pour formatter les nombres avec sécurité
  const formatNumber = (value: any, decimals: number = 2): string => {
    if (value === undefined || value === null || isNaN(Number(value))) {
      return "N/A";
    }
    return Number(value).toFixed(decimals);
  };
  
  // Initialiser les filtres actifs à partir de l'URL
  useEffect(() => {
    const newActiveFilters: string[] = [];
    if (searchParams?.get('classId')) newActiveFilters.push('classId');
    if (searchParams?.get('subClassId')) newActiveFilters.push('subClassId'); // Ajout du filtre de sous-classe
    if (searchParams?.get('activityId')) newActiveFilters.push('activityId');
    if (searchParams?.get('studentId')) newActiveFilters.push('studentId');
    if (searchParams?.get('showInactive') === 'true') newActiveFilters.push('showInactive'); // Ajouter showInactive aux filtres actifs
    
    setActiveFilters(newActiveFilters);
    
    // On va utiliser fetchData pour charger toutes les données, y compris les étudiants
    fetchData();
  }, [searchParams]);
  
  // Gestion du menu de filtres
  const handleFilterClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };
  
  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };
  
  // Gestion des changements de filtres
  const handleFilterChange = (event: SelectChangeEvent<string>) => {
    const name = event.target.name as keyof FiltersState;
    const value = event.target.value;
    
    setFilters(prev => ({
      ...prev,
      [name]: value,
      // Réinitialiser studentId si classId ou subClassId change
      ...(name === 'classId' ? { studentId: '', subClassId: '' } : {}),
      ...(name === 'subClassId' ? { studentId: '' } : {})
    }));
    
    // Si on change de classe ou de sous-classe, charger les données correspondantes
    if ((name === 'classId' && value) || (name === 'subClassId' && value && filters.classId)) {
      // On va chercher les données via l'API stats
      const queryParams = new URLSearchParams();
      if (name === 'classId') {
        queryParams.set('classId', value);
      } else {
        queryParams.set('classId', filters.classId);
        queryParams.set('subClassId', value);
      }
      
      // Chargement asynchrone des données pour le menu de filtres
      fetch(`/api/stats?${queryParams.toString()}`)
        .then(response => {
          if (!response.ok) throw new Error('Erreur lors du chargement des données');
          return response.json();
        })
        .then(data => {
          if (data.metaData?.students) {
            setStudents(data.metaData.students);
          }
        })
        .catch(err => {
          console.error('Erreur:', err);
          setError("Erreur lors du chargement des données");
        });
    }
  };
  
  // Appliquer un filtre
  const applyFilter = (filterName: string) => {
    if (!filters[filterName as keyof FiltersState]) {
      return;
    }
    
    if (!activeFilters.includes(filterName)) {
      setActiveFilters([...activeFilters, filterName]);
    }
    
    // Mise à jour de l'URL
    const newParams = new URLSearchParams(searchParams?.toString());
    
    // Gérer correctement la conversion du type booléen en string
    if (filterName === 'showInactive') {
      newParams.set(filterName, String(filters.showInactive));
    } else {
      // Pour les autres valeurs qui sont déjà des strings
      newParams.set(filterName, filters[filterName as keyof FiltersState] as string);
    }
    
    router.push(`/stats?${newParams.toString()}`);
    
    // Ne pas fermer le menu si une classe est sélectionnée pour permettre la sélection de sous-classe
    if (filterName === 'classId') {
      // Recharger les données avec les nouveaux filtres mais garder le menu ouvert
      fetchData();
    } else {
      // Fermer le menu seulement si ce n'est pas un filtre de classe
      handleFilterClose();
      // Recharger les données avec les nouveaux filtres
      fetchData();
    }
  };
  
  // Supprimer un filtre
  const removeFilter = (filterName: string) => {
    setActiveFilters(activeFilters.filter(f => f !== filterName));
    
    setFilters(prev => ({
      ...prev,
      [filterName]: '',
      // Réinitialiser les filtres dépendants
      ...(filterName === 'classId' ? { studentId: '', subClassId: '' } : {}),
      ...(filterName === 'subClassId' ? { studentId: '' } : {})
    }));
    
    // Mise à jour de l'URL
    const newParams = new URLSearchParams(searchParams?.toString());
    newParams.delete(filterName);
    
    // Supprimer les filtres dépendants de l'URL
    if (filterName === 'classId') {
      newParams.delete('studentId');
      newParams.delete('subClassId');
    }
    if (filterName === 'subClassId') {
      newParams.delete('studentId');
    }
    
    router.push(`/stats?${newParams.toString()}`);
    
    // Recharger les données sans ce filtre
    fetchData();
  };
  
  // Effacer tous les filtres
  const clearAllFilters = () => {
    setActiveFilters([]);
    setFilters({
      classId: '',
      subClassId: '',
      activityId: '',
      studentId: '',
      showInactive: false, // Réinitialiser showInactive
    });
    
    // Mise à jour de l'URL
    router.push('/stats');
    
    // Recharger les données sans filtres
    fetchData();
  };
  
  // Chargement des données avec gestion des filtres
  const fetchData = async () => {
    try {
      // Construire l'URL avec les filtres actifs
      let url = '/api/stats';
      const queryParams = new URLSearchParams();
      
      if (filters.classId) queryParams.append('classId', filters.classId);
      if (filters.subClassId) queryParams.append('subClassId', filters.subClassId);
      if (filters.activityId) queryParams.append('activityId', filters.activityId);
      if (filters.studentId) queryParams.append('studentId', filters.studentId);
      if (filters.showInactive) queryParams.append('showInactive', 'true');
      
      const queryString = queryParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
      
      // Vérifier si les paramètres de requête ont changé depuis le dernier appel
      // Si ce sont les mêmes paramètres et que nous avons déjà des données, pas besoin de recharger
      if (url === currentApiParams.current && stats !== null && dataFetched.current) {
        
        return;
      }
      
      // Mettre à jour les paramètres actuels et indiquer qu'un chargement est en cours
      currentApiParams.current = url;
      setLoading(true);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error('Erreur lors du chargement des statistiques : '+data.error);
      }
      
      const data = await response.json();
      setStats(data);
      
      // Marquer que les données ont été chargées avec succès
      dataFetched.current = true;
      
      // Mettre à jour la liste des étudiants si disponible
      if (data.metaData?.students) {
        setStudents(data.metaData.students);
      }
      
    } catch (err) {
      console.error('Erreur:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      // En cas d'erreur, réinitialiser pour permettre une nouvelle tentative
      dataFetched.current = false;
    } finally {
      setLoading(false);
    }
  };
  
  // Chargement initial des données - une seule fois au montage du composant
  useEffect(() => {
    fetchData();
  }, []); // Dépendances vides pour n'exécuter qu'une seule fois

  const handleTabChange = (event: React.SyntheticEvent, newValue: TabValue) => {
    setTabValue(newValue);
    
    // Mise à jour de l'URL sans déclencher de navigation
    const newParams = new URLSearchParams(searchParams?.toString());
    newParams.set('tab', newValue.toString());
    
    // Mettre à jour l'URL sans déclencher de rechargement
    window.history.pushState({}, '', `/stats?${newParams.toString()}`);
  };

  if (loading && !stats) {
    return (
      <Container maxWidth="lg" className="py-8">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
          <Typography variant="h6" sx={{ ml: 2 }}>
            Chargement des statistiques...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error && !stats) {
    return (
      <Container maxWidth="lg" className="py-8">
        <Alert severity="error">
          {error}
        </Alert>
      </Container>
    );
  }

  
  return (
    <Container maxWidth="lg" className="py-8">

      {/* Header avec un design moderne et ajout du bouton de filtre */}
      <Paper elevation={3} className="mb-8 rounded-lg overflow-hidden">
        <GradientBackground variant="primary">
          <PatternBackground pattern="dots" opacity={0.15} color="ffffff" size={100}>
            <Box className="p-6 relative">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <EqualizerIcon sx={{ fontSize: 40, color: 'text.primary' }} />
                  <div>
                    <Typography variant="h4" component="h1" fontWeight={700} color="text.primary">
                      Tableau de bord des statistiques
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                      Vue d'ensemble des performances et activités
                    </Typography>
                  </div>
                </Box>
                
                {/* Bouton de filtre */}
                <Badge 
                  badgeContent={activeFilters.length} 
                  color="error" 
                  sx={{ '& .MuiBadge-badge': { top: 8, right: 8 } }}
                >
                  <Button
                    variant="outlined"
                    onClick={handleFilterClick}
                    startIcon={<FilterAltIcon />}
                    size="medium"
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.2)', 
                      borderColor: 'rgba(255,255,255,0.5)',
                      color: 'text.primary',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.3)', borderColor: 'rgba(255,255,255,0.8)' }
                    }}
                  >
                    Filtrer
                  </Button>
                </Badge>
              </Box>
            </Box>
            
            {/* Affichage des filtres actifs */}
            {activeFilters.length > 0 && (
              <Box sx={{ 
                bgcolor: (theme) => theme.palette.background.paper,
                borderRadius: 2,
                boxShadow: 3,
                p: 2,
                mx: 2,
                mb: 2,
                border: '1px solid',
                borderColor: (theme) => theme.palette.divider,
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
                    onClick={clearAllFilters}
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
                  {activeFilters.includes('classId') && (
                    <Chip 
                      icon={<SchoolIcon />}
                      label={`Classe: ${stats?.metaData?.classes.find(c => c.id.toString() === filters.classId)?.name || 'Inconnue'}`}
                      onDelete={() => removeFilter('classId')}
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
                  
                  {/* Affichage du filtre de sous-classe */}
                  {activeFilters.includes('subClassId') && (
                    <Chip 
                      icon={<SchoolIcon />}
                      label={`Groupe: ${stats?.metaData?.subClasses?.find(sc => sc.id.toString() === filters.subClassId)?.name || 'Inconnu'}`}
                      onDelete={() => removeFilter('subClassId')}
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
                  
                  {activeFilters.includes('studentId') && filters.studentId && (
                    <Chip 
                      icon={<PeopleIcon />}
                      label={`Étudiant: ${students.find(s => s.id.toString() === filters.studentId)?.name || 'Inconnu'}`}
                      onDelete={() => removeFilter('studentId')}
                      color="secondary"
                      variant="outlined"
                      sx={{ 
                        borderRadius: 3, 
                        '& .MuiChip-deleteIcon': { 
                          color: 'secondary.light',
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
                      icon={<MenuBookIcon />}
                      label={`Activité: ${stats?.metaData?.activities.find(a => a.id.toString() === filters.activityId)?.name || 'Inconnue'}`}
                      onDelete={() => removeFilter('activityId')}
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
                  
                  {/* Affichage du filtre des activités inactives */}
                  {activeFilters.includes('showInactive') && (
                    <Chip 
                      label="Incluant les activités inactives"
                      onDelete={() => {
                        // Supprimer le filtre
                        setFilters(prev => ({...prev, showInactive: false}));
                        setActiveFilters(activeFilters.filter(f => f !== 'showInactive'));
                        
                        // Mettre à jour l'URL
                        const newParams = new URLSearchParams(searchParams?.toString());
                        newParams.delete('showInactive');
                        router.push(`/stats?${newParams.toString()}`);
                        
                        // Recharger les données
                        fetchData();
                      }}
                      color="warning"
                      variant="outlined"
                      sx={{ 
                        borderRadius: 3, 
                        '& .MuiChip-deleteIcon': { 
                          color: 'warning.light',
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

        {/* Tabs navigation */}
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
          aria-label="stats tabs"
        >
          <Tab 
            icon={<EqualizerIcon />} 
            label="Vue d'ensemble" 
            id="tab-0"
            aria-controls="tabpanel-0"
          />
          <Tab 
            icon={<MenuBookIcon />} 
            label="Activités" 
            id="tab-1"
            aria-controls="tabpanel-1"
          />
          <Tab 
            icon={<SchoolIcon />} 
            label="Classes" 
            id="tab-2"
            aria-controls="tabpanel-2"
          />
          <Tab 
            icon={<TimelineIcon />} 
            label="Tendances" 
            id="tab-3"
            aria-controls="tabpanel-3"
          />
        </Tabs>
      </Paper>


      {/* Menu de filtre */}
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
          Filtrer les statistiques
        </Typography>
        
        <Divider sx={{ mb: 2 }} />
        
        <Box sx={{ mb: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel id="class-select-label">Classe</InputLabel>
            <Select
              labelId="class-select-label"
              id="class-select"
              name="classId"
              value={filters.classId}
              onChange={handleFilterChange}
              label="Classe"
            >
              <MenuItem value="">
                <em>Toutes les classes</em>
              </MenuItem>
              {stats?.metaData?.classes.map(c => (
                <MenuItem key={c.id} value={c.id.toString()}>{c.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button 
            variant="text" 
            size="small" 
            onClick={() => applyFilter('classId')}
            disabled={!filters.classId}
            sx={{ mt: 0.5 }}
          >
            Appliquer
          </Button>
        </Box>
        
        {/* Filtre pour les sous-classes (visible uniquement si une classe est sélectionnée) */}
        {filters.classId && stats?.metaData?.subClasses && stats.metaData.subClasses.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="sub-class-select-label">Groupe</InputLabel>
              <Select
                labelId="sub-class-select-label"
                id="sub-class-select"
                name="subClassId"
                value={filters.subClassId}
                onChange={handleFilterChange}
                label="Groupe"
              >
                <MenuItem value="">
                  <em>Tous les groupes</em>
                </MenuItem>
                {stats.metaData.subClasses.map(sc => (
                  <MenuItem key={sc.id} value={sc.id.toString()}>{sc.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button 
              variant="text" 
              size="small" 
              onClick={() => applyFilter('subClassId')}
              disabled={!filters.subClassId}
              sx={{ mt: 0.5 }}
            >
              Appliquer
            </Button>
          </Box>
        )}
        
        {/* Sous-filtre pour les étudiants (visible uniquement si une classe est sélectionnée) */}
        {filters.classId && (
          <Box sx={{ mb: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="student-select-label">Étudiant</InputLabel>
              <Select
                labelId="student-select-label"
                id="student-select"
                name="studentId"
                value={filters.studentId}
                onChange={handleFilterChange}
                label="Étudiant"
              >
                <MenuItem value="">
                  <em>Tous les étudiants</em>
                </MenuItem>
                {students.map(s => (
                  <MenuItem key={s.id} value={s.id.toString()}>{s.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button 
              variant="text" 
              size="small" 
              onClick={() => applyFilter('studentId')}
              disabled={!filters.studentId}
              sx={{ mt: 0.5 }}
            >
              Appliquer
            </Button>
          </Box>
        )}
        
        {/* Filtre pour inclure les activités inactives */}
        <Box sx={{ mb: 2 }}>
          <FormControlLabel
            control={
              <Switch 
                checked={filters.showInactive}
                onChange={(e) => {
                  // Mettre à jour l'état local
                  setFilters(prev => ({...prev, showInactive: e.target.checked}));
                  
                  // Mettre à jour l'URL et recharger les données
                  const newParams = new URLSearchParams(searchParams?.toString());
                  if (e.target.checked) {
                    newParams.set('showInactive', 'true');
                    if (!activeFilters.includes('showInactive')) {
                      setActiveFilters([...activeFilters, 'showInactive']);
                    }
                  } else {
                    newParams.delete('showInactive');
                    setActiveFilters(activeFilters.filter(f => f !== 'showInactive'));
                  }
                  
                  // Naviguer avec la nouvelle URL
                  router.push(`/stats?${newParams.toString()}`);
                  
                  // Fermer le menu
                  handleFilterClose();
                  
                  // Recharger les données
                  setTimeout(() => fetchData(), 100);
                }}
              />
            }
            label={
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Typography variant="body2">Inclure les activités inactives</Typography>
                {(stats?.inactiveCount ?? 0) > 0 && (
                  <Typography variant="caption" color="text.secondary">
                    ({stats?.inactiveCount ?? 0} correction{(stats?.inactiveCount ?? 0) > 1 ? 's' : ''} inactive{(stats?.inactiveCount ?? 0) > 1 ? 's' : ''})
                  </Typography>
                )}
              </Box>
            }
          />
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

      {/* Contenu des onglets */}
      <div role="tabpanel" hidden={tabValue !== TabValue.Overview} id="tabpanel-0" aria-labelledby="tab-0">
        {tabValue === TabValue.Overview && (
          <>
            {/* Cartes des KPIs */}
            <Grid container spacing={3} className="mb-6">
              <Grid size={{ xs: 12, sm: 6, md: 3.5 }}>
                <Card className="h-full">
                  <CardContent>
                  <Typography variant="overline" color="text.secondary">
                        Total des corrections effectuées
                    </Typography>
                    <Typography variant="h4" component="div" fontWeight="bold">
                      {stats?.globalStats.total_corrections || 0}
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      {(stats?.inactiveCount ?? 0) > 0 && !filters.showInactive && (
                        <Typography variant="caption" color="warning.main" sx={{ mt: 0.5 }}>
                          + {stats?.inactiveCount} correction{(stats?.inactiveCount ?? 0) > 1 ? 's' : ''} inactive{(stats?.inactiveCount ?? 0) > 1 ? 's' : ''} non comptabilisée{(stats?.inactiveCount ?? 0) > 1 ? 's' : ''}
                        </Typography>
                      )}
                      {filters.showInactive && (stats?.inactiveCount ?? 0) > 0 && (
                        <Typography variant="caption" color="warning.main" sx={{ mt: 0.5 }}>
                          (incluant {stats?.inactiveCount} correction{(stats?.inactiveCount ?? 0) > 1 ? 's' : ''} inactive{(stats?.inactiveCount ?? 0) > 1 ? 's' : ''})
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6, md: 3.5 }}>
                <Card className="h-full">
                  <CardContent>
                  <Typography variant="overline" color="text.secondary">
                      Pourcentage moyen de réussite
                    </Typography>
                    <Typography variant="h4" component="div" fontWeight="bold">
                      {stats?.globalStats.average_percentage !== undefined && stats?.globalStats.average_percentage !== null 
                        ? formatNumber(stats.globalStats.average_percentage) 
                        : "N/A"}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      (Normalisé selon le barème de chaque activité)
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
                <Card className="h-full">
                  <CardContent>
                  <Typography variant="overline" color="text.secondary">
                      Nombre total d'étudiants
                    </Typography>
                    <Typography variant="h4" component="div" fontWeight="bold">
                      {stats?.globalStats.total_students || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
                <Card className="h-full">
                  <CardContent>
                  <Typography variant="overline" color="text.secondary">
                      Nombre d'activités uniques
                    </Typography>
                    <Typography variant="h4" component="div" fontWeight="bold">
                      {stats?.globalStats.total_activities || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Distribution des notes */}
            <Paper className="p-4 mb-6">
              <Typography variant="h6" fontWeight="bold" className="mb-4">
                Distribution des notes
              </Typography>
              <Box sx={{ height: 300 }}>
                {stats && stats.gradeDistribution && stats.gradeDistribution.length > 0 ? (
                  <GradeDistributionChart data={stats.gradeDistribution} />
                ) : (
                  <Alert severity="info">Aucune donnée de distribution de notes disponible.</Alert>
                )}
              </Box>
            </Paper>

            {/* Top des activités */}
            <Paper className="p-4 mb-6">
              <Typography variant="h6" fontWeight="bold" className="mb-4">
                Top 10 des activités par pourcentage de réussite
              </Typography>
              <Box sx={{ height: 300 }}>
                {stats && stats.topActivities && stats.topActivities.length > 0 ? (
                  <TopActivitiesChart data={stats.topActivities} />
                ) : (
                  <Alert severity="info">Aucune donnée sur les activités disponible.</Alert>
                )}
              </Box>
            </Paper>
          </>
        )}
      </div>

      <div role="tabpanel" hidden={tabValue !== TabValue.Activities} id="tabpanel-1" aria-labelledby="tab-1">
        {tabValue === TabValue.Activities && (
          <>
            <Paper className="p-4 mb-6">
              <Typography variant="h6" fontWeight="bold" className="mb-4">
                Comparaison des activités par pourcentage de réussite
              </Typography>
              <Box sx={{ height: 400 }}>
                {stats && stats.activityStats && stats.activityStats.length > 0 ? (
                  <ActivityComparisonChart activityStats={stats.activityStats} />
                ) : (
                  <Alert severity="info">Aucune donnée sur les activités disponible pour la comparaison.</Alert>
                )}
              </Box>
            </Paper>

            {/* Tableau des données d'activités */}
            <Paper className="p-4">
              <Typography variant="h6" fontWeight="bold" className="mb-4">
                Détails des activités
              </Typography>
              <Box sx={{ overflowX: 'auto' }}>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Activité</TableCell>
                        <TableCell>Corrections</TableCell>
                        <TableCell>% Réussite</TableCell>
                        <TableCell>Note moyenne</TableCell>
                        <TableCell>Points max</TableCell>
                        <TableCell>Parties</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stats?.activityStats.map((activity) => (
                        <TableRow key={activity.activity_id}>
                          <TableCell>{activity.activity_name}</TableCell>
                          <TableCell>{activity.correction_count}</TableCell>
                          <TableCell>
                            {activity.average_percentage !== undefined ? 
                              `${formatNumber(activity.average_percentage)}%` : 'N/A'}
                          </TableCell>
                          <TableCell>
                            {activity.average_grade !== undefined ? 
                              formatNumber(activity.average_grade) : 
                              activity.average_percentage !== undefined ? 
                                formatNumber((activity.average_percentage / 100) * 20) : 
                                'N/A'}
                          </TableCell>
                          <TableCell>
                            {activity.points ? 
                              activity.points.reduce((sum, val) => sum + val, 0) : 
                              'N/A'}
                          </TableCell>
                          <TableCell>
                            {activity.parts_names ? 
                              activity.parts_names.join(', ') : 
                              'N/A'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Paper>
          </>
        )}
      </div>

      <div role="tabpanel" hidden={tabValue !== TabValue.Classes} id="tabpanel-2" aria-labelledby="tab-2">
        {tabValue === TabValue.Classes && (
          <>
            <Paper className="p-4 mb-6">
              <Typography variant="h6" fontWeight="bold" className="mb-4">
                Comparaison des classes
              </Typography>
              <Box sx={{ height: 400 }}>
                {stats && stats.classStats && stats.classStats.length > 0 ? (
                  <ClassComparisonChart data={stats.classStats} />
                ) : (
                  <Alert severity="info">Aucune donnée de classes disponible pour la comparaison.</Alert>
                )}
              </Box>
            </Paper>

            {/* Tableau des données de classes */}
            <Paper className="p-4">
              <Typography variant="h6" fontWeight="bold" className="mb-4">
                Détails des classes
              </Typography>
              <Box sx={{ overflowX: 'auto' }}>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Classe</TableCell>
                        <TableCell>Étudiants</TableCell>
                        <TableCell>Corrections</TableCell>
                        <TableCell>Note moyenne</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stats?.classStats.map((cls) => (
                        <TableRow key={cls.class_id}>
                          <TableCell>{cls.class_name}</TableCell>
                          <TableCell>{cls.student_count}</TableCell>
                          <TableCell>{cls.correction_count}</TableCell>
                          <TableCell>
                            {formatNumber(cls.average_grade)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Paper>
          </>
        )}
      </div>

      <div role="tabpanel" hidden={tabValue !== TabValue.Trends} id="tabpanel-3" aria-labelledby="tab-3">
        {tabValue === TabValue.Trends && (
          <>
            <Paper className="p-4 mb-6">
              <Typography variant="h6" fontWeight="bold" className="mb-4">
                Évolution des pourcentages de réussite au fil du temps
              </Typography>
              <Box sx={{ height: 400 }}>
                {stats && stats.gradeEvolution && stats.gradeEvolution.length > 0 ? (
                  <GradeEvolutionChart data={stats.gradeEvolution} />
                ) : (
                  <Alert severity="info">Aucune donnée d'évolution des notes disponible.</Alert>
                )}
              </Box>
            </Paper>

            {/* Statistiques par partie d'activité */}
            <Paper className="p-4">
              <Typography variant="h6" fontWeight="bold" className="mb-4">
                Pourcentages de réussite par partie d'activité
              </Typography>
              
              {stats?.partPercentages && stats.partPercentages.length > 0 ? (
                <Box sx={{ overflowX: 'auto' }}>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Partie</TableCell>
                          <TableCell>Nombre d'occurrences</TableCell>
                          <TableCell>Pourcentage de réussite</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {stats.partPercentages.map((part, index) => (
                          <TableRow key={index}>
                            <TableCell>{part.name}</TableCell>
                            <TableCell>{part.count}</TableCell>
                            <TableCell>
                              {formatNumber(part.percentage)}%
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              ) : (
                <Alert severity="info">
                  Aucune donnée disponible sur les parties d'activité. Cela peut être dû au fait que les activités n'ont pas de parties nommées.
                </Alert>
              )}
            </Paper>
          </>
        )}
      </div>
    </Container>
  );
}
