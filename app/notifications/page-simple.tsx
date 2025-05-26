'use client';

import React from 'react';
import { Container, Typography, Paper } from '@mui/material';

export default function NotificationsPage() {
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4">Test des notifications</Typography>
        <Typography variant="body1">
          Page de test pour identifier le problème
        </Typography>
      </Paper>
    </Container>
  );
}
