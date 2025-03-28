import React from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  DialogContentText,
  Typography,
  Box,
  Button,
  Alert,
  CircularProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import AlertDialog from '@/components/AlertDialog';

type Group = {
  name: string;
  id: number;
  // other properties...
};

type GroupDialogsProps = {
  correctionToRemove: number | null;
  setCorrectionToRemove: (id: number | null) => void;
  confirmRemoveFromGroup: () => Promise<void>;
  isProcessing: boolean;
  correctionToDelete: number | null;
  setCorrectionToDelete: (id: number | null) => void;
  confirmDeleteCorrection: () => Promise<void>;
  groupDeleteDialogOpen: boolean;
  setGroupDeleteDialogOpen: (open: boolean) => void;
  handleDeleteGroup: () => Promise<void>;
  isDeleting: boolean;
  group: Group | null;
};

const GroupDialogs: React.FC<GroupDialogsProps> = ({
  correctionToRemove,
  setCorrectionToRemove,
  confirmRemoveFromGroup,
  isProcessing,
  correctionToDelete,
  setCorrectionToDelete,
  confirmDeleteCorrection,
  groupDeleteDialogOpen,
  setGroupDeleteDialogOpen,
  handleDeleteGroup,
  isDeleting,
  group
}) => {
  return (
    <>
      {/* Boîte de dialogue pour retirer une correction du groupe */}
      <AlertDialog
        open={correctionToRemove !== null}
        title="Retirer la correction du groupe"
        content="Voulez-vous retirer cette correction du groupe ? La correction elle-même ne sera pas supprimée."
        confirmText="Retirer"
        confirmColor="warning"
        cancelText="Annuler"
        isProcessing={isProcessing}
        onConfirm={confirmRemoveFromGroup}
        onCancel={() => setCorrectionToRemove(null)}
        icon={<RemoveCircleOutlineIcon />}
      />

      {/* Boîte de dialogue pour supprimer complètement une correction */}
      <AlertDialog
        open={correctionToDelete !== null}
        title="Supprimer définitivement la correction"
        content={
          <>
            <Typography gutterBottom>
              Voulez-vous supprimer définitivement cette correction ? <strong>Cette action est irréversible.</strong>
            </Typography>
            <Alert severity="error" sx={{ mt: 2 }}>
              La correction sera complètement supprimée de la base de données et retirée de tous les groupes.
            </Alert>
          </>
        }
        confirmText="Supprimer définitivement"
        confirmColor="error"
        cancelText="Annuler"
        isProcessing={isProcessing}
        onConfirm={confirmDeleteCorrection}
        onCancel={() => setCorrectionToDelete(null)}
        icon={<DeleteForeverIcon />}
      />

      {/* Modal de confirmation de suppression */}
      <Dialog
        open={groupDeleteDialogOpen} 
        onClose={() => setGroupDeleteDialogOpen(false)}
        slotProps={{
          paper: {
            elevation: 3,
            sx: { 
              borderRadius: 2,
              maxWidth: '750px',  // Définir la largeur maximale ici
              width: '100%'       // Assurer qu'il prend 100% jusqu'à maxWidth
            }
          }
        }}
      >
        <DialogTitle sx={{ bgcolor: '#f8f9fa', borderBottom: '1px solid #e0e0e0', py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DeleteIcon color="error" />
            <Typography variant="h6">Confirmation de suppression</Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <DialogContentText>
            <br />
            Êtes-vous sûr de vouloir supprimer le groupe&nbsp;
            <Typography variant="body1" color="secondary" component="span" sx={{ fontWeight: 'bold' }}>
              {group?.name}&nbsp;
            </Typography>?<strong>&nbsp;Cette action est irréversible</strong>.
          </DialogContentText>
          
          {/* Ajouter un espace entre le texte et l'alerte */}
          <Box sx={{ mt: 2, mb: 2 }}></Box>
          
          {/* L'alerte est maintenant à l'extérieur du DialogContentText */}
          <Alert severity="warning">
            Attention : cela supprimera uniquement le groupe, pas les corrections individuelles.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #f0f0f0' }}>
          <Button 
            onClick={() => setGroupDeleteDialogOpen(false)} 
            variant="outlined"
            disabled={isDeleting}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleDeleteGroup} 
            color="error" 
            variant="contained"
            disabled={isDeleting}
            startIcon={isDeleting ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />}
          >
            {isDeleting ? "Suppression..." : "Supprimer"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default GroupDialogs;
