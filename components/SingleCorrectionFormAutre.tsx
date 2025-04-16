'use client';

import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  Box, 
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Divider,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  Snackbar,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Slider
} from '@mui/material';
import MuiAlert, { AlertProps } from '@mui/material/Alert';
import CloseIcon from '@mui/icons-material/Close';
import { SelectChangeEvent } from '@mui/material/Select';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SendIcon from '@mui/icons-material/Send';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import SearchIcon from '@mui/icons-material/Search';
import WarningIcon from '@mui/icons-material/Warning';

import { ActivityAutre } from '@/lib/types';
import { Student, Class, ClassStudent } from '@/lib/types';

interface SingleCorrectionFormAutreProps {
  activityId: string;
  activity: ActivityAutre | null;
  onSuccess: (correctionId: string) => void;
}

const SingleCorrectionFormAutre: React.FC<SingleCorrectionFormAutreProps> = ({ 
  activityId, 
  activity,
  onSuccess
}) => {
  // État pour les étudiants et les classes
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [classStudents, setClassStudents] = useState<ClassStudent[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  
  // État pour les notes par partie
  const [partScores, setPartScores] = useState<(number | '')[]>([]);
  
  // États UI
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [openSnackbar, setOpenSnackbar] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAddStudent, setShowAddStudent] = useState<boolean>(false);
  const [newStudentName, setNewStudentName] = useState<string>('');
  const [newStudentEmail, setNewStudentEmail] = useState<string>('');
  const [openConfirmDialog, setOpenConfirmDialog] = useState<boolean>(false);
  
  // État pour continuer à itérer
  const [continueToIterate, setContinueToIterate] = useState<boolean>(false);
  
  // Initialiser les scores quand l'activité change
  useEffect(() => {
    if (activity && activity.points) {
      setPartScores(Array(activity.points.length).fill(''));
    }
  }, [activity]);
  
  // Calculer la note totale
  const totalScore = partScores.reduce((sum: number, score) => sum + (score !== '' ? Number(score) : 0), 0);
  const totalPoints = activity?.points ? activity.points.reduce((sum: number, point: number) => sum + point, 0) : 0;
  const scorePercentage = totalPoints > 0 ? (totalScore / totalPoints) * 100 : 0;
  
  // Charger les étudiants et les classes au chargement du composant
  useEffect(() => {
    fetchStudents();
    fetchClasses();
    fetchClassStudents();
  }, []);
  
  // Filtrer les étudiants quand la classe change
  useEffect(() => {
    if (selectedClassId) {
      // Trouver les ID des étudiants qui sont dans la classe sélectionnée
      const studentIdsInClass = classStudents
        .filter(cs => cs.class_id.toString() === selectedClassId)
        .map(cs => cs.student_id);
      
      // Filtrer les étudiants qui sont dans la classe sélectionnée
      const studentsInClass = students.filter(student => 
        studentIdsInClass.includes(student.id)
      );
      
      setFilteredStudents(studentsInClass);
    } else {
      // Si aucune classe n'est sélectionnée, afficher tous les étudiants
      setFilteredStudents(students);
    }
  }, [selectedClassId, students, classStudents]);
  
  // Filtrer les étudiants quand la recherche change
  useEffect(() => {
    if (searchQuery) {
      // Déterminer la base d'étudiants à filtrer (tous ou ceux d'une classe spécifique)
      let baseStudents = students;
      
      if (selectedClassId) {
        const studentIdsInClass = classStudents
          .filter(cs => cs.class_id.toString() === selectedClassId)
          .map(cs => cs.student_id);
        
        baseStudents = students.filter(student => 
          studentIdsInClass.includes(student.id)
        );
      }
      
      // Filtrer par nom ou email
      const searched = baseStudents.filter(student => 
        (student.first_name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (student.last_name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (student.email?.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      
      setFilteredStudents(searched);
    } else {
      // Si pas de recherche, revenir à la liste filtrée par classe
      if (selectedClassId) {
        const studentIdsInClass = classStudents
          .filter(cs => cs.class_id.toString() === selectedClassId)
          .map(cs => cs.student_id);
        
        setFilteredStudents(students.filter(student => 
          studentIdsInClass.includes(student.id)
        ));
      } else {
        setFilteredStudents(students);
      }
    }
  }, [searchQuery, selectedClassId, students, classStudents]);
  
  // Récupérer les étudiants
  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/students');
      if (!response.ok) throw new Error("Erreur lors de la récupération des étudiants");
      
      const data = await response.json();
      setStudents(data);
      setFilteredStudents(data);
    } catch (err) {
      console.error('Erreur:', err);
      setError("Erreur lors du chargement des étudiants");
    }
  };
  
  // Récupérer les classes
  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/classes');
      if (!response.ok) throw new Error("Erreur lors de la récupération des classes");
      
      const data = await response.json();
      setClasses(data);
    } catch (err) {
      console.error('Erreur:', err);
      setError("Erreur lors du chargement des classes");
    }
  };
  
  // Récupérer les relations classe-étudiant
  const fetchClassStudents = async () => {
    try {
      const response = await fetch('/api/class-students');
      if (!response.ok) throw new Error("Erreur lors de la récupération des relations classe-étudiant");
      
      const data = await response.json();
      setClassStudents(data);
    } catch (err) {
      console.error('Erreur:', err);
      setError("Erreur lors du chargement des relations classe-étudiant");
    }
  };
  
  // Gérer le changement de classe
  const handleClassChange = (event: SelectChangeEvent<string>) => {
    setSelectedClassId(event.target.value);
    setSelectedStudentId(''); // Réinitialiser l'étudiant sélectionné
  };
  
  // Gérer la sélection d'étudiant
  const handleStudentSelect = (studentId: string) => {
    setSelectedStudentId(studentId);
  };
  
  // Gérer le changement de score pour une partie
  const handlePartScoreChange = (index: number, value: string) => {
    const newScores = [...partScores];
    
    // Vérifier si la valeur est valide
    const numValue = Number(value);
    if (value === '' || (numValue >= 0 && numValue <= (activity?.points?.[index] || 0))) {
      newScores[index] = value === '' ? '' : numValue;
      setPartScores(newScores);
    }
  };
  
  // Gérer la soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!activityId) {
      setError("Veuillez sélectionner une activité");
      return;
    }
    
    if (!selectedStudentId) {
      setError("Veuillez sélectionner un étudiant");
      return;
    }
    
    // Vérifier que toutes les notes sont renseignées
    if (partScores.some(score => score === '')) {
      setError("Veuillez entrer toutes les notes");
      return;
    }
    
    // Vérifier si une classe est sélectionnée et ouvrir le dialogue si nécessaire
    if (!selectedClassId) {
      setOpenConfirmDialog(true);
      return;
    }
    
    // Procéder à la soumission
    submitCorrection();
  };
  
  // Fonction de soumission effective de la correction
  const submitCorrection = async () => {
    try {
      setLoading(true);
      setError('');
      
      const correctionData = {
        activity_id: activityId,
        student_id: selectedStudentId,
        points_earned: partScores,
        total_score: totalScore,
        class_id: selectedClassId || null
      };
      
      const response = await fetch('/api/corrections_autres', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(correctionData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la création de la correction");
      }
      
      const data = await response.json();
      
      if (data && data.id) {
        if (continueToIterate) {
          // Réinitialiser le formulaire pour une nouvelle correction
          setPartScores(Array(activity?.points?.length || 0).fill(''));
          setSelectedStudentId('');
          setError('');
          // Afficher un message de succès avec la snackbar
          setSuccessMessage(`Correction ajoutée avec succès pour l'étudiant.`);
          setOpenSnackbar(true);
        } else {
          // Comportement normal : rediriger vers la page de succès
          onSuccess(data.id.toString());
        }
      }
      
    } catch (err) {
      console.error('Erreur:', err);
      setError(err instanceof Error ? err.message : "Erreur lors de la création de la correction");
    } finally {
      setLoading(false);
    }
  };
  
  // Ajouter un nouvel étudiant
  const handleAddStudent = async () => {
    if (!newStudentName || !newStudentEmail) {
      setError("Veuillez remplir tous les champs pour ajouter un étudiant");
      return;
    }
    
    try {
      setLoading(true);
      
      // 1. Créer l'étudiant
      const studentData = {
        name: newStudentName,
        email: newStudentEmail
      };
      
      const studentResponse = await fetch('/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(studentData),
      });
      
      if (!studentResponse.ok) {
        const errorData = await studentResponse.json();
        throw new Error(errorData.error || "Erreur lors de l'ajout de l'étudiant");
      }
      
      const newStudent = await studentResponse.json();
      
      // 2. Si une classe est sélectionnée, associer l'étudiant à cette classe
      if (selectedClassId) {
        const classStudentData = {
          class_id: selectedClassId,
          student_id: newStudent.id
        };
        
        const linkResponse = await fetch('/api/class-students', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(classStudentData),
        });
        
        if (!linkResponse.ok) {
          console.warn("L'étudiant a été créé mais n'a pas pu être associé à la classe");
          // On ne lance pas d'erreur ici pour ne pas bloquer le processus
        } else {
          // Ajouter la nouvelle relation à notre état
          const newLink = await linkResponse.json();
          setClassStudents(prev => [...prev, newLink]);
        }
      }
      
      // Ajouter le nouvel étudiant à la liste et le sélectionner
      setStudents(prev => [...prev, newStudent]);
      setSelectedStudentId(newStudent.id.toString());
      
      // Réinitialiser le formulaire d'ajout
      setNewStudentName('');
      setNewStudentEmail('');
      setShowAddStudent(false);
      
    } catch (err) {
      console.error('Erreur:', err);
      setError(err instanceof Error ? err.message : "Erreur lors de l'ajout de l'étudiant");
    } finally {
      setLoading(false);
    }
  };
  
  // Formater le nom de l'étudiant pour l'affichage
  const formatStudentName = (student: Student) => {
    const firstName = student.first_name || '';
    const lastName = student.last_name || '';
    
    return `${firstName} ${lastName}`.trim() || 'Étudiant sans nom';
  };
  
  // Gestion de la fermeture de la snackbar
  const handleCloseSnackbar = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpenSnackbar(false);
  };

  return (
    <Paper className="p-6 rounded-lg shadow-md border-t-4 border-blue-600">
      <div className="flex items-center gap-2 mb-6">
        <AssignmentTurnedInIcon className="text-blue-600" fontSize="large" />
        <Typography variant="h5" className="font-bold">
          Formulaire de correction
        </Typography>
      </div>
      
      {error && (
        <Alert severity="error" className="mb-4">
          {error}
        </Alert>
      )}
      
      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Sélection de classe */}
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="class-select-label">Classe</InputLabel>
              <Select
                labelId="class-select-label"
                id="class-select"
                value={selectedClassId}
                onChange={handleClassChange}
                label="Classe"
              >
                <MenuItem value="">
                  <em>Tous les étudiants</em>
                </MenuItem>
                {classes.map((cls) => (
                  <MenuItem key={cls.id} value={cls.id?.toString() || ""}>
                    {cls.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          {/* Recherche d'étudiant */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ position: 'relative' }}>
              <TextField
                fullWidth
                variant="outlined"
                label="Rechercher un étudiant"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nom ou email"
                slotProps={{
                  input: {
                    startAdornment: (
                      <Box sx={{ color: 'action.active', mr: 1, mt: 0.5 }}>
                        <SearchIcon />
                      </Box>
                    ),
                  }
                }}
              />
            </Box>
          </Grid>
          
          {/* Liste d'étudiants scrollable au lieu d'un select */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle1" className="mb-2 font-medium">
              Sélectionner un étudiant
            </Typography>
            <Paper variant="outlined" className="border rounded overflow-hidden">
              {/* Boîte de liste scrollable */}
              <Box sx={{
                maxHeight: '240px',
                overflowY: 'auto',
                borderRadius: 1,
                '&::-webkit-scrollbar': {
                  width: '8px',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: '#ccc',
                  borderRadius: '4px',
                },
              }}>
                {filteredStudents.length > 0 ? (
                  <Box component="ul" sx={{ 
                    padding: 0, 
                    margin: 0, 
                    listStyle: 'none' 
                  }}>
                    {filteredStudents.map((student) => (
                      <Box
                        component="li"
                        key={student.id}
                        sx={{
                          padding: '10px 16px',
                          borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s',
                          backgroundColor: selectedStudentId === student.id?.toString() 
                            ? 'rgba(25, 118, 210, 0.08)' 
                            : 'transparent',
                          '&:hover': {
                            backgroundColor: selectedStudentId === student.id?.toString()
                              ? 'rgba(25, 118, 210, 0.12)'
                              : 'rgba(0, 0, 0, 0.04)',
                          },
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                        onClick={() => handleStudentSelect(student.id?.toString() || "")}
                      >
                        <Box>
                          <Typography variant="body1" fontWeight={selectedStudentId === student.id?.toString() ? "bold" : "normal"}>
                            {formatStudentName(student)}
                          </Typography>
                          {student.email && (
                            <Typography variant="body2" color="text.secondary">
                              {student.email}
                            </Typography>
                          )}
                        </Box>
                        {selectedStudentId === student.id?.toString() && (
                          <div className="text-blue-600">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          </div>
                        )}
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Box sx={{ padding: '16px', textAlign: 'center' }}>
                    <Typography variant="body1" color="text.secondary">
                      Aucun étudiant trouvé
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>
            <div className="mt-2 flex justify-between items-center">
              <div>
                {selectedStudentId && (
                  <Typography variant="body2" color="primary">
                    1 étudiant sélectionné
                  </Typography>
                )}
              </div>
              <Button
                variant="text"
                size="small"
                startIcon={<PersonAddIcon />}
                onClick={() => setShowAddStudent(!showAddStudent)}
              >
                {showAddStudent ? 'Annuler' : 'Ajouter un nouvel étudiant'}
              </Button>
            </div>
          </Grid>
          
          {/* Formulaire d'ajout d'étudiant */}
          {showAddStudent && (
            <Grid size={{ xs: 12 }}>
              <Paper className="p-4 mb-4 bg-gray-50 border rounded">
                <Typography variant="subtitle1" className="font-bold mb-3">
                  Nouvel étudiant
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 5 }}>
                    <TextField
                      fullWidth
                      variant="outlined"
                      label="Nom complet"
                      value={newStudentName}
                      onChange={(e) => setNewStudentName(e.target.value)}
                      required
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 5 }}>
                    <TextField
                      fullWidth
                      variant="outlined"
                      label="Email"
                      type="email"
                      value={newStudentEmail}
                      onChange={(e) => setNewStudentEmail(e.target.value)}
                      required
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 2 }} className="flex items-center">
                    <Button
                      variant="contained"
                      color="primary"
                      fullWidth
                      onClick={handleAddStudent}
                      disabled={loading}
                    >
                      {loading ? <CircularProgress size={24} /> : 'Ajouter'}
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          )}
          
          <Grid size={{ xs: 12 }}>
            <Divider className="my-2" />
          </Grid>
          
          {/* Notes dynamiques par partie avec sliders */}
          {activity?.parts_names && activity.points && (
            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle1" className="mb-2 font-medium">
                Notes par partie
              </Typography>
              <Paper className="p-4 bg-gray-50 border rounded">
                <Grid container spacing={3}>
                  {activity.parts_names.map((partName, index) => (
                    <Grid size={{ xs: 12 }} key={index}>
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="body1" fontWeight="medium" gutterBottom>
                          {partName} ({typeof partScores[index] === 'number' ? partScores[index] : 0} / {activity.points[index]} points)
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box sx={{ flexGrow: 1 }}>
                            <Slider
                              value={typeof partScores[index] === 'number' ? partScores[index] : 0}
                              onChange={(_, newValue) => {
                                const newScores = [...partScores];
                                newScores[index] = newValue as number;
                                setPartScores(newScores);
                              }}
                              step={0.5}
                              min={0}
                              max={activity.points[index]}
                              marks
                              valueLabelDisplay="auto"
                              color={
                                typeof partScores[index] === 'number' && partScores[index] >= activity.points[index] * 0.7 
                                  ? "success" 
                                  : typeof partScores[index] === 'number' && partScores[index] >= activity.points[index] * 0.4 
                                  ? "info" 
                                  : "error"
                              }
                            />
                          </Box>
                          <TextField
                            value={typeof partScores[index] === 'number' ? partScores[index] : ''}
                            onChange={(e) => handlePartScoreChange(index, e.target.value)}
                            variant="outlined"
                            size="small"
                            sx={{ width: '80px' }}
                            inputProps={{ 
                              step: 0.5,
                              min: 0,
                              max: activity.points[index],
                              type: 'number'
                            }}
                          />
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </Grid>
          )}
          
          {/* Note totale */}
          <Grid size={{ xs: 12 }}>
            <Paper className="p-4 bg-blue-50 border rounded flex flex-col items-center">
              <Typography variant="overline" className="text-blue-700 font-bold">
                NOTE TOTALE
              </Typography>
              <div className="flex items-center gap-2">
                <Typography variant="h4" className="font-bold text-blue-800">
                  {totalScore}
                </Typography>
                <Typography variant="body2" className="text-gray-600">
                  / {totalPoints}
                </Typography>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                <div 
                  className={`h-2.5 rounded-full ${
                    scorePercentage >= 60 ? 'bg-green-600' : 
                    scorePercentage >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${scorePercentage}%` }}
                ></div>
              </div>
            </Paper>
          </Grid>

          {/* Option "Continue to iterate" */}
          <Grid size={{ xs: 12 }} className="mt-2">
            <FormControlLabel
              control={
                <Checkbox
                  checked={continueToIterate}
                  onChange={(e) => setContinueToIterate(e.target.checked)}
                  color="primary"
                />
              }
              label="Poursuivre les ajouts ? (rester sur ce formulaire après la soumission)"
            />
          </Grid>

          {/* Bouton de soumission */}
          <Grid size={{ xs: 12 }} className="mt-4">
            <Button
              type="submit"
              variant="outlined"
              color={!selectedClassId && selectedStudentId && !partScores.some(score => score === '') ? "warning" : "success"}
              size="large"
              disabled={loading || !selectedStudentId || partScores.some(score => score === '')}
              startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
              fullWidth
            >
              {loading ? 'Ajout en cours...' : !selectedClassId && selectedStudentId ? 'Ajouter sans classe' : 'Ajouter la correction'}
            </Button>
          </Grid>
        </Grid>
      </form>
      
      {/* Dialogue de confirmation pour l'ajout sans classe */}
      <Dialog
        open={openConfirmDialog}
        onClose={() => setOpenConfirmDialog(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="warning" />
          <span>Attention : Ajout sans classe</span>
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Aucune classe n'est sélectionnée. La correction sera uniquement visible dans la page de l'étudiant et ne sera associée à aucune classe.
          </DialogContentText>
          <Typography sx={{ mt: 2, fontWeight: 'bold' }} variant="body1">
            Souhaitez-vous continuer ?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={() => setOpenConfirmDialog(false)} 
            variant="outlined"
          >
            Annuler
          </Button>
          <Button 
            onClick={() => {
              setOpenConfirmDialog(false);
              submitCorrection();
            }} 
            variant="contained" 
            color="warning" 
            autoFocus
          >
            Confirmer l'ajout sans classe
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar de succès */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <MuiAlert 
          elevation={6} 
          variant="filled" 
          onClose={handleCloseSnackbar} 
          severity="success"
          action={
            <IconButton
              size="small"
              aria-label="close"
              color="inherit"
              onClick={handleCloseSnackbar}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          }
        >
          {successMessage}
        </MuiAlert>
      </Snackbar>
    </Paper>
  );
};

export default SingleCorrectionFormAutre;