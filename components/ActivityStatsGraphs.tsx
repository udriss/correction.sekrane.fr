'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid2 as Grid,
  CircularProgress,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
  Paper,
  Divider
} from '@mui/material';
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

interface GradeStats {
  groupId: number;
  groupName: string;
  averageGrade: number;
  maxGrade: number;
  minGrade: number;
  count: number;
}

type ChartType = 'bar' | 'performance' | 'line' | 'distribution' | 'pie';

const ActivityStatsGraphs: React.FC<ActivityStatsGraphsProps> = ({ activityId }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<GradeStats[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  // Updated to exclude 'pie' from the default visible charts
  const [visibleCharts, setVisibleCharts] = useState<ChartType[]>(['bar', 'performance', 'line', 'distribution']);

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

      try {
        // Fetch groups for this activity
        const groupsResponse = await fetch(`/api/activities/${activityId}/groups`);
        if (!groupsResponse.ok) {
          throw new Error('Failed to fetch groups');
        }
        
        let groupsData;
        try {
          groupsData = await groupsResponse.json();
          // Ensure we have an array, even if empty
          if (!Array.isArray(groupsData)) {
            groupsData = [];
          }
          setGroups(groupsData);
        } catch (error) {
          console.error('Error parsing groups data:', error);
          setGroups([]);
        }

        // Fetch grade statistics for this activity with group categorization
        const statsResponse = await fetch(`/api/activities/${activityId}/stats`);
        if (!statsResponse.ok) {
          throw new Error('Failed to fetch statistics');
        }
        
        let statsData;
        try {
          statsData = await statsResponse.json();
          // Ensure we have an array, even if empty
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
        } catch (error) {
          console.error('Error parsing stats data:', error);
          setStats([]);
        }
      } catch (err) {
        console.error('Error fetching activity statistics:', err);
        setError((err as Error).message || 'Failed to load statistics');
        setGroups([]);
        setStats([]);
      } finally {
        setLoading(false);
      }
    };

    if (activityId) {
      fetchData();
    }
  }, [activityId]);

  const preparePieChartData = () => {
    const labels = stats.map(stat => `${stat.groupName} (${stat.count})`);
    const colors = generateColors(stats.length);
    
    return {
      labels,
      datasets: [
        {
          data: stats.map(stat => stat.count),
          backgroundColor: stats.map((stat, index) => 
            stat.groupId === 0 ? colors[0] : colors[index % colors.length]
          ),
          hoverOffset: 4
        }
      ]
    };
  };
  
  // Prepare all chart data sets
  const prepareBarChartData = () => {
    const labels = stats.map(stat => stat.groupName);
    const colors = generateColors(stats.length);
    
    return {
      labels,
      datasets: [
        {
          label: 'Note moyenne',
          data: stats.map(stat => stat.averageGrade),
          backgroundColor: stats.map((stat, index) => 
            stat.groupId === 0 ? colors[0] : colors[index % colors.length]
          )
        }
      ]
    };
  };

  // Calculate overall average for comparison chart
  const calculateOverallAverage = () => {
    if (!stats.length) return 0;
    
    const totalSum = stats.reduce((sum, stat) => sum + (stat.averageGrade * stat.count), 0);
    const totalCount = stats.reduce((sum, stat) => sum + stat.count, 0);
    
    return totalCount > 0 ? parseFloat((totalSum / totalCount).toFixed(2)) : 0;
  };

  // Replace the pie chart data with performance comparison data
  const preparePerformanceChartData = () => {
    const labels = stats.map(stat => stat.groupName);
    const overallAverage = calculateOverallAverage();
    
    // Color based on performance compared to average
    const colors = stats.map(stat => 
      stat.averageGrade >= overallAverage
        ? 'rgba(75, 192, 92, 0.6)'  // Green for above average
        : 'rgba(255, 99, 132, 0.6)' // Red for below average
    );
    
    // Calculate difference from overall average
    const performanceData = stats.map(stat => {
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
    const labels = stats.map(stat => stat.groupName);
    
    return {
      labels,
      datasets: [
        {
          label: 'Note maximale',
          data: stats.map(stat => stat.maxGrade),
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          tension: 0.1
        },
        {
          label: 'Note moyenne',
          data: stats.map(stat => stat.averageGrade),
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          tension: 0.1
        },
        {
          label: 'Note minimale',
          data: stats.map(stat => stat.minGrade),
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1
        }
      ]
    };
  };

  const prepareDistributionChartData = () => {
    const labels = stats.map(stat => stat.groupName);
    const colors = generateColors(stats.length);
    
    return {
      labels,
      datasets: [
        {
          label: 'Nombre de notes',
          data: stats.map(stat => stat.count),
          backgroundColor: stats.map((stat, index) => 
            stat.groupId === 0 ? colors[0] : colors[index % colors.length]
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
      <Alert severity="error">
        Erreur lors du chargement des statistiques : {error}
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

  return (
    <Card>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            Tableau de bord - Statistiques des notes
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Les statistiques incluent {stats.reduce((acc, stat) => acc + stat.count, 0)} notes au total.
            Moyenne générale: {calculateOverallAverage()}/20.
            {stats.find(s => s.groupId === 0 || s.groupName === 'Sans groupe') && 
              ' Les notes sans groupe assigné sont représentées en gris.'}
          </Typography>
          
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
              {/* Added pie chart toggle button */}
              <ToggleButton value="pie" aria-label="Graphique en camembert">
                Camembert
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        <Grid container spacing={3}>
          {visibleCharts.includes('bar') && (
            <Grid size={{ xs: 12, md: 6 }}>
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
            <Grid size={{ xs: 12, md: 6 }}>
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
            <Grid size={{ xs: 12, md: 6 }}>
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
            <Grid size={{ xs: 12, md: 6 }}>
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
            <Grid size={{ xs: 12, md: 6 }}>
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
