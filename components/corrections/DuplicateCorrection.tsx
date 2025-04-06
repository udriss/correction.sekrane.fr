import React, { useState, useEffect, useCallback } from 'react';
import { 
  Button, Dialog, DialogTitle, DialogContent, DialogActions, 
  FormControl, InputLabel, Select, MenuItem, TextField, 
  Typography, Box, Chip, Alert, CircularProgress,
  List, ListItem, ListItemText, IconButton, SelectChangeEvent, OutlinedInput, Switch,
  alpha, InputAdornment
} from '@mui/material';
import { Timeline, TimelineItem, TimelineSeparator, TimelineConnector, TimelineContent, TimelineDot } from '@mui/lab';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';
import LaunchIcon from '@mui/icons-material/Launch';
import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'; // Import de l'icône d'alerte
import Link from 'next/link';
import { constructFromSymbol } from 'date-fns/constants';

interface DuplicateCorrectionProps {
  correctionId: string;
}

interface Student {
  id: number;
  first_name: string;
  last_name: string;
  email: string | null;
}

// Ajouter cette interface pour résoudre le problème de typage
interface StudentWithClasses extends Student {
  classes: Class[];
  classId?: number;
  className?: string;
}

interface Class {
  id: number;
  name: string;
}

interface StudentWithCustomEmail extends Student {
  originalEmail: string;
  customEmail: string;
  isEmailModified: boolean;
}

interface DuplicationStatus {
  studentId: number;
  status: 'pending' | 'processing' | 'success' | 'error';
  newCorrectionId?: string;
  error?: string;
}

// Ajouter une interface pour les informations de groupe
interface GroupInfo {
  id?: number;
  name: string;
}

// Interface pour les corrections existantes
interface ExistingCorrection {
  correctionId: string;
  studentId: number;
  activityId: number;
}

