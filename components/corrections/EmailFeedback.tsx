import React, { useState, useEffect, useCallback } from 'react';
import { Button, TextField, Dialog, DialogActions, DialogContent, DialogTitle, Alert, CircularProgress, Box, Typography, Tabs, Tab, Chip, List, ListItem, ListItemText, IconButton, Select, MenuItem, FormControl, InputLabel, OutlinedInput } from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import GroupIcon from '@mui/icons-material/Group';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TipTapEditor from '@/components/editor/TipTapEditor';
import { Timeline, TimelineItem, TimelineSeparator, TimelineConnector, TimelineContent, TimelineDot } from '@mui/lab';
import SchoolIcon from '@mui/icons-material/School';

interface Student {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
}

interface GroupedStudent extends Student {
  classId?: number;
  className?: string;
}

interface StudentsByClass {
  [classId: number]: {
    className: string;
    students: GroupedStudent[];
  };
}

interface StudentData {
  first_name?: string;
  last_name?: string;
  email?: string;
}

interface EmailFeedbackProps { 
  correctionId: string;
  studentData?: StudentData;
}

const MESSAGE_TYPES = {
  PREDEFINED: 0,
  CUSTOM: 1
} as const;

interface SendingStatus {
  studentId: number;
  status: 'pending' | 'processing' | 'success' | 'error';
  correctionId?: string;
  error?: string;
}

interface Class {
  id: number;
  name: string;
}

interface AllStudents {
  [id: number]: {
    id: number;
    email: string | null;
    first_name: string;
    last_name: string;
    classes: Class[];
  }
}

