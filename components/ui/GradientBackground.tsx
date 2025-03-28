'use client';

import React from 'react';
import { Box, useTheme, SxProps, Theme } from '@mui/material';

// Define gradient variants
const gradientMap = {
  primary: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
  secondary: 'linear-gradient(45deg, #9c27b0 30%, #d05ce3 90%)',
  success: 'linear-gradient(45deg, #2e7d32 30%, #4caf50 90%)',
  error: 'linear-gradient(45deg, #d32f2f 30%, #f44336 90%)',
  warning: 'linear-gradient(45deg, #ed6c02 30%, #ff9800 90%)',
  info: 'linear-gradient(45deg, #0288d1 30%, #03a9f4 90%)',
};

type GradientVariant = 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';

interface GradientBackgroundProps {
  variant?: GradientVariant;
  children: React.ReactNode;
  sx?: SxProps<Theme>;
}

export default function GradientBackground({
  variant = 'primary',
  children,
  sx = {},
}: GradientBackgroundProps) {
  const theme = useTheme();
  
  // Use our predefined gradients map or fallback to theme if available
  const gradientBackground = 
    theme.gradients && variant in (theme.gradients as Record<string, string>) 
      ? (theme.gradients as Record<string, string>)[variant] 
      : gradientMap[variant];

  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        background: gradientBackground,
        color: 'white',
        ...sx,
      }}>
      {children}
    </Box>
  );
}
