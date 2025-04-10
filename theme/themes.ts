import { createTheme, ThemeOptions } from '@mui/material/styles';

// Define gradient map with more harmonious color combinations for each theme
const themeGradients = {
  light: {
    primary: 'linear-gradient(135deg,rgba(173, 214, 255, 0.74),rgba(245, 147, 66, 0.3))',
    secondary: 'linear-gradient(135deg, #ff7800, #ff9d50)',
    success: 'linear-gradient(135deg, #2e7d32, #66bb6a)',
    warning: 'linear-gradient(135deg, #ed6c02, #ffa726)',
    error: 'linear-gradient(135deg, #d32f2f, #ef5350)',
    info: 'linear-gradient(135deg,rgb(147, 204, 236),rgb(76, 204, 243))',
  },
  dark: {
    primary: 'linear-gradient(135deg, #1f35b2, #3f51b5)',
    secondary: 'linear-gradient(135deg, #5e3987, #8e24aa)',
    success: 'linear-gradient(135deg, #1b5e20, #388e3c)',
    warning: 'linear-gradient(135deg, #e65100, #ef6c00)',
    error: 'linear-gradient(135deg, #b71c1c, #c62828)',
    info: 'linear-gradient(135deg,rgb(11, 75, 123),rgb(1, 110, 140)89, 164))',
  },
  intermediate: {
    primary: 'linear-gradient(135deg,rgb(156, 194, 255),rgb(97, 231, 255))',
    secondary: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
    success: 'linear-gradient(135deg, #10b981, #34d399)',
    warning: 'linear-gradient(135deg, #f59e0b, #fcd34d)',
    error: 'linear-gradient(135deg, #ef4444, #f87171)',
    info: 'linear-gradient(135deg,rgb(143, 190, 216),rgba(24, 180, 223, 0.71))',
  },
  default: {
    primary: 'linear-gradient(135deg, #1976d2, #42a5f5)',
    secondary: 'linear-gradient(135deg, #9c27b0, #ba68c8)',
    success: 'linear-gradient(135deg, #2e7d32, #66bb6a)',
    warning: 'linear-gradient(135deg, #ed6c02, #ffa726)',
    error: 'linear-gradient(135deg, #d32f2f, #ef5350)',
    info: 'linear-gradient(135deg,rgb(143, 190, 216),rgba(24, 180, 223, 0.71))',
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
  
  // Define the myBoxes interface
  interface MyBoxesColorOptions {
    primary: string;
    secondary: string;
  }
  
  // Extend the Palette and PaletteOptions interfaces to include myBoxes
  interface Palette {
    myBoxes: MyBoxesColorOptions;
  }
  
  interface PaletteOptions {
    myBoxes?: Partial<MyBoxesColorOptions>;
  }
  
  // Étendre l'interface PaletteColor pour inclure plus de nuances
  interface PaletteColor {
    lighter?: string; // Add the 'lighter' property to support our custom shade
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
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root, & .MuiFilledInput-root': {
            transition: 'background-color 0.2s ease-in-out',
          }
        }
      }
    },
  },
  palette: {
    warning: {
      light: '#FFC107', // Ambre clair
      main: '#FF9800',  // Orange standard
      dark: '#ED6C02',  // Orange foncé
    },
    error: {
      light: '#EF5350', // Rouge clair
      main: '#D32F2F',  // Rouge standard
      dark: '#C62828',  // Rouge foncé
    },
    success: {
      // lighter: '#C8E6C9', // Vert très clair (plus doux)
      light: '#66BB6A', // Vert clair
      main: '#2E7D32',  // Vert standard
      dark: '#1B5E20',  // Vert foncé
    }
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
  palette: {
    myBoxes: {
      primary: 'rgb(33, 43, 54)', // Dark gray for better readability
      secondary: 'rgb(99, 115, 129)',
    },
    warning: {
      light: '#FFC107', // Ambre clair
      main: '#FF9800',  // Orange standard
      dark: '#ED6C02',  // Orange foncé
    },
    error: {
      light: '#EF5350', // Rouge clair
      main: '#D32F2F',  // Rouge standard
      dark: '#C62828',  // Rouge foncé
    },
    success: {
      lighter: '#C8E6C9', // Vert très clair (plus doux)
      light: '#66BB6A', // Vert clair
      main: '#2E7D32',  // Vert standard
      dark: '#1B5E20',  // Vert foncé
    }
  },
  gradients: themeGradients.default,
} as ThemeOptions);

