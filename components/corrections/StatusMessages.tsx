import React, { useEffect } from 'react';
import { Box } from '@mui/material';
import { useSnackbar } from 'notistack';

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
  const { enqueueSnackbar } = useSnackbar();

  // Utiliser useEffect pour surveiller les changements des messages
  useEffect(() => {
    if (successMessage) {
      enqueueSnackbar(successMessage, { 
        variant: 'success',
        autoHideDuration: 4000
      });
    }
  }, [successMessage, enqueueSnackbar]);

  useEffect(() => {
    if (copiedMessage) {
      enqueueSnackbar(copiedMessage, { 
        variant: 'info',
        autoHideDuration: 1000
      });
    }
  }, [copiedMessage, enqueueSnackbar]);

  useEffect(() => {
    if (error) {
      enqueueSnackbar(error, { 
        variant: 'error',
        autoHideDuration: 4000
      });
    }
  }, [error, enqueueSnackbar]);

  // Retourner un composant vide puisque les messages sont affichés par les snackbars
  return <Box sx={{ display: 'none' }} />;
};

export default StatusMessages;
