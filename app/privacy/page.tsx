'use client';

import React from 'react';
import { 
  Container, 
  Typography, 
  Paper, 
  Box, 
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Grid
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import LockIcon from '@mui/icons-material/Lock';
import StorageIcon from '@mui/icons-material/Storage';
import DataUsageIcon from '@mui/icons-material/DataUsage';
import CookieIcon from '@mui/icons-material/Cookie';
import PolicyIcon from '@mui/icons-material/PolicyOutlined';
import QueryBuilderIcon from '@mui/icons-material/QueryBuilder';
import ChildCareIcon from '@mui/icons-material/ChildCare';

export default function PrivacyPolicyPage() {
  // Get current date for the last update
  const lastUpdated = new Date('2025-03-21').toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="max-w-4xl mx-auto py-8">
    <Container maxWidth="lg" className="py-8">
      <Paper elevation={2} className="p-6">
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <SecurityIcon fontSize="large" color="primary" sx={{ mr: 2 }} />
          <Typography variant="h4" component="h1">
            Politique de confidentialité
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Chip 
            icon={<QueryBuilderIcon />} 
            label={`Dernière mise à jour : ${lastUpdated}`} 
            variant="outlined" 
            color="primary"
          />
        </Box>
        
        <Typography variant="body1">
          Cette politique de confidentialité décrit comment nous collectons, utilisons et protégeons vos données personnelles lorsque vous utilisez notre Système de corrections d'activités. Nous nous engageons à protéger votre vie privée et à traiter vos données avec transparence.
        </Typography>

        <Divider sx={{ my: 4 }} />
        
        <Typography variant="h5" component="h2" gutterBottom>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <DataUsageIcon color="primary" sx={{ mr: 1 }} />
            Données collectées
          </Box>
        </Typography>
        
        <Typography variant="body1">
          Les types de données suivantes sont collectées lorsque vous utilisez notre service :
        </Typography>
        
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, md: 6, sm: 8 }}>
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Fournies par vous
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="Nom d'élève (pour les corrections)" secondary="Utilisé uniquement à des fins d'organisation" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Contenu des corrections" secondary="Texte et évaluations que vous ajoutez" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Fragments et modèles" secondary="Contenu réutilisable que vous ajoutez" />
                </ListItem>
              </List>
            </Paper>
          </Grid>
          
          <Grid size={{ xs: 12, md: 6, sm: 8 }}>
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
               Collectées automatiquement
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="Informations de session" secondary="Pour maintenir votre connexion sécurisée" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Données d'utilisation anonymisées" secondary="Pour améliorer nos services" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Cookies techniques" secondary="Essentiels au fonctionnement du site" />
                </ListItem>
              </List>
            </Paper>
          </Grid>
        </Grid>
        
        <Typography variant="h5" component="h2" gutterBottom>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <StorageIcon color="primary" sx={{ mr: 1 }} />
            Utilisation des données
          </Box>
        </Typography>
        
        <Typography variant="body1" sx={{ mt: 1, mb: -1 }}>
          Vos données sont utilisées aux fins suivantes :
        </Typography>
        <List>
          <ListItem>
            <ListItemIcon>
              <LockIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Fournir nos services" 
              secondary="Permettre la création, la gestion et le partage des corrections et des évaluations" 
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <SecurityIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Sécurité" 
              secondary="Protéger notre plateforme et les utilisateurs contre la fraude ou les abus" 
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <DataUsageIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Amélioration" 
              secondary="Analyser l'utilisation pour améliorer nos fonctionnalités et votre expérience" 
            />
          </ListItem>
        </List>
        
        <Divider sx={{ my: 4 }} />
        
        <Typography variant="h5" component="h2" gutterBottom>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CookieIcon color="primary" sx={{ mr: 1 }} />
            Cookies et technologies similaires
          </Box>
        </Typography>
        
        <Typography variant="body1">
          Notre site utilise uniquement des cookies essentiels au fonctionnement de la plateforme. Ces cookies ne collectent pas d'informations personnelles et sont supprimés lorsque vous fermez votre navigateur.
        </Typography>
        
        <Typography variant="body1">
          Nous n'utilisons pas de cookies de suivi ou publicitaires. Les seuls cookies utilisés servent à maintenir votre session active et à garantir la sécurité de votre connexion.
        </Typography>
        
        <Divider sx={{ my: 4 }} />
        
        <Typography variant="h5" component="h2" gutterBottom>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ChildCareIcon color="primary" sx={{ mr: 1 }} />
            Protection des données des mineurs
          </Box>
        </Typography>
        
        <Typography variant="body1">
          Notre service est destiné aux enseignants et aux professionnels de l'éducation. Nous ne collectons pas sciemment des données personnelles d'élèves mineurs. Les noms d'élèves utilisés dans les corrections sont sous la responsabilité des enseignants qui les saisissent.
        </Typography>
        
        <Typography variant="body1">
          Nous recommandons aux enseignants d'utiliser des pseudonymes ou des codes pour identifier les élèves mineurs lors de l'utilisation de notre plateforme.
        </Typography>
        
        <Divider sx={{ my: 4 }} />
        
        <Typography variant="h5" component="h2" gutterBottom>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PolicyIcon color="primary" sx={{ mr: 1 }} />
            Vos droits
          </Box>
        </Typography>
        
        <Typography variant="body1">
          Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants concernant vos données :
        </Typography>
        
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, md: 4, sm: 6 }}>
            <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Droit d'accès
              </Typography>
              <Typography variant="body2">
                Vous pouvez demander une copie de vos données personnelles.
              </Typography>
            </Paper>
          </Grid>
          
          <Grid size={{ xs: 12, md: 4, sm: 6 }}>
            <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Droit de rectification
              </Typography>
              <Typography variant="body2">
                Vous pouvez demander la correction de données inexactes.
              </Typography>
            </Paper>
          </Grid>
          
          <Grid size={{ xs: 12, md: 4, sm: 6 }}>
            <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Droit à l'effacement
              </Typography>
              <Typography variant="body2">
                Vous pouvez demander la suppression de vos données.
              </Typography>
            </Paper>
          </Grid>
          
          <Grid size={{ xs: 12, md: 4, sm: 6 }}>
            <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Droit à la limitation
              </Typography>
              <Typography variant="body2">
                Vous pouvez demander de limiter le traitement de vos données.
              </Typography>
            </Paper>
          </Grid>
          
          <Grid size={{ xs: 12, md: 4, sm: 6 }}>
            <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Droit à la portabilité
              </Typography>
              <Typography variant="body2">
                Vous pouvez demander à recevoir vos données dans un format structuré.
              </Typography>
            </Paper>
          </Grid>
          
          <Grid size={{ xs: 12, md: 4, sm: 6 }}>
            <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Droit d'opposition
              </Typography>
              <Typography variant="body2">
                Vous pouvez vous opposer au traitement de vos données.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
        
        <Typography variant="body1">
          Pour exercer ces droits, veuillez nous contacter à l'adresse suivante : admin@sekrane.fr
        </Typography>
        
        <Divider sx={{ my: 4 }} />
        
        <Typography variant="h5" component="h2" gutterBottom>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <SecurityIcon color="primary" sx={{ mr: 1 }} />
            Sécurité des données
          </Box>
        </Typography>
        
        <Typography variant="body1">
          Nous prenons la sécurité de vos données très au sérieux et mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos informations personnelles contre la perte, l'accès non autorisé, la divulgation, l'altération et la destruction.
        </Typography>
        
        <Typography variant="body1">
          Parmi nos mesures de sécurité figurent le chiffrement des données, l'accès restreint aux informations personnelles, et des examens réguliers de nos pratiques de collecte, de stockage et de traitement.
        </Typography>
        
        <Divider sx={{ my: 4 }} />
        
        <Typography variant="h5" component="h2" gutterBottom>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <QueryBuilderIcon color="primary" sx={{ mr: 1 }} />
            Modifications de cette politique
          </Box>
        </Typography>
        
        <Typography variant="body1">
          Nous pouvons mettre à jour cette politique de confidentialité de temps à autre. La version la plus récente sera toujours disponible sur cette page, avec la date de la dernière modification.
        </Typography>
        
        <Typography variant="body1">
          Nous vous encourageons à consulter régulièrement cette page pour rester informé de tout changement concernant notre politique de confidentialité.
        </Typography>
        
        <Box sx={{ mt: 4, p: 3, bgcolor: 'primary.main', color: 'white', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Contact
          </Typography>
          <Typography variant="body1">
            Si vous avez des questions concernant cette politique de confidentialité ou nos pratiques en matière de protection des données, veuillez nous contacter à l'adresse suivante :
          </Typography>
          <Typography variant="body1" fontWeight="bold" sx={{ mt: 1 }}>
            admin@sekrane.fr
          </Typography>
        </Box>
      </Paper>
    </Container>
    </div>
  );
}
