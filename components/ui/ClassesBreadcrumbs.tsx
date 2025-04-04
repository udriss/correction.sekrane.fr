'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Box,
  Breadcrumbs,
  Typography,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import Link from 'next/link';
import HomeIcon from '@mui/icons-material/Home';
import SchoolIcon from '@mui/icons-material/School';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import PeopleIcon from '@mui/icons-material/People';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import AssignmentIcon from '@mui/icons-material/Assignment';

// Type pour les items du fil d'Ariane supplémentaires
interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

interface ClassesBreadcrumbsProps {
  extraItems?: BreadcrumbItem[];
  currentPageLabel?: string;
}

export default function ClassesBreadcrumbs({ 
  extraItems = [], 
  currentPageLabel 
}: ClassesBreadcrumbsProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  // État pour le menu déroulant des classes
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(menuAnchorEl);
  
  const handleMenuClick = (event: React.MouseEvent<HTMLDivElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };
  
  const navigateTo = (path: string) => {
    handleMenuClose();
    router.push(path);
  };

  // Déterminer si une page est active
  const isActive = (path: string) => pathname === path;

  // Construction manuelle des éléments du fil d'Ariane
  const breadcrumbItems = [];
  
  // Ajout de l'élément Accueil
  breadcrumbItems.push(
    <Link key="home" href="/" className="flex items-center gap-1">
      <HomeIcon fontSize="small" color='primary' />
      <Typography color="text.primary">
      Accueil
      </Typography>
    </Link>
  );
  
  // Ajout de l'élément Classes avec le menu déroulant
  breadcrumbItems.push(
    <Box 
      key="classes"
      onClick={handleMenuClick}
      className="hover:underline flex items-center gap-1 cursor-pointer"
      aria-controls={menuOpen ? 'classes-menu' : undefined}
      aria-haspopup="true"
      aria-expanded={menuOpen ? 'true' : undefined}
    >
      <SchoolIcon fontSize="small" color='primary' />
      <Typography color="text.primary">
      Classes
      </Typography>
      <ExpandMoreIcon fontSize="small" color='primary' />
    </Box>
  );
  
  // Ajout des éléments supplémentaires s'ils existent
  if (extraItems.length > 0) {
    extraItems.forEach((item, index) => {
      breadcrumbItems.push(
        item.href ? (
          <Link 
            key={`extra-${index}`} 
            href={item.href} 
            className="hover:underline flex items-center gap-1"
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ) : (
          <Typography key={`extra-${index}`} color="text.primary" className="flex items-center gap-1">
            {item.icon}
            <span>{item.label}</span>
          </Typography>
        )
      );
    });
  }
  
  // Ajout de la page courante si elle existe
  if (currentPageLabel) {
    breadcrumbItems.push(
      <Typography sx={{ display: 'flex', alignItems: 'center', fontWeight: 700 }} color="primary">
          {currentPageLabel}
      </Typography>
    );
  }

  return (
    <Box mb={4}>
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />}>
        {breadcrumbItems}
      </Breadcrumbs>

      <Menu
        id="classes-menu"
        anchorEl={menuAnchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          paper: {
            elevation: 3,
            sx: { width: 'auto', mt: 0.5, borderRadius: 1 }
          }
        }}
      >
        <MenuItem 
          onClick={() => navigateTo('/classes')}
          selected={isActive('/classes')}
        >
          <ListItemIcon><SchoolIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Toutes les classes</ListItemText>
        </MenuItem>
        
        <MenuItem 
          onClick={() => navigateTo('/classes/new')}
          selected={isActive('/classes/new')}
        >
          <ListItemIcon><AddIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Nouvelle classe</ListItemText>
        </MenuItem>
        
        <MenuItem 
          onClick={() => navigateTo('/students')}
        >
          <ListItemIcon><PeopleIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Étudiants</ListItemText>
        </MenuItem>
        
        <MenuItem 
          onClick={() => navigateTo('/stats')}
          selected={isActive('/stats')}
        >
          <ListItemIcon><AnalyticsIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Statistiques</ListItemText>
        </MenuItem>
        
        <MenuItem 
          onClick={() => navigateTo('/corrections/new')}
        >
          <ListItemIcon><AssignmentIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Nouvelle correction</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
}
