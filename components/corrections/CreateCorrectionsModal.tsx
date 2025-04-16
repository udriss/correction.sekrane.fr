import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Paper,
  Box,
  CircularProgress,
  Alert,
  FormHelperText,
  Divider,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import LayersIcon from '@mui/icons-material/Layers';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InlineCorrectionsForm from './InlineCorrectionsForm';
import { Class, ClassStudent, Student } from '@/lib/types';
import { n } from 'framer-motion/dist/types.d-B50aGbjN';

// Define the Student type needed for the InlineCorrectionsForm
interface FormStudent {
  id: number; 
  name: string;
  experimentalGrade: string;
  theoreticalGrade: string;
  firstName: string;
  lastName: string;
}

interface CreateCorrectionsModalProps {
  open: boolean;
  activityId: number;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateCorrectionsModal({
  open,
  activityId,
  onClose,
  onSuccess
}: CreateCorrectionsModalProps) {
  const router = useRouter();
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [selectedSubClass, setSelectedSubClass] = useState<string>('');
  const [classStudents, setClassStudents] = useState<ClassStudent[]>([]);
  const [students, setStudents] = useState<FormStudent[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingClassStudents, setLoadingClassStudents] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [showCorrectionForm, setShowCorrectionForm] = useState(false);

  // Nouveau état pour stocker les données au format Student[]
  const [convertedStudents, setConvertedStudents] = useState<Student[]>([]);

  // Load classes when the modal opens
  useEffect(() => {
    if (open) {
      fetchClasses();
    }
  }, [open]);

  // Load students when class is selected
  useEffect(() => {
    if (selectedClassId) {
      fetchStudentsForClass(selectedClassId);
    } else {
      setClassStudents([]);
      setStudents([]);
    }
  }, [selectedClassId]);

  // Filter students when subclass changes
  useEffect(() => {
    if (selectedSubClass && classStudents.length > 0) {
      const subClassNumber = parseInt(selectedSubClass, 10);
      
      // Filter by sub_class field
      const filteredStudents = classStudents.filter(student => 
        student.sub_class === subClassNumber
      );
      
      // Convert to the format needed for corrections
      const formattedStudents = filteredStudents.map(student => ({
        id: student.student_id,
        name: `${student.first_name} ${student.last_name}`,
        firstName: student.first_name || '',
        lastName: student.last_name || '',
        experimentalGrade: '0',
        theoreticalGrade: '0'
      }));
      
      setStudents(formattedStudents);
    } else if (classStudents.length > 0) {
      // No subclass filter, format all students
      const formattedStudents = classStudents.map(student => ({
        id: student.student_id,
        name: `${student.first_name} ${student.last_name}`,
        firstName: student.first_name || '',
        lastName: student.last_name || '',
        experimentalGrade: '0',
        theoreticalGrade: '0'
      }));
      
      setStudents(formattedStudents);
    }
  }, [selectedSubClass, classStudents]);

  const fetchClasses = async () => {
    try {
      setLoadingClasses(true);
      const response = await fetch('/api/classes');
      if (!response.ok) throw new Error('Failed to load classes');
      
      const data = await response.json();
      setClasses(data);
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setLoadingClasses(false);
    }
  };

  const fetchStudentsForClass = async (classId: string) => {
    if (!classId) return;
    
    setLoadingClassStudents(true);
    try {
      const response = await fetch(`/api/classes/${classId}/students`);
      if (!response.ok) throw new Error('Failed to load students');
      
      const data = await response.json();
      setClassStudents(data);
      
      // Format the students for initial display
      const formattedStudents = data.map((student: ClassStudent) => ({
        id : student.student_id,
        name: `${student.first_name} ${student.last_name}`,
        firstName: student.first_name,
        lastName: student.last_name,
        experimentalGrade: '0',
        theoreticalGrade: '0'
      }));
      
      setStudents(formattedStudents);
    } catch (error) {
      console.error('Error fetching students:', error);
      setClassStudents([]);
      setStudents([]);
    } finally {
      setLoadingClassStudents(false);
    }
  };

  const handleClassChange = (event: any) => {
    const classId = event.target.value;
    setSelectedClassId(classId);
    setSelectedSubClass('');
    
    // Find the selected class object
    const selectedClass = classes.find(c => c.id.toString() === classId) || null;
    setSelectedClass(selectedClass);
  };

  const handleSubClassChange = (event: any) => {
    setSelectedSubClass(event.target.value);
  };

  const handleProceedToCorrections = () => {
    if (selectedClassId && students.length > 0) {
      setCurrentStep(1);
      setShowCorrectionForm(true);
    }
  };

  // Handle success from the correction form
  const handleCorrectionsSuccess = () => {
    // Close the modal and notify parent
    setTimeout(() => {
      if (onSuccess) onSuccess();
      onClose();
    }, 1500);
  };

  // Fetch activity details when opening the modal
  useEffect(() => {
    if (open && activityId) {
      fetch(`/api//api/activities/${activityId}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) setSelectedActivity(data);
        })
        .catch(err => console.error('Error fetching activity details:', err));
    }
  }, [open, activityId]);

  // Effect pour convertir les FormStudent en Student
  useEffect(() => {
    if (students.length > 0) {
      const converted: Student[] = students.map((s, index) => ({
        id: s.id ?? -1, // Use negative index as ID if s.id is undefined
        email: "",
        first_name: s.firstName,
        last_name: s.lastName,
        gender: "N" // default to Neutral as a valid gender value
      }));
      
      setConvertedStudents(converted);
    } else {
      setConvertedStudents([]);
    }
  }, [students]);

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
    >
      <DialogTitle>
        Ajouter des corrections pour{selectedActivity ? ` : ${selectedActivity.name}` : ' l\'activité'}
      </DialogTitle>
      <DialogContent>
        {!showCorrectionForm ? (
          <div className="space-y-4">
            <Stepper activeStep={currentStep} alternativeLabel sx={{ my: 3 }}>
              <Step>
                <StepLabel>Sélectionner une classe</StepLabel>
              </Step>
              <Step>
                <StepLabel>Attribuer des notes</StepLabel>
              </Step>
            </Stepper>
            
            {/* Always show the explanation */}
            <Paper variant="outlined" className="p-4 bg-blue-50 border-blue-200">
              <Typography variant="subtitle2" component="div" sx={{ mb: 0, fontWeight: 'bold', color: '#1E40AF' }}>
                Sélectionnez une classe :
              </Typography>
              <Typography variant="body2">
                Choisissez une classe pour importer automatiquement tous ses étudiants.
                Vous pourrez ensuite attribuer des notes à chaque étudiant.
              </Typography>
            </Paper>
            
            {/* Class selection */}
            <FormControl fullWidth variant="outlined" sx={{ mt: 3 }}>
              <InputLabel id="class-select-label">Classe</InputLabel>
              <Select
                labelId="class-select-label"
                id="class-select"
                value={selectedClassId}
                onChange={handleClassChange}
                label="Classe"
                startAdornment={
                  loadingClasses ? (
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                  ) : (
                    <SchoolIcon sx={{ mr: 1, color: 'primary.main' }} />
                  )
                }
                disabled={loadingClasses}
              >
                {classes.map((cls) => (
                  <MenuItem key={cls.id} value={cls.id.toString()}>
                    {cls.name} ({cls.academic_year})
                  </MenuItem>
                ))}
              </Select>
              {loadingClasses && (
                <Typography variant="caption" color="text.secondary">
                  Chargement des classes...
                </Typography>
              )}
            </FormControl>
            
            {/* Subclass selection */}
            {selectedClass && selectedClass.nbre_subclasses && selectedClass.nbre_subclasses > 0 && (
              <FormControl fullWidth variant="outlined" sx={{ mt: 2 }}>
                <InputLabel id="subclass-select-label">Sous-classe</InputLabel>
                <Select
                  labelId="subclass-select-label"
                  id="subclass-select"
                  value={selectedSubClass}
                  onChange={handleSubClassChange}
                  label="Sous-classe"
                  startAdornment={
                    <LayersIcon sx={{ mr: 1, color: 'secondary.main' }} />
                  }
                >
                  <MenuItem value="">
                    <em>Toute la classe</em>
                  </MenuItem>
                  {Array.from({ length: selectedClass.nbre_subclasses }, (_, i) => i + 1).map((num) => (
                    <MenuItem key={num} value={num.toString()}>
                      Groupe {num}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  Sélectionnez un groupe spécifique ou laissez vide pour toute la classe
                </FormHelperText>
              </FormControl>
            )}
            
            {/* Divider and results */}
            {selectedClassId && <Divider sx={{ my: 3 }} />}
            
            {/* Loading indicator, success and warning messages */}
            {loadingClassStudents && (
              <Box display="flex" justifyContent="center" mt={2} mb={2}>
                <CircularProgress size={40} />
              </Box>
            )}
            
            {selectedClassId && classStudents.length > 0 && !loadingClassStudents && (
              <Alert 
                severity="success" 
                icon={<CheckCircleIcon />}
                variant="filled"
                className="mt-2 animate-fadeIn"
              >
                <Typography variant="subtitle2">
                  {students.length} étudiant(s) importé(s) avec succès !
                </Typography>
                <Typography variant="body2">
                  {selectedSubClass ? `Groupe ${selectedSubClass} uniquement.` : 'Tous les étudiants de la classe.'}
                </Typography>
              </Alert>
            )}
            
            {selectedClassId && classStudents.length === 0 && !loadingClassStudents && (
              <Alert 
                severity="warning" 
                className="mt-2"
              >
                Aucun étudiant trouvé dans cette classe. Ajoutez d'abord des étudiants à la classe.
              </Alert>
            )}
          </div>
        ) : (
          <InlineCorrectionsForm 
            activityId={activityId}
            activityName={selectedActivity?.name || 'Activité'}
            classId={parseInt(selectedClassId)}
            subClassId={selectedSubClass || undefined}
            experimentalPoints={selectedActivity?.experimental_points || 10}
            theoreticalPoints={selectedActivity?.theoretical_points || 10}
            students={students} // Utiliser les étudiants convertis au format Student[]
            onCancel={() => {
              setShowCorrectionForm(false);
              setCurrentStep(0);
            }}
            onSuccess={handleCorrectionsSuccess}
          />
        )}
      </DialogContent>
      {!showCorrectionForm && (
        <DialogActions>
          <Button onClick={onClose} color="inherit">
            Annuler
          </Button>
          <Button 
            onClick={handleProceedToCorrections}
            variant="contained" 
            disabled={selectedClassId === '' || students.length === 0}
            color="primary"
          >
            Suivant
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}
