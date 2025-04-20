import React from 'react';
import { Box, Button, Card, CardActions, CardContent, Chip, Paper, Typography } from '@mui/material';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import Link from 'next/link';
import { ActivityAutre } from '@/lib/types';

interface ActivitiesListProps {
  activities: ActivityAutre[];
  correctionCounts: Record<number, number>;
  onAssociateClick: () => void;
  onCreateCorrections: (activityId: number) => void;
  loading?: boolean;
}

export function ActivitiesList({
  activities,
  correctionCounts,
  onAssociateClick,
  onCreateCorrections,
  loading = false
}: ActivitiesListProps) {
  if (loading) {
    return <Paper className="p-8 text-center">Chargement des activités...</Paper>;
  }

  return (
    <Paper sx={{ p: 2, mb: 3 }} elevation={1}>
      <Box className="mb-4 flex justify-end items-center gap-4">
        <Button 
          variant="outlined" 
          startIcon={<MenuBookIcon />}
          component={Link} 
          href="/activities/new"
        >
          Nouvelle activité
        </Button>
        <Button 
          variant="outlined" 
          startIcon={<MenuBookIcon />}
          onClick={onAssociateClick}
        >
          Associer des activités
        </Button>
      </Box>

      {activities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activities.map((activity) => (
            <Card key={activity.id} className="hover:shadow-lg transition-shadow">
              <CardContent>
                <Typography variant="h6" component="h3">
                  {activity.name}
                </Typography>
                <Box className="flex gap-2 mt-2 flex-wrap">
                  {activity.points && activity.parts_names ? (
                    activity.parts_names.map((name, index) => (
                      <Chip 
                        key={index}
                        label={`${name}: ${activity.points[index]} pts`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    ))
                  ) : (
                    <Chip 
                      label={`${activity.points?.reduce((a, b) => a + b, 0) || 0} points`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  )}
                  <Chip 
                    label={`${correctionCounts[activity.id] || 0} correction${correctionCounts[activity.id] !== 1 ? 's' : ''}`}
                    size="small"
                    color="info"
                    variant="outlined"
                    icon={<AssignmentTurnedInIcon fontSize="small" />}
                  />
                </Box>
              </CardContent>
              <CardActions>
                <Button 
                  size="small" 
                  component={Link}
                  href={`/activities/${activity.id}`}
                >
                  Voir détails
                </Button>
                <Button 
                  size="small"
                  onClick={() => onCreateCorrections(activity.id)}
                >
                  Nouvelles corrections
                </Button>
              </CardActions>
            </Card>
          ))}
        </div>
      ) : (
        <Paper className="p-8 text-center">
          <Typography variant="h6" className="mb-2">Aucune activité</Typography>
          <Typography variant="body2" sx={{mb: 2, color: 'text.secondary' }}>
            Associez des activités à cette classe pour commencer
          </Typography>
          <Button
            variant="contained"
            startIcon={<MenuBookIcon />}
            onClick={onAssociateClick}
          >
            Associer des activités
          </Button>
        </Paper>
      )}
    </Paper>
  );
}