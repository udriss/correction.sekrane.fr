import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSnackbar } from 'notistack';
import { 
  TextField,
  IconButton,
  Typography,
  Box,
  Stack,
  Button,
  Grid,
  Chip,
  alpha,
  Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import SchoolIcon from '@mui/icons-material/School';
import GroupsIcon from '@mui/icons-material/Groups';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import DoNotDisturbIcon from '@mui/icons-material/DoNotDisturb';
import HourglassDisabledIcon from '@mui/icons-material/HourglassDisabled';

interface CorrectionHeaderProps {
  activityName: string;
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
  handleToggleActive?: () => void; // Fonction pour activer/désactiver
  correctionStatus?: string; // Statut actuel de la correction
  handleChangeStatus?: (newStatus: string) => void; // Fonction pour changer le statut
  isStatusChanging?: boolean; // Indique si le statut est en cours de changement
  email?: string;
  setEmail?: (email: string) => void;
}

const CorrectionHeader: React.FC<CorrectionHeaderProps> = ({
  activityName,
  correction,
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
  correctionStatus,
  handleChangeStatus = () => {},
  isStatusChanging = false,
}) => {
  // Add local state for form fields to prevent input issues
  const [localFirstName, setLocalFirstName] = useState('');
  const [localLastName, setLocalLastName] = useState('');
  const [localEmail, setLocalEmail] = useState('');
  const { enqueueSnackbar } = useSnackbar();
  
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
  const displayName = (() => {
    // Cas 1: On a prénom et nom
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    // Cas 2: On a juste le prénom
    else if (firstName && !lastName) {
      return firstName;
    }
    // Cas 3: On a juste le nom
    else if (!firstName && lastName) {
      return lastName;
    }
    // Cas 4: On essaie de récupérer depuis correction.student_name
    else if (correction?.student_name) {
      return correction.student_name;
    }
    // Cas 5: On construit un nom par défaut
    else {
      return `${correction?.activity_name || 'Activité'} - Sans nom`;
    }
  })();
  // Mise à jour: utiliser le status au lieu de active
  const isActive = correction.status === 'ACTIVE' || (correction.status === undefined && (correction.active === 1 || correction.active === true));


  // Update parent state and handle form submission
  const handleFormSubmit = () => {
    // Validate: At least one name field must be non-empty
    if (!localFirstName && !localLastName) {
      enqueueSnackbar("Veuillez saisir au moins un prénom ou un nom.", { 
        variant: "warning" 
      });
      return;
    }
    
    // Validate email format if provided
    if (localEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(localEmail)) {
      enqueueSnackbar("Veuillez saisir une adresse email valide.", { 
        variant: "error" 
      });
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
    // Récupérer les valeurs originales depuis l'objet correction avec vérification approfondie
    let originalFirstName = '';
    let originalLastName = '';
    let originalEmail = '';
    
    // Vérification des différentes structures possibles pour les données étudiantes
    if (correction?.student_data) {
      // Format principal avec student_data
      originalFirstName = correction.student_data.first_name || '';
      originalLastName = correction.student_data.last_name || '';
      originalEmail = correction.student_data.email || '';
    } else if (correction?.student_first_name !== undefined || correction?.student_last_name !== undefined) {
      // Format avec propriétés directes student_first_name/student_last_name
      originalFirstName = correction.student_first_name || '';
      originalLastName = correction.student_last_name || '';
    } else if (correction?.firstName !== undefined || correction?.lastName !== undefined) {
      // Format alternatif avec propriétés camelCase
      originalFirstName = correction.firstName || '';
      originalLastName = correction.lastName || '';
    } else if (correction?.student_name) {
      // Essai de décomposition du nom complet si disponible
      const nameParts = correction.student_name.split(' ');
      if (nameParts.length >= 2) {
        originalFirstName = nameParts[0] || '';
        originalLastName = nameParts.slice(1).join(' ') || '';
      } else if (nameParts.length === 1) {
        originalFirstName = nameParts[0] || '';
      }
    }
    
    console.log('Restauration des valeurs originales:', { 
      originalFirstName, 
      originalLastName, 
      originalEmail,
      correctionData: correction 
    });
    
    // Mettre à jour les états du composant parent
    setFirstName(originalFirstName);
    setLastName(originalLastName);
    setEmail(originalEmail);
    
    // Reconstruire le nom complet pour editedName
    if (correction?.student_name) {
      setEditedName(correction.student_name);
    } else if (originalFirstName || originalLastName) {
      // Construire le nom à partir des composantes
      const fullName = [originalFirstName, originalLastName].filter(Boolean).join(' ');
      setEditedName(fullName);
    } else {
      // Fallback à une valeur par défaut
      setEditedName('');
    }
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
            <Link 
              href={`/students/${correction.student_id}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none' }}
            >
              <Typography 
              variant="h4" 
              component="h1" 
              color='text.primary' 
              fontWeight="bold"
              sx={{ 
                cursor: 'pointer',
                '&:hover': {
                color: 'primary.main'
                }
              }}
              >
              {displayName}
              </Typography>
            </Link>
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

            
            {/* Boutons de statut */}
            <Box sx={{ ml: 1, display: 'flex' }}>
              <Tooltip title={correctionStatus === 'ACTIVE' ? "Marquer comme désactivée" : "Marquer comme active"}>
                <IconButton
                  onClick={() => handleChangeStatus(correctionStatus === 'ACTIVE' ? 'DEACTIVATED' : 'ACTIVE')}
                  color={correctionStatus === 'ACTIVE' ? "success" : correctionStatus === 'DEACTIVATED' ? "warning" : "default"}
                  size="large"
                  disabled={isStatusChanging}
                  sx={{ mx: 0.5 }}
                >
                  {correctionStatus === 'ACTIVE' ? <VisibilityIcon fontSize="large"/> : <VisibilityOffIcon fontSize="large"/>}
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Marquer comme absent">
                <IconButton
                  onClick={() => handleChangeStatus('ABSENT')}
                  color={correctionStatus === 'ABSENT' ? "error" : "default"}
                  size="large"
                  disabled={isStatusChanging}
                  sx={{ mx: 0.5 }}
                >
                  <PersonOffIcon fontSize="large"/>
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Marquer comme non rendu">
                <IconButton
                  onClick={() => handleChangeStatus('NON_RENDU')}
                  color={correctionStatus === 'NON_RENDU' ? "error" : "default"}
                  size="large"
                  disabled={isStatusChanging}
                  sx={{ mx: 0.5 }}
                >
                  <DoNotDisturbIcon fontSize="large"/>
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Marquer comme non noté">
                <IconButton
                  onClick={() => handleChangeStatus('NON_NOTE')}
                  color={correctionStatus === 'NON_NOTE' ? "info" : "default"}
                  size="large"
                  disabled={isStatusChanging}
                  sx={{ mx: 0.5 }}
                >
                  <HourglassDisabledIcon fontSize="large"/>
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        )}
        
        {!isEditingName && (
          <>
            <Typography sx={{ color: 'text.primary', mt: 1 }}>
              <Link 
              href={`/activities/${correction.activity_id}`}
              style={{ color: 'primary.dark', textDecoration: 'none' , fontWeight: 'bold' }}
              target="_blank"
              rel="noopener noreferrer">
                <Button variant="text" sx={{
                  textTransform: 'none', p: 0, minWidth: 0, verticalAlign: 'baseline',
                  fontWeight: 'bold',}}>
                  Activité{activityName ? ` : ${activityName}` : ''}
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
                <Typography variant="body2" sx={{ 
                color: 'text.secondary',
                mt: 0.5,
                bgcolor: theme => alpha(theme.palette.secondary.light, 0.15),
                p: 1,
                borderRadius: 1,
                display: 'inline-block',
                '&:hover': {
                  bgcolor: theme => alpha(theme.palette.secondary.light, 0.4),
                  transition: 'background-color 0.3s ease'
                }
                }}>
                Ajoutée le {new Date(correction.created_at).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
                </Typography>
            )}
            {correction.updated_at && (
                <Typography variant="body2" sx={{ 
                  ml:1,
                color: 'text.secondary',
                bgcolor: alpha('rgb(255, 255, 255)', 0.15),
                p: 1,
                borderRadius: 1,
                display: 'inline-block',
                '&:hover': {
                  bgcolor: alpha('rgb(255, 255, 255)', 0.4),
                  transition: 'background-color 0.3s ease'
                }
                }}>
                Mise à jour le {new Date(correction.updated_at).toLocaleDateString('fr-FR', {
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
