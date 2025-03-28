'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Typography,
  Box,
  Alert,
  CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

import { Activity } from '@/lib/activity';
import MultipleCorrectionsForm from './MultipleCorrectionsForm';

interface AddCorrectionToGroupModalProps {
  open: boolean;
  onClose: () => void;
  activityId: string | number;
  groupId: string | number;
  onSuccess?: (correctionIds: string[]) => void;
}

export default function AddCorrectionToGroupModal({
  open,
  onClose,
  activityId,
  groupId,
  onSuccess
}: AddCorrectionToGroupModalProps) {
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Fetch activity details when modal opens
    if (open && activityId) {
      fetchActivity();
    }
  }, [open, activityId]);

  const fetchActivity = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`/api/activities/${activityId}`);
      if (!response.ok) {
        throw new Error("Erreur lors du chargement de l'activité");
      }
      
      const activityData = await response.json();
      setActivity(activityData);
    } catch (err) {
      console.error('Error fetching activity:', err);
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = (correctionIds: string[]) => {
    if (onSuccess) {
      onSuccess(correctionIds);
    }
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      scroll="paper"
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid #e0e0e0',
        bgcolor: '#f8f9fa'
      }}>
        <Box>
          <Typography variant="h6" component="span">
            Ajouter des corrections au groupe
          </Typography>
          {activity && (
            <Typography variant="subtitle1" color="text.secondary">
              {activity.name}
            </Typography>
          )}
        </Box>
        <IconButton onClick={onClose} edge="end" aria-label="close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ p: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : (
          <MultipleCorrectionsForm 
          activityId={activityId}
            activity={activity}
            experimentalPoints={activity?.experimental_points || 5}
            theoreticalPoints={activity?.theoretical_points || 15}
            groupId={groupId}
            onSuccess={handleSuccess}
            onCancel={onClose}
            isModal={true}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
