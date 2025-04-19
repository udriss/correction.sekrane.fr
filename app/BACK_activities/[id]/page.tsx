'use client';
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Activity } from '@/lib/activity';
import { CorrectionWithShareCode } from '@/lib/types';
import { Correction } from '@/app/components/CorrectionsDataProvider';
import LoadingSpinner from '@/components/LoadingSpinner';
import { 
  Button, 
  IconButton, 
  Paper, 
  Typography, 
  TextField, 
  CircularProgress, 
  Container, 
  Tabs, 
  Tab,
  SelectChangeEvent, 
  FormControlLabel, 
  Box, 
  Switch,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import { useSnackbar } from 'notistack';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import QrCodeIcon from '@mui/icons-material/QrCode';
import ActivityStatsGraphs from '@/components/ActivityStatsGraphs';
// Import components
import FragmentsList from '@/components/FragmentsList';
import CorrectionsList from '@/components/CorrectionsList';
import ActivityDetails from '@/components/ActivityDetails';
import GradientBackground from '@/components/ui/GradientBackground';
import ErrorDisplay from '@/components/ui/ErrorDisplay';
// Import the Fragment type from FragmentEditModal
import { Fragment } from '@/lib/types';
// Import QR Code Generator utility
import { generateQRCodePDF } from '@/utils/BACK_qrGeneratorPDF';
import FirstPageIcon from '@mui/icons-material/FirstPage';
import KeyboardArrowLeft from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';
import LastPageIcon from '@mui/icons-material/LastPage';
import { useTheme } from '@mui/material/styles';


import { Correction as ProviderCorrection } from '@/app/components/CorrectionsDataProvider';
import { Student as LibStudent } from '@/lib/types';

// Type guard pour vérifier si une correction a un shareCode
function hasShareCode(correction: Correction | CorrectionWithShareCode): correction is CorrectionWithShareCode & Correction {
  return 'shareCode' in correction && correction.shareCode !== null && correction.shareCode !== undefined;
}




// Interface for Class data
interface Class {
  id: number;
  name: string;
  nbre_subclasses?: number;
  subGroups?: string[];
}

// Interface for Student data
interface Student {
  id: number;
  first_name: string;
  last_name: string;
  gender?: string;
  email?: string;
  name?: string;
  sub_class?: string; // Propriété pour stocker le sous-groupe de l'étudiant
  group?: string; // Maintenir la rétrocompatibilité
}

// Modifié pour utiliser le type PageProps de Next.js pour App Router
export default function ActivityDetail({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap the params Promise using React.use()
  const unwrappedParams = React.use(params);
  const { id } = unwrappedParams;
  const activityId = id;
  
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [activity, setActivity] = useState<Activity | null>(null);
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Add state for fragments
  const [fragments, setFragments] = useState<Fragment[]>([]);
  const [loadingFragments, setLoadingFragments] = useState(false);

  const { enqueueSnackbar } = useSnackbar();
  
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [experimentalPoints, setExperimentalPoints] = useState(5);
  const [theoreticalPoints, setTheoreticalPoints] = useState(15);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [totalPoints, setTotalPoints] = useState(20); // Nouveau state pour le total des points
  
  // Remplacer l'état pour suivre la correction à supprimer
  const [correctionToDelete, setCorrectionToDelete] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  
  // Récupérer le tab initial depuis l'URL ou utiliser 0 par défaut
  const initialTabValue = useMemo(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam !== null) {
      const tabIndex = parseInt(tabParam, 10);
      // Vérifier que le tab est valide (entre 0 et 4)
      if (!isNaN(tabIndex) && tabIndex >= 0 && tabIndex <= 4) {
        return tabIndex;
      }
    }
    return 0;
  }, [searchParams]);
  
  const [tabValue, setTabValue] = useState(initialTabValue);
  
  // PDF Export states
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [selectedSubGroup, setSelectedSubGroup] = useState<string>('');
  const [subGroups, setSubGroups] = useState<string[]>([]);
  const [filteredCorrections, setFilteredCorrections] = useState<Correction[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [includeUncorrected, setIncludeUncorrected] = useState(false);
  // Add state for class students
  const [classStudents, setClassStudents] = useState<Student[]>([]);
  

  

  useEffect(() => {
    const fetchActivityAndCorrections = async () => {
      try {
        // Fetch activity details
        const activityResponse = await fetch(`/api/activities/${activityId}`);
        if (!activityResponse.ok) {
          throw new Error('Erreur lors du chargement de l\'activité');
        } 
        const activityData = await activityResponse.json();
        setActivity(activityData);
        setName(activityData.name);
        setContent(activityData.content || '');
        // Set the grading scale values from the activity data or use defaults
        setExperimentalPoints(activityData.experimental_points !== undefined ? activityData.experimental_points : 5);
        setTheoreticalPoints(activityData.theoretical_points !== undefined ? activityData.theoretical_points : 15);
        
        // Calculer le total des points
        const total = (activityData.experimental_points || 5) + (activityData.theoretical_points || 15);
        setTotalPoints(total);
        
        // Fetch corrections for this activity
        const correctionsResponse = await fetch(`/api/activities/${activityId}/corrections`);
        if (!correctionsResponse.ok) {
          throw new Error('Erreur lors du chargement des corrections');
        }
        const correctionsData = await correctionsResponse.json();
        setCorrections(correctionsData);
        setFilteredCorrections(correctionsData);
        
        // Fetch classes for the filter
        try {
          const classesResponse = await fetch(`/api/activities/${activityId}/classes`);
          if (classesResponse.ok) {
            const classesData = await classesResponse.json();
            
            setClasses(classesData);
          }
        } catch (err) {
          console.error('Erreur lors du chargement des classes:', err);
        }
        
        // Fetch students data
        try {
          const studentsResponse = await fetch('/api/students');
          if (studentsResponse.ok) {
            const studentsData = await studentsResponse.json();
            setStudents(studentsData);
          }
        } catch (err) {
          console.error('Erreur lors du chargement des étudiants:', err);
        }
      } catch (err) {
        console.error('Erreur:', err);
        setError('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };
    
    fetchActivityAndCorrections();
  }, [activityId]);
  
  // Add useEffect to load fragments when needed (when tab changes to fragments tab)
  useEffect(() => {
    const fetchFragments = async () => {
      if (tabValue === 1 && activityId) {
        setLoadingFragments(true);
        try {
          const response = await fetch(`/api/activities/${activityId}/fragments`);
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Erreur (${response.status}): ${errorData.message || response.statusText}`);
          }
          const data = await response.json();
          setFragments(data);
        } catch (err) {
          console.error('Erreur:', err);
          enqueueSnackbar(`Erreur lors du chargement des fragments: ${(err as Error).message}`, { 
            variant: 'error' 
          });
        } finally {
          setLoadingFragments(false);
        }
      }
    };
    
    fetchFragments();
  }, [activityId, tabValue, enqueueSnackbar]);
  
  // Update subgroups when class is selected
  useEffect(() => {
    if (selectedClass && selectedClass !== null) {
      const selectedClassObj = classes.find(c => c.id === selectedClass);
      
      
      if (selectedClassObj) {
        // Si la classe a déjà des sous-groupes prédéfinis, les utiliser
        if (selectedClassObj.subGroups && selectedClassObj.subGroups.length > 0) {
          setSubGroups(selectedClassObj.subGroups);
        } 
        // Sinon, initialiser subGroups à un tableau vide car nous utiliserons directement nbre_subclasses
        else {
          setSubGroups([]);
        }
      }
      
      // Reset subgroup selection when class changes
      setSelectedSubGroup('');
    }
  }, [selectedClass, classes]);
  
  // Filter corrections when filters change
  useEffect(() => {
    if (!corrections.length) return;
    
    let filtered = [...corrections] as (Correction)[];
    
    if (selectedClass) {
      // Filtrer par classe en utilisant les données de class_students
      const studentIdsInClass = classStudents.map(student => student.id);
      
      filtered = filtered.filter(correction => 
        // Vérifier si l'étudiant associé à cette correction est dans la classe sélectionnée
        correction.student_id !== null && studentIdsInClass.includes(correction.student_id)
      );
      
      // Filtrer davantage par sous-groupe si sélectionné
      if (selectedSubGroup && selectedSubGroup !== '') {
        const groupNumber = parseInt(selectedSubGroup);
        
        
        filtered = filtered.filter(correction => {
          // Trouver l'étudiant associé à cette correction dans les étudiants de la classe
          const student = classStudents.find(s => s.id === correction.student_id);
          // Vérifier si l'étudiant appartient au sous-groupe sélectionné
          // student.sub_class est déjà un nombre dans la base de données, donc on compare avec groupNumber converti en nombre
          return student && parseInt(student.sub_class as string) === groupNumber;
        });
      }
    }
    
    // Ajouter class_name à chaque correction basé sur le class_id seulement si non défini
    filtered = filtered.map(correction => {
      // Si class_name est déjà défini, le conserver
      if (correction.class_name) {
        return correction;
      }
      
      // Sinon, rechercher la classe correspondante pour obtenir le nom
      const classObj = correction.class_id ? classes.find(c => c.id === correction.class_id) : null;
      // Retourner la correction avec class_name ajouté (avec valeur par défaut pour éviter undefined)
      return {
        ...correction,
        class_name: classObj ? classObj.name : "Classe inconnue"
      };
    });
    
    setFilteredCorrections(filtered as Correction[]);
  }, [selectedClass, selectedSubGroup, corrections, classStudents, classes]);

  // Load students data for a specific class when selectedClass changes
  useEffect(() => {
    const fetchClassStudents = async () => {
      if (selectedClass) {
        try {
          // Récupérer les étudiants de la classe sélectionnée, y compris leur sous-groupe (sub_class)
          const response = await fetch(`/api/classes/${selectedClass}/students`);
          if (response.ok) {
            const data = await response.json();
            setClassStudents(data);
          } else {
            console.error('Erreur lors du chargement des étudiants de la classe:', response.statusText);
          }
        } catch (err) {
          console.error('Erreur lors du chargement des étudiants de la classe:', err);
        }
      } else {
        // Réinitialiser les étudiants de classe si aucune classe n'est sélectionnée
        setClassStudents([]);
      }
    };

    fetchClassStudents();
  }, [selectedClass]);
  
  // Extract unique subclasses from class students
  const uniqueSubClasses = useMemo(() => {
    if (!classStudents.length) return [];
    
    // Extract all sub_class values from class students
    const subClasses = classStudents
      .filter(student => student.sub_class !== undefined && student.sub_class !== null)
      .map(student => student.sub_class?.toString());
    
    // Remove duplicates with Array.from + Set instead of spread operator
    return Array.from(new Set(subClasses)).sort((a, b) => Number(a) - Number(b));
  }, [classStudents]);

  const handleEditClick = () => {
    setIsEditing(true);
  };
  

  
  const handleCancelClick = () => {
    setIsEditing(false);
    setName(activity?.name || '');
    setContent(activity?.content || '');
    setExperimentalPoints(activity?.experimental_points !== undefined ? activity.experimental_points : 5);
    setTheoreticalPoints(activity?.theoretical_points !== undefined ? activity.theoretical_points : 15);
  };
  
  // Fonction pour réinitialiser les erreurs
  const clearError = () => {
    setError('');
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Le nom de l\'activité est requis');
      enqueueSnackbar('Le nom de l\'activité est requis', { variant: 'error' });
      return;
    }
    
    // Validation de barème flexible - vérifie seulement que le total est positif
    const currentTotal = Number(experimentalPoints) + Number(theoreticalPoints);
    if (currentTotal <= 0) {
      setError('Le total des points doit être supérieur à 0');
      enqueueSnackbar('Le total des points doit être supérieur à 0', { variant: 'error' });
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    try {
      const response = await fetch(`/api/activities/${activityId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          activityId: activityId,
          name, 
          content, 
          experimental_points: experimentalPoints,
          theoretical_points: theoreticalPoints,
          total_points: currentTotal // Ajouter le total des points
        }),
      });
      
      if (!response.ok) {
        // Extraire l'objet d'erreur JSON
        const errorData = await response.json();
        // Vous pouvez maintenant accéder à errorData.error
        console.error('Erreur:', errorData.error);
        // Gérer l'erreur (par ex. avec un state React)
        // setError(`Erreur lors de la mise à jour de l'activité : ${errorData.error}`);
        enqueueSnackbar(`Erreur lors de la mise à jour de l'activité :  ${errorData.error as Error}`,
          { variant: 'error' }
        );
        return;
      }

      
      
      const updatedActivity = await response.json();
      setActivity(updatedActivity);
      setIsEditing(false);
      enqueueSnackbar('Activité mise à jour avec succès', { variant: 'success' });
    } catch (error) {
      console.error('Erreur:', error);
      // setError(`Erreur lors de la mise à jour de l'activité : ${(error as Error).message}`);
      enqueueSnackbar(`Erreur lors de la mise à jour de l'activité: ${(error as Error).message}`,
      { variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteClick = () => {
    setConfirmingDelete(true);
  };
  
  const handleCancelDelete = () => {
    setConfirmingDelete(false);
  };
  
  const handleConfirmDelete = async () => {
    try {
      const response = await fetch(`/api/activities/${activityId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Erreur (${response.status}): ${errorData.message || response.statusText}`);
      }
      
      enqueueSnackbar('Activité supprimée avec succès', { variant: 'success' });
      router.push('/');
    } catch (err) {
      console.error('Erreur:', err);
      setError(`Erreur lors de la suppression de l'activité: ${(err as Error).message}`);
      enqueueSnackbar(`Erreur lors de la suppression de l'activité: ${(err as Error).message}`, { 
        variant: 'error' 
      });
      setConfirmingDelete(false);
    }
  };
  
  const handleNewCorrectionClick = () => {
    router.push(`/activities/${activityId}/corrections/new`);
  };
  
  const handleFragmentsClick = () => {
    router.push(`/activities/${activityId}/fragments`);
  };
  
  const handlePointsChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    setter: React.Dispatch<React.SetStateAction<number>>,
    otherValue: number,
    isExperimental: boolean
  ) => {
    const value = Number(e.target.value);
    setter(value);
    
    // Mise à jour du total au lieu d'ajuster automatiquement l'autre valeur
    setTotalPoints(value + otherValue);
  };

  // Fonction pour initier la suppression
  const handleDeleteCorrection = (correctionId: number) => {
    setCorrectionToDelete(correctionId);
  };
  
  // Fonction pour confirmer et exécuter la suppression
  const confirmDeleteCorrection = async (correctionId: number) => {
    try {
      setIsProcessing(true);
      const response = await fetch(`/api/corrections/${correctionId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Erreur (${response.status}): ${errorData.message || response.statusText}`);
      }
      
      // Mise à jour de l'état local pour retirer la correction supprimée
      setCorrections(corrections.filter(c => c.id !== correctionId));
      
      // Notification de succès
      enqueueSnackbar('Correction supprimée avec succès', { 
        variant: 'success' 
      });
    } catch (error) {
      console.error('Erreur:', error);
      enqueueSnackbar(`Erreur lors de la suppression de la correction: ${(error as Error).message}`, { 
        variant: 'error' 
      });
    } finally {
      setCorrectionToDelete(null);
      setIsProcessing(false);
    }
  };
  
  // Fonction pour annuler la suppression
  const cancelDelete = () => {
    setCorrectionToDelete(null);
  };

  // Modifier la fonction handleTabChange pour mettre à jour l'URL
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    
    // Mettre à jour l'URL avec le nouveau tab
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', newValue.toString());
    
    // Utiliser router.replace pour éviter d'ajouter une entrée dans l'historique
    router.replace(`/activities/${activityId}?${params.toString()}`, { scroll: false });
  };

  // Ajouter les états manquants pour la gestion des fragments
  const [fragmentsError, setFragmentsError] = useState<string>('');
  const [favoriteFragments, setFavoriteFragments] = useState<Fragment[]>([]);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState<boolean>(false);

  // Ajouter la fonction fetchFragmentsForActivity qui était manquante
  const fetchFragmentsForActivity = async (activityId: string | number) => {
    if (!activityId) return;
    
    setLoadingFragments(true);
    try {
      const response = await fetch(`/api/activities/${activityId}/fragments`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Erreur (${response.status}): ${errorData.message || response.statusText}`);
      }
      const data = await response.json();
      setFragments(data);
    } catch (err) {
      console.error('Erreur lors du chargement des fragments:', err);
      setFragmentsError((err as Error).message);
      enqueueSnackbar(`Erreur lors du chargement des fragments: ${(err as Error).message}`, { 
        variant: 'error' 
      });
    } finally {
      setLoadingFragments(false);
    }
  };

  // Fonction pour rediriger vers la page de création de correction
  const handleNewCorrection = () => {
    router.push(`/activities/${activityId}/corrections/new`);
  };



  if (loading) {
    return (
      <div className="container max-w-[400px] mx-auto px-4 py-8 flex justify-center">
        <LoadingSpinner size="lg" text="Chargement de l'activité" />
      </div>
    );
  }
  
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <div className="w-full max-w-lg animate-slide-in">
          <Paper className="p-6 overflow-hidden relative" elevation={3}>
            {/* Utilisation du composant ErrorDisplay */}
            <ErrorDisplay 
              error={error} 
              onRefresh={clearError}
              withRefreshButton={true}
            />
          </Paper>
        </div>
      </div>
    );
  }
  
  if (!activity) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4">
          Activité non trouvée
        </div>
      </div>
    );
  }
  
  return (
    <Container maxWidth="md" className="py-8">
      <Paper elevation={2} className="p-6">
      <GradientBackground 
          variant="primary" 
          
          sx={{
            mt: 4,
            borderRadius: 2,
            py: 3,
            px: 3
          }}
        >
          {isEditing ? (
            <div className="flex items-center w-full">
            <IconButton
              color='primary'
              component={Link}
              href={`/activities`}
              className="mr-2 bg-white/20 hover:bg-white/30"
              sx={{ transform: 'translateX(-10px)' }}
            >
              <ArrowBackIcon sx={{ fontSize: 30, padding: 0, color: "primary" }} />
            </IconButton>
              <TextField
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-grow mr-2"
                variant="outlined"
                size="small"
                label="Nom de l'activité"
                placeholder="Entrez le nom de l'activité"
                error={!name.trim()}
                helperText={!name.trim() ? "Le nom est requis" : ""}
                autoFocus
              />
              <div className="flex space-x-2">
                <IconButton
                  onClick={handleSubmit}
                  disabled={isSubmitting || !name.trim()}
                  title="Sauvegarder les modifications"
                  size="medium"
                  color="success"
                >
                  {isSubmitting ? <CircularProgress size={24} /> : <SaveIcon />}
                </IconButton>
                <IconButton
                  onClick={handleCancelClick}
                  color="error"
                  title="Annuler les modifications"
                  size="medium"
                >
                  <CloseIcon />
                </IconButton>
              </div>
            </div>
          ) : (
            <div className="flex items-center w-full">
            <IconButton
            color='primary'
            component={Link}
            href={`/activities`}
            className="mr-2 bg-white/20 hover:bg-white/30"
            sx={{ transform: 'translateX(-10px)' }}
          >
            <ArrowBackIcon sx={{ fontSize: 30, padding: 0, color: "primary" }} />
          </IconButton>
            <Typography variant="h5" fontWeight={700} color="text.primary" className="font-bold" sx={{ transform: 'translateX(-10px)' }}>
              {activity.name}
              <IconButton
                onClick={handleEditClick}
                size="small"
                color="primary"
                aria-label="edit"
              >
                <EditIcon className="ml-2" sx={{color: "secondary.light" }} />
              </IconButton>
              {confirmingDelete ? (
                      <>
                        <IconButton
                          onClick={handleCancelDelete}
                          color="inherit"
                          size="medium"
                          title="Annuler la suppression"
                        >
                          <CloseIcon />
                        </IconButton>
                        <IconButton
                          onClick={handleConfirmDelete}
                          color="success"
                          size="medium"
                          title="Confirmer la suppression"
                        >
                          <CheckIcon />
                        </IconButton>
                      </>
                    ) : (
                      <IconButton
                        onClick={handleDeleteClick}
                        color="error"
                        size="medium"
                        title="Supprimer cette activité"
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
            </Typography>
            </div>
          )}
        </GradientBackground>
        <Box sx={{ mt: 4 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Détails" />
            <Tab label="Fragments" />
            <Tab label="Corrections" />
            <Tab label="Statistiques" />
            <Tab label="Export PDF" icon={<QrCodeIcon />} iconPosition="start" />
          </Tabs>
        </Box>
        
        {/* Tab Content */}
        <Box sx={{ mt: 3 }}>
          {/* Premier onglet: détails de l'activité */}
          {tabValue === 0 && (
            <Box>
              <ActivityDetails 
                activity={activity}
                isEditing={isEditing}
                content={content}
                experimentalPoints={experimentalPoints}
                theoreticalPoints={theoreticalPoints}
                onEditClick={handleEditClick}
                onContentChange={(e) => setContent(e.target.value)}
                handlePointsChange={handlePointsChange}
                setExperimentalPoints={setExperimentalPoints}
                setTheoreticalPoints={setTheoreticalPoints}
              />
            </Box>
          )}
          
          {/* Deuxième onglet: fragments */}
          {tabValue === 1 && (
            <Box>
              <Typography variant="body2" color="textSecondary">
              Les fragments sont des morceaux de texte réutilisables pour vos corrections.
              </Typography>
              {loadingFragments ? (
                <div className="py-10 flex justify-center max-w-[400px] mx-auto">
                  <LoadingSpinner size="md" text="Chargement des fragments" />
                </div>
              ) : (
                <FragmentsList
                  fragments={fragments}
                  onUpdate={fetchFragmentsForActivity}
                  activityId={parseInt(activityId)}
                  error={fragmentsError}
                  showTitle={true}
                  showIcon={true}
                  showEmpty={true}
                />
              )}
            </Box>
          )}
          
          {/* Troisième onglet: corrections */}
          {tabValue === 2 && (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <FormControlLabel 
                  control={
                    <Switch 
                      checked={includeUncorrected} 
                      onChange={(e) => setIncludeUncorrected(e.target.checked)}
                      color="primary"
                    />
                  } 
                  label="Inclure les devoirs sans correction" 
                  labelPlacement="start"
                />
              </Box>
              <CorrectionsList
                corrections={corrections}
                activity={activity}
                activityId={activityId}
                isEditing={false}
                isProcessing={isProcessing}
                correctionToDelete={correctionToDelete}
                onNewCorrection={handleNewCorrection}
                onDeleteCorrection={setCorrectionToDelete}
                onConfirmDelete={handleConfirmDelete}
                onCancelDelete={() => setCorrectionToDelete(null)}
                getStudentFullName={(studentId) => {
                  const student = students.find(s => s.id === studentId);
                  return student ? `${student.first_name} ${student.last_name}` : "Sans nom";
                }}
              />
            </>
          )}
          
          {tabValue === 3 && (
            <Box>
              <ActivityStatsGraphs activityId={parseInt(id)} />
            </Box>
          )}
          
          {tabValue === 4 && (
            <Box sx={{ py: 2 }}>

            </Box>
          )}
        </Box>
      </Paper>
    </Container>
  );
}

