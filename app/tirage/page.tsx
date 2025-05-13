// Page de tirage au sort d'exercices pour les étudiants d'une classe
'use client';

import React, { useEffect, useState } from 'react';
import {
  Container, Paper, Typography, Box, FormControl, InputLabel, Select, MenuItem, Button, TextField, IconButton, Grid, Chip, Divider, Alert, Snackbar
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
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
  class_id?: number;  // ID de la classe à laquelle l'étudiant appartient
}

// Structure pour les sous-groupes
interface Subgroup {
  id: string;
  classId: number;
  className: string;
  name: string;
}

// Structure des exercices avec poids
interface Exercise {
  name: string;
  weight: number;
}

// Définition de la structure de l'état sauvegardé
interface SavedState {
  selectedClassIds: number[];
  selectedSubgroups: string[];
  exercises: Exercise[];
  manualStudents: Student[];
  selectedStudentIndexes: number[];
  drawResult: { student: Student; exercise: string }[];
  lastUpdated: number; // timestamp pour la fraîcheur des données
}

// Clé pour le localStorage
const STORAGE_KEY = 'tirage_page_state';

export default function TiragePage() {
  // Étape 1 : sélection classe/sous-groupe
  const [classes, setClasses] = useState<Classe[]>([]);
  const [selectedClassIds, setSelectedClassIds] = useState<number[]>([]);
  const [availableSubgroups, setAvailableSubgroups] = useState<Subgroup[]>([]);
  const [selectedSubgroups, setSelectedSubgroups] = useState<string[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [manualStudents, setManualStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  // Étape 2 : gestion des exercices
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [exerciseInput, setExerciseInput] = useState('');
  const [exerciseBatchCount, setExerciseBatchCount] = useState(1);

  // Étape 3 : résultat du tirage
  const [drawResult, setDrawResult] = useState<{ student: Student; exercise: string }[]>([]);
  const [studentsDialogOpen, setStudentsDialogOpen] = useState(false);

  // Nouvel état pour la sélection fine des élèves
  const [selectedStudentIndexes, setSelectedStudentIndexes] = useState<number[]>([]);
  
  // États pour les notifications
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState<string>("État sauvegardé");
  
  // Référence pour suivre si on est en train de charger des données
  const loadingRef = React.useRef(false);
  
  // Référence pour le timeout de sauvegarde
  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const theme = useTheme();
  
  // Fonction pour sauvegarder l'état dans le localStorage
  const saveState = () => {
    try {
      // Ne pas sauvegarder si nous sommes en train de charger des données
      if (loadingRef.current) return;

      if (typeof window !== 'undefined') {
        const stateToSave: SavedState = {
          selectedClassIds,
          selectedSubgroups,
          exercises,
          manualStudents,
          selectedStudentIndexes,
          drawResult,
          lastUpdated: Date.now()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
        
        // Définir le message de sauvegarde
        setNotificationMessage("État sauvegardé");
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'état:', error);
    }
  };

  // Fonction pour restaurer l'état depuis le localStorage
  const loadState = () => {
    try {
      if (typeof window !== 'undefined') {
        // Marquer que nous sommes en train de charger des données
        loadingRef.current = true;
        
        const savedState = localStorage.getItem(STORAGE_KEY);
        if (savedState) {
          const parsedState: SavedState = JSON.parse(savedState);
          
          // Restaurer l'état seulement si les données sont présentes
          if (parsedState.selectedClassIds) setSelectedClassIds(parsedState.selectedClassIds);
          if (parsedState.selectedSubgroups) setSelectedSubgroups(parsedState.selectedSubgroups);
          if (parsedState.exercises) setExercises(parsedState.exercises);
          if (parsedState.manualStudents) setManualStudents(parsedState.manualStudents);
          if (parsedState.selectedStudentIndexes) setSelectedStudentIndexes(parsedState.selectedStudentIndexes);
          if (parsedState.drawResult) setDrawResult(parsedState.drawResult);
          
          // Afficher une notification de chargement
          setNotificationMessage("État chargé");
          setSnackbarOpen(true);
          
          // Gardons le verrou de chargement actif pendant un certain temps
          // pour éviter que les effets ne déclenchent une sauvegarde immédiate
          setTimeout(() => {
            loadingRef.current = false;
          }, 1000); // 1 seconde devrait être suffisante
          
          return true; // Indique que l'état a été restauré avec succès
        }
        
        // Pas d'état sauvegardé, on peut quand même libérer le verrou
        loadingRef.current = false;
      }
      return false; // Aucun état à restaurer
    } catch (error) {
      console.error('Erreur lors de la restauration de l\'état:', error);
      loadingRef.current = false;
      return false;
    }
  };

  // Récupérer la liste des classes au chargement et essayer de restaurer l'état
  useEffect(() => {
    const stateRestored = loadState();
    
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sauvegarder l'état lorsque les données importantes changent
  useEffect(() => {
    // Nettoyer tout timeout existant
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Ne pas sauvegarder immédiatement pour éviter les sauvegardes multiples rapprochées
    // et laisser le temps à loadingRef.current d'être correctement mis à jour
    saveTimeoutRef.current = setTimeout(() => {
      // Sauvegarder uniquement si nous avons des données à sauvegarder
      // et si nous ne sommes pas en train de charger
      if (!loadingRef.current && (selectedClassIds.length > 0 || exercises.length > 0 || manualStudents.length > 0 || drawResult.length > 0)) {
        saveState();
      }
      saveTimeoutRef.current = null;
    }, 500);
    
    // Nettoyage lors du démontage du composant
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [selectedClassIds, selectedSubgroups, exercises, manualStudents, selectedStudentIndexes, drawResult]);

  // Récupérer les sous-groupes et étudiants quand des classes sont sélectionnées
  useEffect(() => {
    if (selectedClassIds.length === 0) {
      setAvailableSubgroups([]);
      setStudents([]);
      return;
    }
    
    setLoading(true);
    
    // Créer un tableau pour stocker les promesses de chargement
    const subgroupPromises = selectedClassIds.map(classId => 
      fetch(`/api/classes/${classId}`)
        .then(res => res.json())
        .then(data => {
          if (data.nbre_subclasses && data.nbre_subclasses > 0) {
            return Array.from({ length: data.nbre_subclasses }, (_, i) => ({
              id: `${classId}-${i + 1}`,
              classId: classId,
              className: classes.find(c => c.id === classId)?.name || `Classe ${classId}`,
              name: (i + 1).toString()
            }));
          }
          return [];
        })
        .catch(() => {
          setError('Erreur lors du chargement des sous-groupes');
          return [];
        })
    );
    
    // Créer un tableau pour stocker les promesses de chargement des étudiants
    const studentPromises = selectedClassIds.map(classId => 
      fetch(`/api/classes/${classId}/students`)
        .then(res => res.json())
        .then(data => data.map((student: Student) => ({...student, class_id: classId})))
        .catch(() => {
          setError('Erreur lors du chargement des étudiants');
          return [];
        })
    );
    
    // Attendre que toutes les promesses soient résolues
    Promise.all([
      Promise.all(subgroupPromises),
      Promise.all(studentPromises)
    ])
      .then(([subgroupsArrays, studentsArrays]) => {
        // Fusionner tous les sous-groupes
        const allSubgroups = subgroupsArrays.flat();
        setAvailableSubgroups(allSubgroups);
        
        // Fusionner tous les étudiants
        const allStudents = studentsArrays.flat();
        setStudents(allStudents);
      })
      .finally(() => setLoading(false));
  }, [selectedClassIds, classes]);

  // Filtrer les étudiants par sous-groupe(s) si sélectionné(s)
  const filteredStudents = selectedSubgroups.length > 0
    ? students.filter(s => {
        // Format des IDs de sous-groupes: "classId-subgroupNumber"
        const studentSubgroupId = s.class_id && s.sub_class 
          ? `${s.class_id}-${s.sub_class}` 
          : null;
        return studentSubgroupId && selectedSubgroups.includes(studentSubgroupId);
      })
    : students;
  const allStudentsRaw = [...filteredStudents, ...manualStudents];
  const allStudents = selectedStudentIndexes.map(i => allStudentsRaw[i]).filter(Boolean);

  // Mettre à jour la sélection des élèves à chaque changement de filteredStudents ou manualStudents
  useEffect(() => {
    // Ne pas réinitialiser selectedStudentIndexes si on vient de restaurer les données
    if (selectedStudentIndexes.length === 0) {
      const newIndexes = Array.from({ length: filteredStudents.length + manualStudents.length }, (_, i) => i);
      if (
        selectedStudentIndexes.length !== newIndexes.length ||
        !selectedStudentIndexes.every((v, i) => v === newIndexes[i])
      ) {
        setSelectedStudentIndexes(newIndexes);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredStudents, manualStudents]);

  // Réinitialiser les résultats du tirage lorsque la sélection d'étudiants change
  useEffect(() => {
    // Vider les résultats précédents si la sélection d'étudiants a changé
    if (drawResult.length > 0) {
      // Vérifier si tous les étudiants du tirage sont encore dans la sélection actuelle
      const allStudentsIds = allStudents.map(s => s.id).filter(Boolean);
      const drawResultStudentIds = drawResult.map(item => item.student.id).filter(Boolean);
      
      // Si certains étudiants du résultat ne sont plus dans la sélection, vider le résultat
      const shouldClearResults = drawResultStudentIds.some(id => id && !allStudentsIds.includes(id));
      
      if (shouldClearResults) {
        setDrawResult([]);
      }
    }
  }, [selectedStudentIndexes, allStudents, drawResult]);

  // Fonction pour effacer les données sauvegardées
  const clearSavedData = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      // Réinitialiser les états
      setSelectedClassIds([]);
      setSelectedSubgroups([]);
      setStudents([]); // Réinitialiser la liste des étudiants
      setExercises([]);
      setManualStudents([]);
      setSelectedStudentIndexes([]);
      setDrawResult([]);
      setAvailableSubgroups([]); // Réinitialiser les sous-groupes aussi
      
      // Afficher une notification de suppression
      setNotificationMessage("Données effacées");
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Erreur lors de la suppression des données:', error);
    }
  };

  // Handler pour (dé)sélectionner un élève
  const handleToggleStudent = (idx: number) => {
    setSelectedStudentIndexes(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };
  
  // Handler pour la suppression d'un étudiant de la sélection (via l'icône X du Chip)
  const handleDeleteStudent = (idx: number, event: React.MouseEvent) => {
    // Empêcher la propagation de l'événement pour éviter que onClick soit aussi déclenché
    event.stopPropagation();
    handleToggleStudent(idx);
  };

  // Ajout d'un exercice (un par un)
  const handleAddExercise = () => {
    if (exerciseInput.trim()) {
      setExercises(prev => [...prev, { name: exerciseInput.trim(), weight: 1 }]);
      setExerciseInput('');
    }
  };
  // Ajout en lot
  const handleBatchAddExercises = () => {
    const base = exercises.length + 1;
    const newExercises = Array.from({ length: exerciseBatchCount }, (_, i) => ({
      name: `Exercice ${base + i}`,
      weight: 1
    }));
    setExercises(prev => [...prev, ...newExercises]);
  };
  // Suppression d'un exercice
  const handleRemoveExercise = (idx: number) => {
    setExercises(prev => prev.filter((_, i) => i !== idx));
  };
  
  // Augmenter le poids d'un exercice
  const handleIncreaseWeight = (idx: number) => {
    setExercises(prev => prev.map((exercise, i) => 
      i === idx ? { ...exercise, weight: exercise.weight + 1 } : exercise
    ));
  };

  // Diminuer le poids d'un exercice
  const handleDecreaseWeight = (idx: number) => {
    setExercises(prev => prev.map((exercise, i) => 
      i === idx && exercise.weight > 1 ? { ...exercise, weight: exercise.weight - 1 } : exercise
    ));
  };

  // Modifier directement le poids d'un exercice
  const handleWeightChange = (idx: number, value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 1) {
      setExercises(prev => prev.map((exercise, i) =>
        i === idx ? { ...exercise, weight: numValue } : exercise
      ));
    }
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
    
    // Créer une liste d'exercices uniques (noms d'exercice distincts)
    const uniqueExerciseNames = Array.from(new Set(exercises.map(ex => ex.name)));
    
    // Vérifier si nous avons assez d'exercices uniques pour tous les étudiants
    const hasEnoughUniqueExercises = uniqueExerciseNames.length >= allStudents.length;
    
    // Tableau d'exercices avec poids appliqués
    // Le poids multiplie le nombre de fois qu'un exercice apparaît dans ce tableau
    // Ce qui augmente sa probabilité d'être tiré
    const weightedExercises: { name: string, originalIndex: number }[] = [];
    
    exercises.forEach((ex, idx) => {
      for (let i = 0; i < ex.weight; i++) {
        weightedExercises.push({ 
          name: ex.name,
          originalIndex: idx
        });
      }
    });
    
    // Mélanger les étudiants pour une répartition équitable
    const shuffledStudents = [...allStudents].sort(() => Math.random() - 0.5);
    let result: { student: Student; exercise: string }[] = [];
    
    // Cas où nous avons assez d'exercices uniques pour tous les étudiants
    if (hasEnoughUniqueExercises) {
      // Au lieu d'utiliser uniquement les noms uniques, on va créer un pool d'exercices pondéré
      // en respectant les poids relatifs de chaque exercice
      const weightedPool: string[] = [];
      
      // Pour chaque exercice unique
      uniqueExerciseNames.forEach(name => {
        // Trouver tous les exercices avec ce nom (peut-être dupliqués dans la liste originale)
        const matchingExercises = exercises.filter(ex => ex.name === name);
        
        // Calculer le poids total pour cet exercice (somme des poids de tous les exercices avec ce nom)
        const totalWeight = matchingExercises.reduce((sum, ex) => sum + ex.weight, 0);
        
        // Ajouter l'exercice au pool un nombre de fois proportionnel à son poids
        // Nous utilisons une normalization pour éviter d'avoir des tableaux trop grands
        const normalizedWeight = Math.max(1, Math.round(totalWeight * 10 / exercises.reduce((sum, ex) => sum + ex.weight, 0)));
        
        // Ajouter l'exercice au pool normalisé
        for (let i = 0; i < normalizedWeight; i++) {
          weightedPool.push(name);
        }
      });
      
      // Mélanger le pool pondéré
      const shuffledPool = [...weightedPool].sort(() => Math.random() - 0.5);
      
      // Créer un tableau pour suivre quels exercices ont été assignés
      const assignedExercises = new Set<string>();
      
      // Assigner un exercice unique à chaque étudiant
      result = shuffledStudents.map((student) => {
        // Si tous les exercices uniques ont été assignés, réinitialiser
        if (assignedExercises.size >= uniqueExerciseNames.length) {
          assignedExercises.clear();
        }
        
        // Trouver le premier exercice non assigné dans le pool mélangé
        let selectedExercise: string | undefined;
        
        // Chercher parmi les exercices du pool en respectant leur ordre
        for (const exercise of shuffledPool) {
          if (!assignedExercises.has(exercise)) {
            selectedExercise = exercise;
            break;
          }
        }
        
        // Si on n'a pas trouvé d'exercice non assigné (cas improbable), prendre le premier du pool
        if (!selectedExercise) {
          selectedExercise = shuffledPool[0];
        }
        
        // Marquer cet exercice comme assigné
        assignedExercises.add(selectedExercise);
        
        return {
          student,
          exercise: selectedExercise
        };
      });
    } else {
      // Cas où il y a plus d'étudiants que d'exercices uniques disponibles
      
      // Structure pour suivre les exercices restants et leurs poids
      const remainingExercises = [...exercises.map(ex => ({ ...ex }))];
      
      // Créer un registre des exercices disponibles par nom
      // pour savoir quels exercices uniques sont encore disponibles
      const availableUniqueExercises = new Set(uniqueExerciseNames);
      
      // Pour chaque étudiant
      result = shuffledStudents.map(student => {
        // Si tous les exercices ont été utilisés, réinitialiser la disponibilité
        if (availableUniqueExercises.size === 0) {
          uniqueExerciseNames.forEach(name => availableUniqueExercises.add(name));
          
          // Réinitialiser aussi les poids aux valeurs originales
          for (let i = 0; i < remainingExercises.length; i++) {
            remainingExercises[i].weight = exercises[i].weight;
          }
        }
        
        // Tableau temporaire pour le tirage pondéré (uniquement avec les exercices disponibles)
        const weightedPool: string[] = [];
        
        // Pour chaque exercice restant, on l'ajoute proportionnellement à son poids
        // mais seulement s'il est dans le set des exercices disponibles
        remainingExercises.forEach(ex => {
          if (availableUniqueExercises.has(ex.name)) {
            for (let i = 0; i < ex.weight; i++) {
              weightedPool.push(ex.name);
            }
          }
        });
        
        // Choisir un exercice au hasard du pool pondéré
        const randomIndex = Math.floor(Math.random() * weightedPool.length);
        const selectedExercise = weightedPool[randomIndex];
        
        // Retirer l'exercice sélectionné des disponibles tant qu'il reste d'autres options
        availableUniqueExercises.delete(selectedExercise);
        
        return {
          student,
          exercise: selectedExercise
        };
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
          <Divider sx={{ my: 3, borderColor: theme.palette.secondary.light }} />
          <Typography variant="h6" gutterBottom sx={{my: 2}}>1. Sélection des classes et groupes</Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2, alignItems: 'center' }}>
            <FormControl sx={{ minWidth: 250, flexGrow: 1 }} size="small">
              <InputLabel>Classes</InputLabel>
              <Select
                multiple
                value={selectedClassIds}
                label="Classes"
                renderValue={(selected) => 
                  selected.map(id => classes.find(c => c.id === id)?.name || `Classe ${id}`).join(', ')
                }
                onChange={e => {
                  const newClassIds = e.target.value as number[];
                  setSelectedClassIds(newClassIds);
                  // Filtrer les sous-groupes pour ne garder que ceux des classes encore sélectionnées
                  setSelectedSubgroups(prev => prev.filter(sg => {
                    const classId = Number(sg.split('-')[0]);
                    return newClassIds.includes(classId);
                  }));
                  setDrawResult([]);
                }}
              >
                {classes.map(cls => (
                  <MenuItem key={cls.id} value={cls.id}>
                    {cls.name} ({cls.academic_year})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {availableSubgroups.length > 0 && (
              <FormControl sx={{ minWidth: 250, flexGrow: 1 }} size="small">
                <InputLabel>Groupes</InputLabel>
                <Select
                  multiple
                  value={selectedSubgroups}
                  label="Groupes"
                  renderValue={(selected) => 
                    selected.length <= 2 
                    ? selected.map(id => {
                        const subgroup = availableSubgroups.find(sg => sg.id === id);
                        return subgroup ? `${subgroup.className} - Groupe ${subgroup.name}` : id;
                      }).join(', ')
                    : `${selected.length} groupes sélectionnés`
                  }
                  onChange={e => {
                    setSelectedSubgroups(e.target.value as string[]);
                    // Réinitialiser la sélection d'étudiants lors du changement de groupe
                    setSelectedStudentIndexes([]);
                    setDrawResult([]);
                  }}
                >
                  {availableSubgroups.map(sg => (
                    <MenuItem key={sg.id} value={sg.id}>
                      {sg.className} - Groupe {sg.name}
                    </MenuItem>
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
          <Typography variant="h6" gutterBottom sx={{my: 2}}>2. Ajouter des étudiants manuellement</Typography>
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
          <Typography variant="h6" gutterBottom sx={{my: 2}}>3. Ajouter des exercices</Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2, justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField
              label="Nom de l'exercice"
              value={exerciseInput}
              onChange={e => setExerciseInput(e.target.value)}
              size="small"
              onKeyDown={e => { if (e.key === 'Enter') handleAddExercise(); }}
            />
            <IconButton color="success"  onClick={handleAddExercise}><AddIcon /></IconButton>
              </Box>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField
              label="Ajouter en lot"
              type="number"
              size="small"
              value={exerciseBatchCount}
              onChange={e => setExerciseBatchCount(Number(e.target.value))}
              sx={{ width: 100 }}
              slotProps={{
                input: { 
                  inputProps: { min: 1, type: 'number', step: 1 },
                  }
              }}
            />
            <Button variant="outlined" onClick={handleBatchAddExercises}>Ajouter {exerciseBatchCount}</Button>
              </Box>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', flexDirection: 'column', gap: 1, mb: 2 }}>
            {exercises.map((ex, idx) => (
              <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <TextField
                  value={ex.name}
                  size="small"
                  onChange={e => {
                    const newVal = e.target.value;
                    setExercises(prev => prev.map((v, i) => i === idx ? { ...v, name: newVal } : v));
                  }}
                  sx={{ minWidth: 120 }}
                />
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'row', 
                  alignItems: 'center',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  px: 0.5,
                  mx: 0.5
                }}>
                  <IconButton 
                    onClick={() => handleIncreaseWeight(idx)} 
                    color="primary" 
                    size="small">
                    <AddCircleOutlineIcon fontSize="small" />
                  </IconButton>
                  {/*<Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: 'bold', 
                      textAlign: 'center',
                      minWidth: '1.5rem'
                    }}>
                    {ex.weight}
                  </Typography> */}
                <TextField
                  value={ex.weight}
                  size="small"
                  onChange={e => handleWeightChange(idx, e.target.value)}
                  sx={{ 
                    width: 60,
                    "& input": {
                      textAlign: "center",
                      // Remove spinner arrows
                      "&::-webkit-outer-spin-button, &::-webkit-inner-spin-button": {
                        WebkitAppearance: "none",
                        margin: 0
                      },
                      "&[type=number]": {
                        MozAppearance: "textfield" // Firefox
                      }
                    }
                  }}
                  slotProps={{
                    input: { 
                      inputProps: { min: 1, type: 'number', step: 1 },
                    }
                  }}
                />
                  <IconButton 
                    onClick={() => handleDecreaseWeight(idx)} 
                    color="primary" 
                    size="small" 
                    disabled={ex.weight <= 1}>
                    <RemoveCircleOutlineIcon fontSize="small" />
                  </IconButton>
                </Box>
                <IconButton onClick={() => handleRemoveExercise(idx)} color="error" size="small">
                  <RemoveIcon />
                </IconButton>
              </Box>
            ))}
          </Box>
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" gutterBottom sx={{my: 2}}>4. Tirage au sort</Typography>
          {/* Sélection fine des élèves */}
          {allStudentsRaw.length > 0 && (
            <Box sx={{ mb: 2 }}>
              {selectedStudentIndexes.length > 0 && (
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
                  Désélectionner des élèves si besoin :
                </Typography>
              )}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {allStudentsRaw.map((student, idx) => (
                  <Chip
                    key={idx}
                    label={`${student.first_name} ${student.last_name}`.trim() || 'Sans nom'}
                    color={selectedStudentIndexes.includes(idx) ? 'primary' : 'default'}
                    variant={selectedStudentIndexes.includes(idx) ? 'filled' : 'outlined'}
                    onClick={() => handleToggleStudent(idx)}
                    onDelete={selectedStudentIndexes.includes(idx) ? (event) => handleDeleteStudent(idx, event) : undefined}
                    deleteIcon={selectedStudentIndexes.includes(idx) ? <CloseIcon /> : undefined}
                    sx={{ mb: 1, opacity: selectedStudentIndexes.includes(idx) ? 1 : 0.5, cursor: 'pointer' }}
                    clickable
                  />
                ))}
              </Box>
            </Box>
          )}
          <Box sx={{ display: 'flex', justifyContent: 'end', mb: 2 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<ShuffleIcon />}
            onClick={handleDraw}
            disabled={allStudents.length === 0 || exercises.length === 0}
          >
            Lancer le tirage
          </Button>
          </Box>
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </Box>
      </Paper>
      <Divider sx={{ my: 2 }} />
        {drawResult.length > 0 && (
          <Paper elevation={3} sx={{ mt: 4, mb: 2, p: 3, borderRadius: 3, background: (theme) => theme.palette.background.paper, boxShadow: 4 }}>
            <Typography variant="h6" gutterBottom>Résultat du tirage</Typography>
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
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={3000}
          onClose={() => setSnackbarOpen(false)}
          message={notificationMessage}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          sx={{
            '& .MuiPaper-root': {
              minWidth: 'auto',
              maxWidth: 'fit-content',
              px: 2,
              py: 1,
              borderRadius: 2,
              fontWeight: 500
            }
          }}
        />
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <Button 
            variant="outlined" 
            color="error" 
            startIcon={<RemoveIcon />} 
            onClick={clearSavedData}
            sx={{ mb: 2, fontWeight: 600, 
              textTransform: 'none',
              borderRadius: 2, boxShadow: 2, 
            }}
          >
            Effacer les données sauvegardées
          </Button>
        </Box>
    </Container>
  );
}
