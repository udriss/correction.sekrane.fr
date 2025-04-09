'use client';

import React from 'react';
import { Box, Typography, CircularProgress, useTheme, alpha } from '@mui/material';
import { keyframes } from '@mui/system';

interface LoadingSpinnerProps {
  /** Size of the spinner - sm: small, md: medium, lg: large, xl: extra large */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Color theme for the spinner */
  color?: string;
  /** Custom loading message to display (defaults to "Chargement en cours") */
  text?: string | null;
  /** Whether to hide the text completely */
  hideText?: boolean;
}

/**
 * A versatile loading spinner component with customizable size, color and text
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md',
  color = 'primary',
  text = 'Chargement en cours',
  hideText = false
}) => {
  const theme = useTheme();
  
  // Map size to specific pixel values for Material UI
  const sizeMap = {
    sm: 24,
    md: 40,
    lg: 64,
    xl: 80
  };

  // Map color names to theme colors
  const getThemeColor = (colorName: string) => {
    switch (colorName) {
      case 'primary': return theme.palette.primary.main;
      case 'secondary': return theme.palette.secondary.main;
      case 'error': return theme.palette.error.main;
      case 'warning': return theme.palette.warning.main;
      case 'info': return theme.palette.info.main;
      case 'success': return theme.palette.success.main;
      default: return theme.palette.primary.main;
    }
  };

  const spinnerSize = sizeMap[size as keyof typeof sizeMap];
  const spinnerColor = getThemeColor(color);
  
  // Create pulse animation
  const pulseAnimation = keyframes`
    0% { opacity: 0.2; transform: scale(0.95); }
    50% { opacity: 0.5; transform: scale(1.05); }
    100% { opacity: 0.2; transform: scale(0.95); }
  `;

  // Loading bar animation
  const loadingBarAnimation = keyframes`
    0% { transform: translateX(-100%); }
    50% { transform: translateX(0); }
    100% { transform: translateX(100%); }
  `;
  
  // Dynamic dots for animation
  const [dots, setDots] = React.useState('.');
  
  React.useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length < 3 ? prev + '.' : '.');
    }, 400);
    
    return () => clearInterval(interval);
  }, []);

  // Display message - use provided text or default
  const displayText = text !== null ? text : 'Chargement en cours';

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      p: 2, 
      width: '100%'
    }}>
      <Box sx={{ 
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        {/* Background glow effect */}
        <Box sx={{
          position: 'absolute',
          width: spinnerSize + 16,
          height: spinnerSize + 16,
          borderRadius: '50%',
          bgcolor: alpha(spinnerColor, 0.15),
          animation: `${pulseAnimation} 2s ease-in-out infinite`,
          filter: 'blur(8px)'
        }} />
        
        {/* Secondary spinner (optional decorative layer) */}
        <Box sx={{
          position: 'absolute',
          width: spinnerSize + 8,
          height: spinnerSize + 8,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <CircularProgress
            variant="determinate"
            value={30}
            size={spinnerSize + 8}
            thickness={2}
            sx={{ 
              color: alpha(spinnerColor, 0.3),
              animationDuration: '3s'
            }}
          />
        </Box>
        
        {/* Main spinner */}
        <CircularProgress 
          size={spinnerSize}
          thickness={4}
          sx={{ 
            color: spinnerColor,
            zIndex: 1
          }} 
        />
      </Box>
      
      {!hideText && displayText && (
        <Box sx={{ 
          mt: 2, 
          textAlign: 'center', 
          width: '100%',
          maxWidth: 300
        }}>
          {/* Text container with fixed height to prevent layout shifts */}
          <Box sx={{ 
            height: 32, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <Typography variant="body1" sx={{ color: theme => theme.palette.text.primary, fontWeight: 500 }}>
              <span>{displayText}</span>
              <Box component="span" sx={{ 
                display: 'inline-block', 
                width: 28, 
                textAlign: 'left' 
              }}>
                {dots}
              </Box>
            </Typography>
          </Box>
          
          {/* Progress bar */}
          <Box sx={{ 
            mt: 1,
            height: 4,
            width: '100%',
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            borderRadius: 1,
            overflow: 'hidden'
          }}>
            <Box sx={{ 
              height: '100%',
              width: '100%',
              bgcolor: spinnerColor,
              animation: `${loadingBarAnimation} 2s linear infinite`,
              borderRadius: 'inherit'
            }} />
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default LoadingSpinner;
