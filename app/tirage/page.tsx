// Page de tirage au sort d'exercices pour les étudiants d'une classe
'use client';

import React, { useEffect, useState } from 'react';
import {
  Container, Paper, Typography, Box, FormControl, InputLabel, Select, MenuItem, Button, TextField, IconButton, Grid, Chip, Divider, Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import ErrorDisplay from '@/components/ui/ErrorDisplay';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import CloseIcon from '@mui/icons-material/Close';
import { alpha, useTheme, Theme } from '@mui/material/styles';

// Types de base
interface Classe {
  id: number;
  name: string;
  academic_year: string;
  nbre_subclasses?: number;
}
interface Student {
  id?: number;
  first_name: string;
  last_name: string;
  sub_class?: string | number | null;
}

export default function TiragePage() {
  // Étape 1 : sélection classe/sous-groupe
  const [classes, setClasses] = useState<Classe[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | ''>('');
  const [subgroups, setSubgroups] = useState<string[]>([]);
  const [selectedSubgroup, setSelectedSubgroup] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [manualStudents, setManualStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  // Étape 2 : gestion des exercices
  const [exercises, setExercises] = useState<string[]>([]);
  const [exerciseInput, setExerciseInput] = useState('');
  const [exerciseBatchCount, setExerciseBatchCount] = useState(1);

  // Étape 3 : résultat du tirage
  const [drawResult, setDrawResult] = useState<{ student: Student; exercise: string }[]>([]);
  const [studentsDialogOpen, setStudentsDialogOpen] = useState(false);

  // Nouvel état pour la sélection fine des élèves
  const [selectedStudentIndexes, setSelectedStudentIndexes] = useState<number[]>([]);

  const theme = useTheme();

  // Récupérer la liste des classes au chargement
  useEffect(() => {
    setLoading(true);
    fetch('/api/classes')
      .then(async res => {
        if (!res.ok) {
          let errObj: any = { status: res.status, statusText: res.statusText };
          try { errObj = await res.json(); } catch {}
          throw errObj;
        }
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setClasses(data);
        } else {
          setClasses([]);
        }
      })
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, []);


  // Récupérer les sous-groupes et étudiants quand une classe est sélectionnée
  useEffect(() => {
    if (!selectedClassId) return;
    setLoading(true);
    fetch(`/api/classes/${selectedClassId}`)
      .then(res => res.json())
      .then(data => {
        if (data.nbre_subclasses && data.nbre_subclasses > 0) {
          setSubgroups(Array.from({ length: data.nbre_subclasses }, (_, i) => (i + 1).toString()));
        } else {
          setSubgroups([]);
        }
      })
      .catch(() => setError('Erreur lors du chargement des sous-groupes'));
    fetch(`/api/classes/${selectedClassId}/students`)
      .then(res => res.json())
      .then(data => setStudents(data))
      .catch(() => setError('Erreur lors du chargement des étudiants'))
      .finally(() => setLoading(false));
  }, [selectedClassId]);

  // Filtrer les étudiants par sous-groupe si sélectionné
  const filteredStudents = selectedSubgroup
    ? students.filter(s => s.sub_class?.toString() === selectedSubgroup)
    : students;
  const allStudentsRaw = [...filteredStudents, ...manualStudents];
  const allStudents = selectedStudentIndexes.map(i => allStudentsRaw[i]).filter(Boolean);

  // Mettre à jour la sélection des élèves à chaque changement de filteredStudents ou manualStudents
  useEffect(() => {
    const newIndexes = Array.from({ length: filteredStudents.length + manualStudents.length }, (_, i) => i);
    if (
      selectedStudentIndexes.length !== newIndexes.length ||
      !selectedStudentIndexes.every((v, i) => v === newIndexes[i])
    ) {
      setSelectedStudentIndexes(newIndexes);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredStudents, manualStudents]);

  

  // Handler pour (dé)sélectionner un élève
  const handleToggleStudent = (idx: number) => {
    setSelectedStudentIndexes(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  // Ajout d'un exercice (un par un)
  const handleAddExercise = () => {
    if (exerciseInput.trim()) {
      setExercises(prev => [...prev, exerciseInput.trim()]);
      setExerciseInput('');
    }
  };
  // Ajout en lot
  const handleBatchAddExercises = () => {
    const base = exercises.length + 1;
    const newExercises = Array.from({ length: exerciseBatchCount }, (_, i) => `Exercice ${base + i}`);
    setExercises(prev => [...prev, ...newExercises]);
  };
  // Suppression d'un exercice
  const handleRemoveExercise = (idx: number) => {
    setExercises(prev => prev.filter((_, i) => i !== idx));
  };

  // Ajout manuel d'un étudiant
  const handleAddManualStudent = () => {
    setManualStudents(prev => [...prev, { first_name: '', last_name: '', sub_class: null }]);
  };
  // Modification d'un étudiant manuel
  const handleManualStudentChange = (idx: number, field: 'first_name' | 'last_name', value: string) => {
    setManualStudents(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };
  // Suppression d'un étudiant manuel
  const handleRemoveManualStudent = (idx: number) => {
    setManualStudents(prev => prev.filter((_, i) => i !== idx));
  };

  // Tirage au sort
  const handleDraw = () => {
    if (allStudents.length === 0 || exercises.length === 0) return;
    let result: { student: Student; exercise: string }[] = [];
    if (exercises.length >= allStudents.length) {
      // Tirage sans replacement
      const shuffledExercises = [...exercises].sort(() => Math.random() - 0.5);
      result = allStudents.map((student, i) => ({ student, exercise: shuffledExercises[i] }));
    } else {
      // Plus d'étudiants que d'exercices : attribution la plus diversifiée possible
      const shuffledStudents = [...allStudents].sort(() => Math.random() - 0.5);
      let exerciseIdx = 0;
      result = shuffledStudents.map((student, i) => {
        const exercise = exercises[exerciseIdx];
        exerciseIdx = (exerciseIdx + 1) % exercises.length;
        return { student, exercise };
      });
    }
    setDrawResult(result);
  };

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <ErrorDisplay
          error={error}
          errorDetails={typeof error === 'object' && error !== null ? error.details : undefined}
          withRefreshButton={true}
          onRefresh={() => {
            setError(null);
            window.location.reload();
          }}
        />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper
        elevation={4}
        sx={{
          p: { xs: 2, sm: 4 },
          mb: 4,
          borderRadius: 4,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.light,.01)} 0%, ${alpha(theme.palette.secondary.light,.01)} 100%)`,
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: `radial-gradient(circle at 80% 20%, ${alpha(theme.palette.primary.main, 0.08)} 0%, transparent 70%)`,
          zIndex: 0,
        }} />
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography variant="h3" fontWeight={800} gutterBottom sx={{ letterSpacing: 1, color: theme.palette.primary.dark, mb: 2 }}>
            <ShuffleIcon sx={{ fontSize: 40, verticalAlign: 'middle', mr: 1, color: theme.palette.secondary.dark }} />
            Tirage au sort d'exercices
          </Typography>
          <Typography variant="subtitle1" sx={{ mb: 3, color: theme.palette.text.secondary, fontWeight: 500 }}>
            Sélectionnez une classe, ajoutez vos exercices, puis attribuez-les aléatoirement à vos étudiants. Personnalisez la sélection pour une analyse fine et un tirage équitable.
          </Typography>
          <Divider sx={{ my: 3, borderColor: theme.palette.secondary.light }} />
          <Typography variant="h6" gutterBottom>1. Sélection de la classe</Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2, alignItems: 'center' }}>
            <FormControl sx={{ minWidth: 200 }} size="small">
              <InputLabel>Classe</InputLabel>
              <Select
                value={selectedClassId}
                label="Classe"
                onChange={e => {
                  setSelectedClassId(Number(e.target.value));
                  setSelectedSubgroup('');
                  setManualStudents([]);
                  setDrawResult([]);
                }}
              >
                <MenuItem value="">Sélectionner</MenuItem>
                {classes.map(cls => (
                  <MenuItem key={cls.id} value={cls.id}>{cls.name} ({cls.academic_year})</MenuItem>
                ))}
              </Select>
            </FormControl>
            {subgroups.length > 0 && (
              <FormControl sx={{ minWidth: 180 }} size="small">
                <InputLabel>Groupe</InputLabel>
                <Select
                  value={selectedSubgroup}
                  label="Groupe"
                  onChange={e => {
                    setSelectedSubgroup(e.target.value);
                    setDrawResult([]);
                  }}
                >
                  <MenuItem value="">Tous</MenuItem>
                  {subgroups.map(sg => (
                    <MenuItem key={sg} value={sg}>Groupe {sg}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            <Chip
              icon={<PeopleAltIcon />}
              label={`${allStudents.length} étudiant${allStudents.length > 1 ? 's' : ''}`}
              color="primary"
              clickable
              sx={{ fontWeight: 600, fontSize: 16, px: 2, py: 1, borderRadius: 2, boxShadow: 2, bgcolor: 'primary.light', '&:hover': { bgcolor: 'primary.main', color: 'white' } }}
              onClick={() => setStudentsDialogOpen(true)}
            />
          </Box>
          <Dialog
            open={studentsDialogOpen}
            onClose={() => setStudentsDialogOpen(false)}
            maxWidth="xs"
            fullWidth
            scroll="paper"
          >
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PeopleAltIcon color="primary" />
              Liste des étudiants sélectionnés
              <Box sx={{ flexGrow: 1 }} />
              <IconButton onClick={() => setStudentsDialogOpen(false)} size="small"><CloseIcon /></IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 0 }}>
              <List dense>
                {allStudents.length === 0 && (
                  <ListItem><ListItemText primary="Aucun étudiant sélectionné" /></ListItem>
                )}
                {allStudents.map((student, idx) => (
                  <ListItem key={idx} divider={idx < allStudents.length - 1}>
                    <ListItemText
                      primary={`${student.first_name} ${student.last_name}`.trim() || 'Étudiant sans nom'}
                      secondary={manualStudents.includes(student) ? 'Ajouté manuellement' : undefined}
                    />
                  </ListItem>
                ))}
              </List>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setStudentsDialogOpen(false)} color="primary" variant="contained" fullWidth>
                Fermer
              </Button>
            </DialogActions>
          </Dialog>
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" gutterBottom>2. Ajouter des exercices</Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
            <TextField
              label="Nom de l'exercice"
              value={exerciseInput}
              onChange={e => setExerciseInput(e.target.value)}
              size="small"
              onKeyDown={e => { if (e.key === 'Enter') handleAddExercise(); }}
            />
            <IconButton color="primary" onClick={handleAddExercise}><AddIcon /></IconButton>
            <TextField
              label="Ajouter en lot"
              type="number"
              size="small"
              value={exerciseBatchCount}
              onChange={e => setExerciseBatchCount(Number(e.target.value))}
              sx={{ width: 100 }}
              inputProps={{ min: 1 }}
            />
            <Button variant="outlined" onClick={handleBatchAddExercises}>Ajouter {exerciseBatchCount}</Button>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {exercises.map((ex, idx) => (
              <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <TextField
                  value={ex}
                  size="small"
                  onChange={e => {
                    const newVal = e.target.value;
                    setExercises(prev => prev.map((v, i) => i === idx ? newVal : v));
                  }}
                  sx={{ minWidth: 120 }}
                />
                <IconButton onClick={() => handleRemoveExercise(idx)} color="error" size="small">
                  <RemoveIcon />
                </IconButton>
              </Box>
            ))}
          </Box>
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" gutterBottom>3. Ajouter des étudiants manuellement</Typography>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddManualStudent} sx={{ mb: 2 }}>
            Ajouter un étudiant
          </Button>
          {manualStudents.map((student, idx) => (
            <Box key={idx} sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
              <TextField
                label="Prénom"
                value={student.first_name}
                onChange={e => handleManualStudentChange(idx, 'first_name', e.target.value)}
                size="small"
              />
              <TextField
                label="Nom"
                value={student.last_name}
                onChange={e => handleManualStudentChange(idx, 'last_name', e.target.value)}
                size="small"
              />
              <IconButton color="error" onClick={() => handleRemoveManualStudent(idx)}><RemoveIcon /></IconButton>
            </Box>
          ))}
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" gutterBottom>4. Tirage au sort</Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<ShuffleIcon />}
            onClick={handleDraw}
            disabled={allStudents.length === 0 || exercises.length === 0}
          >
            Lancer le tirage
          </Button>
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          {/* Sélection fine des élèves */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
              Désélectionner des élèves si besoin :
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {allStudentsRaw.map((student, idx) => (
                <Chip
                  key={idx}
                  label={`${student.first_name} ${student.last_name}`.trim() || 'Sans nom'}
                  color={selectedStudentIndexes.includes(idx) ? 'primary' : 'default'}
                  variant={selectedStudentIndexes.includes(idx) ? 'filled' : 'outlined'}
                  onClick={() => handleToggleStudent(idx)}
                  onDelete={selectedStudentIndexes.includes(idx) ? () => handleToggleStudent(idx) : undefined}
                  sx={{ mb: 1, opacity: selectedStudentIndexes.includes(idx) ? 1 : 0.5, cursor: 'pointer' }}
                  clickable
                />
              ))}
            </Box>
          </Box>
        </Box>
      </Paper>
      <Divider sx={{ my: 2 }} />
        {drawResult.length > 0 && (
          <Paper elevation={3} sx={{ mt: 4, mb: 2, p: 3, borderRadius: 3, background: (theme) => theme.palette.background.paper, boxShadow: 4 }}>
            <Typography variant="subtitle1" gutterBottom>Résultat du tirage :</Typography>
            <Grid container spacing={1}>
              {drawResult.map((item, idx) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={idx}>
                  <Paper sx={{ p: 2, mb: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography fontWeight={600}>
                        {item.student.first_name} {item.student.last_name ? item.student.last_name.charAt(0).toUpperCase() + '.' : ''}
                        </Typography>
                    <Chip
                      label={item.exercise}
                      variant="outlined"
                      sx={{
                        fontWeight: 700,
                        fontSize: 18,
                        color: (theme) => theme.palette.secondary.dark,
                        px: 2,
                        py: 1,
                        mt: 1,
                        boxShadow: 0.5,
                        borderColor: (theme) => theme.palette.secondary.dark,
                        letterSpacing: 1,
                        textTransform: 'uppercase',
                      }}
                    />
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Paper>
        )}
    </Container>
  );
}
