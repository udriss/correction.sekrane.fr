import React from 'react';
import { Paper, IconButton, CircularProgress, Chip, Switch, FormControlLabel, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import UndoIcon from '@mui/icons-material/Undo';
import SaveIcon from '@mui/icons-material/Save';
import ShareIcon from '@mui/icons-material/Share';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import ImageUploader from '@/app/components/ImageUploader';
import { Typography } from '@mui/material';
interface ActionButtonsProps {
  addNewParagraph: () => void;
  addNewImage: (imageUrl: string) => void;
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
  // Formatter la date de dernière sauvegarde automatique
  const formatLastSaveTime = () => {
    if (!lastAutoSave) return '';
    
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - lastAutoSave.getTime()) / 60000);
    
    if (diffInMinutes < 1) {
      return 'à l\'instant';
    } else if (diffInMinutes === 1) {
      return 'il y a 1 minute';
    } else if (diffInMinutes < 60) {
      return `il y a ${diffInMinutes} minutes`;
    } else {
      const hours = Math.floor(diffInMinutes / 60);
      const mins = diffInMinutes % 60;
      if (hours === 1) {
        return mins > 0 ? `il y a 1h${mins}` : 'il y a 1 heure';
      } else {
        return mins > 0 ? `il y a ${hours}h${mins}` : `il y a ${hours} heures`;
      }
    }
  };

  return (
    <Paper className="p-4 shadow mb-6 flex justify-between items-center">
      <div className="flex space-x-2">
        <IconButton
          onClick={addNewParagraph}
          color="primary"
          size="medium"
          title="Ajouter un paragraphe"
        >
          <AddIcon />
        </IconButton>
        
        <ImageUploader 
          activityId={activityId} 
          correctionId={correctionId}
          onImageUploaded={addNewImage} 
        />
      </div>
      
      {/* Indicateur de sauvegarde automatique */}
      <div className="flex items-center">
        <FormControlLabel
          control={
        <Switch
          checked={autoSaveActive}
          onChange={(e) => setAutoSaveActive(e.target.checked)}
          size="small"
        />
          }
          label={
        <Typography 
          variant="overline" 
          color="text.secondary"
        >
          Auto-save
        </Typography>
          }
        />
        {autoSaveActive && lastAutoSave && (
          <Tooltip title={`Enregistrement automatique toutes les 70 secondes. Dernière sauvegarde: ${lastAutoSave.toLocaleTimeString()}`}>
        <Chip
          icon={<AutorenewIcon fontSize="small" />}
          label={`Auto-enregistré ${formatLastSaveTime()}`}
          size="small"
          variant="outlined"
          color="info"
          sx={{ ml: 1, fontSize: '0.7rem' }}
        />
          </Tooltip>
        )}
      </div>
      
      <div className="space-x-2 flex justify-end items-center">
        <IconButton
          onClick={handleUndo}
          color="inherit"
          disabled={historyLength === 0}
          size="medium"
          title="Annuler la dernière modification"
        >
          <UndoIcon />
        </IconButton>
        <IconButton
          onClick={() => {
            updatePreview();
            handleSaveCorrection();
          }}
          color="primary"
          size="medium"
          disabled={saving}
          title="Sauvegarder la correction"
        >
          {saving ? <CircularProgress size={20} /> : <SaveIcon />}
        </IconButton>
        <IconButton
          color="primary"
          onClick={() => setShareModalOpen(true)}
          size="medium"
          title="Partager la correction"
        >
          <ShareIcon />
        </IconButton>
        <IconButton
          onClick={() => {
            updatePreview();
            handleCopyToClipboard();
          }}
          color="success"
          size="medium"
          title="Copier dans le presse-papier"
        >
          <ContentCopyIcon />
        </IconButton>
      </div>
    </Paper>
  );
};

export default ActionButtons;
