import React from 'react';
import { Paper, IconButton, CircularProgress } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import UndoIcon from '@mui/icons-material/Undo';
import SaveIcon from '@mui/icons-material/Save';
import ShareIcon from '@mui/icons-material/Share';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ImageUploader from '@/app/components/ImageUploader';

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
  correctionId
}) => {
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
