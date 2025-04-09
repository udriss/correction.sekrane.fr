import React from 'react';
import { Alert, Box } from '@mui/material';
import { Fade } from '@mui/material';

interface StatusMessagesProps {
  successMessage: string;
  copiedMessage: string;
  error?: string; // Gardons-le optionnel pour la compatibilité
}

const StatusMessages: React.FC<StatusMessagesProps> = ({
  successMessage,
  copiedMessage,
  error,
}) => {
  return (
    <Box sx={{ mt: 2, mb: 2 }}>
      {successMessage && (
        <Fade in={!!successMessage}>
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMessage}
          </Alert>
        </Fade>
      )}

      {copiedMessage && (
        <Fade in={!!copiedMessage}>
          <Alert severity="info" sx={{ mb: 2 }}>
            {copiedMessage}
          </Alert>
        </Fade>
      )}
      
      {/* Nous ne montrons plus l'erreur ici puisqu'elle est affichée par ErrorDisplay */}
    </Box>
  );
};

export default StatusMessages;