// Light theme
export const lightTheme = createTheme({
  ...commonSettings,
  palette: {
    mode: 'light',
    primary: {
      main: 'rgb(25, 118, 210)', // Blue
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
      main: 'rgba(255, 119, 0, 0.39)',  // Orange - works well with blue
      light: 'rgb(255, 171, 64)', 
      dark: 'rgb(204, 96, 0)',   
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
      lighter: '#C8E6C9', // Vert très clair
      main: 'rgb(46, 125, 50)',
      light: 'rgb(102, 187, 106)',
      dark: 'rgb(27, 94, 32)',
      50: 'rgb(232, 245, 233)',
      100: 'rgb(200, 230, 201)',
      200: 'rgb(165, 214, 167)',
      300: 'rgb(129, 199, 132)',
      400: 'rgb(102, 187, 106)',
      500: 'rgb(76, 175, 80)',
      600: 'rgb(56, 142, 60)',
      700: 'rgb(46, 125, 50)',
      800: 'rgb(27, 94, 32)',
      900: 'rgb(0, 77, 64)',
    },
    warning: {
      light: '#FFC107', // Ambre clair - pour les notes entre 10-12
      main: '#FF9800',  // Orange standard - pour les notes entre 5-10
      dark: '#ED6C02',  // Orange foncé
      50: 'rgb(255, 243, 224)',
      100: 'rgb(255, 224, 178)',
      200: 'rgb(255, 204, 128)',
      300: 'rgb(255, 183, 77)',
      400: 'rgb(255, 167, 38)',
      500: 'rgb(255, 151, 0)',
      600: 'rgb(237, 108, 2)',
      700: 'rgb(230, 81, 0)',
      800: 'rgb(211, 47, 47)',
      900: 'rgb(183, 28, 28)',
    },
    error: {
      light: '#EF5350', // Rouge clair - pour les très mauvaises notes (plus visible)
      main: '#D32F2F',  // Rouge standard - pour les mauvaises notes 
      dark: '#C62828',  // Rouge foncé
      50: 'rgb(254, 242, 242)',
      100: 'rgb(254, 226, 226)',
      200: 'rgb(254, 202, 202)',
      300: 'rgb(252, 165, 165)',
      400: 'rgb(248, 113, 113)',
      500: 'rgb(239, 68, 68)',
      600: 'rgb(220, 38, 38)',
      700: 'rgb(185, 28, 28)',
      800: 'rgb(153, 27, 27)',
      900: 'rgb(127, 29, 29)',
    },
    background: {
      default: 'rgb(249, 250, 251)',
      paper: 'rgb(255, 255, 255)',
    },
    text: {
      primary: 'rgb(33, 43, 54)', // Dark gray for better readability
      secondary: 'rgb(99, 115, 129)',
    },
    myBoxes: {
      primary: 'rgba(200, 211, 221, 0.16)', // Dark gray for better readability
      secondary: 'rgb(203, 220, 234)',
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
      main: 'rgb(31, 53, 178)', // Deep blue
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
      main: 'rgb(94, 57, 135)', // Purple - complements deep blue in dark theme
      light: 'rgb(168, 85, 247)',
      dark: 'rgb(83, 37, 135)',
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
      lighter: '#B7DFCA', // Vert très clair pour le thème sombre
      main: 'rgb(16, 185, 129)', // Brighter green for dark theme for better contrast
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
    warning: {
      light: '#FFD54F', // Plus clair pour le dark theme
      main: '#FFC107',  // Ambre pour le dark theme
      dark: '#FFA000',  // Ambre foncé pour le dark theme
      50: 'rgb(255, 248, 225)',
      100: 'rgb(255, 236, 179)',
      200: 'rgb(255, 224, 130)',
      300: 'rgb(255, 213, 79)',
      400: 'rgb(255, 202, 40)',
      500: 'rgb(255, 193, 7)',
      600: 'rgb(255, 160, 0)',
      700: 'rgb(255, 143, 0)',
      800: 'rgb(255, 111, 0)',
      900: 'rgb(255, 87, 34)',
    },
    error: {
      light: '#EF9A9A', // Rouge plus clair pour le dark theme
      main: '#F44336',  // Rouge standard pour le dark theme
      dark: '#C62828',  // Rouge foncé pour le dark theme
      50: 'rgb(254, 242, 242)',
      100: 'rgb(254, 226, 226)',
      200: 'rgb(254, 202, 202)',
      300: 'rgb(252, 165, 165)',
      400: 'rgb(248, 113, 113)',
      500: 'rgb(239, 68, 68)',
      600: 'rgb(220, 38, 38)',
      700: 'rgb(185, 28, 28)',
      800: 'rgb(153, 27, 27)',
      900: 'rgb(127, 29, 29)',
    },
    background: {
      default: 'rgb(22, 28, 36)', 
      paper: 'rgb(33, 43, 54)',
      // Add a new light background color for inputs in dark mode
      input: 'rgb(45, 55, 72)',
    },
    text: {
      primary: 'rgb(255, 255, 255)',
      secondary: 'rgb(145, 158, 171)',
    },
    myBoxes: {
      primary: 'rgb(28, 56, 84)',
      secondary: 'rgb(28, 56, 84)',
    },
    divider: 'rgba(255, 255, 255, 0.12)',
  },
  components: {
    ...commonSettings.components,
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root, & .MuiFilledInput-root': {
            backgroundColor: 'rgb(45, 55, 72)', // Lighter than the paper color for dark mode
            '&:hover': {
              backgroundColor: 'rgb(55, 65, 81)',
            },
            '&.Mui-focused': {
              backgroundColor: 'rgb(55, 65, 81)',
            }
          }
        }
      }
    }
  },
  gradients: themeGradients.dark,
} as ThemeOptions);