export default function EmailFeedback({ 
  correctionId,
  studentData 
}: EmailFeedbackProps) {
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailTo, setEmailTo] = useState('');
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>('');
  const [messageType, setMessageType] = useState<0 | 1>(MESSAGE_TYPES.PREDEFINED);
  const [customMessage, setCustomMessage] = useState('');
  const [showHTML, setShowHTML] = useState(false);
  const [additionalStudents, setAdditionalStudents] = useState<Student[]>([]);
  const [sendingStatuses, setSendingStatuses] = useState<SendingStatus[]>([]);
  const [showAddStudents, setShowAddStudents] = useState(false);
  const [studentsByClass, setStudentsByClass] = useState<StudentsByClass>({});
  const [selectedClassIds, setSelectedClassIds] = useState<number[]>([]);
  const [availableClasses, setAvailableClasses] = useState<{id: number, name: string}[]>([]);
  const [allStudents, setAllStudents] = useState<AllStudents>({});

  // Ajouter un menu pour sélectionner des étudiants supplémentaires
  const [showStudentSelect, setShowStudentSelect] = useState(false);
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);

  // Ajouter un state pour suivre les clés uniques des éléments de la liste
  const [studentKeys] = useState<Map<number, string>>(new Map());

  // Modifier la fonction de génération de clé pour utiliser une Map persistante
  const getStudentKey = useCallback((studentId: number, context: string) => {
    if (!studentKeys.has(studentId)) {
      // Créer une nouvelle clé unique seulement si elle n'existe pas déjà
      studentKeys.set(studentId, `${context}-${studentId}-${crypto.randomUUID()}`);
    }
    return studentKeys.get(studentId)!;
  }, [studentKeys]);

  const editor = useEditor({
    extensions: [StarterKit],
    content: '', // On va le remplir lors de l'ouverture
    onUpdate: ({ editor }) => {
      setCustomMessage(editor.getHTML());
    },
    // Add immediatelyRender: false to fix SSR hydration warning
    immediatelyRender: false
  });

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


  // Mettre à jour le student quand studentData change
  useEffect(() => {
    if (studentData) {
      setStudent({
        id: 0, // ID par défaut car on n'en a pas besoin ici
        first_name: studentData.first_name || '',
        last_name: studentData.last_name || '',
        email: studentData.email || ''
      });
      setEmailTo(studentData.email || '');
    }
  }, [studentData]);

  // Récupérer les données de l'étudiant au chargement et lors des mises à jour
  useEffect(() => {
    const fetchStudentData = async () => {
      if (!correctionId) return;
      
      setLoading(true);
      try {
        const correctionResponse = await fetch(`/api/corrections/${correctionId}`);
        if (!correctionResponse.ok) {
          throw new Error('Erreur lors de la récupération de la correction');
        }
        
        const correctionData = await correctionResponse.json();
        
        // Définir le sujet de l'email avec activity_name depuis correctionData
        setEmailSubject(`Commentaires sur votre travail: ${correctionData.activity_name || 'Correction'}`);
        
        // Vérifier d'abord si les données student_data sont disponibles dans la correction
        if (correctionData.student_data) {
          setStudent(correctionData.student_data);
          setEmailTo(correctionData.student_data.email || '');
        } 
        // Sinon, utiliser l'ancienne méthode avec student_id
        else if (correctionData.student_id) {
          const studentId = correctionData.student_id;
          
          const studentResponse = await fetch(`/api/students/${studentId}`);
          if (!studentResponse.ok) {
            throw new Error('Erreur lors de la récupération des données de l\'étudiant');
          }
          
          const studentData = await studentResponse.json();
          setStudent(studentData);
          setEmailTo(studentData.email || '');
        } else {
          throw new Error('Aucun étudiant associé à cette correction');
        }
      } catch (err) {
        console.error('Erreur:', err);
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    };

    // Exécuter fetchStudentData seulement si studentData n'est pas fourni
    if (!studentData) {
      fetchStudentData();
    } else {
      // Dans ce cas, nous dvons faire un appel séparé pour obtenir activity_name
      const fetchActivityName = async () => {
        try {
          const correctionResponse = await fetch(`/api/corrections/${correctionId}`);
          if (correctionResponse.ok) {
            const correctionData = await correctionResponse.json();
            setEmailSubject(`${correctionData.activity_name}, correction` || `Correction et notes`);
          }
        } catch (error) {
          console.error('Erreur lors de la récupération du nom de l\'activité:', error);
        }
      };
      fetchActivityName();
    }
  }, [correctionId, studentData]);


  // Fonction pour récupérer ou créer le code de partage
  const fetchShareCode = async (targetCorrectionId: string) => {
    try {
      const response = await fetch(`/api/corrections/${targetCorrectionId}/share-code`);
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

  // Mise à jour de handleOpen pour utiliser l'ID de correction principal
  const handleOpen = async () => {
    setOpen(true);
    setSuccess(false);
    setError('');
    const url = await fetchShareCode(correctionId);
    setShareUrl(url);
  };


  // Fonction pour générer le message prédéfini avec HTML formatting
  const generateDefaultMessage = (studentName: string, url: string) => {
    const template = `
<div style="font-family: Arial, sans-serif; line-height: 1.6;">
  <p>Bonjour ${studentName},</p>

  <p>Je viens de terminer la correction de votre travail.<br>
  Vous pouvez la consulter en cliquant sur le lien suivant :</p>
  
  <p><a href="${url}">${url}</a></p>

  <p><strong>Points importants à retenir :</strong></p>
  <ul>
    <li>prenez le temps de lire attentivement tous les commentaires</li>
    <li>n'hésitez pas à me contacter si vous avez des questions</li>
    <li>gardez ce lien, il vous permettra de consulter la correction à tout moment</li>
  </ul>

  <p>Je reste à votre disposition pour toute question ou clarification.</p>

  <p>Bien cordialement,<br>
  <span style="font-family: monospace;">M. SEKRANE</span></p>
</div>`;

    return {
      text: template.replace(/<[^>]*>/g, ''),
      html: template
    };
  };

  // Construction du nom complet de l'étudiant avec meilleure gestion des cas spéciaux
  const fullStudentName = student 
    ? `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'l\'étudiant'
    : 'l\'étudiant';

  // Ajouter un effet pour initialiser le message par défaut quand l'éditeur est prêt
  useEffect(() => {
    if (editor && shareUrl && messageType === MESSAGE_TYPES.CUSTOM) {
      const defaultMessage = generateDefaultMessage(fullStudentName, shareUrl);
      editor.commands.setContent(defaultMessage.html);
      setCustomMessage(defaultMessage.html);
    }
  }, [editor, shareUrl, messageType, fullStudentName]);



  // Ajouter un effet pour réagir aux changements de tab
  const handleTabChange = (_: React.SyntheticEvent, newValue: typeof MESSAGE_TYPES.PREDEFINED | typeof MESSAGE_TYPES.CUSTOM) => {
    setMessageType(newValue);
    if (newValue === MESSAGE_TYPES.CUSTOM && editor && shareUrl) {
      const defaultMessage = generateDefaultMessage(fullStudentName, shareUrl);
      editor.commands.setContent(defaultMessage.html);
      setCustomMessage(defaultMessage.html);
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSend = async () => {
    if (!emailTo) {
      setError('Veuillez spécifier une adresse email');
      return;
    }

    setSending(true);
    setError('');
    
    try {
      const messageToSend = messageType === MESSAGE_TYPES.PREDEFINED 
        ? generateDefaultMessage(fullStudentName, shareUrl)
        : {
            text: customMessage.replace(/<[^>]*>/g, ''),
            html: customMessage
          };

      const response = await fetch('/api/corrections/send-feedback-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: emailTo,
          correctionId,
          studentName: student ? `${student.first_name || ''} ${student.last_name || ''}`.trim() : 'l\'étudiant',
          customMessage: messageToSend.text,
          htmlMessage: messageToSend.html,
          subject: emailSubject // Ajout de l'objet du mail
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.message || 'Erreur lors de l\'envoi de l\'email';
        if (errorData.details) {
          // console.error('Détails de l\'erreur:', errorData.details);
          throw new Error(`${errorMessage} - Détails: ${errorData.details}`);
        } else {
          throw new Error(errorMessage);
        }
      }
      
      setSuccess(true);
      // Ne pas réinitialiser les champs pour permettre de renvoyer
    } catch (err) {
      console.error('Error sending email:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setSending(false);
    }
  };

  // Fonction pour créer une copie de la correction pour un nouvel étudiant
  const createCorrectionCopy = async (studentId: number) => {
    try {
      const response = await fetch(`/api/corrections/${correctionId}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId })
      });

      if (!response.ok) throw new Error('Erreur lors de la duplication');
      const data = await response.json();
      return data.correctionId;
    } catch (error) {
      console.error('Erreur:', error);
      throw error;
    }
  };

  // Créer une fonction dédiée pour l'envoi d'email à un étudiant spécifique
  const sendEmailToStudent = async (targetStudent: Student, targetCorrectionId: string) => {
    const studentName = `${targetStudent.first_name || ''} ${targetStudent.last_name || ''}`.trim();
    
    // Récupérer l'URL de feedback spécifique pour cette correction
    const feedbackUrl = await fetchShareCode(targetCorrectionId);
    
    const messageToSend = messageType === MESSAGE_TYPES.PREDEFINED 
      ? generateDefaultMessage(studentName, feedbackUrl)
      : {
          text: customMessage.replace(/<[^>]*>/g, ''),
          html: customMessage.replace(shareUrl, feedbackUrl) // Remplacer l'URL principale par l'URL spécifique
        };

    const response = await fetch('/api/corrections/send-feedback-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: targetStudent.email,
        correctionId: targetCorrectionId,
        studentName: studentName,
        customMessage: messageToSend.text,
        htmlMessage: messageToSend.html,
        subject: emailSubject
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.message || 'Erreur lors de l\'envoi de l\'email';
      if (errorData.details) {
        // console.error('Détails de l\'erreur:', errorData.details);
        throw new Error(`${errorMessage} - Détails: ${errorData.details}`);
      } else {
        throw new Error(errorMessage);
      }
    }
  };

  // Mettre à jour handleSendToAll pour utiliser la nouvelle fonction
  const handleSendToAll = async () => {
    const initialStatuses: SendingStatus[] = [
      { studentId: student!.id, status: 'pending' },
      ...additionalStudents.map(s => ({ studentId: s.id, status: 'pending' as const }))
    ];
    setSendingStatuses(initialStatuses);

    for (const status of initialStatuses) {
      setSendingStatuses(prev => 
        prev.map(s => s.studentId === status.studentId ? { ...s, status: 'processing' } : s)
      );

      try {
        let targetCorrectionId = correctionId;
        const targetStudent = status.studentId === student!.id
          ? student!
          : additionalStudents.find(s => s.id === status.studentId);

        if (!targetStudent) {
          throw new Error('Étudiant non trouvé');
        }

        // Si ce n'est pas l'étudiant principal, créer une copie
        if (status.studentId !== student!.id) {
          targetCorrectionId = await createCorrectionCopy(status.studentId);
        }

        // Envoyer l'email à cet étudiant spécifique
        await sendEmailToStudent(targetStudent, targetCorrectionId);

        setSendingStatuses(prev => 
          prev.map(s => s.studentId === status.studentId 
            ? { ...s, status: 'success', correctionId: targetCorrectionId } 
            : s
          )
        );
      } catch (error) {
        setSendingStatuses(prev => 
          prev.map(s => s.studentId === status.studentId 
            ? { ...s, status: 'error', error: error instanceof Error ? error.message : 'Erreur inconnue' } 
            : s
          )
        );
      }
    }
  };

  // Nouvelle fonction pour mettre à jour les étudiants affichés
  const updateDisplayedStudents = (students: AllStudents, classIds: number[]) => {
    const grouped: StudentsByClass = {};
    
    // Si aucune classe n'est sélectionnée, montrer tous les étudiants
    const shouldShowAll = classIds.length === 0;
    
    // Parcourir tous les étudiants dans l'objet uniqueStudents
    Object.values(students).forEach(student => {
      // Ne pas inclure l'étudiant actuel (corrigé) ni ceux déjà ajoutés
      if (student && student.id === student.id || additionalStudents.some(s => s.id === student.id)) {
        return;
      }

      if (shouldShowAll) {
        // Pour les étudiants sans classe
        if (student.classes.length === 0) {
          if (!grouped[0]) {
            grouped[0] = {
              className: "Sans classe",
              students: []
            };
          }
          // Ajouter l'étudiant s'il n'est pas déjà présent
          if (!grouped[0].students.some(s => s.id === student.id)) {
            grouped[0].students.push({
              id: student.id,
              first_name: student.first_name,
              last_name: student.last_name,
              email: student.email || '',
            });
          }
          
          // Pour les étudiants avec classes
          student.classes.forEach((cls: Class) => {
            if (!grouped[cls.id]) {
              grouped[cls.id] = {
                className: cls.name,
                students: []
              };
            }
            // Ajouter l'étudiant s'il n'est pas déjà présent dans cette classe
            if (!grouped[cls.id].students.some(s => s.id === student.id)) {
              grouped[cls.id].students.push({
                id: student.id,
                first_name: student.first_name,
                last_name: student.last_name,
                email: student.email || '',
                classId: cls.id,
                className: cls.name
              });
            }
          });
        }
      } else {
        // Filtrer par classes sélectionnées
        student.classes.forEach((cls: Class) => {
          if (classIds.includes(cls.id)) {
            if (!grouped[cls.id]) {
              grouped[cls.id] = {
                className: cls.name,
                students: []
              };
            }
            // Ajouter l'étudiant s'il n'est pas déjà présent dans cette classe
            if (!grouped[cls.id].students.some(s => s.id === student.id)) {
              grouped[cls.id].students.push({
                id: student.id,
                first_name: student.first_name,
                last_name: student.last_name,
                email: student.email || '',
                classId: cls.id,
                className: cls.name
              });
            }
          }
        });
      }
    });

    setStudentsByClass(grouped);
  };

  // Fonction pour charger la liste des étudiants disponibles
  const loadAvailableStudents = async () => {
    try {
      const response = await fetch('/api/students');
      if (response.ok) {
        const students = await response.json();
        
        // Créer un objet pour stocker tous les étudiants uniques avec leurs classes
        const uniqueStudents: AllStudents = {};
        const classes = new Set<string>();

        students.forEach((s: any) => {
          if (!uniqueStudents[s.id]) {
            uniqueStudents[s.id] = {
              id: s.id,
              email: s.email,
              first_name: s.first_name,
              last_name: s.last_name,
              classes: []
            };
          }
          
          if (s.classId && s.className) {
            uniqueStudents[s.id].classes.push({
              id: s.classId,
              name: s.className
            });
            classes.add(JSON.stringify({ id: s.classId, name: s.className }));
          }
        });

        // Convertir les classes en tableau
        const uniqueClasses = Array.from(classes).map(c => JSON.parse(c));
        setAvailableClasses(uniqueClasses);
        setAllStudents(uniqueStudents);


        // Mettre à jour studentsByClass en fonction des filtres actuels
        updateDisplayedStudents(uniqueStudents, selectedClassIds);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des étudiants:', error);
    }
  };

  // Gestionnaire de changement de sélection des classes
  const handleClassSelectionChange = (event: any) => {
    const newSelectedClasses = event.target.value as number[];
    setSelectedClassIds(newSelectedClasses);
    updateDisplayedStudents(allStudents, newSelectedClasses);
  };

  // Ajouter un étudiant à la liste
  const handleAddStudent = (selectedStudent: Student) => {
    if (!additionalStudents.find(s => s.id === selectedStudent.id)) {
      setAdditionalStudents([...additionalStudents, selectedStudent]);
    }
  };

  // Retirer un étudiant de la liste
  const handleRemoveStudent = (studentId: number) => {
    setAdditionalStudents(additionalStudents.filter(s => s.id !== studentId));
  };

  // Fonction pour générer une clé unique pour chaque étudiant
  const generateStudentKey = (studentId: number, context: string) => {
    return `${context}-${studentId}-${Date.now()}`;
  };

  return (
    <>
      <Button 
      
        variant="outlined" 
        color="success" 
        startIcon={<EmailIcon />} 
        onClick={handleOpen}
        disabled={loading}
      >
        {loading ? 'Chargement...' : `Envoyer la correction`}
      </Button>
      
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          Envoyer un courriel de feedback
          <Tabs 
            value={messageType} 
            onChange={handleTabChange}  // Utiliser handleTabChange au lieu de la fonction inline
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
          
          {/* Conditional rendering based on message type */}
          {messageType === MESSAGE_TYPES.PREDEFINED ? (
            <TextField
              margin="dense"
              label="Message prédéfini"
              multiline
              rows={15}
              fullWidth
              value={generateDefaultMessage(fullStudentName, shareUrl).text}
              InputProps={{
                readOnly: true,
              }}
              sx={{ 
                bgcolor: 'action.hover',
                '& .MuiInputBase-input.Mui-readOnly': {
                  cursor: 'default'
                }
              }}
            />
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

          {/* Ajouter la section pour les destinataires multiples */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <GroupIcon color="primary" />
                Destinataires
              </Typography>
              <Button
                startIcon={<PersonAddIcon />}
                onClick={() => {
                  loadAvailableStudents();
                  setShowStudentSelect(true);
                }}
                size="small"
              >
                Ajouter des destinataires
              </Button>
            </Box>

            {/* Liste des destinataires */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Chip
                label={`${student?.first_name} ${student?.last_name}`}
                color="primary"
                onDelete={undefined}  // Principal destinataire, pas supprimable
              />
              {additionalStudents.map((s) => (
                <Chip
                  key={s.id}
                  label={`${s.first_name} ${s.last_name}`}
                  onDelete={() => handleRemoveStudent(s.id)}
                />
              ))}
            </Box>
          </Box>

          {/* Timeline de progression */}
          {sendingStatuses.length > 0 && (
            <Timeline position="right" sx={{ mb: 2 }}>
              {sendingStatuses.map((status) => {
                const studentInfo = status.studentId === student?.id 
                  ? student 
                  : additionalStudents.find(s => s.id === status.studentId);

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
                        {studentInfo ? `${studentInfo.first_name} ${studentInfo.last_name}` : 'Étudiant inconnu'}
                        {status.status === 'processing' && ' (en cours...)'}
                        {status.status === 'success' && ' ✓'}
                        {status.status === 'error' && ` - ${status.error}`}
                      </Typography>
                    </TimelineContent>
                  </TimelineItem>
                );
              })}
            </Timeline>
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
            onClick={additionalStudents.length > 0 ? handleSendToAll : handleSend} 
            variant="contained" 
            color="primary" 
            disabled={sending || !emailSubject.trim() || !emailTo.trim()}
            startIcon={sending ? <CircularProgress size={20} /> : <EmailIcon />}
          >
            {sending ? 'Envoi en cours...' : additionalStudents.length > 0 ? 'Envoyer à tous' : 'Envoyer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog pour sélectionner des étudiants supplémentaires */}
      <Dialog
        open={showStudentSelect}
        onClose={() => setShowStudentSelect(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Ajouter des destinataires</DialogTitle>
        <DialogContent>
          {/* Sélecteur de classes */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Filtrer par classes</InputLabel>
            <Select
              multiple
              value={selectedClassIds}
              onChange={handleClassSelectionChange}
              input={<OutlinedInput label="Filtrer par classes" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((classId) => (
                    <Chip
                      key={classId}
                      label={availableClasses.find(c => c.id === classId)?.name}
                      size="small"
                    />
                  ))}
                </Box>
              )}
            >
              {availableClasses.map((cls) => (
                <MenuItem key={cls.id} value={cls.id}>
                  {cls.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Liste des étudiants groupés par classe */}
          {
          availableClasses
            .filter(cls => selectedClassIds.length === 0 || selectedClassIds.includes(cls.id))
            .map((cls) => {
              // Filtrer les étudiants qui appartiennent à cette classe
              const studentsInClass = Object.values(allStudents)
                .filter(studentItem => {
                  // Vérifier que l'étudiant appartient à cette classe
                  const belongsToClass = studentItem.classes.some((c: Class) => c.id === cls.id);
                  // Ne pas inclure l'étudiant principal ni ceux déjà ajoutés
                  const isNotCurrentStudent = studentItem.id !== (student?.id || 0); // Corriger cette ligne
                  const isNotAlreadyAdded = !additionalStudents.some(s => s.id === studentItem.id);
                  
                  return belongsToClass && isNotCurrentStudent && isNotAlreadyAdded;
                });
              
              
              return (
                <Box key={cls.id} sx={{ mb: 3 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 'bold',
                      mb: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}
                  >
                    <SchoolIcon color="primary" fontSize="small" />
                    {cls.name}
                  </Typography>
                  <List>
                    {studentsInClass.map((s) => (
                      <ListItem
                        key={getStudentKey(s.id, `class-${cls.id}`)}
                        secondaryAction={
                          <IconButton
                            edge="end"
                            onClick={() => {
                              handleAddStudent({
                                id: s.id,
                                first_name: s.first_name,
                                last_name: s.last_name,
                                email: s.email || ''
                              });
                            }}
                          >
                            <PersonAddIcon />
                          </IconButton>
                        }
                      >
                        <ListItemText
                          primary={`${s.first_name} ${s.last_name}`}
                          secondary={s.email}
                        />
                      </ListItem>
                    ))}
                  </List>
                  {studentsInClass.length === 0 && (
                    <Typography variant="body2" color="text.secondary" sx={{ pl: 2 }}>
                      Aucun étudiant disponible dans cette classe
                    </Typography>
                  )}
                </Box>
              );
            })}

          {/* Afficher les étudiants sans classe si aucun filtre n'est appliqué */}
          {selectedClassIds.length === 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 'bold',
                  mb: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <SchoolIcon color="primary" fontSize="small" />
                Sans classe
              </Typography>
              <List>
                {Object.values(allStudents)
                  .filter(studentItem => 
                    studentItem.classes.length === 0 && 
                    studentItem.id !== (student?.id || 0) && // Corriger cette ligne aussi
                    !additionalStudents.some(s => s.id === studentItem.id)
                  )
                  .map((s) => (
                    <ListItem
                      key={getStudentKey(s.id, 'no-class')}
                      secondaryAction={
                        <IconButton
                          edge="end"
                          onClick={() => {
                            handleAddStudent({
                              id: s.id,
                              first_name: s.first_name,
                              last_name: s.last_name,
                              email: s.email || ''
                            });
                          }}
                        >
                          <PersonAddIcon />
                        </IconButton>
                      }
                    >
                      <ListItemText
                        primary={`${s.first_name} ${s.last_name}`}
                        secondary={s.email}
                      />
                    </ListItem>
                  ))}
              </List>
              {Object.values(allStudents).filter(s => s.classes.length === 0).length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ pl: 2 }}>
                  Aucun étudiant sans classe
                </Typography>
              )}
            </Box>
          )}

          {availableClasses.length === 0 && Object.keys(allStudents).length === 0 && (
            <Typography variant="body1" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
              Aucun étudiant disponible
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowStudentSelect(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
