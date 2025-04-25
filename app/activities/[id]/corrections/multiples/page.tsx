'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ActivityAutre } from '@/lib/types';
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
  Chip,
  TextField,
  Card,
  CardContent,
  Tabs,
  Tab
} from '@mui/material';
import Link from 'next/link';
import GroupIcon from '@mui/icons-material/Group';
import PeopleIcon from '@mui/icons-material/People';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import TuneIcon from '@mui/icons-material/Tune';
import CheckIcon from '@mui/icons-material/Check';
import GroupAddIcon from '@mui/icons-material/GroupAdd';



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

// Définir l'interface pour la structure des sous-classes
interface SubClass {
  value: string;
  classId: number;
  className: string;
}

export default function MultipleCorrectionsAutrePage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap the params Promise using React.use()
  const unwrappedParams = React.use(params);
  const { id } = unwrappedParams;
  const activityId = id;
  const router = useRouter();

  const [activity, setActivity] = useState<ActivityAutre | null>(null);
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
  
  // Mettre à jour le type de availableSubClasses 
  const [availableSubClasses, setAvailableSubClasses] = useState<SubClass[]>([]);
  const [selectedSubClass, setSelectedSubClass] = useState<string>('all');
  const [subClassesLoading, setSubClassesLoading] = useState(false);
  
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [warningMessages, setWarningMessages] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [showGroupNameField, setShowGroupNameField] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const response = await fetch(`/api/activities_autres/${activityId}`);
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
        const associatedClassesResponse = await fetch(`/api/activities_autres/${activityId}/classes`);
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

  // 
  
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
  
  // Pour charger les sous-classes lorsque les classes sont sélectionnées
  useEffect(() => {
    const loadSubClasses = async () => {
      if (selectedClassIds.length === 0) {
        setAvailableSubClasses([]);
        setSelectedSubClass('all');
        return;
      }
      
      setSubClassesLoading(true);
      try {
        // Récupérer tous les groupes (sous-classes) pour les classes sélectionnées
        // Structure modifiée pour stocker les informations de classe avec chaque sous-classe
        const subClassesMap = new Map<string, { value: string, classId: number, className: string }>();
        
        // Pour chaque classe sélectionnée, récupérer ses sous-classes
        for (const classId of selectedClassIds) {
          const response = await fetch(`/api/classes/${classId}`);
          if (response.ok) {
            const classData = await response.json();
            
            // Si la classe a des sous-classes définies
            if (classData.nbre_subclasses && classData.nbre_subclasses > 0) {
              // Créer un tableau de sous-classes de 1 à nbre_subclasses
              const subClasses = Array.from(
                { length: classData.nbre_subclasses },
                (_, index) => ({
                  value: (index + 1).toString(),
                  classId: classId,
                  className: classData.name
                })
              );
              
              // Ajouter chaque sous-classe à la Map avec une clé composite
              subClasses.forEach(subClass => {
                const compositeKey = `${subClass.classId}:${subClass.value}`;
                subClassesMap.set(compositeKey, subClass);
              });
            }
          }
        }
        
        // Convertir la Map en tableau et trier d'abord par numéro de groupe puis par nom de classe
        const subClassesArray = Array.from(subClassesMap.values()).sort((a, b) => {
          // D'abord trier par numéro de groupe
          const numComparison = parseInt(a.value) - parseInt(b.value);
          if (numComparison !== 0) return numComparison;
          
          // Si même numéro de groupe, trier par nom de classe
          return a.className.localeCompare(b.className);
        });
        
        setAvailableSubClasses(subClassesArray);
      } catch (error) {
        console.error('Erreur lors du chargement des sous-classes:', error);
      } finally {
        setSubClassesLoading(false);
      }
    };
    
    loadSubClasses();
  }, [selectedClassIds]);
  
  // Filtrer les étudiants par sous-classe lorsque selectedSubClass change
  useEffect(() => {
    if (selectedClassIds.length === 0) {
      // Aucune classe sélectionnée, montrer tous les étudiants
      setFilteredStudents(students);
      return;
    }
    
    // Filtrer par classe et sous-classe si applicable
    const filtered = students.filter(student => {
      // Vérifier si l'étudiant appartient à au moins une des classes sélectionnées
      const inSelectedClass = student.allClasses && student.allClasses.some(cls => 
        selectedClassIds.includes(cls.classId)
      );
      
      if (!inSelectedClass) return false;
      
      // Si on filtre également par sous-classe
      if (selectedSubClass !== 'all') {
        // Extraire les composants de la clé composite "classId:subClassValue"
        const [selectedClassIdStr, selectedSubClassValue] = selectedSubClass.split(':');
        const selectedClassIdNum = parseInt(selectedClassIdStr);
        
        // Vérifier si l'étudiant a la sous-classe sélectionnée dans la classe spécifique
        return student.allClasses && student.allClasses.some(cls => {
          return cls.classId === selectedClassIdNum && 
                 cls.sub_class?.toString() === selectedSubClassValue;
        });
      }
      
      // Sinon, inclure tous les étudiants des classes sélectionnées
      return true;
    });
    
    
    
    // Mettre à jour les étudiants filtrés
    setFilteredStudents(filtered);
  }, [selectedClassIds, selectedSubClass, students]);
  
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
            const response = await fetch(`/api/activities_autres/${activityId}/classes`, {
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
          throw new Error('Erreur lors de l\'ajout du groupe');
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
              const response = await fetch(`/api/activities_autres/${activityId}/classes`, {
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
        
        return fetch(`/api/activities_autres/${activityId}/corrections`, {
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
              // TypeScript ne sait pas que c'est un résultat satisfait (fulfilled)
              // Mais nous voulons explicitement traiter cela comme une Response
              const response = (r as PromiseFulfilledResult<Response>).value;
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
        setError(`Échec de l'ajout pour ${failures.length} correction(s).`);
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
              
              {/* Sélection de sous-classe (groupe) */}
              {selectedClassIds.length > 0 && (
                <div className="mb-6">
                  <FormControl fullWidth disabled={subClassesLoading}>
                    <InputLabel id="subclass-select-label">Filtrer par groupe</InputLabel>
                    <Select
                      labelId="subclass-select-label"
                      id="subclass-select"
                      value={selectedSubClass}
                      onChange={(e) => setSelectedSubClass(e.target.value)}
                      input={<OutlinedInput label="Filtrer par groupe" />}
                      startAdornment={
                        subClassesLoading ? (
                          <CircularProgress size={20} className="mr-2" />
                        ) : (
                          <GroupIcon className="mr-2 text-gray-400" />
                        )
                      }
                    >
                      <MenuItem value="all">Tous les groupes</MenuItem>
                      {availableSubClasses.map((subClass) => (
                       <MenuItem key={`${subClass.classId}:${subClass.value}`} value={`${subClass.classId}:${subClass.value}`}>
                          Groupe {subClass.value} - {subClass.className}
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>
                      {subClassesLoading 
                        ? "Chargement des groupes..." 
                        : availableSubClasses.length === 0
                          ? "Aucun groupe disponible pour cette/ces classe(s)"
                          : "Filtrer les étudiants par groupe"
                      }
                    </FormHelperText>
                  </FormControl>
                </div>
              )}
              
              {/* Bouton pour sélectionner tous les étudiants du groupe */}
              {selectedSubClass !== 'all' && availableSubClasses.length > 0 && (
                <div className="mb-6">
                  <Button
                    variant="outlined"
                    color="primary"
                    fullWidth
                    startIcon={<PeopleIcon />}
                    onClick={() => {
                      // Extraire les composants de la clé composite (classId:subClass)
                      const [selectedClassId, selectedGroupValue] = selectedSubClass.split(':');
                      const classIdNum = parseInt(selectedClassId);
                      
                      // Identifier la classe sélectionnée pour l'affichage
                      const classInfo = availableSubClasses.find(
                        sc => sc.classId === classIdNum && sc.value === selectedGroupValue
                      );
                      
                      // Sélectionner tous les étudiants du groupe filtré actuel
                      const studentsInGroup = filteredStudents.map(student => student.id);
                      setSelectedStudentIds(studentsInGroup);
                    }}
                    disabled={filteredStudents.length === 0}
                  >
                    {(() => {
                      // Extraire les informations du groupe sélectionné
                      if (selectedSubClass === 'all') return "Sélectionner tous les étudiants";
                      
                      const [selectedClassId, selectedGroupValue] = selectedSubClass.split(':');
                      const classIdNum = parseInt(selectedClassId);
                      
                      const classInfo = availableSubClasses.find(
                        sc => sc.classId === classIdNum && sc.value === selectedGroupValue
                      );
                      
                      return `Sélectionner tous les étudiants du Groupe ${selectedGroupValue} - ${classInfo?.className || ''} (${filteredStudents.length})`;
                    })()}
                  </Button>
                </div>
              )}
              
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
                {/* Bouton pour sélectionner tous les étudiants filtrés */}
                <Button
                  variant="outlined"
                  color="primary"
                  fullWidth
                  sx={{ mt: 1 }}
                  onClick={() => setSelectedStudentIds(filteredStudents.map(s => s.id))}
                  disabled={filteredStudents.length === 0}
                  startIcon={<GroupAddIcon />}
                >
                  Sélectionner tous les étudiants affichés ({filteredStudents.length})
                </Button>
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
                  <strong>Information :</strong> après avoir ajouté les corrections, vous pourrez les éditer individuellement 
                  ou les gérer en groupe. {showGroupNameField && "Le groupe ajouté sera accessible depuis la page de l'activité."}
                  {classTabValue === 1 && selectedClassIds.length > 0 && (
                    <Box sx={{ mt: 1 }}>
                      <strong>Note :</strong> les classes non associées sélectionnées seront automatiquement associées à cette activité.
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
                  variant="outlined"
                  color="success"
                  disabled={isSubmitting || selectedStudentIds.length === 0 || (showGroupNameField && !groupName.trim())}
                  startIcon={isSubmitting ? <HourglassEmptyIcon className="animate-spin" /> : <CheckIcon />}
                  size="large"
                >
                    {isSubmitting 
                    ? "Création en cours..." 
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