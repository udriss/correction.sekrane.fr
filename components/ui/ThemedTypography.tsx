'use client';

import React from 'react';
import { Typography, TypographyProps, useTheme } from '@mui/material';

interface ThemedTypographyProps extends TypographyProps {
  gradient?: boolean;
  colorVariant?: 'primary' | 'secondary' | 'success' | 'error' | 'warning';
  shadow?: boolean;
  // Propriété pour spécifier des couleurs différentes selon le thème
  themeColors?: {
    light?: string;
    dark?: string;
    intermediate?: string;
    default?: string;
  };
}

const ThemedTypography: React.FC<ThemedTypographyProps> = ({
  children,
  gradient = false,
  colorVariant = 'primary',
  shadow = false,
  themeColors,
  sx,
  ...props
}) => {
  const theme = useTheme();
  
  // Déterminer la couleur basée sur le mode du thème
  const getThemeColor = () => {
    if (!themeColors) return undefined;
    
    // Vérifier si nous avons un thème personnalisé par son nom
    const customThemeName = 
      theme.palette.mode === 'dark' ? 'dark' :
      theme.palette.primary.main === '#3b82f6' ? 'intermediate' :
      theme.palette.primary.main === '#1976d2' ? 'default' : 'light';
    
    // Retourner la couleur correspondante au thème ou undefined
    return themeColors[customThemeName];
  };
  
  const themeColor = getThemeColor();
  
  if (gradient) {
    return (
      <Typography
        sx={{
          background: colorVariant && colorVariant in theme.gradients 
            ? theme.gradients[colorVariant as keyof typeof theme.gradients]
            : theme.gradients.primary,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          textFillColor: 'transparent', 
          display: 'inline-block',
          ...(shadow && {
            textShadow: theme.palette.mode === 'dark' 
              ? '0 2px 10px rgba(255,255,255,0.15)' 
              : '0 2px 10px rgba(0,0,0,0.15)'
          }),
          ...sx
        }}
        {...props}
      >
        {children}
      </Typography>
    );
  }
  
  return (
    <Typography
      sx={{
        // Utiliser la couleur spécifique au thème si disponible, sinon utiliser la couleur de la variante
        color: themeColor || theme.palette[colorVariant]?.main || 'inherit',
        ...(shadow && {
          textShadow: theme.palette.mode === 'dark' 
            ? '0 2px 8px rgba(0,0,0,0.3)' 
            : '0 2px 8px rgba(0,0,0,0.15)'
        }),
        ...sx
      }}
      {...props}
    >
      {children}
    </Typography>
  );
};

export default ThemedTypography;
