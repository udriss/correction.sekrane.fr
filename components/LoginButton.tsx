'use client';

import React, { useState } from 'react';
import { 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField,
  Box,
  Alert,
  CircularProgress
} from '@mui/material';
import { useRouter } from 'next/navigation';
import useAuth from '@/hooks/useAuth';

interface LoginButtonProps {
  variant?: 'text' | 'outlined' | 'contained';
  color?: 'inherit' | 'primary' | 'secondary';
  size?: 'small' | 'medium' | 'large';
}

const LoginButton: React.FC<LoginButtonProps> = ({ 
  variant = 'contained', 
  color = 'primary',
  size = 'medium'
}) => {
  const { user, status } = useAuth();
  const router = useRouter();
  
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleLogin = async () => {
    if (!username || !password) {
      setError('Veuillez saisir un nom d\'utilisateur et un mot de passe');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erreur d\'authentification');
      }
      
      // Success, close the dialog
      setOpen(false);
      
      // Reload to update auth state throughout the app
      router.refresh();
      window.location.reload();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      
      // Reload to update auth state throughout the app
      router.refresh();
      window.location.reload();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };
  
  // Show login button if not authenticated
  if (status === 'unauthenticated') {
    return (
      <>
        <Button
          variant={variant}
          color={color}
          size={size}
          onClick={() => setOpen(true)}
        >
          Se connecter
        </Button>
        
        <Dialog open={open} onClose={() => setOpen(false)}>
          <DialogTitle>Connexion</DialogTitle>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <Box component="form" sx={{ mt: 1 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                label="Nom d'utilisateur"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
              />
              <TextField
                margin="normal"
                required
                fullWidth
                label="Mot de passe"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleLogin}
              disabled={loading}
              variant="contained"
            >
              {loading ? <CircularProgress size={24} /> : 'Se connecter'}
            </Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }
  
  // Show logout button if authenticated
  if (status === 'authenticated') {
    return (
      <Button
        variant={variant}
        color={color}
        size={size}
        onClick={handleLogout}
      >
        Se déconnecter
      </Button>
    );
  }
  
  // Show loading state otherwise
  return (
    <Button
      variant={variant}
      color={color}
      size={size}
      disabled
    >
      <CircularProgress size={16} sx={{ mr: 1 }} /> Chargement...
    </Button>
  );
};

export default LoginButton;
