'use client';

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Box, useTheme } from '@mui/material';
import MainNavbar from '@/app/components/MainNavbar';
import Footer from '@/components/Footer';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  // Utilisez usePathname pour déterminer le chemin actuel
  const pathname = usePathname();
  const theme = useTheme();
  
  // Détection de toutes les routes principales
  const isFeedbackRoute = pathname && pathname.startsWith('/feedback');
  const isActivitiesRoute = pathname && pathname.startsWith('/activities');
  const isNewActivityRoute = pathname && pathname === '/activities/new';
  const isStudentsPage = pathname && pathname === '/students';
  const isCorrectionsRoute = pathname && pathname.startsWith('/corrections');
  const isDemoRoute = pathname && pathname === '/demo';
  const isHomePage = pathname && pathname === '/';
  const isLoginPage = pathname && pathname === '/login';
  const isProfilePage = pathname && pathname.startsWith('/profile');
  const isSettingsPage = pathname && pathname.startsWith('/settings');
  const isHelpPage = pathname && pathname.startsWith('/help');
  const isNotificationsPage = pathname && pathname === '/notifications';
  const isAnalyticsPage = pathname && pathname.startsWith('/stats');
  const isContactPage = pathname && pathname === '/contact';
  const isAboutPage = pathname && pathname === '/about';
  const isClassesRoute = pathname && pathname.startsWith('/classes');
  const isNewClassRoute = pathname && pathname === '/classes/new';
  
  // Créer un titre dynamique en fonction du chemin
  const getPageTitle = () => {
    if (isFeedbackRoute) return 'Correction - Feedback';
    if (isActivitiesRoute) {
      if (isNewActivityRoute) return 'Nouvelle activité';
      return 'Activités';
    }
    if (isStudentsPage) return 'Élèves';
    if (isCorrectionsRoute) return 'Corrections';
    if (isDemoRoute) return 'Démonstration';
    if (isLoginPage) return 'Connexion';
    if (isProfilePage) return 'Profil';
    if (isHomePage) return 'Accueil';
    if (isSettingsPage) return 'Paramètres';
    if (isHelpPage) return 'Aide';
    if (isNotificationsPage) return 'Notifications';
    if (isAnalyticsPage) return 'Statistiques';
    if (isContactPage) return 'Contact';
    if (isAboutPage) return 'À propos';
    if (isClassesRoute) {
      if (isNewClassRoute) return 'Nouvelle classe';
      return 'Classes';
    }
    const pathSegment = pathname?.split('/').pop() || '';
    const formattedSegment = pathSegment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    return formattedSegment ? `${formattedSegment}` : 'Correction Sekrane';
  };
  
  // Mettre à jour dynamiquement le titre
  useEffect(() => {
    document.title = getPageTitle();
    
    // Optionnel : mettre à jour la balise canonical
    const canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink) {
      canonicalLink.setAttribute('href', `https://correction.sekrane.fr${pathname}`);
    }
  }, [pathname]);
  
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      {/* N'affichez la navbar que si nous ne sommes pas dans la route feedback */}
      {!isFeedbackRoute && <MainNavbar />}
      
      {/* 
        Utilisation du composant Box avec "div" au lieu de "main" pour éviter
        le conflit avec l'élément main qui serait injecté par Next.js
      */}
      <Box 
        component="div" 
        className={`flex-grow ${!isFeedbackRoute ? "pt-20" : ""}`}
        sx={{
          bgcolor: 'background.default',
          color: 'text.primary',
          minHeight: '100vh',
          transition: theme.transitions.create(['background-color', 'color'], {
            duration: theme.transitions.duration.standard,
          }),
        }}
      >
        {children}
      </Box>

      {/* N'affichez le footer que si nous ne sommes pas dans la route feedback */}
      {!isFeedbackRoute && <Footer />}
    </LocalizationProvider>
  );
}
