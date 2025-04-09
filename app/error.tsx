'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { 
  Container, 
  Box, 
  Paper, 
  Typography, 
  Button, 
  Divider,
  alpha,
  useTheme
} from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import HomeIcon from '@mui/icons-material/Home';
import BuildIcon from '@mui/icons-material/Build';
import GradientBackground from '@/components/ui/GradientBackground';
import PatternBackground from '@/components/ui/PatternBackground';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const theme = useTheme();
  
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <Container maxWidth="md" sx={{ 
      py: 8,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 'calc(100vh - 100px)'
    }}>
      <Paper elevation={4} sx={{ 
        width: '100%',
        overflow: 'hidden',
        borderRadius: 3,
        border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
        boxShadow: `0 10px 40px ${alpha(theme.palette.error.main, 0.15)}`
      }}>
        {/* Header */}
        <GradientBackground variant="error" sx={{ p: 0 }}>
          <PatternBackground
            pattern='dots'
            opacity={0.1}
            color="white"
            size={100}
            sx={{ p: 4, borderRadius: 2 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <ErrorOutlineIcon sx={{ fontSize: 40, color: 'white' }} />
              <Typography variant="h4" fontWeight="bold" color="white">
                Une erreur est survenue
              </Typography>
            </Box>
          </PatternBackground>
        </GradientBackground>

        {/* Error information */}
        <Box sx={{ p: 4 }}>
          <Typography variant="body1" color="text.secondary" mb={1}>
            Désolé, une erreur s'est produite lors du traitement de votre demande :
          </Typography>
          
          <Box sx={{ 
            mt: 2, 
            p: 3, 
            bgcolor: alpha(theme.palette.error.main, 0.05), 
            borderRadius: 2,
            border: `1px dashed ${alpha(theme.palette.error.main, 0.3)}`,
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            maxHeight: '200px',
            overflow: 'auto'
          }}>
            <Typography variant="body2" fontFamily="monospace" color="error.main" fontWeight="medium">
              {error.message || "Erreur interne non spécifiée"}
            </Typography>
            
            {error.stack && (
              <Typography variant="caption" fontFamily="monospace" display="block" color="text.secondary" mt={2} sx={{ opacity: 0.8 }}>
                {error.stack.split('\n').slice(1).join('\n')}
              </Typography>
            )}
          </Box>
          
          {error.digest && (
            <Box sx={{ 
              mt: 2, 
              p: 2, 
              bgcolor: alpha(theme.palette.error.main, 0.05), 
              borderRadius: 2,
              border: `1px dashed ${alpha(theme.palette.error.main, 0.3)}`
            }}>
              <Typography variant="caption" fontFamily="monospace" display="block" color="text.secondary">
                Code d'erreur: {error.digest}
              </Typography>
              <Typography variant="caption" fontFamily="monospace" display="block" color="text.secondary" mt={1}>
                {error.message || "Erreur interne"}
              </Typography>
            </Box>
          )}
          
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            gap: 2,
            mt: 4 
          }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BuildIcon fontSize="small" />
              Que pouvez-vous faire ?
            </Typography>
            
            <Box sx={{ 
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' }, 
              gap: 2,
              justifyContent: 'center'
            }}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => reset()}
                startIcon={<RefreshIcon />}
                fullWidth
                sx={{ 
                  py: 1.5,
                  boxShadow: theme => `0 4px 14px ${alpha(theme.palette.primary.main, 0.4)}`
                }}
              >
                <Typography variant="overline" fontWeight="bold">
                Réessayer
                </Typography>

              </Button>
              
              <Button
                variant="outlined"
                component={Link}
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                startIcon={<HomeIcon />}
                fullWidth
                sx={{ py: 1.5 }}
              >
                <Typography variant="overline" fontWeight="bold">
                Retour à l'accueil
                </Typography>
              </Button>
            </Box>
          </Box>
        </Box>
        
        {/* Footer */}
        <Divider />
        <Box sx={{ p: 2, bgcolor: 'background.default', textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Si le problème persiste, veuillez contacter l'administrateur du système.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}
