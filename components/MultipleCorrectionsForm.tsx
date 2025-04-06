'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Button, 
  TextField, 
  Box, 
  Alert, 
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Slider,
  Tooltip,
  Chip,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  MenuItem,
  FormHelperText,
  Divider
} from '@mui/material';

import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import SchoolIcon from '@mui/icons-material/School';
import LayersIcon from '@mui/icons-material/Layers';
import { 
    IconButton,
  } from '@mui/material';

import { Activity } from '@/lib/activity';
import { constructFromSymbol } from 'date-fns/constants';

type Student = {
  id?: number;
  firstName: string;
  lastName: string;
  experimentalGrade: string;
  theoreticalGrade: string;
  correctionId?: string;
  shareCode?: string;
};

interface MultipleCorrectionsFormProps {
  activityId: string | number;
  activity: Activity | null;
  experimentalPoints: number;
  theoreticalPoints: number;
  groupId?: string | number | null;
  onSuccess?: (createdCorrectionIds: string[]) => void;
  onCancel?: () => void;
  isModal?: boolean;
  groupName?: string; // Nouvelle prop pour recevoir le nom du groupe
  requireGroupName?: boolean; // Prop pour indiquer si le nom du groupe est obligatoire
  onClassSelect?: (classId: string, className: string) => void; // New prop for class selection callback
}

interface Class {
  id: number;
  name: string;
  academic_year: string;
  nbre_subclasses?: number | null;
}

interface ClassStudent {
  id: number;
  first_name: string;
  last_name: string;
  email?: string;
  sub_class?: number | null;
}

// Modifier l'interface pour correspondre exactement à ce qu'attend l'API
interface CorrectionData {
  activity_id: string | number;
  student_id: number | null;
  content: string;
  content_data: string | null;
  penalty: number | null;
  deadline: string;
  submission_date: string;
  experimental_points_earned: number;
  theoretical_points_earned: number;
  class_id?: number | null;
  group_id?: number | null;
}

