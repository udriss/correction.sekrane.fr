import React, { useState, useEffect } from 'react';
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
import { Student, Class } from '@/lib/types';
import MaleIcon from '@mui/icons-material/Male';
import FemaleIcon from '@mui/icons-material/Female';
import NotInterestedIcon from '@mui/icons-material/NotInterested';
import GpsNotFixedIcon from '@mui/icons-material/GpsNotFixed';
import GradientBackground from '@/components/ui/GradientBackground';



interface ExtendedClassEntry {
  classId: number;
  className: string;
  sub_class?: string | null;
  nbre_subclasses?: number;
}

// Extend the Student type to include the extended allClasses
interface ExtendedStudent extends Omit<Student, 'allClasses'> {
  allClasses?: ExtendedClassEntry[];
}

interface StudentEditDialogProps {
  open: boolean;
  student: Student | null;
  // Change this to accept partial Class objects:
  classes: (Class | Partial<Class> & { id: number; name: string; year: string })[];
  selectedClasses: { id: number, name: string }[];
  availableSubgroups: string[];
  loadingSubgroups: boolean;
  onClose: () => void;
  onSave: () => void;
  onStudentChange: (student: Student | null) => void;
  onSelectedClassesChange: (classes: { id: number, name: string }[]) => void;
  fetchClassSubgroups: (classId: number) => void;
  // Ajout des propriétés manquantes
  classGroupsMapping?: {[classId: number]: string[]};
  onClassSelectionChange?: (classId: number, isSelected: boolean) => void;
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
  fetchClassSubgroups,
  classGroupsMapping,
  onClassSelectionChange
}) => {



  const [classSubgroups, setClassSubgroups] = useState<{[classId: number]: string}>({});
  const [validationErrors, setValidationErrors] = useState<ValidationError>({});


  
  // Déplacer le useEffect ici, avant le retour conditionnel
  useEffect(() => {
    if (student && student.allClasses && student.allClasses.length > 0) {
      // Parcourir allClasses pour initialiser les sous-classes pour chaque classe
      const initialSubgroups: {[classId: number]: string} = {};
      
      student.allClasses.forEach(cls => {
        if (cls.sub_class) {
          initialSubgroups[cls.classId] = cls.sub_class.toString();
        }
      });
      
      setClassSubgroups(initialSubgroups);
      
      // Si la classe principale a une sous-classe, s'assurer que group est défini
      if (student.classId) {
        const mainClass = student.allClasses.find(cls => cls.classId === student.classId);
        if (mainClass && mainClass.sub_class && !student.group) {
          onStudentChange({
            ...student,
            group: mainClass.sub_class.toString()
          });
        }
      }
    }
  }, [student]);

  // Add this to useEffect to properly initialize allClasses if it's missing
  useEffect(() => {
    if (student && !student.allClasses && student.classId !== undefined && student.classId !== null) {
      // Fetch class details to get nbre_subclasses
      fetch(`/api/classes/${student.classId}`)
        .then(response => response.json())
        .then(classData => {
          // If allClasses is missing but we have a classId, create an initial allClasses array
          const initialAllClasses: ExtendedClassEntry[] = [{
            classId: student.classId as number,
            className: classes.find(c => c.id === student.classId)?.name || 'Current Class',
            sub_class: student.sub_class ? String(student.sub_class) : null,
            nbre_subclasses: classData.nbre_subclasses || null
          }];
          
          // Update the student with the initialized allClasses
          onStudentChange({
            ...student,
            allClasses: initialAllClasses
          });
          
          
        })
        .catch(error => {
          console.error('Error fetching class details:', error);
          // Fallback to initialize without nbre_subclasses
          const initialAllClasses: ExtendedClassEntry[] = [{
            classId: student.classId as number,
            className: classes.find(c => c.id === student.classId)?.name || 'Current Class',
            sub_class: student.sub_class ? String(student.sub_class) : null
          }];
          
          onStudentChange({
            ...student,
            allClasses: initialAllClasses
          });
        });
    }
  }, [student, classes, onStudentChange]);
  
  if (!student) return null;
  
  // Map to track which class IDs are selected
  const selectedClassIds = selectedClasses.map(cls => cls.id);

  // Handle class selection/deselection
  const handleClassToggle = (cls: Class | (Partial<Class> & { id: number; name: string; year: string })) => {
    const currentIndex = selectedClassIds.indexOf(cls.id);
    const newSelectedClasses = [...selectedClasses];
    
    if (currentIndex === -1) {
      // Add class
      newSelectedClasses.push({ id: cls.id, name: cls.name });
      
      // Fetch the class details to get nbre_subclasses
      fetch(`/api/classes/${cls.id}`)
        .then(response => response.json())
        .then(classData => {
          if (classData && classData.nbre_subclasses) {
            // Generate available subgroups for this class
            const groups = Array.from(
              { length: classData.nbre_subclasses },
              (_, i) => (i + 1).toString()
            );
            
            // Update the classGroupsMapping if onClassSelectionChange is available
            if (onClassSelectionChange) {
              onClassSelectionChange(cls.id, true);
            }
            
            // Optionally update allClasses with nbre_subclasses
            let updatedAllClasses: ExtendedClassEntry[] = student.allClasses ? 
              [...student.allClasses as ExtendedClassEntry[]] : [];
            
            const classIndex = updatedAllClasses.findIndex(c => c.classId === cls.id);
            
            if (classIndex >= 0) {
              updatedAllClasses[classIndex] = {
                ...updatedAllClasses[classIndex],
                nbre_subclasses: classData.nbre_subclasses
              };
            } else {
              updatedAllClasses.push({
                classId: cls.id,
                className: cls.name,
                sub_class: null,
                nbre_subclasses: classData.nbre_subclasses
              });
            }
            
            onStudentChange({
              ...student,
              allClasses: updatedAllClasses
            } as ExtendedStudent);
          }
        })
        .catch(error => {
          console.error(`Error fetching class ${cls.id} details:`, error);
        });
      
      // Update allClasses when adding a class
      const updatedAllClasses: ExtendedClassEntry[] = student.allClasses ? 
        [...student.allClasses as ExtendedClassEntry[]] : [];
      
      const existingClassIndex = updatedAllClasses.findIndex(c => c.classId === cls.id);
      
      if (existingClassIndex === -1) {
        // Add the class if it doesn't exist yet
        updatedAllClasses.push({
          classId: cls.id,
          className: cls.name,
          sub_class: null
        });
        
        onStudentChange({
          ...student,
          allClasses: updatedAllClasses
        } as ExtendedStudent);
        
        // Fetch subgroups for this class
        fetchClassSubgroups(cls.id);
      }
    } else {
      // Remove class
      newSelectedClasses.splice(currentIndex, 1);
      
      // Also remove the class from allClasses
      if (student.allClasses) {
        const updatedAllClasses = student.allClasses.filter(c => c.classId !== cls.id);
        
        // Update the student with the modified allClasses
        onStudentChange({
          ...student,
          allClasses: updatedAllClasses
        } as ExtendedStudent);
      }
    }
    
    onSelectedClassesChange(newSelectedClasses);
  };

  // Handle subgroup change for a specific class
  const handleSubgroupChange = (classId: number, value: string) => {
    // Create a copy of allClasses or initialize a new array if it doesn't exist
    let updatedAllClasses: ExtendedClassEntry[] = student.allClasses ? 
      [...student.allClasses as ExtendedClassEntry[]] : [];
    
    // Find the class in allClasses
    const classIndex = updatedAllClasses.findIndex(cls => cls.classId === classId);
    const existingClass = classIndex >= 0 ? updatedAllClasses[classIndex] : null;
    
    if (existingClass) {
      // Update the existing class entry - ensure sub_class is string | null
      // Preserve the nbre_subclasses property if it exists
      updatedAllClasses[classIndex] = {
        ...existingClass,
        sub_class: value === '' ? null : String(value)
      };
    } else if (value) {
      // Add a new class entry if it doesn't exist
      const className = classes.find(c => c.id === classId)?.name || 'Classe';
      
      // Fetch class details to get nbre_subclasses
      fetch(`/api/classes/${classId}`)
        .then(response => response.json())
        .then(classData => {
          const updatedAllClasses = student.allClasses ? [...student.allClasses as ExtendedClassEntry[]] : [];
          
          updatedAllClasses.push({
            classId,
            className,
            sub_class: value === '' ? null : String(value),
            nbre_subclasses: classData.nbre_subclasses || null
          });
          
          onStudentChange({
            ...student,
            allClasses: updatedAllClasses
          } as ExtendedStudent);
        })
        .catch(error => {
          console.error('Error fetching class details:', error);
          // Fallback to add without nbre_subclasses
          const updatedAllClasses = student.allClasses ? [...student.allClasses as ExtendedClassEntry[]] : [];
          
          updatedAllClasses.push({
            classId,
            className,
            sub_class: value === '' ? null : String(value)
          });
          
          onStudentChange({
            ...student,
            allClasses: updatedAllClasses
          } as ExtendedStudent);
        });
      
      return; // Return early since we'll update through the async fetch
    }
    
    // Update the student with the new allClasses array
    onStudentChange({
      ...student,
      allClasses: updatedAllClasses
    } as ExtendedStudent);
    
    // Track the subgroup association for this class
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
    if (!student) return;
    
    try {
      // Désactiver les validations pour les étudiants existants (id !== undefined)
      if (student.id) {
        setValidationErrors({});
      } else {
        // Validation pour les nouveaux étudiants uniquement
        // Vérifier si l'email est valide
        if (student.email) {
          setValidationErrors({ 
            email: "L'adresse e-mail n'est pas valide" 
          });
          return;
        }
      }
      
      
      
      // Utiliser PATCH plutôt que PUT pour mettre à jour l'étudiant avec ses classes
      const response = await fetch(`/api/students/${student.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(student),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        
        // Gérer spécifiquement l'erreur d'email en doublon
        if (errorData.code === 'DUPLICATE_EMAIL') {
          setValidationErrors({ 
            email: "Cette adresse email est déjà utilisée",
            existingStudent: errorData.existingStudent
          });
          return;
        }
        
        throw new Error(errorData.error || 'Erreur lors de la mise à jour');
      }
      
      // Appeler la fonction onSave pour fermer le dialogue et rafraîchir les données
      onSave();
    } catch (error) {
      console.error('Error saving student:', error);
      setValidationErrors({ 
        general: error instanceof Error ? error.message : 'Erreur lors de la sauvegarde' 
      });
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
              slotProps={{
                input: { 
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonOutlineIcon fontSize="small" />
                    </InputAdornment>
                  )
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
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonOutlineIcon fontSize="small" />
                    </InputAdornment>
                  )
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
              slotProps={{
                input: { 
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonOutlineIcon fontSize="small" />
                    </InputAdornment>
                  )
                }
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
              
              return (
                <React.Fragment key={cls.id}>
                  <ListItem 
                    sx={{ 
                      py: 1,
                      '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.12)' }
                    }}
                  >
                    <ListItemIcon>
                      <Checkbox
                        edge="start"
                        checked={isSelected}
                        onChange={() => handleClassToggle(cls)}
                        color='default'
                      />
                    </ListItemIcon>
                    <ListItemText 
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <SchoolIcon fontSize="small" color={isSelected ? "primary" : "action"} />
                          <Typography 
                            component="div" 
                            variant="body1" 
                            sx={{ 
                              fontWeight: isSelected ? 600 : 400,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1
                            }}
                          >
                            {cls.name}
                          </Typography>
                        </Box>
                      }
                    />
                    
                    {/* Montrer la sélection de sous-groupe sur la même ligne pour chaque classe sélectionnée */}
                    {isSelected && (
                      <FormControl sx={{ minWidth: 120, ml: 2 }}>
                        <Select
                          size="small"
                          displayEmpty
                          // Utilise les groupes spécifiques à cette classe si disponibles
                          value={(() => {
                            // If we have allClasses, get the sub_class for this specific class
                            if (student.allClasses && Array.isArray(student.allClasses)) {
                              const classEntry = student.allClasses.find(c => c.classId === cls.id);
                              if (classEntry) {
                                // Handle sub_class properly - convert to string if not null, or return empty string
                                return classEntry.sub_class !== null && classEntry.sub_class !== undefined 
                                  ? String(classEntry.sub_class) 
                                  : '';
                              }
                            }
                            
                            // Return empty string if no match found
                            return '';
                          })()}
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
                          {/* Get subgroups from the class-specific mapping or from the global available subgroups */}
                          {(() => {
                            // Look for nbre_subclasses in the student's allClasses entry for this class
                            if (student.allClasses && Array.isArray(student.allClasses)) {
                              const classEntry = student.allClasses.find(c => c.classId === cls.id);
                              // Type cast classEntry to ExtendedClassEntry to access nbre_subclasses
                              const typedClassEntry = classEntry as ExtendedClassEntry;
                              if (typedClassEntry && typedClassEntry.nbre_subclasses) {
                                // If we have nbre_subclasses directly in allClasses, use it
                                return Array.from(
                                  { length: typedClassEntry.nbre_subclasses },
                                  (_, i) => (i + 1).toString()
                                ).map((group) => (
                                  <MenuItem key={group} value={group}>Groupe {group}</MenuItem>
                                ));
                              }
                            }
                            
                            // If no nbre_subclasses found in allClasses, try classGroupsMapping
                            if (classGroupsMapping && classGroupsMapping[cls.id]) {
                              return classGroupsMapping[cls.id].map((group) => (
                                <MenuItem key={group} value={group}>Groupe {group}</MenuItem>
                              ));
                            }
                            
                            // Fallback to global availableSubgroups
                            return availableSubgroups.map((group) => (
                              <MenuItem key={group} value={group}>Groupe {group}</MenuItem>
                            ));
                          })()}
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
