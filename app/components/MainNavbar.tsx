'use client';

import React, { useState, useEffect } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  Menu, 
  MenuItem,
  Container,
  useScrollTrigger,
  Slide,
  IconButton,
  Tooltip,
  Divider,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ChangePasswordModal from './ChangePasswordModal';
import AccountCircle from '@mui/icons-material/AccountCircle';
import KeyboardArrowDown from '@mui/icons-material/KeyboardArrowDown';
import AddIcon from '@mui/icons-material/Add';
import HomeIcon from '@mui/icons-material/Home';
import ViewListIcon from '@mui/icons-material/ViewList';
import SchoolIcon from '@mui/icons-material/School';
import PeopleIcon from '@mui/icons-material/People';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FilterListIcon from '@mui/icons-material/FilterList';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CategoryIcon from '@mui/icons-material/Category';
import SearchIcon from '@mui/icons-material/Search';
import ThemeSwitcher from '@/components/layout/ThemeSwitcher';

interface User {
  id: number;
  username: string;
  name: string;
}

// Pour créer l'effet de disparition lors du défilement
interface Props {
  window?: () => Window;
  children: React.ReactElement;
}

function HideOnScroll(props: Props) {
  const { children, window } = props;
  const trigger = useScrollTrigger({
    target: window ? window() : undefined,
  });

  return (
    <Slide appear={false} direction="down" in={!trigger}>
      {children}
    </Slide>
  );
}

