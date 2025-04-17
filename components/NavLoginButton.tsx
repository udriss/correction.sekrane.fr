'use client';

import React from 'react';
import { Button, ButtonProps } from '@mui/material';
import { useRouter } from 'next/navigation';
import useAuth from '@/hooks/useAuth';

interface NavLoginButtonProps extends Omit<ButtonProps, 'onClick'> {
  label?: string;
}

/**
 * Bouton de connexion spécifique pour la navigation qui redirige vers
 * la page de login avec l'URL actuelle comme callbackUrl.
 * 
 * Utilisez ce composant lorsque vous voulez que l'utilisateur revienne
 * à la page actuelle après s'être connecté.
 */
const NavLoginButton: React.FC<NavLoginButtonProps> = ({ 
  label = 'Se connecter',
  ...buttonProps
}) => {
  const { status } = useAuth();
  const router = useRouter();
  
  const handleClick = () => {
    // Utiliser window.location.pathname au lieu de usePathname()
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
    console.log('Current window.location.pathname:', currentPath);
    
    // S'assurer que le pathname est bien formaté (commence par /)
    const formattedPath = currentPath && currentPath.startsWith('/') 
      ? currentPath 
      : `/${currentPath || ''}`;
    
    // Utiliser le pathname absolu comme URL de callback
    const loginUrl = `/login?callbackUrl=${encodeURIComponent(formattedPath)}`;
    
    // Pour déboguer
    console.log('Redirection vers:', loginUrl, 'Callback path:', formattedPath);
    
    // Utiliser une redirection directe au lieu du router Next.js
    window.location.href = loginUrl;
  };
  
  if (status === 'unauthenticated') {
    return (
      <Button 
        onClick={handleClick}
        variant="contained" 
        color="primary"
        {...buttonProps}
      >
        {label}
      </Button>
    );
  }
  
  // Ne rien afficher si l'utilisateur est déjà authentifié
  return null;
};

export default NavLoginButton;