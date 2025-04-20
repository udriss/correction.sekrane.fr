import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Alert,
  Tabs,
  Tab,
  Paper,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ListItemText,
  Checkbox,
  OutlinedInput,
  SelectChangeEvent,
  LinearProgress,
  Chip
} from '@mui/material';
import { 
  EmailOutlined, 
  Send,
  CheckCircle,
  Warning,
  FilterList
} from '@mui/icons-material';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TipTapEditor from '@/components/editor/TipTapEditor';
import { Student } from '@/lib/types';
import { CircularProgress } from '@mui/material';
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

interface BulkEmailDialogProps {
  open: boolean;
  onClose: () => void;
  students: Student[];
  classId: number;
  classSubgroups?: number;
}

export default function BulkEmailDialog({ open, onClose, students, classId, classSubgroups = 0 }: BulkEmailDialogProps) {
  // États pour le dialogue
  const [messageType, setMessageType] = useState<0 | 1>(MESSAGE_TYPES.PREDEFINED);
  const [emailSubject, setEmailSubject] = useState('Accès à vos corrections');
  const [customMessage, setCustomMessage] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [selectedSubgroup, setSelectedSubgroup] = useState<string>('all');
  const [filteredStudents, setFilteredStudents] = useState<Student[]>(students);
  const [showHTML, setShowHTML] = useState(false);
  
  // États pour l'envoi
  const [sending, setSending] = useState(false);
  const [sendingStatuses, setSendingStatuses] = useState<SendingStatus[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<{
    total: number;
    sent: number;
    failed: number;
  } | null>(null);

  // Editor pour le message personnalisé
  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    onUpdate: ({ editor }) => {
      setCustomMessage(editor.getHTML());
    },
    immediatelyRender: false
  });

  // Générer les sous-groupes disponibles dans la classe
  const availableSubgroups = React.useMemo(() => {
    if (!classSubgroups || classSubgroups <= 0) return [];
    
    return Array.from(
      { length: classSubgroups },
      (_, i) => ({
        id: (i + 1).toString(),
        name: `Groupe ${i + 1}`
      })
    );
  }, [classSubgroups]);

  // Remettre à zéro les états lors de l'ouverture du dialogue
  useEffect(() => {
    if (open) {
      setSelectedStudents([]);
      setSelectedSubgroup('all');
      setFilteredStudents(students);
      setSendingStatuses([]);
      setError(null);
      setSummary(null);
      setSending(false);
    }
  }, [open, students]);

  // Filtrer les étudiants selon le sous-groupe sélectionné
  useEffect(() => {
    if (selectedSubgroup === 'all') {
      setFilteredStudents(students);
    } else {
      setFilteredStudents(
        students.filter(student => 
          student.sub_class?.toString() === selectedSubgroup
        )
      );
    }
  }, [selectedSubgroup, students]);

  // Générer le contenu de l'email avec URL personnalisée pour chaque étudiant
  const generateEmailContent = (studentName: string, studentId: number | string) => {
    // Construire l'URL des corrections
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/students/${studentId}/corrections`;
    
    // Construction du template de l'email
    const template = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <p>Bonjour ${studentName},</p>

      <p>Ci-dessous se trouve le lien permettant d'accéder à l'ensemble de tes corrections :</p>
      
      <p><a href="${url}"> ${url} </a></p>

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

  // Gestion du changement d'onglet (type de message)
  const handleTabChange = (_: React.SyntheticEvent, newValue: typeof MESSAGE_TYPES.PREDEFINED | typeof MESSAGE_TYPES.CUSTOM) => {
    setMessageType(newValue);
    if (newValue === MESSAGE_TYPES.CUSTOM && editor) {
      // Exemple de message par défaut avec un étudiant quelconque pour l'aperçu
      const exampleStudent = students.length > 0 ? students[0] : null;
      if (exampleStudent) {
        const defaultMessage = generateEmailContent(exampleStudent.first_name || '', exampleStudent.id || 0);
        editor.commands.setContent(defaultMessage.html);
        setCustomMessage(defaultMessage.html);
      }
    }
  };

  // Gestion du changement de sous-groupe
  const handleSubgroupChange = (event: SelectChangeEvent<string>) => {
    setSelectedSubgroup(event.target.value);
    // Réinitialiser la sélection d'étudiants
    setSelectedStudents([]);
  };

  // Gestion de la sélection des étudiants
  const handleStudentSelectionChange = (event: SelectChangeEvent<number[]>) => {
    const value = event.target.value as number[];
    setSelectedStudents(value);
  };

  // Sélectionner tous les étudiants filtrés
  const handleSelectAllStudents = (event: React.MouseEvent<HTMLLIElement | HTMLElement>) => {
    // Arrêter la propagation pour éviter que le MenuItem ne soit considéré comme une valeur sélectionnée
    event.stopPropagation();
    
    if (selectedStudents.length === filteredStudents.length) {
      // Si tous sont déjà sélectionnés, on désélectionne tout
      setSelectedStudents([]);
    } else {
      // Sinon on sélectionne tous les étudiants filtrés
      // Filtrer les IDs null ou undefined
      const validStudentIds = filteredStudents
        .map(student => student.id)
        .filter((id): id is number => id !== null && id !== undefined);
      
      setSelectedStudents(validStudentIds);
    }
  };

  // Fonctions pour l'éditeur
  const handleClearEditor = () => {
    if (editor) {
      editor.commands.clearContent();
      setCustomMessage('');
    }
  };

  const handleShowHTML = () => {
    if (editor) {
      setShowHTML(true);
    }
  };

  // Fonction pour envoyer les emails
  const handleSendEmails = async () => {
    if (selectedStudents.length === 0) {
      setError('Veuillez sélectionner au moins un étudiant');
      return;
    }

    setSending(true);
    setError(null);
    setSummary(null);
    
    // Initialiser les statuts d'envoi
    const initialStatuses = selectedStudents.map(id => {
      const student = students.find(s => s.id === id);
      return {
        studentId: id,
        studentName: student ? `${student.first_name} ${student.last_name}` : `Étudiant #${id}`,
        status: 'pending' as const
      };
    });
    
    setSendingStatuses(initialStatuses);
    
    // Compteurs pour le résumé
    let sentCount = 0;
    let failedCount = 0;
    
    // Envoyer les emails un par un pour pouvoir suivre la progression
    for (let i = 0; i < selectedStudents.length; i++) {
      const studentId = selectedStudents[i];
      const student = students.find(s => s.id === studentId);
      
      if (!student || !student.email) {
        // Mettre à jour le statut avec une erreur
        setSendingStatuses(prev => 
          prev.map(s => 
            s.studentId === studentId 
              ? { ...s, status: 'error', error: 'Email manquant' } 
              : s
          )
        );
        failedCount++;
        continue;
      }
      
      // Mettre à jour le statut comme étant en cours
      setSendingStatuses(prev => 
        prev.map(s => 
          s.studentId === studentId 
            ? { ...s, status: 'processing' } 
            : s
        )
      );
      
      try {
        // Générer le message personnalisé pour cet étudiant
        const messageToSend = messageType === MESSAGE_TYPES.PREDEFINED 
          ? generateEmailContent(student.first_name || '', student.id || 0)
          : {
              text: customMessage.replace(/<[^>]*>/g, ''),
              html: customMessage.replace(/{{studentName}}/, student.first_name || '')
                .replace(/{{correctionUrl}}/, `${window.location.origin}/students/${student.id}/corrections`)
            };

        // Envoyer l'email
        const response = await fetch('/api/students/send-corrections-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: student.email,
            studentId: student.id,
            studentName: `${student.first_name || ''} ${student.last_name || ''}`.trim(),
            customMessage: messageToSend.text,
            htmlMessage: messageToSend.html,
            subject: emailSubject
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Erreur lors de l\'envoi');
        }
        
        // Mettre à jour le statut comme réussi
        setSendingStatuses(prev => 
          prev.map(s => 
            s.studentId === studentId 
              ? { ...s, status: 'success' } 
              : s
          )
        );
        
        sentCount++;
      } catch (err) {
        console.error(`Erreur d'envoi pour l'étudiant ${studentId}:`, err);
        
        // Mettre à jour le statut avec l'erreur
        setSendingStatuses(prev => 
          prev.map(s => 
            s.studentId === studentId 
              ? { ...s, status: 'error', error: err instanceof Error ? err.message : 'Erreur inconnue' } 
              : s
          )
        );
        
        failedCount++;
      }
      
      // Petite pause pour éviter de surcharger le serveur
      await new Promise(r => setTimeout(r, 500));
    }
    
    // Mettre à jour le résumé
    setSummary({
      total: selectedStudents.length,
      sent: sentCount,
      failed: failedCount
    });
    
    setSending(false);
  };

  return (
    <Dialog
      open={open}
      onClose={!sending ? onClose : undefined}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center">
          <EmailOutlined sx={{ mr: 1 }} />
          <Typography variant="h6">Envoyer les corrections par email</Typography>
        </Box>
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
        {/* Affichage des erreurs */}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        {/* Récapitulatif après envoi */}
        {summary && (
          <Alert 
            severity={summary.failed > 0 ? "warning" : "success"} 
            sx={{ mb: 2 }}
          >
            <Typography variant="subtitle2">
              Envoi terminé : {summary.sent} emails envoyés, {summary.failed} échecs sur un total de {summary.total} étudiants
            </Typography>
          </Alert>
        )}
        
        {/* Section de sélection des étudiants */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Sélection des destinataires
          </Typography>
          
          {/* Filtre par sous-groupe si disponible */}
          {availableSubgroups.length > 0 && (
            <FormControl fullWidth margin="normal" sx={{ mb: 2 }}>
              <InputLabel id="subgroup-select-label">
                <FilterList fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                Filtrer par groupe
              </InputLabel>
              <Select
                labelId="subgroup-select-label"
                value={selectedSubgroup}
                onChange={handleSubgroupChange}
                label="Filtrer par groupe"
                disabled={sending}
              >
                <MenuItem value="all">Tous les groupes</MenuItem>
                {availableSubgroups.map(subgroup => (
                  <MenuItem key={subgroup.id} value={subgroup.id}>
                    {subgroup.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          
          {/* Sélection des étudiants */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="students-select-label">Étudiants</InputLabel>
            <Select
              labelId="students-select-label"
              multiple
              value={selectedStudents}
              onChange={handleStudentSelectionChange}
              input={<OutlinedInput label="Étudiants" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, maxHeight: '80px', overflow: 'auto' }}>
                  {selected.map((id) => {
                    const student = students.find(s => s.id === id);
                    return (
                      <Chip 
                        key={id} 
                        label={student ? `${student.first_name} ${student.last_name}` : `#${id}`} 
                        size="small"
                      />
                    );
                  })}
                </Box>
              )}
              disabled={sending}
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 400  // Augmenté pour afficher plus d'étudiants
                  }
                },
                // Garde le bouton "Sélectionner tout" visible même en faisant défiler la liste
                anchorOrigin: {
                  vertical: 'bottom',
                  horizontal: 'left',
                },
                transformOrigin: {
                  vertical: 'top',
                  horizontal: 'left',
                }
              }}
            >
              <Box px={2} py={1} sx={{ 
                position: 'sticky', 
                top: 0, 
                backgroundColor: 'background.paper', 
                zIndex: 1,
                borderBottom: '1px solid',
                borderBottomColor: 'divider'
              }}>
                <Button
                  variant="outlined"
                  size="small"
                  fullWidth
                  onClick={(event) => {
                    event.stopPropagation();
                    handleSelectAllStudents(event);
                  }}
                  sx={{ mb: 1 }}
                >
                  {selectedStudents.length === filteredStudents.length 
                    ? "Désélectionner tout" 
                    : "Sélectionner tout"}
                </Button>
                <Typography variant="caption" color="text.secondary" display="block">
                  {filteredStudents.length} étudiants disponibles {
                    selectedSubgroup !== 'all' 
                      ? `(Groupe ${selectedSubgroup})` 
                      : ''
                  }
                </Typography>
              </Box>
              
              {filteredStudents.map((student) => (
                <MenuItem key={student.id} value={student.id}>
                  <Checkbox checked={selectedStudents.indexOf(student.id || 0) > -1} />
                  <ListItemText 
                    primary={`${student.first_name} ${student.last_name}`}
                    secondary={student.email || 'Pas d\'email'} 
                  />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Typography variant="body2" color="text.secondary">
            {selectedStudents.length} étudiants sélectionnés sur {filteredStudents.length} disponibles
          </Typography>
        </Box>
        
        {/* Section pour le sujet de l'email */}
        <TextField
          margin="normal"
          label="Objet de l'email"
          type="text"
          fullWidth
          value={emailSubject}
          onChange={(e) => setEmailSubject(e.target.value)}
          sx={{ mb: 3 }}
          required
          disabled={sending}
        />
        
        {/* Contenu de l'email selon le type sélectionné */}
        {messageType === MESSAGE_TYPES.PREDEFINED ? (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Aperçu du message prédéfini
            </Typography>
            <Paper 
              variant="outlined" 
              sx={{ 
                p: 2, 
                maxHeight: '300px', 
                overflow: 'auto' 
              }}
            >
              <div dangerouslySetInnerHTML={{ 
                __html: generateEmailContent(
                  "Prénom", 
                  0
                ).html
                  .replace(
                    /Bonjour Prénom,/g, 
                    'Bonjour <span style="color: red; font-weight: bold;">${studentName}</span>,'
                  )
                  // remplace la balise <a> par l'URL en texte avec l'ID en rouge
                  .replace(
                    /<a[^>]*>[^<]*<\/a>/g,
                    () =>
                        `https://correction.sekrane.fr/students/` +
                        `<span style="color: red; font-weight: bold;">{{studentId}}</span>` +
                        `/corrections`
                )
              }} />
            </Paper>
            <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            Note :
            <Box component="span" sx={{ 
              fontWeight: 'bold', 
              color: theme => theme.palette.warning.dark 
            }}>
            &nbsp;ce message sera personnalisé pour chaque étudiant avec son nom et le lien vers ses corrections.
            </Box>
            </Typography>
          </Box>
        ) : (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Message personnalisé
            </Typography>
            <TipTapEditor 
              editor={editor}
              onClear={handleClearEditor}
              onShowHTML={handleShowHTML}
              readOnly={sending}
            />
            <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            Astuce :
            <Box component="span" sx={{ 
              fontWeight: 'bold', 
              color: theme => theme.palette.warning.dark 
            }}>
            &nbsp;utilisez <code style={{ color: 'red' }}>{"{{studentName}}"}</code> pour le prénom de l'étudiant et <code style={{ color: 'red' }}>{"{{correctionUrl}}"}</code> pour le lien vers ses corrections.
            </Box>
            </Typography>
          </Box>
        )}
        
        {/* Dialogue pour afficher le code HTML */}
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
              rows={15}
              value={editor?.getHTML() || ''}
              slotProps={{
                input: {
                  readOnly: true,
                  style: { fontFamily: 'monospace', whiteSpace: 'pre' }
                }
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowHTML(false)}>Fermer</Button>
          </DialogActions>
        </Dialog>
        
        {/* Section de progression */}
        {sending && (
          <Box sx={{ width: '100%', mt: 2 }}>
            <LinearProgress
              variant="determinate"
              value={(sendingStatuses.filter(s => s.status !== 'pending').length / sendingStatuses.length) * 100}
              sx={{ mb: 1 }}
            />
            <Typography variant="body2" color="text.secondary" align="center">
              Progression: {sendingStatuses.filter(s => s.status !== 'pending').length} / {sendingStatuses.length}
            </Typography>
          </Box>
        )}
        
        {/* Liste des statuts d'envoi */}
        {sendingStatuses.length > 0 && (
          <Box sx={{ mt: 2, maxHeight: '200px', overflow: 'auto' }}>
            <Typography variant="subtitle2" gutterBottom>
              Statut détaillé des envois
            </Typography>
            <Paper variant="outlined" sx={{ p: 1 }}>
              {sendingStatuses.map((status) => (
                <Box 
                  key={status.studentId}
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    py: 0.5,
                    px: 1,
                    borderBottom: '1px solid',
                    borderBottomColor: 'divider',
                    '&:last-child': { borderBottom: 'none' }
                  }}
                >
                  {status.status === 'processing' && (
                    <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                      <CircularProgress size={16} />
                    </Box>
                  )}
                  {status.status === 'success' && (
                    <CheckCircle color="success" fontSize="small" sx={{ mr: 1 }} />
                  )}
                  {status.status === 'error' && (
                    <Warning color="error" fontSize="small" sx={{ mr: 1 }} />
                  )}
                  <Typography 
                    variant="body2"
                    sx={{ 
                      fontWeight: status.status === 'processing' ? 'bold' : 'normal',
                      color: status.status === 'error' ? 'error.main' : 'text.primary'
                    }}
                  >
                    {status.studentName}
                    {status.error && (
                      <Typography
                        component="span"
                        variant="caption"
                        color="error"
                        sx={{ ml: 1 }}
                      >
                        - {status.error}
                      </Typography>
                    )}
                  </Typography>
                </Box>
              ))}
            </Paper>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button 
          onClick={onClose} 
          color="inherit"
          disabled={sending}
        >
          Fermer
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={sending ? <CircularProgress size={20} color="inherit" /> : <Send />}
          onClick={handleSendEmails}
          disabled={sending || selectedStudents.length === 0 || !emailSubject.trim()}
        >
          {sending ? 'Envoi en cours...' : 'Envoyer les emails'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}