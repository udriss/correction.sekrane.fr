import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
  Alert,
  Divider,
  Chip,
  Stepper,
  Step,
  StepLabel,
  Stack,
  Tooltip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import UploadIcon from '@mui/icons-material/Upload';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CheckIcon from '@mui/icons-material/Check';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import VisibilityIcon from '@mui/icons-material/Visibility';
import GradientBackground from '@/components/ui/GradientBackground';
import H1Title from '@/components/ui/H1Title';
import { parseCSVContent } from '@/lib/utils/parse-csv';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

interface BatchStudent {
  first_name: string;
  last_name: string;
  email?: string;
  gender: 'M' | 'F' | 'N';
  sub_class?: number | null;
  markedForDeletion?: boolean; // Nouvelle propriété pour marquer les étudiants à supprimer
}

interface BatchStudentFormProps {
  onClose: () => void;
  onAddStudents: (students: BatchStudent[]) => Promise<void>;
  classData?: {
    id: number;
    name: string;
    nbre_subclasses?: number;
  } | null;
  currentFilter?: string | null;
}

const BatchStudentForm: React.FC<BatchStudentFormProps> = ({
  onClose,
  onAddStudents,
  classData,
  currentFilter
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [manualStudentCount, setManualStudentCount] = useState(5);
  const [batchStudents, setBatchStudents] = useState<BatchStudent[]>([]);
  const [savingBatch, setSavingBatch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [csvContent, setCsvContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  
  // Ajouter des états pour la gestion des étapes
  const [activeStep, setActiveStep] = useState(0);
  const steps = ['Chargement du fichier', 'Vérification des données', 'Confirmation'];
  const [processedStudents, setProcessedStudents] = useState<BatchStudent[]>([]);
  const [importSuccessful, setImportSuccessful] = useState(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleManualStudentCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setManualStudentCount(value);
    }
  };

  const handleCreateManualStudents = () => {
    const newStudents: BatchStudent[] = Array.from({ length: manualStudentCount }, () => ({
      first_name: '',
      last_name: '',
      email: '',
      gender: 'N',
      sub_class: null
    }));
    
    setBatchStudents(newStudents);
  };

  const handleBatchStudentFieldChange = (index: number, field: keyof BatchStudent, value: any) => {
    const updatedStudents = [...batchStudents];
    updatedStudents[index] = { ...updatedStudents[index], [field]: value };
    setBatchStudents(updatedStudents);
  };


  const handleClickUploadButton = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  // Gestionnaires d'événements pour le glisser-déposer
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      // Vérifier si c'est un fichier CSV ou TXT
      if (file.type === 'text/csv' || file.type === 'text/plain' || file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
        processFile(file);
      } else {
        setError('Seuls les fichiers CSV ou TXT sont acceptés');
      }
    }
  }, []);

  // Fonction pour traiter le fichier (utilisée à la fois pour le glisser-déposer et l'input file)
  const processFile = async (file: File) => {
    setLoading(true);
    setError(null);
    setCsvContent(file.name);
    
    try {
      const text = await file.text();
      
      // Utiliser l'utilitaire parseCSVContent
      const parsedData = parseCSVContent(text);
      
      // Transformer les données parsées au format attendu par le composant
      const parsedStudents: BatchStudent[] = initializeImportedStudents(parsedData);
      
      setProcessedStudents(parsedStudents);
      setBatchStudents(parsedStudents);
      setImportSuccessful(true);
      
      // Passer automatiquement à l'étape suivante
      setActiveStep(1);
    } catch (err: any) {
      setError(`Erreur lors du traitement du fichier: ${err.message}`);
      setImportSuccessful(false);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour initialiser les étudiants importés
  const initializeImportedStudents = (parsedData: any[]): BatchStudent[] => {
    return parsedData.map(data => ({
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email || undefined,
      gender: 'N' as 'M' | 'F' | 'N', // Forcer le type avec une assertion
      sub_class: null
    }));
  };

  // Modifier la fonction pour marquer au lieu de supprimer
  const handleRemoveStudent = (index: number) => {
    setBatchStudents(prevStudents => {
      const updatedStudents = [...prevStudents];
      updatedStudents[index] = {
        ...updatedStudents[index],
        markedForDeletion: true
      };
      return updatedStudents;
    });
  };
  
  // Ajouter une fonction pour restaurer un étudiant marqué pour suppression
  const handleRestoreStudent = (index: number) => {
    setBatchStudents(prevStudents => {
      const updatedStudents = [...prevStudents];
      updatedStudents[index] = {
        ...updatedStudents[index],
        markedForDeletion: false
      };
      return updatedStudents;
    });
  };

  // Modifier la fonction d'ajout pour exclure les étudiants marqués
  const handleAddBatchStudents = async () => {
    // Filtrer les étudiants marqués pour suppression
    const studentsToAdd = batchStudents.filter(student => !student.markedForDeletion);
    
    // Validation de base
    const incompleteStudents = studentsToAdd.filter(student => 
      !student.first_name.trim() || !student.last_name.trim()
    );
    
    if (incompleteStudents.length > 0) {
      setError("Veuillez compléter les noms et prénoms de tous les étudiants");
      return;
    }
    
    if (studentsToAdd.length === 0) {
      setError("Aucun étudiant à ajouter après suppression");
      return;
    }
    
    setSavingBatch(true);
    setError(null);
    
    try {
      await onAddStudents(studentsToAdd);
      // Réinitialiser le formulaire après l'ajout réussi
      setActiveStep(2); // Passer à l'étape de confirmation
      setTimeout(() => {
        setBatchStudents([]);
        setCsvContent(null);
        // Fermer le formulaire après un délai
        onClose();
      }, 3000);
    } catch (err: any) {
      setError(`Erreur lors de l'ajout des étudiants: ${err.message}`);
    } finally {
      setSavingBatch(false);
    }
  };

  // Fonction pour passer à l'étape suivante
  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };
  
  // Fonction pour revenir à l'étape précédente
  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };
  
  // Fonction pour modifier un champ d'un étudiant
  const handleStudentFieldChange = (index: number, field: keyof BatchStudent, value: any) => {
    const updatedStudents = [...batchStudents];
    updatedStudents[index] = { ...updatedStudents[index], [field]: value };
    setBatchStudents(updatedStudents);
  };

  // Add a function to delete a student from the batch
  const handleDeleteStudent = (index: number) => {
    setBatchStudents(prevStudents => {
      const updatedStudents = [...prevStudents];
      updatedStudents.splice(index, 1); // Remove the student at the specified index
      return updatedStudents;
    });
  };

  return (
    <Paper 
      className="p-6 mb-6" 
      sx={{ 
        overflow: 'hidden',
        borderRadius: '0',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
      }}
    >
      {/* Header avec gradient */}
      <GradientBackground
        variant="primary"
        sx={{
          mx: -3,
          mt: -3,
          mb: 3,
          py: 3,
          px: 4,
          borderRadius: '0',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            {/* Utilisation du composant H1Title standardisé */}
            <Typography variant="h5" fontWeight="700" color="text.primary">
              {currentFilter 
                ? `Ajouter des étudiants au groupe ${currentFilter}` 
                : 'Ajouter des étudiants'}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.95, maxWidth: '500px', color: 'text.secondary' }}>
              Ajoutez plusieurs étudiants par saisie manuelle ou importation de fichier CSV
            </Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </GradientBackground>

      <Tabs 
        value={activeTab} 
        onChange={handleTabChange} 
        variant="fullWidth"
        sx={{
          mb: 3,
          '& .MuiTab-root': {
            fontWeight: 600,
            py: 1.5
          },
          '& .Mui-selected': {
            fontWeight: 700
          },
          '& .MuiTabs-indicator': {
            height: 3,
            borderRadius: '3px 3px 0 0'
          }
        }}
      >
        <Tab 
          label="Saisie manuelle" 
          icon={<EditIcon />} 
          iconPosition="start" 
        />
        <Tab 
          label="Importer CSV" 
          icon={<UploadIcon />} 
          iconPosition="start" 
        />
      </Tabs>
      
      <Box sx={{ 
        p: 3, 
        borderRadius: 2, 
        bgcolor: 'background.default',
        border: '1px solid',
        borderColor: 'divider'
      }}>
        {activeTab === 0 && (
          <Box className="space-y-4">
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              flexDirection: { xs: 'column', sm: 'row' }, 
              alignItems: { xs: 'stretch', sm: 'center' },
              gap: 2
            }}>
              <TextField
                label="Nombre d'étudiants"
                type="number"
                value={manualStudentCount}
                onChange={handleManualStudentCountChange}
                InputProps={{ inputProps: { min: 1 } }}
                variant="outlined"
                sx={{ width: { xs: '100%', sm: '200px' } }}
              />
                  <Button
                variant="contained"
                color="secondary"
                startIcon={<PersonAddIcon />}
                onClick={handleCreateManualStudents}
                sx={{
                  fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  background: (theme) => theme.gradients.secondary,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 15px rgba(0,0,0,0.2)',
                    background: (theme) => theme.gradients.secondary,
                    filter: 'brightness(1.3)',
                  }
                }}
                  > Afficher {manualStudentCount} ligne{manualStudentCount > 1 ? 's' : ''}
                  </Button>
            </Box>

            {batchStudents.length > 0 && (
              <div className="mt-6">
                <Typography variant="subtitle1" gutterBottom>
                  Entrez les informations des étudiants
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell width="40px"></TableCell>
                        <TableCell>Prénom*</TableCell>
                        <TableCell>Nom</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Genre*</TableCell>
                        {classData?.nbre_subclasses && classData?.nbre_subclasses > 0 && (
                          <TableCell>Groupe</TableCell>
                        )}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {batchStudents.map((student, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Tooltip title="Supprimer cet étudiant">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteStudent(index)}
                                sx={{
                                  '&:hover': {
                                    backgroundColor: 'rgba(211, 47, 47, 0.04)'
                                  }
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              fullWidth
                              value={student.first_name}
                              onChange={(e) => handleBatchStudentFieldChange(index, 'first_name', e.target.value)}
                              required
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              fullWidth
                              value={student.last_name}
                              onChange={(e) => handleBatchStudentFieldChange(index, 'last_name', e.target.value)}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              fullWidth
                              value={student.email || ''}
                              onChange={(e) => handleBatchStudentFieldChange(index, 'email', e.target.value)}
                              placeholder="Optionnel"
                            />
                          </TableCell>
                          <TableCell>
                            <FormControl fullWidth size="small">
                              <Select
                                value={student.gender || 'N'}
                                onChange={(e) => handleBatchStudentFieldChange(index, 'gender', e.target.value as 'M' | 'F' | 'N')}
                              >
                                <MenuItem value="M">Garçon</MenuItem>
                                <MenuItem value="F">Fille</MenuItem>
                                <MenuItem value="N">Neutre</MenuItem>
                              </Select>
                            </FormControl>
                          </TableCell>
                          {classData?.nbre_subclasses && classData?.nbre_subclasses > 0 && (
                            <TableCell>
                              <FormControl fullWidth size="small">
                                <Select
                                  value={student.sub_class === null ? '' : student.sub_class}
                                  onChange={(e) => handleBatchStudentFieldChange(
                                    index, 
                                    'sub_class', 
                                    e.target.value === '' ? null : Number(e.target.value)
                                  )}
                                >
                                  <MenuItem value="">
                                    <em>Non assigné</em>
                                  </MenuItem>
                                  {Array.from({ length: classData?.nbre_subclasses }, (_, i) => i + 1).map((num) => (
                                    <MenuItem key={num} value={num}>Groupe {num}</MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                {/* Display add students button if students are available */}
                {batchStudents.length > 0 && (
                  <Box 
                    sx={{ 
                      mt: 4, 
                      pt: 3, 
                      display: 'flex', 
                      justifyContent: 'flex-end',
                      borderTop: '1px solid',
                      borderColor: 'divider'
                    }}
                  >
                    <Button
                variant="contained"
                color="success"
                disabled={savingBatch}
                startIcon={savingBatch ? <CircularProgress size={20} /> : <PersonAddIcon />}
                onClick={handleAddBatchStudents}
                sx={{
                  fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  background: (theme) => theme.gradients.success,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 15px rgba(0,0,0,0.2)',
                    background: (theme) => theme.gradients.success,
                    filter: 'brightness(1.3)',
                  }
                }}
                  > 
                      {savingBatch ? 'Enregistrement...' : `Confirmer l'ajout pour ${batchStudents.length} étudiant${batchStudents.length > 1 ? 's' : ''}`}
                  </Button>
                  </Box>
                )}
              </div>
            )}
          </Box>
        )}
        
        {activeTab === 1 && (
          <Box className="space-y-4">
            {/* Ajout du stepper pour suivre les étapes */}
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map((label, index) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
            
            {/* Étape 1: Chargement du fichier */}
            {activeStep === 0 && (
              <>
                <Paper 
                  variant="outlined" 
                  sx={{ 
                    p: 3, 
                    bgcolor: 'primary.50',
                    borderColor: 'primary.200',
                    borderRadius: 2
                  }}
                >
                  <Typography 
                    variant="subtitle1" 
                    component="div" 
                    sx={{ 
                      mb: 2, 
                      fontWeight: 'bold', 
                      color: 'primary.dark',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}
                  >
                    <UploadIcon fontSize="small" />
                    Format de fichier accepté :
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <CheckIcon fontSize="small" color="primary" />
                      <Typography variant="body2">
                        CSV ou TXT avec des noms d'étudiants
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                      <CheckIcon fontSize="small" color="primary" />
                      <Typography variant="body2">
                        Format: NOM;Prénom;Email (email optionnel)
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                      <CheckIcon fontSize="small" color="primary" />
                      <Typography variant="body2">
                        Si une seule colonne, détection automatique NOM/Prénom
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Box 
                    sx={{ 
                      p: 2, 
                      bgcolor: 'background.paper', 
                      borderRadius: 1,
                      border: '1px dashed',
                      borderColor: 'primary.200'
                    }}
                  >
                    <Typography variant="caption" component="div" fontFamily="monospace" sx={{ whiteSpace: 'pre-line' }}>
                      DUPONT;Jean;jean.dupont@exemple.fr<br />
                      MARTIN;Marie;marie.martin@exemple.fr<br />
                      LEGRAND;Amélie;amelie.legrand@exemple.fr<br />
                      PETIT;Sophie;sophie.petit@exemple.fr
                    </Typography>
                  </Box>
                </Paper>
                
                <input 
                  type="file" 
                  accept=".csv,.txt" 
                  ref={fileInputRef}
                  onChange={handleCsvUpload}
                  style={{ display: 'none' }}
                />
                
                {/* Zone de dépôt pour le glisser-déposer */}
                <Box 
                  sx={{ 
                    mt: 4,
                    p: 4,
                    border: '2px dashed',
                    borderColor: isDragging ? 'primary.main' : 'divider',
                    borderRadius: 2,
                    backgroundColor: isDragging ? 'primary.50' : 'background.paper',
                    textAlign: 'center',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    minHeight: '200px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 2
                  }}
                  onClick={handleClickUploadButton}
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <UploadFileIcon sx={{ fontSize: 60, color: isDragging ? 'primary.main' : 'text.secondary', opacity: 0.7 }} />
                  <Typography variant="h6" color="text.secondary">
                    {isDragging ? 'Déposez le fichier ici' : 'Glissez et déposez un fichier CSV ou TXT ici'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ou
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
                    disabled={loading}
                    sx={{ 
                      py: 1.5,
                      px: 4,
                      borderRadius: 6,
                      fontWeight: 600,
                      boxShadow: 2
                    }}
                  >
                    {loading ? 'Traitement...' : 'Importer CSV'}
                  </Button>
                </Box>
                
                {csvContent && !error && importSuccessful && (
                  <Alert 
                    severity="success" 
                    icon={<CheckCircleIcon />}
                    variant="filled"
                    sx={{ mt: 3, animation: 'fadeIn 0.5s ease' }}
                  >
                    Fichier <strong>{csvContent}</strong> chargé avec succès ! {processedStudents.length} étudiant(s) détecté(s).
                  </Alert>
                )}
              </>
            )}
            
            {/* Étape 2: Vérification et édition des données */}
            {activeStep === 1 && (
              <>
                <Typography variant="h6" gutterBottom>
                  Vérifiez et modifiez les informations des étudiants
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {batchStudents.filter(s => !s.markedForDeletion).length} étudiant(s) trouvé(s) dans le fichier. 
                  Vérifiez et complétez les informations avant l'ajout.
                  {batchStudents.some(s => s.markedForDeletion) && (
                    <Box component="span" sx={{ fontStyle: 'italic', ml: 1 }}>
                      ({batchStudents.filter(s => s.markedForDeletion).length} marqué(s) pour suppression)
                    </Box>
                  )}
                </Typography>
                
                <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell width="40px"></TableCell>
                        <TableCell width="5%">#</TableCell>
                        <TableCell>Prénom*</TableCell>
                        <TableCell>Nom*</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Genre</TableCell>
                        {classData?.nbre_subclasses && classData?.nbre_subclasses > 0 && (
                          <TableCell>Groupe</TableCell>
                        )}
                        <TableCell width="5%" align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {batchStudents.map((student, index) => (
                        <TableRow 
                          key={index} 
                          hover
                          sx={{ 
                            opacity: student.markedForDeletion ? 0.5 : 1,
                            bgcolor: student.markedForDeletion ? 'action.disabledBackground' : 'inherit',
                            textDecoration: student.markedForDeletion ? 'line-through' : 'none',
                            '& .MuiTableCell-root': {
                              color: student.markedForDeletion ? 'text.disabled' : 'inherit'
                            }
                          }}
                        >
                          <TableCell>
                            <Tooltip title="Supprimer définitivement cet étudiant">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteStudent(index)}
                                disabled={student.markedForDeletion}
                                sx={{
                                  '&:hover': {
                                    backgroundColor: 'rgba(211, 47, 47, 0.04)'
                                  }
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              fullWidth
                              value={student.first_name}
                              onChange={(e) => handleStudentFieldChange(index, 'first_name', e.target.value)}
                              required
                              error={!student.first_name.trim() && !student.markedForDeletion}
                              helperText={!student.first_name.trim() && !student.markedForDeletion ? "Requis" : ""}
                              disabled={student.markedForDeletion}
                              InputProps={{
                                sx: { 
                                  opacity: student.markedForDeletion ? 0.7 : 1,
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              fullWidth
                              value={student.last_name}
                              onChange={(e) => handleStudentFieldChange(index, 'last_name', e.target.value)}
                              required
                              error={!student.last_name.trim() && !student.markedForDeletion}
                              helperText={!student.last_name.trim() && !student.markedForDeletion ? "Requis" : ""}
                              disabled={student.markedForDeletion}
                              InputProps={{
                                sx: { 
                                  opacity: student.markedForDeletion ? 0.7 : 1,
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              fullWidth
                              value={student.email || ''}
                              onChange={(e) => handleStudentFieldChange(index, 'email', e.target.value)}
                              placeholder="Optionnel"
                              disabled={student.markedForDeletion}
                              InputProps={{
                                sx: { 
                                  opacity: student.markedForDeletion ? 0.7 : 1,
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <FormControl fullWidth size="small">
                              <Select
                                value={student.gender || 'N'}
                                onChange={(e) => handleStudentFieldChange(index, 'gender', e.target.value as 'M' | 'F' | 'N')}
                                disabled={student.markedForDeletion}
                                sx={{
                                  opacity: student.markedForDeletion ? 0.7 : 1,
                                }}
                              >
                                <MenuItem value="M">Garçon</MenuItem>
                                <MenuItem value="F">Fille</MenuItem>
                                <MenuItem value="N">Neutre</MenuItem>
                              </Select>
                            </FormControl>
                          </TableCell>
                          {classData?.nbre_subclasses && classData?.nbre_subclasses > 0 && (
                            <TableCell>
                              <FormControl fullWidth size="small">
                                <Select
                                  value={student.sub_class === null ? '' : student.sub_class}
                                  onChange={(e) => handleStudentFieldChange(
                                    index, 
                                    'sub_class', 
                                    e.target.value === '' ? null : Number(e.target.value)
                                  )}
                                  disabled={student.markedForDeletion}
                                  sx={{
                                    opacity: student.markedForDeletion ? 0.7 : 1,
                                  }}
                                >
                                  <MenuItem value="">
                                    <em>Non assigné</em>
                                  </MenuItem>
                                  {Array.from({ length: classData?.nbre_subclasses }, (_, i) => i + 1).map((num) => (
                                    <MenuItem key={num} value={num}>Groupe {num}</MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </TableCell>
                          )}
                          <TableCell align="center">
                            {student.markedForDeletion ? (
                              <Tooltip title="Restaurer cet étudiant">
                                <IconButton 
                                  size="small" 
                                  color="primary" 
                                  onClick={() => handleRestoreStudent(index)}
                                >
                                  <CheckIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            ) : (
                              <Tooltip title="Marquer pour suppression">
                                <IconButton 
                                  size="small" 
                                  color="error" 
                                  onClick={() => handleRemoveStudent(index)}
                                >
                                  <DeleteOutlineIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                {/* Afficher un message si toutes les lignes sont marquées pour suppression */}
                {batchStudents.length > 0 && batchStudents.every(s => s.markedForDeletion) && (
                  <Alert 
                    severity="warning" 
                    sx={{ mb: 3 }}
                  >
                    Tous les étudiants sont marqués pour suppression. Aucun étudiant ne sera ajouté à moins que vous n'en restauriez au moins un.
                  </Alert>
                )}
                
                {/* Boutons de navigation */}
                <Stack direction="row" spacing={2} justifyContent="space-between">
                  <Button
                    variant="outlined"
                    onClick={handleBack}
                    startIcon={<ArrowBackIcon />}
                  >
                    Retour
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleAddBatchStudents}
                    disabled={
                      savingBatch || 
                      batchStudents.filter(s => !s.markedForDeletion && (!s.first_name.trim() || !s.last_name.trim())).length > 0 || 
                      batchStudents.filter(s => !s.markedForDeletion).length === 0
                    }
                    endIcon={savingBatch ? <CircularProgress size={20} /> : <ArrowForwardIcon />}
                  >
                    {savingBatch ? 'Enregistrement...' : 'Valider et ajouter'}
                  </Button>
                </Stack>
              </>
            )}
            
            {/* Étape 3: Confirmation */}
            {activeStep === 2 && (
              <Box textAlign="center" py={4}>
                <CheckCircleIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
                <Typography variant="h5" gutterBottom>
                  Étudiants ajoutés avec succès!
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  {batchStudents.length} étudiant(s) ont été ajoutés.
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={onClose}
                >
                  Fermer
                </Button>
              </Box>
            )}
            
            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  mt: 3, 
                  borderRadius: 2,
                  '& .MuiAlert-icon': {
                    fontSize: '1.5rem'
                  }
                }}
              >
                {error}
              </Alert>
            )}
          </Box>
        )}

        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mt: 3, 
              borderRadius: 2,
              '& .MuiAlert-icon': {
                fontSize: '1.5rem'
              }
            }}
          >
            {error}
          </Alert>
        )}

      </Box>
    </Paper>
  );
};

export default BatchStudentForm;
