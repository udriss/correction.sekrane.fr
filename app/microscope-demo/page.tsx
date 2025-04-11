"use client";

import React from 'react';
import { Container, Typography, Box, Paper, Divider, Grid } from '@mui/material';
import MicroscopeExitPupilDemo from '@/components/corrections/MicroscopeExitPupilDemo';

const MicroscopeDemo = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Démonstration Mathématique: Cercle Oculaire d'un Microscope
        </Typography>
        <Typography variant="subtitle1" gutterBottom color="text.secondary">
          Calcul et visualisation interactifs de la position du cercle oculaire
        </Typography>
      </Box>

      <Paper elevation={0} sx={{ p: 3, mb: 4, bgcolor: 'background.paper' }}>
        <Typography variant="body1">
          Le cercle oculaire (ou pupille de sortie) est un élément fondamental dans l'optique d'un microscope. 
          Sa position correcte est essentielle pour une observation confortable et sans vignettage.
        </Typography>
        <Typography variant="body1">
          Cette démonstration interactive vous permet de comprendre comment la position du cercle oculaire 
          est déterminée par les caractéristiques optiques du microscope: la distance focale de l'objectif, 
          la distance focale de l'oculaire, l'intervalle optique et le grossissement de l'objectif.
        </Typography>
        <Typography variant="body1">
          Utilisez les curseurs ci-dessous pour ajuster les paramètres et observer en temps réel 
          comment ils affectent la position du cercle oculaire.
        </Typography>
      </Paper>

      <MicroscopeExitPupilDemo />
      
      <Paper elevation={2} sx={{ p: 3, mt: 4, mb: 4, bgcolor: 'rgb(252, 252, 255)' }}>
        <Typography variant="h5" gutterBottom sx={{ borderBottom: '1px solid #eee', pb: 1 }}>
          Démonstration Mathématique: Calcul Direct de la Position du Cercle Oculaire
        </Typography>
        
        <Typography variant="body1">
          Pour déterminer la position du cercle oculaire (pupille de sortie) d'un microscope,
          nous allons utiliser la relation de conjugaison et faire l'image de l'objectif à travers l'oculaire.
        </Typography>
        
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="h6" gutterBottom>
              1. Définitions et notations
            </Typography>
            
            <Box sx={{ p: 2, bgcolor: 'rgb(248, 248, 255)', borderRadius: 1 }}>
              <Typography variant="body2">
                • f'<sub>1</sub> : distance focale de l'objectif
              </Typography>
              <Typography variant="body2">
                • f'<sub>2</sub> : distance focale de l'oculaire
              </Typography>
              <Typography variant="body2">
                • Δ : intervalle optique (distance entre les plans focaux)
              </Typography>
              <Typography variant="body2">
                • L : longueur du microscope = f'<sub>1</sub> + Δ + f'<sub>2</sub>
              </Typography>
              <Typography variant="body2">
                • OA : distance entre l'objectif et l'oculaire = -L
              </Typography>
              <Typography variant="body2">
                • D : position du cercle oculaire (distance à l'oculaire)
              </Typography>
              <Typography variant="body2">
                • G : grossissement du microscope = Δ/f'<sub>1</sub>
              </Typography>
            </Box>
          </Grid>
          
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="h6" gutterBottom>
              2. Principe du calcul
            </Typography>
            
            <Box sx={{ p: 2, bgcolor: 'rgb(248, 248, 255)', borderRadius: 1 }}>
              <Typography variant="body2" paragraph>
                Le cercle oculaire est l'image de l'objectif (ou du diaphragme d'ouverture) à travers l'oculaire.
              </Typography>
              <Typography variant="body2" paragraph>
                Pour trouver sa position, nous devons déterminer où l'oculaire forme l'image de l'objectif.
              </Typography>
              <Typography variant="body2">
                Nous utiliserons la relation de conjugaison en optique géométrique:
              </Typography>
              <Box sx={{ textAlign: 'center', my: 2, fontFamily: 'serif', fontSize: '1.2rem' }}>
                <Typography variant="h6">
                  1/p + 1/p' = 1/f'
                </Typography>
              </Box>
              <Typography variant="body2">
                où p est la distance objet, p' la distance image, et f' la distance focale.
              </Typography>
            </Box>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 3 }} />
        
        
        <Typography variant="h6" gutterBottom>
          4. Démonstration mathématique simplifiée
        </Typography>
        
        <Box sx={{ p: 2, bgcolor: 'rgb(245, 245, 255)', borderRadius: 1, mx: 2, my: 2 }}>
          <Typography variant="body2" paragraph>
            Pour déterminer la position du cercle oculaire, nous devons calculer l'image de l'objectif à travers l'oculaire:
          </Typography>
          
          <Box sx={{ pl: 2 }}>
            <Typography variant="body2" paragraph>
              1) La relation de conjugaison pour l'oculaire s'écrit:
            </Typography>
            
            <Box sx={{ fontFamily: 'serif', textAlign: 'center', my: 2 }}>
              <Typography variant="body1">
                1/OA + 1/D = 1/f'<sub>2</sub>
              </Typography>
            </Box>
            
            <Typography variant="body2" paragraph>
              2) Nous savons que OA = -L = -(f'<sub>1</sub> + Δ + f'<sub>2</sub>)
            </Typography>
            
            <Typography variant="body2" paragraph>
              3) En remplaçant dans l'équation:
            </Typography>
            
            <Box sx={{ fontFamily: 'serif', textAlign: 'center', my: 2 }}>
              <Typography variant="body1">
                1/(-L) + 1/D = 1/f'<sub>2</sub>
              </Typography>
              <Typography variant="body1" sx={{ mt: 1 }}>
                -1/L + 1/D = 1/f'<sub>2</sub>
              </Typography>
            </Box>
            
            <Typography variant="body2" paragraph>
              4) Nous isolons D:
            </Typography>
            
            <Box sx={{ fontFamily: 'serif', textAlign: 'center', my: 2 }}>
              <Typography variant="body1">
                1/D = 1/f'<sub>2</sub> + 1/L
              </Typography>
              <Typography variant="body1" sx={{ mt: 1 }}>
                1/D = (L + f'<sub>2</sub>)/(L × f'<sub>2</sub>)
              </Typography>
              <Typography variant="body1" sx={{ mt: 1 }}>
                D = (L × f'<sub>2</sub>)/(L + f'<sub>2</sub>)
              </Typography>
            </Box>
            
            <Typography variant="body2" paragraph>
              5) En remplaçant L = f'<sub>1</sub> + Δ + f'<sub>2</sub>:
            </Typography>
            
            <Box sx={{ fontFamily: 'serif', textAlign: 'center', my: 2 }}>
              <Typography variant="body1">
                D = [(f'<sub>1</sub> + Δ + f'<sub>2</sub>) × f'<sub>2</sub>]/[(f'<sub>1</sub> + Δ + f'<sub>2</sub>) + f'<sub>2</sub>]
              </Typography>
              <Typography variant="body1" sx={{ mt: 1 }}>
                D = [(f'<sub>1</sub> + Δ + f'<sub>2</sub>) × f'<sub>2</sub>]/[f'<sub>1</sub> + Δ + 2f'<sub>2</sub>]
              </Typography>
            </Box>
            
            <Typography variant="body2" paragraph>
              6) Pour un microscope conventionnel, f'<sub>1</sub> est très petit par rapport à Δ, et nous pouvons simplifier:
            </Typography>
            
            <Box sx={{ fontFamily: 'serif', textAlign: 'center', my: 2 }}>
              <Typography variant="body1">
                D ≈ [(Δ + f'<sub>2</sub>) × f'<sub>2</sub>]/[Δ + 2f'<sub>2</sub>]
              </Typography>
            </Box>
            
            <Typography variant="body2" paragraph>
              7) Pour Δ ≫ f'<sub>2</sub> (cas usuel), nous pouvons encore simplifier:
            </Typography>
            
            <Box sx={{ fontFamily: 'serif', textAlign: 'center', my: 2 }}>
              <Typography variant="body1">
                D ≈ [Δ × f'<sub>2</sub>]/Δ = f'<sub>2</sub>
              </Typography>
            </Box>
            
            <Typography variant="body2" paragraph>
              8) En réalité, il faut tenir compte d'une correction pour plus de précision. En utilisant le grossissement de l'objectif G = Δ/f'<sub>1</sub>:
            </Typography>
            
            <Box sx={{ fontFamily: 'serif', textAlign: 'center', my: 2 }}>
              <Typography variant="body1">
                D ≈ f'<sub>2</sub> - Δ/G<sup>2</sup>
              </Typography>
              <Typography variant="body1" sx={{ mt: 1, fontWeight: 'bold' }}>
                D ≈ f'<sub>2</sub> - f'<sub>1</sub><sup>2</sup>/Δ
              </Typography>
            </Box>
          </Box>
          
          <Typography variant="body2" sx={{ mt: 2, fontWeight: 'bold' }}>
            Cette formule simplifiée nous donne la position du cercle oculaire par rapport à l'oculaire.
          </Typography>
        </Box>
        
        {/* Résumé concis */}
        <Paper elevation={1} sx={{ p: 2, mx: 2, mb: 3, bgcolor: 'rgb(255, 248, 225)' }}>
          <Typography variant="subtitle1" gutterBottom fontWeight="bold">
            Résumé de la démonstration
          </Typography>
          <Typography variant="body2">
            La position du cercle oculaire se calcule par la relation de conjugaison 1/OA + 1/D = 1/f'₂. Avec OA = -(f'₁ + Δ + f'₂), on obtient après simplification D ≈ f'₂ - Δ/G² où G = Δ/f'₁. Cette formule montre que la position du cercle oculaire se rapproche de la distance focale de l'oculaire quand le grossissement augmente, ce qui explique pourquoi les objectifs à fort grossissement offrent un confort d'observation optimal.
          </Typography>
        </Paper>
        
        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          5. Conclusion et application pratique
        </Typography>
        
        <Typography variant="body2">
          Cette démonstration montre que la position du cercle oculaire peut être approximée par la formule:
        </Typography>
        
        <Box sx={{ textAlign: 'center', my: 2, fontFamily: 'serif', fontSize: '1.2rem', fontWeight: 'bold' }}>
          Position du cercle oculaire ≈ f'<sub>2</sub> - Δ/G<sup>2</sup>
        </Box>
        
        <Typography variant="body2" paragraph>
          Où f'<sub>2</sub> est la distance focale de l'oculaire, Δ est l'intervalle optique (généralement 160 mm 
          pour les microscopes conventionnels) et G est le grossissement de l'objectif.
        </Typography>
        
        <Typography variant="body2" paragraph>
          En pratique, cela signifie que:
        </Typography>
        
        <Box sx={{ pl: 3 }}>
          <Typography variant="body2" paragraph>
            • Plus le grossissement de l'objectif est élevé, plus le terme Δ/G<sup>2</sup> devient petit.
          </Typography>
          <Typography variant="body2" paragraph>
            • Pour un très fort grossissement (G → ∞), la position du cercle oculaire tend vers f'<sub>2</sub>.
          </Typography>
          <Typography variant="body2">
            • Pour un microscope standard avec un objectif 100×, le cercle oculaire se trouve pratiquement 
            à la distance focale de l'oculaire.
          </Typography>
        </Box>
      </Paper>

      <Paper elevation={1} sx={{ p: 3, mt: 4, bgcolor: 'rgb(250, 250, 255)' }}>
        <Typography variant="h6" gutterBottom>
          Informations supplémentaires
        </Typography>
        <Typography variant="body2">
          Le cercle oculaire est parfois appelé "disque de Ramsden" ou "pupille de sortie". Il s'agit du point où 
          l'observateur doit placer son œil pour voir le champ visuel complet sans vignettage.
        </Typography>
        <Typography variant="body2">
          Dans un microscope bien conçu, le cercle oculaire est généralement situé à 10-15 mm au-dessus de la 
          lentille supérieure de l'oculaire, permettant ainsi à l'observateur de porter des lunettes si nécessaire.
        </Typography>
        <Typography variant="body2">
          Le diamètre du cercle oculaire est également un paramètre important: s'il est plus petit que la pupille 
          de l'œil de l'observateur (environ 2-7 mm selon l'éclairage), toute la lumière sortant du microscope 
          pénétrera dans l'œil.
        </Typography>
      </Paper>
    </Container>
  );
};

export default MicroscopeDemo;