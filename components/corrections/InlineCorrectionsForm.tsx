'use client';

import React, { useState } from 'react';
import {
  Button,
  TextField,
  Box,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Slider,
  Chip,
  Typography,
  Paper,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';

import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import DeleteIcon from '@mui/icons-material/Delete';
import { Student as LibStudent } from '@/lib/types';

// Définir une interface compatible avec FormStudent
interface FormCompatibleStudent {
  id?: number;
  firstName?: string;
  lastName?: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  [key: string]: any; // permet d'autres propriétés
}

// Mise à jour de l'interface Student pour utiliser un ID au lieu du nom
interface StudentGrade {
  student_id: number | null; // Modifier pour utiliser student_id au lieu de name
  experimentalGrade: string;
  theoreticalGrade: string;
}

interface InlineCorrectionsFormProps {
  activityId: number;
  activityName: string;
  classId: number;
  subClassId?: string;
  experimentalPoints: number;
  theoreticalPoints: number;
  students: FormCompatibleStudent[]; // Utiliser l'interface compatible
  onCancel: () => void;
  onSuccess: () => void;
}

export default function InlineCorrectionsForm({
  activityId,
  activityName,
  classId,
  subClassId,
  experimentalPoints,
  theoreticalPoints,
  students: initialStudents, // Ces étudiants sont déjà filtrés par classe
  onCancel,
  onSuccess
}: InlineCorrectionsFormProps) {
  // Fonction pour normaliser un étudiant quelle que soit sa forme
  const normalizeStudent = (student: FormCompatibleStudent): { id: number | null, name: string } => {
    // Si c'est un Student de la librairie
    if ('first_name' in student && 'last_name' in student) {
      return {
        id: student.id || null,
        name: `${student.first_name} ${student.last_name}`
      };
    }
    // Si c'est un FormStudent
    else if ('firstName' in student && 'lastName' in student) {
      return {
        id: student.id || null,
        name: `${student.firstName} ${student.lastName}`
      };
    }
    // Fallback
    return {
      id: student.id || null,
      name: student.name || 'Sans nom'
    };
  };

  // Convertir initialStudents en StudentGrade - initialiser avec des étudiants déjà existants
  const [studentGrades, setStudentGrades] = useState<StudentGrade[]>(
    initialStudents.length > 0 
      ? initialStudents.map(student => {
          const normalized = normalizeStudent(student);
          return {
            student_id: normalized.id,
            experimentalGrade: '0',
            theoreticalGrade: '0'
          };
        })
      : [] // Si aucun étudiant fourni, commencer avec un tableau vide
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Supprimer la requête qui charge tous les étudiants
  // Nous utilisons simplement les étudiants fournis par les props

  // Function to delete a student
  const handleDeleteStudent = (index: number) => {
    setStudentGrades(prev => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });
  };

  // Functions to change grades with sliders
  const handleExperimentalGradeChange = (index: number, value: number | number[]) => {
    const newValue = typeof value === 'number' ? value : value[0];
    setStudentGrades(prev => {
      const updated = [...prev];
      updated[index].experimentalGrade = newValue.toFixed(2);
      return updated;
    });
  };

  const handleTheoreticalGradeChange = (index: number, value: number | number[]) => {
    const newValue = typeof value === 'number' ? value : value[0];
    setStudentGrades(prev => {
      const updated = [...prev];
      updated[index].theoreticalGrade = newValue.toFixed(2);
      return updated;
    });
  };

  // Fonction pour gérer le changement d'étudiant - utiliser initialStudents au lieu de availableStudents
  const handleStudentChange = (index: number, studentId: number | null) => {
    setStudentGrades(prev => {
      const updated = [...prev];
      updated[index].student_id = studentId;
      return updated;
    });
  };

  // Fonction pour ajouter un nouvel étudiant vide
  const handleAddStudent = () => {
    setStudentGrades(prev => [
      ...prev, 
      { 
        student_id: null, 
        experimentalGrade: '0', 
        theoreticalGrade: '0' 
      }
    ]);
  };

  const calculateTotalGrade = (experimentalGrade: string, theoreticalGrade: string) => {
    const expGrade = parseFloat(experimentalGrade) || 0;
    const theoGrade = parseFloat(theoreticalGrade) || 0;
    return (expGrade + theoGrade).toFixed(1);
  };

  const handleCreateCorrections = async () => {
    if (studentGrades.length === 0) {
      setError('Veuillez ajouter des étudiants');
      return;
    }
    
    setSaving(true);
    setError('');
    
    try {
      const createdCorrectionIds: string[] = [];
      const defaultDeadline = new Date().toISOString().split('T')[0];
      const submissionDate = new Date().toISOString().split('T')[0];
  
      for (let i = 0; i < studentGrades.length; i++) {
        const student = studentGrades[i];
        // Ne pas créer de correction pour les étudiants sans ID
        if (!student.student_id) continue;
        
        const expGrade = parseFloat(student.experimentalGrade) || 0;
        const theoGrade = parseFloat(student.theoreticalGrade) || 0;
        
        // Create correction data
        const correctionData = {
          activity_id: activityId,
          student_id: student.student_id, // Utiliser student_id au lieu de student_name
          experimental_points_earned: expGrade,
          theoretical_points_earned: theoGrade,
          experimental_points: experimentalPoints,
          theoretical_points: theoreticalPoints,
          content: "",
          deadline: defaultDeadline,
          submission_date: submissionDate,
          class_id: classId,
          ...(subClassId && { sub_class: parseInt(subClassId) })
        };
        
        const createResponse = await fetch('/api/corrections', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(correctionData),
        });
        
        if (!createResponse.ok) {
          const errorData = await createResponse.json().catch(() => ({}));
          const studentName = getStudentName(student.student_id);
          throw new Error(errorData.error || `Erreur lors de la création de la correction pour ${studentName}`);
        }
        
        const correction = await createResponse.json();
        createdCorrectionIds.push(correction.id);
      }
      
      setSuccessMessage(
        createdCorrectionIds.length === 1 
          ? "1 correction ajoutée avec succès" 
          : `${createdCorrectionIds.length} corrections ajoutées avec succès`
      );
      
      // Call onSuccess to notify parent component
      setTimeout(() => {
        onSuccess();
      }, 1000);
      
    } catch (err) {
      console.error('Erreur lors de la création des corrections:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la création des corrections');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    // Réinitialisation avec les étudiants fournis initialement
    if (initialStudents && initialStudents.length > 0) {
      const resetGrades = initialStudents.map(student => {
        const normalized = normalizeStudent(student);
        return {
          student_id: normalized.id,
          experimentalGrade: '0',
          theoreticalGrade: '0'
        };
      });
      
      setStudentGrades(resetGrades);
    } else {
      setStudentGrades([]);
    }
    
    setError('');
    setSuccessMessage('');
  };

  // Fonction pour obtenir le nom d'un étudiant à partir de son ID
  const getStudentName = (studentId: number | null): string => {
    if (!studentId) return 'Sans nom';
    const student = initialStudents.find(s => s.id === studentId); // Utiliser initialStudents
    if (!student) return 'Étudiant inconnu';
    
    // Gérer les différentes formes possibles de l'étudiant
    if ('first_name' in student && 'last_name' in student) {
      return `${student.first_name} ${student.last_name}`;
    } else if ('firstName' in student && 'lastName' in student) {
      return `${student.firstName} ${student.lastName}`;
    }
    return student.name || 'Sans nom';
  };

  return (
    <div className="space-y-6">

      {error && (
        <Alert severity="error" className="mb-4 animate-fadeIn">
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" className="mb-4 animate-fadeIn">
          {successMessage}
        </Alert>
      )}

      {/* Students list */}
      <Paper className="p-6 rounded-lg shadow-md border-t-4 border-amber-600">
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <div className="flex items-center gap-2">
            <PersonAddIcon className="text-amber-600" fontSize="large" />
            <Typography variant="h5" className="font-bold">
              Liste des étudiants ({studentGrades.length})
            </Typography>
            <Button 
              variant="outlined" 
              color="primary" 
              size="small"
              onClick={handleAddStudent}
              startIcon={<PersonAddIcon />}
            >
              Ajouter
            </Button>
          </div>
          
          <Button
            variant="outlined"
            color="success"
            onClick={handleCreateCorrections}
            startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            disabled={saving || studentGrades.length === 0}
          >
            {saving ? 'Enregistrement...' : 'Ajouter les corrections'}
          </Button>
        </Box>

        {/* Table with improved design */}
        <TableContainer className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <Table size="small">
            <TableHead className="bg-gradient-to-r from-gray-100 to-blue-50">
              <TableRow>
                <TableCell align="left" width="40px"></TableCell>
                <TableCell align="left">Prénom / Nom</TableCell>
                <TableCell align="center">Note exp. /{experimentalPoints}</TableCell>
                <TableCell align="center">Note théo. /{theoreticalPoints}</TableCell>
                <TableCell align="center">Total / 20</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {studentGrades.map((studentGrade, index) => {
                const student = initialStudents.find(s => s.id === studentGrade.student_id) || {};
                return (
                <TableRow 
                  key={index}
                  className={index % 2 === 0 ? 'bg-white hover:bg-blue-50' : 'bg-gray-50 hover:bg-blue-50'}
                >
                  <TableCell>
                    <IconButton
                      onClick={() => handleDeleteStudent(index)}
                      color="error"
                      size="small"
                      title="Supprimer cet étudiant"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                  <TableCell>
                    <FormControl fullWidth size="small">
                      <InputLabel>Étudiant</InputLabel>
                      <Select
                        value={studentGrade.student_id === null ? '' : studentGrade.student_id.toString()}
                        onChange={(e) => handleStudentChange(
                          index, 
                          e.target.value === '' ? null : Number(e.target.value)
                        )}
                        label="Étudiant"
                      >
                        <MenuItem value="">
                          <em>Aucun</em>
                        </MenuItem>
                        {initialStudents.map((s) => (
                          <MenuItem key={s.id} value={s.id}>
                            {s.firstName || s.first_name} {s.lastName || s.last_name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell align="center" className="px-2">
                    <Slider
                      value={parseFloat(studentGrade.experimentalGrade) || 0}
                      onChange={(_, newValue) => handleExperimentalGradeChange(index, newValue)}
                      step={0.5}
                      min={0}
                      max={experimentalPoints}
                      valueLabelDisplay="auto"
                      size="small"
                      className="mx-1"
                    />
                  </TableCell>
                  <TableCell align="center" className="px-2">
                    <Slider
                      value={parseFloat(studentGrade.theoreticalGrade) || 0}
                      onChange={(_, newValue) => handleTheoreticalGradeChange(index, newValue)}
                      step={0.5}
                      min={0}
                      max={theoreticalPoints}
                      valueLabelDisplay="auto"
                      size="small"
                      className="mx-1"
                    />
                  </TableCell>
                  <TableCell align="center" className="font-medium">
                    <Chip 
                      label={calculateTotalGrade(studentGrade.experimentalGrade, studentGrade.theoreticalGrade)} 
                      color="primary" 
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              )})}
            </TableBody>
          </Table>
        </TableContainer>
        
        <Box mt={4} display="flex" gap={2} justifyContent="space-between">
          <div>
            <Button
              onClick={handleReset}
              color="error"
              variant="outlined"
              startIcon={<CloseIcon />}
              size="small"
            >
              Recommencer
            </Button>
          </div>
          <div>
            <Button
              onClick={onCancel}
              color="inherit"
              variant="outlined"
              startIcon={<CloseIcon />}
              size="small"
            >
              Annuler
            </Button>
          </div>
        </Box>
      </Paper>
    </div>
  );
}
