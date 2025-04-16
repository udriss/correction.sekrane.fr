import React from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Alert, 
  Chip,
  useTheme
} from '@mui/material';
import dayjs from 'dayjs';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend
} from 'recharts';
import { CorrectionAutreEnriched } from '@/lib/types';

interface StudentEvolutionProps {
  corrections: CorrectionAutreEnriched[];
}

export default function StudentEvolution({ corrections }: StudentEvolutionProps) {
  const theme = useTheme();

  const getGradeEvolutionData = () => {
    // Filtrer uniquement les corrections qui ont une note (grade)
    return corrections
      .filter(c => c.grade !== null)
      .slice()
      .sort((a, b) => {
        // Utiliser submission_date si disponible, sinon created_at
        const dateA = a.submission_date 
          ? new Date(a.submission_date).getTime() 
          : new Date(a.created_at ?? 0).getTime();
        const dateB = b.submission_date 
          ? new Date(b.submission_date).getTime() 
          : new Date(b.created_at ?? 0).getTime();
        return dateA - dateB;
      })
      .map(c => {
        // Déterminer la date à afficher (submission_date ou created_at)
        const dateToUse = c.submission_date || c.created_at;
        // Créer un objet avec les données formatées
        return {
          id: c.id,
          date: dateToUse ? dayjs(dateToUse).format('DD/MM/YY') : 'Sans date',
          note: c.grade || 0,
          activity: c.activity_name || `Activité #${c.activity_id}`,
          activityId: c.activity_id
        };
      });
  };

  const evolutionData = getGradeEvolutionData();

  // 

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 2, boxShadow: 3 }}>
          <Typography variant="subtitle2" color="text.primary">
            Date: {label}
          </Typography>
          <Typography variant="body1" fontWeight="bold" color="primary">
            Note: {payload[0].value}/20
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Activité: {payload[0].payload.activity}
          </Typography>
        </Paper>
      );
    }
    return null;
  };

  return (
    <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>
        Évolution des notes
      </Typography>
      
      {evolutionData.length < 2 ? (
        <Alert severity="info">
          Il faut au moins deux corrections avec notes pour afficher l'évolution.
        </Alert>
      ) : (
        <Box sx={{ height: 400 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={evolutionData}
              margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                angle={-45} 
                textAnchor="end" 
                tick={{ fill: theme.palette.text.secondary }}
                axisLine={{ stroke: theme.palette.divider }}
                tickLine={{ stroke: theme.palette.divider }}
              />
              <YAxis 
                domain={[0, 20]} 
                tick={{ fill: theme.palette.text.secondary }}
                axisLine={{ stroke: theme.palette.divider }}
                tickLine={{ stroke: theme.palette.divider }}
              />
              <RechartsTooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="note" 
                name="Note" 
                stroke={theme.palette.primary.main} 
                strokeWidth={2}
                dot={{ fill: theme.palette.primary.main, r: 6 }}
                activeDot={{ r: 8, fill: theme.palette.secondary.main }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      )}
      
      {evolutionData.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Détail des activités
          </Typography>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {evolutionData.map((item) => (
              <Chip
                key={`${item.id}`}
                label={`${item.date} : ${item.activity}`}
                size="small"
                variant="outlined"
                color="primary"
              />
            ))}
          </Box>
        </Box>
      )}
    </Paper>
  );
}
