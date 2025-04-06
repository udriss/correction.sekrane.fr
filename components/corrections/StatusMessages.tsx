import React from 'react';
import { Snackbar, Alert } from '@mui/material';

interface StatusMessagesProps {
  successMessage: string;
  copiedMessage: string;
  error: string;
}

const StatusMessages: React.FC<StatusMessagesProps> = ({
  successMessage,
  copiedMessage,
  error
}) => {
  if (!successMessage && !copiedMessage && !error) return null;
  
  return (
    <>
      <Snackbar 
        open={!!successMessage} 
        autoHideDuration={6000}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled" onClose={() => {}}>
          {successMessage}
        </Alert>
      </Snackbar>

      <Snackbar 
        open={!!copiedMessage} 
        autoHideDuration={3000}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="info" variant="filled" onClose={() => {}}>
          {copiedMessage}
        </Alert>
      </Snackbar>
      
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" variant="filled" onClose={() => {}}>
          {error}
        </Alert>
      </Snackbar>
    </>
  );
};

export default StatusMessages;
