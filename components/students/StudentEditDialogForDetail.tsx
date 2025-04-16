import React, { useState } from 'react';
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
  Select,
  MenuItem,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  Divider,
  Alert,
  AlertTitle,
  IconButton,
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
import MaleIcon from '@mui/icons-material/Male';
import FemaleIcon from '@mui/icons-material/Female';
import NotInterestedIcon from '@mui/icons-material/NotInterested';
import GpsNotFixedIcon from '@mui/icons-material/GpsNotFixed';
import GradientBackground from '@/components/ui/GradientBackground';
import H1Title from '@/components/ui/H1Title';

// Définition des types localement pour éviter les dépendances externes
interface Student {
  id: number;
  email: string | null;
  first_name: string;
  last_name: string;
  gender: 'M' | 'F' | 'N';
  created_at: string;
  updated_at: string;
  phone?: string;
  code?: string;
  classId?: number;
  group?: string;
}

interface Class {
  id: number;
  name: string;
  description: string | null;
  academic_year: string;
  created_at: string;
  updated_at: string;
  nbre_subclasses: number | null;
  student_count?: number;
  sub_class?: number | null;
  year?: string;
}

interface StudentEditDialogForDetailProps {
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

const StudentEditDialogForDetail: React.FC<StudentEditDialogForDetailProps> = ({
  open,
  student,
  classes, // Maintenant contient toutes les classes disponibles
  selectedClasses, // Contient seulement les classes auxquelles l'étudiant est inscrit
  availableSubgroups,
  loadingSubgroups,
  onClose,
  onSave,
  onStudentChange,
  onSelectedClassesChange,
  fetchClassSubgroups
}) => {
  const [classSubgroups, setClassSubgroups] = useState<{[classId: number]: string}>({});
  const [updateError, setUpdateError] = useState<string | null>(null);
  
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

  // Handle closing the error alert
  const handleCloseError = () => {
    setUpdateError(null);
  };

  // Handle save with error handling
  const handleSaveWithErrorHandling = async () => {
    try {
      // Clear any previous errors
      setUpdateError(null);
      // Call the provided onSave function
      await onSave();
    } catch (error) {
      // Capture any errors that occur during save
      const errorMessage = error instanceof Error 
        ? `Erreur lors de la mise à jour de l'étudiant : ${error.message}` 
        : "Erreur lors de la mise à jour de l'étudiant.";
      setUpdateError(errorMessage);
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
              background: student.gender === 'M'
              ? (theme) => `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.dark} 100%)`
              : student.gender === 'F' 
              ? (theme) => `linear-gradient(135deg, ${theme.palette.secondary.light} 0%, ${theme.palette.secondary.dark} 100%)`
              : 'grey.500',
              fontSize: '1.5rem',
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
            }}
            >
            {student.gender === 'M' ? <MaleIcon sx={{color: 'text.primary'}} fontSize="large" /> : 
             student.gender === 'F' ? <FemaleIcon sx={{color: 'text.primary'}}  fontSize="large" /> : 
             student.gender === 'N' ? <GpsNotFixedIcon sx={{color: 'text.primary'}} fontSize="large" /> : 
             <NotInterestedIcon fontSize="large" />}
            </Avatar>
          <Box>
          <Typography color='text.primary' variant="h5" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          Modifier l'étudiant
            </Typography>
            <Typography variant="body2" color='text.secondary' sx={{ opacity: 0.9 }}>
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
        {/* Afficher l'alerte d'erreur si elle existe */}
        {updateError && (
          <Alert 
            severity="error"
            action={
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={handleCloseError}
              >
                <CloseIcon fontSize="inherit" />
              </IconButton>
            }
            sx={{ mb: 3 }}
          >
            <AlertTitle>Erreur</AlertTitle>
            {updateError}
          </Alert>
        )}

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
              slotProps={{
                input: { 
                  inputProps: { 
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonOutlineIcon fontSize="small" />
                      </InputAdornment>
                    )
                   },
                }
                }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 6, lg: 4 }}>
            <TextField
              label="Nom"
              fullWidth
              value={student.last_name || ''}
              onChange={(e) => onStudentChange({ ...student, last_name: e.target.value })}
              slotProps={{
                input: { 
                  inputProps: { 
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonOutlineIcon fontSize="small" />
                      </InputAdornment>
                    )
                   },
                }
                }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 6, lg: 4 }}>
            <TextField
              label="Email"
              fullWidth
              type="email"
              value={student.email || ''}
              onChange={(e) => onStudentChange({ ...student, email: e.target.value })}
              slotProps={{
                input: { 
                  inputProps: { 
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonOutlineIcon fontSize="small" />
                      </InputAdornment>
                    )
                   },
                }
                }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 6, lg: 4 }}>
            <FormControl component="fieldset">
              <FormLabel component="legend">Genre</FormLabel>
              <RadioGroup
                row
                value={student.gender || 'N'}
                onChange={(e) => {
                  const newGender = e.target.value as 'M' | 'F' | 'N';
                  onStudentChange({ 
                    ...student, 
                    gender: newGender 
                  });
                }}
              >
                <FormControlLabel value="M" control={<Radio size="small" />} label="Homme" />
                <FormControlLabel value="F" control={<Radio size="small" />} label="Femme" />
                <FormControlLabel value="N" control={<Radio size="small" />} label="Non spécifié" />
              </RadioGroup>
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
                          <Typography 
                            variant="body1"
                            component={"div"} 
                            sx={{ 
                              fontWeight: isPrimary ? 600 : 400
                            }}
                          >
                            {cls.name}
                            {isPrimary && <Chip size="small" label="Classe principale" color="primary" sx={{ ml: 1, height: 20 }} />}
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
          onClick={handleSaveWithErrorHandling} 
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

export default StudentEditDialogForDetail;
