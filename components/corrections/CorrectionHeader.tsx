import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  TextField,
  IconButton,
  Typography,
  Box,
  Stack,
  Button,
  Grid,
  Chip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import SchoolIcon from '@mui/icons-material/School';
import GroupsIcon from '@mui/icons-material/Groups';

interface CorrectionHeaderProps {
  correction: any;
  editedName: string;
  firstName: string;
  lastName: string;
  isEditingName: boolean;
  confirmingDelete: boolean;
  saving: boolean;
  setEditedName: (name: string) => void;
  setFirstName: (name: string) => void;
  setLastName: (name: string) => void;
  setIsEditingName: (isEditing: boolean) => void;
  handleSaveName: (firstName: string, lastName: string, email?: string) => void;
  handleDelete: () => void;
  handleCancelDelete: () => void;
  email?: string;
  setEmail?: (email: string) => void;
}

const CorrectionHeader: React.FC<CorrectionHeaderProps> = ({
  correction,
  editedName,
  firstName,
  lastName,
  isEditingName,
  confirmingDelete,
  saving,
  setEditedName,
  setFirstName,
  setLastName,
  setIsEditingName,
  handleSaveName,
  handleDelete,
  handleCancelDelete,
  email = '',
  setEmail = () => {},
}) => {
  // Add local state for form fields to prevent input issues
  const [localFirstName, setLocalFirstName] = useState('');
  const [localLastName, setLocalLastName] = useState('');
  const [localEmail, setLocalEmail] = useState('');
  
  // Initialize local state when editing starts or correction changes
  useEffect(() => {
    if (isEditingName) {
      // Use the parent state or fall back to correction data
      const firstNameValue = firstName;
      const lastNameValue = lastName;
      const emailValue = email || correction?.student_data?.email || '';
      
      setLocalFirstName(firstNameValue);
      setLocalLastName(lastNameValue);
      setLocalEmail(emailValue);
    }
  }, [isEditingName, correction, firstName, lastName, email]);

  
  // Add type guards around student_name usage
  const displayName = correction.student_name || `${correction.activity_name || 'Activité'} - Sans nom`;
  const displayEmail = correction?.student_data?.email || '';

  // Update parent state and handle form submission
  const handleFormSubmit = () => {
    // Validate: At least one name field must be non-empty
    if (!localFirstName && !localLastName) {
      alert("Veuillez saisir au moins un prénom ou un nom.");
      return;
    }
    
    // Validate email format if provided
    if (localEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(localEmail)) {
      alert("Veuillez saisir une adresse email valide.");
      return;
    }
    
    // Pass the local values directly to handleSaveName, including email
    handleSaveName(localFirstName, localLastName, localEmail);
  };

  // Handle cancel editing with reset of all fields
  const handleCancelEditing = () => {
    setIsEditingName(false);
    // Reset local state
    setLocalFirstName('');
    setLocalLastName('');
    setLocalEmail('');
    // Reset parent state to original values
    setFirstName(correction?.student_first_name || correction?.firstName || '');
    setLastName(correction?.student_last_name || correction?.lastName || '');
    setEmail(correction?.student_data?.email || '');
    setEditedName(correction?.student_name || '');
  };


  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
      {/* Left side with student name */}
      <Box sx={{ width: '100%' }}>
        {isEditingName ? (
          <Stack spacing={2}>
            <Typography variant="h6" color="primary">
              Modifier le nom de l'étudiant
            </Typography>
            
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Prénom"
                  // Use local state for controlled component
                  value={localFirstName}
                  onChange={(e) => {
                    setLocalFirstName(e.target.value);
                  }}
                  placeholder="Prénom de l'étudiant"
                  helperText="Entrée pour sauvegarder ou Échap pour annuler"
                  variant="filled"
                  size="small"
                  autoFocus
                  sx={{
                    backgroundColor: 'background.paper',
                    '& .MuiFilledInput-root': {
                      backgroundColor: 'background.paper',
                      '&:hover, &.Mui-focused': {
                        backgroundColor: 'background.default',
                      }
                    }
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Nom"
                  // Use local state for controlled component
                  value={localLastName}
                  onChange={(e) => {
                    setLocalLastName(e.target.value);
                  }}
                  placeholder="Nom de l'étudiant"
                  variant="filled"
                  color="primary"
                  helperText="Entrée pour sauvegarder ou Échap pour annuler"
                  size="small"
                  sx={{
                    backgroundColor: 'background.paper',
                    '& .MuiFilledInput-root': {
                      backgroundColor: 'background.paper',
                      '&:hover, &.Mui-focused': {
                        backgroundColor: 'background.default',
                      }
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleFormSubmit();
                    if (e.key === 'Escape') handleCancelEditing();
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Email"
                  // Use local state for controlled component
                  value={localEmail}
                  onChange={(e) => {
                    setLocalEmail(e.target.value);
                  }}
                  placeholder="Email de l'étudiant"
                  variant="filled"
                  color="primary"
                  helperText="Entrée pour sauvegarder ou Échap pour annuler"
                  size="small"
                  sx={{
                    backgroundColor: 'background.paper',
                    '& .MuiFilledInput-root': {
                      backgroundColor: 'background.paper',
                      '&:hover, &.Mui-focused': {
                        backgroundColor: 'background.default',
                      }
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleFormSubmit();
                    if (e.key === 'Escape') handleCancelEditing();
                  }}
                />
              </Grid>
            </Grid>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                onClick={handleFormSubmit}
                variant="contained"
                color="success"
                disabled={saving}
                startIcon={<CheckIcon />}
                size="small"
              >
                Sauvegarder
              </Button>
              <Button
                onClick={handleCancelEditing}
                variant="outlined"
                color="error"
                startIcon={<CloseIcon />}
                size="small"
              >
                Annuler
              </Button>
            </Box>
          </Stack>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h4" component="h1" color='text.primary' fontWeight="bold">
              {displayName}
            </Typography>
            <IconButton
              onClick={() => setIsEditingName(true)}
              color='secondary'
              title="Modifier le nom"
              sx={{ ml: 1, fontSize: '24px' }}
            >
              <EditIcon fontSize="large" />
            </IconButton>
            
            {confirmingDelete ? (
              <>
                <IconButton
                  onClick={handleDelete}
                  color="success"
                  title="Confirmer la suppression"
                  size="small"
                  sx={{ ml: 1 }}
                >
                  <CheckIcon fontSize="large" />
                </IconButton>
                <IconButton
                  onClick={handleCancelDelete}
                  color="inherit"
                  title="Annuler la suppression"
                  size="small"
                  sx={{ ml: 1 }}
                >
                  <CloseIcon fontSize="large" />
                </IconButton>
              </>
            ) : (
              <IconButton
                onClick={handleDelete}
                color="error"
                title="Supprimer la correction"
                size="small"
                sx={{ ml: 1 }}
              >
                <DeleteIcon fontSize="large" />
              </IconButton>
            )}
          </Box>
        )}
        
        {!isEditingName && (
          <>
            <Typography sx={{ color: 'text.primary', mt: 1 }}>
              Activité : 
              
              <Link href={`/activities/${correction.activity_id}`} style={{ color: 'primary.dark', textDecoration: 'none' , fontWeight: 'bold' }}>
                <Button variant="text" sx={{
                   textTransform: 'none', p: 0, minWidth: 0, verticalAlign: 'baseline',
                   fontWeight: 'bold',}}>
                  &nbsp;{correction.activity_name}
                </Button>
              </Link>
            </Typography>
            
            {/* Affichage des informations de classe et sous-classe */}
            {correction.class_name && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                <Chip
                  icon={<SchoolIcon />}
                  label={correction.class_name}
                  color="primary"
                  size="small"
                  sx={{ fontWeight: 'medium' }}
                />
                
                {correction.sub_class !== null && correction.sub_class !== undefined && (
                  <Chip
                    icon={<GroupsIcon />}
                    label={`Groupe ${correction.sub_class}`}
                    color="secondary"
                    size="small"
                    variant="filled"
                    sx={{ fontWeight: 'medium' }}
                  />
                )}
              </Box>
            )}
            
            {correction.created_at && (
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                Ajoutée le {new Date(correction.created_at).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Typography>
            )}
          </>
        )}
      </Box>
    </Box>
  );
};

export default CorrectionHeader;
