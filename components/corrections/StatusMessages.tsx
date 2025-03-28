import React from 'react';
import { Paper, Alert } from '@mui/material';

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
    <div className="mt-2">
      {successMessage && (
        <Paper className="shadow mt-2">
          <Alert severity="success">
            {successMessage}
          </Alert>
        </Paper>
      )}

      {copiedMessage && (
        <Paper className="shadow mt-2">
          <Alert severity="info">
            {copiedMessage}
          </Alert>
        </Paper>
      )}
      
      {error && (
        <Paper className="shadow mt-2">
          <Alert severity="error">
            {error}
          </Alert>
        </Paper>
      )}
    </div>
  );
};

export default StatusMessages;
