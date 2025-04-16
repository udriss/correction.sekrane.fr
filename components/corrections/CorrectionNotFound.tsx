import React from 'react';
import {
  Box,
  Button,
  Typography,
  Container,
  Paper
} from '@mui/material';
import Link from 'next/link';
// Remove unused imports: ArrowBackIcon and H1Title
import { useTheme } from '@mui/material/styles';
import AssignmentLateIcon from '@mui/icons-material/AssignmentLate';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ErrorIcon from '@mui/icons-material/Error';
import FindInPageIcon from '@mui/icons-material/FindInPage';
import HomeIcon from '@mui/icons-material/Home';
import { motion } from 'framer-motion';

interface CorrectionNotFoundProps {
  message?: string;
}

const CorrectionNotFound: React.FC<CorrectionNotFoundProps> = ({ message }) => {
  const theme = useTheme();
  
  return (
    <Container maxWidth="md" className="mt-6 mb-8">
      <Paper 
        elevation={3}
        className="w-full rounded-xl overflow-hidden"
        sx={{ 
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: 3
        }}
      >
        {/* En-tête coloré */}
        <Box 
          className="text-white px-6 py-1"
          sx={{
            borderBottom: `4px solid ${theme.palette.error.dark}`,
            padding: '24px',
            background: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.error.main} 100%)`,
          }}
        >
          <Typography component={'div'} variant="h4" color='text.primary' className="flex items-center" fontWeight={700}>
            <ErrorIcon fontSize="large" sx={{mr:1}} />
            Correction introuvable
          </Typography>
        </Box>
        
        {/* Contenu principal */}
        <Box className="p-8 text-center" sx={{ backgroundColor: theme.palette.background.default }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <AssignmentLateIcon sx={{ fontSize: "5rem", color: theme.palette.error.light }} />
          </motion.div>
          
          {/* Message */}
          <Box className="mb-8 flex flex-col items-center">
            <Typography variant="h5" color='text.primary' className="font-bold mb-2">
              Cette correction n'existe pas ou a été supprimée
            </Typography>
            <Typography variant="body1" color='text.secondary' className="text-center">
              {message || "La correction recherchée est introuvable. Elle a peut-être été supprimée ou le lien utilisé est incorrect."}
            </Typography>
          </Box>
          
          {/* Animation des icônes */}
          <Box className="my-8 relative h-16">
            <motion.div 
              className="grid grid-cols-3 gap-8 mx-auto max-w-xs"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.7 }}
            >
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
                className="flex justify-center text-orange-500"
              >
                <AssignmentIcon sx={{ fontSize: "2.5rem" }} />
              </motion.div>
              
              <motion.div 
                animate={{ 
                  y: [0, -15, 0],
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
                <FindInPageIcon sx={{ fontSize: "2.5rem" }} />
              </motion.div>
              
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
                className="flex justify-center text-blue-500"
              >
                <AssignmentLateIcon sx={{ fontSize: "2.5rem" }} />
              </motion.div>
            </motion.div>
          </Box>
          
          {/* Boutons d'action */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="flex flex-wrap justify-center gap-4"
          >
            <Button 
              variant="contained" 
              color="secondary" 
              size="large" 
              component={Link}
              href="/corrections"
              sx={{ fontWeight: 600 }}
              startIcon={<AssignmentIcon />}
            >
              Toutes les corrections
            </Button>
            
            <Button 
              variant="contained" 
              color="primary" 
              size="large" 
              component={Link}
              sx={{ fontWeight: 600 }}
              href="/"
              startIcon={<HomeIcon />}
            >
              Accueil
            </Button>
          </motion.div>
        </Box>
        
        {/* Pied de page */}
        <Box className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <Typography variant="body2" className="text-center text-gray-500">
            Si vous pensez qu'il s'agit d'une erreur, veuillez contacter votre enseignant.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            La correction n&apos;a pas été trouvée.
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Assurez-vous d&apos;avoir l&apos;URL correcte ou essayez de vous reconnecter.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default CorrectionNotFound;