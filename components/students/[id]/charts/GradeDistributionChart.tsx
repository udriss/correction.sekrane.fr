import React from 'react';
import { 
  Box, 
  useTheme, 
  Paper,
  Typography,
  Alert
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
  Cell
} from 'recharts';
import { Correction, StudentStats } from '../types';

interface GradeDistributionChartProps {
  corrections: Correction[];
  stats: StudentStats;
}

export default function GradeDistributionChart({ corrections, stats }: GradeDistributionChartProps) {
  const theme = useTheme();

  const CHART_COLORS = [
    theme.palette.error.main,       // 0-5
    theme.palette.warning.main,     // 5-10
    theme.palette.warning.light,    // 10-12
    theme.palette.info.main,        // 12-14
    theme.palette.primary.main,     // 14-16
    theme.palette.success.main,     // 16-20
  ];

  const getGradeDistributionData = () => {
    const ranges = [
      { name: '0-5', count: 0, fill: CHART_COLORS[0], range: "Insuffisant" },
      { name: '5-10', count: 0, fill: CHART_COLORS[1], range: "En dessous de la moyenne" },
      { name: '10-12', count: 0, fill: CHART_COLORS[2], range: "Moyen" },
      { name: '12-14', count: 0, fill: CHART_COLORS[3], range: "Assez bien" },
      { name: '14-16', count: 0, fill: CHART_COLORS[4], range: "Bien" },
      { name: '16-20', count: 0, fill: CHART_COLORS[5], range: "Très bien" },
    ];

    corrections
      .filter(c => c.grade !== null)
      .forEach(c => {
        const grade = c.grade || 0;
        if (grade < 5) ranges[0].count++;
        else if (grade < 10) ranges[1].count++;
        else if (grade < 12) ranges[2].count++;
        else if (grade < 14) ranges[3].count++;
        else if (grade < 16) ranges[4].count++;
        else ranges[5].count++;
      });

    return ranges;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Paper sx={{ p: 2, boxShadow: 3 }}>
          <Typography variant="subtitle2" color="text.primary">
            Notes {label}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {data.range}
          </Typography>
          <Typography variant="body1" fontWeight="bold" sx={{ color: data.fill }}>
            {data.count} correction{data.count > 1 ? 's' : ''}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {((data.count / stats.gradedCount) * 100).toFixed(1)}% des notes
          </Typography>
        </Paper>
      );
    }
    return null;
  };

  const data = getGradeDistributionData();
  const hasData = data.some(range => range.count > 0);

  return (
    <Paper elevation={2} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Distribution des notes
      </Typography>
      
      {!hasData ? (
        <Alert 
          severity="info" 
          sx={{ 
            mt: 3,
            border: 1,
            borderColor: 'info.main',
            '& .MuiAlert-icon': {
              color: 'info.main'
            }
          }}
        >
          Aucune note disponible pour générer une distribution.
        </Alert>
      ) : (
        <Box sx={{ height: 400, mt: 2 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              barSize={40}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="name" 
                tick={{ fill: theme.palette.text.secondary }}
                axisLine={{ stroke: theme.palette.divider }}
                tickLine={{ stroke: theme.palette.divider }}
              />
              <YAxis 
                tick={{ fill: theme.palette.text.secondary }}
                axisLine={{ stroke: theme.palette.divider }}
                tickLine={{ stroke: theme.palette.divider }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend formatter={(value) => `Répartition des ${stats.gradedCount} notes`} />
              <ReferenceLine 
                y={0} 
                stroke={theme.palette.divider} 
              />
              {!isNaN(stats.averageGrade) && (
                <ReferenceLine 
                  x={stats.averageGrade < 5 ? '0-5' : 
                     stats.averageGrade < 10 ? '5-10' : 
                     stats.averageGrade < 12 ? '10-12' : 
                     stats.averageGrade < 14 ? '12-14' : 
                     stats.averageGrade < 16 ? '14-16' : '16-20'} 
                  stroke={theme.palette.warning.main} 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  label={{ 
                    value: `Moyenne: ${stats.averageGrade.toFixed(1)}`, 
                    position: 'top',
                    fill: theme.palette.warning.main,
                    fontSize: 12
                  }}
                />
              )}
              <Bar 
                dataKey="count" 
                radius={[4, 4, 0, 0]}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Box>
      )}
      
      {hasData && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Note moyenne: <strong>{stats.averageGrade.toFixed(1)}/20</strong> 
            {stats.ungradedCount > 0 && ` (${stats.gradedCount} note${stats.gradedCount > 1 ? 's' : ''} sur ${stats.totalCorrections} corrections)`}
          </Typography>
        </Box>
      )}
    </Paper>
  );
}
