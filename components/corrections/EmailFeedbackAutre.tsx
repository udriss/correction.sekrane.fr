import React, { useState, useEffect } from 'react';
import { 
  Button,
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
  CircularProgress
} from '@mui/material';
import { EmailOutlined } from '@mui/icons-material';
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
  status: 'pending' | 'processing' | 'success' | 'error';
  correctionId?: string;
  error?: string;
}

interface EmailFeedbackAutreProps {
  correctionId: string;
  student: Student | null;
  points_earned?: number[];
  activityName?: string;
  activity_parts_names?: string[];
  activity_points?: number[];
  penalty?: string;
}

export default function EmailFeedbackAutre({
  correctionId,
  student,
  points_earned = [],
  activityName = '',
  activity_parts_names = [],
  activity_points = [],
  penalty
}: EmailFeedbackAutreProps) {
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [emailSubject, setEmailSubject] = useState(`${activityName}, correction`);
  const [emailTo, setEmailTo] = useState('');
  const [messageType, setMessageType] = useState<0 | 1>(MESSAGE_TYPES.PREDEFINED);
  const [customMessage, setCustomMessage] = useState('');
  const [shareUrl, setShareUrl] = useState<string>('');
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

  // Calculate total points
  const totalPointsEarned = points_earned.reduce((sum, points) => sum + points, 0);
  const totalPossiblePoints = activity_points.reduce((sum, points) => sum + points, 0);
  
  // Calculate percentage and final grade
  const percentage = totalPossiblePoints > 0 ? (totalPointsEarned / totalPossiblePoints) * 100 : 0;
  const finalGrade = penalty ? Math.max(0, totalPointsEarned - parseFloat(penalty)) : totalPointsEarned;

  // Initialiser l'email du destinataire quand student change
  useEffect(() => {
    if (student && student.email) {
      setEmailTo(student.email);
    }
  }, [student]);

  // Initialiser l'objet de l'email avec le nom de l'activité
  useEffect(() => {
    if (activityName) {
      setEmailSubject(`${activityName}, correction`);
    }
  }, [activityName]);

  // Fonction pour récupérer ou créer le code de partage
  const fetchShareCode = async () => {
    try {
      const response = await fetch(`/api/corrections_autres/${correctionId}/share-code`);
      if (!response.ok) throw new Error('Erreur lors de la récupération du code de partage');
      const data = await response.json();
      const baseUrl = window.location.origin;
      return `${baseUrl}/feedback/${data.code}`;
    } catch (error) {
      console.error('Erreur lors de la récupération du code de partage:', error);
      setError('Impossible de générer le lien de partage');
      return '';
    }
  };

  // Fonction pour ouvrir le dialogue
  const handleOpen = async () => {
    setOpen(true);
    setSuccess(false);
    setError('');
    const url = await fetchShareCode();
    setShareUrl(url);
  };

  // Fonction pour fermer le dialogue
  const handleClose = () => {
    setOpen(false);
  };

  // Génération du contenu de l'email
  const generateEmailContent = (studentName: string, url: string) => {
    // Utiliser la formule de salutation appropriée selon le genre
    const salutation = 'Bonjour';
    // if (student) {
    //   if (student.gender === 'M') salutation = 'Cher';
    //   else if (student.gender === 'F') salutation = 'Chère';
    // }
    
    const fullStudentName = student 
      ? `${salutation} ${student.first_name} ${student.last_name}`
      : 'Bonjour,';

    // Déterminer le texte d'explication de la pénalité en fonction des valeurs
    let penaltyExplanation = '';
    
    if (penalty && parseFloat(penalty) > 0) {
      const penaltyValue = parseFloat(penalty);
      
      if (totalPointsEarned >= 5) {
        const calculatedGrade = totalPointsEarned - penaltyValue;
        if (calculatedGrade < 5) {
          penaltyExplanation = `
          <div style="margin: 15px 0; padding: 15px; border-left: 4px solid #FFD700; background-color: #FFFDF0;">
            <p style="margin-top: 0; font-weight: bold;">💡 À propos de votre note :</p>
            <p>Sans pénalité, votre note brute aurait été de <strong>${totalPointsEarned.toFixed(1)}/20</strong>.</p>
            <p>Une pénalité de <strong>${penaltyValue} points</strong> a été appliquée, ce qui aurait normalement donné une note de <strong>${calculatedGrade.toFixed(1)}/20</strong>.</p>
            <p>Cependant, pour les notes ≥ 5/20, nous appliquons un seuil minimum de 5/20 après pénalité. <strong>Votre note finale est donc de 5/20</strong>.</p>
          </div>`;
        } else {
          penaltyExplanation = `
          <div style="margin: 15px 0; padding: 15px; border-left: 4px solid #FFD700; background-color: #FFFDF0;">
            <p style="margin-top: 0; font-weight: bold;">💡 À propos de votre note :</p>
            <p>Sans pénalité, votre note brute aurait été de <strong>${totalPointsEarned.toFixed(1)}/20</strong>.</p>
            <p>Une pénalité de <strong>${penaltyValue} points</strong> a été appliquée, donnant une note finale de <strong>${finalGrade.toFixed(1)}/20</strong>.</p>
            <p>Pour rappel, si la pénalité avait fait descendre votre note en dessous de 5/20, vous auriez bénéficié du seuil minimum de 5/20.</p>
          </div>`;
        }
      } else {
        penaltyExplanation = `
        <div style="margin: 15px 0; padding: 15px; border-left: 4px solid #FFD700; background-color: #FFFDF0;">
          <p style="margin-top: 0; font-weight: bold;">💡 À propos de votre note :</p>
          <p>Votre note brute est de <strong>${totalPointsEarned.toFixed(1)}/20</strong>, ce qui est inférieur au seuil de 5/20.</p>
          <p>La pénalité de <strong>${penaltyValue} points</strong> n'a donc pas été appliquée, conformément à nos règles qui préservent les notes inférieures à 5/20.</p>
        </div>`;
      }
    }

    // Construction du template de l'email
    const template = `
<div style="font-family: Arial, sans-serif; line-height: 1.6;">
  <p>${fullStudentName},</p>

  <p>Je viens de terminer la correction de votre travail.<br>
  Vous pouvez la consulter en cliquant sur le lien suivant :</p>
  
  <p><a href="${url}">${url}</a></p>

  ${penaltyExplanation}

  <p><strong>Points importants à retenir :</strong></p>
  <ul>
    <li>prenez le temps de lire attentivement tous les commentaires</li>
    <li>n'hésitez pas à me contacter si vous avez des questions</li>
    <li>gardez ce lien, il vous permettra de consulter la correction à tout moment</li>
  </ul>

  <p>Je reste à votre disposition pour toute question ou clarification.</p>

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
    if (newValue === MESSAGE_TYPES.CUSTOM && editor && shareUrl) {
      const defaultMessage = generateEmailContent(student?.first_name || '', shareUrl);
      editor.commands.setContent(defaultMessage.html);
      setCustomMessage(defaultMessage.html);
    }
  };

  // Initialiser l'éditeur avec le message par défaut quand shareUrl est disponible
  useEffect(() => {
    if (editor && shareUrl && messageType === MESSAGE_TYPES.CUSTOM) {
      const defaultMessage = generateEmailContent(student?.first_name || '', shareUrl);
      editor.commands.setContent(defaultMessage.html);
      // On ne met pas à jour setCustomMessage ici pour éviter la boucle infinie
    }
  }, [editor, shareUrl, messageType, student]);  // Retirer generateEmailContent des dépendances

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
        status: 'processing'
      };
      setSendingStatuses([initialStatus]);
    }
    
    try {
      const messageToSend = messageType === MESSAGE_TYPES.PREDEFINED 
        ? generateEmailContent(student?.first_name || '', shareUrl)
        : {
            text: customMessage.replace(/<[^>]*>/g, ''),
            html: customMessage
          };

      // S'assurer d'utiliser l'adresse email saisie par l'utilisateur
      const targetEmail = emailTo.trim();

      const response = await fetch('/api/corrections_autres/send-feedback-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: targetEmail,
          correctionId,
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
            ? { ...s, status: 'success', correctionId } 
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
      <Button
        variant="outlined"
        color="success"
        startIcon={<EmailOutlined />}
        onClick={handleOpen}
        size="small"
      >
        Envoyer la correction
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          Envoyer un email de feedback
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
                <div dangerouslySetInnerHTML={{ __html: generateEmailContent(student?.first_name || '', shareUrl).html }} />
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
              InputProps={{
                readOnly: true,
                style: { fontFamily: 'monospace' }
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