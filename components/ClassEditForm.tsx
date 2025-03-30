import { useState } from 'react';
import { 
  TextField, 
  Button, 
  Box, 
  Typography, 
  Paper, 
  CircularProgress, 
  Alert, 
  Collapse,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  Stack
} from '@mui/material';
import Grid from '@mui/material/Grid';

interface ClassEditFormProps {
  id: string;
  initialData: {
    name: string;
    description?: string;
    academic_year: string;
    nbre_subclasses?: number;
  };
  onCancel: () => void;
  onSuccess: (updatedClass: any) => void;
}

export function ClassEditForm({ id, initialData, onCancel, onSuccess }: ClassEditFormProps) {
  // État avec toutes les propriétés de la classe
  const [formData, setFormData] = useState({
    name: initialData.name || '',
    description: initialData.description || '',
    academic_year: initialData.academic_year || '',
    nbre_subclasses: initialData.nbre_subclasses || 0
  });

  const [isLoading, setIsLoading] = useState(false);
  const [alertInfo, setAlertInfo] = useState<{
    type: 'success' | 'error' | 'info' | 'warning',
    message: string,
    open: boolean
  } | null>(null);

  // Fonction pour mettre à jour un champ spécifique
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }> | SelectChangeEvent<string>) => {
    const { name, value } = e.target as HTMLInputElement | { name?: string; value: unknown };
    if (name) {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      setAlertInfo({
        type: 'error',
        message: "Le nom de la classe est requis",
        open: true
      });
      return;
    }

    if (!formData.academic_year.trim()) {
      setAlertInfo({
        type: 'error',
        message: "L'année scolaire est requise",
        open: true
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Utiliser la méthode PUT pour une mise à jour complète
      const response = await fetch(`/api/classes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erreur lors de la mise à jour de la classe');
      }
      
      const updatedClass = await response.json();
      
      // Afficher une alerte de succès
      setAlertInfo({
        type: 'success',
        message: 'Classe modifiée avec succès',
        open: true
      });
      
      // Attendre un peu pour que l'utilisateur puisse voir le message de succès
      setTimeout(() => {
        onSuccess(updatedClass);
      }, 1500);
      
    } catch (error) {
      console.error('Erreur:', error);
      setAlertInfo({
        type: 'error',
        message: error instanceof Error ? error.message : 'Erreur lors de la modification de la classe',
        open: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Générer les années scolaires (pour les 10 dernières années et 5 années à venir)
  const generateSchoolYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = -10; i <= 5; i++) {
      const year = currentYear + i;
      years.push(`${year}-${year + 1}`);
    }
    return years;
  };

  const isFormChanged = () => {
    return formData.name !== initialData.name || 
           formData.description !== initialData.description ||
           formData.academic_year !== initialData.academic_year ||
           formData.nbre_subclasses !== initialData.nbre_subclasses;
  };

  // Vérifier si le nombre de sous-classes est valide (0 ou >= 2)
  const isValidSubclassNumber = (num: number | string) => {
    // Convertir en nombre si c'est une chaîne
    const value = typeof num === 'string' ? parseInt(num, 10) : num;
    
    // 0 est une valeur valide, ainsi que tout nombre >= 2
    return value === 0 || value >= 2;
  };

  // Validation du formulaire
  const formErrors = {
    name: !formData.name.trim() ? 'Le nom est obligatoire' : '',
    academic_year: !formData.academic_year.trim() ? 'L\'année scolaire est obligatoire' : '',
    nbre_subclasses: isValidSubclassNumber(formData.nbre_subclasses) ? '' : 'Le nombre doit être 0 ou supérieur ou égal à 2'
  };

  const isFormValid = !Object.values(formErrors).some(error => error !== '');

  return (
    <Paper 
      elevation={2}
      sx={{ 
        p: 3, 
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Stack spacing={2} sx={{ position: 'relative', zIndex: 1 }}>
        <Typography variant="h6" gutterBottom>
          Modifier la classe
        </Typography>
        
        <Collapse in={alertInfo?.open}>
          {alertInfo && (
            <Alert 
              severity={alertInfo.type}
              sx={{ mb: 2 }}
              onClose={() => setAlertInfo({...alertInfo, open: false})}
            >
              {alertInfo.message}
            </Alert>
          )}
        </Collapse>
        
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <Grid container spacing={3}>
            {/* Colonne de gauche pour nom, année scolaire et nombre de sous-classes */}
            <Grid size={{ xs: 12, sm: 6, md: 6, lg: 4 }}>
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  name="name"
                  label="Nom de la classe"
                  variant="outlined"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Nom de la classe"
                  disabled={isLoading}
                  autoFocus
                  error={!formData.name.trim()}
                  helperText={!formData.name.trim() ? 'Le nom est obligatoire' : ''}
                />
                
                <FormControl fullWidth variant="outlined">
                  <InputLabel id="academic-year-label">Année scolaire</InputLabel>
                  <Select
                    labelId="academic-year-label"
                    name="academic_year"
                    value={formData.academic_year}
                    onChange={handleChange}
                    label="Année scolaire"
                    disabled={isLoading}
                    error={!formData.academic_year.trim()}
                  >
                    {generateSchoolYears().map((year) => (
                      <MenuItem key={year} value={year}>{year}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <TextField
                  fullWidth
                  name="nbre_subclasses"
                  label="Nombre de sous-classes"
                  variant="outlined"
                  type="number"
                  value={formData.nbre_subclasses}
                  onChange={(e) => {
                    // Convertir explicitement en nombre pour la validation
                    const value = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                    setFormData(prev => ({
                      ...prev,
                      nbre_subclasses: value
                    }));
                  }}
                  placeholder="Nombre de sous-classes"
                  disabled={isLoading}
                  inputProps={{ 
                    min: 0, 
                    step: 1,
                    onInput: (e: React.ChangeEvent<HTMLInputElement>) => {
                      const value = parseInt(e.target.value, 10);
                      if (value === 1) {
                        e.target.value = '2';
                        setFormData(prev => ({
                          ...prev,
                          nbre_subclasses: 2
                        }));
                      }
                    }
                  }}
                  error={!!formErrors.nbre_subclasses}
                  helperText={formErrors.nbre_subclasses || 'Utilisez 0 ou 2+ pour le nombre de sous-classes'}
                />
              </Stack>
            </Grid>
            
            {/* Colonne de droite pour la description */}
            <Grid size={{ xs: 12, sm: 6, md: 6, lg: 4 }}>
              <TextField
                fullWidth
                name="description"
                label="Description"
                variant="outlined"
                value={formData.description}
                onChange={handleChange}
                placeholder="Description de la classe (optionnel)"
                disabled={isLoading}
                multiline
                rows={10}
                sx={{ height: '100%' }}
                InputProps={{
                  sx: { height: '100%' }
                }}
              />
            </Grid>
          </Grid>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, gap: 2 }}>
            <Button
              variant="outlined"
              onClick={onCancel}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button 
              type="submit"
              variant="contained"
              disabled={isLoading || !isFormChanged() || !isFormValid}
              startIcon={isLoading ? <CircularProgress size={20} /> : null}
            >
              {isLoading ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </Box>
        </Box>
      </Stack>
    </Paper>
  );
}
