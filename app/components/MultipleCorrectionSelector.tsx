'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  CircularProgress,
  Typography,
  Box,
  Alert
} from '@mui/material';
import { Activity } from '@/lib/activity';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';

export default function MultipleCorrectionSelector({ 
  buttonText = 'Corrections multiples',
  variant = 'text',
  color = 'primary',
  size = 'medium'
}: { 
  buttonText?: string,
  variant?: 'text' | 'outlined' | 'contained',
  color?: 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning',
  size?: 'small' | 'medium' | 'large'
}) {
  const [open, setOpen] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivityId, setSelectedActivityId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleOpen = () => {
    setOpen(true);
    fetchActivities();
  };

  const handleClose = () => {
    setOpen(false);
  };

  const fetchActivities = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/activities');
      if (!response.ok) throw new Error('Échec du chargement des activités');
      
      const data = await response.json();
      setActivities(data);
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError('Impossible de charger la liste des activités');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (selectedActivityId) {
      router.push(`/corrections/multiples?activityId=${selectedActivityId}`);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        color={color}
        size={size}
        onClick={handleOpen}
        startIcon={<PeopleAltIcon />}
      >
        {buttonText}
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Sélectionner une activité</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" className="mb-4">
              {error}
            </Alert>
          )}

          {loading ? (
            <Box display="flex" justifyContent="center" my={3}>
              <CircularProgress size={30} />
            </Box>
          ) : activities.length === 0 ? (
            <Typography variant="body1" className="text-center py-4">
              Aucune activité disponible
            </Typography>
          ) : (
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel id="activity-select-label">Activité</InputLabel>
              <Select
                labelId="activity-select-label"
                value={selectedActivityId}
                onChange={(e) => setSelectedActivityId(e.target.value as string)}
                label="Activité"
              >
                {activities.map((activity) => (
                  <MenuItem key={activity.id} value={activity.id}>
                    {activity.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="inherit">
            Annuler
          </Button>
          <Button 
            onClick={handleConfirm} 
            color="primary" 
            variant="contained" 
            disabled={!selectedActivityId || loading}
          >
            Continuer
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
