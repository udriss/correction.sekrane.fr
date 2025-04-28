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
  // Détection de la route de correction d'un étudiant spécifique
  const isStudentCorrectionPage = pathname && /^\/students\/\d+\/corrections$/.test(pathname);
  const isActivitiesRoute = pathname && pathname.startsWith('/activities');
  const isNewActivityRoute = pathname && pathname === '/activities/new';
  const isActivityDetailRoute = pathname && /^\/activities\/\d+$/.test(pathname);
  const isStudentsRoute = pathname && pathname.startsWith('/students');
  const isStudentDetailRoute = pathname && /^\/students\/\d+$/.test(pathname);
  const isStudentsPage = pathname && pathname === '/students';
  const isCorrectionsRoute = pathname && pathname.startsWith('/corrections');
  const isNewCorrectionRoute = pathname && pathname === '/corrections/new';
  const isUniqueCorrectionRoute = pathname && pathname === '/corrections/unique';
  const isMultipleCorrectionsRoute = pathname && pathname === '/corrections/multiples';
  const isCorrectionDetailRoute = pathname && /^\/corrections\/\d+$/.test(pathname);
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
  // Nouvelles routes détectées
  const isDatabaseMonitoringPage = pathname && pathname.startsWith('/database-monitoring');
  const isFaqPage = pathname && pathname === '/faq';
  const isFragmentsPage = pathname && pathname.startsWith('/fragments');
  const isLogsPage = pathname && pathname.startsWith('/logs');
  const isMicroscopeDemoPage = pathname && pathname.startsWith('/microscope-demo');
  const isPrivacyPage = pathname && pathname === '/privacy';
  const isRecherchesPage = pathname && pathname.startsWith('/recherches');
  
  // Créer un titre dynamique en fonction du chemin
  const getPageTitle = () => {
    if (isFeedbackRoute) return 'Correction - Feedback';
    if (isStudentCorrectionPage) {
      const studentId = pathname ? pathname.split('/')[2] : '';
      return `Corrections de l'étudiant #${studentId}`;
    }
    if (isActivitiesRoute) {
      if (isNewActivityRoute) return 'Nouvelle activité';
      if (isActivityDetailRoute) {
        const activityId = pathname ? pathname.split('/').pop() : '';
        return `Activité #${activityId}`;
      }
      // Autres sous-routes activities
      if (pathname && pathname.match(/^\/activities\/\d+\/corrections$/)) {
        const activityId = pathname.split('/')[2];
        return `Corrections - Activité #${activityId}`;
      }
      if (pathname && pathname.match(/^\/activities\/\d+\/corrections\/new$/)) {
        const activityId = pathname.split('/')[2];
        return `Nouvelle correction - Activité #${activityId}`;
      }
      if (pathname && pathname.match(/^\/activities\/\d+\/corrections\/multiples$/)) {
        const activityId = pathname.split('/')[2];
        return `Corrections multiples - Activité #${activityId}`;
      }
      if (pathname && pathname.match(/^\/activities\/\d+\/groups$/)) {
        const activityId = pathname.split('/')[2];
        return `Groupes - Activité #${activityId}`;
      }
      if (pathname && pathname.match(/^\/activities\/\d+\/groups\/\d+$/)) {
        const activityId = pathname.split('/')[2];
        const groupId = pathname.split('/')[4];
        return `Groupe #${groupId} - Activité #${activityId}`;
      }
      return 'Activités';
    }
    if (isStudentsRoute) {
      if (isStudentsPage) return 'Tous les étudiants';
      if (isStudentDetailRoute) {
        const studentId = pathname ? pathname.split('/').pop() : '';
        return `Étudiant #${studentId}`;
      }
      // Autres sous-routes students
      if (pathname && pathname.match(/^\/students\/\d+\/classes$/)) {
        const studentId = pathname.split('/')[2];
        return `Classes - Étudiant #${studentId}`;
      }
      if (pathname && pathname.match(/^\/students\/\d+\/corrections\/new$/)) {
        const studentId = pathname.split('/')[2];
        return `Nouvelle correction - Étudiant #${studentId}`;
      }
      return 'Étudiants';
    }
    if (isCorrectionsRoute) {
      if (isNewCorrectionRoute) return 'Nouvelle correction';
      if (isUniqueCorrectionRoute) return 'Correction unique';
      if (isMultipleCorrectionsRoute) return 'Corrections multiples';
      if (isCorrectionDetailRoute) {
        const correctionId = pathname ? pathname.split('/').pop() : '';
        return `Correction #${correctionId}`;
      }
      return 'Corrections';
    }
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
      // Sous-routes classes
      if (pathname && pathname.match(/^\/classes\/\d+$/)) {
        const classId = pathname.split('/').pop() || '';
        return `Classe #${classId}`;
      }
      if (pathname && pathname.match(/^\/classes\/\d+\/students$/)) {
        const classId = pathname.split('/')[2];
        return `Étudiants - Classe #${classId}`;
      }
      if (pathname && pathname.match(/^\/classes\/\d+\/corrections$/)) {
        const classId = pathname.split('/')[2];
        return `Corrections - Classe #${classId}`;
      }
      return 'Classes';
    }
    // Nouveaux titres pour les nouvelles routes
    if (isDatabaseMonitoringPage) return 'Surveillance de la base de données';
    if (isFaqPage) return 'FAQ';
    if (isFragmentsPage) return 'Fragments';
    if (isLogsPage) return 'Journaux système';
    if (isMicroscopeDemoPage) return 'Démonstration du microscope';
    if (isPrivacyPage) return 'Politique de confidentialité';
    if (isRecherchesPage) return 'Recherches';
    
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
  }, [pathname, getPageTitle]);
  
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      {/* N'affichez la navbar que si nous ne sommes pas dans la route feedback ou la page de corrections d'étudiant */}
      {!(isFeedbackRoute || isStudentCorrectionPage) && <MainNavbar />}
      
      {/* 
        Utilisation du composant Box avec "div" au lieu de "main" pour éviter
        le conflit avec l'élément main qui serait injecté par Next.js
      */}
      <Box 
        component="div" 
        className={`flex-grow ${!(isFeedbackRoute || isStudentCorrectionPage) ? "pt-20" : ""}`}
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

      {/* N'affichez le footer que si nous ne sommes pas dans la route feedback ou la page de corrections d'étudiant */}
      {!(isFeedbackRoute || isStudentCorrectionPage) && <Footer />}
    </LocalizationProvider>
  );
}
