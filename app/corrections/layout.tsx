'use client';

import React from 'react';
import { Container } from '@mui/material';
import CorrectionsBreadcrumbs from '@/components/ui/CorrectionsBreadcrumbs';
import { usePathname } from 'next/navigation';

export default function CorrectionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Déterminer le label et les éléments supplémentaires pour chaque page
  const getBreadcrumbConfig = () => {
    // Configuration par défaut
    let currentPageLabel: string | React.ReactNode = '';
    let extraItems: { label: string; href?: string; icon?: React.ReactNode }[] = [];
    
    // Page des corrections
    if (pathname === '/corrections') {
      currentPageLabel = 'Toutes les corrections';
    }
    // Page de nouvelle correction
    else if (pathname === '/corrections/new') {
      currentPageLabel = 'Nouvelle correction';
    }
    // Page de correction unique
    else if (pathname === '/corrections/unique') {
      extraItems = [
        { label: 'Nouvelle correction', href: '/corrections/new' }
      ];
      currentPageLabel = 'Correction unique';
    }
    // Page de corrections multiples
    else if (pathname === '/corrections/multiples') {
      extraItems = [
        { label: 'Nouvelle correction', href: '/corrections/new' }
      ];
      currentPageLabel = 'Corrections multiples';
    }
    // Détail d'une correction individuelle
    else if (pathname && pathname.match(/^\/corrections\/\d+$/)) {
      const correctionId = pathname.split('/').pop();
      // Utilisation de JSX avec span et couleur primary pour le #ID
      currentPageLabel = <>Correction <span style={{ color: '#1976d2', fontWeight: 'bold' }}>#{correctionId}</span></>;
    }
    
    return { currentPageLabel, extraItems };
  };
  
  const { currentPageLabel, extraItems } = getBreadcrumbConfig();

  return (
    <Container maxWidth="lg" className="py-4">
      <CorrectionsBreadcrumbs 
        extraItems={extraItems} 
        currentPageLabel={currentPageLabel} 
      />
      {children}
    </Container>
  );
}
