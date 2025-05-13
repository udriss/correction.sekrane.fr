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
  Tabs,
  Tab,
  TextField,
  InputAdornment
} from '@mui/material';
import Link from 'next/link';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SchoolIcon from '@mui/icons-material/School';
import SaveIcon from '@mui/icons-material/Save';
import HomeIcon from '@mui/icons-material/Home';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import SearchIcon from '@mui/icons-material/Search';
import {Student} from '@/lib/types';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import GroupIcon from '@mui/icons-material/Group';
import { addRecentCorrection } from '@/lib/recentCorrections';


export default function NewCorrectionAutrePage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap the params Promise using React.use()
  const unwrappedParams = React.use(params);
  const { id } = unwrappedParams;
  const activityId = id;


  
  const [studentId, setStudentId] = useState<number | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [activity, setActivity] = useState<ActivityAutre | null>(null);
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const [classId, setClassId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState(''); // Nouvel état pour le terme de recherche

  // Correction du typage pour inclure la propriété nbre_subclasses
  interface ClassWithSubclasses {
    id: number;
    name: string;
    nbre_subclasses?: number;
  }
  const [activityClasses, setActivityClasses] = useState<ClassWithSubclasses[]>([]);
  const [unassociatedClasses, setUnassociatedClasses] = useState<ClassWithSubclasses[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [originalStudents, setOriginalStudents] = useState<Student[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [warningMessages, setWarningMessages] = useState<string[]>([]);
  
  // Nouveaux états pour les sous-classes et le système d'onglets
  const [subClassOptions, setSubClassOptions] = useState<string[]>([]);
  const [selectedSubClass, setSelectedSubClass] = useState<string | null>(null);
  const [subClassLoading, setSubClassLoading] = useState(false);
  const [classesLoading, setClassesLoading] = useState(false);
  const [hasSubClasses, setHasSubClasses] = useState(false);
  const [classTabValue, setClassTabValue] = useState(0); // 0 = associated, 1 = unassociated

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
    
    const fetchStudents = async () => {
      try {
        setStudentsLoading(true);
        setClassesLoading(true);
        
        // Récupérer tous les étudiants - maintenant avec structure consolidée
        const response = await fetch('/api/students');
        if (!response.ok) throw new Error('Erreur lors du chargement des étudiants');
        const data = await response.json();
        
        // Stocker les données originales
        setOriginalStudents(data);
        
        // 1. Récupérer les classes associées à cette activité
        const associatedClassesResponse = await fetch(`/api/activities_autres/${activityId}/classes`);
        let associatedClasses: { id: number; name: string }[] = [];
        
        if (associatedClassesResponse.ok) {
          associatedClasses = await associatedClassesResponse.json();
          setActivityClasses(associatedClasses);
        }
        
        // 2. Récupérer toutes les classes pour trouver celles qui ne sont pas associées
        const allClassesResponse = await fetch('/api/classes');
        
        if (allClassesResponse.ok) {
          const allClasses = await allClassesResponse.json();
          
          // Identifier les classes non associées
          const associatedIds = new Set(associatedClasses.map(c => c.id));
          const unassociated = allClasses.filter((c: { id: number; name: string }) => !associatedIds.has(c.id));
          
          setUnassociatedClasses(unassociated);
        }
        
        // Les données sont déjà dédupliquées, juste besoin de trier
        const sortedStudents = [...data].sort((a, b) => 
          `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`)
        );
        
        setStudents(sortedStudents);
        setFilteredStudents(sortedStudents);
      } catch (err) {
        console.error('Erreur:', err);
      } finally {
        setStudentsLoading(false);
        setClassesLoading(false);
      }
    };

    fetchActivity();
    fetchStudents();
  }, [activityId]);

  // Cette fonction récupère les sous-classes disponibles pour une classe donnée
  const fetchSubClasses = async (selectedClassId: number) => {
    setSubClassLoading(true);
    setHasSubClasses(false);
    setSelectedSubClass(null);
    
    try {
      const response = await fetch(`/api/classes/${selectedClassId}`);
      if (!response.ok) throw new Error('Erreur lors du chargement des sous-classes');
      
      const classData = await response.json();
      
      if (classData.nbre_subclasses && classData.nbre_subclasses > 0) {
        // Créer un tableau de sous-classes basé sur nbre_subclasses
        const subClasses = Array.from({ length: classData.nbre_subclasses }, (_, i) => (i + 1).toString());
        setSubClassOptions(subClasses);
        setHasSubClasses(true);
      } else {
        setSubClassOptions([]);
        setHasSubClasses(false);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des sous-classes:', err);
      setSubClassOptions([]);
      setHasSubClasses(false);
    } finally {
      setSubClassLoading(false);
    }
  };

  // Gestionnaire pour le changement d'onglet des classes
  const handleClassTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setClassTabValue(newValue);
    setClassId(null); // Réinitialiser la sélection de classe
    setSelectedSubClass(null); // Réinitialiser la sous-classe
    setHasSubClasses(false);
  };

  // Cette fonction permet d'obtenir les classes à afficher selon l'onglet actif
  const getDisplayedClasses = () => {
    return classTabValue === 0 ? activityClasses : unassociatedClasses;
  };

  // Effet pour filtrer les étudiants en fonction de la classe, sous-classe et terme de recherche
  useEffect(() => {
    let studentsToFilter = originalStudents;
    
    // Filtrer par classe si une classe est sélectionnée
    if (classId) {
      studentsToFilter = studentsToFilter.filter(student => 
        student.allClasses && student.allClasses.some(cls => cls.classId === classId)
      );
      
      // Filtrer par sous-classe si applicable
      if (selectedSubClass) {
        studentsToFilter = studentsToFilter.filter(student => 
          student.allClasses && student.allClasses.some(cls => 
            cls.classId === classId && cls.sub_class?.toString() === selectedSubClass
          )
        );
      }
    }
    
    // Filtrer par terme de recherche si présent
    if (searchTerm.trim() !== '') {
      const normalizedSearch = searchTerm.trim().toLowerCase();
      studentsToFilter = studentsToFilter.filter(student => 
        `${student.first_name} ${student.last_name}`.toLowerCase().includes(normalizedSearch) ||
        `${student.last_name} ${student.first_name}`.toLowerCase().includes(normalizedSearch)
      );
    }
    
    // Trier les étudiants par nom, prénom
    const sortedStudents = [...studentsToFilter].sort((a, b) => 
      `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`)
    );
    
    setFilteredStudents(sortedStudents);
  }, [classId, selectedSubClass, originalStudents, searchTerm]);

  const handleStudentChange = (event: SelectChangeEvent<number>) => {
    setStudentId(event.target.value as number);
  };

  const handleClassChange = (event: SelectChangeEvent<number>) => {
    const newClassId = event.target.value as number;
    setClassId(newClassId);
    
    // Réinitialiser la sous-classe lorsqu'une nouvelle classe est sélectionnée
    setSelectedSubClass(null);
    
    // Charger les sous-classes pour cette classe
    if (newClassId) {
      fetchSubClasses(newClassId);
    } else {
      setSubClassOptions([]);
      setHasSubClasses(false);
    }
  };

  // Nouveau gestionnaire pour le changement de sous-classe
  const handleSubClassChange = (event: SelectChangeEvent<string>) => {
    setSelectedSubClass(event.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Vérifications préalables à la soumission
    const warnings = [];
    
    if (!classId) {
      warnings.push("Aucune classe n'est sélectionnée. La correction sera ajoutée sans association à une classe.");
    } else if (classTabValue === 1) {
      // Avertissement pour les classes non associées
      warnings.push("Vous avez sélectionné une classe qui n'est pas encore associée à cette activité. Elle sera automatiquement associée.");
    }
    
    if (!studentId) {
      warnings.push("Aucun étudiant n'est sélectionné. La correction sera anonyme.");
    }
    
    // Si des avertissements sont présents, les afficher avec Material UI Alert
    if (warnings.length > 0) {
      setWarningMessages(warnings);
      setShowConfirmation(true);
      return; // Attendre confirmation avant de continuer
    }
    
    // Si pas d'avertissements, procéder à la soumission
    await submitCorrection();
  };

  const submitCorrection = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      // Si une classe est sélectionnée et que nous sommes dans l'onglet des classes non associées,
      // l'associer à l'activité
      if (classId && classTabValue === 1) {
        try {
          const associationResponse = await fetch(`/api/activities_autres/${activityId}/classes`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              class_id: classId
            }),
          });
          
          if (!associationResponse.ok) {
            // Extraction du message d'erreur contextualisé
            const errorData = await associationResponse.json();
            console.warn(`Problème lors de l'association de classe : ${errorData.message || "Problème lors de l'association de classe."}`);
            
            // Si l'erreur n'est pas que l'association existe déjà, on arrête le processus
            if (!errorData.exists) {
              throw new Error(`Impossible d'associer la classe à l'activité : ${errorData.message}` || "Impossible d'associer la classe à l'activité.");
            }
          }
        } catch (error) {
          if (error instanceof Error) {
            throw error; // Propager l'erreur avec son message contextualisé
          }
        }
      }

      // Ajouter un délai de 1 seconde avant l'envoi
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Inclure la sous-classe dans la requête si elle est définie
      const requestData: {
        student_id: number | null;
        class_id: number | null;
        content: string;
        sub_class?: string;
      } = { 
        student_id: studentId,
        class_id: classId,
        content: '' 
      };
      
      // Ajouter l'information de sous-classe si disponible
      if (selectedSubClass) {
        requestData.sub_class = selectedSubClass;
      }

      const response = await fetch(`/api/activities_autres/${activityId}/corrections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la création de la correction');
      }

      const data = await response.json();
      
      // Stocker l'ID de la correction dans sessionStorage pour le suivi
      addRecentCorrection(data.id);
      
      // Rediriger vers la page de la correction individuelle ou une vue filtrée
      router.push(`/corrections?activityId=${activityId}&highlight=${data.id}&selectedCorrectionIds=${data.id}`);
    } catch (err) {
      console.error('Erreur:', err);
      // Afficher le message d'erreur contextualisé
      setError(err instanceof Error ? err.message : 'Erreur lors de la création de la correction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmSubmit = () => {
    setShowConfirmation(false);
    submitCorrection();
  };

  const handleCancelSubmit = () => {
    setShowConfirmation(false);
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
        <div className="max-w-4xl w-full">
          <Paper 
            elevation={2} 
            sx={{ p: 4, borderRadius: 2 }}
            className="border-l-4 border-yellow-500"
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb:3 }}>
              <ErrorOutlineIcon color="warning" fontSize="large" />
              <Typography variant="h5" color="warning.main" className="font-bold">
                Activité non trouvée
              </Typography>
            </Box>
            <Alert severity="warning" sx={{ mb: 3 }}>
              L&apos;activité demandée n&apos;existe pas ou a été supprimée.
            </Alert>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<ArrowBackIcon />}
              component={Link}
              href="/"
            >
              Retour à l'accueil
            </Button>
          </Paper>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8 text-center">
          <Typography variant="h4" component="h1" sx={{ color: 'text.primary', fontWeight: 700 }}>
            Correction unique
          </Typography>
          <Typography variant="subtitle1" component="h5" sx={{ color: 'text.secondary' }}>
            {activity.name}
          </Typography>
        </div>
        
        <Paper 
          elevation={2} 
          className="rounded-lg overflow-hidden shadow-md"
        >
          {/* En-tête du formulaire */}
          <Box className="bg-purple-600 p-4 text-white flex justify-between items-center">
            <div className="flex items-center gap-2">
              <AssignmentIcon />
              <Typography variant="h6">
              Ajouter une correction
              </Typography>
            </div>
            <IconButton 
              component={Link}
              href="/"
              size="small"
              className="text-white"
              aria-label="retour à l'accueil"
            >
              <HomeIcon />
            </IconButton>
          </Box>
          
          <Box className="p-6">
            {error && (
              <Alert severity="error" className="mb-6" variant="outlined">
                {error}
              </Alert>
            )}
            
            {showConfirmation && (
              <Alert 
                severity="warning" 
                className="mb-6"
                action={
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                      color="error"
                      size="large"
                      onClick={handleCancelSubmit}
                      aria-label="annuler"
                    >
                      <CloseIcon fontSize="large" />
                    </IconButton>
                    <IconButton
                      color="success"
                      size="large"
                      onClick={handleConfirmSubmit}
                      aria-label="confirmer"
                    >
                      <CheckIcon fontSize="large" />
                    </IconButton>
                  </Box>
                }
              >
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Attention
                </Typography>
                {warningMessages.map((message, index) => (
                  <Typography key={index} variant="body2">
                    • {message}
                  </Typography>
                ))}
                <Typography variant="body2" className="mt-2 font-medium">
                  Voulez-vous continuer ?
                </Typography>
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
                  <Tab label={`Classes associées (${activityClasses.length})`} />
                  <Tab label={`Autres classes (${unassociatedClasses.length})`} />
                </Tabs>
              </Box>
              
              {/* Sélection de classe */}
              <div className="mb-6">
                <FormControl fullWidth disabled={classesLoading}>
                  <InputLabel id="class-select-label">
                    {classTabValue === 0 ? "Classe associée" : "Autre classe"}
                  </InputLabel>
                  <Select
                    labelId="class-select-label"
                    id="class-select"
                    value={classId || ''}
                    onChange={handleClassChange}
                    label={classTabValue === 0 ? "Classe associée" : "Autre classe"}
                    startAdornment={
                      classesLoading ? (
                        <CircularProgress size={20} className="mr-2" />
                      ) : (
                        <SchoolIcon className="mr-2 text-gray-400" />
                      )
                    }
                  >
                    <MenuItem value="">
                      <em>Aucune classe</em>
                    </MenuItem>
                    {getDisplayedClasses().map((cls) => (
                      <MenuItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>
                    {classesLoading 
                      ? "Chargement des classes..." 
                      : getDisplayedClasses().length === 0
                        ? classTabValue === 0
                          ? "Aucune classe n'est associée à cette activité"
                          : "Toutes les classes sont déjà associées à cette activité"
                        : classTabValue === 0
                          ? "Sélectionnez une classe associée à cette activité"
                          : "Sélectionnez une classe à associer à cette activité"
                    }
                  </FormHelperText>
                </FormControl>
              </div>
              
              {/* Nouveau sélecteur de sous-classe (affiché conditionnellement) */}
              {hasSubClasses && (
                <div className="mb-6">
                  <FormControl fullWidth disabled={subClassLoading}>
                    <InputLabel id="subclass-select-label">Sous-classe / Groupe</InputLabel>
                    <Select
                      labelId="subclass-select-label"
                      id="subclass-select"
                      value={selectedSubClass || ''}
                      onChange={handleSubClassChange}
                      label="Sous-classe / Groupe"
                      startAdornment={
                        subClassLoading ? (
                          <CircularProgress size={20} className="mr-2" />
                        ) : (
                          <GroupIcon className="mr-2 text-gray-400" />
                        )
                      }
                    >
                      <MenuItem value="">
                        <em>Tous les groupes</em>
                      </MenuItem>
                      {subClassOptions.map((subClass) => (
                        <MenuItem key={subClass} value={subClass}>
                          Groupe {subClass}
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>
                      {subClassLoading 
                        ? "Chargement des groupes..." 
                        : "Sélectionnez un groupe pour filtrer davantage les étudiants"}
                    </FormHelperText>
                  </FormControl>
                </div>
              )}
              
              <div className="mb-4">
                <TextField
                  fullWidth
                  label="Rechercher un étudiant"
                  placeholder="Rechercher par nom"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  variant="outlined"
                  size="small"
                  slotProps={{
                    input: { 
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                     }
                  }}
                />
                <FormHelperText>
                  {searchTerm.trim() !== '' 
                    ? `${filteredStudents.length} résultat(s) pour "${searchTerm}"`
                    : "Recherchez un étudiant par nom ou prénom"}
                </FormHelperText>
              </div>
              
              <div className="mb-6">
                <FormControl fullWidth>
                  <InputLabel id="student-select-label">Étudiant</InputLabel>
                  <Select
                    labelId="student-select-label"
                    id="student-select"
                    value={studentId || ''}
                    onChange={handleStudentChange}
                    label="Étudiant"
                    startAdornment={
                      studentsLoading ? (
                        <CircularProgress size={20} className="mr-2" />
                      ) : (
                        <PersonAddIcon className="mr-2 text-gray-400" />
                      )
                    }
                    disabled={studentsLoading}
                  >
                    <MenuItem value="">
                      <em>Aucun étudiant sélectionné</em>
                    </MenuItem>
                  
                    {filteredStudents.map((student) => {
                      // Obtenir tous les noms de classe pour cet étudiant à partir de allClasses
                      const studentClasses = student.allClasses 
                        ? student.allClasses.map(cls => cls.className)
                        : [];
                        
                      // Créer une liste unique des noms de classe
                      const uniqueClassNames = Array.from(new Set(studentClasses)).join(' | ');
                      
                      // Obtenir la sous-classe si elle existe
                      let subClassInfo = '';
                      if (classId && student.allClasses) {
                        const classAssignment = student.allClasses.find(cls => cls.classId === classId);
                        if (classAssignment && classAssignment.sub_class) {
                          subClassInfo = ` (Groupe ${classAssignment.sub_class})`;
                        }
                      }
                      
                      return (
                        <MenuItem key={student.id} value={student.id}>
                          {student.first_name} {student.last_name}
                          {uniqueClassNames && (
                            <span className="text-gray-500 ml-2">
                              {uniqueClassNames}{subClassInfo}
                            </span>
                          )}
                        </MenuItem>
                      );
                    })}
                  </Select>
                  <FormHelperText>
                    {studentsLoading 
                      ? "Chargement des étudiants..." 
                      : filteredStudents.length === 0
                        ? "Aucun étudiant ne correspond à vos critères"
                        : `${filteredStudents.length} étudiant(s) disponible(s)`}
                  </FormHelperText>
                </FormControl>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-100">
                <Typography component={'div'} variant="body2">
                  <strong>Information :</strong> après avoir ajouté la correction, vous pourrez ajouter le contenu détaillé, les notes et les dates de rendu.
                  {classTabValue === 1 && classId && (
                    <Box sx={{ mt: 1 }}>
                      <strong>Note :</strong> la classe sélectionnée sera automatiquement associée à cette activité.
                    </Box>
                  )}
                </Typography>
              </div>

              <div className="flex justify-center">
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  disabled={isSubmitting}
                  startIcon={isSubmitting ? <HourglassEmptyIcon className="animate-spin" /> : <SaveIcon />}
                >
                  {isSubmitting ? "Ajout en cours..." : "Ajouter la correction"}
                </Button>
              </div>
            </form>
          </Box>
        </Paper>
      </div>
    </div>
  );
}