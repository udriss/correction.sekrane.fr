'use client';

import React from 'react';
import { TypographyProps } from '@mui/material';
import ThemedTypography from './ThemedTypography';

interface H1TitleProps extends Omit<TypographyProps, 'variant' | 'component'> {
  children: React.ReactNode;
  gradient?: boolean;
}

/**
 * Composant standardisé pour les titres H1 avec couleurs adaptées au thème
 */
const H1Title: React.FC<H1TitleProps> = ({ 
  children, 
  gradient = false,
  sx,
  ...props 
}) => {
  return (
    <ThemedTypography
      variant="h4"
      component="h1"
      themeColors={{
        light: 'rgb(255, 255, 255)',             // Couleur pour le thème clair
        dark: 'rgb(228, 228, 228)', // Couleur pour le thème sombre
        intermediate: 'rgb(0, 0, 0)',      // Couleur pour le thème intermédiaire
        default: 'rgb(228, 228, 228)' // Couleur pour le thème material UI par défaut
      }}
      gradient={gradient}
      sx={{ 
        fontWeight: 800,
        mb: 0.5,
        ...sx
      }}
      {...props}
    >
      {children}
    </ThemedTypography>
  );
};

export default H1Title;
