// UnsavedChangesModal.tsx
'use client';

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import CancelIcon from '@mui/icons-material/Cancel';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

interface UnsavedChangesModalProps {
  open: boolean;
  onClose: () => void;
  onStay: () => void;
  onLeave: () => void;
  onSaveAndLeave: () => Promise<void>;
  destinationUrl?: string;
}

const UnsavedChangesModal: React.FC<UnsavedChangesModalProps> = ({
  open,
  onClose,
  onStay,
  onLeave,
  onSaveAndLeave,
  destinationUrl
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: 1
        }
      }}
    >
      <DialogTitle id="alert-dialog-title" sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" gap={1}>
          <WarningAmberIcon color="warning" />
          <Typography variant="h6" component="span" fontWeight="bold">
            Modifications non enregistrées
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description" sx={{ mb: 2 }}>
          Vous avez des modifications non enregistrées. Que souhaitez-vous faire ?
        </DialogContentText>
        
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexDirection: 'column' }}>
          <Button
            onClick={onSaveAndLeave}
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            fullWidth
          >
            Enregistrer et continuer
          </Button>
          
          <Button
            onClick={onLeave}
            variant="outlined"
            color="error"
            startIcon={<ExitToAppIcon />}
            fullWidth
          >
            Quitter sans enregistrer
          </Button>
          
          <Button
            onClick={onStay}
            variant="outlined"
            color="info"
            startIcon={<CancelIcon />}
            fullWidth
          >
            Rester sur cette page
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default UnsavedChangesModal;