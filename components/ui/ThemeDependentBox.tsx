'use client';

import React from 'react';
import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';

export default function ThemeDependentBox({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  
  // Safely access theme properties
  const bgColor = theme?.palette?.myBoxes?.primary || '#f0f0f0';
  
  return (
    <Box className="p-3 rounded-lg mt-3 mb-3" sx={{ bgcolor: bgColor }}>
      {children}
    </Box>
  );
}
