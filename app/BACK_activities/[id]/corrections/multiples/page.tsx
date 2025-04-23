'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Activity } from '@/lib/activity';
import { 
  Paper, 
  Typography, 
  Box, 
  Alert, 
  CircularProgress,
  Button,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  FormHelperText,
  Checkbox,
  ListItemText,
  OutlinedInput,
  Divider,
  Chip,
  TextField,
  Card,
  CardContent,
  CardActions,
  Tabs,
  Tab
} from '@mui/material';
import Link from 'next/link';
import AssignmentIcon from '@mui/icons-material/Assignment';
import GroupIcon from '@mui/icons-material/Group';
import PeopleIcon from '@mui/icons-material/People';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import HomeIcon from '@mui/icons-material/Home';
import TuneIcon from '@mui/icons-material/Tune';
import CheckIcon from '@mui/icons-material/Check';



interface Student {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  allClasses?: { classId: number; className: string; sub_class?: string | null }[];
}

interface Class {
  id: number;
  name: string;
}

export default function MultipleCorrectionsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = React.use(params);
    const activityId = id;


  const router = useRouter();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [classesLoading, setClassesLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [classes, setClasses] = useState<Class[]>([]);
  const [unassociatedClasses, setUnassociatedClasses] = useState<Class[]>([]);
  const [selectedClassIds, setSelectedClassIds] = useState<number[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [classTabValue, setClassTabValue] = useState(0); // 0 = associated, 1 = unassociated
  
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [warningMessages, setWarningMessages] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [showGroupNameField, setShowGroupNameField] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const response = await fetch(`/api/activities/${activityId}`);
        if (!response.ok) throw new Error('Erreur lors du chargement de l\'activité');
        const data = await response.json();
        setActivity(data);
      } catch (err) {
        console.error('Erreur:', err);
        setError('Erreur lors du chargement de l\'activité');
      } finally {
        setLoading(false);
      }
    };
    
    const fetchClasses = async () => {
      try {
        setClassesLoading(true);
        
        // 1. Récupérer les classes associées à cette activité
        const associatedClassesResponse = await fetch(`/api/activities/${activityId}/classes`);
        let associatedClasses: Class[] = [];
        
        if (associatedClassesResponse.ok) {
          associatedClasses = await associatedClassesResponse.json();
          setClasses(associatedClasses);
          
          // Si l'activité est associée à exactement une classe et qu'on est sur l'onglet des classes associées
          if (associatedClasses.length === 1 && classTabValue === 0) {
            setSelectedClassIds([associatedClasses[0].id]);
          }
        }
        
        // 2. Récupérer toutes les classes pour trouver celles qui ne sont pas associées
        const allClassesResponse = await fetch('/api/classes');
        
        if (allClassesResponse.ok) {
          const allClasses = await allClassesResponse.json();
          
          // Identifier les classes non associées
          const associatedIds = new Set(associatedClasses.map(c => c.id));
          const unassociated = allClasses.filter((c: Class) => !associatedIds.has(c.id));
          
          setUnassociatedClasses(unassociated);
        }
      } catch (err) {
        console.error('Erreur lors du chargement des classes:', err);
      } finally {
        setClassesLoading(false);
      }
    };
    
    const fetchStudents = async () => {
      try {
        setStudentsLoading(true);
        // Récupérer tous les étudiants
        const response = await fetch('/api/students');
        if (!response.ok) throw new Error('Erreur lors du chargement des étudiants');
        const data = await response.json();
        setStudents(data);
        setFilteredStudents(data);
      } catch (err) {
        console.error('Erreur:', err);
      } finally {
        setStudentsLoading(false);
      }
    };
    
    fetchActivity();
    fetchClasses();
    fetchStudents();
  }, [activityId, classTabValue]);
  
  // Filtrer les étudiants lorsque les classes sélectionnées changent
  useEffect(() => {
    if (selectedClassIds.length === 0) {
      setFilteredStudents(students);
    } else {
      const filtered = students.filter(student => 
        student.allClasses && student.allClasses.some(cls => 
          selectedClassIds.includes(cls.classId)
        )
      );
      setFilteredStudents(filtered);
    }
  }, [selectedClassIds, students]);
  
  // Gestionnaire pour le changement d'onglet des classes
  const handleClassTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setClassTabValue(newValue);
    setSelectedClassIds([]); // Réinitialiser la sélection lors du changement d'onglet
  };
  
  const handleClassChange = (event: SelectChangeEvent<number[]>) => {
    const value = event.target.value as number[];
    setSelectedClassIds(value);
  };
  
  const handleStudentChange = (event: SelectChangeEvent<number[]>) => {
    const value = event.target.value as number[];
    setSelectedStudentIds(value);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedStudentIds.length === 0) {
      setWarningMessages(['Aucun étudiant sélectionné. Veuillez sélectionner au moins un étudiant.']);
      setShowConfirmation(true);
      return;
    }
    
    setIsSubmitting(true);
    setSuccessMessage('');
    setError('');
    
    try {
      // Si on a sélectionné des classes non-associées (onglet 1), les associer à l'activité
      if (classTabValue === 1 && selectedClassIds.length > 0) {
        // Associer chaque classe sélectionnée à l'activité
        for (const classId of selectedClassIds) {
          try {
            const response = await fetch(`/api/activities/${activityId}/classes`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                class_id: classId
              }),
            });
            
            if (!response.ok) {
              // Extraction du message d'erreur de l'API
              const errorData = await response.json();
              throw new Error(errorData.message || `Erreur lors de l'association de la classe ${classId}`);
            }
          } catch (error) {
            console.error(`Erreur lors de l'association de la classe ${classId}:`, error);
            throw error; // Propager l'erreur pour l'attraper dans le bloc catch principal
          }
        }
      }
      
      // Créer un groupe si demandé
      let groupId = null;
      if (showGroupNameField && groupName.trim()) {
        const groupResponse = await fetch('/api/correction-groups', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: groupName,
            activity_id: activityId
          }),
        });
        
        if (!groupResponse.ok) {
          throw new Error('Erreur lors de la création du groupe');
        }
        
        const groupData = await groupResponse.json();
        groupId = groupData.id;
      }
      
      // Ajouter les corrections pour chaque étudiant sélectionné
      const creationPromises = selectedStudentIds.map(async (studentId) => {
        const student = students.find(s => s.id === studentId);
        
        // Trouver la classe principale de l'étudiant parmi les classes sélectionnées
        let classId = null;
        let subClass = null;
        
        if (student?.allClasses) {
          // Chercher parmi les classes sélectionnées
          const classMatch = student.allClasses.find(cls => 
            selectedClassIds.includes(cls.classId)
          );
          
          if (classMatch) {
            classId = classMatch.classId;
            subClass = classMatch.sub_class;
            
            // S'assurer que la classe est associée à l'activité
            try {
              const response = await fetch(`/api/activities/${activityId}/classes`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  class_id: classId
                }),
              });
              
              if (!response.ok) {
                // Extraction du message d'erreur de l'API
                const errorData = await response.json();
                // Ne pas lancer d'erreur ici car l'association peut déjà exister (ce qui n'est pas une erreur critique)
                console.warn(`Problème lors de l'association de classe : ${errorData.message || "Problème lors de l'association de classe."}`);
              }
            } catch (error) {
              console.warn(`Impossible d'associer la classe à l'activité :`, error);
              // Ne pas lancer d'erreur fatale ici
            }
          }
        }
        
        return fetch(`/api/activities/${activityId}/corrections`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            student_id: studentId,
            class_id: classId,
            sub_class: subClass,
            group_id: groupId,
            content: ''
          }),
        });
      });
      
      const results = await Promise.allSettled(creationPromises);
      
      // Compter les réussites et les échecs
      const successes = results.filter(r => r.status === 'fulfilled');
      const failures = results.filter(r => r.status === 'rejected');
      
      if (successes.length > 0) {
        setSuccessMessage(
          successes.length === 1
            ? `1 correction ajoutée avec succès${groupId ? ' dans le groupe ' + groupName : ''}.`
            : `${successes.length} corrections ajoutées avec succès${groupId ? ' dans le groupe ' + groupName : ''}.`
        );
        
        // Extract the IDs of successfully created corrections
        const successfulCorrectionIds = await Promise.all(
          results
            .filter(r => r.status === 'fulfilled')
            .map(async (r) => {
              // @ts-ignore - TypeScript doesn't know this is a fulfilled result
              const response = r.value as Response;
              if (response.ok) {
                const data = await response.json();
                return data.id;
              }
              return null;
            })
        );
        
        const validIds = successfulCorrectionIds.filter(id => id !== null);
        
        // Redirect based on whether we have a group or just individual corrections
        if (groupId) {
          // Redirect to the group view
          setTimeout(() => {
            router.push(`/activities/${activityId}/groups/${groupId}`);
          }, 1500);
        } else {
          // Redirect to corrections with filter for this activity and recently added
          setTimeout(() => {
            // Extraire les IDs des corrections ajoutées avec succès
            const validCorrectionIds = validIds.join(',');
            
            // Utiliser les paramètres standards compatibles avec la page des corrections
            // Ajouter selectedCorrectionIds pour filtrer spécifiquement ces corrections
            router.push(`/corrections?activityId=${activityId}&highlight=${validCorrectionIds}&selectedCorrectionIds=${validCorrectionIds}`);
          }, 1500);
        }
      }
      
      if (failures.length > 0) {
        setError(`Échec de création pour ${failures.length} correction(s).`);
      }
    } catch (err) {
      console.error('Erreur:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Cette fonction permet d'obtenir les classes à afficher selon l'onglet actif
  const getDisplayedClasses = () => {
    return classTabValue === 0 ? classes : unassociatedClasses;
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-4xl w-full flex justify-center py-16">
          <CircularProgress size={40} />
        </div>
      </div>
    );
  }
  
  if (!activity) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
        <Box className="max-w-4xl w-full">
          <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }} className="border-l-4 border-yellow-500">
            <Alert severity="warning" sx={{ mb: 3 }}>
              L&apos;activité demandée n&apos;existe pas ou a été supprimée.
            </Alert>
            <Button
              variant="outlined"
              color="primary"
              component={Link}
              href="/activities"
            >
              Retour à la liste des activités
            </Button>
          </Paper>
        </Box>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8 text-center">
          <Typography variant="h4" component="h1" color='primar' fontWeight={700}>
            Corrections multiples
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {activity.name}
          </Typography>
        </div>
        
        <Paper elevation={2} className="rounded-lg overflow-hidden shadow-md">
          <Box className="bg-purple-600 p-4 text-white flex justify-between items-center">
            <div className="flex items-center gap-2">
              <PeopleIcon />
              <Typography variant="h6">
                Ajouter plusieurs corrections
              </Typography>
            </div>
            <IconButton 
              component={Link}
              href={`/activities/${activityId}/corrections`}
              size="small"
              className="text-white"
              aria-label="retour"
            >
              <ArrowBackIcon />
            </IconButton>
          </Box>
          
          <Box className="p-6">
            {error && (
              <Alert severity="error" className="mb-6" variant="outlined">
                {error}
              </Alert>
            )}
            
            {successMessage && (
              <Alert severity="success" className="mb-6" variant="outlined">
                {successMessage}
              </Alert>
            )}
            
            {showConfirmation && (
              <Alert 
                severity="warning" 
                className="mb-6"
                onClose={() => setShowConfirmation(false)}
              >
                {warningMessages.map((message, index) => (
                  <Typography key={index} variant="body2">
                    • {message}
                  </Typography>
                ))}
              </Alert>
            )}
            
            <form onSubmit={handleSubmit}>
              {/* Tabs pour choisir entre classes associées et non associées */}
              <Box sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Tabs 
                  value={classTabValue} 
                  onChange={handleClassTabChange}
                  aria-label="class selection tabs"
                >
                  <Tab label={`Classes associées (${classes.length})`} />
                  <Tab label={`Autres classes (${unassociatedClasses.length})`} />
                </Tabs>
              </Box>
              
              {/* Sélection de classes avec prise en compte du tab actif */}
              <div className="mb-6">
                <FormControl fullWidth disabled={classesLoading}>
                  <InputLabel id="class-select-label">
                    {classTabValue === 0 ? "Classes associées" : "Classes non associées"}
                  </InputLabel>
                  <Select
                    labelId="class-select-label"
                    id="class-select"
                    multiple
                    value={selectedClassIds}
                    onChange={handleClassChange}
                    input={<OutlinedInput label={classTabValue === 0 ? "Classes associées" : "Classes non associées"} />}
                    renderValue={(selected: number[]) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => {
                          // Trouver la classe dans l'ensemble approprié
                          const allClassesForDisplay = [...classes, ...unassociatedClasses];
                          const cls = allClassesForDisplay.find(c => c.id === value);
                          return (
                            <Chip 
                              key={value} 
                              label={cls?.name || value}
                              size="small" 
                            />
                          );
                        })}
                      </Box>
                    )}
                    startAdornment={
                      classesLoading ? (
                        <CircularProgress size={20} className="mr-2" />
                      ) : (
                        <GroupIcon className="mr-2 text-gray-400" />
                      )
                    }
                  >
                    {getDisplayedClasses().length === 0 ? (
                      <MenuItem disabled>
                        <em>{classTabValue === 0 
                          ? "Aucune classe associée à cette activité" 
                          : "Toutes les classes sont déjà associées"}</em>
                      </MenuItem>
                    ) : (
                      getDisplayedClasses().map((cls) => (
                        <MenuItem key={cls.id} value={cls.id}>
                          <Checkbox checked={selectedClassIds.indexOf(cls.id) > -1} />
                          <ListItemText primary={cls.name} />
                        </MenuItem>
                      ))
                    )}
                  </Select>
                  <FormHelperText>
                    {classesLoading 
                      ? "Chargement des classes..." 
                      : getDisplayedClasses().length === 0
                        ? classTabValue === 0
                          ? "Aucune classe n'est associée à cette activité"
                          : "Toutes les classes sont déjà associées à cette activité"
                        : classTabValue === 0
                          ? "Sélectionnez parmi les classes déjà associées à cette activité"
                          : "Sélectionnez parmi les autres classes disponibles"
                    }
                  </FormHelperText>
                </FormControl>
              </div>
              
              {/* Sélection d'étudiants */}
              <div className="mb-6">
                <FormControl fullWidth disabled={studentsLoading}>
                  <InputLabel id="students-select-label">Étudiants</InputLabel>
                  <Select
                    labelId="students-select-label"
                    id="students-select"
                    multiple
                    value={selectedStudentIds}
                    onChange={handleStudentChange}
                    input={<OutlinedInput label="Étudiants" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        <Chip 
                          label={`${selected.length} étudiant(s) sélectionné(s)`}
                          size="small" 
                        />
                      </Box>
                    )}
                    startAdornment={
                      studentsLoading ? (
                        <CircularProgress size={20} className="mr-2" />
                      ) : (
                        <PeopleIcon className="mr-2 text-gray-400" />
                      )
                    }
                  >
                    {filteredStudents.map((student) => (
                      <MenuItem key={student.id} value={student.id}>
                        <Checkbox checked={selectedStudentIds.indexOf(student.id) > -1} />
                        <ListItemText 
                          primary={`${student.first_name} ${student.last_name}`} 
                          secondary={
                            student.allClasses 
                              ? student.allClasses
                                  .filter(cls => selectedClassIds.length === 0 || selectedClassIds.includes(cls.classId))
                                  .map(cls => cls.className)
                                  .join(', ')
                              : ''
                          }
                        />
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>
                    {studentsLoading 
                      ? "Chargement des étudiants..." 
                      : filteredStudents.length === 0
                        ? "Aucun étudiant disponible avec les filtres actuels"
                        : `${filteredStudents.length} étudiant(s) disponible(s)`
                    }
                  </FormHelperText>
                </FormControl>
              </div>
              
              {/* Options de groupage */}
              <Card variant="outlined" className="mb-6">
                <CardContent>
                  <Typography variant="subtitle1" className="flex items-center gap-2 mb-3">
                    <TuneIcon className="text-blue-500" />
                    Options supplémentaires
                  </Typography>
                  
                  <Box className="flex items-center mb-2">
                    <Checkbox
                      checked={showGroupNameField}
                      onChange={(e) => setShowGroupNameField(e.target.checked)}
                      id="group-option"
                    />
                    <Typography component="label" htmlFor="group-option">
                      Ajouter un groupe pour ces corrections
                    </Typography>
                  </Box>
                  
                  {showGroupNameField && (
                    <TextField
                      label="Nom du groupe"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      fullWidth
                      size="small"
                      sx={{ mt: 2 }}
                      placeholder="Ex: Groupe A - TP 3"
                      required={showGroupNameField}
                    />
                  )}
                </CardContent>
              </Card>
              
              <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-100">
                <Typography component={'div'} variant="body2">
                  <strong>Information :</strong> Après avoir ajouté les corrections, vous pourrez les éditer individuellement 
                  ou les gérer en groupe. {showGroupNameField && "Le groupe créé sera accessible depuis la page de l'activité."}
                  {classTabValue === 1 && selectedClassIds.length > 0 && (
                    <Box sx={{ mt: 1 }}>
                      <strong>Note :</strong> Les classes non associées sélectionnées seront automatiquement associées à cette activité.
                    </Box>
                  )}
                </Typography>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
                <Button
                  variant="text"
                  color="inherit"
                  startIcon={<ArrowBackIcon />}
                  component={Link}
                  href={`/activities/${activityId}/corrections`}
                  className="text-gray-600 hover:text-purple-600"
                >
                  Retour
                </Button>
                
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={isSubmitting || selectedStudentIds.length === 0 || (showGroupNameField && !groupName.trim())}
                  startIcon={isSubmitting ? <HourglassEmptyIcon className="animate-spin" /> : <CheckIcon />}
                  size="large"
                >
                    {isSubmitting 
                    ? "Ajout en cours..." 
                    : selectedStudentIds.length === 0
                      ? "Aucune correction, choisir étudiant"
                      : `Ajouter ${selectedStudentIds.length} correction${selectedStudentIds.length > 1 ? 's' : ''}`
                    }
                </Button>
              </div>
            </form>
          </Box>
        </Paper>
      </div>
    </div>
  );
}
