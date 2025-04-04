import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Paper,
  Typography,
  Alert,
  alpha,
  Theme
} from '@mui/material';

interface Fragment {
  id: number;
  content: string;
  category?: string;
  tags: string[];
  activity_id?: number | null;
  activity_name?: string;
  created_at: string;
  usage_count?: number;
  isOwner?: boolean;
  user_id?: string;
  categories?: Array<{id: number, name: string}> | number[];
}

interface DeleteFragmentDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  fragmentToDelete: Fragment | null;
  deleteError: string;
  handleDeleteFragment: () => void;
  theme: Theme;
}

export const DeleteFragmentDialog: React.FC<DeleteFragmentDialogProps> = ({
  open,
  setOpen,
  fragmentToDelete,
  deleteError,
  handleDeleteFragment,
  theme
}) => {
  return (
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
      aria-labelledby="delete-fragment-dialog-title"
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: `0 8px 32px ${alpha(theme.palette.error.main, 0.2)}`
        }
      }}
    >
      <DialogTitle id="delete-fragment-dialog-title">
        Confirmer la suppression
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          Êtes-vous sûr de vouloir supprimer ce fragment ? Cette action est irréversible.
        </DialogContentText>
        {fragmentToDelete && (
          <Paper variant="outlined" sx={{ p: 2, mt: 2, bgcolor: 'background.default' }}>
            <Typography variant="body2" gutterBottom fontStyle="italic">
              {fragmentToDelete.content}
            </Typography>
          </Paper>
        )}
        {deleteError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {deleteError}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpen(false)} color="primary">
          Annuler
        </Button>
        <Button onClick={handleDeleteFragment} color="error">
          Supprimer
        </Button>
      </DialogActions>
    </Dialog>
  );
};
