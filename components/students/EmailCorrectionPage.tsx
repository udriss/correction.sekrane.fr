import React, { useState, useEffect } from 'react';
import { 
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  Box,
  Paper,
  TextField,
  Alert,
  Tabs,
  Tab,
  CircularProgress,
  Button,
  Tooltip,
  Checkbox,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Chip
} from '@mui/material';
import { 
  EmailOutlined, 
  Share, 
  MarkEmailRead, 
  Warning, 
  CheckCircle,
  Person,
  PersonOutline,
  FilterList
} from '@mui/icons-material';
import { Student } from '@/lib/types';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TipTapEditor from '@/components/editor/TipTapEditor';
import { Timeline, TimelineItem, TimelineSeparator, TimelineConnector, TimelineContent, TimelineDot } from '@mui/lab';

// Définir les types de messages
const MESSAGE_TYPES = {
  PREDEFINED: 0,
  CUSTOM: 1
} as const;

// Interface pour le statut d'envoi
interface SendingStatus {
  studentId: number;
  studentName: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  error?: string;
}

interface EmailCorrectionPageProps {
  student: Student;
}

export default function EmailCorrectionPage({ student }: EmailCorrectionPageProps) {
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [emailSubject, setEmailSubject] = useState(`Accès à toutes vos corrections`);
  const [emailTo, setEmailTo] = useState('');
  const [messageType, setMessageType] = useState<0 | 1>(MESSAGE_TYPES.PREDEFINED);
  const [customMessage, setCustomMessage] = useState('');
  const [correctionsUrl, setCorrectionsUrl] = useState<string>('');
  const [showHTML, setShowHTML] = useState(false);
  const [sendingStatuses, setSendingStatuses] = useState<SendingStatus[]>([]);

  // Editor pour le message personnalisé
  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    onUpdate: ({ editor }) => {
      setCustomMessage(editor.getHTML());
    },
    immediatelyRender: false
  });

  // Initialiser l'email du destinataire quand student change
  useEffect(() => {
    if (student && student.email) {
      setEmailTo(student.email);
    }
  }, [student]);

  // Construire l'URL des corrections
  useEffect(() => {
    if (student) {
      const baseUrl = window.location.origin;
      const url = `${baseUrl}/students/${student.id}/corrections`;
      setCorrectionsUrl(url);
    }
  }, [student]);

  // Fonction pour ouvrir le dialogue
  const handleOpen = () => {
    setOpen(true);
    setSuccess(false);
    setError('');
  };

  // Fonction pour fermer le dialogue
  const handleClose = () => {
    setOpen(false);
  };

  // Génération du contenu de l'email
  const generateEmailContent = (studentName: string, url: string) => {
    // Utiliser la formule de salutation appropriée selon le genre
    const salutation = 'Bonjour';
    
    const fullStudentName = student 
      ? `${salutation} ${student.first_name} ${student.last_name}`
      : 'Bonjour,';

    // Construction du template de l'email
    const template = `
<div style="font-family: Arial, sans-serif; line-height: 1.6;">
  <p>${fullStudentName},</p>

  <p>Ci-dessous se trouve le lien permettant d'accéder à l'ensemble de tes corrections :</p>
  
  <p><a href="${url}">${url}</a></p>

  <p><strong>Points importants à retenir :</strong></p>
  <ul>
    <li>ce lien donne accès à toutes tes corrections</li>
    <li>tu peux y accéder à tout moment</li>
    <li>n'hésite pas à me contacter si tu as des questions</li>
  </ul>

  <p>Je reste à disponible pour toute question ou clarification sur ces corrections.</p>

  <p>Cordialement,<br>
  M. I. SEKRANE</p>
</div>`;

    return {
      text: template.replace(/<[^>]*>/g, ''),
      html: template
    };
  };

  // Gestion du changement d'onglet
  const handleTabChange = (_: React.SyntheticEvent, newValue: typeof MESSAGE_TYPES.PREDEFINED | typeof MESSAGE_TYPES.CUSTOM) => {
    setMessageType(newValue);
    if (newValue === MESSAGE_TYPES.CUSTOM && editor && correctionsUrl) {
      const defaultMessage = generateEmailContent(student?.first_name || '', correctionsUrl);
      editor.commands.setContent(defaultMessage.html);
      setCustomMessage(defaultMessage.html);
    }
  };

  // Initialiser l'éditeur avec le message par défaut quand l'URL des corrections est disponible
  useEffect(() => {
    if (editor && correctionsUrl && messageType === MESSAGE_TYPES.CUSTOM) {
      const defaultMessage = generateEmailContent(student?.first_name || '', correctionsUrl);
      editor.commands.setContent(defaultMessage.html);
      // On ne met pas à jour setCustomMessage ici pour éviter la boucle infinie
    }
  }, [editor, correctionsUrl, messageType, student]);

  // Fonction pour effacer l'éditeur
  const handleClearEditor = () => {
    if (editor) {
      editor.commands.clearContent();
      setCustomMessage('');
    }
  };

  // Fonction pour afficher le HTML
  const handleShowHTML = () => {
    if (editor) {
      setShowHTML(true);
    }
  };

  // Fonction pour envoyer l'email
  const handleSend = async () => {
    if (!emailTo) {
      setError('Veuillez spécifier une adresse email');
      return;
    }

    setSending(true);
    setError('');
    
    // Initialiser l'état des statuts d'envoi pour afficher la Timeline
    // même pour un seul destinataire
    if (student) {
      const initialStatus: SendingStatus = { 
        studentId: student.id, 
        studentName: `${student.first_name} ${student.last_name}`,
        status: 'processing'
      };
      setSendingStatuses([initialStatus]);
    }
    
    try {
      const messageToSend = messageType === MESSAGE_TYPES.PREDEFINED 
        ? generateEmailContent(student?.first_name || '', correctionsUrl)
        : {
            text: customMessage.replace(/<[^>]*>/g, ''),
            html: customMessage
          };

      // S'assurer d'utiliser l'adresse email saisie par l'utilisateur
      const targetEmail = emailTo.trim();

      const response = await fetch('/api/students/send-corrections-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: targetEmail,
          studentId: student.id,
          studentName: student ? `${student.first_name || ''} ${student.last_name || ''}`.trim() : 'l\'étudiant',
          customMessage: messageToSend.text,
          htmlMessage: messageToSend.html,
          subject: emailSubject
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.message || 'Erreur lors de l\'envoi de l\'email';
        if (errorData.details) {
          throw new Error(`${errorMessage} - Détails: ${errorData.details}`);
        } else {
          throw new Error(errorMessage);
        }
      }
      
      // Mettre à jour le statut d'envoi pour l'afficher dans la Timeline
      if (student) {
        setSendingStatuses(prev => prev.map(s => 
          s.studentId === student.id 
            ? { ...s, status: 'success' } 
            : s
        ));
      }
      
      setSuccess(true);
      // Ne pas réinitialiser les champs pour permettre de renvoyer
    } catch (err) {
      console.error('Error sending email:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      
      // Mettre à jour le statut d'erreur pour l'afficher dans la Timeline
      if (student) {
        setSendingStatuses(prev => prev.map(s => 
          s.studentId === student.id 
            ? { ...s, status: 'error', error: err instanceof Error ? err.message : 'Erreur inconnue' } 
            : s
        ));
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Tooltip title="Envoyer les corrections par email">
        <IconButton
          color="primary"
          onClick={handleOpen}
          size="small"
        >
          <EmailOutlined />
        </IconButton>
      </Tooltip>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          Envoyer un lien vers les corrections
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
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>Email envoyé avec succès!</Alert>}
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="body2" sx={{ mr: 1 }}>
              Destinataire par défaut:
            </Typography>
            <Typography variant="body2" color="primary" fontWeight="medium">
              {student?.email || 'Non disponible'}
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
          
          {/* Affichage conditionnel selon le type de message */}
          {messageType === MESSAGE_TYPES.PREDEFINED ? (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Aperçu du message prédéfini
              </Typography>
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 2,
                  mb: 2,
                  maxHeight: '400px',
                  overflow: 'auto'
                }}
              >
                <div dangerouslySetInnerHTML={{ __html: generateEmailContent(student?.first_name || '', correctionsUrl).html }} />
              </Paper>
            </Box>
          ) : (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Message personnalisé
              </Typography>
              <TipTapEditor 
                editor={editor}
                onClear={handleClearEditor}
                onShowHTML={handleShowHTML}
              />
            </Box>
          )}
          
          {/* Timeline de progression */}
          {sendingStatuses.length > 0 && (
            <Box sx={{ mt: 3, mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Statut d'envoi
              </Typography>
              <Timeline position="right">
                {sendingStatuses.map((status) => {
                  return (
                    <TimelineItem key={`${status.studentId}-${status.status}-timeline`}>
                      <TimelineSeparator>
                        <TimelineDot
                          color={
                            status.status === 'success' ? 'success' :
                            status.status === 'error' ? 'error' :
                            status.status === 'processing' ? 'primary' :
                            'grey'
                          }
                        />
                        <TimelineConnector />
                      </TimelineSeparator>
                      <TimelineContent>
                        <Typography variant="body2">
                          {student ? `${student.first_name} ${student.last_name}` : 'Étudiant inconnu'}
                          {status.status === 'processing' && ' (en cours...)'}
                          {status.status === 'success' && ' ✓'}
                          {status.status === 'error' && ` - ${status.error}`}
                        </Typography>
                      </TimelineContent>
                    </TimelineItem>
                  );
                })}
              </Timeline>
            </Box>
          )}
        </DialogContent>

        {/* Dialog pour afficher le HTML */}
        <Dialog
          open={showHTML}
          onClose={() => setShowHTML(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Code HTML</DialogTitle>
          <DialogContent>
            <TextField
              multiline
              fullWidth
              rows={10}
              value={editor?.getHTML() || ''}
              slotProps={{
                input: {
                  readOnly: true,
                  style: { fontFamily: 'monospace' }
                }
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowHTML(false)}>
              Fermer
            </Button>
          </DialogActions>
        </Dialog>

        <DialogActions>
          <Button onClick={handleClose} color="inherit">Annuler</Button>
          <Button 
            onClick={handleSend} 
            variant="contained" 
            color="primary" 
            disabled={sending || !emailSubject.trim() || !emailTo.trim()}
            startIcon={sending ? <CircularProgress size={20} /> : <EmailOutlined />}
          >
            {sending ? 'Envoi en cours...' : 'Envoyer'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}