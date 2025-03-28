'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeProvider as MUIThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { lightTheme, darkTheme, intermediateTheme, defaultTheme } from './themes';

type ThemeMode = 'default' | 'light' | 'dark' | 'intermediate';

interface ThemeContextType {
  mode: ThemeMode;
  toggleMode: (newMode?: ThemeMode) => void;
  theme: ReturnType<typeof createTheme>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Get saved theme from localStorage or use light as default
  const [mode, setMode] = useState<ThemeMode>('light');
  const [theme, setTheme] = useState(lightTheme);
  const [mounted, setMounted] = useState(false);

  // Initialize theme from localStorage on component mount
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme') as ThemeMode;
    if (savedTheme && ['default', 'light', 'dark', 'intermediate'].includes(savedTheme)) {
      setMode(savedTheme);
      setTheme(
        savedTheme === 'light' ? lightTheme : 
        savedTheme === 'dark' ? darkTheme :
        savedTheme === 'intermediate' ? intermediateTheme :
        defaultTheme
      );
    }
  }, []);

  // Toggle between theme modes
  const toggleMode = (newMode?: ThemeMode) => {
    const nextMode = newMode || (
      mode === 'default' ? 'light' :
      mode === 'light' ? 'dark' : 
      mode === 'dark' ? 'intermediate' : 
      'default'
    );
    
    setMode(nextMode);
    
    const nextTheme = 
      nextMode === 'light' ? lightTheme : 
      nextMode === 'dark' ? darkTheme :
      nextMode === 'intermediate' ? intermediateTheme :
      defaultTheme;
    
    setTheme(nextTheme);
    
    // Save theme preference to localStorage for persistence
    localStorage.setItem('theme', nextMode);
  };

  // Avoid theme flash by only rendering after mounting on client
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ mode, toggleMode, theme }}>
      <MUIThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MUIThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useThemeContext = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
};
