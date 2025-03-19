'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Container,
  useTheme
} from '@mui/material';
import { 
  School as SchoolIcon,
  MenuBook as MenuBookIcon,
  EmojiObjects as EmojiObjectsIcon,
  Science as ScienceIcon,
  Error as ErrorIcon,
  FindInPage as FindInPageIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

export default function NotFound() {
  const theme = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // Animation pour les icônes
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) return null;
  
  return (
    <Container maxWidth="md" className="min-h-screen flex items-center justify-center py-1">
      <Paper 
        elevation={3}
        className="w-full rounded-xl overflow-hidden"
      >
        {/* En-tête coloré */}
        <Box 
          className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-6 py-1"
          sx={{
            borderBottom: `4px solid ${theme.palette.secondary.main}`
          }}
        >
          <Typography variant="h4" component="h1" className="flex items-center gap-2 font-bold">
            <ErrorIcon fontSize="large" />
            Page non trouvée
          </Typography>
        </Box>
        
        {/* Contenu principal */}
        <Box className="p-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <Typography variant="h1" className="text-9xl font-bold text-gray-200">
              404
            </Typography>
          </motion.div>
          
          {/* Message */}
            <Box className="mb-8 flex flex-col items-center">
            <Typography variant="h5" className="mb-2 font-semibold text-gray-800">
              Cette page a disparu !
            </Typography>
            <Typography variant="body1" className="text-gray-600 max-w-md text-center">
              Il semble que cette page soit en cours d'apprentissage et ne soit pas encore prête à être présentée.
            </Typography>
            </Box>
          
          {/* Animation des icônes éducatives */}
          <Box className="my-10 relative h-24">
            {/* Cercle d'icônes qui tournent */}
            <motion.div 
              className="grid grid-cols-5 gap-4 mx-auto max-w-md"
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.7 }}
            >
              {/* Icône 1 - Livre */}
              <motion.div
                animate={{ 
                  y: [0, -10, 0],
                  rotateZ: [0, -5, 0, 5, 0]
                }}
                transition={{ 
                  duration: 3, 
                  ease: "easeInOut", 
                  repeat: Infinity,
                  repeatType: "reverse" 
                }}
                className="flex justify-center text-blue-500"
              >
                <MenuBookIcon sx={{ fontSize: "3rem" }} />
              </motion.div>
              
              {/* Icône 2 - Science */}
              <motion.div 
                animate={{ 
                  y: [0, -15, 0],
                  rotateZ: [0, 10, 0, -10, 0]
                }}
                transition={{ 
                  duration: 3.5, 
                  ease: "easeInOut", 
                  repeat: Infinity,
                  repeatType: "reverse",
                  delay: 0.2
                }}
                className="flex justify-center text-green-500"
              >
                <ScienceIcon sx={{ fontSize: "3rem" }} />
              </motion.div>
              
              {/* Icône 3 - Recherche */}
              <motion.div 
                animate={{ 
                  y: [0, -20, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 2.5, 
                  ease: "easeInOut", 
                  repeat: Infinity,
                  repeatType: "reverse",
                  delay: 0.5
                }}
                className="flex justify-center text-red-500"
              >
                <FindInPageIcon sx={{ fontSize: "3.5rem" }} />
              </motion.div>
              
              {/* Icône 4 - Idée */}
              <motion.div 
                animate={{ 
                  y: [0, -15, 0],
                  rotateZ: [0, -10, 0, 10, 0]
                }}
                transition={{ 
                  duration: 3, 
                  ease: "easeInOut", 
                  repeat: Infinity,
                  repeatType: "reverse",
                  delay: 0.7
                }}
                className="flex justify-center text-amber-500"
              >
                <EmojiObjectsIcon sx={{ fontSize: "3rem" }} />
              </motion.div>
              
              {/* Icône 5 - Diplôme */}
              <motion.div 
                animate={{ 
                  y: [0, -10, 0],
                  rotateZ: [0, 5, 0, -5, 0]
                }}
                transition={{ 
                  duration: 2.7, 
                  ease: "easeInOut", 
                  repeat: Infinity,
                  repeatType: "reverse",
                  delay: 0.3
                }}
                className="flex justify-center text-purple-500"
              >
                <SchoolIcon sx={{ fontSize: "3rem" }} />
              </motion.div>
            </motion.div>
          </Box>
          
          {/* Bouton d'action */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            <Button 
              variant="contained" 
              color="primary" 
              size="large" 
              component={Link}
              href="/"
              startIcon={<HomeIcon />}
              className="px-8 py-3 text-lg"
            >
              Retour à l'accueil
            </Button>
          </motion.div>
        </Box>
        
        {/* Pied de page */}
        <Box className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <Typography variant="body2" className="text-center text-gray-500">
            Ne vous inquiétez pas, même les meilleures leçons commencent par quelques erreurs !
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}
