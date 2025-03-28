'use client';

import React from 'react';
import { SnackbarProvider } from 'notistack';
import { ThemeProvider } from '@/theme/ThemeContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <SnackbarProvider 
        maxSnack={5}
        autoHideDuration={5000}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        // Adding style for better readability of error messages
        style={{ 
          maxWidth: '80vw', 
          wordBreak: 'break-word' 
        }}
      >
        {children}
      </SnackbarProvider>
    </ThemeProvider>
  );
}
