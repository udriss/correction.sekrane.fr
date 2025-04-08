'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
  Paper,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  Chip,
  FormControlLabel,
  Switch,
  Button,
  RadioGroup,
  Radio
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import ViewAgendaIcon from '@mui/icons-material/ViewAgenda';
import ViewComfyIcon from '@mui/icons-material/ViewComfy';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

interface ActivityStatsGraphsProps {
  activityId: number;
}

interface Group {
  id: number;
  name: string;
}

interface Class {
  id: number;
  name: string;
}

interface SubClass {
  id: number;
  name: string;
  classId?: number;  // ID de la classe à laquelle appartient ce sous-groupe
  className?: string; // Nom de la classe à laquelle appartient ce sous-groupe
  multipleClasses?: boolean; // Indique si ce sous-groupe existe dans plusieurs classes
}

interface GradeStats {
  groupId: number;
  groupName: string;
  classId?: number;
  className?: string;
  subClass?: number;
  averageGrade: number;
  maxGrade: number;
  minGrade: number;
  count: number;
}

type ChartType = 'bar' | 'performance' | 'line' | 'distribution' | 'pie';
type FilterType = 'classes' | 'groups' | 'subClasses';
type GranularityLevel = 'class' | 'subClass';

const ActivityStatsGraphs: React.FC<ActivityStatsGraphsProps> = ({ activityId }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<any>(null);
  const [showFullError, setShowFullError] = useState<boolean>(false);
  const [stats, setStats] = useState<GradeStats[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subClasses, setSubClasses] = useState<SubClass[]>([]);
  const [visibleCharts, setVisibleCharts] = useState<ChartType[]>(['bar', 'performance', 'line', 'distribution']);
  const [includeInactive, setIncludeInactive] = useState<boolean>(false);
  // Granularity state
  const [granularity, setGranularity] = useState<GranularityLevel>('subClass');
  // Filters state
  const [selectedClassIds, setSelectedClassIds] = useState<number[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);
  const [selectedSubClassIds, setSelectedSubClassIds] = useState<number[]>([]);
  // Filtered data state
  const [filteredStats, setFilteredStats] = useState<GradeStats[]>([]);

  // Dynamic color generation function - creates a balanced color palette with transparency
  const generateColors = (count: number, opacity = 0.6) => {
    const colors = [];
    // Reserve gray color for "No group" category
    const noGroupColor = `rgba(199, 199, 199, ${opacity})`;
    colors.push(noGroupColor);
    
    // Generate distributed hues for proper color separation
    for (let i = 0; i < count - 1; i++) {
      const hue = (i * 360 / (count - 1)) % 360; // Distribute colors around the color wheel
      const saturation = 80; // High saturation for vibrant colors
      const lightness = 60; // Medium lightness for good visibility
      colors.push(`hsla(${hue}, ${saturation}%, ${lightness}%, ${opacity})`);
    }
    
    return colors;
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      setErrorDetails(null);

      try {
        // Fetch associated classes for this activity
        const classesResponse = await fetch(`/api/activities/${activityId}/classes`);
        if (!classesResponse.ok) {
          throw new Error('Failed to fetch classes');
        }
        
        let classesData;
        try {
          classesData = await classesResponse.json();
          if (!Array.isArray(classesData)) {
            classesData = [];
          }
          setClasses(classesData);
        } catch (error) {
          console.error('Error parsing classes data:', error);
          setClasses([]);
        }

        // Fetch groups for this activity (manual grouping)
        const groupsResponse = await fetch(`/api/activities/${activityId}/groups`);
        if (!groupsResponse.ok) {
          throw new Error('Failed to fetch groups');
        }
        
        let groupsData;
        try {
          groupsData = await groupsResponse.json();
          if (!Array.isArray(groupsData)) {
            groupsData = [];
          }
          setGroups(groupsData);
        } catch (error) {
          console.error('Error parsing groups data:', error);
          setGroups([]);
        }

        // Generate sub-classes data based on classes
        const subClassesData: SubClass[] = [];
        classesData.forEach((classItem: any) => {
          if (classItem.nbre_subclasses) {
            for (let i = 1; i <= classItem.nbre_subclasses; i++) {
              subClassesData.push({
                id: i,
                name: `Groupe ${i}`,
                classId: classItem.id,
                className: classItem.name
              });
            }
          }
        });
        
        // On crée un Map pour dédupliquer sur l'id tout en conservant l'information de classe
        const subClassMap = new Map();
        subClassesData.forEach(item => {
          const key = item.id;
          if (!subClassMap.has(key)) {
            subClassMap.set(key, item);
          } else {
            // Si ce sous-groupe existe déjà, on ajoute un indicateur qu'il appartient à plusieurs classes
            const existing = subClassMap.get(key);
            existing.multipleClasses = true;
          }
        });
        
        setSubClasses(Array.from(subClassMap.values()));

        // Fetch grade statistics for this activity with all categorization
        const statsResponse = await fetch(
          `/api/activities/${activityId}/stats?includeInactive=${includeInactive}`
        );
        if (!statsResponse.ok) {
          const errorData = await statsResponse.json();
          throw new Error(
            errorData.details?.message || 
            errorData.error || 
            'Failed to fetch statistics'
          );
        }
        
        let statsData;
        try {
          statsData = await statsResponse.json();
          if (!Array.isArray(statsData)) {
            statsData = [];
          }
          
          // Make sure we have the "Sans groupe" category if needed
          const noGroupStats = statsData.find(stat => stat.groupId === 0);
          if (!noGroupStats && statsData.some(stat => stat.groupId === 0)) {
            statsData.push({
              groupId: 0,
              groupName: 'Sans groupe',
              averageGrade: 0,
              maxGrade: 0,
              minGrade: 0,
              count: 0
            });
          }
          
          setStats(statsData);
          setFilteredStats(statsData); // Initialize filtered stats with all stats
        } catch (error) {
          console.error('Error parsing stats data:', error);
          setStats([]);
          setFilteredStats([]);
        }
      } catch (err: any) {
        console.error('Error fetching activity statistics:', err);
        
        // Récupérer et traiter à la fois l'erreur simple et les détails complets
        const errorMessage = err.message || 'Failed to load statistics';
        setError(errorMessage);
        
        // Si l'erreur contient des détails (comme c'est le cas pour une réponse d'API avec détails)
        if (err.cause?.details) {
          setErrorDetails(err.cause.details);
        } else if (typeof err === 'object' && err !== null) {
          // Récupérer toutes les informations sur l'erreur pour affichage
          setErrorDetails({
            message: err.message,
            stack: err.stack,
            // Pour les erreurs network ou Response, récupérer ce qu'on peut
            status: err.status,
            statusText: err.statusText,
            // Autres propriétés potentielles d'erreur
            code: err.code,
            sqlMessage: err.sqlMessage,
            sql: err.sql
          });
        }

        setGroups([]);
        setClasses([]);
        setStats([]);
        setFilteredStats([]);
      } finally {
        setLoading(false);
      }
    };

    if (activityId) {
      fetchData();
    }
  }, [activityId, includeInactive]);

  // Function to aggregate stats by class level (combining all subclasses)
  const aggregateStatsByClass = (statsToAggregate: GradeStats[]): GradeStats[] => {
    const classMap = new Map<string, GradeStats>();
    const result: GradeStats[] = [];
    
    // First pass: collect statistics by class
    statsToAggregate.forEach(stat => {
      // Skip if it's not a class-based stat (groupId !== -1) - keep these as is
      if (stat.groupId !== -1) {
        result.push({...stat});
        return;
      }
      
      // Create a key for the class
      const classKey = `class-${stat.classId}`;
      
      if (!classMap.has(classKey)) {
        // Initialize with the first entry for this class
        classMap.set(classKey, {
          groupId: -1,
          groupName: stat.className || 'Classe inconnue',
          classId: stat.classId,
          className: stat.className,
          averageGrade: stat.averageGrade * stat.count, // weighted average (multiply by count now, divide later)
          maxGrade: stat.maxGrade,
          minGrade: stat.minGrade,
          count: stat.count
        });
      } else {
        // Update existing entry
        const existing = classMap.get(classKey)!;
        existing.averageGrade += stat.averageGrade * stat.count; // Add weighted grade
        existing.maxGrade = Math.max(existing.maxGrade, stat.maxGrade);
        existing.minGrade = Math.min(existing.minGrade, stat.minGrade);
        existing.count += stat.count;
      }
    });
    
    // Second pass: compute final averages and add to result
    classMap.forEach(aggregatedStat => {
      if (aggregatedStat.count > 0) {
        aggregatedStat.averageGrade = parseFloat((aggregatedStat.averageGrade / aggregatedStat.count).toFixed(2));
      }
      result.push(aggregatedStat);
    });
    
    return result;
  };

  // Effect to apply filters to the stats data
  useEffect(() => {
    let filtered = [...stats];
    
    // Apply class filter if any class is selected
    if (selectedClassIds.length > 0) {
      filtered = filtered.filter(stat => 
        stat.classId !== undefined && selectedClassIds.includes(stat.classId)
      );
    }
    
    // Apply group filter if any group is selected, but only for items that 
    // aren't associated with a class (since class_id prend priorité)
    if (selectedGroupIds.length > 0) {
      filtered = filtered.filter(stat => 
        // Le groupe -1 est notre cas spécial où class_id est défini, on ignore le filtre dans ce cas
        stat.groupId !== -1 && selectedGroupIds.includes(stat.groupId)
      );
    }
    
    // Apply sub-class filter if any sub-class is selected (only in subClass granularity)
    if (selectedSubClassIds.length > 0 && granularity === 'subClass') {
      filtered = filtered.filter(stat => 
        stat.subClass !== undefined && selectedSubClassIds.includes(stat.subClass)
      );
    }
    
    // Apply granularity - if class level is selected, aggregate sub-classes
    if (granularity === 'class') {
      filtered = aggregateStatsByClass(filtered);
    }
    
    setFilteredStats(filtered);
  }, [stats, selectedClassIds, selectedGroupIds, selectedSubClassIds, granularity]);

  // Handler functions for filters
  const handleFilterChange = (type: FilterType, ids: number[]) => {
    switch (type) {
      case 'classes':
        setSelectedClassIds(ids);
        break;
      case 'groups':
        setSelectedGroupIds(ids);
        break;
      case 'subClasses':
        setSelectedSubClassIds(ids);
        break;
    }
  };

  const handleResetFilters = () => {
    setSelectedClassIds([]);
    setSelectedGroupIds([]);
    setSelectedSubClassIds([]);
  };

  const handleIncludeInactiveChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIncludeInactive(event.target.checked);
  };

  // Handler function for granularity change
  const handleGranularityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setGranularity(event.target.value as GranularityLevel);
  };

  // Custom rendering of group/class names based on granularity
  const getDisplayName = (stat: GradeStats) => {
    if (granularity === 'class') {
      if (stat.groupId === -1) {
        // For class granularity, just show class name
        return stat.groupName;
      } else {
        // For non-class items, show groupName (and class if available)
        return `${stat.groupName}${stat.className ? ` (${stat.className})` : ''}`;
      }
    } else {
      // For subClass granularity, use the original name format
      return stat.groupName;
    }
  };

  const preparePieChartData = () => {
    const labels = filteredStats.map(stat => 
      `${getDisplayName(stat)} (${stat.count})`
    );
    const colors = generateColors(filteredStats.length);
    
    return {
      labels,
      datasets: [
        {
          data: filteredStats.map(stat => stat.count),
          backgroundColor: filteredStats.map((stat, index) => 
            stat.groupId === 0 
              ? colors[0] 
              : stat.groupId === -1 
                ? 'rgba(75, 192, 92, 0.7)' // Vert pour les classes
                : colors[index % colors.length]
          ),
          hoverOffset: 4
        }
      ]
    };
  };
  
  // Prepare all chart data sets
  const prepareBarChartData = () => {
    const labels = filteredStats.map(stat => getDisplayName(stat));
    const colors = generateColors(filteredStats.length);
    
    return {
      labels,
      datasets: [
        {
          label: 'Note moyenne',
          data: filteredStats.map(stat => stat.averageGrade),
          backgroundColor: filteredStats.map((stat, index) => 
            // Le groupe 0 est "Sans groupe", -1 est un groupe class_id
            stat.groupId === 0 
              ? colors[0] 
              : stat.groupId === -1 
                ? 'rgba(75, 192, 92, 0.7)' // Vert pour les classes
                : colors[index % colors.length]
          )
        }
      ]
    };
  };

  // Calculate overall average for comparison chart
  const calculateOverallAverage = () => {
    if (!filteredStats.length) return 0;
    
    const totalSum = filteredStats.reduce((sum, stat) => sum + (stat.averageGrade * stat.count), 0);
    const totalCount = filteredStats.reduce((sum, stat) => sum + stat.count, 0);
    
    return totalCount > 0 ? parseFloat((totalSum / totalCount).toFixed(2)) : 0;
  };

  // Replace the pie chart data with performance comparison data
  const preparePerformanceChartData = () => {
    const labels = filteredStats.map(stat => getDisplayName(stat));
    const overallAverage = calculateOverallAverage();
    
    // Color based on performance compared to average
    const colors = filteredStats.map(stat => {
      if (stat.groupId === -1) {
        // Classes en vert clair ou rouge clair selon la performance
        return stat.averageGrade >= overallAverage
          ? 'rgba(75, 192, 92, 0.6)'
          : 'rgba(255, 99, 132, 0.6)';
      } else {
        // Traitement normal pour les autres cas
        return stat.averageGrade >= overallAverage
          ? 'rgba(54, 162, 235, 0.6)'  // Bleu pour au-dessus de la moyenne
          : 'rgba(255, 159, 64, 0.6)'  // Orange pour en-dessous de la moyenne
      }
    });
    
    // Calculate difference from overall average
    const performanceData = filteredStats.map(stat => {
      const diff = stat.averageGrade - overallAverage;
      return parseFloat((diff).toFixed(2));
    });
    
    return {
      labels,
      datasets: [
        {
          label: 'Écart par rapport à la moyenne générale',
          data: performanceData,
          backgroundColor: colors,
          borderColor: colors.map(color => color.replace('0.6', '1')),
          borderWidth: 1
        }
      ]
    };
  };

  const prepareLineChartData = () => {
    const labels = filteredStats.map(stat => getDisplayName(stat));
    
    return {
      labels,
      datasets: [
        {
          label: 'Note maximale',
          data: filteredStats.map(stat => stat.maxGrade),
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          tension: 0.1
        },
        {
          label: 'Note moyenne',
          data: filteredStats.map(stat => stat.averageGrade),
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          tension: 0.1
        },
        {
          label: 'Note minimale',
          data: filteredStats.map(stat => stat.minGrade),
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1
        }
      ]
    };
  };

  const prepareDistributionChartData = () => {
    const labels = filteredStats.map(stat => getDisplayName(stat));
    const colors = generateColors(filteredStats.length);
    
    return {
      labels,
      datasets: [
        {
          label: 'Nombre de notes',
          data: filteredStats.map(stat => stat.count),
          backgroundColor: filteredStats.map((stat, index) => 
            stat.groupId === 0 
              ? colors[0] 
              : stat.groupId === -1 
                ? 'rgba(75, 192, 92, 0.7)' // Vert pour les classes
                : colors[index % colors.length]
          )
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Statistiques des notes par groupe',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      }
    }
  };

  const performanceChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `Performance relative (moyenne générale: ${calculateOverallAverage()}/20)`,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const value = context.parsed.y;
            return value >= 0
              ? `+${value} points au-dessus de la moyenne`
              : `${value} points en dessous de la moyenne`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        title: {
          display: true,
          text: 'Écart de points'
        }
      }
    }
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      title: {
        display: true,
        text: 'Répartition des notes par groupe',
      },
    }
  };

  const handleChartVisibilityChange = (
    event: React.MouseEvent<HTMLElement>,
    newVisibleCharts: ChartType[],
  ) => {
    // Ensure at least one chart is always visible
    if (newVisibleCharts.length) {
      setVisibleCharts(newVisibleCharts);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert 
        severity="error" 
        sx={{ 
          mb: 2,
          '& .MuiAlert-message': { width: '100%' } 
        }}
        action={
          errorDetails && (
            <Button 
              color="inherit" 
              size="small"
              onClick={() => setShowFullError(!showFullError)}
            >
              {showFullError ? 'Masquer les détails' : 'Voir les détails'}
            </Button>
          )
        }
      >
        <Typography variant="body1" sx={{ mb: errorDetails ? 1 : 0 }}>
          <strong>Erreur lors du chargement des statistiques :</strong> {error}
        </Typography>
        
        {showFullError && errorDetails && (
          <Paper 
            elevation={0} 
            sx={{ 
              bgcolor: 'rgba(0,0,0,0.04)', 
              p: 2, 
              mt: 1, 
              maxHeight: '400px',
              overflow: 'auto',
              fontSize: '0.85rem',
              fontFamily: 'monospace'
            }}
          >
            <Typography variant="subtitle2" gutterBottom>
              Détails de l'erreur:
            </Typography>
            
            {errorDetails.sqlMessage && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="caption" component="div" color="error.dark" sx={{ fontWeight: 'bold' }}>
                  SQL Message:
                </Typography>
                <Typography variant="caption" component="div" sx={{ ml: 1 }}>
                  {errorDetails.sqlMessage}
                </Typography>
              </Box>
            )}
            
            {errorDetails.code && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="caption" component="div" color="error.dark" sx={{ fontWeight: 'bold' }}>
                  Code:
                </Typography>
                <Typography variant="caption" component="div" sx={{ ml: 1 }}>
                  {errorDetails.code}
                </Typography>
              </Box>
            )}
            
            {errorDetails.sql && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="caption" component="div" color="error.dark" sx={{ fontWeight: 'bold' }}>
                  Requête SQL:
                </Typography>
                <Typography 
                  variant="caption" 
                  component="pre" 
                  sx={{ 
                    ml: 1, 
                    whiteSpace: 'pre-wrap', 
                    wordBreak: 'break-word',
                    bgcolor: 'background.paper',
                    p: 1,
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider'
                  }}
                >
                  {errorDetails.sql}
                </Typography>
              </Box>
            )}
            
            {errorDetails.stack && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="caption" component="div" color="error.dark" sx={{ fontWeight: 'bold' }}>
                  Stack Trace:
                </Typography>
                <Typography 
                  variant="caption" 
                  component="pre" 
                  sx={{ 
                    ml: 1, 
                    whiteSpace: 'pre-wrap', 
                    wordBreak: 'break-word' 
                  }}
                >
                  {errorDetails.stack}
                </Typography>
              </Box>
            )}
          </Paper>
        )}
      </Alert>
    );
  }
  
  if (stats.length === 0) {
    return (
      <Alert severity="info">
        Aucune note n'est disponible pour cette activité.
      </Alert>
    );
  }

  const totalCorrections = filteredStats.reduce((acc, stat) => acc + stat.count, 0);

  return (
    <Card>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Les statistiques incluent {totalCorrections} notes au total.
            Moyenne générale: {calculateOverallAverage()}/20.
            {filteredStats.find(s => s.groupId === 0 || s.groupName === 'Sans groupe') && 
              ' Les notes sans groupe assigné sont représentées en gris.'}
          </Typography>

          {/* Filters section */}
          <Paper elevation={1} sx={{ p: 2, mt: 2, mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
              Filtres et vue
            </Typography>
            
            {/* Granularity selector - version moderne et stylisée */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Niveau de détail :
              </Typography>
              <ToggleButtonGroup
                value={granularity}
                exclusive
                onChange={(e, newValue) => {
                  if (newValue !== null) {
                    setGranularity(newValue as GranularityLevel);
                  }
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
                  value="class"
                  sx={{
                    fontWeight: granularity === 'class' ? 'medium' : 'normal',
                    transition: 'all 0.2s'
                  }}
                >
                  <ViewAgendaIcon sx={{ mr: 1, fontSize: '1rem' }} />
                  Par classe
                </ToggleButton>
                <ToggleButton 
                  value="subClass"
                  sx={{
                    fontWeight: granularity === 'subClass' ? 'medium' : 'normal',
                    transition: 'all 0.2s'
                  }}
                >
                  <ViewComfyIcon sx={{ mr: 1, fontSize: '1rem' }} />
                  Par sous-groupe
                </ToggleButton>
              </ToggleButtonGroup>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {granularity === 'class' 
                  ? 'Vue agrégée - les notes sont regroupées par classe, indépendamment des sous-groupes' 
                  : 'Vue détaillée - affiche les résultats pour chaque sous-groupe séparément'}
              </Typography>
            </Box>
            
            <Grid container spacing={2}>
              {/* Class filter */}
              {classes.length > 0 && (
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="classes-filter-label">Classes</InputLabel>
                    <Select
                      labelId="classes-filter-label"
                      multiple
                      value={selectedClassIds}
                      onChange={(e) => handleFilterChange('classes', e.target.value as number[])}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => (
                            <Chip 
                              key={value} 
                              label={classes.find(c => c.id === value)?.name || value} 
                              size="small" 
                            />
                          ))}
                        </Box>
                      )}
                    >
                      {classes.map((cls) => (
                        <MenuItem key={cls.id} value={cls.id}>
                          <Checkbox checked={selectedClassIds.includes(cls.id)} />
                          <ListItemText primary={cls.name} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}
              
              {/* Group filter */}
              {groups.length > 0 && (
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="groups-filter-label">Groupes</InputLabel>
                    <Select
                      labelId="groups-filter-label"
                      multiple
                      value={selectedGroupIds}
                      onChange={(e) => handleFilterChange('groups', e.target.value as number[])}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => (
                            <Chip 
                              key={value} 
                              label={groups.find(g => g.id === value)?.name || value} 
                              size="small" 
                            />
                          ))}
                        </Box>
                      )}
                    >
                      {groups.map((group) => (
                        <MenuItem key={group.id} value={group.id}>
                          <Checkbox checked={selectedGroupIds.includes(group.id)} />
                          <ListItemText primary={group.name} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}
              
              {/* Sub-class filter */}
              {subClasses.length > 0 && selectedClassIds.length > 0 && (
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="subclasses-filter-label">Sous-groupes</InputLabel>
                    <Select
                      labelId="subclasses-filter-label"
                      multiple
                      value={selectedSubClassIds}
                      onChange={(e) => handleFilterChange('subClasses', e.target.value as number[])}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => {
                            const subClass = subClasses.find(s => s.id === value);
                            const label = subClass?.multipleClasses 
                              ? `${subClass.name} (${subClass.className})` 
                              : subClass?.name || value;
                            return (
                              <Chip 
                                key={value} 
                                label={label} 
                                size="small" 
                              />
                            );
                          })}
                        </Box>
                      )}
                    >
                      {subClasses.map((subClass) => {
                        // N'afficher que les sous-classes des classes sélectionnées
                        if (!subClass.classId || !selectedClassIds.includes(subClass.classId)) {
                          return null;
                        }
                        
                        // Label spécifique pour distinguer les sous-groupes de différentes classes
                        const label = subClass.multipleClasses 
                          ? `${subClass.name} (${subClass.className})` 
                          : subClass.name;
                          
                        return (
                          <MenuItem key={subClass.id} value={subClass.id}>
                            <Checkbox checked={selectedSubClassIds.includes(subClass.id)} />
                            <ListItemText primary={label} />
                          </MenuItem>
                        );
                      }).filter(Boolean)}
                    </Select>
                  </FormControl>
                </Grid>
              )}
            </Grid>
            
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={includeInactive}
                    onChange={handleIncludeInactiveChange}
                    size="small"
                  />
                }
                label="Inclure les corrections inactives"
              />
              
              <Button 
                variant="outlined" 
                size="small" 
                onClick={handleResetFilters}
                disabled={!selectedClassIds.length && !selectedGroupIds.length && !selectedSubClassIds.length}
                startIcon={<ClearIcon />}
              >
                Réinitialiser les filtres
              </Button>
            </Box>
          </Paper>
          
          <Box sx={{ mt: 2, mb: 3 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Afficher/masquer les graphiques :
            </Typography>
            <ToggleButtonGroup
              value={visibleCharts}
              onChange={handleChartVisibilityChange}
              aria-label="Visibilité des graphiques"
              color="primary"
              size="small"
            >
              <ToggleButton value="bar" aria-label="Graphique en barres">
                Moyennes
              </ToggleButton>
              <ToggleButton value="line" aria-label="Graphique en ligne">
                Min/Moy/Max
              </ToggleButton>
              <ToggleButton value="performance" aria-label="Performance">
                Performance
              </ToggleButton>
              <ToggleButton value="distribution" aria-label="Distribution">
                Distribution
              </ToggleButton>
              <ToggleButton value="pie" aria-label="Graphique en camembert">
                Camembert
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        <Grid container spacing={3}>
          {visibleCharts.includes('bar') && (
            <Grid size={{ xs: 12 }}>
              <Paper elevation={2} sx={{ p: 2, height: 400, display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" component="h3" gutterBottom align="center">
                  Notes moyennes par groupe
                </Typography>
                <Box sx={{ flexGrow: 1 }}>
                  <Bar data={prepareBarChartData()} options={chartOptions} />
                </Box>
              </Paper>
            </Grid>
          )}
          
          {visibleCharts.includes('performance') && (
            <Grid size={{ xs: 12 }}>
              <Paper elevation={2} sx={{ p: 2, height: 400, display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" component="h3" gutterBottom align="center">
                  Performance relative à la moyenne
                </Typography>
                <Box sx={{ flexGrow: 1 }}>
                  <Bar data={preparePerformanceChartData()} options={performanceChartOptions} />
                </Box>
              </Paper>
            </Grid>
          )}
          
          {visibleCharts.includes('line') && (
            <Grid size={{ xs: 12 }}>
              <Paper elevation={2} sx={{ p: 2, height: 400, mt: { xs: 3, md: 0 }, display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" component="h3" gutterBottom align="center">
                  Notes min/moy/max par groupe
                </Typography>
                <Box sx={{ flexGrow: 1 }}>
                  <Line data={prepareLineChartData()} options={chartOptions} />
                </Box>
              </Paper>
            </Grid>
          )}
          
          {visibleCharts.includes('distribution') && (
            <Grid size={{ xs: 12 }}>
              <Paper elevation={2} sx={{ p: 2, height: 400, mt: { xs: 3, md: 0 }, display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" component="h3" gutterBottom align="center">
                  Nombre de notes par groupe
                </Typography>
                <Box sx={{ flexGrow: 1 }}>
                  <Bar data={prepareDistributionChartData()} options={chartOptions} />
                </Box>
              </Paper>
            </Grid>
          )}
          
          {visibleCharts.includes('pie') && (
            <Grid size={{ xs: 12 }}>
              <Paper elevation={2} sx={{ p: 2, height: 400, mt: { xs: 3, md: 0 }, display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" component="h3" gutterBottom align="center">
                  Répartition en camembert
                </Typography>
                <Box sx={{ flexGrow: 1 }}>
                  <Pie data={preparePieChartData()} options={pieChartOptions} />
                </Box>
              </Paper>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default ActivityStatsGraphs;
