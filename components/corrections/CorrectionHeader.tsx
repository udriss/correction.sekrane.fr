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
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';

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
  handleSaveName: (firstName: string, lastName: string) => void;
  handleDelete: () => void;
  handleCancelDelete: () => void;
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
}) => {
  // Add local state for form fields to prevent input issues
  const [localFirstName, setLocalFirstName] = useState('');
  const [localLastName, setLocalLastName] = useState('');
  
  // Initialize local state when editing starts or correction changes
  useEffect(() => {
    if (isEditingName) {
     
      // Use the parent state or fall back to correction data
      const firstNameValue = firstName;
      const lastNameValue = lastName;
      setLocalFirstName(firstNameValue);
      setLocalLastName(lastNameValue);
      
    }
  }, [isEditingName, correction, firstName, lastName]);

  
  // Add type guards around student_name usage
  const displayName = correction.student_name || `${correction.activity_name || 'Activité'} - Sans nom`;

  // Update parent state and handle form submission
  const handleFormSubmit = () => {
    
    // Validate: At least one name field must be non-empty
    if (!localFirstName && !localLastName) {
      alert("Veuillez saisir au moins un prénom ou un nom.");
      return;
    }
    
    // Pass the local values directly to handleSaveName
    handleSaveName(localFirstName, localLastName);
  };

  // Handle cancel editing with reset of all fields
  const handleCancelEditing = () => {
    setIsEditingName(false);
    // Reset local state
    setLocalFirstName('');
    setLocalLastName('');
    // Reset parent state to original values
    setFirstName(correction?.student_first_name || correction?.firstName || '');
    setLastName(correction?.student_last_name || correction?.lastName || '');
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
                  variant="outlined"
                  size="small"
                  autoFocus
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
                  variant="outlined"
                  size="small"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleFormSubmit();
                    if (e.key === 'Escape') handleCancelEditing();
                  }}
                />
              </Grid>
            </Grid>
            
            {/* Show current values for debugging */}
            <Typography variant="caption" color="text.secondary">
              Valeurs actuelles: Prénom="{localFirstName}", Nom="{localLastName}"
            </Typography>
            
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
            <Typography variant="h4" component="h1" fontWeight="bold">
              {displayName}
            </Typography>
            <IconButton
              onClick={() => setIsEditingName(true)}
              color="primary"
              title="Modifier le nom"
              size="small"
              sx={{ ml: 1 }}
            >
              <EditIcon fontSize="small" />
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
                  <CheckIcon fontSize="small" />
                </IconButton>
                <IconButton
                  onClick={handleCancelDelete}
                  color="inherit"
                  title="Annuler la suppression"
                  size="small"
                  sx={{ ml: 1 }}
                >
                  <CloseIcon fontSize="small" />
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
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        )}
        
        {!isEditingName && (
          <>
            <Typography sx={{ color: 'text.secondary', mt: 1 }}>
              Activité : <Link href={`/activities/${correction.activity_id}`} style={{ color: 'primary.main', textDecoration: 'none' }}>
                <Button variant="text" color="primary" sx={{ textTransform: 'none', p: 0, minWidth: 0, verticalAlign: 'baseline' }}>
                  {correction.activity_name}
                </Button>
              </Link>
            </Typography>
            {correction.created_at && (
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                Créée le {new Date(correction.created_at).toLocaleDateString('fr-FR', {
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
