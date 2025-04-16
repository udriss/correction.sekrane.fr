'use client';

import React from 'react';
import { Container } from '@mui/material';
import ClassesBreadcrumbs from '@/components/ui/ClassesBreadcrumbs';
import { usePathname } from 'next/navigation';
import SchoolIcon from '@mui/icons-material/School';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';

export default function ClassesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() || '';
  
  // Déterminer le label et les éléments supplémentaires pour chaque page
  const getBreadcrumbConfig = () => {
    // Configuration par défaut
    let currentPageLabel = '';
    let extraItems: { label: string; href?: string; icon?: React.ReactNode }[] = [];
    
    // Page principale des classes
    if (pathname === '/classes') {
      currentPageLabel = 'Toutes les classes';
    }
    // Page de nouvelle classe
    else if (pathname === '/classes/new') {
      currentPageLabel = 'Nouvelle classe';
    }
    // Page d'importation de classes
    else if (pathname === '/classes/import') {
      currentPageLabel = 'Importation de classes';
    }
    // Page statistiques des classes
    else if (pathname === '/classes/analytics') {
      currentPageLabel = 'Statistiques';
    }
    // Page détail d'une classe
    else if (pathname.match(/^\/classes\/\d+$/)) {
      const classId = pathname.split('/').pop();
      currentPageLabel = `Classe #${classId}`;
    }
    // Page des étudiants d'une classe
    else if (pathname.match(/^\/classes\/\d+\/students$/)) {
      const classId = pathname.split('/')[2];
      extraItems = [
        { label: `Classe #${classId}`, href: `/classes_autres/${classId}`, icon: <SchoolIcon fontSize="small" /> }
      ];
      currentPageLabel = 'Étudiants';
    }
    // Page des corrections d'une classe
    else if (pathname.match(/^\/classes\/\d+\/corrections$/)) {
      const classId = pathname.split('/')[2];
      extraItems = [
        { label: `Classe #${classId}`, href: `/classes_autres/${classId}`, icon: <SchoolIcon fontSize="small" /> }
      ];
      currentPageLabel = 'Corrections';
    }
    // Page pour ajouter une correction à une classe
    else if (pathname.match(/^\/classes\/\d+\/corrections\/new$/)) {
      const classId = pathname.split('/')[2];
      extraItems = [
        { label: `Classe #${classId}`, href: `/classes_autres/${classId}`, icon: <SchoolIcon fontSize="small" /> },
        { label: 'Corrections', href: `/classes_autres/${classId}/corrections`, icon: <AssignmentIcon fontSize="small" /> }
      ];
      currentPageLabel = 'Nouvelle correction';
    }
    // Page d'un étudiant dans une classe
    else if (pathname.match(/^\/classes\/\d+\/students\/\d+$/)) {
      const pathParts = pathname.split('/');
      const classId = pathParts[2];
      const studentId = pathParts[4];
      
      extraItems = [
        { label: `Classe #${classId}`, href: `/classes_autres/${classId}`, icon: <SchoolIcon fontSize="small" /> },
        { label: 'Étudiants', href: `/classes_autres/${classId}/students`, icon: <PeopleIcon fontSize="small" /> }
      ];
      currentPageLabel = `Étudiant #${studentId}`;
    }
    
    return { currentPageLabel, extraItems };
  };
  
  const { currentPageLabel, extraItems } = getBreadcrumbConfig();

  return (
    <Container maxWidth="lg" className="py-4">
      <ClassesBreadcrumbs 
        extraItems={extraItems} 
        currentPageLabel={currentPageLabel} 
      />
      {children}
    </Container>
  );
}
