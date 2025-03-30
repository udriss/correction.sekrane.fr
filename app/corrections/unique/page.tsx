'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Activity } from '@/lib/activity';
import { 
  Paper, 
  Typography, 
  Box, 
  Alert, 
  CircularProgress, 
  TextField,
  Button,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  ListItemIcon,
  ListItemText,
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
import InfoIcon from '@mui/icons-material/Info';
import {Student} from '@/lib/types'
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

export default function UniqueCorrection() {
  const router = useRouter();
  
  // État pour le menu déroulant des corrections
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(menuAnchorEl);
  
  const handleMenuClick = (event: React.MouseEvent<HTMLDivElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };
  
  const navigateTo = (path: string) => {
    handleMenuClose();
    router.push(path);
  };

  const [studentId, setStudentId] = useState<number | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [classId, setClassId] = useState<number | null>(null);
  const [activityClasses, setActivityClasses] = useState<any[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [originalStudents, setOriginalStudents] = useState<Student[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [warningMessages, setWarningMessages] = useState<string[]>([]);
  const [genericActivityId, setGenericActivityId] = useState<number | null>(null);

  useEffect(() => {
    // Chercher une activité générique existante
    const fetchGenericActivity = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/activities/generic');
        
        if (response.ok) {
          const activityData = await response.json();
          setActivity(activityData);
          setGenericActivityId(activityData.id);
        } else {
          throw new Error("Erreur lors du chargement de l'activité générique");
        }
      } catch (err) {
        console.error('Erreur:', err);
        setError("Erreur lors du chargement de l'activité générique");
      } finally {
        setLoading(false);
      }
    };
    
    fetchGenericActivity();
  }, []);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setStudentsLoading(true);
        
        // 1. Récupérer tous les étudiants avec leurs associations de classes
        const response = await fetch('/api/students');
        if (!response.ok) throw new Error('Erreur lors du chargement des étudiants');
        const data = await response.json();
        
        // Stocker les données originales pour pouvoir récupérer toutes les classes
        setOriginalStudents(data);
        
        // 2. Récupérer toutes les classes disponibles
        const allClassesResponse = await fetch('/api/classes');
        let classes: any[] = [];
        
        if (allClassesResponse.ok) {
          classes = await allClassesResponse.json();
          setActivityClasses(classes);
        }
        
        // 3. Initialiser un Map pour éliminer les doublons d'étudiants
        const uniqueStudents = new Map<number, any>();
        
        // 4. Traiter les données des étudiants pour éliminer les doublons
        data.forEach((student: any) => {
          if (!uniqueStudents.has(student.id)) {
            // Créer un objet Student conforme au type attendu
            const studentObj = {
              id: student.id,
              first_name: student.first_name,
              last_name: student.last_name,
              email: student.email,
            } as Student;
            
            // Ajouter des propriétés additionnelles
            (studentObj as any)._classId = student.classId;
            (studentObj as any).class_name = student.class_name || '';
            
            uniqueStudents.set(student.id, studentObj);
          }
        });
        
        // Convertir le Map en tableau et trier par nom
        const uniqueStudentsArray = Array.from(uniqueStudents.values())
          .sort((a, b) => `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`));
        
        setStudents(uniqueStudentsArray);
        setFilteredStudents(uniqueStudentsArray);
      } catch (err) {
        console.error('Erreur:', err);
        // Ne pas définir d'erreur pour ne pas bloquer l'interface
      } finally {
        setStudentsLoading(false);
      }
    };

    fetchStudents();
  }, []);

  // Ajouter un useEffect pour filtrer les étudiants lorsque classId change
  useEffect(() => {
    if (classId) {
      // Filtrer les étudiants par classe sélectionnée
      const filtered = originalStudents.filter(student => (student as any).classId === classId);
      setFilteredStudents(filtered);
    } else {
      // Si aucune classe n'est sélectionnée, montrer tous les étudiants disponibles
      setFilteredStudents(students);
    }
  }, [classId, students, originalStudents]);

  const handleStudentChange = (event: SelectChangeEvent<number>) => {
    setStudentId(event.target.value as number);
  };

  const handleClassChange = (event: SelectChangeEvent<number>) => {
    setClassId(event.target.value as number);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Vérifications préalables à la soumission
    let warnings = [];
    
    // Toujours ajouter un avertissement sur l'utilisation d'une activité générique
    warnings.push("Cette correction sera associée à une activité générique et ne sera pas liée à une activité spécifique.");
    
    if (activityClasses.length > 0 && !classId) {
      warnings.push("Aucune classe n'est sélectionnée. La correction sera ajoutée sans association à une classe.");
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
    if (!genericActivityId) {
      setError("Erreur: impossible de créer une correction sans activité générique");
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Ajouter un délai de 1 seconde avant l'envoi
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const response = await fetch(`/api/activities/${genericActivityId}/corrections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          student_id: studentId,
          class_id: classId,
          content: '' 
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la création de la correction');
      }

      const data = await response.json();
      router.push(`/corrections/${data.id}`);
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors de la création de la correction');
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <ErrorOutlineIcon color="warning" fontSize="large" />
              <Typography variant="h5" color="warning.main" className="font-bold">
                Activité générique non trouvée
              </Typography>
            </Box>
            <Alert severity="warning" sx={{ mb: 3 }}>
              L'activité générique nécessaire n'a pas pu être chargée.
            </Alert>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<ArrowBackIcon />}
              component={Link}
              href="/corrections/new"
            >
              Retour au choix du type de correction
            </Button>
          </Paper>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-4xl mx-auto px-4">
        {/* Le fil d'Ariane est maintenant géré par le layout */}
        
        <div className="mb-8 text-center">
          <Typography variant="h4" component="h1" className="font-bold text-blue-800 mb-2">
            Nouvelle correction unique
          </Typography>
          <Typography variant="subtitle1" className="text-gray-600">
            Création d'une correction individuelle
          </Typography>
        </div>
        
        <Alert severity="info" className="mb-6" variant="outlined" icon={<InfoIcon />}>
          <Typography variant="subtitle2" fontWeight="bold">
            Correction sans activité spécifique
          </Typography>
          <Typography variant="body2">
            Cette correction sera associée à l'activité générique et n'est pas liée à une activité particulière.
            Si vous souhaitez la lier à une activité, veuillez créer la correction depuis la page de l'activité concernée.
          </Typography>
        </Alert>
        
        <Paper 
          elevation={2} 
          className="rounded-lg overflow-hidden shadow-md"
        >
          {/* En-tête du formulaire */}
          <Box className="bg-purple-600 p-4 text-white flex justify-between items-center">
            <div className="flex items-center gap-2">
              <AssignmentIcon />
              <Typography variant="h6">
                Ajouter une correction unique
              </Typography>
            </div>
            <IconButton 
              component={Link}
              href="/corrections/new"
              size="small"
              className="text-white"
              aria-label="retour au choix"
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
              {/* Sélection de classe */}
              <div className="mb-6">
                <FormControl fullWidth>
                  <InputLabel id="class-select-label">Classe</InputLabel>
                  <Select
                    labelId="class-select-label"
                    id="class-select"
                    value={classId || ''}
                    onChange={handleClassChange}
                    label="Classe"
                    startAdornment={<SchoolIcon className="mr-2 text-gray-400" />}
                    disabled={studentsLoading}
                  >
                    <MenuItem value="">
                      <em>Toutes les classes</em>
                    </MenuItem>
                    {activityClasses.map((cls) => (
                      <MenuItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </MenuItem>
                    ))}
                  </Select>
                  <Typography variant="caption" className="text-gray-500 mt-1 block">
                    Sélectionnez une classe pour filtrer les étudiants
                  </Typography>
                </FormControl>
              </div>
              
              {/* Sélection d'étudiant */}
              <div className="mb-6">
                <FormControl fullWidth>
                  <InputLabel id="student-select-label">Étudiant</InputLabel>
                  <Select
                    labelId="student-select-label"
                    id="student-select"
                    value={studentId || ''}
                    onChange={handleStudentChange}
                    label="Étudiant"
                    startAdornment={<PersonAddIcon className="mr-2 text-gray-400" />}
                    disabled={studentsLoading}
                  >
                    <MenuItem value="">
                      <em>Aucun étudiant sélectionné</em>
                    </MenuItem>
                  
                    {filteredStudents.map((student) => {
                      // Trouver toutes les classes auxquelles cet étudiant appartient
                      const studentClasses: string[] = originalStudents
                        .filter(s => s.id === student.id)
                        .map(s => (s as any).className)
                        .filter((name): name is string => Boolean(name));
                        
                      // Créer une liste unique des noms de classe
                      const uniqueClassNames = Array.from(new Set(studentClasses)).join(' | ');
                      return (
                        <MenuItem key={student.id} value={student.id}>
                          {student.first_name} {student.last_name}
                          {uniqueClassNames && (
                            <span className="text-gray-500 ml-2">
                              {uniqueClassNames}
                            </span>
                          )}
                        </MenuItem>
                      );
                    })}
                  </Select>
                  <Typography variant="caption" className="text-gray-500 mt-1 block">
                    Sélectionnez un étudiant pour cette correction ou laissez vide
                  </Typography>
                </FormControl>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-100">
                <Typography variant="body2" >
                  <strong>Information :</strong> Après avoir ajouté la correction, vous pourrez ajouter le contenu détaillé, les notes et les dates de rendu.
                </Typography>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
                <Button
                  variant="text"
                  color="inherit"
                  startIcon={<ArrowBackIcon />}
                  component={Link}
                  href="/corrections/new"
                  className="text-gray-600 hover:text-purple-600"
                >
                  Retour au choix
                </Button>
                
                <IconButton
                  color="success"
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-purple-500 hover:bg-purple-600 text-white p-3"
                  aria-label="enregistrer la correction"
                  sx={{ borderRadius: '8px' }}
                >
                  {isSubmitting ? <HourglassEmptyIcon className="animate-spin" fontSize='large' /> : <SaveIcon fontSize='large'/>}
                </IconButton>
              </div>
            </form>
          </Box>
        </Paper>
      </div>
    </div>
  );
}