export default function MultipleCorrectionsForm({
  activityId,
  activity,
  experimentalPoints,
  theoreticalPoints,
  groupId = null,
  onSuccess,
  onCancel,
  isModal = false,
  groupName = '',
  requireGroupName = false,
  onClassSelect // New prop
}: MultipleCorrectionsFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // UI states
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [activeTab, setActiveTab] = useState<number>(0);
  const [saving, setSaving] = useState<boolean>(false);

  // Student data states
  const [manualStudentCount, setManualStudentCount] = useState<number>(1);
  const [students, setStudents] = useState<Student[]>([]);
  const [csvContent, setCsvContent] = useState<string>('');
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSubClass, setSelectedSubClass] = useState<string>('');
  const [classStudents, setClassStudents] = useState<ClassStudent[]>([]);
  const [loadingClasses, setLoadingClasses] = useState<boolean>(false);
  const [loadingClassStudents, setLoadingClassStudents] = useState<boolean>(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);


    // Add a new handleReset function to properly reset all state when "Recommencer" is clicked
    const handleReset = () => {
      setStudents([]);
      setSelectedClassId('');
      setClassStudents([]);
      //setActiveTab(0);
      setCsvContent('');
      setSuccessMessage(''); // Clear any success messages
    };


  // Function to delete a student
  const handleDeleteStudent = (index: number) => {
    setStudents(prev => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });
  };

  // Function to cancel
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.back();
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleManualStudentCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const count = Math.max(1, parseInt(e.target.value) || 0);
    setManualStudentCount(count);
  };

  const handleCreateManualStudents = () => {
    const newStudents = Array.from({ length: manualStudentCount }, (_, i) => ({
      firstName: `Étudiant`,
      lastName: `${i + 1}`,
      experimentalGrade: '',
      theoreticalGrade: '',
    }));
    
    setStudents(newStudents);
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
      setCsvContent(file.name); // Store the file name instead of content
      
      if (data.students && data.students.length > 0) {
        const parsedStudents = data.students.map((student: any) => ({
          firstName: student.firstName || 'Sans',
          lastName: student.lastName || 'nom',
          experimentalGrade: '',
          theoreticalGrade: '',
        }));
        
        setStudents(parsedStudents);
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

  
  // Functions to change grades with sliders
  const handleExperimentalGradeChange = (index: number, value: number | number[]) => {
    const newValue = typeof value === 'number' ? value : value[0];
    setStudents(prev => {
      const updated = [...prev];
      updated[index].experimentalGrade = newValue.toFixed(2);
      return updated;
    });
  };

  const handleTheoreticalGradeChange = (index: number, value: number | number[]) => {
    const newValue = typeof value === 'number' ? value : value[0];
    setStudents(prev => {
      const updated = [...prev];
      updated[index].theoreticalGrade = newValue.toFixed(2);
      return updated;
    });
  };

  const handleStudentNameChange = (index: number, value: string) => {
    const [firstName, lastName] = value.split(' ');
    setStudents(prev => {
      const updated = [...prev];
      updated[index].firstName = firstName;
      updated[index].lastName = lastName;
      return updated;
    });
  };

  const calculateTotalGrade = (experimentalGrade: string, theoreticalGrade: string) => {
    const expGrade = parseFloat(experimentalGrade) || 0;
    const theoGrade = parseFloat(theoreticalGrade) || 0;
    return (expGrade + theoGrade).toFixed(1);
  };

  // Function to create corrections and optionally add them to a group
  const handleCreateCorrections = async () => {
    if (!activityId || students.length === 0) {
      setError('Veuillez ajouter des étudiants');
      return;
    }
    
    setSaving(true);
    setError('');
    
    try {
      const updatedStudents = [...students];
      const createdCorrectionIds: string[] = [];
      const defaultDeadline = new Date().toISOString().split('T')[0];
      const submissionDate = new Date().toISOString().split('T')[0];
  
      for (let i = 0; i < students.length; i++) {
        const student = students[i];
        const expGrade = parseFloat(student.experimentalGrade) || 0;
        const theoGrade = parseFloat(student.theoreticalGrade) || 0;
  
        // Create correction data object according to what the API expects
        const correctionData: CorrectionData = {
          activity_id: activityId,
          student_id: student.id || null, // Utilisation de l'ID étudiant
          content: "",
          content_data: null,
          penalty: null,
          deadline: defaultDeadline,
          submission_date: submissionDate,
          experimental_points_earned: expGrade,
          theoretical_points_earned: theoGrade,
          class_id: selectedClassId ? parseInt(selectedClassId) : null,
          group_id: groupId ? parseInt(groupId.toString()) : null,
        };
        
        const createResponse = await fetch('/api/corrections', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(correctionData),
        });
        
        if (!createResponse.ok) {
          try {
            const errorData = await createResponse.json();
            throw new Error(errorData.error || errorData.details || `Erreur lors de la création de la correction pour ${student.firstName} ${student.lastName}`);
          } catch (e) {
            throw new Error(`Erreur lors de la création de la correction pour ${student.firstName} ${student.lastName}`);
          }
        }
        
        const correction = await createResponse.json();
        updatedStudents[i].correctionId = correction.id;
        createdCorrectionIds.push(correction.id);
      }
      
      if (groupId && createdCorrectionIds.length > 0) {
        const linkResponse = await fetch(`/api/correction-groups/${groupId}/corrections`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            groupIdSent: groupId,
            correction_ids: createdCorrectionIds
          }),
        });
        
        if (!linkResponse.ok) {
          console.error('Réponse d\'association non-OK:', await linkResponse.text());
          throw new Error(`Erreur lors de l'association des corrections au groupe (${linkResponse.status})`);
        }
      }
      
      setStudents(updatedStudents);
      setSuccessMessage(
        students.length === 1 
          ? `1 correction ajoutée avec succès`
          : `${students.length} corrections ajoutées avec succès`
      );
      
      if (onSuccess && createdCorrectionIds.length > 0) {
        onSuccess(createdCorrectionIds);
      }
      
      if (!isModal && groupId) {
        setTimeout(() => {
          router.push(`/activities/${activityId}/groups/${groupId}`);
        }, 2000);
      }
      
      return createdCorrectionIds;
    } catch (err) {
      console.error('Erreur lors de la création des corrections:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la création des corrections');
      return [];
    } finally {
      setSaving(false);
    }
  };

  // Function to fetch available classes
  const fetchClasses = async () => {
    setLoadingClasses(true);
    try {
      const response = await fetch('/api/classes');
      if (response.ok) {
        const data = await response.json();
        setClasses(data);
      } else {
        console.error('Failed to fetch classes');
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setLoadingClasses(false);
    }
  };

  // Function to fetch students from a selected class
  const fetchClassStudents = async (classId: string, subClass: string | null = null) => {
    if (!classId) return;
    
    setLoadingClassStudents(true);
    try {
      const response = await fetch(`/api/classes/${classId}/students`);
      if (response.ok) {
        const data = await response.json();
        setClassStudents(data);

        

        // Filter by subclass if specified
        let studentsToUse = data;
        if (subClass) {
          studentsToUse = data.filter((student: ClassStudent) => 
            student.sub_class === Number(subClass)
          );
        }
        
        // Convert class students to the format needed for corrections
        // Inclure l'ID étudiant pour l'API
        const formattedStudents = studentsToUse.map((student: ClassStudent) => ({
          id: student.id, // Ajouter l'ID étudiant
          firstName: student.first_name,
          lastName: student.last_name,
          experimentalGrade: '',
          theoreticalGrade: '',
        }));
        
        setStudents(formattedStudents);
      } else {
        console.error('Failed to fetch class students');
      }
    } catch (error) {
      console.error('Error fetching class students:', error);
    } finally {
      setLoadingClassStudents(false);
    }
  };

  

  // Handle class selection change
  const handleClassChange = (event: SelectChangeEvent) => {
    const classId = event.target.value;
    setSelectedClassId(classId);
    setSelectedSubClass(''); // Reset subclass selection
    
    // Find and store the selected class object
    if (classId) {
      const selectedClass = classes.find(cls => cls.id.toString() === classId);
      if (selectedClass) {
        setSelectedClass(selectedClass);
        // Pass to parent component if callback exists
        if (onClassSelect) {
          onClassSelect(classId, selectedClass.name);
        }
      }
    } else {
      setSelectedClass(null);
    }
    
    // Fetch students without subclass filter
    fetchClassStudents(classId);
  };

  // Handle subclass selection change
  const handleSubClassChange = (event: SelectChangeEvent) => {
    const subClass = event.target.value;
    setSelectedSubClass(subClass);
    
    // Re-fetch with subclass filter
    fetchClassStudents(selectedClassId, subClass === '' ? null : subClass);
  };

  // Load classes when the class tab is selected
  useEffect(() => {
    if (activeTab === 2 && classes.length === 0) {
      fetchClasses();
    }
  }, [activeTab]);

  if (!activity) {
    return (
      <Box className="p-4">
        <Alert severity="warning">
          Information de l'activité non disponible. Veuillez réessayer.
        </Alert>
      </Box>
    );
  }

  
  return (
    <div className="space-y-6">
      {/* Input selection section - Always visible */}
      <Paper className="p-6 rounded-lg shadow-md border-t-4 border-green-600">
        <div className="flex items-center gap-2 mb-4">
          <PersonAddIcon className="text-green-600" fontSize="large" />
          <Typography variant="h5" className="font-bold">
            {students.length > 0 ? `Étudiants (${students.length})` : "Ajouter des étudiants"}
          </Typography>
        </div>
        
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
            icon={<UploadFileIcon />} 
            iconPosition="start" 
          />
          <Tab 
            label="Depuis une classe" 
            icon={<SchoolIcon />} 
            iconPosition="start" 
          />
        </Tabs>
        
        {/* Only show the input methods if no students or if the active tab is the "from class" tab */}
        {(!students.length || activeTab === 2) && (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            {activeTab === 0 && (
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
                  color="primary"
                  onClick={handleCreateManualStudents}
                  className="md:ml-auto"
                  fullWidth={window.innerWidth < 640}
                >
                  <Box display="flex" alignItems="center" gap={2}>
                    <PersonAddIcon />
                    <span>{manualStudentCount} étudiant{manualStudentCount > 1 ? 's' : ''}</span>
                  </Box>
                </Button>
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
                        CSV ou TXT contenant des noms d'étudiants dans la première colonne
                      </Typography>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckIcon fontSize="small" className="text-blue-700" />
                      <Typography variant="body2">
                        Compatible avec formats séparés par virgules, points-virgules ou tabulations
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
                      LEGRAND Amélie;Groupe B<br />
                      "PETIT, Sophie";Groupe C
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
                
                <Box textAlign="center">
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleClickUploadButton}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : ''}
                    disabled={loading}
                    size="large"
                  >
                    {loading ? 'Traitement...' : <UploadFileIcon />}
                  </Button>
                </Box>
                
                {csvContent && !error && (
                  <Alert 
                    severity="success" 
                    icon={<CheckCircleIcon />}
                    variant="filled"
                    className="mt-4 animate-fadeIn"
                  >
                    Fichier <strong>{csvContent}</strong> chargé avec succès ! {students.length} étudiant(s) détecté(s).
                  </Alert>
                )}
              </div>
            )}

            {activeTab === 2 && (
              <div className="space-y-4">
                {/* Always show the explanation */}
                <Paper variant="outlined" className="p-4 bg-blue-50 border-blue-200">
                  <Typography variant="subtitle2" component="div" sx={{ mb: 2, fontWeight: 'bold', color: '#1E40AF' }}>
                    Sélectionnez une classe :
                  </Typography>
                  <Typography variant="body2">
                    Choisissez une classe pour importer automatiquement tous ses étudiants.
                    Vous pourrez ensuite attribuer des notes à chaque étudiant.
                  </Typography>
                </Paper>
                
                {/* Always show the class selection */}
                <FormControl fullWidth variant="outlined" sx={{ mt: 3 }}>
                  <InputLabel id="class-select-label">Classe</InputLabel>
                  <Select
                    labelId="class-select-label"
                    id="class-select"
                    value={selectedClassId}
                    onChange={handleClassChange}
                    label="Classe"
                    startAdornment={
                      loadingClasses ? (
                        <CircularProgress size={20} sx={{ mr: 1 }} />
                      ) : (
                        <SchoolIcon sx={{ mr: 1, color: 'primary.main' }} />
                      )
                    }
                    disabled={loadingClasses}
                  >
                    {classes.map((cls) => (
                      <MenuItem key={cls.id} value={cls.id.toString()}>
                        {cls.name} ({cls.academic_year})
                      </MenuItem>
                    ))}
                  </Select>
                  {loadingClasses && (
                    <Typography variant="caption" color="text.secondary">
                      Chargement des classes...
                    </Typography>
                  )}
                </FormControl>
                
                {/* Always show subclass selection if applicable */}
                {selectedClass && selectedClass.nbre_subclasses && selectedClass.nbre_subclasses > 0 && (
                  <FormControl fullWidth variant="outlined" sx={{ mt: 2 }}>
                    <InputLabel id="subclass-select-label">Sous-classe</InputLabel>
                    <Select
                      labelId="subclass-select-label"
                      id="subclass-select"
                      value={selectedSubClass}
                      onChange={handleSubClassChange}
                      label="Sous-classe"
                      startAdornment={
                        <LayersIcon sx={{ mr: 1, color: 'secondary.main' }} />
                      }
                    >
                      <MenuItem value="">
                        <em>Toute la classe</em>
                      </MenuItem>
                      {Array.from({ length: selectedClass.nbre_subclasses }, (_, i) => i + 1).map((num) => (
                        <MenuItem key={num} value={num.toString()}>
                          Groupe {num}
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>
                      Sélectionnez un groupe spécifique ou laissez vide pour toute la classe
                    </FormHelperText>
                  </FormControl>
                )}
                
                {/* Divider, loading indicator, success and error alerts */}
                <Box sx={{ mt: 3 }}>
                  {loadingClassStudents && (
                    <Box display="flex" justifyContent="center" my={2}>
                      <CircularProgress size={40} />
                    </Box>
                  )}
                  
                  {selectedClassId && classStudents.length > 0 && !loadingClassStudents && (
                    <Alert 
                      severity="success" 
                      icon={<CheckCircleIcon />}
                      variant="filled"
                      sx={{ mb: 2 }}
                      className="animate-fadeIn"
                    >
                      <Typography variant="subtitle2">
                        {students.length} étudiant(s) importé(s) avec succès !
                      </Typography>
                      <Typography variant="body2">
                        {selectedSubClass ? `Groupe ${selectedSubClass} uniquement.` : 'Tous les étudiants de la classe.'}
                      </Typography>
                    </Alert>
                  )}
                  
                  {selectedClassId && classStudents.length === 0 && !loadingClassStudents && (
                    <Alert 
                      severity="warning"
                      sx={{ mb: 2 }}
                    >
                      Aucun étudiant trouvé dans cette classe. Ajoutez d'abord des étudiants à la classe.
                    </Alert>
                  )}
                </Box>
              </div>
            )}
          </div>
        )}
      </Paper>

      {error && (
        <Alert severity="error" className="mb-4 animate-fadeIn">
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" className="mb-4 animate-fadeIn">
          {successMessage}
        </Alert>
      )}

      {/* Students list - only show when we have students */}
      {students.length > 0 && (
        <Paper className="p-6 rounded-lg shadow-md border-t-4 border-amber-600">
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
            <div className="flex items-center gap-2">
              <PersonAddIcon className="text-amber-600" fontSize="large" />
                <Typography variant="h5" className="font-bold">
                {students.length === 0 ? 'Aucun étudiant sélectionné' : 
                 students.length === 1 ? 'Un étudiant sélectionné' : 
                 `${students.length} étudiants sélectionnés`}
                </Typography>
            </div>
            <Button
              variant="outlined"
              color="success"
              onClick={handleCreateCorrections}
              startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              disabled={saving || (requireGroupName && !groupName.trim())}
              title={requireGroupName && !groupName.trim() ? "Vous devez d'abord saisir un nom de groupe" : ""}
            >
              {saving ? 'Enregistrement...' : 'Ajouter les corrections'}
            </Button>
          </Box>
          <Typography variant="overline" className="font-bold" sx={{ mb: 2, fontWeight: 'bold', color: '#d43100' }}>
                Les notes peuvent être modifiées à tout moment. Une redirection a lieu après l'enregistrement.
          </Typography>

          {/* Afficher un message d'avertissement si le nom de groupe est requis mais vide */}
          {requireGroupName && !groupName.trim() && students.length > 0 && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              Veuillez saisir un nom de groupe avant d'ajouter les corrections
            </Alert>
          )}

          {/* Table with improved design */}
          <TableContainer className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <Table size="small">
              <TableHead className="bg-gradient-to-r from-gray-100 to-blue-50">
                <TableRow>
                  <TableCell align="left" width="40px"></TableCell>
                  <TableCell align="left">Prénom</TableCell>
                  <TableCell align="left">Nom</TableCell>
                  <TableCell align="center">Note exp. /{experimentalPoints}</TableCell>
                  <TableCell align="center">Note théo. /{theoreticalPoints}</TableCell>
                  <TableCell align="center">Total /20</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students.map((student, index) => (
                  <TableRow 
                    key={index}
                    className={index % 2 === 0 ? 'bg-white hover:bg-blue-50' : 'bg-gray-50 hover:bg-blue-50'}
                  >
                    <TableCell>
                      <IconButton
                        onClick={() => handleDeleteStudent(index)}
                        color="error"
                        size="small"
                        title="Supprimer cet étudiant"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      <TextField
                        value={student.firstName}
                        onChange={(e) => {
                          setStudents(prev => {
                            const updated = [...prev];
                            updated[index].firstName = e.target.value;
                            return updated;
                          });
                        }}
                        variant="standard"
                        size="small"
                        fullWidth
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        value={student.lastName}
                        onChange={(e) => {
                          setStudents(prev => {
                            const updated = [...prev];
                            updated[index].lastName = e.target.value;
                            return updated;
                          });
                        }}
                        variant="standard"
                        size="small"
                        fullWidth
                      />
                    </TableCell>
                    <TableCell align="center" className="px-2">
                          <Slider
                            value={parseFloat(student.experimentalGrade) || 0}
                            onChange={(_, newValue) => handleExperimentalGradeChange(index, newValue)}
                            step={0.5}
                            min={0}
                            max={experimentalPoints}
                            valueLabelDisplay="auto"
                            size="small"
                            className="mx-1"
                          />
                    </TableCell>
                    <TableCell align="center" className="px-2">
                          <Slider
                            value={parseFloat(student.theoreticalGrade) || 0}
                            onChange={(_, newValue) => handleTheoreticalGradeChange(index, newValue)}
                            step={0.5}
                            min={0}
                            max={theoreticalPoints}
                            valueLabelDisplay="auto"
                            size="small"
                            className="mx-1"
                          />
                    </TableCell>
                    <TableCell align="center" className="font-medium">
                      <Chip 
                        label={calculateTotalGrade(student.experimentalGrade, student.theoreticalGrade)} 
                        color="primary" 
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          <Box mt={4} display="flex" gap={2} justifyContent="space-between">
            <div>
            <Button
              onClick={handleReset} // Use the new handleReset function instead of just setStudents([])
              color="error"
              variant="outlined"
              startIcon={<CloseIcon />}
              size="small"
            >
              Recommencer
            </Button>
            </div>
            <div>
              <Button
                onClick={handleCancel}
                color="inherit"
                variant="outlined"
                startIcon={<CloseIcon />}
                size="small"
              >
                Annuler
              </Button>
            </div>
          </Box>
        </Paper>
      )}
    </div>
  );
}
