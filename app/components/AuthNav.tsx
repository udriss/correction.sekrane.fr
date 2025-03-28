'use client';

import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Menu, MenuItem } from '@mui/material';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ChangePasswordModal from './ChangePasswordModal';
import AccountCircle from '@mui/icons-material/AccountCircle';
import KeyboardArrowDown from '@mui/icons-material/KeyboardArrowDown';

interface User {
  id: number;
  username: string;
  name: string;
}

export default function AuthNav() {
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
      
      // Redirect to login page after logout using window.location
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
    handleMenuClose(); // Fermer le menu
    setPasswordModalOpen(true); // Ouvrir le modal
  };

  if (loading) return null;

  return (
    <>
      <AppBar position="static" color="primary">
        <Toolbar>
          <Typography variant="h6" component={Link} href="/" sx={{ 
            flexGrow: 1, 
            textDecoration: 'none',
            color: 'inherit'
          }}>
            Correction App
          </Typography>
          
          {user ? (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Button
                  color="inherit"
                  onClick={handleMenuClick}
                  endIcon={<KeyboardArrowDown />}
                  startIcon={<AccountCircle />}
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
                >
                  <MenuItem onClick={handleChangePasswordClick}>
                    Changer le mot de passe
                  </MenuItem>
                  <MenuItem onClick={handleLogout}>
                    Déconnexion
                  </MenuItem>
                </Menu>
              </Box>
            </>
          ) : (
            <Button color="inherit" component={Link} href="/login">
              Connexion
            </Button>
          )}
        </Toolbar>
      </AppBar>
      
      {/* Modal de changement de mot de passe */}
      <ChangePasswordModal
        open={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
      />
    </>
  );
}
