'use client';

import React from 'react';
import { SnackbarProvider } from 'notistack';
import { ThemeProvider } from '@/theme/ThemeContext';
import { NotificationProvider } from '@/lib/contexts/NotificationContext';
import { DbCleanupProvider } from '@/lib/contexts/DbCleanupContext';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <DbCleanupProvider>
          <SnackbarProvider 
            maxSnack={5}
            autoHideDuration={5000}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            // Adding style for better readability of error messages
            style={{ 
              maxWidth: '80vw', 
              wordBreak: 'break-word' 
            }}
            // Ensure all snackbars have a close button
            action={(key) => (
              <React.Fragment>
                <IconButton size="small" onClick={() => {/* @ts-ignore */ 
                  globalThis.notistack?.closeSnackbar(key)
                }} sx={{ color: 'white' }}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </React.Fragment>
            )}
          >
            {children}
          </SnackbarProvider>
        </DbCleanupProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}
