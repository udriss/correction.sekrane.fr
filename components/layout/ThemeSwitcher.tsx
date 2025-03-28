'use client';

import React from 'react';
import { IconButton, Tooltip, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightness';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import { useThemeContext } from '@/theme/ThemeContext';

const ThemeSwitcher: React.FC = () => {
  const { mode, toggleMode } = useThemeContext();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleThemeChange = (themeMode: 'default' | 'light' | 'dark' | 'intermediate') => {
    toggleMode(themeMode);
    handleClose();
  };
  
  return (
    <>
      <Tooltip title="Changer de thème">
        <IconButton onClick={handleClick} color="inherit" size="small" sx={{ ml: 1 }}>
          {mode === 'light' ? <LightModeIcon /> : 
           mode === 'dark' ? <DarkModeIcon /> : 
           mode === 'default' ? <AutoFixHighIcon /> :
           <SettingsBrightnessIcon />}
        </IconButton>
      </Tooltip>
      
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: { 
            mt: 1.5, 
            boxShadow: 3,
            borderRadius: 2,
            minWidth: 200
          }
        }}
      >
        <MenuItem 
          onClick={() => handleThemeChange('default')}
          selected={mode === 'default'}
          sx={{ 
            minWidth: '180px', 
            py: 1.5,
            borderLeft: mode === 'default' ? 3 : 0, 
            borderColor: 'primary.main'
          }}
        >
          <ListItemIcon>
            <AutoFixHighIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Thème Material UI</ListItemText>
        </MenuItem>
        
        <MenuItem 
          onClick={() => handleThemeChange('light')}
          selected={mode === 'light'}
          sx={{ 
            py: 1.5,
            borderLeft: mode === 'light' ? 3 : 0, 
            borderColor: 'primary.main'
          }}
        >
          <ListItemIcon>
            <LightModeIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Thème clair</ListItemText>
        </MenuItem>
        
        <MenuItem 
          onClick={() => handleThemeChange('dark')}
          selected={mode === 'dark'}
          sx={{ 
            py: 1.5,
            borderLeft: mode === 'dark' ? 3 : 0, 
            borderColor: 'primary.main'
          }}
        >
          <ListItemIcon>
            <DarkModeIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Thème sombre</ListItemText>
        </MenuItem>
        
        <MenuItem 
          onClick={() => handleThemeChange('intermediate')}
          selected={mode === 'intermediate'}
          sx={{ 
            py: 1.5,
            borderLeft: mode === 'intermediate' ? 3 : 0, 
            borderColor: 'primary.main'
          }}
        >
          <ListItemIcon>
            <SettingsBrightnessIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Thème intermédiaire</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

export default ThemeSwitcher;
