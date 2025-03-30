'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  IconButton,
  Alert,
  CircularProgress,
  Tooltip,
  Box,
  Typography,
  Snackbar
} from '@mui/material';
import ShareIcon from '@mui/icons-material/Share';
import CopyIcon from '@mui/icons-material/ContentCopy';
import LinkIcon from '@mui/icons-material/Link';
import CheckIcon from '@mui/icons-material/Check';
import * as shareService from '@/lib/services/shareService';

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  correctionId: string;
  onShareSuccess?: (code: string) => void;  // Nouvelle prop
}

export default function ShareModal({ open, onClose, correctionId, onShareSuccess }: ShareModalProps) {
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [copyInstructions, setCopyInstructions] = useState(false);
  const textFieldRef = useRef<HTMLInputElement>(null);
  
  // URL de partage complète
  const shareUrl = shareCode 
    ? `${window.location.origin}/feedback/${shareCode}` 
    : '';

  // Vérifier s'il existe déjà un code de partage
  useEffect(() => {
    if (open && correctionId) {
      setLoading(true);
      shareService.getExistingShareCode(correctionId)
        .then(response => {
          if (response.exists && response.code) {
            setShareCode(response.code);
            // Appeler la fonction de callback avec le code existant
            if (onShareSuccess) {
              onShareSuccess(response.code);
            }
          }
        })
        .catch(err => {
          console.error('Erreur:', err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open, correctionId, onShareSuccess]);

  // Fonction pour générer un nouveau code
  const handleGenerateCode = async () => {
    setLoading(true);
    setError('');
    setGenerated(false);
    try {
      const result = await shareService.generateShareCode(correctionId);
      if (result.code) {
        setShareCode(result.code);
        setGenerated(result.isNew || false);
        
        // Appeler la fonction de callback avec le code généré
        if (onShareSuccess) {
          onShareSuccess(result.code);
        }
      }
    } catch (err) {
      setError('Erreur lors de la génération du code de partage');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour copier l'URL dans le presse-papiers avec gestion d'erreur améliorée
  const handleCopyLink = () => {
    if (!shareUrl) return;
    
    setError(''); // Clear previous errors
    
    try {
      // Method 1: Modern Clipboard API
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        navigator.clipboard.writeText(shareUrl)
          .then(() => {
            
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          })
          .catch(err => {
            console.error('Clipboard API error:', err);
            // Try fallback
            tryFallbackCopy();
          });
      } 
      // Method 2: execCommand fallback
      else {
        tryFallbackCopy();
      }
    } catch (err) {
      console.error('Copy error:', err);
      showManualCopyInstructions();
    }
  };
  
  // Fallback copy method
  const tryFallbackCopy = () => {
    try {
      // Check if we have a reference to the TextField
      if (textFieldRef.current) {
        // Select the text field content
        textFieldRef.current.select();
        textFieldRef.current.setSelectionRange(0, 99999); // For mobile devices
        
        // Try to use document.execCommand
        const successful = document.execCommand('copy');
        if (successful) {
          
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
          return;
        }
      }
      // If we get here, both methods failed
      showManualCopyInstructions();
    } catch (err) {
      console.error('Fallback copy error:', err);
      showManualCopyInstructions();
    }
  };
  
  // Show instructions for manual copy
  const showManualCopyInstructions = () => {
    setCopyInstructions(true);
    // Focus and select the textfield content to make it easier for the user
    if (textFieldRef.current) {
      textFieldRef.current.focus();
      textFieldRef.current.select();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ShareIcon color="primary" />
        Partager la correction
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {generated && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Code de partage généré avec succès !
          </Alert>
        )}

        <DialogContentText sx={{ mb: 2 }}>
          Générez un code de partage pour permettre à l'élève de consulter cette correction.
        </DialogContentText>

        {shareCode ? (
          <>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              Lien de partage :
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TextField
                fullWidth
                value={shareUrl}
                variant="outlined"
                size="small"
                inputRef={textFieldRef}
                InputProps={{
                  readOnly: true,
                  startAdornment: (
                    <LinkIcon color="action" sx={{ mr: 1 }} />
                  ),
                  onClick: () => {
                    // Use the ref directly instead of e.target
                    if (textFieldRef.current) {
                      textFieldRef.current.select();
                    }
                  }
                }}
              />
              <Tooltip title={copied ? "Copié !" : "Copier le lien"}>
                <IconButton onClick={handleCopyLink} color={copied ? "success" : "primary"}>
                  {copied ? <CheckIcon /> : <CopyIcon />}
                </IconButton>
              </Tooltip>
            </Box>
            
            {copyInstructions && (
              <Alert 
                severity="info" 
                sx={{ mb: 2 }}
                onClose={() => setCopyInstructions(false)}
              >
                La copie automatique a échoué. Veuillez sélectionner et copier le lien manuellement.
              </Alert>
            )}
            
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              Code :
            </Typography>
            <TextField
              fullWidth
              value={shareCode}
              variant="outlined"
              size="small"
              InputProps={{
                readOnly: true,
                sx: { fontWeight: 'bold', letterSpacing: '0.5px' }
              }}
            />
          </>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <ShareIcon />}
              onClick={handleGenerateCode}
              disabled={loading}
            >
              {loading ? 'Génération...' : 'Générer un code de partage'}
            </Button>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Fermer
        </Button>
      </DialogActions>
      
      {/* Success toast notification */}
      <Snackbar
        open={copied}
        autoHideDuration={2000}
        onClose={() => setCopied(false)}
        message="Lien copié !"
      />
    </Dialog>
  );
}
