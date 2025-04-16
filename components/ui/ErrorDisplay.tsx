import React, { useState } from 'react';
import { 
  Alert, 
  Typography, 
  Button, 
  Box, 
  Paper, 
  alpha, 
  useTheme, 
  Container,
  Divider
} from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import CodeIcon from '@mui/icons-material/Code';
import GradientBackground from '@/components/ui/GradientBackground';
import PatternBackground from '@/components/ui/PatternBackground';

// Étendre le type Error pour inclure les propriétés d'erreur SQL potentielles
interface ExtendedError extends Error {
  code?: string;
  sqlMessage?: string;
  sqlState?: string;
  errno?: number;
  sql?: string;
}

interface ErrorDisplayProps {
  error: string | Error | null;
  errorDetails?: Record<string, any>;
  withRefreshButton?: boolean;
  onRefresh?: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  errorDetails,
  withRefreshButton = false,
  onRefresh
}) => {
  const [showFullError, setShowFullError] = useState<boolean>(false);
  const theme = useTheme();

  // Si pas d'erreur, ne rien afficher
  if (!error) return null;

  // Extraire le message d'erreur
  const errorMessage = typeof error === 'string' ? error : error.message;
  
  // Extraire le stack trace si disponible
  const stackTrace = typeof error === 'object' && error instanceof Error ? error.stack : null;

  // Formater les détails d'erreur pour l'affichage
  const formattedDetails = (() => {
    // Si errorDetails est fourni explicitement, l'utiliser
    if (errorDetails) {
      return errorDetails;
    }
    
    // Sinon, essayer d'extraire les détails de l'objet error s'il s'agit d'un objet
    if (typeof error === 'object' && error !== null) {
      const extendedError = error as Record<string, any>;
      return {
        code: extendedError.code,
        sqlMessage: extendedError.sqlMessage,
        sqlState: extendedError.sqlState,
        errno: extendedError.errno,
        sql: extendedError.sql,
        stack: extendedError.stack,
      };
    }
    
    return {};
  })();

  // Vérifier si nous avons des détails pertinents à afficher
  const hasDetails = Object.entries(formattedDetails).some(([_, value]) => 
    value !== undefined && value !== null
  );

  return (
    <Paper elevation={4} sx={{ 
      width: '100%',
      overflow: 'hidden',
      borderRadius: 3,
      mb: 3,
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
          sx={{ p: 2, borderRadius: 2 }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ErrorOutlineIcon sx={{ fontSize: 32, color: 'white' }} />
            <Typography variant="h5" fontWeight="bold" color="white">
              Une erreur est survenue
            </Typography>
          </Box>
        </PatternBackground>
      </GradientBackground>

      {/* Error information */}
      <Box sx={{ p: 3 }}>
        <Typography variant="body1" color="text.secondary" mb={1}>
          {errorMessage || "Une erreur inconnue s'est produite"}
        </Typography>
        
        {/* Conditional error details display */}
        {showFullError && hasDetails && (
          <Box sx={{ 
            mt: 2, 
            p: 3, 
            bgcolor: alpha(theme.palette.error.main, 0.05), 
            borderRadius: 2,
            border: `1px dashed ${alpha(theme.palette.error.main, 0.3)}`,
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            maxHeight: '300px',
            overflow: 'auto'
          }}>
            {/* Erreurs SQL */}
            {formattedDetails.sqlMessage && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" component="div" color="error.dark" sx={{ fontWeight: 'bold' }}>
                  Erreur SQL :
                </Typography>
                <Typography variant="caption" component="div" sx={{ ml: 1 }}>
                  {formattedDetails.sqlMessage}
                </Typography>
              </Box>
            )}
            
            {formattedDetails.code && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" component="div" color="error.dark" sx={{ fontWeight: 'bold' }}>
                  Code :
                </Typography>
                <Typography variant="caption" component="div" sx={{ ml: 1 }}>
                  {formattedDetails.code}
                </Typography>
              </Box>
            )}
            
            {formattedDetails.errno && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" component="div" color="error.dark" sx={{ fontWeight: 'bold' }}>
                  Numéro d'erreur :
                </Typography>
                <Typography variant="caption" component="div" sx={{ ml: 1 }}>
                  {formattedDetails.errno}
                </Typography>
              </Box>
            )}
            
            {formattedDetails.sqlState && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" component="div" color="error.dark" sx={{ fontWeight: 'bold' }}>
                  État SQL :
                </Typography>
                <Typography variant="caption" component="div" sx={{ ml: 1 }}>
                  {formattedDetails.sqlState}
                </Typography>
              </Box>
            )}
            
            {formattedDetails.sql && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" component="div" color="error.dark" sx={{ fontWeight: 'bold' }}>
                  Requête SQL :
                </Typography>
                <Typography 
                  variant="caption" 
                  component="pre" 
                  sx={{ 
                    ml: 1, 
                    p: 1,
                    bgcolor: alpha(theme.palette.background.paper, 0.5),
                    border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                    borderRadius: 1,
                    whiteSpace: 'pre-wrap', 
                    wordBreak: 'break-word' 
                  }}
                >
                  {formattedDetails.sql}
                </Typography>
              </Box>
            )}
            
            {/* Stack Trace */}
            {formattedDetails.stack && formattedDetails.stack !== stackTrace && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" component="div" color="error.dark" sx={{ fontWeight: 'bold' }}>
                  Stack Trace :
                </Typography>
                <Typography 
                  variant="caption" 
                  component="pre" 
                  sx={{ 
                    ml: 1, 
                    whiteSpace: 'pre-wrap', 
                    wordBreak: 'break-word' 
                  }}
                >
                  {typeof formattedDetails.stack === 'string'
                    ? formattedDetails.stack.split('\n').slice(1).join('\n')
                    : JSON.stringify(formattedDetails.stack, null, 2)}
                </Typography>
              </Box>
            )}
            
            {/* Autres détails */}
            {Object.entries(formattedDetails).filter(([key, value]) => 
              value !== undefined && 
              value !== null && 
              !['sqlMessage', 'code', 'errno', 'sqlState', 'sql', 'stack'].includes(key)
            ).map(([key, value]) => (
              <Box key={key} sx={{ mb: 2 }}>
                <Typography variant="caption" component="div" color="error.dark" sx={{ fontWeight: 'bold' }}>
                  {key.charAt(0).toUpperCase() + key.slice(1)}:
                </Typography>
                <Typography 
                  variant="caption" 
                  component="pre" 
                  sx={{ 
                    ml: 1, 
                    whiteSpace: 'pre-wrap', 
                    wordBreak: 'break-word' 
                  }}
                >
                  {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
        
        {/* Stack trace display if available */}
        {stackTrace && showFullError && !formattedDetails.stack && (
          <Box sx={{ 
            mt: 2, 
            p: 2, 
            bgcolor: alpha(theme.palette.error.main, 0.05), 
            borderRadius: 2,
            border: `1px dashed ${alpha(theme.palette.error.main, 0.3)}`
          }}>
            <Typography variant="caption" fontFamily="monospace" display="block" color="text.secondary">
              Stack Trace:
            </Typography>
            <Typography variant="caption" fontFamily="monospace" display="block" color="text.secondary" mt={1} sx={{ whiteSpace: 'pre-wrap' }}>
              {stackTrace.split('\n').slice(1).join('\n')}
            </Typography>
          </Box>
        )}
        
        {/* Actions buttons */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          mt: 3,
          justifyContent: 'center'
        }}>
          {withRefreshButton && onRefresh && (
            <Button
              variant="contained"
              color="primary"
              onClick={onRefresh}
              startIcon={<RefreshIcon />}
              fullWidth
              sx={{ 
                py: 1.5,
                boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.4)}`
              }}
            >
              <Typography variant="button" fontWeight="bold">
                Réessayer
              </Typography>
            </Button>
          )}
          
          {/* N'afficher le bouton que s'il y a des détails à montrer */}
          {(hasDetails || stackTrace) && (
            <Button
              variant={showFullError ? "outlined" : "outlined"}
              onClick={() => setShowFullError(!showFullError)}
              startIcon={<CodeIcon />}
              fullWidth
              sx={theme => ({
              py: 1.5,
              color: showFullError ? theme.palette.secondary.dark : theme.palette.text.primary,
              borderColor: showFullError ? theme.palette.secondary.dark : undefined,
              backgroundColor: showFullError
                ? theme.palette.background.paper
                : theme.palette.background.paper,
              '&:hover': {
                backgroundColor: showFullError
                ? theme.palette.grey[100]
                : theme.palette.grey[100],
                borderColor: theme.palette.secondary.dark,
              },
              })}
            >
              <Typography variant="button" fontWeight="bold">
              {showFullError ? 'Masquer les détails' : 'Voir les détails'}
              </Typography>
            </Button>
          )}
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
  );
};

export default ErrorDisplay;