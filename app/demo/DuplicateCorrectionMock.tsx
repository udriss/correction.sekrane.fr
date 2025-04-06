import React, { useState } from 'react';
import { 
  Button, Dialog, DialogActions, DialogContent, DialogTitle, 
  FormControl, InputLabel, Select, MenuItem, TextField,
  Typography, Box, Chip, Alert, CircularProgress,
  List, ListItem, ListItemText, IconButton, Switch,
  OutlinedInput, SelectChangeEvent
} from '@mui/material';
import { Timeline, TimelineItem, TimelineSeparator, TimelineConnector, TimelineContent, TimelineDot } from '@mui/lab';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';
import ClearIcon from '@mui/icons-material/Clear';
import LaunchIcon from '@mui/icons-material/Launch';

interface DuplicateCorrectionMockProps {
  studentName?: string;
}

export default function DuplicateCorrectionMock({ studentName = "Jean Dupont" }: DuplicateCorrectionMockProps) {
  const [open, setOpen] = useState(false);
  const [selectedClassIds, setSelectedClassIds] = useState<number[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [studentsToProcess, setStudentsToProcess] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [duplicationStatuses, setDuplicationStatuses] = useState<any[]>([]);
  const [assignToClass, setAssignToClass] = useState<boolean>(false);
  const [selectedClassId, setSelectedClassId] = useState<number | ''>('');
  const [useCustomGroup, setUseCustomGroup] = useState<boolean>(false);
  const [customGroupName, setCustomGroupName] = useState<string>('');

  // Classes et étudiants fictifs pour la démo
  const mockClasses = [
    { id: 1, name: "Classe de Physique-Chimie 1ère A" },
    { id: 2, name: "Classe de Physique-Chimie 1ère B" },
    { id: 3, name: "Classe de Physique-Chimie Terminale C" }
  ];

  const mockStudents = [
    { id: 1, first_name: "Marie", last_name: "Martin", email: "marie.martin@example.com", classes: [1] },
    { id: 2, first_name: "Paul", last_name: "Dubois", email: "paul.dubois@example.com", classes: [1] },
    { id: 3, first_name: "Sophie", last_name: "Bernard", email: "sophie.bernard@example.com", classes: [2] },
    { id: 4, first_name: "Lucas", last_name: "Thomas", email: "lucas.thomas@example.com", classes: [2] },
    { id: 5, first_name: "Emma", last_name: "Robert", email: "emma.robert@example.com", classes: [3] },
  ];

  const handleOpen = () => {
    setOpen(true);
    setDuplicationStatuses([]);
  };

  const handleClose = () => {
    if (submitting) return;
    setOpen(false);
    setSelectedClassIds([]);
    setSelectedStudentIds([]);
    setStudentsToProcess([]);
    setDuplicationStatuses([]);
  };

  const handleClassChange = (event: SelectChangeEvent<number[]>) => {
    const newSelectedClasses = event.target.value as number[];
    setSelectedClassIds(newSelectedClasses);
  };

  const handleStudentChange = (event: SelectChangeEvent<number[]>) => {
    const newSelectedStudents = event.target.value as number[];
    setSelectedStudentIds(newSelectedStudents);
    
    // Add newly selected students to the process list
    const newStudents = newSelectedStudents
      .filter(id => !studentsToProcess.some(s => s.id === id))
      .map(id => {
        const student = mockStudents.find(s => s.id === id)!;
        return {
          id: student.id,
          first_name: student.first_name,
          last_name: student.last_name,
          email: student.email,
          originalEmail: student.email,
          customEmail: student.email,
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

  const handleRemoveStudent = (studentId: number) => {
    setStudentsToProcess(prev => prev.filter(s => s.id !== studentId));
    setSelectedStudentIds(prev => prev.filter(id => id !== studentId));
  };

  const handleDuplicate = () => {
    if (studentsToProcess.length === 0) {
      return;
    }

    setSubmitting(true);
    
    // Initialize duplication statuses
    const initialStatuses: any[] = studentsToProcess.map(student => ({
      studentId: student.id,
      status: 'pending'
    }));
    
    setDuplicationStatuses(initialStatuses);
    
    // Simuler la duplication
    let currentIndex = 0;
    
    const processNext = () => {
      if (currentIndex >= studentsToProcess.length) {
        setSubmitting(false);
        return;
      }
      
      const student = studentsToProcess[currentIndex];
      
      // Update status to processing
      setDuplicationStatuses(prev => 
        prev.map(s => s.studentId === student.id ? { ...s, status: 'processing' } : s)
      );
      
      // Simuler un délai
      setTimeout(() => {
        // Update status to success
        setDuplicationStatuses(prev => 
          prev.map(s => s.studentId === student.id 
            ? { ...s, status: 'success', newCorrectionId: Math.floor(Math.random() * 1000) } 
            : s
          )
        );
        
        currentIndex++;
        processNext();
      }, 1000);
    };
    
    processNext();
  };

  // Filtrer les étudiants selon les classes sélectionnées
  const filteredStudents = mockStudents.filter(student => 
    selectedClassIds.length === 0 || student.classes.some(c => selectedClassIds.includes(c))
  );

  return (
    <>
      <Button
        variant="outlined"
        color="primary"
        startIcon={<ContentCopyIcon />}
        onClick={handleOpen}
      >
        Dupliquer cette correction
      </Button>
      
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Dupliquer la correction pour d'autres étudiants</DialogTitle>
        <DialogContent>
          {/* Class selection */}
          <FormControl fullWidth sx={{ mb: 2, mt: 1 }}>
            <InputLabel id="class-select-label-mock">Filtrer par classes</InputLabel>
            <Select
              labelId="class-select-label-mock"
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
                        label={mockClasses.find(c => c.id === value)?.name} 
                        size="small"
                      />
                    ))
                  )}
                </Box>
              )}
              startAdornment={<SchoolIcon sx={{ mr: 1, color: 'text.secondary' }} />}
              displayEmpty
            >
              {mockClasses.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </Select>
            <Typography variant="caption" className="text-gray-500 mt-1 block">
              Sélectionnez une ou plusieurs classes pour filtrer les étudiants
            </Typography>
          </FormControl>
          
          {/* Student selection */}
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel id="student-select-label-mock">Sélectionner des étudiants</InputLabel>
            <Select
              labelId="student-select-label-mock"
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
                      const student = mockStudents.find(s => s.id === value)!;
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
              {filteredStudents.map((student) => (
                <MenuItem key={student.id} value={student.id}>
                  {student.first_name} {student.last_name}
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                    ({mockClasses.find(c => c.id === student.classes[0])?.name})
                  </Typography>
                </MenuItem>
              ))}
            </Select>
            <Typography variant="caption" className="text-gray-500 mt-1 block">
              Sélectionnez un ou plusieurs étudiants pour cette duplication
            </Typography>
          </FormControl>
          
          {/* Assignation à une classe */}
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
                  <InputLabel id="assign-class-label-mock">Classe</InputLabel>
                  <Select
                    labelId="assign-class-label-mock"
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value as number)}
                    input={<OutlinedInput label="Classe" />}
                    startAdornment={<SchoolIcon sx={{ mr: 1, color: 'text.secondary' }} />}
                    displayEmpty
                  >
                    <MenuItem value="">
                      <em>Sélectionner une classe</em>
                    </MenuItem>
                    {mockClasses.map((c) => (
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
          
          {/* Liste des étudiants sélectionnés */}
          {studentsToProcess.length > 0 && (
            <Box sx={{ mb: 3, mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Étudiants sélectionnés
              </Typography>
              
              <List>
                {studentsToProcess.map((student) => (
                  <ListItem
                    key={student.id}
                    secondaryAction={
                      <IconButton 
                        edge="end" 
                        onClick={() => handleRemoveStudent(student.id)}
                        aria-label="remove"
                      >
                        <ClearIcon />
                      </IconButton>
                    }
                    sx={{ px: 0 }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={`${student.first_name} ${student.last_name}`}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </Box>
                      }
                      secondary={
                        <TextField
                          size="small"
                          value={student.customEmail}
                          onChange={(e) => handleEmailChange(student.id, e.target.value)}
                          placeholder="Email"
                          fullWidth
                          margin="dense"
                          sx={{
                            '& .MuiInputBase-input': {
                              color: student.isEmailModified ? 'warning.main' : 'inherit',
                              fontWeight: student.isEmailModified ? 'medium' : 'normal',
                            }
                          }}
                          slotProps={{
                            input: {
                              endAdornment: student.isEmailModified && (
                                <Box 
                                  component="span" 
                                  sx={{ 
                                    fontSize: '0.75rem', 
                                    color: 'warning.main',
                                    ml: 1
                                  }}
                                >
                                  (modifié)
                                </Box>
                              )
                            }
                          }}
                        />
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
          
          {/* Timeline pour le statut de duplication */}
          {duplicationStatuses.length > 0 && (
            <Box sx={{ mt: 3, mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Statut de la duplication
              </Typography>
              <Timeline position="right">
                {duplicationStatuses.map((status) => {
                  const student = studentsToProcess.find(s => s.id === status.studentId);
                  
                  return (
                    <TimelineItem key={status.studentId}>
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
                            {status.status === 'error' && ` - Erreur`}
                          </Typography>
                          
                          {/* Link to the duplicated correction */}
                          {status.status === 'success' && status.newCorrectionId && (
                            <IconButton
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
