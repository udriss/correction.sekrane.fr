import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Box, Paper, Typography, IconButton, Checkbox, Tooltip, ButtonGroup, Button } from '@mui/material';
import { alpha } from '@mui/material/styles';
import EditIcon from '@mui/icons-material/Edit';
import ShareIcon from '@mui/icons-material/Share';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import AssignmentLateIcon from '@mui/icons-material/AssignmentLate';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CorrectionAutreEnriched } from '@/lib/types';
import { useBatchDelete } from '@/hooks/useBatchDelete';
import ShareModal from '@/app/components/ShareModal';
import RecentActorsIcon from '@mui/icons-material/RecentActors';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';

// Fonction pour vérifier si useBatchDelete est disponible dans le contexte
const useOptionalBatchDelete = () => {
  try {
    return useBatchDelete();
  } catch (error) {
    // Si le hook n'est pas disponible (pas dans BatchDeleteProvider), retourner des valeurs par défaut
    return {
      batchDeleteMode: false,
      selectedCorrections: [],
      toggleCorrectionSelection: () => {},
      deletingCorrections: new Set(),
    };
  }
};

interface CorrectionCardProps {
  correction: CorrectionAutreEnriched;
  getGradeColor: (grade: number) => "success" | "info" | "primary" | "warning" | "error";
  preloadedShareCode?: string;
  highlighted?: boolean;
  highlight?: boolean;
  className?: string;
  showClass?: boolean;
  showStudent?: boolean;
  showActivity?: boolean;
  studentSubClass?: number | null;
  onToggleActive?: (correctionId: number, newActiveState: boolean) => Promise<void>;
  onChangeStatus?: (correctionId: number, newStatus: string) => Promise<void>;
  standalone?: boolean; // Nouveau prop pour indiquer si le composant est utilisé de manière autonome
}

