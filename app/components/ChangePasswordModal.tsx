'use client';

import React, { useState } from 'react';
import {
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Alert,
  CircularProgress
} from '@mui/material';
import { Lock as LockIcon } from '@mui/icons-material';

interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ open, onClose }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const resetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation côté client
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Tous les champs sont obligatoires');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('Les nouveaux mots de passe ne correspondent pas');
      return;
    }
    
    if (newPassword.length < 6) {
      setError('Le nouveau mot de passe doit comporter au moins 6 caractères');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du changement de mot de passe');
      }
      
      setSuccess('Mot de passe mis à jour avec succès');
      
      // Fermer le modal après quelques secondes
      setTimeout(() => {
        handleClose();
      }, 2000);
      
    } catch (err: any) {
      setError(err.message || 'Erreur lors du changement de mot de passe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <div className="flex items-center">
          <LockIcon sx={{ mr: 1 }} />
          Changer le mot de passe
        </div>
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <DialogContentText className="mb-4">
            Pour changer votre mot de passe, veuillez entrer votre mot de passe actuel ainsi que votre nouveau mot de passe.
          </DialogContentText>
          
          {error && (
            <Alert severity="error" className="mb-4">
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" className="mb-4">
              {success}
            </Alert>
          )}
          
          <TextField
            margin="dense"
            label="Mot de passe actuel"
            type="password"
            fullWidth
            variant="outlined"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            disabled={loading || Boolean(success)}
          />
          
          <TextField
            margin="dense"
            label="Nouveau mot de passe"
            type="password"
            fullWidth
            variant="outlined"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            disabled={loading || Boolean(success)}
            className="mt-3"
          />
          
          <TextField
            margin="dense"
            label="Confirmer le nouveau mot de passe"
            type="password"
            fullWidth
            variant="outlined"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={loading || Boolean(success)}
            className="mt-3"
          />
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} color="inherit" disabled={loading}>
            Annuler
          </Button>
          
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading || Boolean(success)}
          >
            {loading ? (
              <>
                <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                Modification...
              </>
            ) : (
              'Changer le mot de passe'
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
