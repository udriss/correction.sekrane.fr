'use client';

import React from 'react';
import { Container } from '@mui/material';
import ActivitiesBreadcrumbs from '@/components/ui/ActivitiesBreadcrumbs';
import { usePathname } from 'next/navigation';
import BookIcon from '@mui/icons-material/Book';
import GroupsIcon from '@mui/icons-material/Groups';
import AssignmentIcon from '@mui/icons-material/Assignment';

export default function ActivitiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() || '';
  
  // Déterminer le label et les éléments supplémentaires pour chaque page
  const getBreadcrumbConfig = () => {
    // Early return if pathname is null
    if (!pathname) {
      return { currentPageLabel: '', extraItems: [] };
    }
    
    // Configuration par défaut
    let currentPageLabel = '';
    let extraItems: { label: string; href?: string; icon?: React.ReactNode }[] = [];
    
    // Page principale des activités
    if (pathname === '/activities') {
      currentPageLabel = 'Toutes les activités';
    }
    // Page de nouvelle activité
    else if (pathname === '/activities/new') {
      currentPageLabel = 'Nouvelle activité';
    }
    // Page statistiques
    else if (pathname === '/activities/analytics') {
      currentPageLabel = 'Statistiques';
    }
    // Page des groupes d'activités
    else if (pathname === '/activities/groups') {
      currentPageLabel = 'Groupes d\'activités';
    }
    // Page détail d'une activité
    else if (pathname.match(/^\/activities\/\d+$/)) {
      const activityId = pathname.split('/').pop();
      currentPageLabel = `Activité #${activityId}`;
    }
    // Page des corrections d'une activité
    else if (pathname.match(/^\/activities\/\d+\/corrections$/)) {
      const activityId = pathname.split('/')[2];
      extraItems = [
        { label: `Activité #${activityId}`, href: `/activities/${activityId}`, icon: <BookIcon fontSize="small" /> }
      ];
      currentPageLabel = 'Corrections';
    }
    // Page des groupes d'une activité
    else if (pathname.match(/^\/activities\/\d+\/groups$/)) {
      const activityId = pathname.split('/')[2];
      extraItems = [
        { label: `Activité #${activityId}`, href: `/activities/${activityId}`, icon: <BookIcon fontSize="small" /> }
      ];
      currentPageLabel = 'Groupes de corrections';
    }
    // Page détail d'un groupe de corrections
    else if (pathname.match(/^\/activities\/\d+\/groups\/\d+$/)) {
      const pathParts = pathname.split('/');
      const activityId = pathParts[2];
      const groupId = pathParts[4];
      
      extraItems = [
        { label: `Activité #${activityId}`, href: `/activities/${activityId}`, icon: <BookIcon fontSize="small" /> },
        { label: 'Groupes', href: `/activities/${activityId}/groups`, icon: <GroupsIcon fontSize="small" /> }
      ];
      currentPageLabel = `Groupe #${groupId}`;
    }
    // Page d'ajout de correction pour une activité
    else if (pathname.match(/^\/activities\/\d+\/corrections\/new$/)) {
      const activityId = pathname.split('/')[2];
      extraItems = [
        { label: `Activité #${activityId}`, href: `/activities/${activityId}`, icon: <BookIcon fontSize="small" /> },
        { label: 'Corrections', href: `/activities/${activityId}/corrections`, icon: <AssignmentIcon fontSize="small" /> }
      ];
      currentPageLabel = 'Nouvelle correction';
    }
    
    return { currentPageLabel, extraItems };
  };
  
  const { currentPageLabel, extraItems } = getBreadcrumbConfig();

  return (
    <Container maxWidth="lg" className="py-4">
      <ActivitiesBreadcrumbs 
        extraItems={extraItems} 
        currentPageLabel={currentPageLabel} 
      />
      {children}
    </Container>
  );
}
