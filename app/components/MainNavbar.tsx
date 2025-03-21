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
  IconButton
} from '@mui/material';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ChangePasswordModal from './ChangePasswordModal';
import { 
  AccountCircle, 
  KeyboardArrowDown, 
  Add as AddIcon,
  Home as HomeIcon,
  ViewList as ViewListIcon
} from '@mui/icons-material';

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
  
  // États pour le menu de l'utilisateur
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  
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
                
                <Button 
                  component={Link} 
                  href="/activities" 
                  color="inherit" 
                  sx={{ fontWeight: 500 }}
                >
                  <ViewListIcon sx={{ fontSize: '1.5rem' }} />
                </Button>
                
                <Button 
                  component={Link} 
                  href="/activities/new" 
                  color="inherit" 
                  sx={{ fontWeight: 500 }}
                >
                 <AddIcon sx={{ fontSize: '1.5rem' }} />
                </Button>
              </Box>
              
              {/* Authentification */}
              {user ? (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Button
                    color="primary"
                    variant="outlined"
                    onClick={handleMenuClick}
                    endIcon={<KeyboardArrowDown />}
                    startIcon={<AccountCircle />}
                    size="small"
                    sx={{ 
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
