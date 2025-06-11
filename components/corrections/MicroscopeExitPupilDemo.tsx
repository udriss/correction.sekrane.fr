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
    // Nouvelle formule basée sur la relation de conjugaison:
    // D = f'2 - Δ/G²  où G = Δ/f'1
    // Donc D = f'2 - f'1²/Δ
    const G = opticalInterval / objectiveFocal;
    const position = eyepieceFocal - (opticalInterval / (G * G));
    // Ou de façon équivalente:
    // const position = eyepieceFocal - ((objectiveFocal * objectiveFocal) / opticalInterval);
    setExitPupilPosition(parseFloat(position.toFixed(2)));
  }, [eyepieceFocal, opticalInterval, objectiveMagnification, objectiveFocal]);
  
  return (
    <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
        Calcul de la Position du Cercle Oculaire (Pupille de Sortie)
      </Typography>
      
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
              Sa position se détermine en utilisant la relation de conjugaison et en faisant l'image de l'objectif à travers l'oculaire.
            </Typography>
          </Paper>
        </Grid>
        
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={1} sx={{ p: 2, mb: 2, bgcolor: 'background.paper' }}>
            <Typography variant="subtitle1" gutterBottom>
              Formule simplifiée :
            </Typography>
            <Box sx={{ p: 1, fontFamily: 'monospace' }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                D = f'<sub>2</sub> - Δ/G<sup>2</sup> = f'<sub>2</sub> - f'<sub>1</sub><sup>2</sup>/Δ
              </Typography>
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                où:
              </Typography>
              <Typography variant="caption" display="block">
                • f'<sub>1</sub> = distance focale de l'objectif ({objectiveFocal} mm)
              </Typography>
              <Typography variant="caption" display="block">
                • f'<sub>2</sub> = distance focale de l'oculaire ({eyepieceFocal} mm)
              </Typography>
              <Typography variant="caption" display="block">
                • Δ = intervalle optique ({opticalInterval} mm)
              </Typography>
              <Typography variant="caption" display="block">
                • G = grossissement de l'objectif = Δ/f'<sub>1</sub> ({objectiveMagnification}x)
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
            1. f'<sub>1</sub> = {objectiveFocal} mm
          </Typography>
          <Typography variant="body2">
            2. f'<sub>2</sub> = {eyepieceFocal} mm
          </Typography>
          <Typography variant="body2">
            3. Δ = {opticalInterval} mm
          </Typography>
          <Typography variant="body2">
            4. G = Δ/f'<sub>1</sub> = {opticalInterval}/{objectiveFocal} = {objectiveMagnification}x
          </Typography>
          <Typography variant="body2">
            5. G<sup>2</sup> = {objectiveMagnification} × {objectiveMagnification} = {(objectiveMagnification * objectiveMagnification).toFixed(1)}
          </Typography>
          <Typography variant="body2">
            6. Δ/G<sup>2</sup> = {opticalInterval}/{(objectiveMagnification * objectiveMagnification).toFixed(1)} = {(opticalInterval / (objectiveMagnification * objectiveMagnification)).toFixed(2)}
          </Typography>
          <Typography variant="body2">
            7. Position = {eyepieceFocal} - {(opticalInterval / (objectiveMagnification * objectiveMagnification)).toFixed(2)} = {exitPupilPosition} mm
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
            Alternative: f'<sub>1</sub><sup>2</sup>/Δ = {objectiveFocal}<sup>2</sup>/{opticalInterval} = {((objectiveFocal * objectiveFocal) / opticalInterval).toFixed(2)}
          </Typography>
        </Box>
      </Paper>
      
      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" gutterBottom>
              Distance focale de l'objectif (mm)
            </Typography>
            <Slider
              value={objectiveFocal}
              onChange={(_, value) => {
                setObjectiveFocal(value as number);
                // Mettre à jour le grossissement qui est lié à la focale par G = Δ/f'1
                setObjectiveMagnification(parseFloat((opticalInterval / (value as number)).toFixed(1)));
              }}
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
              onChange={(_, value) => {
                setOpticalInterval(value as number);
                // Mettre à jour le grossissement qui est lié à l'intervalle par G = Δ/f'1
                setObjectiveMagnification(parseFloat(((value as number) / objectiveFocal).toFixed(1)));
              }}
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
              onChange={(_, value) => {
                setObjectiveMagnification(value as number);
                // Mettre à jour la focale de l'objectif qui est liée au grossissement par f'1 = Δ/G
                setObjectiveFocal(parseFloat((opticalInterval / (value as number)).toFixed(1)));
              }}
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
          {/* Schema on the left side - SIMPLIFIED */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Paper 
              elevation={0} 
              sx={{ 
                height: 320, 
                position: "relative", 
                border: "1px solid #ddd",
                borderRadius: 2,
                bgcolor: "#f9f9ff",
                overflow: "hidden",
                p: 1
              }}
            >
              {/* Title of the schema */}
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
                Coupe longitudinale du microscope
              </Typography>

              {/* Axe optique */}
              <Box sx={{
                position: "absolute",
                left: 10,
                right: 10,
                top: "50%",
                height: 1,
                bgcolor: "#555",
              }} />
              
              {/* Objectif */}
              <Box sx={{
                position: "absolute",
                bottom: 120,
                left: 50,
                width: 8,
                height: 80,
                bgcolor: "#555",
                borderRadius: 2,
                zIndex: 3
              }} />
              <Typography 
                variant="caption" 
                sx={{ 
                  position: "absolute", 
                  bottom: 100, 
                  left: 40,
                  color: "#555",
                  fontWeight: "bold"
                }}
              >
                Objectif
              </Typography>

              {/* Plan focal image objectif */}
              <Box sx={{
                position: "absolute",
                bottom: 120,
                left: 80,
                width: 1,
                height: 30,
                bgcolor: "#555",
                borderStyle: "dashed"
              }} />
              <Typography 
                variant="caption" 
                sx={{ 
                  position: "absolute", 
                  bottom: 140, 
                  left: 90,
                  color: "#555"
                }}
              >
                F'<sub>1</sub>
              </Typography>
              
              {/* Point focal objectif */}
              <Box sx={{
                position: "absolute",
                bottom: 120,
                left: 80,
                width: 6,
                height: 6,
                bgcolor: "#000",
                borderRadius: "50%",
                transform: "translateX(-50%) translateY(-50%)",
                zIndex: 4
              }} />

              {/* Interval optique */}
              <Box sx={{
                position: "absolute",
                bottom: 145,
                left: 80,
                width: 240,
                height: 1,
                borderTop: "1px dashed #777"
              }} />
              <Typography 
                variant="caption" 
                sx={{ 
                  position: "absolute", 
                  bottom: 155, 
                  left: 200,
                  color: "#555",
                  fontWeight: "bold"
                }}
              >
                Δ = {opticalInterval} mm
              </Typography>

              {/* Oculaire */}
              <Box sx={{
                position: "absolute",
                bottom: 120,
                left: 320,
                width: 8,
                height: 60,
                bgcolor: "#555",
                borderRadius: 2,
                zIndex: 3
              }} />
              <Typography 
                variant="caption" 
                sx={{ 
                  position: "absolute", 
                  bottom: 100, 
                  left: 310,
                  color: "#555",
                  fontWeight: "bold"
                }}
              >
                Oculaire
              </Typography>

              {/* Plan focal objet oculaire */}
              <Box sx={{
                position: "absolute",
                bottom: 120,
                left: 320,
                width: 1,
                height: 30,
                bgcolor: "#555",
                borderStyle: "dashed"
              }} />
              <Typography 
                variant="caption" 
                sx={{ 
                  position: "absolute", 
                  bottom: 140, 
                  left: 330,
                  color: "#555"
                }}
              >
                F<sub>2</sub>
              </Typography>
              
              {/* Point focal oculaire */}
              <Box sx={{
                position: "absolute",
                bottom: 120,
                left: 320,
                width: 6,
                height: 6,
                bgcolor: "#000",
                borderRadius: "50%",
                transform: "translateX(-50%) translateY(-50%)",
                zIndex: 4
              }} />

              {/* Cercle oculaire */}
              <Box sx={{ 
                position: "absolute", 
                bottom: 120 + Math.min(Math.max(exitPupilPosition * 2, 0), 100), 
                left: 400, 
                width: 12, 
                height: 12, 
                bgcolor: "#d32f2f", 
                borderRadius: "50%",
                transform: "translateX(-50%)",
                boxShadow: '0 0 8px rgba(211, 47, 47, 0.6)',
                zIndex: 4
              }} />

              {/* Ligne de position cercle oculaire */}
              <Box sx={{
                position: "absolute",
                bottom: 120,
                left: 320,
                width: 100,
                height: 1,
                bgcolor: "#555"
              }} />

              {/* Distance du cercle oculaire */}
              {exitPupilPosition > 0 && (
                <Box sx={{
                  position: "absolute",
                  bottom: 120,
                  left: 400,
                  width: 1,
                  height: Math.min(Math.max(exitPupilPosition * 2, 0), 100),
                  bgcolor: "#d32f2f"
                }} />
              )}

              {/* Œil */}
              <Box sx={{
                position: "absolute",
                bottom: 160 + Math.min(Math.max(exitPupilPosition * 2, 0), 100),
                left: 400,
                width: 30,
                height: 20,
                borderRadius: "50%",
                border: "2px solid #555",
                bgcolor: "transparent",
                transform: "translateX(-50%)",
                zIndex: 2
              }} />

              {/* Rayons lumineux */}
              <Box
                component="svg"
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  zIndex: 1
                }}
                viewBox="0 0 500 320"
              >
                {/* Rayons à travers le système */}
                <path
                  d="M50,160 L320,160 L400,190"
                  stroke="#777"
                  strokeWidth="1"
                  fill="none"
                  strokeDasharray="3,2"
                />
                <path
                  d="M50,160 L320,160 L400,130"
                  stroke="#777"
                  strokeWidth="1"
                  fill="none"
                  strokeDasharray="3,2"
                />
              </Box>

              {/* Valeur de distance */}
              {exitPupilPosition > 0 && (
                <Box sx={{ 
                  position: "absolute", 
                  bottom: 120 + Math.min(Math.max(exitPupilPosition * 2, 0), 100) / 2, 
                  left: 410, 
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
              
              {/* Plan focal image oculaire - f'2 */}
              <Box sx={{
                position: "absolute",
                bottom: 120,
                left: 350,
                width: 1,
                height: 30,
                bgcolor: "#555",
                borderStyle: "dashed"
              }} />
              <Typography 
                variant="caption" 
                sx={{ 
                  position: "absolute", 
                  bottom: 140, 
                  left: 360,
                  color: "#555"
                }}
              >
                F'<sub>2</sub>
              </Typography>
              
              {/* Point focal image oculaire */}
              <Box sx={{
                position: "absolute",
                bottom: 120,
                left: 350,
                width: 6,
                height: 6,
                bgcolor: "#000",
                borderRadius: "50%",
                transform: "translateX(-50%) translateY(-50%)",
                zIndex: 4
              }} />
              
              {/* Échelle */}
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
            </Paper>
          </Grid>
          
          {/* Legend on the right side - SIMPLIFIED */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Paper 
              elevation={0} 
              sx={{ 
                height: 320, 
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
                    width: 8, 
                    height: 30, 
                    bgcolor: "#555",
                    borderRadius: 1,
                    mr: 2 
                  }} />
                  <Typography variant="body2">
                    <strong>Lentilles</strong> (objectif et oculaire)
                  </Typography>
                </Box>
                
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <Box sx={{ 
                    width: 6, 
                    height: 6, 
                    borderRadius: "50%", 
                    bgcolor: "#000",
                    mr: 2
                  }} />
                  <Typography variant="body2">
                    <strong>Points focaux</strong> (F<sub>2</sub>, F'<sub>1</sub>, F'<sub>2</sub>)
                  </Typography>
                </Box>
                
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <Box sx={{ 
                    width: 12, 
                    height: 12, 
                    borderRadius: "50%", 
                    bgcolor: "#d32f2f",
                    mr: 2,
                    boxShadow: '0 0 5px rgba(211, 47, 47, 0.6)'
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
                    bgcolor: "transparent",
                    mr: 2 
                  }} />
                  <Typography variant="body2">
                    <strong>Œil</strong> de l'observateur
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
                      width: 20, 
                      height: 0, 
                      borderTop: "1px dashed #777",
                      mx: 1
                    }} />
                  </Box>
                  <Typography variant="body2">
                    <strong>Distances focales</strong> et parcours lumineux
                  </Typography>
                </Box>
                
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Box sx={{ 
                    width: 20, 
                    height: 0, 
                    borderTop: "1px solid #555", 
                    mr: 2 
                  }} />
                  <Typography variant="body2">
                    <strong>Axe optique</strong> et distances de référence
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ mt: 2, pt: 1, borderTop: "1px solid #eee" }}>
                <Typography variant="caption" sx={{ fontStyle: "italic", display: "block" }}>
                  Position idéale du cercle oculaire: 10-15 mm au-dessus de
                  l'oculaire pour permettre une observation confortable.
                </Typography>
                <Typography variant="caption" sx={{ fontStyle: "italic", display: "block", mt: 0.5 }}>
                  À fort grossissement, le cercle oculaire tend vers la distance
                  focale de l'oculaire (f'<sub>2</sub> = {eyepieceFocal} mm).
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
            ({eyepieceFocal} mm), comme le montre la formule D = f'<sub>2</sub> - Δ/G<sup>2</sup>.
          </Typography>
        </Paper>
      </Box>
    </Paper>
  );
};

export default MicroscopeExitPupilDemo;