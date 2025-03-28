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
  
  // Étendre l'interface PaletteColor pour inclure plus de nuances
  interface PaletteColor {
    50?: string;
    100?: string;
    200?: string;
    300?: string;
    400?: string;
    500?: string;
    600?: string;
    700?: string;
    800?: string;
    900?: string;
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
      main: 'rgb(25, 118, 210)',
      light: 'rgb(66, 165, 245)',
      dark: 'rgb(21, 101, 192)',
      50: 'rgb(227, 242, 253)',
      100: 'rgb(187, 222, 251)',
      200: 'rgb(144, 202, 249)',
      300: 'rgb(100, 181, 246)',
      400: 'rgb(66, 165, 245)',
      500: 'rgb(25, 118, 210)',
      600: 'rgb(21, 101, 192)',
      700: 'rgb(17, 82, 148)',
      800: 'rgb(13, 65, 118)',
      900: 'rgb(8, 47, 87)',
    },
    secondary: {
      main: 'rgb(255, 120, 0)',  // Orange
      light: 'rgb(255, 171, 64)', // Lighter orange
      dark: 'rgb(204, 96, 0)',   // Darker orange
      50: 'rgb(255, 243, 224)',
      100: 'rgb(255, 224, 178)',
      200: 'rgb(255, 204, 128)',
      300: 'rgb(255, 183, 77)',
      400: 'rgb(255, 167, 38)',
      500: 'rgb(255, 120, 0)',
      600: 'rgb(230, 108, 0)',
      700: 'rgb(204, 96, 0)',
      800: 'rgb(179, 84, 0)',
      900: 'rgb(153, 72, 0)',
    },
    success: {
      main: 'rgb(46, 125, 50)',
      light: 'rgb(102, 187, 106)',
      dark: 'rgb(25, 86, 29)',
      50: 'rgb(227, 245, 229)',
      100: 'rgb(197, 225, 201)',
      200: 'rgb(165, 214, 167)',
      300: 'rgb(139, 195, 74)',
      400: 'rgb(102, 187, 106)',
      500: 'rgb(46, 125, 50)',
      600: 'rgb(25, 86, 29)',
      700: 'rgb(0, 77, 64)',
      800: 'rgb(0, 57, 48)',
      900: 'rgb(0, 39, 32)',
    },
    background: {
      default: 'rgb(249, 250, 251)',
      paper: 'rgb(255, 255, 255)',
    },
    text: {
      primary: 'rgb(21, 57, 135)',
      secondary: 'rgb(173, 183, 197)',
    },
    divider: 'rgba(0, 0, 0, 0.12)',
  },
  gradients: {
    ...themeGradients.light,
    secondary: 'linear-gradient(to right, rgb(255, 120, 0), rgb(37, 99, 235))',
  },
} as ThemeOptions);

// Dark theme
export const darkTheme = createTheme({
  ...commonSettings,
  palette: {
    mode: 'dark',
    primary: {
      main: 'rgb(31, 53, 178)',
      light: 'rgb(92, 125, 230)',
      dark: 'rgb(21, 36, 128)',
      50: 'rgb(235, 240, 255)',
      100: 'rgb(205, 220, 255)',
      200: 'rgb(175, 200, 255)',
      300: 'rgb(145, 180, 255)',
      400: 'rgb(115, 160, 245)',
      500: 'rgb(92, 125, 230)',
      600: 'rgb(72, 100, 200)',
      700: 'rgb(52, 75, 170)',
      800: 'rgb(42, 60, 150)',
      900: 'rgb(31, 53, 178)',
    },
    secondary: {
      main: 'rgb(94, 57, 135)',
      light: 'rgb(233, 213, 255)',
      dark: 'rgb(168, 85, 247)',
      50: 'rgb(250, 245, 255)',
      100: 'rgb(243, 232, 255)',
      200: 'rgb(233, 213, 255)',
      300: 'rgb(216, 180, 254)',
      400: 'rgb(192, 132, 252)',
      500: 'rgb(168, 85, 247)',
      600: 'rgb(147, 51, 234)',
      700: 'rgb(126, 34, 206)',
      800: 'rgb(107, 33, 168)',
      900: 'rgb(88, 28, 135)',
    },
    success: {
      main: 'rgb(16, 185, 129)',
      light: 'rgb(52, 211, 153)',
      dark: 'rgb(5, 150, 105)',
      50: 'rgb(236, 253, 245)',
      100: 'rgb(209, 250, 229)',
      200: 'rgb(167, 243, 208)',
      300: 'rgb(110, 231, 183)',
      400: 'rgb(52, 211, 153)',
      500: 'rgb(16, 185, 129)',
      600: 'rgb(5, 150, 105)',
      700: 'rgb(4, 120, 87)',
      800: 'rgb(6, 95, 70)',
      900: 'rgb(6, 78, 59)',
    },
    background: {
      default: 'rgb(19, 39, 82)',
      paper: 'rgb(19, 21, 23)',
    },
    text: {
      primary: 'rgb(249, 250, 251)',
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
      50: 'rgb(239, 246, 255)',  // Ajout des nuances supplémentaires
      100: 'rgb(219, 234, 254)',
      200: 'rgb(191, 219, 254)',
      300: 'rgb(147, 197, 253)',
      400: 'rgb(96, 165, 250)',
      500: 'rgb(59, 130, 246)',
      600: 'rgb(37, 99, 235)',
      700: 'rgb(29, 78, 216)',
      800: 'rgb(30, 64, 175)',
      900: 'rgb(30, 58, 138)',
    },
    secondary: {
      main: 'rgb(16, 185, 129)',
      light: 'rgb(52, 211, 153)',
      dark: 'rgb(5, 150, 105)',
      50: 'rgb(236, 253, 245)',  // Ajout des nuances supplémentaires
      100: 'rgb(209, 250, 229)',
      200: 'rgb(167, 243, 208)',
      300: 'rgb(110, 231, 183)',
      400: 'rgb(52, 211, 153)',
      500: 'rgb(16, 185, 129)',
      600: 'rgb(5, 150, 105)',
      700: 'rgb(4, 120, 87)',
      800: 'rgb(6, 95, 70)',
      900: 'rgb(6, 78, 59)',
    },
    background: {
      default: 'rgb(240, 249, 255)',
      paper: 'rgb(248, 250, 252)',
    },
    text: {
      primary: 'rgb(9, 41, 118)', // Couleur textPrimary pour le thème intermédiaire
      secondary: 'rgb(105, 126, 156)',
    },
    divider: 'rgba(0, 0, 0, 0.08)',
  },
  gradients: themeGradients.intermediate,
} as ThemeOptions);
