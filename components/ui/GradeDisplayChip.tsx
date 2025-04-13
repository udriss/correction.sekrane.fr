'use client';

import React from 'react';
import { Box, Chip, ChipProps, Typography, useTheme } from '@mui/material';
import RecentActorsIcon from '@mui/icons-material/RecentActors';

// Types pour les props du composant
interface GradeDisplayChipProps extends Omit<ChipProps, 'label'> {
  grade: number | null;
  total?: number;
  size?: 'small' | 'medium';
  variant?: 'filled' | 'outlined';
  showTotal?: boolean;
  inactive?: boolean;
  textOnly?: boolean; // Si true, affiche seulement le texte sans la puce
  studentName?: string; // Nom de l'étudiant à afficher
  studentGroup?: string; // Groupe de l'étudiant
  showStudentInfo?: boolean; // Afficher ou non les informations de l'étudiant
  status?: string; // Ajout du statut de la correction
}

/**
 * Composant pour afficher une note sous forme de puce colorée
 * La couleur de la puce est basée sur la note (suivant une échelle de 0 à 20)
 * Peut également afficher le nom de l'étudiant si fourni
 */
const GradeDisplayChip: React.FC<GradeDisplayChipProps> = ({
  grade,
  total = 20,
  size = 'small',
  variant = 'filled',
  showTotal = true,
  inactive = false,
  textOnly = false,
  studentName,
  studentGroup,
  showStudentInfo = false,
  status,
  ...props
}) => {
  const theme = useTheme();
  
  // Formatage du nombre avec 1 décimale seulement si nécessaire
  const formatNumber = (num: number | null): string => {
    if (num === null) return 'N/A';
    return Number.isInteger(num) ? num.toString() : num.toFixed(1);
  };

  // Obtenir le libellé à afficher pour les corrections inactives en fonction du statut
  const getInactiveLabel = (): string => {
    if (!status) return 'Non rendu / ABS';
    
    switch (status) {
      case 'NON_NOTE': return 'NON NOTÉ';
      case 'ABSENT': return 'ABSENT';
      case 'NON_RENDU': return 'NON RENDU';
      case 'DEACTIVATED': return 'DÉSACTIVÉ';
      default: return 'Non rendu / ABS';
    }
  };

  // Déterminer la couleur en fonction de la note
  const getColorProps = () => {
    if (inactive) {
      return {
        color: 'default' as const,
        sx: { 
          opacity: 0.7,
          fontWeight: 400
        }
      };
    }

    if (grade === null) {
      return {
        color: 'default' as const,
        sx: { 
          fontWeight: variant === 'filled' ? 600 : 400
        }
      };
    }

    // Normaliser la note sur 20 si le total est différent
    const normalizedGrade = total !== 20 ? (grade / total) * 20 : grade;
    
    if (normalizedGrade >= 16) {
      return {
        color: 'success' as const,
        sx: { 
          fontWeight: variant === 'filled' ? 700 : 600
        }
      };
    } else if (normalizedGrade >= 14) {
      return {
        color: 'primary' as const,
        sx: { 
          fontWeight: variant === 'filled' ? 700 : 600
        }
      };
    } else if (normalizedGrade >= 12) {
      return {
        color: 'info' as const,
        sx: { 
          fontWeight: variant === 'filled' ? 600 : 500
        }
      };
    } else if (normalizedGrade >= 10) {
      return {
        color: 'warning' as const,
        sx: { 
          fontWeight: variant === 'filled' ? 600 : 500
        }
      };
    } else if (normalizedGrade >= 6) {
      return {
        color: 'warning' as const,
        sx: { 
          fontWeight: variant === 'filled' ? 600 : 500,
          borderColor: theme.palette.warning.main,
          backgroundColor: variant === 'filled' ? theme.palette.warning.main : 'transparent',
          color: variant === 'filled' ? theme.palette.warning.contrastText : theme.palette.warning.main
        }
      };
    } else {
      return {
        color: 'error' as const,
        sx: { 
          fontWeight: variant === 'filled' ? 600 : 500
        }
      };
    }
  };

  const colorProps = getColorProps();
  
  // Label with or without total
  const label = grade === null 
    ? 'N/A' 
    : (showTotal ? `${formatNumber(grade)} / ${formatNumber(total)}` : formatNumber(grade));

  // Si textOnly est true, on retourne juste le texte avec la couleur appropriée
  if (textOnly) {
    // Helper function to safely get color from palette
    const getColorFromPalette = (colorName: string): string => {
      if (colorName === 'default') {
        return theme.palette.text.primary;
      }
      const color = theme.palette[colorName as keyof typeof theme.palette];
      if (color && typeof color === 'object' && 'main' in color) {
        return color.main;
      }
      return theme.palette.text.primary;
    };
    
    // Si les informations de l'étudiant doivent être affichées
    if (showStudentInfo && studentName) {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'start', gap: 0.5 }}>
          <Typography 
            variant="body2" 
            sx={{
              color: getColorFromPalette(colorProps.color),
              fontWeight: colorProps.sx?.fontWeight,
              ...(colorProps.sx?.color ? { color: colorProps.sx.color } : {}),
            }}
          >
            {inactive ? getInactiveLabel() : label}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap title={studentName}>
            {studentName}
          </Typography>
          {studentGroup && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <RecentActorsIcon color="info" fontSize="small" />
              <Typography variant="body2" color="text.secondary">
                Groupe {studentGroup}
              </Typography>
            </Box>
          )}
        </Box>
      );
    }
    
    return (
      <span
        style={{
          color: getColorFromPalette(colorProps.color),
          fontWeight: colorProps.sx?.fontWeight,
          ...(colorProps.sx?.color ? { color: colorProps.sx.color } : {})
        }}
      >
        {inactive ? getInactiveLabel() : label}
      </span>
    );
  }
  
  // Si les informations de l'étudiant doivent être affichées avec le Chip
  if (showStudentInfo && studentName) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'start', gap: 0.5 }}>
        <Chip
          label={inactive ? getInactiveLabel() : label}
          size={size}
          variant={variant}
          {...colorProps}
          {...props}
        />
        <Typography variant="body2" color="text.secondary" noWrap title={studentName}>
          {studentName}
        </Typography>
        {studentGroup && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <RecentActorsIcon color="info" fontSize="small" />
            <Typography variant="body2" color="text.secondary">
              Groupe {studentGroup}
            </Typography>
          </Box>
        )}
      </Box>
    );
  }
  
  // Sinon on retourne le Chip normal sans les informations de l'étudiant
  return (
    <Chip
      label={inactive ? getInactiveLabel() : label}
      size={size}
      variant={variant}
      {...colorProps}
      {...props}
    />
  );
};

export default GradeDisplayChip;