import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Button,
  Box,
  Typography,
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
  FormControlLabel,
  Chip,
  Avatar,
  InputAdornment,
  Tooltip,
  IconButton,
  Select,
  MenuItem,
  InputLabel,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  Divider,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import PersonIcon from '@mui/icons-material/Person';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import EmailIcon from '@mui/icons-material/Email';
import WcIcon from '@mui/icons-material/Wc';
import SchoolIcon from '@mui/icons-material/School';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import GroupsIcon from '@mui/icons-material/Groups';
import { Student, Class } from '@/app/students/page';
import MaleIcon from '@mui/icons-material/Male';
import FemaleIcon from '@mui/icons-material/Female';
import NotInterestedIcon from '@mui/icons-material/NotInterested';
import GpsNotFixedIcon from '@mui/icons-material/GpsNotFixed';
import GradientBackground from '@/components/ui/GradientBackground';
import H1Title from '@/components/ui/H1Title';
import { text } from 'stream/consumers';

interface StudentEditDialogProps {
  open: boolean;
  student: Student | null;
  classes: Class[];
  selectedClasses: { id: number, name: string }[];
  availableSubgroups: string[];
  loadingSubgroups: boolean;
  onClose: () => void;
  onSave: () => void;
  onStudentChange: (student: Student | null) => void;
  onSelectedClassesChange: (classes: { id: number, name: string }[]) => void;
  fetchClassSubgroups: (classId: number) => void;
}

interface ValidationError {
  email?: string;
  existingStudent?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  [key: string]: any;
}

