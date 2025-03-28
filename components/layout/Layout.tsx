import React from 'react';
import { Box, AppBar, Toolbar, Typography, IconButton } from '@mui/material';
import ThemeSwitcher from './ThemeSwitcher';
// Import other components as needed

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          {/* Your app bar content */}
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Correction Sekrane
          </Typography>
          
          {/* Add the theme switcher to your app bar */}
          <ThemeSwitcher />
          
          {/* Other app bar items */}
        </Toolbar>
      </AppBar>
      
      <Box component="main" sx={{ flexGrow: 1 }}>
        {children}
      </Box>
      
      {/* Footer if needed */}
    </Box>
  );
};

export default Layout;
