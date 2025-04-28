'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Chip,
  InputAdornment,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  FormControlLabel,
  Card,
  CardContent,
  Grid,
  Switch,
  alpha
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import KeyIcon from '@mui/icons-material/Key';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { Student } from '@/lib/types';

interface StudentPasswordManagerProps {
  open: boolean;
  onClose: () => void;
  students: Student[];
  context: 'all' | 'single' | 'multiple' | 'class';
  studentId?: number;
  classId?: number;
  title?: string;
}

export default function StudentPasswordManager({
  open,
  onClose,
  students,
  context,
  studentId,
  classId,
  title = 'Gestion des mots de passe étudiants'
}: StudentPasswordManagerProps) {
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // État pour le formulaire de modification du mot de passe
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  // État pour suivre quels étudiants ont des mots de passe
  const [studentsWithPassword, setStudentsWithPassword] = useState<Record<number, boolean>>({});
  
  // États pour la sélection multiple et les filtres
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // États pour les filtres par classe et sous-classe
  const [availableClasses, setAvailableClasses] = useState<{id: number, name: string}[]>([]);
  const [selectedClassFilter, setSelectedClassFilter] = useState<number | 'all'>('all');
  const [availableSubClasses, setAvailableSubClasses] = useState<string[]>([]);
  const [selectedSubClassFilter, setSelectedSubClassFilter] = useState<string | 'all'>('all');
  
  // État pour la génération en lot de mots de passe
  const [batchPassword, setBatchPassword] = useState('');
  const [showBatchPasswordForm, setShowBatchPasswordForm] = useState(false);
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [batchResults, setBatchResults] = useState<{success: number, failed: number}>({ success: 0, failed: 0 });
  
  // État pour le mode de génération (manuel ou automatique)
  const [autoGeneratePasswords, setAutoGeneratePasswords] = useState(true);
  
  // État pour suivre la progression en temps réel pour la génération de mots de passe en lot
  const [batchProgress, setBatchProgress] = useState(0);
  
  // Fonction pour filtrer et trier les étudiants en fonction du contexte
  useEffect(() => {
    let filtered = [...students];
    
    // Extraire les classes uniques des étudiants pour les filtres
    const classesSet = new Set<string>();
    const classesMap = new Map<number, string>();
    
    students.forEach(student => {
      // Collecter les classes de l'étudiant
      if (student.allClasses && student.allClasses.length > 0) {
        student.allClasses.forEach(cls => {
          if (cls.classId && cls.className) {
            classesMap.set(cls.classId, cls.className);
          }
        });
      } else if (student.classId && student.className) {
        classesMap.set(student.classId, student.className);
      }
    });
    
    // Convertir la Map en tableau pour le filtre de classes
    const classesArray = Array.from(classesMap).map(([id, name]) => ({ id, name }));
    setAvailableClasses(classesArray);
    
    // Filtrer par contexte
    if (context === 'single' && studentId) {
      filtered = filtered.filter(student => student.id === studentId);
    } else if (context === 'class' && classId) {
      filtered = filtered.filter(student => 
        student.allClasses?.some(cls => cls.classId === classId) || 
        student.classId === classId
      );
    }
    
    // Appliquer le filtre de classe
    if (selectedClassFilter !== 'all') {
      filtered = filtered.filter(student => 
        student.allClasses?.some(cls => cls.classId === selectedClassFilter) || 
        student.classId === selectedClassFilter
      );
      
      // Extraire les sous-classes disponibles pour cette classe
      const subClasses = new Set<string>();
      filtered.forEach(student => {
        const classInfo = student.allClasses?.find(cls => cls.classId === selectedClassFilter);
        if (classInfo?.sub_class) {
          subClasses.add(classInfo.sub_class.toString());
        } else if (student.classId === selectedClassFilter && student.sub_class) {
          subClasses.add(student.sub_class.toString());
        }
      });
      
      setAvailableSubClasses(Array.from(subClasses).sort());
    } else {
      setAvailableSubClasses([]);
      setSelectedSubClassFilter('all');
    }
    
    // Appliquer le filtre de sous-classe
    if (selectedSubClassFilter !== 'all') {
      filtered = filtered.filter(student => {
        // Cas des étudiants avec allClasses
        if (student.allClasses && student.allClasses.length > 0) {
          const classInfo = student.allClasses.find(
            cls => (selectedClassFilter === 'all' || cls.classId === selectedClassFilter) && 
            cls.sub_class?.toString() === selectedSubClassFilter
          );
          return Boolean(classInfo);
        }
        
        // Cas des étudiants avec classId direct
        return (selectedClassFilter === 'all' || student.classId === selectedClassFilter) && 
               student.sub_class?.toString() === selectedSubClassFilter;
      });
    }
    
    // Appliquer le filtre de recherche
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        student => 
          student.first_name.toLowerCase().includes(term) || 
          student.last_name.toLowerCase().includes(term) || 
          (student.email?.toLowerCase().includes(term))
      );
    }
    
    // Trier par nom, prénom
    filtered.sort((a, b) => 
      `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`)
    );
    
    setFilteredStudents(filtered);
    
    // Réinitialiser la sélection quand le filtre change
    setSelectedStudentIds(new Set());
    setSelectAll(false);
  }, [students, context, studentId, classId, searchTerm, selectedClassFilter, selectedSubClassFilter]);
  
  // Charger l'état des mots de passe pour tous les étudiants filtrés
  useEffect(() => {
    async function loadPasswordStatuses() {
      setLoading(true);
      setError(null);
      
      try {
        const statusMap: Record<number, boolean> = {};
        
        // Chargement en parallèle pour de meilleures performances
        const promises = filteredStudents.map(async (student) => {
          try {
            const response = await fetch(`/api/students/${student.id}/password`);
            if (response.ok) {
              const data = await response.json();
              statusMap[student.id] = data.hasPassword;
            }
          } catch (err) {
            console.error(`Erreur lors de la vérification du mot de passe pour l'étudiant ${student.id}:`, err);
          }
        });
        
        await Promise.all(promises);
        setStudentsWithPassword(statusMap);
      } catch (err) {
        console.error('Erreur lors du chargement des statuts de mot de passe:', err);
        setError('Erreur lors du chargement des statuts de mot de passe');
      } finally {
        setLoading(false);
      }
    }
    
    if (open && filteredStudents.length > 0) {
      loadPasswordStatuses();
    }
  }, [filteredStudents, open]);
  
  
  // Fonction pour récupérer le mot de passe actuel
  const fetchCurrentPassword = async (studentId: number) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/students/${studentId}/password?includeValue=true`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.hasPassword && data.passwordValue) {
          setCurrentPassword(data.passwordValue);
        } else {
          setCurrentPassword(null);
        }
      } else {
        setCurrentPassword(null);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération du mot de passe actuel:", error);
      setCurrentPassword(null);
    } finally {
      setLoading(false);
    }
  };
  
  // Fonction pour ouvrir le formulaire de modification du mot de passe
  const handleEditPassword = async (student: Student) => {
    setSelectedStudent(student);
    setNewPassword('');
    setError(null);
    setSuccess(null);
    if (student.id) {
      await fetchCurrentPassword(student.id);
    }
  };
  
  // Fonction pour fermer le formulaire de modification du mot de passe
  const handleCloseEditForm = () => {
    setSelectedStudent(null);
    setNewPassword('');
    setError(null);
    setSuccess(null);
  };
  
  // Fonction pour enregistrer le nouveau mot de passe
  const handleSavePassword = async () => {
    if (!selectedStudent) return;
    
    if (!newPassword.trim()) {
      setError('Le mot de passe ne peut pas être vide');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch(`/api/students/${selectedStudent.id}/password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: newPassword,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la modification du mot de passe');
      }
      
      // Mettre à jour l'état local
      setStudentsWithPassword(prev => ({
        ...prev,
        [selectedStudent.id]: true
      }));
      
      setSuccess('Mot de passe mis à jour avec succès');
      
      // Fermer le formulaire après un court délai
      setTimeout(() => {
        handleCloseEditForm();
      }, 1500);
      
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la modification du mot de passe');
    } finally {
      setLoading(false);
    }
  };
  
  // Fonction pour supprimer le mot de passe
  const handleDeletePassword = async (student: Student) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le mot de passe de ${student.first_name} ${student.last_name} ?`)) {
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch(`/api/students/${student.id}/password`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la suppression du mot de passe');
      }
      
      // Mettre à jour l'état local
      setStudentsWithPassword(prev => ({
        ...prev,
        [student.id]: false
      }));
      
      setSuccess('Mot de passe supprimé avec succès');
      
      // Effacer le message après un court délai
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
      
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la suppression du mot de passe');
    } finally {
      setLoading(false);
    }
  };
  
  // Générer un mot de passe aléatoire
  const generateRandomPassword = (length = 6) => {
    const charset = "abcde12345";
    let password = "";
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    return password;
  };
  
  // Gestion de la sélection de tous les étudiants
  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    setSelectAll(checked);
    
    if (checked) {
      // Sélectionner tous les étudiants filtrés
      const ids = new Set(filteredStudents.map(student => student.id!).filter(Boolean));
      setSelectedStudentIds(ids);
    } else {
      // Désélectionner tous les étudiants
      setSelectedStudentIds(new Set());
    }
  };
  
  // Gestion de la sélection individuelle d'un étudiant
  const handleSelectStudent = (studentId: number, checked: boolean) => {
    const newSelectedIds = new Set(selectedStudentIds);
    
    if (checked) {
      newSelectedIds.add(studentId);
    } else {
      newSelectedIds.delete(studentId);
    }
    
    setSelectedStudentIds(newSelectedIds);
    
    // Mettre à jour l'état "select all" si nécessaire
    if (newSelectedIds.size === filteredStudents.length) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  };
  
  // Appliquer des mots de passe en lot aux étudiants sélectionnés
  const handleBatchPasswordApply = async () => {
    if (selectedStudentIds.size === 0) {
      setError("Veuillez sélectionner au moins un étudiant");
      return;
    }
    
    if (!autoGeneratePasswords && !batchPassword) {
      setError("Veuillez entrer un mot de passe");
      return;
    }
    
    setBatchProcessing(true);
    setError(null);
    setSuccess(null);
    
    const selectedStudents = filteredStudents.filter(s => s.id && selectedStudentIds.has(s.id));
    let successCount = 0;
    let failedCount = 0;
    const updatedStatuses: Record<number, boolean> = { ...studentsWithPassword };
    
    try {
      // Traitement séquentiel pour éviter de surcharger l'API
      for (let i = 0; i < selectedStudents.length; i++) {
        const student = selectedStudents[i];
        if (!student.id) continue;
        
        try {
          // Générer un mot de passe unique pour chaque étudiant si l'option est activée
          const passwordToUse = autoGeneratePasswords 
            ? generateRandomPassword() 
            : batchPassword;
          
          const response = await fetch(`/api/students/${student.id}/password`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              password: passwordToUse,
            }),
          });
          
          if (response.ok) {
            successCount++;
            updatedStatuses[student.id] = true;
          } else {
            failedCount++;
          }
          
          // Mettre à jour la progression après chaque traitement
          const currentProgress = Math.round(((i + 1) / selectedStudents.length) * 100);
          setBatchProgress(currentProgress);
          
        } catch (error) {
          console.error(`Erreur lors de la définition du mot de passe pour l'étudiant ${student.id}:`, error);
          failedCount++;
          
          // Mettre à jour la progression même en cas d'erreur
          const currentProgress = Math.round(((i + 1) / selectedStudents.length) * 100);
          setBatchProgress(currentProgress);
        }
      }
      
      setStudentsWithPassword(updatedStatuses);
      setBatchResults({ success: successCount, failed: failedCount });
      
      if (failedCount === 0) {
        setSuccess(`Mots de passe appliqués avec succès à ${successCount} étudiant(s)`);
      } else {
        setError(`${successCount} mot(s) de passe appliqué(s) avec succès, ${failedCount} échec(s)`);
      }
    } catch (error) {
      console.error("Erreur lors de l'application des mots de passe en lot:", error);
      setError(`Erreur: ${error instanceof Error ? error.message : 'Une erreur inattendue est survenue'}`);
    } finally {
      setBatchProcessing(false);
      setShowBatchPasswordForm(false);
      setBatchPassword("");
      // Réinitialiser la progression
      setBatchProgress(0);
    }
  };
  
  return (
    <>
      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="md" 
        fullWidth 
        aria-labelledby="password-manager-title"
      >
        <DialogTitle id="password-manager-title">
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <LockIcon sx={{ mr: 1 }} />
            <Typography variant="h6" component="div">
              {title}
            </Typography>
          </Box>
          <Typography variant="subtitle2" color="text.secondary">
            Gérez les mots de passe des étudiants pour leur permettre d'accéder à leurs corrections
          </Typography>
        </DialogTitle>
        
        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          )}
          
          {/* Section des actions globales et filtres */}
          <Box sx={{ mb: 2, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1, justifyContent: 'space-between', alignItems: 'flex-start' }}>
            {/* Actions de masse */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={() => setShowBatchPasswordForm(true)}
                disabled={selectedStudentIds.size === 0}
                startIcon={<KeyIcon />}
                size="small"
              >
                Définir mots de passe ({selectedStudentIds.size})
              </Button>
              
              <Button
                variant="outlined"
                color="inherit"
                onClick={() => setShowFilters(!showFilters)}
                startIcon={<FilterListIcon />}
                size="small"
              >
                {showFilters ? 'Masquer filtres' : 'Afficher filtres'}
              </Button>
            </Box>
            
            {/* Barre de recherche */}
            <TextField
              variant="outlined"
              label="Rechercher un étudiant"
              placeholder="Nom, prénom ou email"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              size="small"
              sx={{ minWidth: { sm: '250px' } }}
            />
          </Box>
          
          {/* Filtres avancés */}
          {showFilters && (
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>Filtres avancés</Typography>
                <Grid container spacing={2}>
                  {availableClasses.length > 0 && (
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel id="class-filter-label">Classe</InputLabel>
                        <Select
                          labelId="class-filter-label"
                          value={selectedClassFilter}
                          label="Classe"
                          onChange={(e) => setSelectedClassFilter(e.target.value as number | 'all')}
                        >
                          <MenuItem value="all">Toutes les classes</MenuItem>
                          {availableClasses.map(cls => (
                            <MenuItem key={cls.id} value={cls.id}>
                              {cls.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  )}
                  
                  {availableSubClasses.length > 0 && (
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel id="subclass-filter-label">Groupe</InputLabel>
                        <Select
                          labelId="subclass-filter-label"
                          value={selectedSubClassFilter}
                          label="Groupe"
                          onChange={(e) => setSelectedSubClassFilter(e.target.value)}
                        >
                          <MenuItem value="all">Tous les groupes</MenuItem>
                          {availableSubClasses.map(subClass => (
                            <MenuItem key={subClass} value={subClass}>
                              Groupe {subClass}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          )}
          
          {/* Formulaire de génération de mots de passe en lot */}
          {showBatchPasswordForm && (
            <Card variant="outlined" sx={{ mb: 2, bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.03)' }}>
              <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                  Définir des mots de passe pour {selectedStudentIds.size} étudiant(s)
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={autoGeneratePasswords} 
                        onChange={e => setAutoGeneratePasswords(e.target.checked)} 
                      />
                    }
                    label="Générer automatiquement des mots de passe aléatoires"
                  />
                </Box>
                
                {!autoGeneratePasswords && (
                  <TextField
                    fullWidth
                    label="Mot de passe commun"
                    type={showPassword ? "text" : "password"}
                    value={batchPassword}
                    onChange={e => setBatchPassword(e.target.value)}
                    size="small"
                    sx={{ mb: 2 }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                            {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
                
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                  <Button
                    variant="text"
                    onClick={() => setShowBatchPasswordForm(false)}
                    disabled={batchProcessing}
                  >
                    Annuler
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleBatchPasswordApply}
                    disabled={batchProcessing || (!autoGeneratePasswords && !batchPassword)}
                  >
                    {batchProcessing ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      `Appliquer ${autoGeneratePasswords ? 'les mots de passe aléatoires' : 'le mot de passe'}`
                    )}
                  </Button>
                </Box>
                
                {(batchResults.success > 0 || batchResults.failed > 0) && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      Résultats: 
                      <Chip 
                        size="small" 
                        color="success" 
                        label={`${batchResults.success} réussite(s)`} 
                        sx={{ ml: 1 }}
                      />
                      {batchResults.failed > 0 && (
                        <Chip 
                          size="small" 
                          color="error" 
                          label={`${batchResults.failed} échec(s)`} 
                          sx={{ ml: 1 }}
                        />
                      )}
                    </Typography>
                  </Box>
                )}
                
                {batchProcessing && (
                  <Box sx={{ width: '100%', mt: 2 }}>
                    <Typography variant="body2" color="primary" sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <span>Progression</span>
                      <span>{batchProgress}%</span>
                    </Typography>
                    <Box sx={{ width: '100%', position: 'relative' }}>
                      <Box
                        sx={{
                          height: 10,
                          borderRadius: 5,
                          bgcolor: theme => alpha(theme.palette.primary.main, 0.2),
                          width: '100%',
                        }}
                      />
                      <Box
                        sx={{
                          height: 10,
                          borderRadius: 5,
                          bgcolor: 'primary.main',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          transition: 'width 0.3s ease',
                          width: `${batchProgress}%`,
                        }}
                      />
                    </Box>
                    <Typography variant="caption" sx={{ display: 'block', mt: 0.5, textAlign: 'center' }}>
                      Veuillez patienter pendant que les mots de passe sont générés...
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}
          
          {loading && filteredStudents.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredStudents.length === 0 ? (
            <Alert severity="info">
              Aucun étudiant trouvé dans ce contexte
            </Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectAll}
                        onChange={handleSelectAll}
                        indeterminate={selectedStudentIds.size > 0 && selectedStudentIds.size < filteredStudents.length}
                      />
                    </TableCell>
                    <TableCell>Étudiant</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow 
                      key={student.id}
                      selected={student.id ? selectedStudentIds.has(student.id) : false}
                      hover
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={student.id ? selectedStudentIds.has(student.id) : false}
                          onChange={(e) => student.id && handleSelectStudent(student.id, e.target.checked)}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {student.first_name} {student.last_name}
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                          {/* Affichage de la classe */}
                          {(student.className || (student.allClasses && student.allClasses.length > 0)) && (
                            <Chip
                              size="small"
                              label={student.className || student.allClasses?.[0]?.className || ''}
                              sx={{ fontSize: '0.7rem' }}
                              variant="outlined"
                              color="primary"
                            />
                          )}
                          {/* Affichage du groupe */}
                          {student.sub_class && (
                            <Chip
                              size="small"
                              label={`Groupe ${student.sub_class}`}
                              sx={{ fontSize: '0.7rem' }}
                              variant="outlined"
                              color="secondary"
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color={student.email ? 'textPrimary' : 'textSecondary'}>
                          {student.email || 'Non défini'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {loading ? (
                          <CircularProgress size={20} />
                        ) : studentsWithPassword[student.id] ? (
                          <Chip 
                            size="small" 
                            color="success" 
                            label="Protégé" 
                            icon={<LockIcon fontSize="small" />} 
                          />
                        ) : (
                          <Chip 
                            size="small" 
                            color="error" 
                            label="Non protégé" 
                            icon={<LockOpenIcon fontSize="small" />} 
                          />
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Modifier le mot de passe">
                          <IconButton 
                            color="primary" 
                            onClick={() => handleEditPassword(student)}
                            disabled={loading}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        
                        {studentsWithPassword[student.id] && (
                          <Tooltip title="Supprimer le mot de passe">
                            <IconButton 
                              color="error" 
                              onClick={() => handleDeletePassword(student)}
                              disabled={loading}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={onClose} color="primary">
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialogue pour éditer le mot de passe */}
      <Dialog 
        open={Boolean(selectedStudent)} 
        onClose={handleCloseEditForm}
        maxWidth="sm"
        fullWidth
      >
        {selectedStudent && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <LockIcon sx={{ mr: 1 }} />
                <Typography variant="h6" component="div">
                  {studentsWithPassword[selectedStudent.id] 
                    ? 'Modifier le mot de passe' 
                    : 'Définir un mot de passe'}
                </Typography>
              </Box>
              <Typography variant="subtitle2" color="text.secondary">
                {selectedStudent.first_name} {selectedStudent.last_name}
              </Typography>
            </DialogTitle>
            
            <DialogContent>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
              
              {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  {success}
                </Alert>
              )}
              
              {currentPassword && (
                <Box sx={{ 
                  mb: 2, 
                  p: 2, 
                  bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.03)', 
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: theme => theme.palette.primary.light,
                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                }}>
                  <Typography variant="subtitle1" gutterBottom fontWeight="bold" color="primary">
                    Mot de passe actuel
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Chip
                      label={showPassword ? currentPassword : '••••••••'}
                      color="primary"
                      variant="filled"
                      size="medium"
                      icon={<KeyIcon />}
                      sx={{ 
                        p: 3,
                        height: 'auto',
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        fontFamily: 'monospace',
                        letterSpacing: '0.05em',
                        '& .MuiChip-label': {
                          p: 1
                        },
                        '& .MuiChip-icon': {
                          ml: 1
                        }
                      }}
                      deleteIcon={showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      onDelete={() => setShowPassword(!showPassword)}
                    />
                    <Tooltip title="Copier le mot de passe">
                      <Button
                        variant="outlined"
                        color="primary"
                        size="small"
                        startIcon={<ContentCopyIcon />}
                        onClick={() => {
                          if (currentPassword) {
                            navigator.clipboard.writeText(currentPassword);
                            // Afficher une notification ou un message de succès temporaire
                            setSuccess("Mot de passe copié dans le presse-papiers");
                            setTimeout(() => {
                              setSuccess(null);
                            }, 2000);
                          }
                        }}
                      >
                        Copier
                      </Button>
                    </Tooltip>
                  </Box>
                </Box>
              )}
              
              <TextField
                autoFocus
                margin="dense"
                label="Nouveau mot de passe"
                type={showPassword ? "text" : "password"}
                fullWidth
                variant="outlined"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading || Boolean(success)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                <Button
                  size="small"
                  startIcon={<KeyIcon />}
                  onClick={() => setNewPassword(generateRandomPassword())}
                  disabled={loading || Boolean(success)}
                >
                  Générer aléatoire
                </Button>
                
                <Typography variant="caption" color="text.secondary">
                  Ce mot de passe permettra à l'étudiant d'accéder à ses corrections en toute sécurité.
                </Typography>
              </Box>
            </DialogContent>
            
            <DialogActions>
              <Button onClick={handleCloseEditForm} color="inherit" disabled={loading}>
                Annuler
              </Button>
              <Button 
                onClick={handleSavePassword} 
                color="primary" 
                variant="contained"
                disabled={loading || !newPassword.trim() || Boolean(success)}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : studentsWithPassword[selectedStudent.id] ? (
                  'Mettre à jour'
                ) : (
                  'Enregistrer'
                )}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  );
}