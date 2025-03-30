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
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PersonIcon from '@mui/icons-material/Person';
import PeopleIcon from '@mui/icons-material/People';
import AddIcon from '@mui/icons-material/Add';
import SchoolIcon from '@mui/icons-material/School';
import AssignmentIcon from '@mui/icons-material/Assignment';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import AnalyticsIcon from '@mui/icons-material/Analytics';

// Type pour les items du fil d'Ariane supplémentaires
interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

interface StudentsBreadcrumbsProps {
  extraItems?: BreadcrumbItem[];
  currentPageLabel?: string;
}

export default function StudentsBreadcrumbs({ 
  extraItems = [], 
  currentPageLabel 
}: StudentsBreadcrumbsProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  // État pour le menu déroulant des étudiants
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
    <Link key="home" href="/" className="text-blue-600 hover:underline flex items-center gap-1">
      <HomeIcon fontSize="small" />
      <span>Accueil</span>
    </Link>
  );
  
  // Ajout de l'élément Étudiants avec le menu déroulant
  breadcrumbItems.push(
    <Box 
      key="students"
      onClick={handleMenuClick}
      className="text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
      aria-controls={menuOpen ? 'students-menu' : undefined}
      aria-haspopup="true"
      aria-expanded={menuOpen ? 'true' : undefined}
    >
      <PeopleIcon fontSize="small" />
      <span>Étudiants</span>
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
            className="text-blue-600 hover:underline flex items-center gap-1"
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
        id="students-menu"
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
          onClick={() => navigateTo('/students')}
          selected={isActive('/students')}
        >
          <ListItemIcon><PeopleIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Tous les étudiants</ListItemText>
        </MenuItem>
        
        <MenuItem 
          onClick={() => navigateTo('/students/new')}
          selected={isActive('/students/new')}
        >
          <ListItemIcon><AddIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Nouvel étudiant</ListItemText>
        </MenuItem>
        
        <MenuItem 
          onClick={() => navigateTo('/students/import')}
          selected={isActive('/students/import')}
        >
          <ListItemIcon><UploadFileIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Importer des étudiants</ListItemText>
        </MenuItem>
        
        <MenuItem 
          onClick={() => navigateTo('/classes')}
        >
          <ListItemIcon><SchoolIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Toutes les classes</ListItemText>
        </MenuItem>
        
        <MenuItem 
          onClick={() => navigateTo('/students/analytics')}
          selected={isActive('/students/analytics')}
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
