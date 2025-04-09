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
          Démonstration Mathématique Formelle: Relation de Conjugaison de Descartes
        </Typography>
        
        <Typography variant="body1">
          Pour déterminer rigoureusement la position du cercle oculaire (pupille de sortie) d'un microscope,
          nous allons utiliser les relations de conjugaison de Descartes et suivre le trajet lumineux à travers
          le système optique complet.
        </Typography>
        
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="h6" gutterBottom>
              1. Définitions et notations
            </Typography>
            
            <Box sx={{ p: 2, bgcolor: 'rgb(248, 248, 255)', borderRadius: 1 }}>
              <Typography variant="body2">
                • f<sub>obj</sub> : distance focale de l'objectif
              </Typography>
              <Typography variant="body2">
                • f<sub>oc</sub> : distance focale de l'oculaire
              </Typography>
              <Typography variant="body2">
                • Δ : intervalle optique (distance entre le plan focal image de l'objectif et le plan focal objet de l'oculaire)
              </Typography>
              <Typography variant="body2">
                • D<sub>A</sub> : position du diaphragme d'ouverture par rapport à l'objectif
              </Typography>
              <Typography variant="body2">
                • p : distance objet (par rapport à l'objectif)
              </Typography>
              <Typography variant="body2">
                • p' : distance image (par rapport à l'objectif)
              </Typography>
              <Typography variant="body2">
                • q : distance objet (par rapport à l'oculaire)
              </Typography>
              <Typography variant="body2">
                • q' : distance image (par rapport à l'oculaire) = position du cercle oculaire
              </Typography>
            </Box>
          </Grid>
          
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="h6" gutterBottom>
              2. Relation de conjugaison de Descartes
            </Typography>
            
            <Box sx={{ p: 2, bgcolor: 'rgb(248, 248, 255)', borderRadius: 1, fontFamily: 'serif' }}>
              <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
                Pour une lentille mince, la relation de Descartes s'écrit:
              </Typography>
              
              <Box sx={{ textAlign: 'center', my: 2, fontFamily: 'serif', fontSize: '1.2rem' }}>
                <Typography variant="h6">
                  1/p + 1/p' = 1/f
                </Typography>
              </Box>
              
              <Typography variant="body2">
                Cette équation fondamentale relie la position de l'objet (p), 
                la position de l'image (p') et la distance focale de la lentille (f).
              </Typography>
            </Box>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 3 }} />
        
        <Typography variant="h6" gutterBottom>
          3. Analyse du trajet optique
        </Typography>
        
        <Box sx={{ pl: 2 }}>
          <Typography variant="body2">
            Dans un microscope, le diaphragme d'ouverture est généralement situé au niveau de l'objectif 
            ou juste derrière celui-ci. Ce diaphragme devient la pupille d'entrée du système.
          </Typography>
          
          <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
            3.1. Position de l'image intermédiaire formée par l'objectif:
          </Typography>
          
          <Box sx={{ p: 2, bgcolor: 'rgb(248, 248, 255)', borderRadius: 1, mx: 3, my: 2 }}>
            <Typography variant="body2">
              Pour un objet placé à distance p ≈ f<sub>obj</sub> (légèrement supérieure à la distance focale):
            </Typography>
            <Box sx={{ textAlign: 'center', my: 2, fontFamily: 'serif', fontSize: '1.1rem' }}>
              1/p + 1/p' = 1/f<sub>obj</sub>
            </Box>
            <Typography variant="body2">
              L'image intermédiaire se forme à une distance p' très grande, donnant un fort grossissement.
            </Typography>
          </Box>
          
          <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
            3.2. Conjugaison du diaphragme d'ouverture à travers l'oculaire:
          </Typography>
          
          <Box sx={{ p: 2, bgcolor: 'rgb(248, 248, 255)', borderRadius: 1, mx: 3, my: 2 }}>
            <Typography variant="body2">
              Le diaphragme d'ouverture, situé près de l'objectif, doit être conjugué à travers tout le système optique
              pour déterminer la position du cercle oculaire.
            </Typography>
            <Typography variant="body2">
              Si q est la distance entre le diaphragme d'ouverture et l'oculaire, on peut écrire:
            </Typography>
            <Box sx={{ textAlign: 'center', my: 2, fontFamily: 'serif', fontSize: '1.1rem' }}>
              q = Δ + f<sub>obj</sub> + D<sub>A</sub>
            </Box>
            <Typography variant="body2">
              En utilisant la relation de conjugaison pour l'oculaire:
            </Typography>
            <Box sx={{ textAlign: 'center', my: 2, fontFamily: 'serif', fontSize: '1.1rem' }}>
              1/q + 1/q' = 1/f<sub>oc</sub>
            </Box>
            <Typography variant="body2">
              Donc: q' = (q × f<sub>oc</sub>)/(q - f<sub>oc</sub>)
            </Typography>
          </Box>
        </Box>
        
        <Divider sx={{ my: 3 }} />
        
        <Typography variant="h6" gutterBottom>
          4. Démonstration de la formule simplifiée
        </Typography>
        
        <Box sx={{ p: 2, bgcolor: 'rgb(245, 245, 255)', borderRadius: 1, mx: 2, my: 2 }}>
          <Typography variant="body2">
            En remplaçant q et en simplifiant, on peut démontrer que la position du cercle oculaire q' est donnée par:
          </Typography>
          
          <Box sx={{ fontFamily: 'serif', px: 4, pt: 2 }}>
            <Typography variant="body2">
              q' = (q × f<sub>oc</sub>)/(q - f<sub>oc</sub>)
            </Typography>
            <Typography variant="body2" sx={{ pl: 2, mt: 1 }}>
              = ((Δ + f<sub>obj</sub> + D<sub>A</sub>) × f<sub>oc</sub>)/((Δ + f<sub>obj</sub> + D<sub>A</sub>) - f<sub>oc</sub>)
            </Typography>
          </Box>
          
          <Typography variant="body2" sx={{ mt: 2 }}>
            Pour un objectif de distance focale très courte (f<sub>obj</sub> ≪ Δ) et un diaphragme d'ouverture situé près 
            de l'objectif (D<sub>A</sub> ≈ 0), on obtient:
          </Typography>
          
          <Box sx={{ fontFamily: 'serif', px: 4 }}>
            <Typography variant="body2">
              q' ≈ (Δ × f<sub>oc</sub>)/(Δ - f<sub>oc</sub>)
            </Typography>
          </Box>
          
          <Typography variant="body2" sx={{ mt: 2 }}>
            De plus, le grossissement de l'objectif M<sub>obj</sub> est lié à l'intervalle optique par la relation:
          </Typography>
          
          <Box sx={{ fontFamily: 'serif', px: 4 }}>
            <Typography variant="body2">
              M<sub>obj</sub> ≈ Δ/f<sub>obj</sub>
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Donc: Δ ≈ M<sub>obj</sub> × f<sub>obj</sub>
            </Typography>
          </Box>
          
          <Typography variant="body2" sx={{ mt: 2 }}>
            En remplaçant cette expression de Δ dans l'équation de q':
          </Typography>
          
          <Box sx={{ fontFamily: 'serif', px: 4 }}>
            <Typography variant="body2">
              q' ≈ (M<sub>obj</sub> × f<sub>obj</sub> × f<sub>oc</sub>)/((M<sub>obj</sub> × f<sub>obj</sub>) - f<sub>oc</sub>)
            </Typography>
          </Box>
          
          <Typography variant="body2" sx={{ mt: 2 }}>
            Pour un objectif à fort grossissement (M<sub>obj</sub> ≫ 1), on peut simplifier:
          </Typography>
          
          <Box sx={{ fontFamily: 'serif', px: 4 }}>
            <Typography variant="body2">
              q' ≈ f<sub>oc</sub> × (1 - 1/(M<sub>obj</sub> × f<sub>obj</sub>/f<sub>oc</sub>))
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              ≈ f<sub>oc</sub> - f<sub>oc</sub>/(M<sub>obj</sub> × f<sub>obj</sub>/f<sub>oc</sub>)
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              ≈ f<sub>oc</sub> - f<sub>oc</sub><sup>2</sup>/(M<sub>obj</sub> × f<sub>obj</sub>)
            </Typography>
          </Box>
          
          <Typography variant="body2" sx={{ mt: 2 }}>
            Pour un microscope standard avec un intervalle optique Δ = 160 mm:
          </Typography>
          
          <Box sx={{ fontFamily: 'serif', px: 4 }}>
            <Typography variant="body2">
              M<sub>obj</sub> × f<sub>obj</sub> ≈ 160
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Donc: q' ≈ f<sub>oc</sub> - f<sub>oc</sub><sup>2</sup>/160 × M<sub>obj</sub>
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
              q' ≈ f<sub>oc</sub> - Δ/M<sub>obj</sub><sup>2</sup>
            </Typography>
          </Box>
          
          <Typography variant="body2" sx={{ mt: 2, fontWeight: 'bold' }}>
            Cette dernière expression est la formule simplifiée couramment utilisée pour calculer la position du cercle oculaire.
          </Typography>
        </Box>
        
        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          5. Conclusion
        </Typography>
        
        <Typography variant="body2">
          Cette démonstration, basée sur les relations de conjugaison de Descartes, montre que la position du cercle oculaire 
          peut être approximée par la formule:
        </Typography>
        
        <Box sx={{ textAlign: 'center', my: 2, fontFamily: 'serif', fontSize: '1.2rem', fontWeight: 'bold' }}>
          Position du cercle oculaire = f<sub>oc</sub> - Δ/M<sub>obj</sub><sup>2</sup>
        </Box>
        
        <Typography variant="body2">
          Où f<sub>oc</sub> est la distance focale de l'oculaire, Δ est l'intervalle optique (généralement 160 mm pour les microscopes 
          conventionnels) et M<sub>obj</sub> est le grossissement de l'objectif.
        </Typography>
        
        <Typography variant="body2">
          Cette formule met en évidence que plus le grossissement de l'objectif est élevé, plus le cercle oculaire se 
          rapproche de la distance focale de l'oculaire, ce qui explique pourquoi les objectifs à fort grossissement 
          sont généralement plus confortables à utiliser: le cercle oculaire se trouve à une distance plus pratique 
          pour l'observation.
        </Typography>
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