export default function DuplicateCorrection({ correctionId }: DuplicateCorrectionProps) {
  const [open, setOpen] = useState(false);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassIds, setSelectedClassIds] = useState<number[]>([]);
  const [allStudents, setAllStudents] = useState<Record<number, StudentWithClasses>>({});
  const [filteredStudents, setFilteredStudents] = useState<StudentWithClasses[]>([]);
  const [originalStudents, setOriginalStudents] = useState<any[]>([]); // Ajout pour stocker les données brutes
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [studentsToProcess, setStudentsToProcess] = useState<StudentWithCustomEmail[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [duplicationStatuses, setDuplicationStatuses] = useState<DuplicationStatus[]>([]);
  // État pour la recherche d'étudiants
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // États pour gérer les corrections existantes
  const [activityId, setActivityId] = useState<number | null>(null);
  const [existingCorrections, setExistingCorrections] = useState<ExistingCorrection[]>([]);
  const [showOverwriteDialog, setShowOverwriteDialog] = useState(false);
  const [currentStudentToProcess, setCurrentStudentToProcess] = useState<StudentWithCustomEmail | null>(null);
  const [overwriteMode, setOverwriteMode] = useState<'overwrite' | 'create'>('create');

  // Function to generate a unique key for each student
  const [studentKeys] = useState<Map<number, string>>(new Map());
  const getStudentKey = useCallback((studentId: number, context: string) => {
    if (!studentKeys.has(studentId)) {
      studentKeys.set(studentId, `${context}-${studentId}-${crypto.randomUUID()}`);
    }
    return studentKeys.get(studentId)!;
  }, [studentKeys]);

  const handleOpen = () => {
    setOpen(true);
    setError('');
    loadData();
    
    // Récupérer l'ID de l'activité associée à cette correction
    fetch(`/api/corrections/${correctionId}`)
      .then(response => response.json())
      .then(data => {
        if (data && data.activity_id) {
          setActivityId(data.activity_id);
        }
      })
      .catch(error => {
        console.error('Erreur lors de la récupération des informations de la correction:', error);
      });
  };

  const handleClose = () => {
    if (submitting) return;
    setOpen(false);
    setSelectedClassIds([]);
    setSelectedStudentIds([]);
    setStudentsToProcess([]);
    setDuplicationStatuses([]);
  };

  // Load classes and students - Refactorisation complète
  const loadData = async () => {
    setLoading(true);
    try {
      // Récupérer tous les étudiants avec la nouvelle structure consolidée
      const studentsResponse = await fetch('/api/students');
      if (!studentsResponse.ok) throw new Error('Erreur lors du chargement des étudiants');
      const data = await studentsResponse.json();
      
      // Stocker les données originales
      setOriginalStudents(data);
      
      // Récupérer toutes les classes disponibles
      const classesResponse = await fetch('/api/classes');
      if (classesResponse.ok) {
        const classesData = await classesResponse.json();
        setClasses(classesData);
      }
      
      // Convertir les données dans le format attendu par le composant
      const studentsById: Record<number, StudentWithClasses> = {};
      
      data.forEach((student: any) => {
        studentsById[student.id] = {
          id: student.id,
          first_name: student.first_name,
          last_name: student.last_name,
          email: student.email,
          classes: student.allClasses 
            ? student.allClasses.map((cls: { classId: number, className: string }) => ({ id: cls.classId, name: cls.className }))
            : [],
          classId: student.classId,
          className: student.className,
        };
      });
      
      setAllStudents(studentsById);
      
      // Définir les étudiants filtrés (tous les étudiants au départ)
      setFilteredStudents(Object.values(studentsById)
        .sort((a, b) => `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`)));
      
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  // Update the filtered students list based on selected classes
  const updateFilteredStudents = (students: Record<number, StudentWithClasses>, classIds: number[], searchTerm: string) => {
    // If no classes selected, show all students
    let filtered = Object.values(students);
    
    if (classIds.length > 0) {
      filtered = filtered.filter(student => 
        student.classes.some(c => classIds.includes(c.id))
      );
    }
    
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(student => 
        `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredStudents(filtered.sort((a, b) => `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`)));
  };

  // Handle class selection change
  const handleClassChange = (event: SelectChangeEvent<number[]>) => {
    const newSelectedClasses = event.target.value as number[];
    setSelectedClassIds(newSelectedClasses);
    updateFilteredStudents(allStudents, newSelectedClasses, searchTerm);
  };

  // Handle student selection change
  const handleStudentChange = (event: SelectChangeEvent<number[]>) => {
    const newSelectedStudents = event.target.value as number[];
    setSelectedStudentIds(newSelectedStudents);
    
    // Add newly selected students to the process list
    const newStudents = newSelectedStudents
      .filter(id => !studentsToProcess.some(s => s.id === id))
      .map(id => {
        const student = allStudents[id];
        return {
          id: student.id,
          first_name: student.first_name,
          last_name: student.last_name,
          email: student.email || '',
          originalEmail: student.email || '',
          customEmail: student.email || '',
          isEmailModified: false
        };
      });
    
    // Remove deselected students
    const updatedStudentsToProcess = [
      ...studentsToProcess.filter(s => newSelectedStudents.includes(s.id)),
      ...newStudents
    ];
    
    setStudentsToProcess(updatedStudentsToProcess);
  };

  // Handle email change for a student
  const handleEmailChange = (studentId: number, newEmail: string) => {
    setStudentsToProcess(prev => 
      prev.map(student => {
        if (student.id === studentId) {
          const isModified = newEmail !== student.originalEmail;
          return {
            ...student,
            customEmail: newEmail,
            isEmailModified: isModified
          };
        }
        return student;
      })
    );
  };

  // Remove a student from the process list
  const handleRemoveStudent = (studentId: number) => {
    setStudentsToProcess(prev => prev.filter(s => s.id !== studentId));
    setSelectedStudentIds(prev => prev.filter(id => id !== studentId));
  };

  // Ajouter des états pour la gestion de classe et groupe
  const [assignToClass, setAssignToClass] = useState<boolean>(false);
  const [selectedClassId, setSelectedClassId] = useState<number | ''>('');
  const [useCustomGroup, setUseCustomGroup] = useState<boolean>(false);
  const [customGroupName, setCustomGroupName] = useState<string>('');

  // Fonction pour dupliquer et associer à une classe/groupe si spécifié
  const duplicateCorrection = async (studentId: number) => {
    try {
      // Préparer les données supplémentaires à envoyer
      const additionalData: Record<string, any> = { studentId };
      
      // Ajouter les informations de classe si nécessaire
      if (assignToClass && selectedClassId) {
        additionalData.classId = selectedClassId;
      }
      
      // Ajouter les informations de groupe si nécessaire
      if (useCustomGroup && customGroupName.trim()) {
        additionalData.groupName = customGroupName.trim();
      }
      
      const response = await fetch(`/api/corrections/${correctionId}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(additionalData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la duplication');
      }

      const data = await response.json();
      return data.correctionId;
    } catch (error) {
      console.error('Error duplicating correction:', error);
      throw error;
    }
  };

  // Handle the duplication process for all selected students
  const handleDuplicate = async () => {
    if (studentsToProcess.length === 0) {
      setError('Veuillez sélectionner au moins un étudiant');
      return;
    }

    setError('');
    setSubmitting(true);
    
    // Initialize duplication statuses
    const initialStatuses: DuplicationStatus[] = studentsToProcess.map(student => ({
      studentId: student.id,
      status: 'pending'
    }));
    
    setDuplicationStatuses(initialStatuses);
    
    // Process each student sequentially
    for (const student of studentsToProcess) {
      // Update status to processing
      setDuplicationStatuses(prev => 
        prev.map(s => s.studentId === student.id ? { ...s, status: 'processing' } : s)
      );
      
      try {
        // Utiliser la nouvelle fonction processSingleStudent qui gère la vérification des corrections existantes
        const newCorrectionId = await processSingleStudent(student, overwriteMode);
        
        // Si le résultat est null, cela signifie que le dialogue de confirmation est affiché
        // Dans ce cas, on interrompt le traitement et on attend la décision de l'utilisateur
        if (newCorrectionId === null) {
          // On restaure le statut à pending pour cet étudiant
          setDuplicationStatuses(prev => 
            prev.map(s => s.studentId === student.id ? { ...s, status: 'pending' } : s)
          );
          // On met fin à la soumission pour permettre à l'utilisateur d'interagir
          setSubmitting(false);
          return;
        }
        
        // Update status to success
        setDuplicationStatuses(prev => 
          prev.map(s => s.studentId === student.id 
            ? { ...s, status: 'success', newCorrectionId } 
            : s
          )
        );
      } catch (error) {
        // Update status to error
        setDuplicationStatuses(prev => 
          prev.map(s => s.studentId === student.id 
            ? { ...s, status: 'error', error: error instanceof Error ? error.message : 'Erreur inconnue' } 
            : s
          )
        );
      }
    }
    
    setSubmitting(false);
  };

  useEffect(() => {
    // Update filtered students when selected classes change
    if (open && Object.keys(allStudents).length > 0) {
      updateFilteredStudents(allStudents, selectedClassIds, searchTerm);
    }
  }, [selectedClassIds, allStudents, open, searchTerm]);


  // Effet pour vérifier les corrections existantes lorsque les étudiants sont sélectionnés
  useEffect(() => {
    if (activityId && studentsToProcess.length > 0) {
      const studentIds = studentsToProcess.map(s => s.id);
      
      
      // Récupérer les corrections existantes pour ces étudiants et cette activité
      fetch(`/api/corrections/check-existing?activityId=${activityId}&studentIds=${studentIds.join(',')}`)
        .then(response => response.json())
        .then(data => {
          
          // Convertir la réponse en tableau si ce n'est pas déjà le cas
          let corrections = [];
          if (Array.isArray(data)) {
            corrections = data;
          } else if (data && typeof data === 'object') {
            // Si c'est un objet mais pas un tableau, vérifier s'il a des propriétés de correction
            if (data.correctionId || data.studentId || data.activityId) {
              corrections = [data]; // Considérer comme une seule correction
            } else {
              // Sinon, essayer de convertir les valeurs de l'objet en tableau
              corrections = Object.values(data).filter(item => item && typeof item === 'object');
            }
          }
          
          setExistingCorrections(corrections);
        })
        .catch(error => {
          console.error('Erreur lors de la vérification des corrections existantes:', error);
        });
    }
  }, [activityId, studentsToProcess]);


  // Fonction pour vérifier si un étudiant a déjà une correction pour cette activité
  const hasExistingCorrection = (studentId: number) => {
    return existingCorrections.some(
      correction => correction.studentId === studentId && correction.activityId === activityId
    );
  };

  // Fonction pour obtenir l'ID de la correction existante
  const getExistingCorrectionId = (studentId: number) => {
    const existing = existingCorrections.find(
      correction => correction.studentId === studentId && correction.activityId === activityId
    );
    return existing ? existing.correctionId : null;
  };

  // Gérer le choix de l'utilisateur concernant l'écrasement ou la création d'une nouvelle correction
  const handleOverwriteChoice = (choice: 'overwrite' | 'create') => {
    setOverwriteMode(choice);
    setShowOverwriteDialog(false);
    
    if (currentStudentToProcess) {
      // Appeler directement la fonction qui effectue la duplication, 
      // sans repasser par la vérification d'existence
      duplicateCorrectionWithMode(currentStudentToProcess, choice);
    }
  };
  
  // Fonction pour dupliquer une correction avec un mode spécifique (créer ou écraser)
  const duplicateCorrectionWithMode = async (student: StudentWithCustomEmail, mode: 'overwrite' | 'create') => {
    try {
      // Update status to processing
      setDuplicationStatuses(prev => 
        prev.map(s => s.studentId === student.id ? { ...s, status: 'processing' } : s)
      );
      
      // Récupérer l'ID de la correction existante si en mode écrasement
      const existingCorrectionId = getExistingCorrectionId(student.id);
      
      // Préparer les données à envoyer
      const additionalData: Record<string, any> = { 
        studentId: student.id
      };
      
      // Ajouter le mode d'écrasement si spécifié
      if (mode === 'overwrite' && existingCorrectionId) {
        additionalData.overwriteExisting = true;
        additionalData.existingCorrectionId = existingCorrectionId;
      }
      
      // Ajouter les informations de classe si nécessaire
      if (assignToClass && selectedClassId) {
        additionalData.classId = selectedClassId;
      }
      
      // Ajouter les informations de groupe si nécessaire
      if (useCustomGroup && customGroupName.trim()) {
        additionalData.groupName = customGroupName.trim();
      }
      
      // Faire la requête de duplication
      const response = await fetch(`/api/corrections/${correctionId}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(additionalData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la duplication');
      }
      
      const data = await response.json();
      
      // Update status to success
      setDuplicationStatuses(prev => 
        prev.map(s => s.studentId === student.id 
          ? { ...s, status: 'success', newCorrectionId: data.correctionId } 
          : s
        )
      );
      
      // Continuer avec le reste des étudiants
      const nextStudents = studentsToProcess.filter(s => 
        s.id !== student.id && 
        !duplicationStatuses.some(
          status => status.studentId === s.id && 
          (status.status === 'success' || status.status === 'processing')
        )
      );
      
      if (nextStudents.length > 0) {
        for (const nextStudent of nextStudents) {
          const result = await processSingleStudent(nextStudent, mode);
          if (result === null) break; // Si un autre dialogue s'ouvre, arrêter le traitement
        }
      }
      
      if (nextStudents.length === 0) {
        setSubmitting(false);
      }
      
      return data.correctionId;
    } catch (error) {
      console.error('Error processing student with mode:', error);
      
      // Update status to error
      setDuplicationStatuses(prev => 
        prev.map(s => s.studentId === student.id 
          ? { ...s, status: 'error', error: error instanceof Error ? error.message : 'Erreur inconnue' } 
          : s
        )
      );
      
      setSubmitting(false);
      throw error;
    }
  };

  // Vérifier et traiter un étudiant individuellement
  const processSingleStudent = async (student: StudentWithCustomEmail, mode?: 'overwrite' | 'create') => {
    try {
      // Vérifier si une correction existe déjà pour cet étudiant et cette activité
      const existingCorrectionId = getExistingCorrectionId(student.id);
      // Si une correction existe et qu'aucun mode n'est spécifié, montrer le dialogue de confirmation
      
      if (existingCorrectionId) {
        setCurrentStudentToProcess(student);
        setShowOverwriteDialog(true);
        return null; // Attendre la décision de l'utilisateur
      }
      
      // Préparer les données à envoyer
      const additionalData: Record<string, any> = { 
        studentId: student.id
      };
      
      // Ajouter le mode d'écrasement si spécifié
      if (mode === 'overwrite' && existingCorrectionId) {
        additionalData.overwriteExisting = true;
        additionalData.existingCorrectionId = existingCorrectionId;
      }
      
      // Ajouter les informations de classe si nécessaire
      if (assignToClass && selectedClassId) {
        additionalData.classId = selectedClassId;
      }
      
      // Ajouter les informations de groupe si nécessaire
      if (useCustomGroup && customGroupName.trim()) {
        additionalData.groupName = customGroupName.trim();
      }
      
      // Faire la requête de duplication
      const response = await fetch(`/api/corrections/${correctionId}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(additionalData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la duplication');
      }
      
      const data = await response.json();
      return data.correctionId;
      
    } catch (error) {
      console.error('Error processing student:', error);
      throw error;
    }
  };

  return (
    <>
      <Button
        variant="outlined"
        color="primary"
        startIcon={<ContentCopyIcon />}
        onClick={handleOpen}
        sx={{ ml: 2 }}
      >
        Dupliquer cette correction
      </Button>
      
      {/* Dialogue de confirmation pour les corrections existantes */}
      <Dialog 
        open={showOverwriteDialog} 
        onClose={() => setShowOverwriteDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ 
          color: 'error.dark', 
          py: 2,
          fontWeight: 'medium',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <Box component="span" sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
            <ErrorOutlineIcon sx={{ fontSize: 24, mr: 1 }} />
          </Box>
          Correction existante détectée
        </DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 2 }}>
          {currentStudentToProcess && (
            <Box>
              <Alert 
                severity="warning" 
                sx={{ 
                  mb: 3,
                  borderRadius: 1,
                  '& .MuiAlert-icon': {
                    fontSize: '1.5rem'
                  }
                }}
                variant="outlined"
              >
                Une correction pour cette activité existe déjà pour l'étudiant <strong>{currentStudentToProcess.first_name} {currentStudentToProcess.last_name}</strong>.
              </Alert>
              <Typography variant="body1" sx={{ mb: 3, fontWeight: 500 }}>
                Que souhaitez-vous faire ?
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box 
                  sx={{ 
                    p: 2.5, 
                    border: '1px solid', 
                    borderColor: 'warning.light',
                    bgcolor: 'warning.50',
                    borderRadius: 2,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                      borderColor: 'warning.main'
                    }
                  }}
                >
                  <Typography variant="subtitle1" fontWeight="bold" color="warning.dark" gutterBottom>
                    Écraser la correction existante
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Les données de la correction existante seront remplacées par les données de la correction que vous dupliquez.
                  </Typography>
                </Box>
                
                <Box 
                  sx={{ 
                    p: 2.5, 
                    border: '1px solid', 
                    borderColor: 'primary.light',
                    bgcolor: 'primary.50',
                    borderRadius: 2,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                      borderColor: 'primary.main'
                    }
                  }}
                >
                  <Typography variant="subtitle1" fontWeight="bold" color="primary.dark" gutterBottom>
                  Ajouter une nouvelle correction
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Une nouvelle correction sera ajoutée pour cet étudiant, en plus de la correction existante.
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, bgcolor: 'grey.50' }}>
          <Button 
            onClick={() => handleOverwriteChoice('create')} 
            color="primary"
            variant="outlined"
            sx={{ 
              borderRadius: 2, 
              px: 3,
              fontWeight: 'medium' 
            }}
          >
            Ajouter une nouvelle
          </Button>
            <Button 
            onClick={() => handleOverwriteChoice('overwrite')} 
            
            variant="outlined"
            sx={{ 
              color:'warning.dark',
              borderColor: 'warning.dark',
              borderRadius: 2, 
              px: 3,
              fontWeight: 'medium',
              '&:hover': {
              bgcolor: theme => alpha(theme.palette.warning.main, 0.15),
              }
            }}
            >
            Écraser l'existante
            </Button>
        </DialogActions>
      </Dialog>
      
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Dupliquer la correction pour d'autres étudiants</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {/* Class selection */}
              <FormControl fullWidth sx={{ mb: 2, mt: 1 }}>
                <InputLabel id="class-select-label">Filtrer par classes</InputLabel>
                <Select
                  labelId="class-select-label"
                  multiple
                  value={selectedClassIds}
                  onChange={handleClassChange}
                  input={<OutlinedInput label="Filtrer par classes" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as number[]).length === 0 ? (
                        <Typography variant="body2" color="text.secondary">Toutes les classes</Typography>
                      ) : (
                        (selected as number[]).map((value) => (
                          <Chip 
                            key={value} 
                            label={classes.find(c => c.id === value)?.name} 
                            size="small"
                          />
                        ))
                      )}
                    </Box>
                  )}
                  startAdornment={<SchoolIcon sx={{ mr: 1, color: 'text.secondary' }} />}
                  displayEmpty
                >
                  {classes.length === 0 ? (
                    <MenuItem disabled value="">
                      <em>Aucune classe disponible</em>
                    </MenuItem>
                  ) : (
                    classes.map((c) => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.name}
                      </MenuItem>
                    ))
                  )}
                </Select>
                <Typography variant="caption" className="text-gray-500 mt-1 block">
                  {classes.length === 0 ? "Aucune classe n'a été trouvée" : "Sélectionnez une ou plusieurs classes pour filtrer les étudiants"}
                </Typography>
              </FormControl>
              
              {/* Student search */}
              <TextField
                fullWidth
                label="Rechercher des étudiants"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher par nom"
                variant="outlined"
                size="small"
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
              
              {/* Student selection */}
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel id="student-select-label">Sélectionner des étudiants</InputLabel>
                <Select
                  labelId="student-select-label"
                  multiple
                  value={selectedStudentIds}
                  onChange={handleStudentChange}
                  input={<OutlinedInput label="Sélectionner des étudiants" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as number[]).length === 0 ? (
                        <Typography variant="body2" color="text.secondary">Aucun étudiant sélectionné</Typography>
                      ) : (
                        (selected as number[]).map((value) => {
                          const student = allStudents[value];
                          return (
                            <Chip 
                              key={value} 
                              label={`${student.first_name} ${student.last_name}`} 
                              size="small"
                            />
                          );
                        })
                      )}
                    </Box>
                  )}
                  startAdornment={<PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />}
                  displayEmpty
                >
                  {filteredStudents.length === 0 ? (
                    <MenuItem disabled value="">
                      <em>Aucun étudiant disponible</em>
                    </MenuItem>
                  ) : (
                    filteredStudents.map((student) => {
                      // Récupérer les noms de classe de l'étudiant
                      const studentClasses = student.classes.map(c => c.name).join(' | ');
                      
                      return (
                        <MenuItem key={student.id} value={student.id}>
                          {student.first_name} {student.last_name}
                          {studentClasses && (
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                              ({studentClasses})
                            </Typography>
                          )}
                        </MenuItem>
                      );
                    })
                  )}
                </Select>
                <Typography variant="caption" className="text-gray-500 mt-1 block">
                  {filteredStudents.length === 0 
                    ? selectedClassIds.length > 0 
                      ? "Aucun étudiant trouvé dans les classes sélectionnées" 
                      : "Aucun étudiant disponible"
                    : "Sélectionnez un ou plusieurs étudiants pour cette duplication"}
                </Typography>
              </FormControl>
              
              {/* Nouvelle section pour l'assignation à une classe */}
              {studentsToProcess.length > 0 && (
                <Box sx={{ mb: 3, mt: 3, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom fontWeight="medium">
                    Association à une classe
                  </Typography>
                  
                  <FormControl component="fieldset" sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Switch
                        checked={assignToClass}
                        onChange={(e) => setAssignToClass(e.target.checked)}
                        color="primary"
                      />
                      <Typography>
                        Assigner tous les étudiants à une classe
                      </Typography>
                    </Box>
                  </FormControl>
                  
                  {assignToClass && (
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel id="assign-class-label">Classe</InputLabel>
                      <Select
                        labelId="assign-class-label"
                        value={selectedClassId}
                        onChange={(e) => setSelectedClassId(e.target.value as number)}
                        input={<OutlinedInput label="Classe" />}
                        startAdornment={<SchoolIcon sx={{ mr: 1, color: 'text.secondary' }} />}
                        displayEmpty
                      >
                        <MenuItem value="">
                          <em>Sélectionner une classe</em>
                        </MenuItem>
                        {classes.map((c) => (
                          <MenuItem key={c.id} value={c.id}>
                            {c.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                  
                  {/* Section pour le groupe personnalisé */}
                  <Typography variant="subtitle2" gutterBottom fontWeight="medium" sx={{ mt: 3 }}>
                    Association à un groupe
                  </Typography>
                  
                  <FormControl component="fieldset" sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Switch
                        checked={useCustomGroup}
                        onChange={(e) => setUseCustomGroup(e.target.checked)}
                        color="primary"
                      />
                      <Typography>
                        Créer un groupe pour ces étudiants
                      </Typography>
                    </Box>
                  </FormControl>
                  
                  {useCustomGroup && (
                    <TextField
                      fullWidth
                      label="Nom du groupe"
                      value={customGroupName}
                      onChange={(e) => setCustomGroupName(e.target.value)}
                      placeholder="Ex: Groupe Projet 1"
                      variant="outlined"
                      size="small"
                      required={useCustomGroup}
                    />
                  )}
                </Box>
              )}
              
              {/* List of selected students with editable emails */}
              {studentsToProcess.length > 0 && (
                <Box sx={{ mb: 3, mt: 3 }}>
                  <Typography variant="overline" gutterBottom>
                    Étudiants sélectionnés
                  </Typography>
                  
                  <List>
                    {studentsToProcess.map((student) => (
                      <ListItem
                        key={getStudentKey(student.id, 'duplicate')}
                        sx={{ px: 0 }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Chip
                            label={`${student.first_name} ${student.last_name}`}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                      <IconButton 
                        edge="end"
                        onClick={() => handleRemoveStudent(student.id)}
                        aria-label="remove"
                      >
                        <ClearIcon color="error"  />
                      </IconButton>
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
              
              {/* Timeline for duplication progress */}
              {duplicationStatuses.length > 0 && (
                <Box sx={{ mt: 3, mb: 2 }}>
                  <Typography variant="overline" gutterBottom>
                    Statut de la duplication
                  </Typography>
                  <Timeline position="right">
                    {duplicationStatuses.map((status) => {
                      const student = studentsToProcess.find(s => s.id === status.studentId);
                      
                      return (
                        <TimelineItem key={getStudentKey(status.studentId, 'timeline')}>
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
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body2">
                                {student ? `${student.first_name} ${student.last_name}` : 'Étudiant inconnu'}
                                {status.status === 'processing' && ' (en cours...)'}
                                {status.status === 'success' && ' ✓'}
                                {status.status === 'error' && ` - ${status.error}`}
                              </Typography>
                              
                              {/* Link to the duplicated correction */}
                              {status.status === 'success' && status.newCorrectionId && (
                                <IconButton
                                  component={Link}
                                  href={`/corrections/${status.newCorrectionId}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  size="small"
                                  color="primary"
                                  title="Voir la correction dupliquée"
                                >
                                  <LaunchIcon fontSize="small" />
                                </IconButton>
                              )}
                            </Box>
                          </TimelineContent>
                        </TimelineItem>
                      );
                    })}
                  </Timeline>
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="inherit" disabled={submitting}>
            Annuler
          </Button>
          <Button
            onClick={handleDuplicate}
            color="primary"
            variant="contained"
            disabled={submitting || studentsToProcess.length === 0 || 
              (assignToClass && !selectedClassId) || 
              (useCustomGroup && !customGroupName.trim())}
            startIcon={submitting ? <CircularProgress size={20} /> : <ContentCopyIcon />}
          >
            {submitting ? 'Duplication en cours...' : 'Dupliquer'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
