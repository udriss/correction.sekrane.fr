"use client";

import React, { useState, useEffect } from 'react';
import { 
  Paper, 
  Typography, 
  Slider, 
  Box, 
  Grid, 
  TextField,
  Divider 
} from '@mui/material';

const MicroscopeExitPupilDemo = () => {
  // State for microscope parameters
  const [objectiveFocal, setObjectiveFocal] = useState<number>(16);
  const [eyepieceFocal, setEyepieceFocal] = useState<number>(10);
  const [opticalInterval, setOpticalInterval] = useState<number>(160);
  const [objectiveMagnification, setObjectiveMagnification] = useState<number>(10);
  
  // Calculated values
  const [exitPupilPosition, setExitPupilPosition] = useState<number>(0);
  
  // Calculate the exit pupil position when parameters change
  useEffect(() => {
    // Formula: Position = eyepieceFocal - (opticalInterval / objectiveMagnification²)
    const position = eyepieceFocal - (opticalInterval / (objectiveMagnification * objectiveMagnification));
    setExitPupilPosition(parseFloat(position.toFixed(2)));
  }, [eyepieceFocal, opticalInterval, objectiveMagnification]);
  
  return (
    <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
        Calcul de la Position du Cercle Oculaire (Pupille de Sortie)
      </Typography>
      
      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" gutterBottom>
              Distance focale de l'objectif (mm)
            </Typography>
            <Slider
              value={objectiveFocal}
              onChange={(_, value) => setObjectiveFocal(value as number)}
              min={1}
              max={40}
              step={0.5}
              valueLabelDisplay="auto"
              sx={{ width: "90%" }}
            />
            <Typography variant="caption" color="text.secondary">
              {objectiveFocal} mm
            </Typography>
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" gutterBottom>
              Distance focale de l'oculaire (mm)
            </Typography>
            <Slider
              value={eyepieceFocal}
              onChange={(_, value) => setEyepieceFocal(value as number)}
              min={5}
              max={25}
              step={0.5}
              valueLabelDisplay="auto"
              sx={{ width: "90%" }}
            />
            <Typography variant="caption" color="text.secondary">
              {eyepieceFocal} mm
            </Typography>
          </Box>
        </Grid>
        
        <Grid size={{ xs: 12, md: 6 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" gutterBottom>
              Intervalle optique (mm)
            </Typography>
            <Slider
              value={opticalInterval}
              onChange={(_, value) => setOpticalInterval(value as number)}
              min={140}
              max={200}
              step={1}
              valueLabelDisplay="auto"
              sx={{ width: "90%" }}
            />
            <Typography variant="caption" color="text.secondary">
              {opticalInterval} mm
            </Typography>
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" gutterBottom>
              Grossissement de l'objectif
            </Typography>
            <Slider
              value={objectiveMagnification}
              onChange={(_, value) => setObjectiveMagnification(value as number)}
              min={4}
              max={100}
              step={1}
              valueLabelDisplay="auto"
              marks={[
                { value: 4, label: '4x' },
                { value: 10, label: '10x' },
                { value: 40, label: '40x' },
                { value: 100, label: '100x' },
              ]}
              sx={{ width: "90%" }}
            />
            <Typography variant="caption" color="text.secondary">
              {objectiveMagnification}x
            </Typography>
          </Box>
        </Grid>
      </Grid>
      
      <Divider sx={{ my: 3 }} />
      
      {/* Mathematical demonstration */}
      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
        Démonstration Mathématique
      </Typography>
      
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={1} sx={{ p: 2, mb: 2, bgcolor: 'background.paper' }}>
            <Typography variant="subtitle1" gutterBottom>
              Principes optiques:
            </Typography>
            <Typography variant="body2" paragraph>
              Dans un microscope, le cercle oculaire est l'image de la pupille d'entrée (diaphragme d'ouverture) formée par l'oculaire.
            </Typography>
            <Typography variant="body2" paragraph>
              La position du cercle oculaire est déterminée par les paramètres optiques du système.
            </Typography>
          </Paper>
        </Grid>
        
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={1} sx={{ p: 2, mb: 2, bgcolor: 'background.paper' }}>
            <Typography variant="subtitle1" gutterBottom>
              Formule de calcul:
            </Typography>
            <Box sx={{ p: 1, fontFamily: 'monospace' }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                Position = f<sub>o</sub> - (Δ / M<sup>2</sup>)
              </Typography>
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                où:
              </Typography>
              <Typography variant="caption" display="block">
                • f<sub>o</sub> = distance focale de l'oculaire ({eyepieceFocal} mm)
              </Typography>
              <Typography variant="caption" display="block">
                • Δ = intervalle optique ({opticalInterval} mm)
              </Typography>
              <Typography variant="caption" display="block">
                • M = grossissement de l'objectif ({objectiveMagnification}x)
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Step by step calculation */}
      <Paper elevation={1} sx={{ p: 3, mt: 3, mb: 3, bgcolor: 'rgb(245, 250, 255)' }}>
        <Typography variant="subtitle1" gutterBottom>
          Calcul étape par étape:
        </Typography>
        <Box sx={{ pl: 2, fontFamily: 'monospace' }}>
          <Typography variant="body2">
            1. f<sub>o</sub> = {eyepieceFocal} mm
          </Typography>
          <Typography variant="body2">
            2. Δ = {opticalInterval} mm
          </Typography>
          <Typography variant="body2">
            3. M = {objectiveMagnification}x
          </Typography>
          <Typography variant="body2">
            4. M<sup>2</sup> = {objectiveMagnification} × {objectiveMagnification} = {objectiveMagnification * objectiveMagnification}
          </Typography>
          <Typography variant="body2">
            5. Δ / M<sup>2</sup> = {opticalInterval} / {objectiveMagnification * objectiveMagnification} = {(opticalInterval / (objectiveMagnification * objectiveMagnification)).toFixed(2)}
          </Typography>
          <Typography variant="body2">
            6. Position = {eyepieceFocal} - {(opticalInterval / (objectiveMagnification * objectiveMagnification)).toFixed(2)} = {exitPupilPosition} mm
          </Typography>
        </Box>
      </Paper>
      
      {/* Result display */}
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Box sx={{ 
          mt: 3, 
          p: 2, 
          bgcolor: "background.paper", 
          borderRadius: 1,
          boxShadow: 1,
          width: "100%",
          maxWidth: 500,
          textAlign: "center"
        }}>
          <Typography variant="h5" color="primary">
            Position du cercle oculaire: {exitPupilPosition} mm
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {exitPupilPosition > 0 ? 
              "Le cercle oculaire se trouve au-dessus de l'oculaire." : 
              "Le cercle oculaire se trouve sous l'oculaire, configuration non optimale."
            }
          </Typography>
        </Box>
      
        {/* Improved visualization with schema on left and legend on right */}
        <Typography variant="h6" sx={{ width: "100%", mt: 4, mb: 2, textAlign: "left" }}>
          Visualisation du cercle oculaire
        </Typography>
        
        <Grid container spacing={2} sx={{ width: "100%", mb: 3 }}>
          {/* Schema on the left side */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Paper 
              elevation={0} 
              sx={{ 
                height: 280, 
                position: "relative", 
                border: "1px solid #ddd",
                borderRadius: 2,
                bgcolor: "#f9f9ff",
                overflow: "hidden",
                p: 1
              }}
            >
              {/* Eye */}
              <Box sx={{
                position: "absolute",
                bottom: 120 + Math.min(Math.max(exitPupilPosition * 3, 0), 80),
                left: "50%",
                width: 40,
                height: 25,
                borderRadius: "50%",
                border: "2px solid #555",
                bgcolor: "#fff9",
                transform: "translateX(-50%)",
                zIndex: 2
              }} />
              
              {/* Eyepiece */}
              <Box sx={{ 
                position: "absolute", 
                bottom: 30, 
                left: "50%", 
                width: 80, 
                height: 60, 
                bgcolor: "#9e9e9e", 
                transform: "translateX(-50%)",
                borderTopLeftRadius: 8,
                borderTopRightRadius: 8,
                zIndex: 3
              }} />
              
              {/* Exit pupil */}
              <Box sx={{ 
                position: "absolute", 
                bottom: 90 + Math.min(Math.max(exitPupilPosition * 3, 0), 80), 
                left: "50%", 
                width: 16, 
                height: 16, 
                bgcolor: "#f44336", 
                borderRadius: "50%",
                transform: "translateX(-50%)",
                boxShadow: '0 0 8px #f44336',
                zIndex: 4
              }} />
              
              {/* Light ray lines */}
              <Box sx={{ 
                position: "absolute", 
                bottom: 30, 
                left: "calc(50% - 35px)", 
                width: 70, 
                height: Math.min(Math.max(exitPupilPosition * 3, 10), 140) + 60, 
                borderLeft: "1.5px dashed #666",
                borderRight: "1.5px dashed #666",
                zIndex: 1
              }} />
              
              {/* Position line - Reference line for measurement */}
              <Box sx={{ 
                position: "absolute", 
                bottom: 90, 
                left: 20, 
                width: "calc(100% - 40px)", 
                height: 1, 
                bgcolor: "#666", 
                borderStyle: "dashed",
                zIndex: 1
              }} />
              
              {/* Vertical measurement line */}
              {exitPupilPosition > 0 && (
                <Box sx={{ 
                  position: "absolute", 
                  bottom: 90, 
                  left: "calc(50% + 50px)", 
                  width: 1, 
                  height: Math.min(Math.max(exitPupilPosition * 3, 0), 80),
                  bgcolor: "#666",
                  zIndex: 1
                }} />
              )}
              
              {/* Distance value */}
              {exitPupilPosition > 0 && (
                <Box sx={{ 
                  position: "absolute", 
                  bottom: 90 + Math.min(Math.max(exitPupilPosition * 3, 0), 80) / 2, 
                  left: "calc(50% + 60px)", 
                  bgcolor: "rgba(255, 255, 255, 0.8)",
                  px: 1,
                  borderRadius: 1,
                  border: "1px solid #ddd",
                  zIndex: 5
                }}>
                  <Typography variant="caption" sx={{ fontWeight: "bold" }}>
                    {exitPupilPosition} mm
                  </Typography>
                </Box>
              )}
              
              {/* Scale indicator */}
              <Box sx={{
                position: "absolute",
                bottom: 10,
                right: 10,
                display: "flex",
                alignItems: "center",
                px: 1,
                py: 0.5,
                bgcolor: "rgba(255, 255, 255, 0.7)",
                borderRadius: 1,
                zIndex: 5
              }}>
                <Box sx={{ width: 30, height: 2, bgcolor: "#000", mr: 1 }}/>
                <Typography variant="caption">10 mm</Typography>
              </Box>
              
              {/* Labels directly on the schema */}
              <Typography 
                variant="caption" 
                sx={{ 
                  position: "absolute", 
                  bottom: 5, 
                  left: "50%", 
                  transform: "translateX(-50%)",
                  fontWeight: "bold",
                  color: "#555",
                  zIndex: 5
                }}
              >
                Oculaire
              </Typography>
              
              <Typography 
                variant="caption" 
                sx={{ 
                  position: "absolute", 
                  bottom: 75, 
                  left: 10,
                  color: "#555",
                  zIndex: 5
                }}
              >
                Plan focal
              </Typography>
              
              <Typography 
                variant="caption" 
                sx={{ 
                  position: "absolute", 
                  top: 10, 
                  left: 10,
                  fontStyle: "italic",
                  color: "#666",
                  zIndex: 5
                }}
              >
                Vue en coupe
              </Typography>
            </Paper>
          </Grid>
          
          {/* Legend on the right side */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Paper 
              elevation={0} 
              sx={{ 
                height: 280, 
                p: 2, 
                border: "1px solid #ddd",
                borderRadius: 2,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between"
              }}
            >
              <Typography variant="subtitle2" gutterBottom sx={{ borderBottom: "1px solid #eee", pb: 0.5 }}>
                Légende du schéma
              </Typography>
              
              <Box sx={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-around" }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <Box sx={{ 
                    width: 16, 
                    height: 16, 
                    borderRadius: "50%", 
                    bgcolor: "#f44336",
                    mr: 2,
                    boxShadow: '0 0 5px #f44336'
                  }} />
                  <Typography variant="body2">
                    <strong>Cercle oculaire</strong> (pupille de sortie)
                  </Typography>
                </Box>
                
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <Box sx={{ 
                    width: 20, 
                    height: 15, 
                    borderRadius: "50%", 
                    border: "2px solid #555",
                    bgcolor: "#fff9",
                    mr: 2 
                  }} />
                  <Typography variant="body2">
                    <strong>Œil</strong> de l'observateur
                  </Typography>
                </Box>
                
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <Box sx={{ 
                    width: 20, 
                    height: 15, 
                    bgcolor: "#9e9e9e", 
                    borderTopLeftRadius: 3,
                    borderTopRightRadius: 3,
                    mr: 2 
                  }} />
                  <Typography variant="body2">
                    <strong>Oculaire</strong> du microscope
                  </Typography>
                </Box>
                
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <Box sx={{ 
                    display: "flex",
                    alignItems: "center",
                    mr: 2,
                    ml: 0.5,
                    width: 18
                  }}>
                    <Box sx={{ 
                      width: 0, 
                      height: 20, 
                      borderLeft: "1.5px dashed #666",
                      mx: 1
                    }} />
                    <Box sx={{ 
                      width: 0, 
                      height: 20, 
                      borderLeft: "1.5px dashed #666"
                    }} />
                  </Box>
                  <Typography variant="body2">
                    <strong>Faisceau lumineux</strong>
                  </Typography>
                </Box>
                
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Box sx={{ 
                    width: 20, 
                    height: 1, 
                    bgcolor: "#666", 
                    mr: 2 
                  }} />
                  <Typography variant="body2">
                    <strong>Plan focal image</strong> (référence 0 mm)
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ mt: 2, pt: 1, borderTop: "1px solid #eee" }}>
                <Typography variant="caption" sx={{ fontStyle: "italic", display: "block" }}>
                  La position idéale du cercle oculaire est de 10-15 mm
                  au-dessus de l'oculaire pour un confort optimal.
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
        
        {/* Interpretation box */}
        <Paper elevation={0} sx={{ width: "100%", p: 2, border: "1px solid #eaeaea", borderRadius: 1, bgcolor: "rgb(250, 250, 255)" }}>
          <Typography variant="subtitle2" gutterBottom>
            Interprétation:
          </Typography>
          <Typography variant="body2" paragraph>
            Le cercle oculaire se situe à <strong>{exitPupilPosition} mm</strong> du plan focal image de l'oculaire. 
            {exitPupilPosition >= 10 && exitPupilPosition <= 15 ? 
              " Cette position est idéale pour l'observation." : 
              exitPupilPosition > 0 && exitPupilPosition < 10 ? 
                " Cette position est acceptable mais pourrait être plus confortable si elle était plus élevée." :
                exitPupilPosition > 15 ?
                  " Cette position est trop éloignée, ce qui peut rendre l'observation moins confortable." :
                  " Cette position n'est pas optimale car elle se situe sous l'oculaire."
            }
          </Typography>
          <Typography variant="body2">
            Plus le grossissement de l'objectif est élevé, plus le cercle oculaire se rapproche de la distance focale de l'oculaire 
            ({eyepieceFocal} mm), rendant l'observation plus confortable.
          </Typography>
        </Paper>
      </Box>
    </Paper>
  );
};

export default MicroscopeExitPupilDemo;