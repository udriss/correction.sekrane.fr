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
import StudentPasswordManager from './StudentPasswordManager';
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
  
  // État pour stocker les mots de passe des étudiants
  const [studentPasswords, setStudentPasswords] = useState<Record<number, string>>({});
  const [isLoadingPasswords, setIsLoadingPasswords] = useState(false);
  
  // État pour le gestionnaire de mots de passe
  const [showPasswordManagerDialog, setShowPasswordManagerDialog] = useState(false);
  const [studentsWithoutPassword, setStudentsWithoutPassword] = useState<Student[]>([]);

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
    
    // Récupérer le mot de passe de l'étudiant depuis l'état, ou utiliser un placeholder si non disponible
    const accessCode = typeof studentId === 'number' && studentPasswords[studentId] 
      ? studentPasswords[studentId] 
      : '{{mot_de_passe_accès}}';
    
    // Construction du template de l'email
    const template = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <p>Bonjour ${studentName},</p>

      <p>Ci-dessous se trouve le lien permettant d'accéder à l'ensemble de tes corrections :</p>
      
      <p><a href="${url}"> ${url} </a></p>

      <div style="margin: 15px 0; padding: 15px; border-left: 4px solid #FFD700; background-color: #FFFDF0;">
        <p style="margin-top: 0; font-weight: bold;">💡 À propos de votre accès :</p>
        <p>Votre code d'accès personnel est : <strong style="font-size: 1.2em; font-family: monospace; background-color: #f0f0f0; padding: 3px 8px; border-radius: 4px; display: inline-block;">${accessCode}</strong></p>
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

  // Gestion du changement d'onglet (type de message)
  const handleTabChange = (_: React.SyntheticEvent, newValue: typeof MESSAGE_TYPES.PREDEFINED | typeof MESSAGE_TYPES.CUSTOM) => {
    setMessageType(newValue);
    if (newValue === MESSAGE_TYPES.CUSTOM && editor) {
      // Générer un template générique avec des placeholders au lieu d'utiliser les données du premier étudiant
      const templateHtml = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <p>Bonjour {{studentName}},</p>

        <p>Ci-dessous se trouve le lien permettant d'accéder à l'ensemble de tes corrections :</p>
        
        <p><a href="{{correctionUrl}}"> {{correctionUrl}} </a></p>

        <div style="margin: 15px 0; padding: 15px; border-left: 4px solid #FFD700; background-color: #FFFDF0;">
          <p style="margin-top: 0; font-weight: bold;">💡 À propos de votre accès :</p>
          <p>Votre code d'accès personnel est : <strong style="font-size: 1.2em; font-family: monospace; background-color: #f0f0f0; padding: 3px 8px; border-radius: 4px; display: inline-block;">{{mot_de_passe_accès}}</strong></p>
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
      
      editor.commands.setContent(templateHtml);
      setCustomMessage(templateHtml);
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
        // Récupérer le mot de passe de l'étudiant
        const password = typeof studentId === 'number' && studentPasswords[studentId] 
          ? studentPasswords[studentId] 
          : '';
        
        // Générer le message personnalisé pour cet étudiant
        let messageToSend = messageType === MESSAGE_TYPES.PREDEFINED 
          ? generateEmailContent(student.first_name || '', student.id || 0)
          : {
              text: customMessage.replace(/<[^>]*>/g, ''),
              html: customMessage
                .replace(/{{studentName}}/g, student.first_name || '')
                .replace(/{{correctionUrl}}/g, `${window.location.origin}/students/${student.id}/corrections`)
            };
        
        // Remplacer le placeholder du mot de passe si présent
        if (password) {
          // Remplacer dans le contenu HTML
          messageToSend.html = messageToSend.html.replace(/{{mot_de_passe_accès}}/g, password);
          // Remplacer dans le contenu texte
          messageToSend.text = messageToSend.text.replace(/{{mot_de_passe_accès}}/g, password);
        } else {
          // Si l'étudiant n'a pas de mot de passe défini, afficher un message d'avertissement
          messageToSend.html = messageToSend.html.replace(
            /{{mot_de_passe_accès}}/g, 
            `<span style="color: #FF9800; font-style: italic">Aucun mot de passe défini</span>`
          );
          messageToSend.text = messageToSend.text.replace(
            /{{mot_de_passe_accès}}/g, 
            "Aucun mot de passe défini"
          );
        }

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

  // Fonction pour générer un mot de passe par défaut
  const generateDefaultPassword = (studentId: number): string => {
    return `${studentId}-${Math.random().toString(36).substring(2, 8)}`;
  };

  // Fonction pour récupérer les mots de passe des étudiants sélectionnés
  const fetchStudentPasswords = async () => {
    if (selectedStudents.length === 0) return;
    
    setIsLoadingPasswords(true);
    const passwordsObj: Record<number, string> = {};
    const studentsWithoutPasswordsList: Student[] = [];
    
    try {
      // Traiter chaque étudiant sélectionné séquentiellement
      for (const studentId of selectedStudents) {
        try {
          // Récupérer le mot de passe via l'API GET
          const response = await fetch(`/api/students/${studentId}/password?includeValue=true`);
          const data = await response.json();
          
          if (response.ok && data.hasPassword && data.passwordValue) {
            // Si l'étudiant a déjà un mot de passe, l'utiliser
            passwordsObj[studentId] = data.passwordValue;
          } else {
            // Si l'étudiant n'a pas de mot de passe, l'ajouter à la liste
            const student = students.find(s => s.id === studentId);
            if (student) {
              studentsWithoutPasswordsList.push(student);
            }
          }
        } catch (err) {
          console.error(`Erreur lors de la récupération du mot de passe pour l'étudiant ${studentId}:`, err);
        }
      }
      
      // Mettre à jour l'état avec tous les mots de passe récupérés
      setStudentPasswords(passwordsObj);
      
      // Si des étudiants n'ont pas de mot de passe, ouvrir le gestionnaire
      if (studentsWithoutPasswordsList.length > 0) {
        setStudentsWithoutPassword(studentsWithoutPasswordsList);
        setShowPasswordManagerDialog(true);
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des mots de passe:', err);
      setError('Erreur lors de la récupération des mots de passe');
    } finally {
      setIsLoadingPasswords(false);
    }
  };

  // Récupérer les mots de passe lorsque les étudiants sont sélectionnés
  useEffect(() => {
    if (selectedStudents.length > 0 && open) {
      fetchStudentPasswords();
    }
  }, [selectedStudents, open]);

  return (
    <>
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
                      'Bonjour <span style="color: red; font-weight: bold;">{{studentName}}</span>,'
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
                Informations :
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                gap: 1, 
                mt: 1, 
                p: 2, 
                bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', 
                borderRadius: 1,
                border: '1px solid',
                borderColor: theme => theme.palette.divider
              }}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      backgroundColor: theme => theme.palette.warning.main,
                      color: theme => theme.palette.warning.contrastText,
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}
                  >
                    i
                  </Box>
                  <Typography variant="body2" fontWeight="medium">
                    Ce message sera personnalisé pour chaque étudiant avec :
                  </Typography>
                </Box>
                <Box sx={{ pl: 4 }}>
                  <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                    <li>
                      <Typography variant="body2">
                        Son prénom et nom
                      </Typography>
                    </li>
                    <li>
                      <Typography variant="body2">
                        Le lien vers ses corrections
                      </Typography>
                    </li>
                    <li>
                      <Typography variant="body2">
                        Son mot de passe d'accès personnel
                      </Typography>
                    </li>
                  </ul>
                </Box>
              </Box>
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
              Variables disponibles :
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: 1, 
                mt: 1, 
                p: 2, 
                bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', 
                borderRadius: 1,
                border: '1px solid',
                borderColor: theme => theme.palette.divider
              }}>
                <Chip
                  label="{{studentName}}"
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ fontFamily: 'monospace' }}
                />
                <Chip
                  label="{{correctionUrl}}"
                  size="small"
                  color="secondary" 
                  variant="outlined"
                  sx={{ fontFamily: 'monospace' }}
                />
                <Chip
                  label="{{mot_de_passe_accès}}"
                  size="small"
                  color="success"
                  variant="outlined" 
                  sx={{ fontFamily: 'monospace' }}
                />
                <Box sx={{ width: '100%', mt: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Ces variables seront automatiquement remplacées par les données de chaque étudiant lors de l'envoi des emails.
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
          
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

      {/* Ajouter le gestionnaire de mots de passe */}
      {showPasswordManagerDialog && (
        <StudentPasswordManager
          open={showPasswordManagerDialog}
          onClose={() => {
            setShowPasswordManagerDialog(false);
            // Après fermeture du dialogue, on essaie de récupérer à nouveau les mots de passe
            fetchStudentPasswords();
          }}
          students={studentsWithoutPassword}
          context={studentsWithoutPassword.length === 1 ? "single" : "multiple"}
          studentId={studentsWithoutPassword.length === 1 ? studentsWithoutPassword[0]?.id : undefined}
          classId={classId}
          title={studentsWithoutPassword.length === 1 
            ? "Définir un mot de passe pour l'étudiant" 
            : `Définir des mots de passe pour ${studentsWithoutPassword.length} étudiants`}
        />
      )}
    </>
  );
}