import { createTheme, ThemeOptions } from '@mui/material/styles';

// Définition des gradients pour chaque thème
const themeGradients = {
  light: {
    primary: 'linear-gradient(to right, rgb(88, 28, 135), rgb(7, 0, 193))',
    secondary: 'linear-gradient(to right, rgb(126, 34, 206), rgb(37, 99, 235))',
    success: 'linear-gradient(to right, rgb(4, 120, 87), rgb(13, 148, 136))',
    warning: 'linear-gradient(to right, rgb(180, 83, 9), rgb(217, 119, 6))',
    error: 'linear-gradient(to right, rgb(185, 28, 28), rgb(239, 68, 68))',
  },
  dark: {
    primary: 'linear-gradient(to right, rgb(71, 7, 130), rgb(96, 103, 162))',
    secondary: 'linear-gradient(to right, rgb(217, 70, 239), rgb(139, 92, 246))',
    success: 'linear-gradient(to right, rgb(16, 185, 129), rgb(20, 184, 166))',
    warning: 'linear-gradient(to right, rgb(245, 158, 11), rgb(251, 191, 36))',
    error: 'linear-gradient(to right, rgb(220, 38, 38), rgb(248, 113, 113))',
  },
  intermediate: {
    primary: 'linear-gradient(to right, rgb(59, 130, 246), rgb(6, 182, 212))',
    secondary: 'linear-gradient(to right, rgb(139, 92, 246), rgb(99, 102, 241))',
    success: 'linear-gradient(to right, rgb(16, 185, 129), rgb(52, 211, 153))',
    warning: 'linear-gradient(to right, rgb(245, 158, 11), rgb(252, 211, 77))',
    error: 'linear-gradient(to right, rgb(239, 68, 68), rgb(248, 113, 113))',
  },
  default: {
    primary: 'linear-gradient(to right, rgb(25, 118, 210), rgb(66, 165, 245))',
    secondary: 'linear-gradient(to right, rgb(156, 39, 176), rgb(186, 104, 200))',
    success: 'linear-gradient(to right, rgb(46, 125, 50), rgb(102, 187, 106))',
    warning: 'linear-gradient(to right, rgb(237, 108, 2), rgb(255, 167, 38))',
    error: 'linear-gradient(to right, rgb(211, 47, 47), rgb(239, 83, 80))',
  },
};

// Declare module for custom theme props
declare module '@mui/material/styles' {
  interface Theme {
    gradients: typeof themeGradients.light;
  }
  interface ThemeOptions {
    gradients?: typeof themeGradients.light;
  }
}

// Common theme settings
const commonSettings: Partial<ThemeOptions> = {
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        } as any, // Type assertion to avoid incompatible type errors
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 8,
        } as any,
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        } as any,
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
        } as any,
      },
    },
  },
};

// Default Material UI theme with some minimal tweaks
export const defaultTheme = createTheme({
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        } as any,
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 8,
        } as any,
      },
    },
  },
  gradients: themeGradients.default,
} as ThemeOptions);

// Light theme
export const lightTheme = createTheme({
  ...commonSettings,
  palette: {
    mode: 'light',
    primary: {
      main: 'rgb(88, 28, 135)',
      light: 'rgb(126, 58, 191)',
      dark: 'rgb(59, 7, 100)',
    },
    secondary: {
      main: 'rgb(147, 51, 234)',
      light: 'rgb(168, 85, 247)',
      dark: 'rgb(126, 34, 206)',
    },
    background: {
      default: 'rgb(249, 250, 251)',
      paper: 'rgb(255, 255, 255)',
    },
    text: {
      primary: 'rgb(17, 24, 39)', // Couleur textPrimary pour le thème clair
      secondary: 'rgb(75, 85, 99)',
    },
    divider: 'rgba(0, 0, 0, 0.12)',
  },
  gradients: themeGradients.light,
} as ThemeOptions);

// Dark theme
export const darkTheme = createTheme({
  ...commonSettings,
  palette: {
    mode: 'dark',
    primary: {
      main: 'rgb(168, 85, 247)',
      light: 'rgb(192, 132, 252)',
      dark: 'rgb(126, 34, 206)',
    },
    secondary: {
      main: 'rgb(216, 180, 254)',
      light: 'rgb(233, 213, 255)',
      dark: 'rgb(168, 85, 247)',
    },
    background: {
      default: 'rgb(17, 24, 39)',
      paper: 'rgb(31, 41, 55)',
    },
    text: {
      primary: 'rgb(249, 250, 251)', // Couleur textPrimary pour le thème sombre
      secondary: 'rgb(209, 213, 219)',
    },
    divider: 'rgba(255, 255, 255, 0.12)',
  },
  gradients: themeGradients.dark,
} as ThemeOptions);

// Intermediate theme (a more colorful, less contrasting theme)
export const intermediateTheme = createTheme({
  ...commonSettings,
  palette: {
    mode: 'light',
    primary: {
      main: 'rgb(59, 130, 246)',
      light: 'rgb(96, 165, 250)',
      dark: 'rgb(37, 99, 235)',
    },
    secondary: {
      main: 'rgb(16, 185, 129)',
      light: 'rgb(52, 211, 153)',
      dark: 'rgb(5, 150, 105)',
    },
    background: {
      default: 'rgb(240, 249, 255)',
      paper: 'rgb(248, 250, 252)',
    },
    text: {
      primary: 'rgb(15, 23, 42)', // Couleur textPrimary pour le thème intermédiaire
      secondary: 'rgb(51, 65, 85)',
    },
    divider: 'rgba(0, 0, 0, 0.08)',
  },
  gradients: themeGradients.intermediate,
} as ThemeOptions);
