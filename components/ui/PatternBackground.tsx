import React from 'react';
import { Box, SxProps, Theme } from '@mui/material';

interface PatternBackgroundProps {
  children?: React.ReactNode;
  pattern?: 'cross' | 'dots' | 'diagonal' | 'grid';
  opacity?: number;
  color?: string;
  size?: number;
  sx?: SxProps<Theme>;
}

const patterns = {
  cross: "data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E",
  dots: "data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-opacity='.1' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E",
  diagonal: "data:image/svg+xml,%3Csvg width='6' height='6' viewBox='0 0 6 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-opacity='.1' fill-rule='evenodd'%3E%3Cpath d='M5 0h1L0 6V5zM6 5v1H5z'/%3E%3C/g%3E%3C/svg%3E",
  grid: "data:image/svg+xml,%3Csvg width='10' height='10' viewBox='0 0 10 10' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-opacity='.1' fill-rule='evenodd'%3E%3Cpath d='M0 0h20v20H0V0zm1 1v18h18V1H1z'/%3E%3C/g%3E%3C/svg%3E"
};

const PatternBackground: React.FC<PatternBackgroundProps> = ({
  children,
  pattern = 'cross',
  opacity = 0.25,
  color = '000000',
  size = 70,
  sx = {},
}) => {
  // Replace color in SVG
  const patternSvg = patterns[pattern].replace(/fill='%23000000' fill-opacity='1'/g, 
    `fill='%23${color}' fill-opacity='${opacity}'`);

  return (
    <Box
      sx={{
        position: 'relative',
        backgroundImage: `url("${patternSvg}")`,
        backgroundSize: `${size}px ${size}px`,
        // Enhanced backdrop filter with multiple effects
        backdropFilter: 'blur(5px) ',
        // This creates depth and dimension
        ...sx
      }}
    >
      {children}
    </Box>
  );
};

export default PatternBackground;
