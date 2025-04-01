import React from 'react';
import { Box, Typography, Button } from '@mui/material';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ title, description, action }) => {
  return (
    <Box
      sx={{
        textAlign: 'center',
        p: 4,
        maxWidth: '600px',
        mx: 'auto',
        my: 4,
      }}
    >
      <Typography variant="h5" component="h2" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        {description}
      </Typography>
      {action && (
        <Box mt={2}>
          {action}
        </Box>
      )}
    </Box>
  );
};

export default EmptyState;