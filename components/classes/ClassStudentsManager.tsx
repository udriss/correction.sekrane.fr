'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Typography, 
  Paper, 
  Button, 
  Alert, 
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Tabs,
  Tab,
  TextField,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Tooltip,
  SelectChangeEvent
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadIcon from '@mui/icons-material/Upload';
import CloseIcon from '@mui/icons-material/Close';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CheckIcon from '@mui/icons-material/Check';
import CancelIcon from '@mui/icons-material/Cancel';
import SaveIcon from '@mui/icons-material/Save';
import FilterListIcon from '@mui/icons-material/FilterList';
import LayersIcon from '@mui/icons-material/Layers';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Student {
  id: number;
  email?: string;
  first_name: string;
  last_name: string;
  gender: string;
  sub_class?: number | null;
}

interface StudentBatch {
  first_name: string;
  last_name: string;
  email?: string;
  gender: string;
  sub_class?: number | null;
}

interface ClassData {
  id: number;
  name: string;
  academic_year: string;
  nbre_subclasses?: number | null;
}

interface ClassStudentsManagerProps {
  classId: number;
  classData: ClassData | null;
  embedded?: boolean;
}

// Add this new interface for editing state
interface EditableStudent extends Student {
  isEditing?: boolean;
  editData?: {
    first_name: string;
    last_name: string;
    email: string;
    gender: string;
    sub_class?: number | null;
  };
}

