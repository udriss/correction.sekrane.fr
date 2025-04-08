import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Box, Paper, Typography, IconButton, Checkbox, Tooltip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import EditIcon from '@mui/icons-material/Edit';
import ShareIcon from '@mui/icons-material/Share';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Correction } from '@/app/components/CorrectionsDataProvider';
import { useBatchDelete } from '@/hooks/useBatchDelete';
import ShareModal from '@/app/components/ShareModal';
import RecentActorsIcon from '@mui/icons-material/RecentActors';
import CircularProgress from '@mui/material/CircularProgress';

interface CorrectionCardProps {
  correction: Correction;
  getGradeColor: (grade: number) => "success" | "info" | "primary" | "warning" | "error";
  preloadedShareCode?: string;
  highlighted?: boolean;
  highlight?: boolean;
  className?: string;
  showTopLabel?: string;
  showClass?: boolean;
  showStudent?: boolean;
  showActivity?: boolean;
  onToggleActive?: (correctionId: number, newActiveState: boolean) => Promise<void>;
}

const CorrectionCard: React.FC<CorrectionCardProps> = ({
  correction,
  getGradeColor,
  preloadedShareCode,
  highlighted = false,
  highlight = false,
  className = '',
  showTopLabel,
  showClass = true,
  showStudent = true,
  showActivity = true,
  onToggleActive
}) => {
  const { batchDeleteMode, selectedCorrections, toggleCorrectionSelection, deletingCorrections } = useBatchDelete();
  const isSelected = selectedCorrections.includes(correction.id?.toString() || '');
  const isDeleting = deletingCorrections.has(correction.id?.toString() || '');
  
  // État local pour gérer le code de partage et la modale
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  
  // État pour suivre le statut actif et l'état de chargement
  const [isActive, setIsActive] = useState<boolean>(correction.active !== undefined ? !!correction.active : true);
  const [isToggling, setIsToggling] = useState<boolean>(false);
  
  // S'assurer que shareCode est mis à jour lorsque preloadedShareCode change
  useEffect(() => {
    if (preloadedShareCode) {
      setShareCode(preloadedShareCode);
    }
  }, [preloadedShareCode]);
  
  // Update isActive when correction changes
  useEffect(() => {
    setIsActive(correction.active !== undefined ? !!correction.active : true);
  }, [correction.active]);
  
  // Handle toggle active status
  const handleToggleActive = async () => {
    if (!onToggleActive || !correction.id) return;
    
    setIsToggling(true);
    try {
      await onToggleActive(correction.id, !isActive);
      setIsActive(!isActive);
    } catch (error) {
      console.error('Error toggling active status:', error);
      // The state will be updated by the parent component if the API call is successful
    } finally {
      setIsToggling(false);
    }
  };
  
  // Handle share modal events
  const handleOpenShareModal = () => {
    setShareModalOpen(true);
  };
  
  const handleCloseShareModal = () => {
    setShareModalOpen(false);
  };
  
  const handleShareSuccess = (code: string) => {
    setShareCode(code);
    handleCloseShareModal();
  };
  
  // Format submission date
  const submissionDate = correction.submission_date
    ? `Envoyée le ${format(new Date(correction.submission_date), 'dd MMMM yyyy', { locale: fr })}`
    : 'Date inconnue';
  // Format submission date
  const modifiedDate = correction.updated_at
    ? `Modifiée le ${format(new Date(correction.updated_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}`
    : '';

  // Use either highlighted prop or highlight prop (for backward compatibility)
  const isHighlighted = highlighted || highlight;

  // Calculate normalized grade (0-20)
  // Vérifier s'il y a une pénalité à appliquer
  const hasPenalty = correction.penality !== undefined && correction.penality !== null;
  
  // Calculer la note avec la pénalité si elle existe
  const gradeWithPenalty = hasPenalty && correction.penality !== undefined && correction.penality !== null
    ? Math.max(0, correction.grade - correction.penality) 
    : correction.grade;
    
  // Normaliser la note sur 20
  const normalizedGrade = correction.experimental_points && correction.theoretical_points
    ? (gradeWithPenalty / (correction.theoretical_points + correction.experimental_points) * 20)
    : gradeWithPenalty;
    
  // Déterminer si on doit utiliser la variante light ou main de la couleur
  const getColorVariant = (color: string): string => {
    // Pour les notes success (généralement bonnes), utiliser la variante main pour les très bonnes notes
    // et light pour les notes correctes mais pas excellentes
    if (color === 'success') {
      return normalizedGrade >= 16.5 ? `${color}.dark` : `${color}.light`;
    }
    // Pour les notes error (généralement mauvaises), utiliser la variante main pour les très mauvaises notes
    // et light pour les notes médiocres mais pas catastrophiques
    else if (color === 'error') {
      return normalizedGrade <= 5 ? `${color}.dark` : `${color}.light`;
    }
    // Pour les autres couleurs, conserver le comportement par défaut
    return `${color}.main`;
  }
  
  // Solution de repli pour éviter l'erreur TypeScript lors de l'indexation du thème
  // Fallback pour transformer la chaîne "error.light" en accès sécurisé à theme.palette.error.light
  const getBoxColor = (theme: any, colorVariant: string) => {
    const [colorName, variant = 'main'] = colorVariant.split('.');
    
    // Vérifier si la palette et la couleur existent
    if (theme.palette && colorName in theme.palette) {
      const colorObj = theme.palette[colorName];
      // Vérifier si la variante existe
      if (variant in colorObj) {
        return colorObj[variant];
      }
      // Utiliser la variante main comme solution de repli
      return colorObj.main;
    }
    
    // Couleur de repli si rien ne correspond
    return theme.palette.grey[500];
  };
  
  return (
    <Paper
      className={className}
      sx={{ 
        position: 'relative',
        borderRadius: 2,
        overflow: 'hidden',
        transition: 'all 0.2s ease-in-out',
        border: '1px solid',
        borderColor: theme => isHighlighted 
          ? alpha(theme.palette.warning.main, 0.5) 
          : (isSelected && batchDeleteMode)
            ? alpha(theme.palette.error.main, 0.7)
            : !isActive
              ? alpha(theme.palette.error.main, 0.7) // Bordure rouge pour les corrections inactives
              : alpha(theme.palette.divider, 0.5),
        boxShadow: theme => isHighlighted 
          ? `0 0 15px ${alpha(theme.palette.warning.main, 0.4)}` 
          : (isSelected && batchDeleteMode)
            ? `0 0 15px ${alpha(theme.palette.error.main, 0.3)}`
            : !isActive
              ? `0 0 8px ${alpha(theme.palette.error.light, 0.3)}` // Ajout d'une ombre rouge pour les inactives
              : 'none',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme => isHighlighted 
            ? `0 5px 20px ${alpha(theme.palette.warning.main, 0.4)}` 
            : (isSelected && batchDeleteMode)
              ? `0 5px 20px ${alpha(theme.palette.error.main, 0.3)}`
              : !isActive
                ? `0 5px 15px ${alpha(theme.palette.error.light, 0.4)}` // Ombre au survol pour les inactives
                : '0 5px 15px rgba(0,0,0,0.08)',
        },
        opacity: isDeleting ? 0.7 : !isActive ? 0.9 : 1, // Augmentation légère de l'opacité pour les inactives
        pointerEvents: isDeleting ? 'none' : 'auto',
        bgcolor: theme => !isActive ? alpha(theme.palette.grey[200], 0.7) : undefined, // Fond légèrement plus visible
      }}
    >
      {/* Deletion spinner overlay */}
      {isDeleting && (
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          zIndex: 10,
          borderRadius: 2
        }}>
          <CircularProgress color="error" size={40} />
        </Box>
      )}
      
      {/* Top label if needed */}
      {showTopLabel && (
        <Box sx={{ 
          bgcolor: 'primary.main', 
          color: 'primary.contrastText',
          py: 0.5, 
          px: 1.5,
          fontSize: '0.75rem',
          fontWeight: 'bold',
          position: 'absolute',
          top: 0,
          right: 0,
          borderBottomLeftRadius: 8,
          zIndex: 1
        }}>
          {showTopLabel}
        </Box>
      )}

      {/* Inactive label */}
      {!isActive && (
        <Box sx={{ 
          bgcolor: 'grey.500', 
          color: 'white',
          py: 0.5, 
          px: 1.5,
          fontSize: '0.75rem',
          fontWeight: 'bold',
          position: 'absolute',
          top: 0,
          left: 0,
          borderBottomRightRadius: 8,
          zIndex: 1
        }}>
          Inactive
        </Box>
      )}

      {/* Batch Delete Checkbox */}
      {batchDeleteMode && (
        <Box sx={{ 
          position: 'absolute', 
          top: 0, 
          right: 0, 
          zIndex: 2,
          mb:0.5,
          p:0
        }}>
          <Checkbox 
            checked={isSelected}
            onChange={() => toggleCorrectionSelection(correction.id?.toString() || '')}
            sx={{
              mb:0.5,
              color: 'error.light',
              '&.Mui-checked': {
                color: 'error.main',
              },
            }}
          />
        </Box>
      )}

      {/* Card Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        p: 2,
        pt: batchDeleteMode ? 3 : 2,
        bgcolor: theme => isSelected && batchDeleteMode 
          ? alpha(theme.palette.error.light, 0.1) 
          : undefined
      }}>
        <Box sx={{ 
          maxWidth: '65%',
          overflow: 'hidden'
        }}>
          {showActivity && (
            <Typography 
              variant="subtitle1" 
              fontWeight="bold" 
              noWrap 
              title={correction.activity_name} // Ajoute un tooltip natif sur hover
              sx={{ mb: 0.5 }}
            >
              {correction.activity_name || 'Activité inconnue'}
            </Typography>
          )}
          
          {showStudent && (
            <Typography 
              variant="body2" 
              color="text.secondary" 
              noWrap
              title={correction.student_name} // Ajoute un tooltip natif sur hover
              sx={{ textOverflow: 'ellipsis' }}
            >
              {correction.student_name || 'Étudiant inconnu'}
            </Typography>
          )}
          
          {showClass && correction.class_name && (
            <Box sx={{ display: 'flex', 
            alignItems: 'start', 
            mt: 0.75,
            gap: 0.25,
            flexDirection: 'column',
            justifyContent: 'center',
             }}>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              component={'div'}
              noWrap
              title={correction.class_name} // Ajoute un tooltip natif sur hover
              sx={{ textOverflow: 'ellipsis' }}
            >
              {correction.class_name} 
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              component={'div'}
              noWrap
              title={correction.class_name} // Ajoute un tooltip natif sur hover
              sx={{ textOverflow: 'ellipsis' }}
            >
              {correction.student_sub_class ? 
              <><RecentActorsIcon color="info" fontSize="small" sx={{ mr: .25 }} /> Groupe {correction.student_sub_class}</>
               : ''}
            </Typography>
            </Box>

          )}
        </Box>
        
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          bgcolor: theme => getBoxColor(theme, getColorVariant(getGradeColor(correction.grade as number))),
          p: 1, borderRadius: 2, 
          color: 'white' }}>
          <Typography variant="h5" component="div" fontWeight="bold">
            {gradeWithPenalty.toFixed(1)}
          </Typography>
          <Typography variant="body2" sx={{ ml: 1, opacity: 0.9 }}>
            / {correction.experimental_points !== undefined && correction.theoretical_points !== undefined 
              ? (correction.experimental_points + correction.theoretical_points).toFixed(1)
              : '-'}
          </Typography>
        </Box>
      </Box>
      
      {/* Card Content */}
      <Box sx={{ 
        p: 2, 
        pt: 0,
        bgcolor: theme => isSelected && batchDeleteMode 
          ? alpha(theme.palette.error.light, 0.1) 
          : undefined 
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          justifyItems: 'center',
          alignItems: 'start', 
          pt: 1, 
          gap: .25, 
          flexDirection: 'column' 
          }}>
        <Typography variant="caption" color="text.secondary">
            {submissionDate}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {modifiedDate}
          </Typography>
        </Box>
          
          
          {!batchDeleteMode && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              {/* Bouton de partage ou de visualisation selon l'existence d'un code de partage */}
              {shareCode ? (
                <Tooltip title="Voir le feedback">
                  <IconButton 
                    component={Link} 
                    href={`/feedback/${shareCode}`}
                    color="primary"
                    size="small"
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ 
                      bgcolor: theme => alpha(theme.palette.success.main, 0.1),
                      '&:hover': {
                        bgcolor: theme => alpha(theme.palette.success.main, 0.2),
                      }
                    }}
                  >
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              ) : (
                <Tooltip title="Partager la correction">
                  <IconButton 
                    onClick={handleOpenShareModal}
                    color="primary"
                    size="small"
                    sx={{ 
                      bgcolor: theme => alpha(theme.palette.info.main, 0.1),
                      '&:hover': {
                        bgcolor: theme => alpha(theme.palette.info.main, 0.2),
                      }
                    }}
                  >
                    <ShareIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              
              {/* Activation toggle button */}
              {onToggleActive && (
                <Tooltip title={isActive ? "Désactiver cette correction" : "Activer cette correction"}>
                  <IconButton
                    onClick={handleToggleActive}
                    color={isActive ? "success" : "default"}
                    size="small"
                    disabled={isToggling}
                    sx={{ 
                      bgcolor: theme => alpha(isActive ? theme.palette.success.main : theme.palette.grey[500], 0.1),
                      '&:hover': {
                        bgcolor: theme => alpha(isActive ? theme.palette.success.main : theme.palette.grey[500], 0.2),
                      }
                    }}
                  >
                    {isToggling ? (
                      <CircularProgress size={18} color={isActive ? "success" : "inherit"} />
                    ) : (
                      isActive ? <ToggleOnIcon fontSize="small" /> : <ToggleOffIcon fontSize="small" />
                    )}
                  </IconButton>
                </Tooltip>
              )}
              
              {/* Bouton d'édition */}
              <Tooltip title="Éditer la correction">
                <Link href={`/corrections/${correction.id}`} passHref target="_blank" rel="noopener noreferrer">
                <IconButton
                  size="small"
                  color="primary"
                  aria-label="edit correction"
                  sx={{ 
                  bgcolor: theme => alpha(theme.palette.primary.main, 0.1),
                  '&:hover': {
                    bgcolor: theme => alpha(theme.palette.primary.main, 0.2),
                  }
                  }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Link>
              </Tooltip>
            </Box>
          )}
        </Box>
      </Box>
      
      {/* Modal de partage */}
      <ShareModal 
        open={shareModalOpen}
        onClose={handleCloseShareModal}
        correctionId={correction.id.toString()}
        onShareSuccess={handleShareSuccess}
      />
    </Paper>
  );
};

export default CorrectionCard;