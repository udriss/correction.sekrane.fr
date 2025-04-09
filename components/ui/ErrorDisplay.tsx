import React, { useState } from 'react';
import { Alert, Typography, Button, Box, Paper, alpha, useTheme } from '@mui/material';

interface ErrorDisplayProps {
  error: string | Error | null;
  errorDetails?: any;
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

  return (
    <Alert 
      severity="error" 
      sx={{ 
        mb: 2,
        '& .MuiAlert-message': { width: '100%' } 
      }}
      action={
        errorDetails || withRefreshButton ? (
          <Box sx={{ display: 'flex', gap: 1 }}>
            {errorDetails && (
              <Button 
                color="inherit" 
                size="small"
                onClick={() => setShowFullError(!showFullError)}
              >
                {showFullError ? 'Masquer les détails' : 'Voir les détails'}
              </Button>
            )}
            {withRefreshButton && onRefresh && (
              <Button 
                color="inherit" 
                size="small"
                onClick={onRefresh}
              >
                Réessayer
              </Button>
            )}
          </Box>
        ) : undefined
      }
    >
      <Typography variant="body1" sx={{ mb: errorDetails ? 1 : 0 }}>
        <strong>Erreur:</strong> {errorMessage || "Une erreur inconnue s'est produite"}
      </Typography>
      
      {showFullError && errorDetails && (
        <Paper 
          elevation={0} 
          sx={{ 
            bgcolor: alpha(theme.palette.error.main, 0.05),
            p: 2, 
            mt: 1, 
            maxHeight: '400px',
            overflow: 'auto',
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            fontSize: '0.85rem'
          }}
        >
          <Typography variant="subtitle2" gutterBottom>
            Détails de l'erreur:
          </Typography>
          
          {errorDetails.sqlMessage && (
            <Box sx={{ mb: 1 }}>
              <Typography variant="caption" component="div" color="error.dark" sx={{ fontWeight: 'bold' }}>
                SQL Message:
              </Typography>
              <Typography variant="caption" component="div" sx={{ ml: 1 }}>
                {errorDetails.sqlMessage}
              </Typography>
            </Box>
          )}
          
          {errorDetails.code && (
            <Box sx={{ mb: 1 }}>
              <Typography variant="caption" component="div" color="error.dark" sx={{ fontWeight: 'bold' }}>
                Code:
              </Typography>
              <Typography variant="caption" component="div" sx={{ ml: 1 }}>
                {errorDetails.code}
              </Typography>
            </Box>
          )}
          
          {errorDetails.sql && (
            <Box sx={{ mb: 1 }}>
              <Typography variant="caption" component="div" color="error.dark" sx={{ fontWeight: 'bold' }}>
                Requête SQL:
              </Typography>
              <Typography 
                variant="caption" 
                component="pre" 
                sx={{ 
                  ml: 1, 
                  whiteSpace: 'pre-wrap', 
                  wordBreak: 'break-word',
                  bgcolor: 'background.paper',
                  p: 1,
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              >
                {errorDetails.sql}
              </Typography>
            </Box>
          )}
          
          {errorDetails.stack && (
            <Box sx={{ mb: 1 }}>
              <Typography variant="caption" component="div" color="error.dark" sx={{ fontWeight: 'bold' }}>
                Stack Trace:
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
                {typeof errorDetails.stack === 'string'
                  ? errorDetails.stack.split('\n').slice(1).join('\n')
                  : JSON.stringify(errorDetails.stack, null, 2)}
              </Typography>
            </Box>
          )}
          
          {/* Si aucun des champs spécifiques n'est présent, afficher l'objet complet */}
          {!errorDetails.sqlMessage && !errorDetails.code && !errorDetails.sql && !errorDetails.stack && (
            <Typography 
              variant="caption" 
              component="pre" 
              sx={{ 
                ml: 1, 
                whiteSpace: 'pre-wrap', 
                wordBreak: 'break-word' 
              }}
            >
              {JSON.stringify(errorDetails, null, 2)}
            </Typography>
          )}
        </Paper>
      )}
    </Alert>
  );
};

export default ErrorDisplay;