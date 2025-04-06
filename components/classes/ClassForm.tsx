'use client';

import React, { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  Paper,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  FormHelperText,
  Box,
  Typography,
  Divider,
  SelectChangeEvent,
  Container
} from '@mui/material';
import Grid from '@mui/material/Grid';
import SaveIcon from '@mui/icons-material/Save';
import SchoolIcon from '@mui/icons-material/School';

interface ClassFormProps {
  classData?: {
    id: number;
    name: string;
    description: string;
    academic_year: string;
    nbre_subclasses?: number | null;
  } | null;
  onSuccess: (classId: number) => void;
  onError: (error: string) => void;
}

export default function ClassForm({ classData, onSuccess, onError }: ClassFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [nbreSubclasses, setNbreSubclasses] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (classData) {
      setName(classData.name || '');
      setDescription(classData.description || '');
      setAcademicYear(classData.academic_year || '');
      setNbreSubclasses(classData.nbre_subclasses || null);
    }
  }, [classData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = classData ? `/api/classes/${classData.id}` : '/api/classes';
      const method = classData ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description,
          academic_year: academicYear,
          nbre_subclasses: nbreSubclasses
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'enregistrement de la classe');
      }

      const data = await response.json();
      onSuccess(data.id);
    } catch (err) {
      console.error('Error submitting class:', err);
      onError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleSubclassesChange = (event: SelectChangeEvent<number | string>) => {
    const value = event.target.value;
    setNbreSubclasses(value === '' ? null : Number(value));
  };

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const year = currentYear - 2 + i;
    return `${year}-${year + 1}`;
  });

  return (
    <Paper elevation={3} className="p-8" sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <Box sx={{ mb: 4, borderBottom: '1px solid #eaeaea', pb: 2, display: 'flex', alignItems: 'center' }}>
        <SchoolIcon fontSize="large" color="primary" sx={{ mr: 2 }} />
        <Typography variant="h5" component="h2" fontWeight="bold">
          {classData ? 'Modifier la classe' : 'Ajouter une nouvelle classe'}
        </Typography>
      </Box>
      
      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }} >
            <TextField
              label="Nom de la classe"
              variant="outlined"
              fullWidth
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              sx={{ 
                '& .MuiOutlinedInput-root': { 
                  borderRadius: 1.5 
                } 
              }}
            />
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 4 }} >
            <FormControl fullWidth required>
              <InputLabel id="academic-year-label">Année Académique</InputLabel>
              <Select
                labelId="academic-year-label"
                id="academic-year"
                value={academicYear}
                label="Année Académique"
                onChange={(e) => setAcademicYear(e.target.value)}
                sx={{ borderRadius: 1.5 }}
              >
                {yearOptions.map((year) => (
                  <MenuItem key={year} value={year}>{year}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 4 }} >
            <FormControl fullWidth>
              <InputLabel id="subclasses-label">Nombre de sous-classes</InputLabel>
              <Select
                labelId="subclasses-label"
                id="subclasses"
                value={nbreSubclasses === null ? '' : nbreSubclasses}
                label="Nombre de sous-classes"
                onChange={handleSubclassesChange}
                sx={{ borderRadius: 1.5 }}
              >
                <MenuItem value="">
                  <em>Aucune sous-classe</em>
                </MenuItem>
                {[2, 3, 4, 5, 6].map((num) => (
                  <MenuItem key={num} value={num}>{num} sous-classes</MenuItem>
                ))}
              </Select>
              <FormHelperText>
                Vous pourrez modifier ce nombre ultérieurement
              </FormHelperText>
            </FormControl>
          </Grid>
          
          <Grid size={{ xs: 12}} >
            <TextField
              label="Description"
              variant="outlined"
              fullWidth
              multiline
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              sx={{ 
                '& .MuiOutlinedInput-root': { 
                  borderRadius: 1.5 
                } 
              }}
            />
          </Grid>

          <Grid size={{ xs: 12}} >
            <Box mt={3}>
              <Divider />
              <Box mt={3} display="flex" justifyContent="flex-end" gap={2}>
                <Button
                  variant="outlined"
                  color="secondary"
                  size="large"
                  sx={{ borderRadius: 1.5, px: 3 }}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  disabled={loading}
                  startIcon={<SaveIcon />}
                  sx={{ borderRadius: 1.5, px: 4 }}
                >
                  {loading ? 'Enregistrement...' : classData ? 'Mettre à jour' : 'Ajouter la classe'}
                </Button>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
}
