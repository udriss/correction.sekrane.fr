'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  IconButton, 
  CircularProgress, 
  Menu, 
  MenuItem, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button,
  Box,
  Typography,
  Snackbar,
  Alert,
  Card,
  CardContent,
  CardMedia
} from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import AudioFileIcon from '@mui/icons-material/AudioFile';
import SaveIcon from '@mui/icons-material/Save';
import StopIcon from '@mui/icons-material/Stop';

interface AudioUploaderProps {
  activityId: number;
  correctionId?: string;
  onAudioUploaded: (audioUrl: string) => void;
}

const AudioUploader: React.FC<AudioUploaderProps> = ({ 
  activityId, 
  correctionId, 
  onAudioUploaded 
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [recordingDialogOpen, setRecordingDialogOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Vérifier que c'est un fichier audio
    if (!file.type.startsWith('audio/')) {
      setError('Veuillez sélectionner un fichier audio valide');
      setSnackbarOpen(true);
      return;
    }

    await uploadFile(file);
    handleMenuClose();
  };

  const uploadFile = async (file: Blob, filename?: string) => {
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      
      // Si c'est un blob d'enregistrement, créer un nom de fichier
      if (filename) {
        formData.append('file', file, filename);
      } else {
        formData.append('file', file);
      }
      
      formData.append('activityId', activityId.toString());
      
      if (correctionId) {
        formData.append('correctionId', correctionId);
      } else {
        formData.append('correctionId', 'temp');
      }

      const response = await fetch('/api/uploads/audio', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'upload audio');
      }

      const data = await response.json();
      onAudioUploaded(data.url);
      
      // Reset
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setRecordedBlob(null);
      setRecordingDialogOpen(false);
      
    } catch (err) {
      console.error('Erreur upload audio:', err);
      setError(err instanceof Error ? err.message : 'Erreur inattendue');
      setSnackbarOpen(true);
    } finally {
      setUploading(false);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
    handleMenuClose();
  };

  const handleStartRecording = () => {
    setRecordingDialogOpen(true);
    handleMenuClose();
  };

  // Fonction pour démarrer l'enregistrement avec MediaRecorder
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      streamRef.current = stream;
      chunksRef.current = [];
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(blob);
        setIsRecording(false);
        setRecordingTime(0);
        
        // Arrêter le timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        
        // Libérer les ressources
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Démarrer le timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Erreur accès microphone:', error);
      setError('Impossible d\'accéder au microphone');
      setSnackbarOpen(true);
    }
  };

  // Fonction pour arrêter l'enregistrement
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  // Fonction pour formater le temps
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Nettoyage des ressources
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleSaveRecording = async () => {
    if (!recordedBlob) return;
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `recording-${timestamp}.webm`;
    
    await uploadFile(recordedBlob, filename);
  };

  const handleCloseRecordingDialog = () => {
    setRecordingDialogOpen(false);
    setRecordedBlob(null);
    setIsRecording(false);
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="audio/*"
        style={{ display: 'none' }}
      />
      
      <IconButton
        onClick={handleMenuOpen}
        color="primary"
        size="medium"
        disabled={uploading}
        title="Ajouter un fichier audio"
        sx={{ height: 'fit-content', alignSelf: 'center' }}
      >
        {uploading ? (
          <CircularProgress size={20} />
        ) : (
          <AudioFileIcon fontSize='medium' />
        )}
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={triggerFileInput}>
          <AudioFileIcon sx={{ mr: 1 }} />
          Ajouter un fichier audio
        </MenuItem>
        <MenuItem onClick={handleStartRecording}>
          <MicIcon sx={{ mr: 1 }} />
          Enregistrer directement
        </MenuItem>
      </Menu>

      {/* Dialog d'enregistrement */}
      <Dialog 
        open={recordingDialogOpen} 
        onClose={handleCloseRecordingDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Enregistrement audio
        </DialogTitle>
        <DialogContent>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: 3,
            py: 2 
          }}>
            {!recordedBlob ? (
              <>
                <Typography variant="body1" color="text.secondary" textAlign="center">
                  {isRecording ? 'Enregistrement en cours...' : 'Cliquez sur le bouton pour commencer l\'enregistrement'}
                </Typography>
                
                {/* Interface d'enregistrement native */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  {isRecording && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Box 
                        sx={{ 
                          width: 12, 
                          height: 12, 
                          borderRadius: '50%', 
                          bgcolor: 'error.main',
                          animation: 'blink 1s infinite'
                        }} 
                      />
                      <Typography variant="h6" color="error.main">
                        {formatTime(recordingTime)}
                      </Typography>
                    </Box>
                  )}
                  
                  <IconButton
                    onClick={isRecording ? stopRecording : startRecording}
                    color={isRecording ? "error" : "primary"}
                    size="large"
                    sx={{ 
                      width: 80, 
                      height: 80,
                      border: '3px solid',
                      borderColor: isRecording ? 'error.main' : 'primary.main'
                    }}
                  >
                    {isRecording ? <StopIcon sx={{ fontSize: 40 }} /> : <MicIcon sx={{ fontSize: 40 }} />}
                  </IconButton>
                  
                  <Typography variant="caption" color="text.secondary">
                    {isRecording ? 'Cliquez pour arrêter' : 'Cliquez pour démarrer'}
                  </Typography>
                </Box>
                
                {/* Styles pour l'animation de clignotement */}
                <style jsx>{`
                  @keyframes blink {
                    0%, 50% { opacity: 1; }
                    51%, 100% { opacity: 0.3; }
                  }
                `}</style>
              </>
            ) : (
              <>
                <Typography variant="body1" color="success.main" textAlign="center">
                  ✓ Enregistrement terminé
                </Typography>
                
                {/* Lecteur audio avec CardMedia */}
                <Card sx={{ width: '100%', maxWidth: 400, bgcolor: 'background.paper' }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <AudioFileIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="body2" color="text.secondary">
                        Aperçu de l'enregistrement
                      </Typography>
                    </Box>
                    
                    {/* CardMedia pour l'audio */}
                    <CardMedia
                      component="audio"
                      controls
                      src={recordedBlob ? URL.createObjectURL(recordedBlob) : ''}
                      sx={{
                        width: '100%',
                        height: 40,
                        mb: 2,
                        '& audio': {
                          width: '100%',
                          outline: 'none'
                        }
                      }}
                    />
                    
                    {/* Bouton de sauvegarde */}
                    <Button
                      variant="contained"
                      onClick={handleSaveRecording}
                      startIcon={<SaveIcon />}
                      disabled={uploading}
                      fullWidth
                      sx={{ mt: 1 }}
                    >
                      {uploading ? 'Sauvegarde...' : 'Sauvegarder l\'enregistrement'}
                    </Button>
                  </CardContent>
                </Card>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRecordingDialog}>
            {recordedBlob ? 'Annuler' : 'Fermer'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={6000} 
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity="error" 
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>
    </>
  );
};

export default AudioUploader;
