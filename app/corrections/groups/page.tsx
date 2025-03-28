'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Typography, 
  Paper, 
  Box, 
  Button,
  Alert
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Link from 'next/link';

// Définition du type pour un groupe
interface CorrectionGroup {
  id: number;
  name: string;
  created_at: string;
  correction_count: number;
  activity_name?: string;
  description?: string;
}

// Cette page n'est plus utilisée directement, on redirige vers la nouvelle structure
export default function CorrectionGroupsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activityId = searchParams?.get('activityId') || null;
  
  useEffect(() => {
    // Si un activityId est fourni, rediriger vers la nouvelle route
    if (activityId) {
      router.replace(`/activities/${activityId}/groups`);
    }
  }, [activityId, router]);

  return (
    <div className="container mx-auto px-4 py-8">
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h4">Groupes de corrections</Typography>
        <Button 
          component={Link} 
          href="/activities"
          startIcon={<ArrowBackIcon />}
          variant="outlined"
        >
          Retour aux activités
        </Button>
      </Box>

      <Paper className="p-6 text-center">
        <Alert severity="info" className="mb-4">
          Cette page a été déplacée. Les groupes de corrections sont maintenant accessibles depuis la page de l'activité correspondante.
        </Alert>
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => router.push('/activities')}
        >
          Voir la liste des activités
        </Button>
      </Paper>
    </div>
  );
}