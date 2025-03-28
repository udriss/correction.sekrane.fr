import React from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Link as MuiLink,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import Link from 'next/link';
import Grid from '@mui/material/Grid';

// Icons
import SchoolIcon from '@mui/icons-material/School';
import CopyrightIcon from '@mui/icons-material/Copyright';
import CodeIcon from '@mui/icons-material/Code';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import AssignmentIcon from '@mui/icons-material/Assignment';

const FooterLink = styled(MuiLink)({
  color: '#fff',
  textDecoration: 'none',
  '&:hover': {
    textDecoration: 'underline',
  },
});

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <Box component="footer" sx={{ 
      bgcolor: '#071F61', 
      color: 'white',
      py: 4,
      mt: 'auto'  // Pour pousser le footer en bas
    }}>
      <Container maxWidth="lg">
        <Grid container spacing={3}>
          {/* À propos de l'application */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="h6" gutterBottom>
              Système de corrections d&apos;activités
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Plateforme complète pour ajouter, gérer et partager des évaluations pédagogiques individuelles ou collectives avec analyse des performances.
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <SchoolIcon sx={{ mr: 1 }} />
              <Typography variant="caption">
                Développé par un enseignants pour des enseignants
              </Typography>
            </Box>
          </Grid>
          
          {/* Licence et droits */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="h6" gutterBottom>
              Licence
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <CopyrightIcon sx={{ mr: 1, fontSize: 'small' }} />
              <Typography variant="body2">
                CC BY-NC-SA 4.0
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Ce projet est distribué sous licence Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International.
            </Typography>
            <FooterLink 
              href="https://creativecommons.org/licenses/by-nc-sa/4.0/" 
              target="_blank"
              rel="noopener"
            >
              En savoir plus sur cette licence
            </FooterLink>
          </Grid>
          
          {/* Ressources */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="h6" gutterBottom>
              Ressources
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link href="/fragments" passHref legacyBehavior>
                <FooterLink>Bibliothèque de fragments</FooterLink>
              </Link>
              <Link href="/faq" passHref legacyBehavior>
                <FooterLink>Foire aux questions</FooterLink>
              </Link>
              <Link href="/privacy" passHref legacyBehavior>
                <FooterLink>Politique de confidentialité</FooterLink>
              </Link>
              
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Tooltip title="Code source">
                  <IconButton 
                    component="a" 
                    href="https://github.com/yourusername/correction.sekrane.fr" 
                    target="_blank"
                    size="small" 
                    sx={{ color: 'white' }}
                  >
                    <CodeIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Télécharger des modèles d'exemple">
                  <IconButton 
                    component="a" 
                    href="/samples/exemple-corrections.xlsx"
                    size="small" 
                    sx={{ color: 'white' }}
                  >
                    <CloudDownloadIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Voir les démonstrations">
                  <IconButton 
                    component={Link} 
                    href="/demo"
                    size="small" 
                    sx={{ color: 'white' }}
                  >
                    <AssignmentIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 3, bgcolor: 'rgba(255, 255, 255, 0.2)' }} />
        
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" sx={{ opacity: 0.8 }}>
            © {currentYear} Système de corrections d&apos;activités | Version Next.js
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.8, mt: { xs: 1, sm: 0 } }}>
            Vos données sont stockées de manière sécurisée et ne sont jamais partagées avec des tiers
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
