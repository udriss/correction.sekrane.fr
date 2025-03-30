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
  SelectChangeEvent
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
import {Student} from '@/lib/types'
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

export default function NewCorrection({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap the Promise for params using React.use
  const { id } = React.use(params);
  const activityId = id;
  
  const [studentId, setStudentId] = useState<number | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const [classId, setClassId] = useState<number | null>(null);
  const [activityClasses, setActivityClasses] = useState<any[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [originalStudents, setOriginalStudents] = useState<Student[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [warningMessages, setWarningMessages] = useState<string[]>([]);

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
    
    const fetchStudents = async () => {
      try {
        setStudentsLoading(true);
        
        // 1. Récupérer tous les étudiants avec leurs associations de classes
        const response = await fetch('/api/students');
        if (!response.ok) throw new Error('Erreur lors du chargement des étudiants');
        const data = await response.json();
        
        // Stocker les données originales pour pouvoir récupérer toutes les classes
        setOriginalStudents(data);
        
        // 2. Récupérer les classes associées à cette activité
        const classesResponse = await fetch(`/api/activities/${activityId}/classes`);
        let classes: any[] = [];
        
        if (classesResponse.ok) {
          classes = await classesResponse.json();
          setActivityClasses(classes);
        }
        
        // 3. Initialiser un Map pour éliminer les doublons d'étudiants
        const uniqueStudents = new Map<number, any>();
        
        // 4. Traiter les données des étudiants
        if (classes.length > 0) {
          // Si l'activité est associée à des classes, on ne garde que les étudiants de ces classes
          const classIds = classes.map(cls => cls.id);
          
          // Créer une map des classes pour un accès rapide au nom de la classe
          const classMap = new Map<number, string>();
          classes.forEach(cls => {
            classMap.set(cls.id, cls.name);
          });
          
          data.forEach((student: any) => {
            // Ne conserver que les étudiants associés à l'une des classes de l'activité
            if (student.classId && classIds.includes(student.classId)) {
              // Stocker dans le Map en utilisant l'ID de l'étudiant comme clé
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
                // Utiliser le nom de la classe de notre map classMap si disponible, sinon utiliser celui du student
                (studentObj as any).class_name = classMap.get(student.classId) || student.class_name || '';
                
                uniqueStudents.set(student.id, studentObj);
              }
            }
          });
          
          // S'il y a exactement une classe, la sélectionner par défaut
          if (classes.length === 1) {
            setClassId(classes[0].id);
          }
        } else {
          // Si aucune classe n'est associée, on garde tous les étudiants sans doublon
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
              // S'assurer qu'on a bien le nom de la classe
              (studentObj as any).class_name = student.class_name || '';
              
              uniqueStudents.set(student.id, studentObj);
            }
          });
        }
        
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

    fetchActivity();
    fetchStudents();
  }, [activityId]);

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
    setIsSubmitting(true);
    setError('');

    try {
      // Ajouter un délai de 1 seconde avant l'envoi
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Submitting correction with data:',
        studentId,
        classId)
        
      const response = await fetch(`/api/activities/${activityId}/corrections`, {
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
                Activité non trouvée
              </Typography>
            </Box>
            <Alert severity="warning" sx={{ mb: 3 }}>
              L'activité demandée n'existe pas ou a été supprimée.
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
          <Typography variant="h4" component="h1" className="font-bold text-blue-800 mb-2">
            Nouvelle correction
          </Typography>
          <Typography variant="subtitle1" className="text-gray-600">
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
              {/* Ajout du select pour choisir la classe si plusieurs classes sont disponibles */}
              {activityClasses.length > 1 && (
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
              )}
              
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
                        .filter((name): name is string => Boolean(name)); // Type guard to ensure non-null values
                        
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
                  href={`/activities/${activityId}`}
                  className="text-gray-600 hover:text-purple-600"
                >
                  Retour à l'activité
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
