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
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  SelectChangeEvent, 
  Checkbox, 
  FormControlLabel, 
  Box, 
  Grid,
  Divider,
  Chip,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableFooter,
  TablePagination,
  Switch,
  Collapse
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { useSnackbar } from 'notistack';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import QrCodeIcon from '@mui/icons-material/QrCode';
import ClassIcon from '@mui/icons-material/Class';
import GroupIcon from '@mui/icons-material/Group';
import TableChartIcon from '@mui/icons-material/TableChart';
import ActivityStatsGraphs from '@/components/ActivityStatsGraphs';
// Import components
import FragmentsList from '@/components/FragmentsList';
import CorrectionsList from '@/components/CorrectionsList';
import ActivityDetails from '@/components/ActivityDetails';
import GradientBackground from '@/components/ui/GradientBackground';
// Import the Fragment type from FragmentEditModal
import { Fragment as EditModalFragment } from '@/components/FragmentEditModal';
// Import QR Code Generator utility
import { generateQRCodePDF } from '@/utils/qrGeneratorPDF';
import FirstPageIcon from '@mui/icons-material/FirstPage';
import KeyboardArrowLeft from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';
import LastPageIcon from '@mui/icons-material/LastPage';
import { useTheme } from '@mui/material/styles';
// Import ExportPDFComponent
import ExportPDFComponent from '@/components/pdf/ExportPDFComponent';
import { Correction as ProviderCorrection } from '@/app/components/CorrectionsDataProvider';
import { Student as LibStudent } from '@/lib/types';

// Type guard pour vérifier si une correction a un shareCode
function hasShareCode(correction: Correction | CorrectionWithShareCode): correction is CorrectionWithShareCode & Correction {
  return 'shareCode' in correction && correction.shareCode !== null && correction.shareCode !== undefined;
}