const CorrectionCardAutre: React.FC<CorrectionCardProps> = ({
  correction,
  getGradeColor,
  preloadedShareCode,
  highlighted = false,
  highlight = false,
  className = '',
  showClass = true,
  showStudent = true,
  showActivity = true,
  studentSubClass = null,
  onToggleActive,
  onChangeStatus,
  standalone = false
}) => {
  // Utiliser le hook optionnel qui fonctionne même sans provider
  const { batchDeleteMode, selectedCorrections, toggleCorrectionSelection, deletingCorrections } = useOptionalBatchDelete();
  const isSelected = (selectedCorrections as string[]).includes(correction.id?.toString() || '');
  const isDeleting = deletingCorrections.has(correction.id?.toString() || '');
  
  // État local pour gérer le code de partage et la modale
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  
  // État pour suivre le statut actif et l'état de chargement
  const [isActive, setIsActive] = useState<boolean>(correction.active !== undefined ? !!correction.active : true);
  const [isToggling, setIsToggling] = useState<boolean>(false);
  
  // State to track correction status
  const [correctionStatus, setCorrectionStatus] = useState<string>(
    typeof correction.status === 'string' ? correction.status : (correction.active ? 'ACTIVE' : 'DEACTIVATED')
  );
  const [isStatusChanging, setIsStatusChanging] = useState<boolean>(false);

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

  // Update status when correction changes
  useEffect(() => {
    if (typeof correction.status === 'string') {
      setCorrectionStatus(correction.status);
    } else if (correction.active !== undefined) {
      setCorrectionStatus(correction.active ? 'ACTIVE' : 'DEACTIVATED');
    }
  }, [correction.status, correction.active]);

  
  // Handle changing the status
  const handleChangeStatus = async (newStatus: string) => {
    if (!onChangeStatus || !correction.id) return;
    
    // If clicking on current status for ABSENT, toggle back to ACTIVE
    if (correctionStatus === 'ABSENT' && newStatus === 'ABSENT') {
      newStatus = 'ACTIVE';
    }
    
    setIsStatusChanging(true);
    try {
      await onChangeStatus(correction.id, newStatus);
      setCorrectionStatus(newStatus);
      
      // Also update the active state for backward compatibility
      if (newStatus === 'ACTIVE') {
        setIsActive(true);
      } else {
        setIsActive(false);
      }
    } catch (error) {
      console.error('Error changing correction status:', error);
    } finally {
      setIsStatusChanging(false);
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

  // Gestion des points_earned comme un tableau de nombres
  let grade = 0;
  if (correction.points_earned) {
    // Si points_earned est un tableau, faire la somme des points
    grade = correction.points_earned.reduce((sum, points) => sum + (typeof points === 'number' ? points : parseFloat(String(points || '0'))), 0);
  } else if (correction.grade !== undefined) {
    // Fallback sur grade si points_earned n'est pas disponible
    grade = typeof correction.grade === 'number' ? correction.grade : parseFloat(String(correction.grade || '0'));
  }
  
  // Vérifier s'il y a une pénalité à appliquer
  const hasPenalty = correction.penalty !== undefined && correction.penalty !== null;
  const penalty = hasPenalty && correction.penalty !== undefined 
    ? (typeof correction.penalty === 'number' ? correction.penalty : parseFloat(String(correction.penalty || '0'))) 
    : 0;
  const finalGrade = correction.final_grade !== undefined 
    ? (typeof correction.final_grade === 'number' ? correction.final_grade : parseFloat(String(correction.final_grade || '0')))
    : null;
  
  // Calculer la note avec la pénalité si elle existe
  const gradeWithPenalty = hasPenalty 
    ? (finalGrade !== null ? finalGrade : Math.max(0, grade - penalty))
    : grade;
    
  // Déterminer si on doit utiliser la variante light ou main de la couleur
  const getColorVariant = (color: string): string => {
    // Pour les notes success (généralement bonnes), utiliser la variante main pour les très bonnes notes
    // et light pour les notes correctes mais pas excellentes
    if (color === 'success') {
      return gradeWithPenalty >= 16.5 ? `${color}.dark` : `${color}.light`;
    }
    // Pour les notes error (généralement mauvaises), utiliser la variante main pour les très mauvaises notes
    // et light pour les notes médiocres mais pas catastrophiques
    else if (color === 'error') {
      return gradeWithPenalty <= 5 ? `${color}.dark` : `${color}.light`;
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

  // Calculer la note finale selon la règle demandée
  const calculateFinalGrade = (grade: number, penalty: number): number => {
    if (grade < 5) {
      // Si la note est inférieure à 5, on garde la note originale
      return grade;
    } else {
      // Sinon, on prend le maximum entre (note-pénalité) et 5
      return Math.max(grade - penalty, 5);
    }
  };

  // Determine status related UI elements
  const getStatusLabel = () => {
    switch (correctionStatus) {
      case 'ACTIVE': return 'Active';
      case 'DEACTIVATED': return 'Inactive';
      case 'ABSENT': return 'Absent';
      case 'NON_RENDU': return 'Non rendu';
      case 'NON_NOTE': return 'Non noté';
      default: return 'Inconnu';
    }
  };

  const getStatusColor = () => {
    switch (correctionStatus) {
      case 'ACTIVE': return 'success';
      case 'DEACTIVATED': return 'error';
      case 'ABSENT': return 'warning';
      case 'NON_RENDU': return 'info';
      case 'NON_NOTE': return 'default';
      default: return 'default';
    }
  };


  // Calcul du total de points possibles (somme des éléments du tableau points)
  // Si l'activité associée à la correction a une propriété points_total, utilisez-la
  const totalPossiblePoints = grade > 0 ? grade / (correction.score_percentage || 1) * 100 : 0;
  
  return (
    <Paper
      className={className}
      sx={{ 
        position: 'relative',
        borderRadius: 2,
        overflow: 'hidden',
        transition: 'all 0.2s ease-in-out',
        border: '1px solid rgba(0, 0, 0, 0.1)',
      }}
    >
      
      {/* Batch Delete Checkbox - seulement si le mode batchDeleteMode est activé */}  
      {batchDeleteMode && !standalone && (
        <Box sx={{ 
          position: 'relative', 
          top: 0, 
          left: 0, 
          zIndex: 2,
          p:0
        }}>
          <Checkbox 
            checked={isSelected}
            onChange={() => toggleCorrectionSelection(correction.id?.toString() || '')}
            sx={{
              color: 'error.light',
              '&.Mui-checked': {
                color: 'error.main',
              },
            }}
          />
        </Box>
      )}
      <Box 
        sx={{
          borderColor: theme => isHighlighted 
          ? alpha(theme.palette.warning.main, 0.5) 
          : (isSelected && batchDeleteMode)
            ? alpha(theme.palette.error.main, 0.7)
            : correctionStatus !== 'ACTIVE'
              ? alpha(theme.palette.error.main, 0.7) // Bordure rouge pour les corrections inactives
              : alpha(theme.palette.divider, 0.5),
        boxShadow: theme => isHighlighted 
          ? `0 0 5px ${alpha(theme.palette.warning.main, 0.4)}` 
          : (isSelected && batchDeleteMode)
            ? `rgba(179, 29, 29, 0.56) 0px 22px 70px 4px;`
            : correctionStatus !== 'ACTIVE'
              ? `0 0 10px rgba(0,0,0,0.08)` // Ajout d'une ombre rouge pour les inactives
              : 'none',
        '&:hover': {
          transform: 'translateY(0px)',
          boxShadow: theme => isHighlighted 
            ? `0 0px 5px ${alpha(theme.palette.warning.main, 0.4)}` 
            : (batchDeleteMode)
              ? `rgba(60, 64, 67, 0.3) 0px 1px 2px 0px, rgba(60, 64, 67, 0.15) 0px 2px 6px 2px;`
              : correctionStatus !== 'ACTIVE'
                ? `rgba(60, 64, 67, 0.3) 0px 1px 2px 0px, rgba(60, 64, 67, 0.15) 0px 2px 6px 2px;` // Ombre au survol pour les inactives
                : 'rgba(60, 64, 67, 0.3) 0px 1px 2px 0px, rgba(60, 64, 67, 0.15) 0px 2px 6px 2px;',
        },
        opacity: isDeleting ? 0.7 : correctionStatus !== 'ACTIVE' ? 0.9 : 1, // Augmentation légère de l'opacité pour les inactives
        pointerEvents: isDeleting ? 'none' : 'auto',
        bgcolor: theme => correctionStatus !== 'ACTIVE' ? alpha(theme.palette.grey[300], 0.8) : undefined, // Fond légèrement plus visible
        position: 'relative',
        }}>
        
      {/* Status label */}
      {correctionStatus !== 'ACTIVE' && (
        <Box sx={{ 
          bgcolor: `${getStatusColor()}.main`, 
          color: 'white',
          py: 0.5, 
          px: 1.5,
          fontSize: '1.25rem',
          fontWeight: 'bold',
          position: 'absolute',
          top: 0,
          right: 0,
          borderTopRightRadius: 8,
          borderBottomLeftRadius: 8,
          zIndex: 1
        }}>
          {getStatusLabel()}
        </Box>
      )}

            {/* Card Header */}
            <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        p: 2,
        pb:0,
        pt: batchDeleteMode ? 2 : 2,
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
              {studentSubClass ? 
              <><RecentActorsIcon color="info" fontSize="small" sx={{ mr: .25 }} /> Groupe {studentSubClass}</>
               : ''}
            </Typography>
            </Box>

          )}
        </Box>
        
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          bgcolor: theme => getBoxColor(theme, getColorVariant(getGradeColor(grade))),
          p: 1, borderRadius: 2, 
          color: 'white' }}>
          <Typography variant="h5" component="div" fontWeight="bold">
            {typeof gradeWithPenalty === 'number' ? gradeWithPenalty.toFixed(1) : '0.0'}
          </Typography>
          <Typography variant="body2" sx={{ ml: 1, opacity: 0.9 }}>
            / {totalPossiblePoints > 0 ? totalPossiblePoints.toFixed(1) : '-'}
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
        
        <Box sx={{ display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'start', 
          justifyItems: 'left',
          pt: 1,
          flexDirection: 'column',
           }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
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
        
        {/* Points par partie */}
        {Array.isArray(correction.points_earned) && correction.points_earned.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Points par partie :
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
              {correction.points_earned.map((points, index) => (
                <Chip
                  key={index}
                  label={`P${index + 1} : ${points}`}
                  size="small"
                  variant="outlined"
                />
              ))}
            </Box>
          </Box>
        )}
          
          
          
        </Box>
      </Box>
      </Box>

      <Box>
            {!batchDeleteMode && (
            <Box sx={{ display: 'flex', 
            gap: 1,
            width: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            py: 1,
            }}>
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
              
              {/* Status action buttons */}
              {onChangeStatus && (
                <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                  {/* Active/Inactive toggle switch */}
                  <Tooltip title={correctionStatus === 'ACTIVE' ? "Désactiver" : "Activer"}>
                    <IconButton
                      onClick={() => handleChangeStatus(correctionStatus === 'ACTIVE' ? 'DEACTIVATED' : 'ACTIVE')}
                      color={correctionStatus === 'ACTIVE' ? "success" : "default"}
                      size="small"
                      disabled={isStatusChanging}
                      sx={{ 
                        bgcolor: theme => alpha(
                          correctionStatus === 'ACTIVE' ? theme.palette.success.main : theme.palette.grey[500], 
                          0.1
                        ),
                        '&:hover': {
                          bgcolor: theme => alpha(
                            correctionStatus === 'ACTIVE' ? theme.palette.success.main : theme.palette.grey[500], 
                            0.2
                          ),
                        }
                      }}
                    >
                      {isStatusChanging ? (
                        <CircularProgress size={18} color="inherit" />
                      ) : (
                        correctionStatus === 'ACTIVE' ? <ToggleOnIcon fontSize="small" /> : <ToggleOffIcon fontSize="small" />
                      )}
                    </IconButton>
                  </Tooltip>
                  
                  {/* Absent button */}
                  <Tooltip title={correctionStatus === 'ABSENT' ? "Marquer comme présent" : "Marquer comme absent"}>
                    <IconButton
                      onClick={() => handleChangeStatus('ABSENT')}
                      color={correctionStatus === 'ABSENT' ? "warning" : "default"}
                      size="small"
                      disabled={isStatusChanging}
                      sx={{ 
                        bgcolor: theme => alpha(
                          correctionStatus === 'ABSENT' ? theme.palette.warning.main : theme.palette.grey[500], 
                          0.1
                        ),
                        '&:hover': {
                          bgcolor: theme => alpha(
                            correctionStatus === 'ABSENT' ? theme.palette.warning.main : theme.palette.grey[500], 
                            0.2
                          ),
                        }
                      }}
                    >
                      {isStatusChanging ? (
                        <CircularProgress size={18} color="inherit" />
                      ) : (
                        <PersonOffIcon fontSize="small" />
                      )}
                    </IconButton>
                  </Tooltip>
                  
                  {/* Non rendu button */}
                  <Tooltip title={correctionStatus === 'NON_RENDU' ? "Marquer comme rendu" : "Marquer comme non rendu"}>
                    <IconButton
                      onClick={() => handleChangeStatus(correctionStatus === 'NON_RENDU' ? 'ACTIVE' : 'NON_RENDU')}
                      color={correctionStatus === 'NON_RENDU' ? "info" : "default"}
                      size="small"
                      disabled={isStatusChanging}
                      sx={{ 
                        bgcolor: theme => alpha(
                          correctionStatus === 'NON_RENDU' ? theme.palette.info.main : theme.palette.grey[500], 
                          0.1
                        ),
                        '&:hover': {
                          bgcolor: theme => alpha(
                            correctionStatus === 'NON_RENDU' ? theme.palette.info.main : theme.palette.grey[500], 
                            0.2
                          ),
                        }
                      }}
                    >
                      {isStatusChanging ? (
                        <CircularProgress size={18} color="inherit" />
                      ) : (
                        <AssignmentLateIcon fontSize="small" />
                      )}
                    </IconButton>
                  </Tooltip>
                </Box>
              )}
              
              {/* Bouton d'édition */}
              <Tooltip title="Éditer la correction">
                <Link href={`/corrections_autres/${correction.id}`} passHref target="_blank" rel="noopener noreferrer">
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

export default CorrectionCardAutre;