export default function MainNavbar() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  // États pour les menus
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [classMenuAnchor, setClassMenuAnchor] = useState<null | HTMLElement>(null);
  const [activitiesMenuAnchor, setActivitiesMenuAnchor] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const classMenuOpen = Boolean(classMenuAnchor);
  const activitiesMenuOpen = Boolean(activitiesMenuAnchor);
  
  // État pour le modal de changement de mot de passe
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/user');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      
      window.location.href = '/login';
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };
  
  // Gestionnaires pour le menu utilisateur
  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleChangePasswordClick = () => {
    handleMenuClose(); 
    setPasswordModalOpen(true);
  };

  // Gestionnaires pour le menu classe
  const handleClassMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setClassMenuAnchor(event.currentTarget);
  };
  
  const handleClassMenuClose = () => {
    setClassMenuAnchor(null);
  };

  // Gestionnaires pour le menu activities
  const handleActivitiesMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setActivitiesMenuAnchor(event.currentTarget);
  };
  
  const handleActivitiesMenuClose = () => {
    setActivitiesMenuAnchor(null);
  };

  if (loading) return null;

  return (
    <>
      {/* Conteneur externe centré */}
      <Box className="flex justify-center w-full fixed top-0 z-50">
        <HideOnScroll>
          <AppBar 
            position="relative" // Changed from fixed to relative
            elevation={0} 
            sx={{
              background: 'rgba(155, 155, 155, 0.22)',
              backdropFilter: 'blur(10px)',
              borderBottom: '1px solid rgba(0, 0, 0, 0.07)',
              color: 'text.primary',
              maxWidth: '600px',
              width: '100%',
              borderBottomLeftRadius: '16px',
              borderBottomRightRadius: '16px',
              // Removed left: 50% and transform: translateX(-50%)
            }}
          >
            <Toolbar sx={{ justifyContent: 'space-between' }}>
              {/* ThemeSwitcher on the left */}
              <Box  sx={{ marginLeft: 2 }}>
              <ThemeSwitcher />
              </Box>
              {/* Logo et titre de l'app */}
              <Typography 
                variant="h5" 
                component={Link} 
                href="/" 
                sx={{ 
                  fontWeight: 700,
                  textDecoration: 'none',
                  color: 'primary.main',
                  letterSpacing: '-0.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                
              </Typography>
              
              {/* Navigation principale */}
              <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 2 }}>
                <Button 
                  component={Link} 
                  href="/" 
                  color="inherit" 
                  sx={{ fontWeight: 500 }}
                >
                  <HomeIcon sx={{ fontSize: '1.5rem' }} />
                </Button>
                
                {/* Modified Activities button to trigger dropdown */}
                <Tooltip title="Activités">
                  <Button
                    color="inherit"
                    onClick={handleActivitiesMenuClick}
                    sx={{ fontWeight: 500 }}
                  >
                    <ViewListIcon sx={{ fontSize: '1.5rem' }} />
                  </Button>
                </Tooltip>
                
                {/* Activities Dropdown Menu */}
                <Menu
                  anchorEl={activitiesMenuAnchor}
                  open={activitiesMenuOpen}
                  onClose={handleActivitiesMenuClose}
                  onClick={handleActivitiesMenuClose}
                  PaperProps={{
                    elevation: 3,
                    sx: {
                      mt: 1,
                      minWidth: 200,
                      borderRadius: 2,
                      '& .MuiMenuItem-root': {
                        px: 2,
                        py: 1,
                      },
                    },
                  }}
                  transformOrigin={{ horizontal: 'center', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
                >
                  <MenuItem component={Link} href="/activities">
                    <ListItemIcon>
                      <FormatListBulletedIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Liste des activités" />
                  </MenuItem>
                  
                  <MenuItem component={Link} href="/activities/new">
                    <ListItemIcon>
                      <AddIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Nouvelle activité" />
                  </MenuItem>
                  
                  <Divider />

                  <MenuItem component={Link} href="/corrections">
                    <ListItemIcon>
                      <AssignmentIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Corrections" />
                  </MenuItem>

                  <MenuItem component={Link} href="/corrections/new">
                    <ListItemIcon>
                      <AddIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Nouvelle correction" />
                  </MenuItem>

                  <Divider />
                  
                  <MenuItem component={Link} href="/fragments">
                    <ListItemIcon>
                      <CategoryIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Fragments" />
                  </MenuItem>
                  
                  <MenuItem component={Link} href="/recherches">
                    <ListItemIcon>
                      <SearchIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Recherche avancée" />
                  </MenuItem>
                </Menu>
                
                {/* Nouveau bouton pour la gestion des classes */}
                <Tooltip title="Gestion des classes">
                  <Button
                    color="inherit"
                    onClick={handleClassMenuClick}
                    sx={{ fontWeight: 500 }}
                  >
                    <SchoolIcon sx={{ fontSize: '1.5rem' }} />
                  </Button>
                </Tooltip>
                
                {/* Menu déroulant pour la gestion des classes */}
                <Menu
                  anchorEl={classMenuAnchor}
                  open={classMenuOpen}
                  onClose={handleClassMenuClose}
                  onClick={handleClassMenuClose}
                  PaperProps={{
                    elevation: 3,
                    sx: {
                      mt: 1,
                      minWidth: 200,
                      borderRadius: 2,
                      '& .MuiMenuItem-root': {
                        px: 2,
                        py: 1,
                      },
                    },
                  }}
                  transformOrigin={{ horizontal: 'center', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
                >
                  <MenuItem component={Link} href="/classes">
                    <ListItemIcon>
                      <FormatListBulletedIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Liste des classes" />
                  </MenuItem>
                  
                  <MenuItem component={Link} href="/classes/new">
                    <ListItemIcon>
                      <AddIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Nouvelle classe" />
                  </MenuItem>
                  
                  <Divider />
                  
                  <MenuItem component={Link} href="/students">
                    <ListItemIcon>
                      <PeopleIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Gestion des étudiants" />
                  </MenuItem>
                </Menu>
              </Box>
              
              {/* Authentification */}
              {user ? (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Button
                    variant="outlined"
                    onClick={handleMenuClick}
                    endIcon={<KeyboardArrowDown />}
                    startIcon={<AccountCircle />}
                    size="small"
                    sx={{ 
                      color: 'success.main',
                      borderRadius: '24px',
                      textTransform: 'none',
                      fontWeight: 500,
                    }}
                  >
                    {user.name || user.username}
                  </Button>
                  <Menu
                    anchorEl={anchorEl}
                    open={open}
                    onClose={handleMenuClose}
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'right',
                    }}
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                    PaperProps={{
                      elevation: 3,
                      sx: {
                        borderRadius: 2,
                        minWidth: 180,
                        mt: 1
                      }
                    }}
                  >
                    <MenuItem onClick={handleChangePasswordClick} sx={{ py: 1.5 }}>
                      Changer le mot de passe
                    </MenuItem>
                    <MenuItem onClick={handleLogout} sx={{ py: 1.5 }}>
                      Déconnexion
                    </MenuItem>
                  </Menu>
                </Box>
              ) : (
                <Button 
                  color="primary" 
                  component={Link} 
                  href="/login"
                  variant="contained"
                  sx={{ borderRadius: '24px' }}
                >
                  <AccountCircle />
                </Button>
              )}
            </Toolbar>
          </AppBar>
        </HideOnScroll>
      </Box>
      
      
      {/* Modal de changement de mot de passe */}
      <ChangePasswordModal
        open={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
      />
    </>
  );
}
