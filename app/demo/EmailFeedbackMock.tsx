import React, { useState } from 'react';
import { 
  Button, Dialog, DialogActions, DialogContent, DialogTitle, 
  TextField, Alert, Box, Typography, Tabs, Tab, Chip,
  CircularProgress
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import GroupIcon from '@mui/icons-material/Group';
import { Timeline, TimelineItem, TimelineSeparator, TimelineConnector, TimelineContent, TimelineDot } from '@mui/lab';

interface EmailFeedbackMockProps {
  studentName?: string;
}

export default function EmailFeedbackMock({ studentName = "Jean Dupont" }: EmailFeedbackMockProps) {
  const [open, setOpen] = useState(false);
  const [messageType, setMessageType] = useState<0 | 1>(0);
  const [emailSubject, setEmailSubject] = useState('TP-5 Synthèse d\'esters, correction');
  const [emailTo, setEmailTo] = useState('jean.dupont@example.com');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showStatus, setShowStatus] = useState(false);

  const handleOpen = () => {
    setOpen(true);
    setSuccess(false);
    setShowStatus(false);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: 0 | 1) => {
    setMessageType(newValue);
  };

  const handleSend = () => {
    setSending(true);
    setShowStatus(true);
    
    // Simuler l'envoi
    setTimeout(() => {
      setSending(false);
      setSuccess(true);
    }, 1500);
  };

  // Message prédéfini pour la démo
  const defaultMessage = `Bonjour ${studentName},

Je viens de terminer la correction de votre travail.
Vous pouvez la consulter en cliquant sur le lien suivant :

https://exemple.com/feedback/abc123

Points importants à retenir :
- prenez le temps de lire attentivement tous les commentaires
- n'hésitez pas à me contacter si vous avez des questions
- gardez ce lien, il vous permettra de consulter la correction à tout moment

Je reste à votre disposition pour toute question ou clarification.

Bien cordialement,
M. SEKRANE`;

  return (
    <>
      <Button 
        variant="outlined" 
        color="success" 
        startIcon={<EmailIcon />} 
        onClick={handleOpen}
      >
        Envoyer la correction
      </Button>
      
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          Envoyer un courriel de feedback
          <Tabs 
            value={messageType} 
            onChange={handleTabChange}
            sx={{ mt: 2 }}
          >
            <Tab label="Message prédéfini" />
            <Tab label="Message personnalisé" />
          </Tabs>
        </DialogTitle>
        <DialogContent>
          {success && <Alert severity="success" sx={{ mb: 2 }}>Email envoyé avec succès!</Alert>}
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="body2" sx={{ mr: 1 }}>
              Destinataire par défaut:
            </Typography>
            <Typography variant="body2" color="primary" fontWeight="medium">
              jean.dupont@example.com
            </Typography>
          </Box>
          
          <TextField
            margin="dense"
            label="Destinataire"
            type="email"
            fullWidth
            value={emailTo}
            onChange={(e) => setEmailTo(e.target.value)}
            sx={{ mb: 2 }}
            required
            placeholder="email@exemple.com"
          />
          
          <TextField
            margin="dense"
            label="Objet"
            type="text"
            fullWidth
            value={emailSubject}
            onChange={(e) => setEmailSubject(e.target.value)}
            sx={{ mb: 2 }}
            required
          />
          
          {/* Message prédéfini ou personnalisé selon le tab */}
          <TextField
            margin="dense"
            label={messageType === 0 ? "Message prédéfini" : "Message personnalisé"}
            multiline
            rows={15}
            fullWidth
            value={defaultMessage}
            InputProps={{
              readOnly: messageType === 0,
            }}
            sx={{ 
              bgcolor: messageType === 0 ? 'action.hover' : 'transparent',
              '& .MuiInputBase-input.Mui-readOnly': {
                cursor: 'default'
              }
            }}
          />

          {/* Liste des destinataires */}
          <Box sx={{ mb: 2, mt: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <GroupIcon color="primary" />
                Destinataires
              </Typography>
              <Button
                startIcon={<PersonAddIcon />}
                size="small"
              >
                Ajouter des destinataires
              </Button>
            </Box>

            {/* Destinataire principal */}
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip
                label={studentName}
                color="primary"
                sx={{ minWidth: '150px' }}
              />
              <TextField
                size="small"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                fullWidth
                placeholder="Email du destinataire principal"
              />
            </Box>
          </Box>

          {/* Timeline de progression */}
          {showStatus && (
            <Box sx={{ mt: 3, mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Statut d'envoi
              </Typography>
              <Timeline position="right">
                <TimelineItem>
                  <TimelineSeparator>
                    <TimelineDot
                      color={sending ? 'primary' : (success ? 'success' : 'grey')}
                    />
                    <TimelineConnector />
                  </TimelineSeparator>
                  <TimelineContent>
                    <Typography variant="body2">
                      {studentName}
                      {sending && ' (en cours...)'}
                      {success && ' ✓'}
                    </Typography>
                  </TimelineContent>
                </TimelineItem>
              </Timeline>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="inherit">Annuler</Button>
          <Button 
            onClick={handleSend} 
            variant="contained" 
            color="primary" 
            disabled={sending || !emailSubject.trim() || !emailTo.trim()}
            startIcon={sending ? <CircularProgress size={20} /> : <EmailIcon />}
          >
            {sending ? 'Envoi en cours...' : 'Envoyer'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
