import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  CircularProgress,
  Typography
} from '@mui/material';

interface AlertDialogProps {
  open: boolean;
  title: string;
  content: React.ReactNode;
  confirmText: string;
  confirmColor?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  cancelText: string;
  isProcessing?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  icon?: React.ReactNode;
}

export default function AlertDialog({
  open,
  title,
  content,
  confirmText,
  confirmColor = 'primary',
  cancelText,
  isProcessing = false,
  onConfirm,
  onCancel,
  icon
}: AlertDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={isProcessing ? undefined : onCancel}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1.5,
        bgcolor: confirmColor === 'error' ? 'error.50' : 'background.paper'
      }}>
        {icon && <Box sx={{ color: `${confirmColor}.main` }}>{icon}</Box>}
        <Typography variant="h6" component="div">{title}</Typography>
      </DialogTitle>
      <DialogContent dividers>
        {content}
      </DialogContent>
      <DialogActions sx={{ py: 2, px: 3 }}>
        <Button 
          onClick={onCancel} 
          disabled={isProcessing}
          variant="outlined"
          color="inherit"
        >
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color={confirmColor}
          disabled={isProcessing}
          startIcon={isProcessing ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {isProcessing ? 'Traitement en cours...' : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}