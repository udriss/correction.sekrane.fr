'use client';

import React from 'react';
import { Container, Typography, Paper } from '@mui/material';
import PatternBackground from '@/components/ui/PatternBackground';

export default function ExamplePage() {
  return (
    <Container maxWidth="lg">
      <PatternBackground pattern="dots" color="3366CC" opacity={0.08} size={50}>
        <Paper elevation={3} sx={{ p: 4, my: 4 }}>
          <Typography variant="h3">Page avec un fond à motifs</Typography>
          <Typography variant="body1">
            Cette page utilise le composant PatternBackground pour afficher un fond avec motifs.
          </Typography>
        </Paper>
      </PatternBackground>
    </Container>
  );
}