// Intermediate theme (more balanced, colorful theme)
export const intermediateTheme = createTheme({
  ...commonSettings,
  palette: {
    mode: 'light',
    primary: {
      main: 'rgb(59, 130, 246)', // Sky blue - more vibrant
      light: 'rgb(96, 165, 250)',
      dark: 'rgb(10, 58, 162)',
      50: 'rgb(239, 246, 255)',
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
      main: 'rgb(139, 92, 246)', // Violet - complements sky blue
      light: 'rgb(167, 139, 250)',
      dark: 'rgb(124, 58, 237)',
      50: 'rgb(245, 243, 255)',
      100: 'rgb(237, 233, 254)',
      200: 'rgb(221, 214, 254)',
      300: 'rgb(196, 181, 253)',
      400: 'rgb(167, 139, 250)',
      500: 'rgb(139, 92, 246)',
      600: 'rgb(124, 58, 237)',
      700: 'rgb(109, 40, 217)',
      800: 'rgb(91, 33, 182)',
      900: 'rgb(76, 29, 149)',
    },
    warning: {
      light: '#FDD835', // Jaune vif clair pour le thème intermédiaire
      main: '#F59E0B', // Ambre/orange pour le thème intermédiaire
      dark: '#D97706', // Ambre/orange foncé
      50: 'rgb(255, 251, 235)',
      100: 'rgb(254, 243, 199)',
      200: 'rgb(253, 230, 138)',
      300: 'rgb(252, 211, 77)',
      400: 'rgb(251, 191, 36)',
      500: 'rgb(245, 158, 11)',
      600: 'rgb(217, 119, 6)',
      700: 'rgb(180, 83, 9)',
      800: 'rgb(146, 64, 14)',
      900: 'rgb(120, 53, 15)',
    },
    success: {
      lighter: '#C8EDDE', // Vert très clair pour le thème intermédiaire
      light: '#34D399', // Vert clair plus vif pour le thème intermédiaire
      main: '#10B981', // Vert standard
      dark: '#059669', // Vert foncé
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
    error: {
      light: '#F87171', // Rouge clair pour le thème intermédiaire
      main: '#EF4444', // Rouge standard
      dark: '#DC2626', // Rouge foncé
      50: 'rgb(254, 242, 242)',
      100: 'rgb(254, 226, 226)',
      200: 'rgb(254, 202, 202)',
      300: 'rgb(252, 165, 165)',
      400: 'rgb(248, 113, 113)',
      500: 'rgb(239, 68, 68)',
      600: 'rgb(220, 38, 38)',
      700: 'rgb(185, 28, 28)',
      800: 'rgb(153, 27, 27)',
      900: 'rgb(127, 29, 29)',
    },
    background: {
      default: 'rgb(249, 250, 252)',
      paper: 'rgb(255, 255, 255)',
    },
    text: {
      primary: 'rgb(17, 24, 39)', // Better contrast than pure black
      secondary: 'rgb(67, 92, 143)',
    },
    myBoxes: {
      primary: 'rgb(232, 232, 232)',
      secondary: 'rgb(141, 194, 241)',
    },
    divider: 'rgba(0, 0, 0, 0.08)',
  },
  gradients: themeGradients.intermediate,
} as ThemeOptions);
