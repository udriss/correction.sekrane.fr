import React, { useState } from 'react';
import { 
  TextField, 
  Button, 
  Paper, 
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box
} from '@mui/material';
import Grid from '@mui/material/Grid';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import WcIcon from '@mui/icons-material/Wc';
import SaveIcon from '@mui/icons-material/Save';

interface StudentFormProps {
  classId?: number;
  studentId?: number;
  onSuccess: () => void;
  onError: (error: string) => void;
  initialData?: {
    email: string;
    first_name: string;
    last_name: string;
    gender: string;
  };
}

export default function StudentForm({ 
  classId, 
  studentId, 
  onSuccess, 
  onError,
  initialData 
}: StudentFormProps) {
  const [email, setEmail] = useState(initialData?.email || '');
  const [firstName, setFirstName] = useState(initialData?.first_name || '');
  const [lastName, setLastName] = useState(initialData?.last_name || '');
  const [gender, setGender] = useState(initialData?.gender || '');
  const [loading, setLoading] = useState(false);
  const isEdit = Boolean(studentId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName || !gender) {
      onError('Le prénom et le genre sont obligatoires');
      return;
    }
    
    // Only validate email if provided
    if (email && !validateEmail(email)) {
      onError('Veuillez entrer une adresse email valide');
      return;
    }
    
    try {
      setLoading(true);
      
      const studentData = {
        email: email || `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`, // Generate a default email if not provided
        first_name: firstName,
        last_name: lastName || '', // Default last name if not provided
        gender
      };
      
      // If we're adding a student to a class directly
      if (classId && !isEdit) {
        const response = await fetch(`/api/classes/${classId}/students`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(studentData),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Une erreur est survenue');
        }
      }
      // If we're editing an existing student
      else if (isEdit && classId) {
        // Use the class students API route with PUT method
        const response = await fetch(`/api/classes/${classId}/students`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...studentData,
            student_id: studentId
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Une erreur est survenue');
        }
      }
      // If we're just adding a student without a class (this case might need a separate API endpoint)
      else {
        // This case is problematic since we don't have a general student API
        // For now, just show an error
        throw new Error('Impossible de modifier un étudiant sans classe associée');
      }
      
      resetForm();
      onSuccess();
    } catch (err) {
      console.error('Error:', err);
      onError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const resetForm = () => {
    if (!isEdit) {
      setEmail('');
      setFirstName('');
      setLastName('');
      setGender('');
    }
  };

  return (
    <Paper className="p-6 shadow-md">
      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Prénom"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              fullWidth
              margin="normal"
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <Box component="span" sx={{ color: 'action.active', mr: 1, my: 0.5 }}>
                    <PersonIcon />
                  </Box>
                ),
              }}
            />
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Nom"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              fullWidth
              margin="normal"
              variant="outlined"
              helperText="Optionnel"
            />
          </Grid>
          
          <Grid size={{ xs: 12 }}>
            <TextField
              label="Adresse email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              type="email"
              margin="normal"
              variant="outlined"
              helperText="Optionnel (une adresse par défaut sera générée si laissée vide)"
              InputProps={{
                startAdornment: (
                  <Box component="span" sx={{ color: 'action.active', mr: 1, my: 0.5 }}>
                    <EmailIcon />
                  </Box>
                ),
              }}
            />
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth margin="normal" variant="outlined">
              <InputLabel id="gender-label">Genre</InputLabel>
              <Select
                labelId="gender-label"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                label="Genre"
                required
                startAdornment={
                  <Box component="span" sx={{ color: 'action.active', mr: 1, my: 0.5 }}>
                    <WcIcon />
                  </Box>
                }
              >
                <MenuItem value="M">Garçon</MenuItem>
                <MenuItem value="F">Fille</MenuItem>
                <MenuItem value="N">Neutre</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid size={12} className="flex justify-end mt-4">
            <Button 
              type="submit" 
              variant="contained" 
              color="primary" 
              disabled={loading}
              startIcon={<SaveIcon />}
              size="large"
            >
              {isEdit ? 'Mettre à jour' : 'Ajouter l\'étudiant'}
            </Button>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
}