const StudentEditDialog: React.FC<StudentEditDialogProps> = ({
  open,
  student,
  classes,
  selectedClasses,
  availableSubgroups,
  loadingSubgroups,
  onClose,
  onSave,
  onStudentChange,
  onSelectedClassesChange,
  fetchClassSubgroups
}) => {
  const router = useRouter();
  const [classSubgroups, setClassSubgroups] = useState<{[classId: number]: string}>({});
  const [validationErrors, setValidationErrors] = useState<ValidationError>({});
  const [existingStudent, setExistingStudent] = useState<Student | null>(null);
  
  if (!student) return null;
  
  // Map to track which class IDs are selected
  const selectedClassIds = selectedClasses.map(cls => cls.id);

  // Handle class selection/deselection
  const handleClassToggle = (cls: Class) => {
    const currentIndex = selectedClassIds.indexOf(cls.id);
    const newSelectedClasses = [...selectedClasses];
    
    if (currentIndex === -1) {
      // Add class
      newSelectedClasses.push({ id: cls.id, name: cls.name });
      
      // If this is the first or only class, set it as primary and fetch subgroups
      if (newSelectedClasses.length === 1) {
        onStudentChange({ ...student, classId: cls.id });
        fetchClassSubgroups(cls.id);
      }
    } else {
      // Remove class
      newSelectedClasses.splice(currentIndex, 1);
      
      // If we removed the primary class, update
      if (student.classId === cls.id) {
        if (newSelectedClasses.length > 0) {
          // Set the first remaining class as primary
          onStudentChange({ 
            ...student, 
            classId: newSelectedClasses[0].id,
            group: undefined 
          });
          fetchClassSubgroups(newSelectedClasses[0].id);
        } else {
          // No classes left
          onStudentChange({ ...student, classId: undefined, group: undefined });
        }
      }
    }
    
    onSelectedClassesChange(newSelectedClasses);
  };

  // Handle subgroup change for a specific class
  const handleSubgroupChange = (classId: number, value: string) => {
    // Only update if it's the primary class
    if (classId === student.classId) {
      onStudentChange({
        ...student,
        group: value
      });
    }
    
    // Also track the subgroup association for this class
    setClassSubgroups({
      ...classSubgroups,
      [classId]: value
    });
  };

  // Fonction pour charger les détails de l'étudiant existant
  const loadExistingStudent = async (studentId: number) => {
    try {
      const response = await fetch(`/api/students/${studentId}`);
      if (!response.ok) throw new Error('Erreur lors du chargement');
      const data = await response.json();
      onStudentChange(data); // Met à jour le formulaire avec les données de l'étudiant existant
    } catch (error) {
      console.error('Erreur lors du chargement de l\'étudiant:', error);
    }
  };

  // Modifier handleSave pour gérer l'erreur de duplication
  const handleSave = async () => {
    try {
      const response = await fetch(`/api/students/${student.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(student)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.code === 'DUPLICATE_EMAIL') {
          setValidationErrors({
            email: errorData.details,
            existingStudent: errorData.existingStudent
          });
          return;
        }
        throw new Error(errorData.error || 'Erreur lors de la sauvegarde');
      }

      onSave();
    } catch (error) {
      console.error('Error saving student:', error);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ p: 0 }}>
        <GradientBackground
          variant="primary"
          sx={{ 
            p: 3, 
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}
        >
            <Avatar 
            sx={{ 
              width: 56, 
              height: 56, 
              bgcolor: student.gender === 'M' ? 'info.main' : 
                  student.gender === 'F' ? 'secondary.light' : 
                  'grey.500',
              fontSize: '1.5rem',
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
            }}
            >
            {student.gender === 'M' ? <MaleIcon fontSize="large" /> : 
             student.gender === 'F' ? <FemaleIcon fontSize="large" /> : 
             student.gender === 'N' ? <GpsNotFixedIcon fontSize="large" /> : 
             <NotInterestedIcon fontSize="large" />}
            </Avatar>
          <Box>
            {/* Utilisation du composant H1Title standardisé */}
            <Typography variant="h4" fontWeight={700} color="text.primary">           
              Modifier l'étudiant
            </Typography>
            <Typography variant="h6" sx={{ color: 'text.secondary' }}>
              {student.first_name} {student.last_name}
            </Typography>
          </Box>
        </GradientBackground>
        
        {/* Summary chips section */}
        <Box sx={{ p: 2, display: 'flex', flexWrap: 'wrap', gap: 1, borderBottom: '1px solid rgba(0,0,0,0.12)' }}>
          <Chip 
            icon={<PersonOutlineIcon />}
            label={`${student.first_name} ${student.last_name}`} 
            color="primary" 
            variant="outlined"
          />
          <Chip 
            icon={<EmailIcon />}
            label={student.email} 
            color="default" 
            variant="outlined"
          />
          {student.classId && (
            <Chip 
              icon={<SchoolIcon />}
              label={classes.find(c => c.id === student.classId)?.name || 'Classe'}
              color="secondary" 
              variant="outlined"
            />
          )}
          {student.group && (
            <Chip 
              icon={<GroupsIcon />}
              label={`Groupe ${student.group}`} 
              color="info" 
              variant="outlined"
            />
          )}
          {student.gender && (
            <Chip 
              icon={<WcIcon />}
              label={student.gender === 'M' ? 'Homme' : student.gender === 'F' ? 'Femme' : 'Non spécifié'} 
              color="default" 
              variant="outlined"
            />
          )}
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {/* Informations personnelles */}
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon color="primary" fontSize="small" />
          Informations personnelles
        </Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 6, lg: 4 }}>
            <TextField
              label="Prénom"
              fullWidth
              value={student.first_name || ''}
              onChange={(e) => onStudentChange({ ...student, first_name: e.target.value })}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonOutlineIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 6, lg: 4 }}>
            <TextField
              label="Nom"
              fullWidth
              value={student.last_name || ''}
              onChange={(e) => onStudentChange({ ...student, last_name: e.target.value })}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonOutlineIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 6, lg: 4 }}>
            <TextField
              label="Email"
              fullWidth
              type="email"
              value={student.email || ''}
              onChange={(e) => {
                onStudentChange({ ...student, email: e.target.value });
                // Effacer l'erreur quand l'utilisateur modifie l'email
                setValidationErrors({ ...validationErrors, email: undefined });
              }}
              error={!!validationErrors.email}
              helperText={
                validationErrors.email ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" color="error">
                      {validationErrors.email}
                    </Typography>
                    {validationErrors.existingStudent && (
                      <Button
                        size="small"
                        color="primary"
                        onClick={() => loadExistingStudent(validationErrors.existingStudent!.id)}
                      >
                        Voir l'étudiant
                      </Button>
                    )}
                  </Box>
                ) : null
              }
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon fontSize="small" color={validationErrors.email ? "error" : "inherit"} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 6, lg: 4 }}>
            <FormControl component="fieldset">
              <FormLabel component="legend">Genre</FormLabel>
                <Box 
                sx={{ 
                  display: 'flex', 
                  width: '100%', 
                  borderRadius: 1,
                  overflow: 'hidden',
                  border: '1px solid rgba(0,0,0,0.12)',
                  mt: 1
                }}
                >
                {[
                  { value: 'M', label: 'Homme', icon: <MaleIcon /> },
                  { value: 'F', label: 'Femme', icon: <FemaleIcon /> },
                  { value: 'N', label: 'Non spécifié', icon: <GpsNotFixedIcon /> }
                ].map((option) => (
                  <Box
                  key={option.value}
                  onClick={() => onStudentChange({ ...student, gender: option.value as 'M' | 'F' | 'N' })}
                  sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 130,
                    py: 1.5,
                    cursor: 'pointer',
                    bgcolor: student.gender === option.value ? 'primary.light' : 'transparent',
                    color: student.gender === option.value ? 'primary.contrastText' : 'text.primary',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                    bgcolor: student.gender === option.value 
                      ? 'primary.main'
                      : 'rgba(0,0,0,0.04)',
                    },
                    borderRight: option.value !== 'N' ? '1px solid rgba(0,0,0,0.12)' : 'none'
                  }}
                  >
                  {option.icon}
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {option.label}
                  </Typography>
                  </Box>
                ))}
                </Box>
            </FormControl>
          </Grid>
        </Grid>

        {/* Affectation aux classes - Version simplifiée */}
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SchoolIcon color="primary" fontSize="small" />
          Affectation aux classes
        </Typography>
        
        <Box sx={{ border: '1px solid rgba(0, 0, 0, 0.12)', borderRadius: 1, p: 2, mb: 2 }}>
          <List sx={{ width: '100%', maxHeight: '300px', overflow: 'auto' }}>
            {classes.map((cls) => {
              const isSelected = selectedClassIds.includes(cls.id);
              const isPrimary = student.classId === cls.id;
              
              return (
                <React.Fragment key={cls.id}>
                  <ListItem 
                    sx={{ 
                      py: 1,
                      bgcolor: isPrimary ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                      '&:hover': { bgcolor: isPrimary ? 'rgba(25, 118, 210, 0.12)' : 'rgba(0, 0, 0, 0.04)' }
                    }}
                  >
                    <ListItemIcon>
                      <Checkbox
                        edge="start"
                        checked={isSelected}
                        onChange={() => handleClassToggle(cls)}
                        color={isPrimary ? "primary" : "default"}
                      />
                    </ListItemIcon>
                    <ListItemText 
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <SchoolIcon fontSize="small" color={isPrimary ? "primary" : "action"} />
                          {/* Change Typography component from 'p' to 'div' */}
                          <Typography 
                            component="div" 
                            variant="body1" 
                            sx={{ 
                              fontWeight: isPrimary ? 600 : 400,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1
                            }}
                          >
                            {cls.name}
                            {isPrimary && 
                              <Chip 
                                size="small" 
                                label="Classe principale" 
                                color="primary" 
                                sx={{ height: 20 }} 
                              />
                            }
                          </Typography>
                        </Box>
                      }
                    />
                    
                    {/* Si la classe est sélectionnée, montrer la sélection de sous-groupe sur la même ligne */}
                    {isSelected && isPrimary && (
                      <FormControl sx={{ minWidth: 120, ml: 2 }}>
                        <Select
                          size="small"
                          displayEmpty
                          value={student.group || ''}
                          onChange={(e) => handleSubgroupChange(cls.id, e.target.value)}
                          disabled={loadingSubgroups}
                          startAdornment={
                            <InputAdornment position="start">
                              <GroupsIcon fontSize="small" />
                            </InputAdornment>
                          }
                          renderValue={(value) => value ? `Groupe ${value}` : "Non assigné"}
                        >
                          <MenuItem value="">
                            <em>Non assigné</em>
                          </MenuItem>
                          {availableSubgroups.map((group) => (
                            <MenuItem key={group} value={group}>Groupe {group}</MenuItem>
                          ))}
                        </Select>
                        {loadingSubgroups && (
                          <CircularProgress 
                            size={20} 
                            sx={{ ml: 1 }} 
                          />
                        )}
                      </FormControl>
                    )}
                  </ListItem>
                  <Divider variant="inset" component="li" />
                </React.Fragment>
              );
            })}
          </List>
          
          {selectedClasses.length === 0 && (
            <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
              Aucune classe sélectionnée. L'étudiant ne sera inscrit à aucune classe.
            </Typography>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid rgba(0, 0, 0, 0.12)' }}>
        <Button onClick={onClose} color="inherit" startIcon={<CloseIcon />}>
          Annuler
        </Button>
        <Button 
          onClick={handleSave} 
          color="primary"
          variant="outlined"
          startIcon={<SaveIcon />}
        >
          Enregistrer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StudentEditDialog;
