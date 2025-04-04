import React from 'react';
import { Snackbar, Theme, alpha } from '@mui/material';

interface NotificationSnackbarProps {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
  theme: Theme;
}

export const NotificationSnackbar: React.FC<NotificationSnackbarProps> = ({
  open,
  message,
  severity,
  onClose,
  theme
}) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={3000}
      onClose={onClose}
      message={message}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      ContentProps={{
        sx: {
          borderRadius: 2,
          bgcolor: severity === 'success' 
            ? theme.palette.success.dark 
            : severity === 'error'
              ? theme.palette.error.dark
              : theme.palette.info.dark
        }
      }}
    />
  );
};