export default function ClassStudentsManager({ 
  classId, 
  classData, 
  embedded = false 
}: ClassStudentsManagerProps) {
  const [students, setStudents] = useState<EditableStudent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [subClassTab, setSubClassTab] = useState<number>(0);
  const [currentFilter, setCurrentFilter] = useState<number | null>(null);
  const [manualStudentCount, setManualStudentCount] = useState<number>(1);
  const [batchStudents, setBatchStudents] = useState<StudentBatch[]>([]);
  const [csvContent, setCsvContent] = useState<string>('');
  const [savingBatch, setSavingBatch] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchStudents = useCallback(async () => {
    if (!classId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/classes/${classId}/students`);
      
      if (!response.ok) {
        throw new Error(`Erreur lors du chargement des étudiants (${response.status})`);
      }
      
      const data = await response.json();

      console.log('Fetched students:', data);
      
      // Add isEditing property to each student
      const formattedStudents = data.map((student: Student) => ({
        ...student,
        isEditing: false
      }));
      
      setStudents(formattedStudents);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleSubClassTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSubClassTab(newValue);
    if (newValue === 0) {
      setCurrentFilter(null);
    } else {
      setCurrentFilter(newValue);
    }
  };

  const handleManualStudentCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const count = Math.max(1, parseInt(e.target.value) || 0);
    setManualStudentCount(count);
  };

  const handleCreateManualStudents = () => {
    // Create empty student records for batch entry
    const newStudents = Array.from({ length: manualStudentCount }, (_, i) => ({
      first_name: `Étudiant ${i + 1}`,
      last_name: '',
      email: '',
      gender: 'N', // Default gender
      sub_class: currentFilter
    }));
    
    setBatchStudents(newStudents);
  };

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError('');
    
    try {
      // Use FormData to send the file to our API
      const formData = new FormData();
      formData.append('csvFile', file);
      
      const response = await fetch('/api/utils/parse-csv', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors du traitement du fichier CSV");
      }
      
      const data = await response.json();
      setCsvContent(file.name); // Store the file name
      
      if (data.students && data.students.length > 0) {
        // Format students with default gender
        const parsedStudents = data.students.map((student: any) => {
          // Extract first name and last name from student.name
          let first_name = '';
          let last_name = '';
          
          if (student.name) {
            const nameParts = student.name.split(' ');
            if (nameParts.length === 1) {
              first_name = nameParts[0];
            } else {
              // Assume last word is last name, rest is first name
              last_name = nameParts.pop() || '';
              first_name = nameParts.join(' ');
            }
          }
          
          return {
            first_name: first_name || 'Sans prénom',
            last_name: last_name || '',
            email: student.email || '', // Email is optional
            gender: 'N',  // Default gender
            sub_class: currentFilter
          };
        });
        
        setBatchStudents(parsedStudents);
      } else {
        setError("Aucun étudiant trouvé dans le fichier CSV");
      }
    } catch (err) {
      console.error("Erreur lors de l'importation du CSV:", err);
      setError(err instanceof Error ? err.message : "Erreur lors de l'importation du fichier");
    } finally {
      setLoading(false);
    }
  };

  const handleClickUploadButton = () => {
    fileInputRef.current?.click();
  };

  const handleBatchStudentFieldChange = (index: number, field: keyof StudentBatch, value: string | number | null) => {
    setBatchStudents(prev => {
      const updated = [...prev];
      (updated[index][field] as string | number | null) = value;
      return updated;
    });
  };

  const handleAddBatchStudents = async () => {
    if (batchStudents.length === 0) {
      setError('Aucun étudiant à ajouter');
      return;
    }

    setSavingBatch(true);
    setError('');

    try {
      // Process each student in the batch
      for (const student of batchStudents) {
        // Email and last name are optional in our modified version
        if (!student.first_name || !student.gender) {
          continue; // Skip incomplete students
        }

        await fetch(`/api/classes/${classId}/students`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: student.email || `${student.first_name.toLowerCase()}.${student.last_name.toLowerCase()}@example.com`, // Default email if not provided
            first_name: student.first_name,
            last_name: student.last_name || '(Sans nom)', // Default last name if not provided
            gender: student.gender,
            sub_class: student.sub_class
          }),
        });
      }
      

      setSuccess(`${batchStudents.length} étudiants ajoutés avec succès`);
      setBatchStudents([]);
      setShowBatchForm(false);
      fetchStudents();

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      console.error('Error adding batch students:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setSavingBatch(false);
    }
  };

  // Add these new functions for inline editing
  const handleStartEditing = (studentId: number) => {
    setStudents(prevStudents => 
      prevStudents.map(student => {
        if (student.id === studentId) {
          return {
            ...student,
            isEditing: true,
            editData: {
              first_name: student.first_name,
              last_name: student.last_name,
              email: student.email || '',
              gender: student.gender,
              sub_class: student.sub_class
            }
          };
        }
        return {
          ...student,
          isEditing: false  // Ensure only one row is being edited at a time
        };
      })
    );
  };
  
  const handleCancelEditing = (studentId: number) => {
    setStudents(prevStudents => 
      prevStudents.map(student => {
        if (student.id === studentId) {
          return {
            ...student,
            isEditing: false,
            editData: undefined
          };
        }
        return student;
      })
    );
  };
  
  const handleEditFieldChange = (studentId: number, field: string, value: string | number | null) => {
    setStudents(prevStudents => 
      prevStudents.map(student => {
        if (student.id === studentId && student.editData) {
          return {
            ...student,
            editData: {
              ...student.editData,
              [field]: value
            }
          };
        }
        return student;
      })
    );
  };
  
  const handleSaveEdit = async (studentId: number) => {
    const student = students.find(s => s.id === studentId);
    
    if (!student || !student.editData) return;
    
    try {
      // Validation
      if (!student.editData.first_name) {
        setError('Le prénom est obligatoire');
        return;
      }
      
      const response = await fetch(`/api/classes/${classId}/students/${studentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: student.editData.email || `${student.editData.first_name.toLowerCase()}.${student.editData.last_name.toLowerCase()}@example.com`,
          first_name: student.editData.first_name,
          last_name: student.editData.last_name || '',
          gender: student.editData.gender,
          sub_class: student.editData.sub_class
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la modification');
      }
      
      setSuccess('Étudiant mis à jour avec succès');
      
      // Update the student in the local state
      setStudents(prevStudents => 
        prevStudents.map(s => {
          if (s.id === studentId && s.editData) {
            return {
              ...s,
              first_name: s.editData.first_name,
              last_name: s.editData.last_name,
              email: s.editData.email,
              gender: s.editData.gender,
              sub_class: s.editData.sub_class,
              isEditing: false,
              editData: undefined
            };
          }
          return s;
        })
      );
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
      
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    }
  };
  
  const handleOpenDeleteDialog = (studentId: number) => {
    setStudentToDelete(studentId);
    setDeleteDialogOpen(true);
  };
  
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setStudentToDelete(null);
  };
  
  const handleDeleteStudent = async () => {
    if (studentToDelete === null) return;
    
    try {
      const response = await fetch(`/api/classes/${classId}/students/${studentToDelete}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la suppression');
      }
      
      setSuccess('Étudiant supprimé avec succès');
      fetchStudents();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      handleCloseDeleteDialog();
    }
  };

  if (loading) {
    return (
      <div className="py-10 flex justify-center max-w-[400px] mx-auto">
      <LoadingSpinner size="md" text="Chargement des étudiants" />
    </div>
    )
  }

  const filteredStudents = currentFilter === null 
    ? students 
    : students.filter(student => student.sub_class === currentFilter);

  const getGenderLabel = (gender: string) => {
    switch(gender) {
      case 'M': return 'Garçon';
      case 'F': return 'Fille';
      case 'N': return 'Neutre';
      default: return gender;
    }
  };
  
  const getGenderColor = (gender: string) => {
    switch(gender) {
      case 'M': return 'primary';
      case 'F': return 'secondary';
      case 'N': return 'default';
      default: return 'default';
    }
  };

  // Generate tab panels for subclasses
  const renderSubClassTabs = () => {
    if (!classData?.nbre_subclasses) return null;

    return (
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={subClassTab} 
          onChange={handleSubClassTabChange}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="sous-classes"
        >
          <Tab 
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <FilterListIcon fontSize="small" />
                <span>Tous</span>
                <Chip 
                  label={students.length} 
                  size="small" 
                  color="primary" 
                  variant="outlined"
                />
              </Box>
            } 
          />
          
          {Array.from({ length: classData.nbre_subclasses }, (_, i) => i + 1).map((subClassNum) => {
            const studentsInSubclass = students.filter(s => s.sub_class === subClassNum).length;
            
            return (
              <Tab 
                key={subClassNum}
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    <LayersIcon fontSize="small" />
                    <span>Groupe {subClassNum}</span>
                    <Chip 
                      label={studentsInSubclass} 
                      size="small" 
                      color="secondary" 
                      variant="outlined"
                    />
                  </Box>
                } 
              />
            );
          })}
        </Tabs>
      </Box>
    );
  };

  return (
    <div>
    <Paper sx={{ p: embedded ? 0 : 2, mb: embedded ? 0 : 3 }} elevation={embedded ? 0 : 1}>
      {!embedded && (
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Typography variant="h5" component="h2">
            Gestion des étudiants
          </Typography>
        </Box>
      )}
      
      
      {/* SubClass tabs */}
      {renderSubClassTabs()}


      {/* Batch student form */}
      {showBatchForm && (
        <Paper className="p-6 mb-6">
          <Box className="flex justify-between items-center mb-4">
            <Typography variant="h6" component="h2">
              {currentFilter ? `Ajouter des étudiants au groupe ${currentFilter}` : 'Ajouter des étudiants'}
            </Typography>
            <IconButton onClick={() => setShowBatchForm(false)}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            variant="fullWidth"
            className="mb-4 border-b border-gray-200"
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
          
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            {activeTab === 0 && (
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row items-center gap-4">
                  <TextField
                    label="Nombre d'étudiants"
                    type="number"
                    value={manualStudentCount}
                    onChange={handleManualStudentCountChange}
                    InputProps={{ inputProps: { min: 1 } }}
                    variant="outlined"
                    className="md:w-1/3"
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
                  >
                      <PersonAddIcon /> Ajouter {manualStudentCount} ligne{manualStudentCount > 1 ? 's' : ''}
                  </Button>
                </div>

                {batchStudents.length > 0 && (
                  <div className="mt-6">
                    <Typography variant="subtitle1" gutterBottom>
                      Entrez les informations des étudiants
                    </Typography>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
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
                                    onChange={(e) => handleBatchStudentFieldChange(index, 'gender', e.target.value)}
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
                    
                    <Box mt={3} display="flex" justifyContent="flex-end">
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleAddBatchStudents}
                        disabled={savingBatch}
                        startIcon={savingBatch ? <CircularProgress size={20} /> : <PersonAddIcon />}
                      >
                        {savingBatch ? 'Enregistrement...' : 'Ajouter les étudiants'}
                      </Button>
                    </Box>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 1 && (
              <div className="space-y-4">
                <Paper variant="outlined" className="p-4 bg-blue-50 border-blue-200">
                  <Typography variant="subtitle2" component="div" sx={{ mb: 2, fontWeight: 'bold', color: '#1E40AF' }}>
                    Format de fichier accepté :
                  </Typography>
                  <div className="space-y-3">
                    <div className="flex justify-start align-center gap-2">
                      <CheckIcon fontSize="small" className="text-blue-700" />
                      <Typography variant="body2">
                        CSV ou TXT avec des noms d'étudiants
                      </Typography>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckIcon fontSize="small" className="text-blue-700" />
                      <Typography variant="body2">
                        Email optionnel comme seconde colonne
                      </Typography>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckIcon fontSize="small" className="text-blue-700" />
                      <Typography variant="body2">
                        Reconnaît "NOM Prénom", "Prénom NOM", etc.
                      </Typography>
                    </div>
                  </div>
                  
                  <Box mt={2} p={2} bgcolor="white" borderRadius={1} border="1px solid" borderColor="divider">
                    <Typography variant="caption" component="div" fontFamily="monospace" whiteSpace="pre-line">
                      DUPONT Jean<br />
                      Marie MARTIN<br />
                      LEGRAND Amélie;amelie@example.com<br />
                      "PETIT, Sophie";sophie.petit@example.com
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
                
                <Box textAlign="center" mt={4}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleClickUploadButton}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <UploadIcon />}
                    disabled={loading}
                    size="large"
                  >
                    {loading ? 'Traitement...' : 'Importer CSV'}
                  </Button>
                </Box>
                
                {csvContent && !error && (
                  <Alert 
                    severity="success" 
                    icon={<CheckCircleIcon />}
                    variant="filled"
                    className="mt-4 animate-fadeIn"
                  >
                    Fichier <strong>{csvContent}</strong> chargé avec succès ! {batchStudents.length} étudiant(s) détecté(s).
                  </Alert>
                )}

                {batchStudents.length > 0 && (
                  <div className="mt-6">
                    <Typography variant="subtitle1" gutterBottom>
                      Vérifiez et complétez les informations
                    </Typography>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
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
                                    onChange={(e) => handleBatchStudentFieldChange(index, 'gender', e.target.value)}
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
                    
                    <Box mt={3} display="flex" justifyContent="flex-end">
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleAddBatchStudents}
                        disabled={savingBatch}
                        startIcon={savingBatch ? <CircularProgress size={20} /> : <PersonAddIcon />}
                      >
                        {savingBatch ? 'Enregistrement...' : 'Ajouter les étudiants'}
                      </Button>
                    </Box>
                  </div>
                )}
              </div>
            )}
          </div>
        </Paper>
      )}

      {/* Display the current filter/group being shown */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">
          {currentFilter ? `Étudiants du groupe ${currentFilter}` : ''}
        </Typography>
        {!showBatchForm && (
          <Button
            variant="outlined"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setShowBatchForm(true)}
          >
            Ajouter des étudiants
          </Button>
        )}
      </Box>

      {/* Students list */}
      {filteredStudents.length > 0 ? (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell>Prénom</TableCell>
                <TableCell>Nom</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Genre</TableCell>
                {classData?.nbre_subclasses && classData?.nbre_subclasses > 0 && (
                  <TableCell>Groupe</TableCell>
                )}
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    {student.isEditing ? (
                      <TextField
                        size="small"
                        fullWidth
                        value={student.editData?.first_name || ''}
                        onChange={(e) => handleEditFieldChange(student.id, 'first_name', e.target.value)}
                        required
                        error={!student.editData?.first_name}
                        helperText={!student.editData?.first_name ? "Requis" : ""}
                      />
                    ) : (
                      student.first_name
                    )}
                  </TableCell>
                  <TableCell>
                    {student.isEditing ? (
                      <TextField
                        size="small"
                        fullWidth
                        value={student.editData?.last_name || ''}
                        onChange={(e) => handleEditFieldChange(student.id, 'last_name', e.target.value)}
                        placeholder="Optionnel"
                      />
                    ) : (
                      student.last_name
                    )}
                  </TableCell>
                  <TableCell>
                    {student.isEditing ? (
                      <TextField
                        size="small"
                        fullWidth
                        type="email"
                        value={student.editData?.email || ''}
                        onChange={(e) => handleEditFieldChange(student.id, 'email', e.target.value)}
                        placeholder="Optionnel"
                      />
                    ) : (
                      student.email
                    )}
                  </TableCell>
                  <TableCell>
                    {student.isEditing ? (
                      <FormControl fullWidth size="small">
                        <Select
                          value={student.editData?.gender || 'N'}
                          onChange={(e) => handleEditFieldChange(student.id, 'gender', e.target.value)}
                        >
                          <MenuItem value="M">Garçon</MenuItem>
                          <MenuItem value="F">Fille</MenuItem>
                          <MenuItem value="N">Neutre</MenuItem>
                        </Select>
                      </FormControl>
                    ) : (
                      <Chip 
                        label={getGenderLabel(student.gender)} 
                        color={getGenderColor(student.gender) as any}
                        size="small"
                      />
                    )}
                  </TableCell>
                  {classData?.nbre_subclasses && classData?.nbre_subclasses > 0 && (
                    <TableCell>
                      {student.isEditing ? (
                        <FormControl fullWidth size="small">
                          <Select
                            value={student.editData?.sub_class === null ? '' : student.editData?.sub_class}
                            onChange={(e) => handleEditFieldChange(
                              student.id, 
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
                      ) : (
                        student.sub_class ? (
                          <Tooltip title={`Filtrer le groupe ${student.sub_class}`}>
                            <Chip 
                              label={`Groupe ${student.sub_class}`} 
                              size="small" 
                              color="primary" 
                              variant="outlined"
                              onClick={() => setSubClassTab(student.sub_class || 0)}
                              clickable
                              sx={{ 
                                cursor: 'pointer',
                                '&:hover': { 
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                                  backgroundColor: 'rgba(25, 118, 210, 0.08)'
                                }
                              }}
                            />
                          </Tooltip>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Non assigné
                          </Typography>
                        )
                      )}
                    </TableCell>
                  )}
                  <TableCell align="right">
                    {student.isEditing ? (
                      <>
                        <Tooltip title="Enregistrer">
                          <IconButton 
                            size="small" 
                            onClick={() => handleSaveEdit(student.id)}
                            color="success"
                          >
                            <SaveIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Annuler">
                          <IconButton 
                            size="small" 
                            onClick={() => handleCancelEditing(student.id)}
                            color="default"
                            className="ml-1"
                          >
                            <CancelIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </>
                    ) : (
                      <>
                        <Tooltip title="Modifier">
                          <IconButton 
                            size="small" 
                            onClick={() => handleStartEditing(student.id)}
                            color="primary"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Supprimer">
                          <IconButton 
                            size="small" 
                            onClick={() => handleOpenDeleteDialog(student.id)}
                            color="error"
                            className="ml-1"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Paper className="p-8 text-center">
          <Typography variant="h6" className="mb-2">Aucun étudiant</Typography>
          <Typography variant="body2" className="text-gray-500 mb-4" sx={{mb : 2}}>
            {currentFilter 
              ? `Commencez par ajouter des étudiants au groupe ${currentFilter}`
              : 'Commencez par ajouter des étudiants à cette classe'}
          </Typography>
          {!showBatchForm && (
            <Box display="flex" justifyContent="center" gap={2}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => setShowBatchForm(true)}
              >
                Ajouter des étudiants
              </Button>
            </Box>
          )}
        </Paper>
      )}
      
      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
      >
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir supprimer cet étudiant de la classe ? Cette action ne peut pas être annulée.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Annuler</Button>
          <Button onClick={handleDeleteStudent} color="error" autoFocus>
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
    
    {error && (
      <Alert severity="error" className="mb-4" onClose={() => setError('')}>
        {error}
      </Alert>
    )}

    {success && (
      <Alert severity="success" className="mb-4" onClose={() => setSuccess('')}>
        {success}
      </Alert>
    )}
    </div>
  );
}
