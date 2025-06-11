import React from 'react';
import { 
  Box, 
  Typography, 
  Alert, 
  Chip,
  Divider
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

interface PercentageGradeExplanationProps {
  variant?: 'compact' | 'detailed';
}

export default function PercentageGradeExplanation({ variant = 'compact' }: PercentageGradeExplanationProps) {
  if (variant === 'compact') {
    return (
      <Alert 
        severity="info" 
        icon={<InfoIcon />}
        sx={{ 
          mb: 2,
          bgcolor: 'info.50',
          border: '1px solid',
          borderColor: 'info.200'
        }}
      >
        <Typography variant="body2">
          <strong>Système percentage_grade :</strong> Les notes sont automatiquement normalisées pour tenir compte des parties désactivées, 
          garantissant une évaluation équitable même lorsque certaines sections ne sont pas évaluées.
        </Typography>
      </Alert>
    );
  }

  return (
    <Alert 
      severity="info" 
      icon={<InfoIcon />}
      sx={{ 
        mb: 3,
        bgcolor: 'info.50',
        border: '1px solid',
        borderColor: 'info.200'
      }}
    >
      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
        <TrendingUpIcon sx={{ fontSize: 16, verticalAlign: 'text-bottom', mr: 0.5 }} />
        Système de notation normalisé
      </Typography>
      
      <Typography variant="body2" paragraph>
        Le système <Chip label="percentage_grade" size="small" color="primary" sx={{ fontSize: '0.7rem' }} /> 
        calcule automatiquement le pourcentage de réussite en tenant compte des parties désactivées.
      </Typography>
      
      <Divider sx={{ my: 1 }} />
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Typography variant="body2">
          <strong>Avantages :</strong>
        </Typography>
        <Typography variant="body2" sx={{ ml: 2 }}>
          • Normalisation équitable des notes sur différents barèmes
        </Typography>
        <Typography variant="body2" sx={{ ml: 2 }}>
          • <VisibilityOffIcon sx={{ fontSize: 14, verticalAlign: 'text-bottom', mr: 0.5 }} />
          Exclusion automatique des parties désactivées
        </Typography>
        <Typography variant="body2" sx={{ ml: 2 }}>
          • Comparaison cohérente entre activités et étudiants
        </Typography>
        <Typography variant="body2" sx={{ ml: 2 }}>
          • Affichage uniforme sur l'échelle 0-20 points
        </Typography>
      </Box>
      
      <Divider sx={{ my: 1 }} />
      
      <Typography variant="caption" color="text.secondary">
        Les notes marquées <Chip label="(normalisé)" size="small" variant="outlined" color="primary" sx={{ fontSize: '0.6rem', height: '16px' }} /> 
        utilisent ce système avancé de calcul.
      </Typography>
    </Alert>
  );
}
