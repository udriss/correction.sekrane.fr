'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ActivityAutre, CorrectionAutre, CorrectionAutreEnriched, Student } from '@/lib/types';
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
  Box, 
  FormHelperText, 
  Chip,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  InputAdornment,
  Divider
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';

import { useSnackbar } from 'notistack';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import QrCodeIcon from '@mui/icons-material/QrCode';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import AddIcon from '@mui/icons-material/Add';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import GradientBackground from '@/components/ui/GradientBackground';
import ErrorDisplay from '@/components/ui/ErrorDisplay';
import ActivityStatsGraphs from '@/components/ActivityStatsGraphs';
import ExportPDFComponentAllCorrectionsAutresContainer from '@/components/pdfAutre/ExportPDFComponentAllCorrectionsAutresContainer';
// Import FragmentsList et le type Fragment
import FragmentsList from '@/components/FragmentsList';
import { Fragment } from '@/lib/types';
// Import du composant modal déplacé
import UpdateCorrectionsModal from '@/components/corrections/UpdateCorrectionsModal';



export default function ActivityAutreDetail({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap the params Promise using React.use()
  const unwrappedParams = React.use(params);
  const { id } = unwrappedParams;
  const activityId = id;
  const searchParams = useSearchParams();
  const router = useRouter();

  const [activity, setActivity] = useState<ActivityAutre | null>(null);
  const [corrections, setCorrections] = useState<CorrectionAutreEnriched[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | string | null>(null);
  const [errorDetails, setErrorDetails] = useState<any | null>(null);
  
  // États pour la gestion des fragments
  const [fragments, setFragments] = useState<Fragment[]>([]);
  const [loadingFragments, setLoadingFragments] = useState(false);
  const [fragmentsError, setFragmentsError] = useState('');
  
  const { enqueueSnackbar } = useSnackbar();
  
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [parts, setParts] = useState<{ name: string; points: number }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  // États pour la gestion de la mise à jour des corrections
  const [updateCorrectionsModalOpen, setUpdateCorrectionsModalOpen] = useState(false);
  const [correctionsToUpdate, setCorrectionsToUpdate] = useState<CorrectionAutreEnriched[]>([]);
  const [selectedCorrectionIds, setSelectedCorrectionIds] = useState<number[]>([]);
  const [partsChanges, setPartsChanges] = useState<{
    added: { name: string; points: number }[];
    removed: { index: number; name: string; points: number }[];
  }>({ added: [], removed: [] });
  const [isUpdatingCorrections, setIsUpdatingCorrections] = useState(false);
  const [updateCorrectionsSuccess, setUpdateCorrectionsSuccess] = useState(false);
  const [updateCorrectionsError, setUpdateCorrectionsError] = useState<string | null>(null);
  
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredCorrections, setFilteredCorrections] = useState<CorrectionAutre[]>([]);
  
  // States for correction filters  
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedClassIds, setSelectedClassIds] = useState<number[]>([]);
  const [selectedSubClassIds, setSelectedSubClassIds] = useState<string[]>([]);
  const [allClasses, setAllClasses] = useState<{ id: number; name: string; nbre_subclasses?: number }[]>([]);

  /**
   * Calcule le pourcentage de réussite normalisé en utilisant percentage_grade ou un fallback
   * @param correction - La correction à évaluer
   * @param activity - L'activité associée
   * @returns Le pourcentage de réussite (0-100)
   * 
   * Cette fonction priorise l'utilisation du champ percentage_grade qui est calculé automatiquement
   * par le système en tenant compte des parties désactivées. Si ce champ n'est pas disponible,
   * elle effectue un calcul de fallback basé sur final_grade et les parties actives.
   */
  const getPercentageGrade = (correction: CorrectionAutreEnriched, activity: ActivityAutre): number => {
    // Vérifications de sécurité
    if (!correction || !activity) return 0;
    
    // Priorité à percentage_grade si disponible
    if (correction.percentage_grade !== null && correction.percentage_grade !== undefined) {
      const percentage = Number(correction.percentage_grade);
      return isNaN(percentage) || !isFinite(percentage) ? 0 : Math.max(0, Math.min(100, percentage));
    }
    
    // Fallback: calcul manuel basé sur final_grade et parties actives
    if (correction.final_grade && activity.points) {
      // Calculer le total des points actifs
      let totalActivePoints = 0;
      activity.points.forEach((points, idx) => {
        if (!correction.disabled_parts || !correction.disabled_parts[idx]) {
          totalActivePoints += points || 0;
        }
      });
      
      if (totalActivePoints > 0) {
        const finalGrade = parseFloat(String(correction.final_grade));
        if (!isNaN(finalGrade) && isFinite(finalGrade)) {
          const percentage = (finalGrade / totalActivePoints) * 100;
          return Math.max(0, Math.min(100, Math.round(percentage * 100) / 100));
        }
      }
    }
    
    return 0;
  };

  /**
   * Calcule la note normalisée sur 20 en utilisant le système percentage_grade
   * @param correction - La correction à évaluer
   * @param activity - L'activité associée
   * @returns La note sur 20
   * 
   * Cette fonction convertit le pourcentage de réussite en note sur 20, 
   * permettant une normalisation cohérente peu importe le barème original de l'activité.
   */
  const getNormalizedGradeOn20 = (correction: CorrectionAutreEnriched, activity: ActivityAutre): number => {
    const percentageGrade = getPercentageGrade(correction, activity);
    const normalizedGrade = (percentageGrade / 100) * 20;
    return isNaN(normalizedGrade) || !isFinite(normalizedGrade) ? 0 : normalizedGrade;
  };

  // Calculated values for subclasses - only show when classes are selected
  const availableSubClasses = useMemo(() => {
    if (!students.length || selectedClassIds.length === 0) return [];
    
    // Get students from selected classes only
    const studentsFromSelectedClasses = students.filter(student => 
      student.allClasses && 
      student.allClasses.some(cls => selectedClassIds.includes(cls.classId))
    );
    
    // Build subclass list with unique entries for each class/subclass combination
    const subClassEntries: { subClass: string; classId: number; className: string; uniqueKey: string }[] = [];
    
    studentsFromSelectedClasses.forEach(student => {
      if (student.sub_class !== undefined && student.sub_class !== null && student.allClasses) {
        const subClassStr = student.sub_class.toString();
        
        // For each class this student belongs to (that is also selected)
        student.allClasses
          .filter(cls => selectedClassIds.includes(cls.classId))
          .forEach(cls => {
            const className = allClasses.find(c => c.id === cls.classId)?.name;
            if (className) {
              const uniqueKey = `${cls.classId}-${subClassStr}`;
              
              // Check if this combination already exists
              const existingEntry = subClassEntries.find(entry => entry.uniqueKey === uniqueKey);
              if (!existingEntry) {
                subClassEntries.push({
                  subClass: subClassStr,
                  classId: cls.classId,
                  className: className,
                  uniqueKey: uniqueKey
                });
              }
            }
          });
      }
    });
    
    // Sort by class name first, then by subclass number
    return subClassEntries.sort((a, b) => {
      // First sort by class name
      const classComparison = a.className.localeCompare(b.className);
      if (classComparison !== 0) return classComparison;
      
      // Then sort by subclass number
      return Number(a.subClass) - Number(b.subClass);
    });
  }, [students, selectedClassIds, allClasses]);

  // Reset selected subclasses when classes change
  useEffect(() => {
    setSelectedSubClassIds([]);
  }, [selectedClassIds]);

  // Ajout d'un useMemo pour enrichir les corrections avec sub_class
  const adaptedCorrections = useMemo(() => {
    if (!corrections.length || !students.length) return [];
    
    return corrections.map(correction => {
      const student = students.find(s => s.id === correction.student_id);
      return {
        ...correction,
        sub_class: student?.sub_class
      };
    });
  }, [corrections, students]);
  
  // Mettre à jour filteredCorrections quand adaptedCorrections change
  useEffect(() => {
    if (adaptedCorrections.length > 0) {
      setFilteredCorrections(adaptedCorrections);
    }
  }, [adaptedCorrections]);

  // Récupérer le tab initial depuis l'URL ou utiliser 0 par défaut
  const initialTabValue = useMemo(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam !== null) {
      const tabIndex = parseInt(tabParam, 10);
      if (!isNaN(tabIndex) && tabIndex >= 0 && tabIndex <= 4) {
        return tabIndex;
      }
    }
    return 0;
  }, [searchParams]);
  
  const [tabValue, setTabValue] = useState(initialTabValue);
  
  // Calculer le total des points
  const totalPoints = parts.reduce((sum, part) => sum + part.points, 0);

  useEffect(() => {
    const fetchActivityAndCorrections = async () => {
      try {
        // Fetch activity details
        const activityResponse = await fetch(`/api/activities_autres/${activityId}`);
        if (!activityResponse.ok) {
          const errorData = await activityResponse.json();
          
          // Créer une instance d'Error et y attacher les détails
          const error = new Error('Erreur lors du chargement de l\'activité : ' + (errorData.error || 'Erreur lors du chargement de l\'activité'));
          (error as any).details = errorData.details || {};
          setError(error);
          setErrorDetails(errorData.details || {});
          throw error;
        } 
        const activityData = await activityResponse.json();
        setActivity(activityData);
        setName(activityData.name);
        setContent(activityData.content || '');
        
        // Préparer les parties
        const partsData = activityData.parts_names.map((name: string, index: number) => ({
          name,
          points: activityData.points[index] || 0
        }));
        setParts(partsData);
        
        // Fetch corrections for this activity
        const correctionsResponse = await fetch(`/api/activities_autres/${activityId}/corrections`);
        if (!correctionsResponse.ok) {
          const errorData = await correctionsResponse.json();
          // Créer une instance d'Error et y attacher les détails
          const error = new Error('Erreur lors du chargement des corrections : ' + (errorData.error || 'Erreur lors du chargement des corrections'));
          (error as any).details = errorData.details || {};
          setError(error);
          setErrorDetails(errorData.details || {});
          throw error;
        }
        const correctionsData = await correctionsResponse.json();
        setCorrections(correctionsData);
      } catch (err) {
        console.error('Erreur:', err);
        // Si nous n'avons pas déjà défini l'erreur (avec des détails) ci-dessus
        if (!error) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        setLoading(false);
        
      }
    };
    
    fetchActivityAndCorrections();
  }, [activityId]);

  useEffect(() => {
    const fetchStudentsAndClasses = async () => {
      try {
        // Vérifier si les étudiants sont déjà chargés
        if (students.length === 0) {
          // Récupérer les étudiants seulement si nous n'en avons pas encore
          const studentsResponse = await fetch('/api/students');
          if (studentsResponse.ok) {
            const studentsData = await studentsResponse.json();
            setStudents(studentsData);
          }
        }
      } catch (err) {
        console.error('Erreur lors du chargement des étudiants:', err);
      }
    };
    
    if ((tabValue === 4 || tabValue === 2) && corrections.length > 0) {
      fetchStudentsAndClasses();
    }
  }, [tabValue, corrections]);

  // Définir une variable activities à partir de l'activité courante
  const activities = useMemo(() => {
    return activity ? [activity] : [];
  }, [activity]);

  // Fonction pour gérer l'ajout d'une nouvelle partie
  const handleAddPart = () => {
    setParts([...parts, { name: `Partie ${parts.length + 1}`, points: 0 }]);
  };

  // Fonction pour gérer la suppression d'une partie
  const handleRemovePart = (index: number) => {
    if (parts.length <= 1) {
      enqueueSnackbar('Vous devez avoir au moins une partie', { variant: 'warning' });
      return;
    }
    const newParts = [...parts];
    newParts.splice(index, 1);
    setParts(newParts);
  };

  // Fonction pour gérer les changements de nom d'une partie
  const handlePartNameChange = (index: number, value: string) => {
    const newParts = [...parts];
    newParts[index].name = value;
    setParts(newParts);
  };

  // Fonction pour gérer les changements de points d'une partie
  const handlePartPointsChange = (index: number, value: string) => {
    // Vérifier si la valeur est un nombre valide
    const numericValue = parseFloat(value);
    const newParts = [...parts];
    
    // Si c'est un nombre valide, utiliser cette valeur
    if (!isNaN(numericValue)) {
      newParts[index].points = numericValue;
    } else {
      // Sinon, remettre à 0
      newParts[index].points = 0;
    }
    
    setParts(newParts);
  };
  
  const handleEditClick = () => {
    setIsEditing(true);
  };
  
  const handleCancelClick = () => {
    setIsEditing(false);
    
    if (activity) {
      setName(activity.name);
      setContent(activity.content || '');
      
      // Réinitialiser les parties
      if (activity.parts_names && activity.points) {
        const partsData = activity.parts_names.map((name, index) => ({
          name,
          points: activity.points[index] || 0
        }));
        setParts(partsData);
      }
    }
    
    setErrors({});
  };

  // Validation du formulaire
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!name.trim()) {
      newErrors.name = 'Le nom de l\'activité est requis';
    }
    
    let hasEmptyPartName = false;
    parts.forEach((part, index) => {
      if (!part.name.trim()) {
        hasEmptyPartName = true;
      }
    });
    
    if (hasEmptyPartName) {
      newErrors.parts = 'Chaque partie doit avoir un nom';
    }
    
    if (totalPoints <= 0) {
      newErrors.totalPoints = 'Le total des points doit être supérieur à 0';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Vérifier si activity et ses propriétés nécessaires existent
      if (!activity || !activity.parts_names || !activity.points) {
        throw new Error('Les données de l\'activité sont invalides');
      }
      
      // Sauvegarde des anciennes parties pour calculer les différences
      const oldParts = activity.parts_names.map((name: string, index: number) => ({
        name,
        points: activity.points[index] || 0
      }));
      
      const response = await fetch(`/api/activities_autres/${activityId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name, 
          content, 
          parts_names: parts.map(part => part.name),
          points: parts.map(part => part.points)
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la mise à jour de l\'activité');
      }
      
      const updatedActivity = await response.json();
      setActivity(updatedActivity);
      setIsEditing(false);
      enqueueSnackbar('Activité mise à jour avec succès', { variant: 'success' });
      
      // Comparaison des parties pour trouver les différences qui affectent les noms ou les points
      // Cela permet de détecter correctement les changements dans les parties de l'activité
      const added: { name: string; points: number }[] = [];
      const removed: { index: number; name: string; points: number }[] = [];
      
      // Détecter les parties supprimées ou dont les points/noms ont changé
      oldParts.forEach((oldPart, index) => {
        // Chercher une partie avec le même nom ET les mêmes points dans les nouvelles parties
        const foundMatchingPart = parts.find(newPart => 
          newPart.name === oldPart.name && newPart.points === oldPart.points
        );
        if (!foundMatchingPart) {
          // Si on ne trouve pas de partie correspondante exacte, cette partie est considérée comme supprimée
          // ou modifiée du point de vue des corrections
          removed.push({ index, ...oldPart });
        }
      });
      
      // Détecter les parties ajoutées ou dont les points/noms ont changé
      parts.forEach((newPart) => {
        // Chercher une partie avec le même nom ET les mêmes points dans les anciennes parties
        const foundMatchingPart = oldParts.find(oldPart => 
          oldPart.name === newPart.name && oldPart.points === newPart.points
        );
        if (!foundMatchingPart) {
          // Si on ne trouve pas de partie correspondante exacte, cette partie est considérée comme ajoutée
          // ou modifiée du point de vue des corrections
          added.push(newPart);
        }
      });
      
      // Si les parties (nom ou points) ont changé, afficher le modal pour mettre à jour les corrections
      if (added.length > 0 || removed.length > 0) {
        // Vérifier s'il y a des corrections associées
        if (corrections.length > 0) {
          setPartsChanges({ added, removed });
          setCorrectionsToUpdate(corrections);
          setSelectedCorrectionIds(corrections.map(c => c.id));
          setUpdateCorrectionsModalOpen(true);
        }
      }
    } catch (error) {
      console.error('Erreur:', error);
      enqueueSnackbar(`Erreur: ${(error as Error).message}`, { variant: 'error' });
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
      const response = await fetch(`/api/activities_autres/${activityId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la suppression de l\'activité');
      }
      
      enqueueSnackbar('Activité supprimée avec succès', { variant: 'success' });
      router.push('/activities');
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
    router.push(`/activities/${activityId}/corrections/`);
  };
  
  // Fonction pour mettre à jour les corrections après modification de l'activité
  const handleUpdateCorrections = async () => {
    if (selectedCorrectionIds.length === 0) {
      return;
    }

    setIsUpdatingCorrections(true);
    setUpdateCorrectionsError(null);
    
    try {
      // Pour chaque correction sélectionnée, nous devons mettre à jour ses points_earned
      const updateResults = await Promise.all(
        selectedCorrectionIds.map(async (correctionId) => {
          const correction = correctionsToUpdate.find(c => c.id === correctionId);
          if (!correction) return null;
          
          // Obtenir les points_earned actuels
          let newPointsEarned = [...correction.points_earned];
          
          // Supprimer les points pour les parties retirées (dans l'ordre inverse pour préserver les index)
          partsChanges.removed
            .sort((a, b) => b.index - a.index) // Trier par index décroissant
            .forEach(removedPart => {
              newPointsEarned.splice(removedPart.index, 1);
            });
          
          // Ajouter des zéros pour les nouvelles parties
          partsChanges.added.forEach(() => {
            newPointsEarned.push(0);
          });
          
          // Mettre à jour la correction
          const response = await fetch(`/api/corrections_autres/${correctionId}/update_parts`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              points_earned: newPointsEarned
            }),
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Erreur lors de la mise à jour de la correction #${correctionId}`);
          }
          
          return await response.json();
        })
      );
      
      // Vérifier si toutes les mises à jour ont réussi
      const failedUpdates = updateResults.filter(result => result === null);
      if (failedUpdates.length > 0) {
        throw new Error(`${failedUpdates.length} correction(s) n'ont pas pu être mises à jour`);
      }
      
      // Mettre à jour la liste des corrections localement
      const updatedCorrections = [...corrections];
      updateResults.forEach(updatedCorrection => {
        if (!updatedCorrection) return;
        
        const index = updatedCorrections.findIndex(c => c.id === updatedCorrection.id);
        if (index >= 0) {
          updatedCorrections[index] = updatedCorrection;
        }
      });
      
      setCorrections(updatedCorrections);
      setUpdateCorrectionsSuccess(true);
      enqueueSnackbar(`${updateResults.length} correction(s) mise(s) à jour avec succès`, { variant: 'success' });
      
      // Fermer automatiquement le modal après un délai
      setTimeout(() => {
        setUpdateCorrectionsModalOpen(false);
        setUpdateCorrectionsSuccess(false);
      }, 3000);
      
    } catch (error) {
      console.error('Erreur lors de la mise à jour des corrections:', error);
      setUpdateCorrectionsError((error as Error).message);
      enqueueSnackbar(`Erreur: ${(error as Error).message}`, { variant: 'error' });
    } finally {
      setIsUpdatingCorrections(false);
    }
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

  // Fonction pour charger les fragments de l'activité, mémorisée avec useCallback
  const fetchFragmentsForActivity = useCallback(async (activityId: string | number) => {
    if (!activityId) return;
    
    setLoadingFragments(true);
    setFragmentsError('');
    try {
      const response = await fetch(`/api/activities_autres/${activityId}/fragments`);
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
  }, [enqueueSnackbar]); // Inclure seulement les dépendances stables

  // Charger les fragments lorsque l'onglet correspondant est sélectionné
  useEffect(() => {
    if (tabValue === 1 && activityId) { // Changer l'index selon la position du nouvel onglet
      fetchFragmentsForActivity(activityId);
    }
  }, [tabValue, activityId, fetchFragmentsForActivity]);

  // Fetch all classes for filtering
  const fetchClasses = useCallback(async () => {
    try {
      const response = await fetch('/api/classes');
      if (response.ok) {
        const classes = await response.json();
        setAllClasses(classes);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des classes:', error);
    }
  }, []);

  // Load classes when component mounts
  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  // Filter corrections based on search, class, and subclass filters
  const filteredCorrectionsForDisplay = useMemo(() => {
    let result = corrections;

    // Apply search filter
    if (searchFilter.trim()) {
      const searchLower = searchFilter.toLowerCase();
      result = result.filter(correction => {
        const student = students.find(s => s.id === correction.student_id);
        const studentName = student ? `${student.first_name} ${student.last_name}`.toLowerCase() : '';
        return studentName.includes(searchLower);
      });
    }

    // Apply class filter
    if (selectedClassIds.length > 0) {
      result = result.filter(correction => {
        const student = students.find(s => s.id === correction.student_id);
        return student && student.allClasses && student.allClasses.some(cls => 
          selectedClassIds.includes(cls.classId)
        );
      });
    }

    // Apply subclass filter
    if (selectedSubClassIds.length > 0) {
      result = result.filter(correction => {
        const student = students.find(s => s.id === correction.student_id);
        if (!student || student.sub_class === undefined || student.sub_class === null || !student.allClasses) {
          return false;
        }
        
        // Check if any of the student's class-subclass combinations match selected filters
        return student.allClasses.some(cls => {
          const uniqueKey = `${cls.classId}-${student.sub_class}`;
          return selectedSubClassIds.includes(uniqueKey);
        });
      });
    }

    return result;
  }, [corrections, students, searchFilter, selectedClassIds, selectedSubClassIds]);

  // Composant pour afficher les parties de l'activité (utilisé en mode lecture)
  const renderParts = () => {
    if (!activity || !activity.parts_names || !activity.points) {
      return <Typography variant="body2">Aucune partie définie</Typography>;
    }

    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          Barème ({totalPoints} points au total)
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {activity.parts_names.map((name, index) => (
            <Chip
              key={index}
              label={
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        width: '100%'
                      }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        <MenuBookIcon fontSize='medium'
                          sx={{ 
                          mr:1,
                          color: theme => alpha(theme.palette.text.primary, 0.6),
                        }}
                          /> {name}
                        </Typography>
                        <Box 
                          component="span"
                          sx={{ 
                            ml: 1, 
                            bgcolor: 'rgba(25, 118, 210, 0.12)',
                            px: 1,
                            py: 0.2,
                            borderRadius: 1,
                            fontSize: '0.75rem',
                            fontWeight: 'bold'
                          }}
                        >
                          {activity.points[index]} pts
                        </Box>
                      </Box>
                    }
              color={"primary"}
              variant="outlined"
              sx={{ maxWidth: 'fit-content' }}
            />
          ))}
        </Box>
      </Box>
    );
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
        <div className="w-full max-w-4xl animate-slide-in">
          <Paper className="p-6 overflow-hidden relative" elevation={3}>
            <ErrorDisplay 
              error={error} 
              errorDetails={errorDetails}
              onRefresh={() => {
                setError(null);
                setErrorDetails(null);
                window.location.reload();
              }}
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
                href="/activities"
                target="_blank"
                rel="noopener noreferrer"
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
                error={!!errors.name}
                helperText={errors.name}
                autoFocus
              />
              <div className="flex space-x-2">
                <IconButton
                  onClick={handleSubmit}
                  disabled={isSubmitting}
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
                href="/activities"
                target="_blank"
                rel="noopener noreferrer"
                className="mr-2 bg-white/20 hover:bg-white/30"
                sx={{ transform: 'translateX(-10px)' }}
              >
                <ArrowBackIcon sx={{ fontSize: 30, padding: 0, color: "primary" }} />
              </IconButton>
              <Typography variant="h5" fontWeight={700} color="text.primary" className="font-bold" sx={{ transform: 'translateX(-10px)' }}>
                {activity.name}
                <IconButton
                  onClick={handleEditClick}
                  size="large"
                  color="primary"
                  aria-label="edit"
                  title="Modifier cette activité"
                  sx={{ ml: 2 }}
                >
                  <EditIcon sx={{color: "secondary.light" }} />
                </IconButton>
                {confirmingDelete ? (
                  <>
                    <IconButton
                      onClick={handleCancelDelete}
                      color="inherit"
                      size="large"
                      title="Annuler la suppression"
                    >
                      <CloseIcon />
                    </IconButton>
                    <IconButton
                      onClick={handleConfirmDelete}
                      color="success"
                      size="large"
                      title="Confirmer la suppression"
                    >
                      <CheckIcon />
                    </IconButton>
                  </>
                ) : (
                  <IconButton
                    onClick={handleDeleteClick}
                    color="error"
                    size="large"
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
        <Box sx={{ mt: 3, p: 2 }}>
          {/* Premier onglet: détails de l'activité */}
          {tabValue === 0 && (
            <div>
              {isEditing ? (
                <div>
                  <Box sx={{ mb: 4 }}>
                    <TextField
                      label="Description"
                      fullWidth
                      multiline
                      rows={4}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                    />
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Parties et points
                      {errors.totalPoints && (
                        <FormHelperText error sx={{ ml: 1, display: 'inline' }}>
                          {errors.totalPoints}
                        </FormHelperText>
                      )}
                    </Typography>
                    {errors.parts && (
                      <FormHelperText error>{errors.parts}</FormHelperText>
                    )}
                    
                    <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body1">
                        Total des points : <strong>{totalPoints}</strong>
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={handleAddPart}
                        sx={{ ml: 2 }}
                      >
                        Ajouter une partie
                      </Button>
                    </Box>
                    
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      {parts.map((part, index) => (
                        <Box key={index} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                          <DragIndicatorIcon color="disabled" sx={{ cursor: 'grab' }} />
                          
                          <Box sx={{ flexGrow: 1, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            <TextField
                              label={`Nom de la partie ${index + 1}`}
                              value={part.name}
                              onChange={(e) => handlePartNameChange(index, e.target.value)}
                              sx={{ flexGrow: 1, minWidth: '200px' }}
                              required
                            />
                            
                            <TextField
                              label="Points"
                              type="number"
                              value={part.points}
                              onChange={(e) => handlePartPointsChange(index, e.target.value)}
                              slotProps={{
                                input: { 
                                  inputProps: { min: 0, step: 0.5 },
                                 }
                              }}
                              sx={{ width: '150px' }}
                            />
                          </Box>
                          
                          <IconButton
                            onClick={() => handleRemovePart(index)}
                            color="error"
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      ))}
                    </Paper>
                  </Box>
                </div>
              ) : (
                <div>
                  <Typography variant="h6" gutterBottom>
                    Description
                  </Typography>
                  <Typography variant="body1" >
                    {activity.content || "Aucune description disponible."}
                  </Typography>
                  
                  {renderParts()}
                </div>
              )}
            </div>
          )}
          
          {/* Deuxième onglet: fragments */}
          {tabValue === 1 && (
            <div>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
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
            </div>
          )}
          
          {/* Troisième onglet: corrections */}
          {tabValue === 2 && (
            <div>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Corrections ({filteredCorrectionsForDisplay.length}/{corrections.length})
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={handleNewCorrectionClick}
                >
                  Nouvelle correction
                </Button>
              </Box>

              {/* Filter Panel */}
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <FilterListIcon color="action" />
                  <Typography variant="subtitle1">Filtres</Typography>
                  {(searchFilter || selectedClassIds.length > 0 || selectedSubClassIds.length > 0) && (
                    <Button
                      size="small"
                      startIcon={<ClearIcon />}
                      onClick={() => {
                        setSearchFilter('');
                        setSelectedClassIds([]);
                        setSelectedSubClassIds([]);
                      }}
                    >
                      Effacer les filtres
                    </Button>
                  )}
                </Box>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-end' }}>
                  {/* Search Field */}
                  <TextField
                    size="small"
                    placeholder="Rechercher par nom d'étudiant..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    sx={{ minWidth: 200, flexGrow: 1 }}
                    slotProps={{
                      input: {
                        startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon color="action" />
                        </InputAdornment>
                      ),
                    }
                    }}
                  />

                  {/* Class Filter */}
                  <FormControl size="small" sx={{ minWidth: 180 }}>
                    <InputLabel>Classes</InputLabel>
                    <Select
                      multiple
                      value={selectedClassIds}
                      onChange={(event) => {
                        const value = event.target.value;
                        setSelectedClassIds(typeof value === 'string' ? value.split(',').map(Number) : value);
                      }}
                      input={<OutlinedInput label="Classes" />}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((classId) => {
                            const className = allClasses.find(cls => cls.id === classId)?.name || `Classe ${classId}`;
                            return (
                              <Chip key={classId} label={className} size="small" />
                            );
                          })}
                        </Box>
                      )}
                    >
                      {allClasses.map((cls) => (
                        <MenuItem key={cls.id} value={cls.id}>
                          {cls.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* SubClass Filter - only show if classes are selected and subclasses exist */}
                  {availableSubClasses.length > 0 && (
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                      <InputLabel>Sous-classes</InputLabel>
                      <Select
                        multiple
                        value={selectedSubClassIds}
                        onChange={(event) => {
                          const value = event.target.value;
                          setSelectedSubClassIds(typeof value === 'string' ? value.split(',') : value);
                        }}
                        input={<OutlinedInput label="Sous-classes" />}
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((uniqueKey) => {
                              const subClassInfo = availableSubClasses.find(sc => sc.uniqueKey === uniqueKey);
                              const displayLabel = subClassInfo 
                                ? `${subClassInfo.subClass} (${subClassInfo.className})`
                                : uniqueKey;
                              return (
                                <Chip key={uniqueKey} label={displayLabel} size="small" />
                              );
                            })}
                          </Box>
                        )}
                      >
                        {availableSubClasses.map((subClassInfo) => (
                          <MenuItem key={subClassInfo.uniqueKey} value={subClassInfo.uniqueKey}>
                            {subClassInfo.subClass} ({subClassInfo.className})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                </Box>
              </Paper>
              
              {corrections.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center', mb: 2 }}>
                  <Typography sx={{ mb: 2 }} variant="body1" >
                    Aucune correction disponible pour cette activité.
                  </Typography>
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={handleNewCorrectionClick}
                  >
                    Ajouter une correction
                  </Button>
                </Paper>
              ) : filteredCorrectionsForDisplay.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center', mb: 2 }}>
                  <Typography variant="body1" color="textSecondary">
                    Aucune correction ne correspond aux filtres sélectionnés.
                  </Typography>
                </Paper>
              ) : (
                <Paper variant="outlined" sx={{ mb: 2 }}>
                  {filteredCorrectionsForDisplay.map((correction, index) => (
                    <Box key={correction.id} sx={{ 
                      p: 2, 
                      borderBottom: index < filteredCorrectionsForDisplay.length - 1 ? '1px solid rgba(0,0,0,0.12)' : 'none',
                      backgroundColor: correction.status !== 'ACTIVE' ? 'rgba(0,0,0,0.04)' : 'transparent'
                    }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {correction.student_id ? (students.find(s => s.id === correction.student_id) ? 
                            `Correction pour ${students.find(s => s.id === correction.student_id)?.first_name} ${students.find(s => s.id === correction.student_id)?.last_name}` 
                            : `Correction pour l&apos;étudiant #${correction.student_id}`) 
                          : 'Correction sans étudiant assigné'}
                          
                          {/* Indicateur de parties désactivées */}
                          {correction.disabled_parts && correction.disabled_parts.some(disabled => disabled) && (
                            <Chip 
                              size="small" 
                              label={`${correction.disabled_parts.filter(disabled => disabled).length} partie(s) désactivée(s)`}
                              color="warning" 
                              variant="outlined"
                              sx={{ ml: 1, height: 20, fontSize: '0.65rem' }}
                            />
                          )}
                          
                          {correction.status && correction.status !== 'ACTIVE' && (
                            <Chip 
                              size="small" 
                              color={correction.status === 'DEACTIVATED' ? 'error' : 
                                     correction.status === 'ABSENT' ? 'warning' : 
                                     correction.status === 'NON_RENDU' ? 'info' : 'error'} 
                              label={correction.status === 'DEACTIVATED' ? 'Désactivée' : 
                                     correction.status === 'ABSENT' ? 'Absent' : 
                                     correction.status === 'NON_RENDU' ? 'Non rendu' : 'Inactive'} 
                              sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                            />
                          )}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'nowrap' }}>
                          <Typography variant="h6" color={correction.status === 'ACTIVE' ? "primary" : "text.disabled"}>
                            {correction.status === 'ACTIVE' 
                              ? (correction.final_grade 
                                  ? (() => {
                                      const value = parseFloat(String(correction.final_grade));
                                      // Calculer le total des points actifs (en excluant les parties désactivées)
                                      let totalActivePoints = 0;
                                      if (activity.points && Array.isArray(activity.points)) {
                                        activity.points.forEach((points, idx) => {
                                          // Exclure les parties désactivées si la correction a des disabled_parts
                                          if (!correction.disabled_parts || !correction.disabled_parts[idx]) {
                                            totalActivePoints += points || 0;
                                          }
                                        });
                                      }
                                      return `${isNaN(value) ? correction.final_grade : value.toFixed(1)} / ${totalActivePoints || 0}`;
                                    })()
                                  : 'Non noté')
                              : "NaN"}
                          </Typography>
                          {correction.status === 'ACTIVE' && correction.final_grade && (
                            <>
                              <Chip
                                size="small"
                                label={`${getNormalizedGradeOn20(correction, activity).toFixed(1)}/20`}
                                color="secondary"
                                sx={{ ml: 1, fontSize: '0.7rem', height: 20 }}
                              />
                              <Chip
                                size="small"
                                label={`${getPercentageGrade(correction, activity).toFixed(1)}%`}
                                color="primary"
                                variant="outlined"
                                sx={{ ml: 0.5, fontSize: '0.65rem', height: 20 }}
                              />
                            </>
                          )}
                        </Box>
                      </Box>
                      
                      <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {correction.points_earned && Array.isArray(activity.parts_names) && activity.parts_names.map((name, idx) => {
                          // Vérifier si cette partie est désactivée
                          const isDisabled = correction.disabled_parts && correction.disabled_parts[idx];
                          
                          return (
                            <Box key={idx} sx={{ 
                              display: 'flex', 
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              opacity: isDisabled ? 0.5 : 1,
                              textDecoration: isDisabled ? 'line-through' : 'none'
                            }}>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  color: isDisabled ? 'text.disabled' : 'text.primary',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 0.5
                                }}
                              >
                                {isDisabled && (
                                  <Chip 
                                    size="small" 
                                    label="DÉSACTIVÉ" 
                                    color="default" 
                                    variant="outlined"
                                    sx={{ fontSize: '0.6rem', height: 16 }} 
                                  />
                                )}
                                {name} : {correction.points_earned[idx] || 0} / {activity.points?.[idx] || 0} pts
                              </Typography>
                            </Box>
                          );
                        })}
                        
                        {/* Afficher un résumé des parties désactivées s'il y en a */}
                        {correction.disabled_parts && correction.disabled_parts.some(disabled => disabled) && (
                          <Box sx={{ 
                            mt: 1, 
                            p: 1, 
                            bgcolor: 'warning.50', 
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: 'warning.200'
                          }}>
                            <Typography variant="caption" color="warning.dark" sx={{ fontWeight: 'bold' }}>
                              ⚠️ {correction.disabled_parts.filter(disabled => disabled).length} partie(s) désactivée(s) non comptabilisée(s) dans la note
                            </Typography>
                          </Box>
                        )}
                      </Box>
                      
                      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          component={Link}
                          href={`/feedback/${correction.shareCode}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Feedback
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="primary"
                          component={Link}
                          href={`/corrections/${correction.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Modifier
                        </Button>
                      </Box>
                    </Box>
                  ))}
                </Paper>
              )}
            </div>
          )}
          
          {/* Troisième onglet: statistiques */}
          {tabValue === 3 && (
            <div>
              <Typography variant="h6" gutterBottom>
                Statistiques
              </Typography>
              
              <Box sx={{ mb: 4 }}>
                <Typography variant="body1" >
                  Nombre de corrections : <strong>{corrections.length}</strong>
                </Typography>
                
                <Typography variant="body1" >
                  Nombre de corrections actives : <strong>{corrections.filter(c => c.status === 'ACTIVE').length}</strong>
                </Typography>
                
                <Typography variant="body1" >
                  Note moyenne : <strong>
                    {(() => {
                      const activeCorrections = corrections.filter(c => c.status === 'ACTIVE');
                      if (activeCorrections.length === 0) return 'N/A';
                      
                      // Utiliser percentage_grade pour calculer la moyenne normalisée
                      const averagePercentage = activeCorrections.reduce((sum, c) => {
                        return sum + getPercentageGrade(c, activity);
                      }, 0) / activeCorrections.length;
                      
                      const averageOn20 = (averagePercentage / 100) * 20;
                      return averageOn20.toFixed(1);
                    })()}
                  </strong>
                  {corrections.filter(c => c.status === 'ACTIVE').length > 0 && (
                    <>
                      <Chip
                        size="small"
                        label={`${(() => {
                          const activeCorrections = corrections.filter(c => c.status === 'ACTIVE');
                          const averagePercentage = activeCorrections.reduce((sum, c) => {
                            return sum + getPercentageGrade(c, activity);
                          }, 0) / activeCorrections.length;
                          const averageOn20 = (averagePercentage / 100) * 20;
                          return averageOn20.toFixed(1);
                        })()} / 20`}
                        color="secondary"
                        sx={{ ml: 1, fontSize: '0.7rem', height: 20 }}
                      />
                      <Chip
                        size="small"
                        label={`${(() => {
                          const activeCorrections = corrections.filter(c => c.status === 'ACTIVE');
                          const averagePercentage = activeCorrections.reduce((sum, c) => {
                            return sum + getPercentageGrade(c, activity);
                          }, 0) / activeCorrections.length;
                          return averagePercentage.toFixed(1);
                        })()}%`}
                        color="primary"
                        variant="outlined"
                        sx={{ ml: 0.5, fontSize: '0.65rem', height: 20 }}
                      />
                    </>
                  )}
                </Typography>
              </Box>
              
              {/* Répartition des points par partie */}
              <Typography variant="subtitle1" gutterBottom>
                Points moyens par partie:
              </Typography>
              
              {Array.isArray(activity.parts_names) && activity.parts_names.map((name, idx) => {
                const maxPoints = activity.points?.[idx];
                
                // Calculer la moyenne seulement pour les corrections où cette partie n'est pas désactivée
                const relevantCorrections = corrections.filter(c => 
                  c.status === 'ACTIVE' && 
                  (!c.disabled_parts || !c.disabled_parts[idx])
                );
                
                const avgPoints = relevantCorrections.length > 0
                  ? relevantCorrections.reduce((sum, c) => {
                      const pts = Array.isArray(c.points_earned) && c.points_earned[idx] !== undefined
                        ? c.points_earned[idx]
                        : 0;
                      return sum + pts;
                    }, 0) / relevantCorrections.length
                  : 0;
                
                const percentage = maxPoints > 0 ? (avgPoints / maxPoints) * 100 : 0;
                
                // Compter les corrections où cette partie est désactivée
                const disabledCount = corrections.filter(c => 
                  c.disabled_parts && c.disabled_parts[idx]
                ).length;
                
                return (
                  <Box key={idx} sx={{ mb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5, alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {name}
                        {disabledCount > 0 && (
                          <Chip
                            size="small"
                            label={`${disabledCount} désactivée(s)`}
                            color="warning"
                            variant="outlined"
                            sx={{ fontSize: '0.6rem', height: 16 }}
                          />
                        )}
                      </Typography>
                      <Typography variant="body2">
                        {avgPoints.toFixed(1)} / {maxPoints} pts ({percentage.toFixed(1)}%)
                        {relevantCorrections.length !== corrections.length && (
                          <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                            (sur {relevantCorrections.length}/{corrections.length})
                          </Typography>
                        )}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        width: '100%',
                        height: 10,
                        bgcolor: 'grey.200',
                        borderRadius: 5,
                        overflow: 'hidden'
                      }}
                    >
                      <Box
                        sx={{
                          width: `${percentage}%`,
                          height: '100%',
                          bgcolor: disabledCount > 0 ? 'warning.main' : (idx % 2 === 0 ? 'primary.main' : 'secondary.main'),
                        }}
                      />
                    </Box>
                  </Box>
                );
              })}
              
              {/* Statistiques sur les parties désactivées et le système percentage_grade */}
              <Box sx={{ mt: 4, mb: 4 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Système de notation avec parties désactivées:
                </Typography>
                
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 2 }}>
                  {/* Corrections avec parties désactivées */}
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.50', border: '1px solid', borderColor: 'warning.200' }}>
                    <Typography variant="h6" color="warning.dark">
                      {corrections.filter(c => c.disabled_parts && c.disabled_parts.some(disabled => disabled)).length}
                    </Typography>
                    <Typography variant="caption" color="warning.dark">
                      Corrections avec parties désactivées
                    </Typography>
                  </Paper>
                  
                  {/* Corrections avec percentage_grade */}
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.50', border: '1px solid', borderColor: 'success.200' }}>
                    <Typography variant="h6" color="success.dark">
                      {corrections.filter(c => c.percentage_grade !== null && c.percentage_grade !== undefined).length}
                    </Typography>
                    <Typography variant="caption" color="success.dark">
                      Corrections avec percentage_grade
                    </Typography>
                  </Paper>
                  
                  {/* Note moyenne normalisée */}
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
                    <Typography variant="h6" color="primary.dark">
                      {(() => {
                        const activeCorrections = corrections.filter(c => c.status === 'ACTIVE');
                        if (activeCorrections.length === 0) return 'N/A';
                        const averagePercentage = activeCorrections.reduce((sum, c) => {
                          return sum + getPercentageGrade(c, activity);
                        }, 0) / activeCorrections.length;
                        
                        // S'assurer que averagePercentage est un nombre valide avant d'appeler toFixed
                        if (isNaN(averagePercentage) || !isFinite(averagePercentage)) {
                          return 'N/A';
                        }
                        
                        return averagePercentage.toFixed(1) + '%';
                      })()}
                    </Typography>
                    <Typography variant="caption" color="primary.dark">
                      Pourcentage moyen de réussite
                    </Typography>
                  </Paper>
                </Box>
                
                {/* Explication du système */}
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  Le système percentage_grade calcule automatiquement le pourcentage de réussite en tenant compte des parties désactivées. 
                  Cela permet une normalisation équitable des notes même lorsque certaines parties ne sont pas évaluées.
                </Typography>
              </Box>
              
              {/* Ajout du composant ActivityStatsGraphs */}
              <Box sx={{ mt: 4 }}>
                <ActivityStatsGraphs activityId={parseInt(id)} />
              </Box>
            </div>
          )}
          
          {/* Quatrième onglet: Export PDF */}
          {tabValue === 4 && (
            <Box sx={{ py: 2 }}>
              <ExportPDFComponentAllCorrectionsAutresContainer
                corrections={filteredCorrections}
                activities={activities}
                students={students}
                uniqueActivities={[{ id: activity?.id || 0, name: activity?.name || 'Activité' }]}
                getActivityById={(activityId: number) => activities.find(a => a.id === activityId)}
                getStudentById={(studentId: number | null) => studentId === null ? undefined : students.find(s => s.id === studentId)}
                getAllClasses={async () => {
                  try {
                    // Récupérer uniquement les classes associées à cette activité
                    const response = await fetch(`/api/activities_autres/${activityId}/classes`);
                    if (!response.ok) throw new Error('Erreur lors du chargement des classes');
                    return await response.json();
                  } catch (error) {
                    console.error('Erreur:', error);
                    enqueueSnackbar('Erreur lors du chargement des classes', { variant: 'error' });
                    return [];
                  }
                }}
              />
            </Box>
          )}
        </Box>
      </Paper>

      {/* Composant modal pour mettre à jour les corrections après modification d'une activité */}
      <UpdateCorrectionsModal
        open={updateCorrectionsModalOpen}
        onClose={() => setUpdateCorrectionsModalOpen(false)}
        corrections={correctionsToUpdate}
        selectedCorrectionIds={selectedCorrectionIds}
        setSelectedCorrectionIds={setSelectedCorrectionIds}
        partsChanges={partsChanges}
        isUpdating={isUpdatingCorrections}
        onUpdateCorrections={handleUpdateCorrections}
        updateSuccess={updateCorrectionsSuccess}
        updateError={updateCorrectionsError}
        students={students}
        activityTotalPoints={totalPoints}
      />
    </Container>
  );
}

