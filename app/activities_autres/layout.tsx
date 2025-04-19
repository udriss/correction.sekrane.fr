'use client';

import React from 'react';
import { Container } from '@mui/material';
import ActivitiesBreadcrumbs from '@/components/ui/ActivitiesBreadcrumbs';
import { usePathname } from 'next/navigation';
import BookIcon from '@mui/icons-material/Book';
import GroupsIcon from '@mui/icons-material/Groups';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PersonIcon from '@mui/icons-material/Person';
import PeopleIcon from '@mui/icons-material/People';

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
    let extraItems: { label: string; href?: string; icon?: React.ReactNode; menu?: { label: string; href: string; icon?: React.ReactNode }[] }[] = [];
    
    // Page principale des activités
    if (pathname === '/activities_autres') {
      currentPageLabel = 'Toutes les activités';
    }
    // Page de nouvelle activité
    else if (pathname === '/activities_autres/new') {
      currentPageLabel = 'Nouvelle activité';
    }
    // Page statistiques
    else if (pathname === '/activities_autres/analytics') {
      currentPageLabel = 'Statistiques';
    }
    // Page des groupes d'activités
    else if (pathname === '/activities_autres/groups') {
      currentPageLabel = 'Groupes d\'activités';
    }
    // Page détail d'une activité
    else if (pathname.match(/^\/activities_autres\/\d+$/)) {
      const activityId = pathname.split('/').pop();
      currentPageLabel = `Activité #${activityId}`;
    }
    // Page des corrections d'une activité
    else if (pathname.match(/^\/activities_autres\/\d+\/corrections$/)) {
      const activityId = pathname.split('/')[2];
      extraItems = [
        { label: `Activité #${activityId}`, href: `/activities_autres/${activityId}`, icon: <BookIcon fontSize="small" color='primary' /> }
      ];
      
      // Ajouter un menu pour les corrections
      currentPageLabel = 'Corrections';
      extraItems.push({
        label: 'Corrections',
        icon: <AssignmentIcon fontSize="small" color='primary' />,
        menu: [
          { label: 'Correction unique', href: `/activities_autres/${activityId}/corrections/new`, icon: <PersonIcon fontSize="small" color='primary'/> },
          { label: 'Corrections multiples', href: `/activities_autres/${activityId}/corrections/multiples`, icon: <PeopleIcon fontSize="small" color='primary'/> }
        ]
      });
    }
    // Page de correction unique pour une activité
    else if (pathname.match(/^\/activities_autres\/\d+\/corrections\/new$/)) {
      const activityId = pathname.split('/')[2];
      extraItems = [
        { label: `Activité #${activityId}`, href: `/activities_autres/${activityId}`, icon: <BookIcon fontSize="small" color='primary'/> },
        { 
          label: 'Corrections', 
          href: `/activities_autres/${activityId}/corrections`, 
          icon: <AssignmentIcon fontSize="small" color='primary'/>,
          menu: [
            { label: 'Correction unique', href: `/activities_autres/${activityId}/corrections/new`, icon: <PersonIcon fontSize="small" color='primary'/> },
            { label: 'Corrections multiples', href: `/activities_autres/${activityId}/corrections/multiples`, icon: <PeopleIcon fontSize="small" color='primary'/> }
          ]
        }
      ];
      currentPageLabel = 'Correction unique';
    }
    // Page de corrections multiples pour une activité
    else if (pathname.match(/^\/activities_autres\/\d+\/corrections\/multiples$/)) {
      const activityId = pathname.split('/')[2];
      extraItems = [
        { label: `Activité #${activityId}`, href: `/activities_autres/${activityId}`, icon: <BookIcon fontSize="small" color='primary' /> },
        { 
          label: 'Corrections', 
          href: `/activities_autres/${activityId}/corrections`, 
          icon: <AssignmentIcon fontSize="small" color='primary'/>,
          menu: [
            { label: 'Correction unique', href: `/activities_autres/${activityId}/corrections/new`, icon: <PersonIcon fontSize="small" color='primary' /> },
            { label: 'Corrections multiples', href: `/activities_autres/${activityId}/corrections/multiples`, icon: <PeopleIcon fontSize="small" color='primary'/> }
          ]
        }
      ];
      currentPageLabel = 'Corrections multiples';
    }
    // Page des groupes d'une activité
    else if (pathname.match(/^\/activities_autres\/\d+\/groups$/)) {
      const activityId = pathname.split('/')[2];
      extraItems = [
        { label: `Activité #${activityId}`, href: `/activities_autres/${activityId}`, icon: <BookIcon fontSize="small" color='primary'/> }
      ];
      currentPageLabel = 'Groupes de corrections';
    }
    // Page détail d'un groupe de corrections
    else if (pathname.match(/^\/activities_autres\/\d+\/groups\/\d+$/)) {
      const pathParts = pathname.split('/');
      const activityId = pathParts[2];
      const groupId = pathParts[4];
      
      extraItems = [
        { label: `Activité #${activityId}`, href: `/activities_autres/${activityId}`, icon: <BookIcon fontSize="small" color='primary'/> },
        { label: 'Groupes', href: `/activities_autres/${activityId}/groups`, icon: <GroupsIcon fontSize="small" color='primary'/> }
      ];
      currentPageLabel = `Groupe #${groupId}`;
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
