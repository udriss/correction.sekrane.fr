import React, { useState, useEffect } from 'react';
import { Paper, Box, IconButton, CircularProgress, Switch, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import UndoIcon from '@mui/icons-material/Undo';
import SaveIcon from '@mui/icons-material/Save';
import ShareIcon from '@mui/icons-material/Share';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ImageUploader from '@/app/components/ImageUploader';
import AudioUploader from '@/app/components/AudioUploader';
import { Typography } from '@mui/material';
import * as shareService from '@/lib/services/shareService';

interface ActionButtonsProps {
  addNewParagraph: () => void;
  addNewImage: (imageUrl: string) => void;
  addNewAudio: (audioUrl: string) => void;
  handleUndo: () => void;
  handleSaveCorrection: () => void;
  updatePreview: () => void;
  handleCopyToClipboard: () => void;
  setShareModalOpen: (open: boolean) => void;
  saving: boolean;
  historyLength: number;
  activityId: number;
  correctionId: string;
  autoSaveActive?: boolean;
  setAutoSaveActive?: (active: boolean) => void;
  lastAutoSave?: Date | null;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  addNewParagraph,
  addNewImage,
  addNewAudio,
  handleUndo,
  handleSaveCorrection,
  updatePreview,
  handleCopyToClipboard,
  setShareModalOpen,
  saving,
  historyLength,
  activityId,
  correctionId,
  autoSaveActive = true,
  setAutoSaveActive = () => {},
  lastAutoSave = null
}) => {
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    if (correctionId) {
      shareService.getExistingShareCode(correctionId)
        .then(response => {
          if (response.exists && response.code) {
            setShareCode(response.code);
          }
        })
        .catch(err => {
          console.error('Erreur lors de la vérification du code de partage:', err);
        });
    }
  }, [correctionId]);

  // Timer pour mettre à jour l'heure actuelle et rafraîchir les couleurs
  useEffect(() => {
    if (autoSaveActive && lastAutoSave) {
      const interval = setInterval(() => {
        setCurrentTime(new Date());
      }, 15000); // Mise à jour toutes les 15 secondes

      return () => clearInterval(interval);
    }
  }, [autoSaveActive, lastAutoSave]);

  // Formatter la date de dernière sauvegarde automatique
  const formatLastSaveTime = () => {
    if (!lastAutoSave) return '';
    
    const diffInSeconds = Math.floor((currentTime.getTime() - lastAutoSave.getTime()) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const timeString = lastAutoSave.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
    
    if (diffInMinutes < 1) {
      return `à l'instant (${timeString})`;
    } else if (diffInMinutes === 1) {
      return `il y a 1 minute (${timeString})`;
    } else if (diffInMinutes < 60) {
      return `il y a ${diffInMinutes} minutes (${timeString})`;
    } else {
      const hours = Math.floor(diffInMinutes / 60);
      const mins = diffInMinutes % 60;
      if (hours === 1) {
      return mins > 0 ? `il y a 1h${mins} (${timeString})` : `il y a 1 heure (${timeString})`;
      } else {
      return mins > 0 ? `il y a ${hours}h${mins} (${timeString})` : `il y a ${hours} heures (${timeString})`;
      }
    }
    };

  // Fonction pour déterminer la couleur de l'encoche selon le temps écoulé
  const getCheckColor = () => {
    if (!lastAutoSave) return 'disabled';
    
    const diffInMinutes = Math.floor((currentTime.getTime() - lastAutoSave.getTime()) / 60000);
    
    // Échelle de couleurs basée sur le temps écoulé
    if (diffInMinutes < 0.5) {
      return 'success'; // Vert - très récent
    } else if (diffInMinutes < 1) {
      return 'info'; // Bleu - récent
    } else if (diffInMinutes < 2) {
      return 'warning'; // Orange - modérément ancien
    } else {
      return 'error'; // Rouge - ancien
    }
  };

  // Fonction pour obtenir le message du tooltip
  const getCheckTooltipMessage = () => {
    if (!lastAutoSave) return 'Aucune sauvegarde automatique';
    
    const diffInMinutes = Math.floor((currentTime.getTime() - lastAutoSave.getTime()) / 60000);
    
    let freshness = '';
    if (diffInMinutes < 0.5) {
      freshness = '(très récent)';
    } else if (diffInMinutes < 1) {
      freshness = '(récent)';
    } else if (diffInMinutes < 2) {
      freshness = '(modérément ancien)';
    } else {
      freshness = '(ancien)';
    }
    
    //return `Auto-enregistré ${formatLastSaveTime()} ${freshness}. Enregistrement automatique toutes les 90 secondes.`;
    return `Auto-enregistré ${formatLastSaveTime()}. Enregistrement automatique toutes les 90 secondes.`;
  };

  const getShareUrl = () => {
    return shareCode ? `${window.location.origin}/feedback/${shareCode}` : '';
  };

  return (
    <Paper className="p-4 shadow mb-6 flex justify-between items-center">
      <div className="flex space-x-2">
        <IconButton
          onClick={addNewParagraph}
          color="primary"
          size="medium"
          title="Ajouter un paragraphe"
          sx={{ height: 'fit-content', alignSelf: 'center' }}
        >
          <AddIcon fontSize='medium' />
        </IconButton>
        
        <ImageUploader 
          activityId={activityId} 
          correctionId={correctionId}
          onImageUploaded={addNewImage} 
        />
        
        <AudioUploader 
          activityId={activityId} 
          correctionId={correctionId}
          onAudioUploaded={addNewAudio} 
        />
        <IconButton
          onClick={handleUndo}
          color="inherit"
          disabled={historyLength === 0}
          size="medium"
          sx={{ height: 'fit-content', alignSelf: 'center' }}
          title="Annuler la dernière modification"
        >
          <UndoIcon fontSize='medium' />
        </IconButton>
        <IconButton
          onClick={() => {
            updatePreview();
            handleCopyToClipboard();
          }}
          color="success"
          size="medium"
          sx={{ height: 'fit-content', alignSelf: 'center' }}
          title="Copier dans le presse-papier"
        >
          <ContentCopyIcon fontSize='medium' />
        </IconButton>
        <IconButton
          onClick={() => {
            updatePreview();
            handleSaveCorrection();
          }}
          color="primary"
          size="medium"
          sx={{ height: 'fit-content', alignSelf: 'center' }}
          disabled={saving}
          title="Sauvegarder la correction"
        >
          {saving ? <CircularProgress size={20} /> : <SaveIcon />}
        </IconButton>
      {/* Indicateur de sauvegarde automatique */}
      <Box 
      sx={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 2,
      }}
      >
      <Box 
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        mr: 2,
      }}
      >
        <Switch
          checked={autoSaveActive}
          onChange={(e) => setAutoSaveActive(e.target.checked)}
          size="small"
        />
        <Typography
          variant="overline"
          color="text.secondary"
          sx={{ 
            mt: 0,
            fontSize: '0.55rem',}}
        >
          Auto-save
        </Typography>
      </Box>
      {autoSaveActive && lastAutoSave && (
        <Tooltip title={getCheckTooltipMessage()}>
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
            <CheckCircleIcon 
              color={getCheckColor()} 
              fontSize="small"
              sx={{ 
                transition: 'color 0.3s ease',
                filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))'
              }}
            />
          </Box>
        </Tooltip>
      )}
      </Box>
      </div>
      

      
      <div className="space-x-2 flex justify-end items-center">
        <Tooltip title={shareCode ? "Cette correction est déjà partagée" : "Partager la correction"}>
          <IconButton
            color={shareCode ? "success" : "primary"}
            onClick={() => setShareModalOpen(true)}
            size="medium"
            sx={{ height: 'fit-content', alignSelf: 'center' }}
          >
            {shareCode ? <VisibilityIcon /> : <ShareIcon />}
          </IconButton>
        </Tooltip>
        {shareCode && (
          <Tooltip title="Ouvrir le lien de partage">
            <IconButton
              onClick={() => window.open(getShareUrl(), '_blank')}
              color="info"
              size="medium"
              sx={{ height: 'fit-content', alignSelf: 'center' }}
            >
              <OpenInNewIcon />
            </IconButton>
          </Tooltip>
        )}
      </div>
    </Paper>
  );
};

export default ActionButtons;
