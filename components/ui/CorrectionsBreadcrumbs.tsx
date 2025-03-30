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
import AssignmentIcon from '@mui/icons-material/Assignment';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import GroupsIcon from '@mui/icons-material/Groups';
import { fontWeight } from '@mui/system';

// Type pour les items du fil d'Ariane supplémentaires
interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

interface CorrectionsBreadcrumbsProps {
    extraItems?: BreadcrumbItem[];
    currentPageLabel?: string | React.ReactNode;
  }

export default function CorrectionsBreadcrumbs({ 
  extraItems = [], 
  currentPageLabel 
}: CorrectionsBreadcrumbsProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  // État pour le menu déroulant des corrections
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

  // Construction manuelle des éléments du fil d'Ariane plutôt que d'utiliser le composant MUI
  // pour avoir un contrôle précis sur les séparateurs
  const breadcrumbItems = [];
  
  // Ajout de l'élément Accueil
  breadcrumbItems.push(
    <Link key="home" href="/" className="text-blue-600 hover:underline flex items-center gap-1">
      <HomeIcon fontSize="small" />
      <span>Accueil</span>
    </Link>
  );
  
  // Ajout de l'élément Corrections avec le menu déroulant
  breadcrumbItems.push(
    <Box 
      key="corrections"
      onClick={handleMenuClick}
      className="text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
      aria-controls={menuOpen ? 'corrections-menu' : undefined}
      aria-haspopup="true"
      aria-expanded={menuOpen ? 'true' : undefined}
    >
      <AssignmentIcon fontSize="small" />
      <span>Corrections</span>
      <ExpandMoreIcon fontSize="small" />
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
            color='primary'
            className="hover:underline flex items-center gap-1 font-bold"
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
      <Typography key="current" color="text.primary" className="flex items-center gap-1">
        <span>{currentPageLabel}</span>
      </Typography>
    );
  }

  return (
    <Box mb={4}>
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />}>
        {breadcrumbItems}
      </Breadcrumbs>

      <Menu
        id="corrections-menu"
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
          onClick={() => navigateTo('/corrections')}
          selected={isActive('/corrections')}
        >
          <ListItemIcon><AssignmentIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Toutes les corrections</ListItemText>
        </MenuItem>
        
        <MenuItem 
          onClick={() => navigateTo('/corrections/new')}
          selected={isActive('/corrections/new')}
        >
          <ListItemIcon><AssignmentIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Nouvelle correction</ListItemText>
        </MenuItem>
        
        <MenuItem 
          onClick={() => navigateTo('/corrections/unique')}
          selected={isActive('/corrections/unique')}
        >
          <ListItemIcon><PersonAddIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Correction unique</ListItemText>
        </MenuItem>
        
        <MenuItem 
          onClick={() => navigateTo('/corrections/multiples')}
          selected={isActive('/corrections/multiples')}
        >
          <ListItemIcon><GroupsIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Corrections multiples</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
}
