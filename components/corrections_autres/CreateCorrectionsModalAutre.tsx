import React, { useState, useEffect } from 'react';
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
  StepLabel,
  Checkbox,
  FormControlLabel,
  TextField,
  SelectChangeEvent
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import LayersIcon from '@mui/icons-material/Layers';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import GroupIcon from '@mui/icons-material/Group';
import { Student, ActivityAutre } from '@/lib/types';

interface CreateCorrectionsModalAutreProps {
  open: boolean;
  onClose: () => void;
  onCreateCorrections: (data: { 
    activityId: number; 
    studentIds: number[]; 
    createGroup: boolean; 
    groupName?: string 
  }) => Promise<void>;
  students: Student[];
  activities: ActivityAutre[];
  isCorrectionAutre: boolean;
}

export default function CreateCorrectionsModalAutre({
  open,
  onClose,
  onCreateCorrections,
  students,
  activities,
  isCorrectionAutre
}: CreateCorrectionsModalAutreProps) {
  // État pour suivre l'activité sélectionnée
  const [selectedActivityId, setSelectedActivityId] = useState<number | ''>('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [createGroup, setCreateGroup] = useState<boolean>(false);
  const [groupName, setGroupName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(0);

  // Réinitialiser les sélections quand le modal est ouvert/fermé
  useEffect(() => {
    if (open) {
      setSelectedActivityId('');
      setSelectedStudentIds([]);
      setCreateGroup(false);
      setGroupName('');
      setError(null);
      setCurrentStep(0);
    }
  }, [open]);

  // Gérer la sélection d'une activité
  const handleActivityChange = (event: SelectChangeEvent<number | string>) => {
    setSelectedActivityId(event.target.value as number);
  };

  // Gérer la sélection/désélection de tous les étudiants
  const handleSelectAllStudents = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedStudentIds(students.map(student => student.id));
    } else {
      setSelectedStudentIds([]);
    }
  };

  // Gérer la sélection/désélection d'un étudiant
  const handleSelectStudent = (studentId: number) => {
    setSelectedStudentIds(prevIds => {
      if (prevIds.includes(studentId)) {
        return prevIds.filter(id => id !== studentId);
      } else {
        return [...prevIds, studentId];
      }
    });
  };

  // Vérifier si tous les étudiants sont sélectionnés
  const allStudentsSelected = students.length > 0 && selectedStudentIds.length === students.length;
  
  // Vérifier si le formulaire est valide pour passer à l'étape suivante
  const isStepOneValid = selectedActivityId !== '' && selectedStudentIds.length > 0;
  const isStepTwoValid = !createGroup || (createGroup && groupName.trim() !== '');

  // Gérer le passage à l'étape suivante
  const handleNext = () => {
    if (currentStep === 0 && isStepOneValid) {
      setCurrentStep(1);
    }
  };

  // Gérer le retour à l'étape précédente
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Gérer la soumission du formulaire
  const handleSubmit = async () => {
    if (!isStepTwoValid) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await onCreateCorrections({
        activityId: selectedActivityId as number,
        studentIds: selectedStudentIds,
        createGroup,
        groupName: createGroup ? groupName : undefined
      });
      
      // La fermeture sera gérée par le parent après le succès
    } catch (err) {
      console.error('Erreur lors de la création des corrections:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue lors de la création des corrections');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        Créer des corrections multiples
      </DialogTitle>
      
      <DialogContent>
        <Stepper activeStep={currentStep} alternativeLabel sx={{ my: 3 }}>
          <Step>
            <StepLabel>Sélection des étudiants et de l'activité</StepLabel>
          </Step>
          <Step>
            <StepLabel>Options de groupe</StepLabel>
          </Step>
        </Stepper>
        
        {currentStep === 0 ? (
          <Box>
            {/* Sélection de l'activité */}
            <FormControl fullWidth margin="normal">
              <InputLabel id="activity-select-label">Activité</InputLabel>
              <Select
                labelId="activity-select-label"
                value={selectedActivityId}
                onChange={handleActivityChange}
                label="Activité"
                startAdornment={
                  <LayersIcon sx={{ mr: 1, color: 'primary.main' }} />
                }
              >
                <MenuItem value="" disabled>
                  <em>Sélectionner une activité</em>
                </MenuItem>
                {activities.map((activity) => (
                  <MenuItem key={activity.id} value={activity.id}>
                    {activity.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Divider sx={{ my: 2 }} />
            
            {/* Sélection des étudiants */}
            <Typography variant="subtitle1" gutterBottom>
              Sélectionner les étudiants
            </Typography>
            
            <FormControlLabel
              control={
                <Checkbox
                  checked={allStudentsSelected}
                  onChange={handleSelectAllStudents}
                  indeterminate={selectedStudentIds.length > 0 && !allStudentsSelected}
                />
              }
              label="Sélectionner tous les étudiants"
            />
            
            <Box sx={{ 
              maxHeight: '300px', 
              overflow: 'auto', 
              mt: 2, 
              border: '1px solid #ddd', 
              borderRadius: 1,
              p: 1 
            }}>
              {students.length === 0 ? (
                <Alert severity="info">
                  Aucun étudiant disponible.
                </Alert>
              ) : (
                students.map((student) => (
                  <FormControlLabel
                    key={student.id}
                    control={
                      <Checkbox
                        checked={selectedStudentIds.includes(student.id)}
                        onChange={() => handleSelectStudent(student.id)}
                      />
                    }
                    label={`${student.first_name} ${student.last_name}`}
                    sx={{ display: 'block', mb: 0.5 }}
                  />
                ))
              )}
            </Box>
            
            {selectedStudentIds.length > 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {selectedStudentIds.length} étudiant(s) sélectionné(s)
              </Typography>
            )}
          </Box>
        ) : (
          <Box>
            {/* Options de groupe */}
            <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: '#f9f9f9' }}>
              <Typography variant="subtitle1" gutterBottom>
                Récapitulatif
              </Typography>
              
              <Typography variant="body2">
                <strong>Activité:</strong> {activities.find(a => a.id === selectedActivityId)?.name || ''}
              </Typography>
              
              <Typography variant="body2">
                <strong>Étudiants sélectionnés:</strong> {selectedStudentIds.length}
              </Typography>
            </Paper>

            <FormControlLabel
              control={
                <Checkbox
                  checked={createGroup}
                  onChange={(e) => setCreateGroup(e.target.checked)}
                />
              }
              label="Créer un groupe pour ces corrections"
            />
            
            {createGroup && (
              <TextField
                label="Nom du groupe"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                fullWidth
                margin="normal"
                helperText="Ce nom sera utilisé pour regrouper les corrections"
                required
                error={groupName.trim() === ''}
                slotProps={{
                  input: { 
                    startAdornment: <GroupIcon sx={{ mr: 1, color: 'primary.main' }} />,
                    }
                }}
              />
            )}
            
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        {currentStep > 0 && (
          <Button onClick={handleBack} disabled={loading}>
            Retour
          </Button>
        )}
        
        <Button onClick={onClose} color="inherit" disabled={loading}>
          Annuler
        </Button>
        
        {currentStep === 0 ? (
          <Button 
            variant="contained" 
            onClick={handleNext}
            disabled={!isStepOneValid || loading}
          >
            Suivant
          </Button>
        ) : (
          <Button 
            variant="contained" 
            onClick={handleSubmit}
            disabled={!isStepTwoValid || loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            Créer les corrections
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}