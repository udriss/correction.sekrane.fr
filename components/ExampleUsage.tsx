import React from 'react';
import { Paper, Typography, Container } from '@mui/material';
import PatternBackground from './ui/PatternBackground';

const ExampleUsage: React.FC = () => {
  return (
    <Container maxWidth="md" className="py-8">
      <PatternBackground 
        pattern="cross" 
        opacity={0.05} 
        color="5566AA" 
        size={70}
        sx={{ p: 4, borderRadius: 2 }}
      >
        <Paper elevation={2} className="p-6">
          <Typography variant="h4">Contenu avec fond à motifs</Typography>
          <Typography variant="body1">
            Ce contenu est affiché sur un fond avec un motif répétitif.
          </Typography>
        </Paper>
      </PatternBackground>
    </Container>
  );
};

export default ExampleUsage;
