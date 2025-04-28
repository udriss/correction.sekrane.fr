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
import StudentPasswordManager from '@/components/students/StudentPasswordManager';

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
  const [studentPassword, setStudentPassword] = useState<string | null>(null);
  const [isLoadingPassword, setIsLoadingPassword] = useState<boolean>(false);
  const [showPasswordManagerDialog, setShowPasswordManagerDialog] = useState<boolean>(false);

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

  <div style="margin: 15px 0; padding: 15px; border-left: 4px solid #FFD700; background-color: #FFFDF0;">
    <p style="margin-top: 0; font-weight: bold;">💡 À propos de votre accès :</p>
    <p>Votre code d'accès personnel est : <strong style="font-size: 1.2em; font-family: monospace; background-color: #f0f0f0; padding: 3px 8px; border-radius: 4px; display: inline-block;">${studentPassword || 'En cours de génération...'}</strong></p>
    <p>Conservez-le précieusement pour accéder à vos corrections à tout moment.</p>
  </div>

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

  // Fonction pour récupérer le mot de passe de l'étudiant
  const fetchStudentPassword = async (forceCheck = false) => {
    if (!student || !student.id) return;
    
    // Si le mot de passe a déjà été récupéré avec succès, ne pas le récupérer à nouveau
    // sauf si forceCheck est true
    if (studentPassword && !forceCheck) return;
    
    setIsLoadingPassword(true);
    setError(''); // Réinitialiser les erreurs avant chaque tentative
    
    try {
      // Récupérer le mot de passe via l'API GET
      const response = await fetch(`/api/students/${student.id}/password?includeValue=true`);
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération du mot de passe');
      }
      
      const data = await response.json();
      
      if (data.hasPassword && data.passwordValue) {
        // Si l'étudiant a déjà un mot de passe, l'utiliser
        setStudentPassword(data.passwordValue);
        // S'assurer que le dialogue est fermé
        setShowPasswordManagerDialog(false);
      } else {
        // Si l'étudiant n'a pas de mot de passe, ouvrir le gestionnaire de mots de passe
        // mais seulement si le dialogue d'email est ouvert
        if (open) {
          setShowPasswordManagerDialog(true);
          setStudentPassword(null);
        }
      }
    } catch (err) {
      console.error('Erreur lors de la récupération du mot de passe:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la récupération du mot de passe';
      setError(errorMessage);
      // Ne pas afficher le gestionnaire de mots de passe en cas d'erreur
      // pour éviter une boucle infinie
      setShowPasswordManagerDialog(false);
    } finally {
      setIsLoadingPassword(false);
    }
  };

  // Récupérer le mot de passe quand le dialogue s'ouvre
  useEffect(() => {
    if (open && student && student.id) {
      fetchStudentPassword();
    }
  }, [open, student]);

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
          Envoyer un lien vers la correction d'un étudiant
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

      {/* Ajouter le gestionnaire de mots de passe */}
      {showPasswordManagerDialog && (
        <StudentPasswordManager
          open={showPasswordManagerDialog}
          onClose={() => {
            setShowPasswordManagerDialog(false);
            // Après fermeture du dialogue, on essaie de récupérer à nouveau le mot de passe
            // mais uniquement si le mot de passe est toujours null
            if (!studentPassword) {
              fetchStudentPassword(true);
            }
          }}
          students={student ? [student] : []}
          context="single"
          studentId={student?.id}
          title="Définir un mot de passe pour l'étudiant"
        />
      )}
    </>
  );
}