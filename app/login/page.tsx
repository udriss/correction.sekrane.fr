'use client';

import React, { useState, FormEvent, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TextField, Button, Paper, Typography, Box, CircularProgress, Alert, Divider } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import ErrorDisplay from '@/components/ui/ErrorDisplay';
import useAuth from '@/hooks/useAuth';
import Link from 'next/link';
import HomeIcon from '@mui/icons-material/Home';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<Error | string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get('callbackUrl') || '/';
  const { user, status } = useAuth(); // Utiliser le hook useAuth pour vérifier si l'utilisateur est connecté

  // Debug
  useEffect(() => {
    // Afficher dans la console la valeur du callbackUrl pour débogage
    console.log('CallbackUrl récupéré des paramètres:', callbackUrl);
    
    // Pour s'assurer que le paramètre est disponible même après un rechargement de page
    if (callbackUrl && callbackUrl !== '/') {
      // Stocker temporairement dans sessionStorage en cas de rechargement de page
      sessionStorage.setItem('lastCallbackUrl', callbackUrl);
    }
  }, [callbackUrl]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

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
        // Créer une instance d'Error et y attacher les détails
        const error = new Error(data.error || 'Authentification échouée');
        (error as any).details = data.details || {};
        setError(error);
        throw error;
      }

      // Récupérer le callbackUrl des paramètres d'URL ou de sessionStorage
      let finalCallbackUrl = callbackUrl;
      
      // Si callbackUrl est la racine '/', vérifier dans sessionStorage
      if (finalCallbackUrl === '/' && typeof window !== 'undefined') {
        const storedCallback = sessionStorage.getItem('lastCallbackUrl');
        if (storedCallback) {
          finalCallbackUrl = storedCallback;
          // Nettoyer après utilisation
          sessionStorage.removeItem('lastCallbackUrl');
        }
      }
      
      // Log pour déboguer
      console.log('Redirection après authentification vers:', finalCallbackUrl);
      
      // Utilisez un timeout court pour s'assurer que le cookie est bien défini
      setTimeout(() => {
        // S'assurer que le callbackUrl est correct (commence par /)
        if (finalCallbackUrl && !finalCallbackUrl.startsWith('/')) {
          finalCallbackUrl = `/${finalCallbackUrl}`;
        }
        
        // Toujours utiliser window.location pour une redirection complète
        window.location.href = finalCallbackUrl;
      }, 300);
    } catch (err: any) {
      console.error('Erreur lors de la connexion:', err);
      if (!error) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      setLoading(false);
    }
  };

  // Gérer la déconnexion
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      window.location.reload(); // Recharger la page après déconnexion
    } catch (err) {
      console.error('Erreur lors de la déconnexion:', err);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'start',
        minHeight: '100vh',
        backgroundColor: 'rg(214, 219, 220)',
      }}
    >
      <Paper
        elevation={3}
        sx={{
          padding: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: 400,
          width: '100%',
          marginTop: 8,
        }}
      >
        <Box
          sx={{
            bgcolor: 'primary.main',
            color: 'white',
            borderRadius: '50%',
            p: 1,
            mb: 2,
          }}
        >
          <LockOutlinedIcon />
        </Box>

        {/* Afficher un contenu différent en fonction de l'état d'authentification */}
        {status === 'loading' ? (
          // Afficher un indicateur de chargement pendant la vérification de l'authentification
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <CircularProgress size={40} sx={{ mb: 2 }} />
            <Typography variant="body1">Vérification de l'authentification...</Typography>
          </Box>
        ) : status === 'authenticated' && user ? (
          // Afficher un message et des options si l'utilisateur est déjà connecté
          <Box sx={{ width: '100%', textAlign: 'center' }}>
            <Typography component="h1" variant="h5" mb={2}>
              Vous êtes connecté
            </Typography>
            
            <Alert severity="success" sx={{ mb: 3 }}>
              Vous êtes connecté en tant que <strong>{user.username || user.name}</strong>
            </Alert>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <Button
                variant="contained"
                color="primary"
                component={Link}
                href={callbackUrl !== '/' ? callbackUrl : '/'}
                startIcon={<HomeIcon />}
                fullWidth
              >
                Retour à la page d'accueil
              </Button>
              
              <Button
                component={Link}
                href="/stats"
                variant="outlined"
                startIcon={<PersonIcon />}
                fullWidth
                sx={{ mt: 1 }}
              >
                Voir les statistiques
              </Button>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="body2" color="text.secondary" mb={2}>
                Vous souhaitez changer de compte ?
              </Typography>
              
              <Button
                variant="outlined"
                color="error"
                onClick={handleLogout}
                startIcon={<LogoutIcon />}
                fullWidth
              >
                Se déconnecter
              </Button>
            </Box>
          </Box>
        ) : (
          // Afficher le formulaire de connexion pour les utilisateurs non authentifiés
          <>
            <Typography component="h1" variant="h5" mb={3}>
              Connexion
            </Typography>

            <ErrorDisplay 
              error={error}
              errorDetails={
                error && typeof error === 'object' && 'details' in error
                  ? (error as any).details
                  : undefined
              }
              onRefresh={() => setError(null)} 
            />

            <Box 
              component="form" 
              onSubmit={handleSubmit} 
              sx={{ width: '100%' }}
              method="post"
            >
              <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                label="Nom d'utilisateur"
                name="username"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Mot de passe"
                type="password"
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                    Connexion...
                  </>
                ) : (
                  'Se connecter'
                )}
              </Button>
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
}
