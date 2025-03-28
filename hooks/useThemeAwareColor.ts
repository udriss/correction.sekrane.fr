'use client';

import { useTheme } from '@mui/material/styles';

type ColorOptions = {
  light?: string;
  dark?: string;
  intermediate?: string;
  default?: string;
};

/**
 * Hook qui retourne une couleur adaptée au thème actuel
 */
export const useThemeAwareColor = (options: ColorOptions): string => {
  const theme = useTheme();
  
  // Déterminer le thème actuel
  const currentTheme = 
    theme.palette.mode === 'dark' ? 'dark' :
    theme.palette.primary.main === '#3b82f6' ? 'intermediate' :
    theme.palette.primary.main === '#1976d2' ? 'default' : 'light';
  
  // Retourner la couleur correspondante ou une couleur par défaut
  return options[currentTheme] || theme.palette.text.primary;
};
