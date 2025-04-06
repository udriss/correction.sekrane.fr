import React, { useState } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Box, Typography, Alert
} from '@mui/material';
import { updateFragmentPosition } from '@/lib/services/fragmentService';
import { Fragment } from '@/lib/types';

interface PositionModalProps {
  open: boolean;
  onClose: () => void;
  fragment: Fragment | null;
  onSuccess: (updatedFragments: any[]) => void;
}

const PositionModal: React.FC<PositionModalProps> = ({ 
  open, 
  onClose, 
  fragment, 
  onSuccess 
}) => {
  const [position, setPosition] = useState<string>(
    fragment?.position_order?.toString() || '0'
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mettre à jour la position lorsque le fragment change
  React.useEffect(() => {
    if (fragment) {
      setPosition(fragment.position_order?.toString() || '0');
    }
  }, [fragment]);

  const handlePositionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Validation: accepter seulement les valeurs numériques non négatives
    if (/^\d*$/.test(value)) {
      setPosition(value);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (!fragment) return;
    
    const newPosition = parseInt(position, 10);
    
    // Validation finale
    if (isNaN(newPosition) || newPosition < 0) {
      setError('Veuillez entrer une valeur numérique positive');
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await updateFragmentPosition(fragment.id, newPosition);
      onSuccess(result.fragments);
      onClose();
    } catch (err) {
      setError('Erreur lors de la mise à jour de la position');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Définir la position du fragment</DialogTitle>
      <DialogContent>
        <Box sx={{ my: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
            Choisissez la position du fragment dans la liste. Les positions commencent à 0.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Position"
            type="text"
            fullWidth
            value={position}
            onChange={handlePositionChange}
            inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
            variant="outlined"
            error={!!error}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">Annuler</Button>
        <Button 
          onClick={handleSubmit} 
          color="primary" 
          variant="contained"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Mise à jour...' : 'Valider'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PositionModal;