// Replace custom Fragment interface with the imported type
type Fragment = EditModalFragment;

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
  
  // Pagination states for the corrections table in export tab
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  
  // Calculate empty rows for consistent table height
  const emptyRows = rowsPerPage > 0 
    ? Math.max(0, (page + 1) * rowsPerPage - filteredCorrections.length)
    : 0;

  // Handle page changes
  const handleChangePage = (event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
    setPage(newPage);
  };

  // Handle rows per page changes
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

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
  
  // Add missing handlers for class and subgroup selection
  const handleClassChange = (event: SelectChangeEvent<string | number>) => {
    const value = event.target.value;
    setSelectedClass(value === "" ? null : Number(value));
  };
  
  const handleSubGroupChange = (event: SelectChangeEvent<string>) => {
    setSelectedSubGroup(event.target.value);
  };
  
  // Add missing handler for PDF export
  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      // Generate PDF with QR codes
      const pdfFileName = await generateQRCodePDF({
        corrections: filteredCorrections,
        group: {
          name: `Groupe ${selectedSubGroup}` || (selectedClass ? classes.find(c => c.id === selectedClass)?.name || 'Classe inconnue' : 'Toutes les classes'),
          activity_name: activity?.name || 'Activité sans nom'
        },
        generateShareCode: async (correctionId) => {
          const response = await fetch(`/api/corrections/${correctionId}/share`, {
            method: 'POST',
          });
          const data = await response.json();
          return { isNew: true, code: data.code };
        },
        getExistingShareCode: async (correctionId) => {
          const response = await fetch(`/api/corrections/${correctionId}/share`);
          const data = await response.json();
          return { exists: data.exists, code: data.code };
        },
        students: students
      });
      
      if (pdfFileName) {
        enqueueSnackbar(`PDF généré avec succès : ${pdfFileName}`, { variant: 'success' });
      } else {
        throw new Error('Erreur lors de la génération du PDF');
      }
    } catch (error) {
      console.error('Erreur:', error);
      enqueueSnackbar(`Erreur lors de l'export PDF: ${(error as Error).message}`, { variant: 'error' });
    } finally {
      setIsExporting(false);
    }
  };
  
  // Add handlers for fragments
  const handleAddFragment = async (fragmentData: Omit<EditModalFragment, 'id' | 'activity_id' | 'created_at' | 'updated_at'>) => {
    try {
      const response = await fetch(`/api/activities/${activityId}/fragments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...fragmentData,
          activity_id: parseInt(activityId)
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Erreur (${response.status}): ${errorData.message || response.statusText}`);
      }
      
      const newFragment = await response.json();
      setFragments([...fragments, newFragment]);
      enqueueSnackbar('Fragment ajouté avec succès', { variant: 'success' });
    } catch (err) {
      console.error('Erreur:', err);
      enqueueSnackbar(`Erreur lors de l'ajout du fragment: ${(err as Error).message}`, { 
        variant: 'error' 
      });
    }
  };
  
  const handleUpdateFragment = async (id: number, fragmentData: Partial<EditModalFragment>) => {
    try {
      const response = await fetch(`/api/fragments/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fragmentData),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Erreur (${response.status}): ${errorData.message || response.statusText}`);
      }
      
      const updatedFragment = await response.json();
      setFragments(fragments.map(f => f.id === id ? updatedFragment : f));
      enqueueSnackbar('Fragment mis à jour avec succès', { variant: 'success' });
    } catch (err) {
      console.error('Erreur:', err);
      enqueueSnackbar(`Erreur lors de la mise à jour du fragment: ${(err as Error).message}`, { 
        variant: 'error' 
      });
    }
  };
  
  const handleDeleteFragment = async (id: number) => {
    try {
      const response = await fetch(`/api/fragments/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Erreur (${response.status}): ${errorData.message || response.statusText}`);
      }
      
      setFragments(fragments.filter(f => f.id !== id));
      enqueueSnackbar('Fragment supprimé avec succès', { variant: 'success' });
    } catch (err) {
      console.error('Erreur:', err);
      enqueueSnackbar(`Erreur lors de la suppression du fragment: ${(err as Error).message}`, { 
        variant: 'error' 
      });
    }
  };
  
  const handleCancelClick = () => {
    setIsEditing(false);
    setName(activity?.name || '');
    setContent(activity?.content || '');
    setExperimentalPoints(activity?.experimental_points !== undefined ? activity.experimental_points : 5);
    setTheoreticalPoints(activity?.theoretical_points !== undefined ? activity.theoretical_points : 15);
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

  // Ajouter des états pour les options d'export des notes
  const [arrangement, setArrangement] = useState<'student' | 'class' | 'subclass' | 'activity'>('student');
  const [subArrangement, setSubArrangement] = useState<'student' | 'class' | 'subclass' | 'activity' | 'none'>('activity');
  const [exportFormat, setExportFormat] = useState<'pdf' | 'csv' | 'xlsx'>('pdf');
  const [viewType, setViewType] = useState<'detailed' | 'simplified'>('detailed');
  const [isExportingGrades, setIsExportingGrades] = useState(false);
  
  // Fonction pour obtenir une activité par son ID
  const getActivityById = (activityId: number) => {
    return { id: activityId, name: activity?.name, experimental_points: activity?.experimental_points, theoretical_points: activity?.theoretical_points };
  };
  
  // Fonction pour obtenir un étudiant par son ID
  const getStudentById = (studentId: number | null) => {
    if (!studentId) return undefined;
    return students.find(s => s.id === studentId);
  };
  
  // Fonction pour générer un libellé pour chaque option d'arrangement
  const getArrangementLabel = (type: string): string => {
    switch (type) {
      case 'student': return 'Par étudiant';
      case 'class': return 'Par classe';
      case 'subclass': return 'Par groupe';
      case 'activity': return 'Par activité';
      case 'none': return 'Aucun sous-arrangement';
      default: return '';
    }
  };
  
  // Fonction pour obtenir les sous-arrangements disponibles en fonction de l'arrangement principal
  const getAvailableSubArrangements = (): ('student' | 'class' | 'subclass' | 'activity' | 'none')[] => {
    switch (arrangement) {
      case 'student':
        return ['activity', 'class', 'subclass', 'none'];
      case 'class':
        return ['student', 'activity', 'subclass', 'none'];
      case 'subclass':
        return ['student', 'activity', 'class', 'none'];
      case 'activity':
        return ['student', 'class', 'subclass', 'none'];
      default:
        return ['none'];
    }
  };
  
  // Fonction pour générer un PDF avec les notes
  const generateGradesPDF = async () => {
    try {
      setIsExportingGrades(true);
      
      // Organiser les données en fonction de l'arrangement sélectionné
      const groupedData = organizeData(filteredCorrections);
      
      // Importer jspdf et jspdf-autotable
      const jsPDFModule = await import('jspdf');
      const jsPDF = jsPDFModule.jsPDF;
      const autoTableModule = await import('jspdf-autotable');
      
      // Créer un nouveau document PDF
      const doc = new jsPDF();
      
      // Ajouter le titre
      const title = `Récapitulatif des notes - ${activity?.name}`;
      const subtitle = selectedSubGroup !== '' 
        ? `Groupe: ${selectedSubGroup}`
        : 'Tous les groupes';
      const className = selectedClass 
        ? classes.find(c => c.id === selectedClass)?.name || 'Classe'
        : 'Toutes les classes';
      
      doc.setFontSize(16);
      doc.text(title, 14, 20);
      doc.setFontSize(12);
      doc.text(subtitle, 14, 28);
      doc.text(`Classe: ${className}`, 14, 36);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 44);
      doc.text(`Organisation: ${getArrangementLabel(arrangement)} > ${getArrangementLabel(subArrangement)}`, 14, 52);
      
      let yPosition = 60;
      
      // Générer le contenu du PDF
      generatePDFContent(doc, groupedData, yPosition);
      
      // Sauvegarder le PDF
      const fileName = `Notes_${activity?.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(fileName);
      
      // Afficher message de succès
      enqueueSnackbar(`PDF des notes généré avec succès: ${fileName}`, { variant: 'success' });
      
    } catch (error) {
      console.error('Erreur lors de la génération du PDF des notes:', error);
      enqueueSnackbar('Erreur lors de la génération du PDF des notes', { variant: 'error' });
    } finally {
      setIsExportingGrades(false);
    }
  };
  
  // Fonction pour organiser les données selon l'arrangement choisi
  const organizeData = (corrections: Correction[]) => {
    const result: any = {};
    
    // Premier niveau d'organisation (arrangement principal)
    switch (arrangement) {
      case 'student':
        corrections.forEach(correction => {
          const student = getStudentById(correction.student_id);
          if (!student) return;
          
          const studentKey = `${student.last_name} ${student.first_name}`;
          if (!result[studentKey]) {
            result[studentKey] = {
              info: { student },
              items: {}
            };
          }
          
          // Deuxième niveau (sous-arrangement)
          if (subArrangement === 'activity') {
            const activity = getActivityById(correction.activity_id);
            const activityKey = activity?.name || `Activité ${correction.activity_id}`;
            
            if (!result[studentKey].items[activityKey]) {
              result[studentKey].items[activityKey] = {
                info: { activity },
                corrections: []
              };
            }
            
            result[studentKey].items[activityKey].corrections.push(correction);
          } 
          else if (subArrangement === 'class') {
            // Déterminer la classe de l'étudiant
            const classObj = classes.find(c => c.id === correction.class_id);
            const classKey = classObj?.name || 'Classe';
            
            if (!result[studentKey].items[classKey]) {
              result[studentKey].items[classKey] = {
                info: { className: classObj?.name },
                corrections: []
              };
            }
            
            result[studentKey].items[classKey].corrections.push(correction);
          }
          else if (subArrangement === 'subclass') {
            // Déterminer le groupe de l'étudiant
            const subClass = student.sub_class;
            const subClassName = subClass 
              ? `Groupe ${subClass}`
              : 'Sans groupe';
            
            if (!result[studentKey].items[subClassName]) {
              result[studentKey].items[subClassName] = {
                info: { subClass },
                corrections: []
              };
            }
            
            result[studentKey].items[subClassName].corrections.push(correction);
          }
          else {
            // Pas de sous-arrangement, mettre directement les corrections
            if (!result[studentKey].corrections) {
              result[studentKey].corrections = [];
            }
            result[studentKey].corrections.push(correction);
          }
        });
        break;
        
      case 'class':
        // Grouper par classe
        corrections.forEach(correction => {
          const classObj = classes.find(c => c.id === correction.class_id);
          const classKey = classObj?.name || 'Classe';
          
          if (!result[classKey]) {
            result[classKey] = {
              info: { className: classObj?.name },
              items: {}
            };
          }
          
          // Sous-arrangement
          if (subArrangement === 'student') {
            const student = getStudentById(correction.student_id);
            if (!student) return;
            
            const studentKey = `${student.last_name} ${student.first_name}`;
            
            if (!result[classKey].items[studentKey]) {
              result[classKey].items[studentKey] = {
                info: { student },
                corrections: []
              };
            }
            
            result[classKey].items[studentKey].corrections.push(correction);
          } 
          else if (subArrangement === 'activity') {
            const activity = getActivityById(correction.activity_id);
            const activityKey = activity?.name || `Activité ${correction.activity_id}`;
            
            if (!result[classKey].items[activityKey]) {
              result[classKey].items[activityKey] = {
                info: { activity },
                corrections: []
              };
            }
            
            result[classKey].items[activityKey].corrections.push(correction);
          }
          else if (subArrangement === 'subclass') {
            const student = getStudentById(correction.student_id);
            if (!student) return;
            
            const subClass = student.sub_class;
            const subClassName = subClass 
              ? `Groupe ${subClass}`
              : 'Sans groupe';
            
            if (!result[classKey].items[subClassName]) {
              result[classKey].items[subClassName] = {
                info: { subClass },
                corrections: []
              };
            }
            
            result[classKey].items[subClassName].corrections.push(correction);
          }
          else {
            // Pas de sous-arrangement
            if (!result[classKey].corrections) {
              result[classKey].corrections = [];
            }
            result[classKey].corrections.push(correction);
          }
        });
        break;
        
      case 'subclass':
        // Grouper par sous-groupe
        corrections.forEach(c => {
          const student = getStudentById(c.student_id);
          if (!student) return;
          
          const subClass = student.sub_class;
          const subClassName = subClass 
            ? `Groupe ${subClass}`
            : 'Sans groupe';
          
          if (!result[subClassName]) {
            result[subClassName] = {
              info: { subClass },
              items: {}
            };
          }
          
          // Sous-arrangement
          if (subArrangement === 'student') {
            const studentKey = `${student.last_name} ${student.first_name}`;
            
            if (!result[subClassName].items[studentKey]) {
              result[subClassName].items[studentKey] = {
                info: { student },
                corrections: []
              };
            }
            
            result[subClassName].items[studentKey].corrections.push(c);
          } 
          else if (subArrangement === 'activity') {
            const activity = getActivityById(c.activity_id);
            const activityKey = activity?.name || `Activité ${c.activity_id}`;
            
            if (!result[subClassName].items[activityKey]) {
              result[subClassName].items[activityKey] = {
                info: { activity },
                corrections: []
              };
            }
            
            result[subClassName].items[activityKey].corrections.push(c);
          }
          else if (subArrangement === 'class') {
            // Corrigé pour référencer la classe avec l'ID approprié
            const classObj = classes.find(cls => cls.id === c.class_id);
            const classKey = classObj?.name || 'Classe';
            
            if (!result[subClassName].items[classKey]) {
              result[subClassName].items[classKey] = {
                info: { className: classObj?.name },
                corrections: []
              };
            }
            
            result[subClassName].items[classKey].corrections.push(c);
          }
          else {
            // Pas de sous-arrangement
            if (!result[subClassName].corrections) {
              result[subClassName].corrections = [];
            }
            result[subClassName].corrections.push(c);
          }
        });
        break;
        
      case 'activity':
        // Grouper par activité
        corrections.forEach(correction => {
          // Pour cette page, on n'a qu'une seule activité, donc on utilise son nom
          const activityKey = activity?.name || `Activité ${correction.activity_id}`;
          
          if (!result[activityKey]) {
            result[activityKey] = {
              info: { activity },
              items: {}
            };
          }
          
          // Sous-arrangement
          if (subArrangement === 'student') {
            const student = getStudentById(correction.student_id);
            if (!student) return;
            
            const studentKey = `${student.last_name} ${student.first_name}`;
            
            if (!result[activityKey].items[studentKey]) {
              result[activityKey].items[studentKey] = {
                info: { student },
                corrections: []
              };
            }
            
            result[activityKey].items[studentKey].corrections.push(correction);
          } 
          else if (subArrangement === 'class') {
            const classObj = classes.find(c => c.id === correction.class_id);
            const classKey = classObj?.name || 'Classe';
            
            if (!result[activityKey].items[classKey]) {
              result[activityKey].items[classKey] = {
                info: { className: classObj?.name },
                corrections: []
              };
            }
            
            result[activityKey].items[classKey].corrections.push(correction);
          }
          else if (subArrangement === 'subclass') {
            const student = getStudentById(correction.student_id);
            if (!student) return;
            
            const subClass = student.sub_class;
            const subClassName = subClass 
              ? `Groupe ${subClass}`
              : 'Sans groupe';
            
            if (!result[activityKey].items[subClassName]) {
              result[activityKey].items[subClassName] = {
                info: { subClass },
                corrections: []
              };
            }
            
            result[activityKey].items[subClassName].corrections.push(correction);
          }
          else {
            // Pas de sous-arrangement
            if (!result[activityKey].corrections) {
              result[activityKey].corrections = [];
            }
            result[activityKey].corrections.push(correction);
          }
        });
        break;
    }
    
    return result;
  };

  // Fonction pour générer le contenu du PDF selon les données organisées
  const generatePDFContent = (doc: any, data: any, startY: number) => {
    let yPosition = startY;
    
    // Parcourir les entrées du premier niveau
    Object.entries(data).forEach(([key, value]: [string, any]) => {
      // Vérifier si on doit passer à une nouvelle page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      // Titre du premier niveau
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text(key, 14, yPosition);
      yPosition += 8;
      doc.setFont(undefined, 'normal');
      
      // Si pas de sous-arrangement, afficher un tableau unique
      if (value.corrections) {
        if (viewType === 'simplified' && arrangement === 'class') {
          // Tableau simplifié pour l'arrangement par classe
          generateSimplifiedTable(doc, value.corrections, yPosition);
        } else {
          // Tableau détaillé standard
          generateDetailedTable(doc, value.corrections, yPosition);
        }
        
        // Mettre à jour la position Y
        yPosition = (doc as any).lastAutoTable.finalY + 15;
      } 
      // Sinon parcourir les sous-arrangements
      else if (value.items) {
        Object.entries(value.items).forEach(([subKey, subValue]: [string, any]) => {
          // Vérifier si on doit passer à une nouvelle page
          if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
          }
          
          // Titre du sous-niveau
          doc.setFontSize(12);
          doc.text(`${subKey}`, 20, yPosition);
          yPosition += 6;
          
          // Générer le tableau pour ce sous-niveau
          if (viewType === 'simplified' && arrangement === 'class') {
            // Tableau simplifié pour l'arrangement par classe
            generateSimplifiedTable(doc, subValue.corrections, yPosition);
          } else {
            // Tableau détaillé standard
            generateDetailedTable(doc, subValue.corrections, yPosition);
          }
          
          // Mettre à jour la position Y
          yPosition = (doc as any).lastAutoTable.finalY + 15;
        });
      }
    });
  };

  // Fonction pour générer un tableau détaillé
  const generateDetailedTable = (doc: any, corrections: Correction[], yPosition: number) => {
    const tableData = corrections.map(c => {
      const activityData = getActivityById(c.activity_id);
      const student = getStudentById(c.student_id);
      
      // Marquer explicitement les notes inactives
      const isActive = c.active !== 0 && c.active !== null;
      const totalGrade = isActive ? `${c.grade || 0} / 20` : "Non rendu / ABS";
      const expGrade = isActive ? `${c.experimental_points_earned || 0} / ${activityData?.experimental_points || 0}` : "-";
      const theoGrade = isActive ? `${c.theoretical_points_earned || 0} / ${activityData?.theoretical_points || 0}` : "-";
      
      return [
        student ? `${student.first_name} ${student.last_name}` : 'N/A',
        activityData?.name || `Activité ${c.activity_id}`,
        expGrade,
        theoGrade,
        totalGrade
      ];
    });
    
    const headers = [
      'Étudiant',
      'Activité',
      'Note Exp.',
      'Note Théo.',
      'Total'
    ];
    
    // Ajouter le tableau
    const autoTableModule = require('jspdf-autotable').default;
    autoTableModule(doc, {
      head: [headers],
      body: tableData,
      startY: yPosition,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [66, 135, 245] }
    });
  };

  // Fonction pour générer un tableau simplifié (pour l'arrangement par classe)
  const generateSimplifiedTable = (doc: any, corrections: Correction[], yPosition: number) => {
    // Regrouper les étudiants (lignes) et les activités (colonnes)
    const studentMap: Record<string, Record<string, any>> = {};
    const activitySet = new Set<string>();
    
    corrections.forEach(c => {
      const student = getStudentById(c.student_id);
      const activityData = getActivityById(c.activity_id);
      
      if (!student) return;
      
      const studentKey = `${student.last_name} ${student.first_name}`;
      const activityKey = activityData?.name || `Activité ${c.activity_id}`;
      
      activitySet.add(activityKey);
      
      if (!studentMap[studentKey]) {
        studentMap[studentKey] = {};
      }
      
      studentMap[studentKey][activityKey] = c.grade || 0;
    });
    
    // Convertir en tableau pour jspdf-autotable
    const activityArray = Array.from(activitySet);
    const tableData = Object.entries(studentMap).map(([student, grades]) => {
      const row = [student];
      activityArray.forEach(activity => {
        row.push(grades[activity]?.toString() || '-');
      });
      return row;
    });
    
    // Préparer les en-têtes
    const headers = ['Étudiant', ...activityArray];
    
    // Ajouter le tableau
    const autoTableModule = require('jspdf-autotable').default;
    autoTableModule(doc, {
      head: [headers],
      body: tableData,
      startY: yPosition,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [66, 135, 245] },
      columnStyles: {
        0: { cellWidth: 40 }
      }
    });
  };

  // Conversion du type Student local vers le type Student attendu par ExportPDFComponent
  const mapToLibStudent = (student: Student): LibStudent => {
    return {
      id: student.id,
      first_name: student.first_name,
      last_name: student.last_name,
      email: student.email || '', // Fournir une valeur par défaut pour email qui est obligatoire
      gender: (student.gender as 'M' | 'F' | 'N') || 'N', // S'assurer que gender est 'M', 'F' ou 'N'
      sub_class: student.sub_class ? (typeof student.sub_class === 'string' ? parseInt(student.sub_class) : student.sub_class) : null,
      group: student.group || '',
      className: student.name || '', // Utiliser le nom si disponible
      corrections_count: 0, // Valeur par défaut
      created_at: '',  // Valeur par défaut
      updated_at: ''   // Valeur par défaut
    };
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
            <div className="flex items-start gap-4">
              <div className="text-red-500 animate-once">
                <ErrorOutlineIcon fontSize="large" />
              </div>
              <div className="flex-1">
                <Typography variant="h6" className="text-red-600 font-semibold mb-2">
                {error}
                </Typography>
                <div className="flex justify-around items-center mt-4">
                  <Button 
                  variant="outlined" 
                  color="success" 
                  size="small" 
                  className="mt-4"
                  startIcon={<RefreshIcon />}
                  onClick={() => window.location.reload()}
                  >
                  Recharger
                  </Button>
                    <Button 
                    variant="outlined" 
                    size="small"
                    color="primary"
                    className="mt-4"
                    component={Link}
                    href="/activities"
                    startIcon={<ArrowBackIcon sx={{color: "primary"}}/>}
                    >
                    Retour aux activités
                    </Button>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-1 left-0 w-full h-1">
              <div className="bg-red-500 h-full w-full animate-shrink"></div>
            </div>
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
              <ExportPDFComponent
                classData={{ id: 'all', name: activity?.name || 'Activité' }}
                corrections={filteredCorrections as ProviderCorrection[]}
                activities={[{ id: activity?.id || 0, name: activity?.name || 'Activité' }]}
                students={students.map(mapToLibStudent)}
                filterActivity={activity?.id || 0}
                setFilterActivity={() => {}} // Non utilisable dans ce contexte
                filterSubClass={selectedSubGroup === '' ? 'all' : selectedSubGroup}
                setFilterSubClass={(value) => setSelectedSubGroup(value === 'all' ? '' : value)}
                uniqueSubClasses={uniqueSubClasses.filter(subClass => subClass !== undefined).map(subClass => ({ id: parseInt(subClass || "0"), name: `Groupe ${subClass}` }))}
                uniqueActivities={[{ id: activity?.id || 0, name: activity?.name || 'Activité' }]}
                getActivityById={getActivityById}
                getStudentById={(studentId) => {
                  const student = getStudentById(studentId);
                  return student ? mapToLibStudent(student) : undefined;
                }}
              />
            </Box>
          )}
        </Box>
      </Paper>
    </Container>
  );
}

// Composant pour les actions de pagination du tableau
function TablePaginationActions(props: {
  count: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => void;
}) {
  const theme = useTheme();
  const { count, page, rowsPerPage, onPageChange } = props;

  // Fonctions pour la navigation entre les pages
  const handleFirstPageButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onPageChange(event, 0);
  };

  const handleBackButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onPageChange(event, page - 1);
  };

  const handleNextButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onPageChange(event, page + 1);
  };

  const handleLastPageButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onPageChange(event, Math.max(0, Math.ceil(count / rowsPerPage) - 1));
  };

  return (
    <Box sx={{ flexShrink: 0, ml: 2.5 }}>
      <IconButton
        onClick={handleFirstPageButtonClick}
        disabled={page === 0}
        aria-label="première page"
      >
        {theme.direction === 'rtl' ? <LastPageIcon /> : <FirstPageIcon />}
      </IconButton>
      <IconButton
        onClick={handleBackButtonClick}
        disabled={page === 0}
        aria-label="page précédente"
      >
        {theme.direction === 'rtl' ? <KeyboardArrowRight /> : <KeyboardArrowLeft />}
      </IconButton>
      <IconButton
        onClick={handleNextButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="page suivante"
      >
        {theme.direction === 'rtl' ? <KeyboardArrowLeft /> : <KeyboardArrowRight />}
      </IconButton>
      <IconButton
        onClick={handleLastPageButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="dernière page"
      >
        {theme.direction === 'rtl' ? <FirstPageIcon /> : <LastPageIcon />}
      </IconButton>
    </Box>
  );
}