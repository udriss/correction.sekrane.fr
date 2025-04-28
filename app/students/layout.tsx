'use client';

import React from 'react';
import { Container } from '@mui/material';
import StudentsBreadcrumbs from '@/components/ui/StudentsBreadcrumbs';
import { usePathname } from 'next/navigation';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import AssignmentIcon from '@mui/icons-material/Assignment';

export default function StudentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Déterminer le label et les éléments supplémentaires pour chaque page
  const getBreadcrumbConfig = () => {
    // Configuration par défaut
    let currentPageLabel = '';
    let extraItems: { label: string; href?: string; icon?: React.ReactNode }[] = [];
    
    // Si pathname est null, retourner la configuration par défaut
    if (!pathname) {
      return { currentPageLabel, extraItems };
    }
    
    // Page principale des étudiants
    if (pathname === '/students') {
      currentPageLabel = 'Tous les étudiants';
    }
    // Page de détail d'un étudiant
    else if (pathname.match(/^\/students\/\d+$/)) {
      const studentId = pathname.split('/').pop();
      currentPageLabel = `Étudiant #${studentId}`;
    }
    // Page des classes d'un étudiant
    else if (pathname.match(/^\/students\/\d+\/classes$/)) {
      const studentId = pathname.split('/')[2];
      extraItems = [
        { label: `Étudiant #${studentId}`, href: `/students/${studentId}`, icon: <PersonIcon fontSize="small" /> }
      ];
      currentPageLabel = 'Classes';
    }
    // Page des corrections d'un étudiant
    else if (pathname.match(/^\/students\/\d+\/corrections$/)) {
      const studentId = pathname.split('/')[2];
      extraItems = [
        { label: `Étudiant #${studentId}`, href: `/students/${studentId}`, icon: <PersonIcon fontSize="small" /> }
      ];
      currentPageLabel = 'Corrections';
    }
    // Page d'ajout d'une correction pour un étudiant
    else if (pathname.match(/^\/students\/\d+\/corrections\/new$/)) {
      const studentId = pathname.split('/')[2];
      extraItems = [
        { label: `Étudiant #${studentId}`, href: `/students/${studentId}`, icon: <PersonIcon fontSize="small" /> },
        { label: 'Corrections', href: `/students/${studentId}/corrections`, icon: <AssignmentIcon fontSize="small" /> }
      ];
      currentPageLabel = 'Nouvelle correction';
    }
    // Page d'une classe spécifique de l'étudiant
    else if (pathname.match(/^\/students\/\d+\/classes\/\d+$/)) {
      const pathParts = pathname.split('/');
      const studentId = pathParts[2];
      const classId = pathParts[4];
      
      extraItems = [
        { label: `Étudiant #${studentId}`, href: `/students/${studentId}`, icon: <PersonIcon fontSize="small" /> },
        { label: 'Classes', href: `/students/${studentId}/classes`, icon: <SchoolIcon fontSize="small" /> }
      ];
      currentPageLabel = `Classe #${classId}`;
    }
    
    return { currentPageLabel, extraItems };
  };
  
  const { currentPageLabel, extraItems } = getBreadcrumbConfig();

  return (
    <Container maxWidth="lg" className="py-4">
      {/* Ne pas afficher les breadcrumbs pour les pages students/[id]/corrections */}
      {!pathname.match(/^\/students\/\d+\/corrections$/) && (
        <StudentsBreadcrumbs 
          extraItems={extraItems} 
          currentPageLabel={currentPageLabel} 
        />
      )}
      {children}
    </Container>
  );
}
