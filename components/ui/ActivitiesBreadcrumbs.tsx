'use client';

import React, { useState } from 'react';
import { Breadcrumbs, Link, Typography, Box, Menu, MenuItem, IconButton } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import NextLink from 'next/link';

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
  menu?: {
    label: string;
    href: string;
    icon?: React.ReactNode;
  }[];
}

interface ActivitiesBreadcrumbsProps {
  extraItems?: BreadcrumbItem[];
  currentPageLabel: string;
}

const ActivitiesBreadcrumbs: React.FC<ActivitiesBreadcrumbsProps> = ({ extraItems = [], currentPageLabel }) => {
  // État pour gérer l'ouverture des menus de chaque item
  const [menuAnchorEl, setMenuAnchorEl] = useState<{ [key: number]: HTMLElement | null }>({});

  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>, index: number) => {
    setMenuAnchorEl(prev => ({
      ...prev,
      [index]: event.currentTarget
    }));
  };

  const handleMenuClose = (index: number) => {
    setMenuAnchorEl(prev => ({
      ...prev,
      [index]: null
    }));
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Breadcrumbs aria-label="breadcrumb">
        <Link
          component={NextLink}
          href="/"
          underline="hover"
          sx={{ display: 'flex', alignItems: 'center' }}
          
        >
          <HomeIcon sx={{ mr: 0.5, color:"primary" }} fontSize="inherit" />
          <Typography color="text.primary">Accueil</Typography>
        </Link>

        <Link
          component={NextLink}
          href="/activities"
          underline="hover"
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <MenuBookIcon sx={{ mr: 0.5, color:"primary" }} fontSize="inherit"/>
          <Typography color="text.primary">Activités</Typography>
        </Link>

        {extraItems.map((item, index) => (
          <Box key={index} sx={{ display: 'flex', alignItems: 'center' }}>
            {item.href ? (
              <Link
                component={NextLink}
                href={item.href}
                underline="hover"
                sx={{ display: 'flex', alignItems: 'center' }}
                color="inherit"
              >
                {item.icon && <Box sx={{ mr: 0.5, display: 'flex', alignItems: 'center', color:"primary" }}>{item.icon}</Box>}
                {item.label}
              </Link>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', color:"primary"}} >
                {item.icon && <Box sx={{ mr: 0.5, display: 'flex', alignItems: 'center', color:"primary" }}>{item.icon}</Box>}
                {item.label}
              </Box>
            )}
            
            {/* Afficher un menu déroulant si item.menu existe */}
            {item.menu && (
              <>
                <IconButton
                  size="small"
                  onClick={(e) => handleMenuClick(e, index)}
                  aria-controls={menuAnchorEl[index] ? `breadcrumb-menu-${index}` : undefined}
                  aria-haspopup="true"
                  aria-expanded={menuAnchorEl[index] ? 'true' : undefined}
                  sx={{ ml: 0.5, p: 0.3 }}
                >
                  <KeyboardArrowDownIcon fontSize="small" sx={{color:"primary"}} />
                </IconButton>
                <Menu
                  id={`breadcrumb-menu-${index}`}
                  anchorEl={menuAnchorEl[index]}
                  open={Boolean(menuAnchorEl[index])}
                  onClose={() => handleMenuClose(index)}
                  PaperProps={{
                    elevation: 3,
                    sx: { minWidth: 180 }
                  }}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                  }}
                >
                  {item.menu.map((menuItem, menuIndex) => (
                    <MenuItem 
                      key={menuIndex} 
                      onClick={() => handleMenuClose(index)}
                      component={NextLink}
                      href={menuItem.href}
                      sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                    >
                      {menuItem.icon}
                      {menuItem.label}
                    </MenuItem>
                  ))}
                </Menu>
              </>
            )}
          </Box>
        ))}

        <Typography sx={{ display: 'flex', alignItems: 'center' }} color="primary">
          {currentPageLabel}
        </Typography>
      </Breadcrumbs>
    </Box>
  );
};

export default ActivitiesBreadcrumbs;
