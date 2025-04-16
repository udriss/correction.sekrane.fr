import React from 'react';
import { Box, Grid, Paper, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

import RecentActorsIcon from '@mui/icons-material/RecentActors';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import PeopleIcon from '@mui/icons-material/People';
interface ClassStatsProps {
  studentCount: number;
  activityCount: number;
  correctionCount: number;
  subClassCount?: number;
  onStatClick: (tabIndex: number) => void;
}

export function ClassStats({
  studentCount,
  activityCount,
  correctionCount,
  subClassCount,
  onStatClick
}: ClassStatsProps) {
  return (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={2} sx={{ display: 'flex', justifyContent: 'space-around' }}>
        <Grid size={{ xs: 12, sm: 6, md: subClassCount ? 3 : 4 }}>
          <StatCard
            icon={<PeopleIcon color="primary" fontSize="large" />}
            value={studentCount}
            label="étudiants"
            onClick={() => onStatClick(1)}
          />
        </Grid>

        {subClassCount && subClassCount > 0 && (
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              icon={<RecentActorsIcon color="info" fontSize="large" />}
              value={subClassCount}
              label="sous-classes"
              onClick={() => onStatClick(1)}
            />
          </Grid>
        )}

        <Grid size={{ xs: 12, sm: 6, md: subClassCount ? 3 : 4 }}>
          <StatCard
            icon={<MenuBookIcon color="secondary" fontSize="large" />}
            value={activityCount}
            label="activités"
            onClick={() => onStatClick(0)}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: subClassCount ? 3 : 4 }}>
          <StatCard
            icon={<AssignmentTurnedInIcon color="success" fontSize="large" />}
            value={correctionCount}
            label="corrections"
            onClick={() => onStatClick(2)}
          />
        </Grid>
      </Grid>
    </Box>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  onClick: () => void;
}

function StatCard({ icon, value, label, onClick }: StatCardProps) {
  return (
    <Paper 
      sx={{ 
        p: 2, 
        textAlign: 'center', 
        height: '100%',
        bgcolor: (theme) => alpha(theme.palette.myBoxes.primary, 0.5),
        backdropFilter: 'blur(5px)',
        borderRadius: 2,
        cursor: 'pointer',
        '&:hover': { transform: 'translateY(-2px)' },
        transition: 'all 0.2s ease'
      }}
      onClick={onClick}
    >
      {icon}
      <Typography variant="h3" fontWeight="bold" color="text.primary">
        {value}
      </Typography>
      <Typography variant="overline" color="text.secondary">{label}</Typography>
    </Paper>
  );
}