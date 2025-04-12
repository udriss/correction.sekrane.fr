'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSnackbar } from 'notistack';
import { 
  Typography, 
  Paper, 
  Button, 
  Alert, 
  Container,
  Tabs,
  Tab,
  Box,
  Card,
  CardContent,
  CardActions,
  Chip,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  TextField,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Checkbox,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import SchoolIcon from '@mui/icons-material/School';
import {alpha} from '@mui/material/styles';
import LinkOffIcon from '@mui/icons-material/LinkOff';

import PatternBackground from '@/components/ui/PatternBackground';
import GradientBackground from '@/components/ui/GradientBackground';

import { ClassEditForm } from "@/components/ClassEditForm";

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PeopleIcon from '@mui/icons-material/People';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import AssignmentIcon from '@mui/icons-material/Assignment';
import RecentActorsIcon from '@mui/icons-material/RecentActors';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import QrCodeIcon from '@mui/icons-material/QrCode';
import BlockIcon from '@mui/icons-material/Block';

import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import ClassStudentsManager from '@/components/classes/ClassStudentsManager';
import AssociateActivitiesModal, { Activity as ModalActivity } from "@/components/classes/AssociateActivitiesModal";
import CreateCorrectionsModal from "@/components/corrections/CreateCorrectionsModal";
import { Correction, Class, Student } from '@/lib/types';
import { Student as BaseStudent } from '@/lib/types';
import { Correction as ProviderCorrection } from '@/app/components/CorrectionsDataProvider';
import ExportPDFComponent from '@/components/pdf/ExportPDFComponent';
import CorrectionCard from '@/components/allCorrections/CorrectionCard';



// Extended interface for students with sub-class information
interface ClassStudent extends BaseStudent {
  sub_class?: number;
}

interface Activity {
  id: number;
  name: string;
  experimental_points: number;
  theoretical_points: number;
}




interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`class-tabpanel-${index}`}
      aria-labelledby={`class-tab-${index}`}
      {...other }
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function ClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [classId, setClassId] = useState<number | null>(null);
  const [classData, setClassData] = useState<Class | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [corrections, setCorrections] = useState<ProviderCorrection[]>([]);
  const [classStudents, setClassStudents] = useState<ClassStudent[]>([]);
  const [students, setStudents] = useState<Student[]>([]); // Nouveau state pour tous les étudiants
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [showSubClassDialog, setShowSubClassDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [associateModalOpen, setAssociateModalOpen] = useState(false);
  const [availableActivities, setAvailableActivities] = useState<ModalActivity[]>([]);
  const [loadingAssociate, setLoadingAssociate] = useState(false);
  const [createCorrectionsModalOpen, setCreateCorrectionsModalOpen] = useState(false);
  const [selectedActivityForCorrections, setSelectedActivityForCorrections] = useState<number | null>(null);
  const { enqueueSnackbar } = useSnackbar();
  
  // New state variables for correction filtering and sorting
  const [filterActivity, setFilterActivity] = useState<number | 'all'>('all');
  const [filterSubClass, setFilterSubClass] = useState<string | 'all'>('all');
  const [filterGradeRange, setFilterGradeRange] = useState<[number, number]>([0, 20]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'lastName' | 'firstName' | 'grade' | 'activity' | 'date'>('grade');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [groupBy, setGroupBy] = useState<'none' | 'activity' | 'student'>('none');
  const [viewMode, setViewMode] = useState< 'card' | 'table'>('card');
  
  // Ajouter ces états pour gérer la suppression multiple
  const [deleteMode, setDeleteMode] = useState<boolean>(false);
  const [selectedForDelete, setSelectedForDelete] = useState<Record<number, boolean>>({});
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  
  // Ajouter cette fonction pour basculer le mode suppression
  const toggleDeleteMode = () => {
    if (deleteMode) {
      // Sortir du mode suppression
      setDeleteMode(false);
      setSelectedForDelete({});
    } else {
      // Entrer en mode suppression
      setDeleteMode(true);
      setTableEditMode(false); // S'assurer que le mode d'édition est désactivé
      setEditingRows({});
    }
  };

  // Ajouter cette fonction en haut du composant avec les autres fonctions
  const toggleAllCorrections = () => {
    // Utiliser filteredCorrections qui est disponible dans tout le composant
    const allSelected = filteredCorrections.every(correction => selectedForDelete[correction.id]);
    
    // Créer un nouvel objet pour les sélections
    const newSelectedState: Record<number, boolean> = {};
    
    // Si toutes sont sélectionnées, désélectionner toutes; sinon, sélectionner toutes
    filteredCorrections.forEach(correction => {
      newSelectedState[correction.id] = !allSelected;
    });
    
    setSelectedForDelete(newSelectedState);
  };

  // Ajouter cette fonction pour gérer la sélection d'une correction
  const toggleCorrectionSelection = (correctionId: number) => {
    setSelectedForDelete(prev => ({
      ...prev,
      [correctionId]: !prev[correctionId]
    }));
  };

  // Ajouter cette fonction pour supprimer les corrections sélectionnées
  const deleteSelectedCorrections = async () => {
    const selectedIds = Object.entries(selectedForDelete)
      .filter(([_, isSelected]) => isSelected)
      .map(([id]) => parseInt(id));
    
    if (selectedIds.length === 0) {
      enqueueSnackbar("Aucune correction sélectionnée", { variant: "warning" });
      return;
    }
    
    // Au lieu du confirm, basculer l'état de confirmation
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }
    
    // Si nous sommes déjà en mode de confirmation, procéder à la suppression
    setIsDeleting(true);
    setShowDeleteConfirm(false); // Réinitialiser l'état de confirmation
    
    try {
      // Suppression séquentielle de chaque correction sélectionnée
      for (const id of selectedIds) {
        await fetch(`/api/corrections/${id}`, {
          method: 'DELETE',
        });
      }
      
      // Mettre à jour l'état des corrections
      setCorrections(prev => prev.filter(c => !selectedForDelete[c.id]));
      
      // Nettoyer l'état
      setSelectedForDelete({});
      setDeleteMode(false);
      
      enqueueSnackbar(`${selectedIds.length} correction(s) supprimée(s) avec succès`, { variant: "success" });
      
    } catch (error) {
      console.error('Erreur lors de la suppression des corrections:', error);
      enqueueSnackbar('Certaines suppressions ont échoué', { variant: "error" });
    } finally {
      setIsDeleting(false);
    }
  };

  // Ajoutez une fonction pour annuler la confirmation
  const cancelDeleteConfirmation = () => {
    setShowDeleteConfirm(false);
  };



  // Add state for table editing
  const [tableEditMode, setTableEditMode] = useState<boolean>(false);
  const [editingRows, setEditingRows] = useState<Record<number, boolean>>({});
  const [editedCorrections, setEditedCorrections] = useState<Record<number, {
    experimental: number;
    theoretical: number;
  }>>({});
  const [savingCorrections, setSavingCorrections] = useState<Record<number, boolean>>({});
  
  // Add state for scroll tracking
  const [tableScrolled, setTableScrolled] = useState(false);
  
  // Add effect to track table scrolling for sticky buttons
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setTableScrolled(scrollPosition > 100); // Set to true when scrolled past 100px
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Extract and validate the class ID from params
  useEffect(() => {
    async function resolveParams() {
      try {
        const resolvedParams = await params;
        const id = parseInt(resolvedParams.id);
        
        if (isNaN(id)) {
          setError('ID de classe invalide');
          setLoading(false);
          return;
        }
        
        setClassId(id);
      } catch (err) {
        console.error('Error resolving params:', err);
        setError('Erreur lors de la lecture des paramètres');
        setLoading(false);
      }
    }
    
    resolveParams();
  }, [params]);

  // Fetch data after classId is available
  useEffect(() => {
    if (!classId) return;
    
    async function fetchData() {
      try {
        setLoading(true);
        
        // Fetch class details
        const classResponse = await fetch(`/api/classes/${classId}`);
        if (!classResponse.ok) throw new Error('Erreur lors du chargement de la classe');
        const classData = await classResponse.json();
        setClassData(classData);
        
        // Fetch activities for this class
        const activitiesResponse = await fetch(`/api/classes/${classId}/activities`);
        if (activitiesResponse.ok) {
          const activitiesData = await activitiesResponse.json();
          setActivities(activitiesData);
        }
        
        // Fetch corrections for this class
        const correctionsResponse = await fetch(`/api/classes/${classId}/corrections`);
        if (correctionsResponse.ok) {
          const correctionsData = await correctionsResponse.json();
          setCorrections(correctionsData);
        }

        // Fetch students for this class
        const studentsResponse = await fetch(`/api/classes/${classId}/students`);
        if (studentsResponse.ok) {
          const studentsData = await studentsResponse.json();
          setClassStudents(studentsData);
        }

        // Fetch all students to be able to get names by ID
        const allStudentsResponse = await fetch(`/api/students`);
        if (allStudentsResponse.ok) {
          const studentsData = await allStudentsResponse.json();
          setStudents(studentsData);
        }
        
      } catch (err) {
        console.error('Error:', err);
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [classId]);

  // Modifier la fonction handleTabChange pour qu'elle mette à jour également le fragment URL
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    // Mettre à jour le fragment URL pour refléter l'onglet actif
    updateUrlFragment(newValue);
  };

    // Ajouter cette fonction pour mettre à jour le fragment URL sans recharger la page
  const updateUrlFragment = (tabIndex: number) => {
    // Met à jour le fragment de l'URL pour refléter l'onglet actif
    window.history.replaceState(
      {}, 
      '', 
      window.location.pathname + window.location.search + `#tab=${tabIndex}`
    );
  };



  // Améliorer la détection de l'onglet depuis l'URL lors du chargement initial
  useEffect(() => {
    // Fonction pour lire l'onglet depuis le fragment URL
    const readTabFromUrl = () => {
      const hash = window.location.hash;
      const tabMatch = hash.match(/#tab=(\d+)/);
      if (tabMatch && tabMatch[1]) {
        const tabIndex = parseInt(tabMatch[1], 10);
        if (tabIndex >= 0 && tabIndex <= 3) { // Valider l'index de l'onglet
          setTabValue(tabIndex);
        }
      }
    };

    // Lire l'onglet initial
    readTabFromUrl();

    // Ajouter un écouteur pour les changements de fragment URL
    const handleHashChange = () => {
      readTabFromUrl();
    };

    window.addEventListener('hashchange', handleHashChange);

    // Nettoyer l'écouteur lors du démontage du composant
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const getActivityById = (activityId: number) => {
    return activities.find(a => a.id === activityId);
  };

  // Nouvelle fonction pour récupérer un étudiant par son ID
  const getStudentById = (studentId: number | null): Student | undefined => {
    if (!studentId) return undefined;
    return students.find(s => s.id === studentId);
  };

  // Fonction pour obtenir le nom complet d'un étudiant à partir de son ID
  const getStudentFullName = (studentId: number | null): string => {
    const student = getStudentById(studentId);
    if (!student) return "Étudiant avec nom manquant";
    return `${student.first_name} ${student.last_name}`;
  };
  
  // Helper function to get a student's sub-class (group) from their ID
  const getStudentSubClass = (studentId: number | null): number | null => {
    // If no student ID provided or class data not available, return null
    if (!studentId || !classData || !classId) return null;
    
    // Find the student by ID and return their sub-class
    const student = classStudents.find(s => s.id === studentId);
    return student?.sub_class || null;
  };

  const handleOpenAssociateModal = async () => {
    try {
      setLoadingAssociate(true);
      const res = await fetch(`/api/activities`); // Get all available activities
      if (res.ok) {
        const data = await res.json();
        setAvailableActivities(data);
        setAssociateModalOpen(true);
      } else {
        setError("Erreur lors du chargement des activités disponibles");
      }
    } catch (err) {
      setError("Erreur lors du chargement des activités disponibles");
    } finally {
      setLoadingAssociate(false);
    }
  };

  // Ajouter cette fonction pour la suppression d'une correction
  const handleDeleteCorrection = async (correction: ProviderCorrection) => {
    if (!correction.id) return;
    
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la correction pour ${getStudentFullName(correction.student_id)} ?`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/corrections/${correction.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }
      
      // Retirer la correction supprimée de l'état
      setCorrections(prev => prev.filter(c => c.id !== correction.id));
      
      enqueueSnackbar('Correction supprimée avec succès', { variant: 'success' });
      
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      enqueueSnackbar('Échec de la suppression de la correction', { variant: 'error' });
    }
  };

  const handleAssociateActivities = async (
    activitiesToAdd: ModalActivity[],
    activitiesToRemove: ModalActivity[]
  ) => {
    try {
      let hasChanges = false;
      
      // Add new activities if there are any
      if (activitiesToAdd.length > 0) {
        const addRes = await fetch(`/api/classes/${classId}/activities`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ activity_ids: activitiesToAdd.map(a => a.id) })
        });
        
        if (!addRes.ok) {
          throw new Error('Échec de l\'ajout des activités');
        }
        hasChanges = true;
      }
      
      // Remove activities if there are any - send individual delete requests
      if (activitiesToRemove.length > 0) {
        for (const activity of activitiesToRemove) {
          // Send a separate request for each activity using query parameters
          const removeRes = await fetch(`/api/classes/${classId}/activities?activityId=${activity.id}`, {
            method: 'DELETE'
          });
          
          if (!removeRes.ok) {
            throw new Error(`Échec de la suppression de l'activité ${activity.name}`);
          }
          hasChanges = true;
        }
      }
      
      // If any changes were made, refresh the activities list
      if (hasChanges) {
        const activitiesResponse = await fetch(`/api/classes/${classId}/activities`);
        if (activitiesResponse.ok) {
          const activitiesData = await activitiesResponse.json();
          setActivities(activitiesData);
        }
      }
      
      setAssociateModalOpen(false);
    } catch (error) {
      console.error("Error managing associated activities:", error);
      setError(error instanceof Error ? error.message : 'Erreur lors de la gestion des activités');
    }
  };

  const handleOpenCreateCorrections = (activityId: number) => {
    setSelectedActivityForCorrections(activityId);
    setCreateCorrectionsModalOpen(true);
  };
  
  const handleCreateCorrectionsSuccess = () => {
    // Close modal
    setCreateCorrectionsModalOpen(false);
    setSelectedActivityForCorrections(null);
    
    // Refresh corrections data
    if (classId) {
      fetch(`/api/classes/${classId}/corrections`)
        .then(res => res.ok ? res.json() : [])
        .then(data => {
          setCorrections(data);
          // Switch to corrections tab
          setTabValue(2);
        })
        .catch(err => {
          console.error('Failed to refresh corrections:', err);
        });
    }
  };

  // Get unique activities from corrections
  const uniqueActivities = useMemo(() => {
    // Get unique activity IDs from corrections
    const uniqueIds = new Set(corrections.map(c => c.activity_id));
    
    // Create array of unique activities with proper names from activities array
    const uniqueActivitiesArray = Array.from(uniqueIds).map(id => {
      const activityData = getActivityById(id);
      return {
        id,
        name: activityData?.name || `Activité ${id}`
      };
    });
    
    return uniqueActivitiesArray;
  }, [corrections, activities]); // Include activities in dependencies

  // Get unique subclasses from class data
  const uniqueSubClasses = useMemo(() => {
    if (!classData?.nbre_subclasses) return [];
    return Array.from({ length: classData.nbre_subclasses }, (_, i) => ({
      id: i + 1,
      name: `Groupe ${i + 1}`
    }));
  }, [classData]);

  // Filter and sort corrections
  const filteredCorrections = useMemo(() => {
    // Apply all filters
    let result = [...corrections];
    
    // Filter by activity
    if (filterActivity !== 'all') {
      result = result.filter(c => c.activity_id === filterActivity);
    }
    
    // Filter by subclass (if we have subclass information in corrections)
    if (filterSubClass !== 'all') {
      const subClassValue = parseInt(filterSubClass);
      result = result.filter(c => {
        // Use the student ID to find their sub-class
        const studentSubClass = getStudentSubClass(c.student_id);
        return studentSubClass === subClassValue;
      });
    }
    
    // Filter by grade range
    result = result.filter(c => {
      const grade = c.grade || 0;
      return grade >= filterGradeRange[0] && grade <= filterGradeRange[1];
    });
    
    // Filter by search term (student name or activity name)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(c => {
        const activityData = getActivityById(c.activity_id);
        const studentFullName = getStudentFullName(c.student_id);
        return (studentFullName.toLowerCase().includes(term)) || 
              (activityData?.name && activityData.name.toLowerCase().includes(term));
      });
    }

    // Apply sorting
    result.sort((a, b) => {
      const activityA = getActivityById(a.activity_id);
      const activityB = getActivityById(b.activity_id);
      const studentA = getStudentById(a.student_id);
      const studentB = getStudentById(b.student_id);
      
      switch (sortField) {
        case 'lastName':
          return sortDirection === 'asc'
            ? (studentA?.last_name || '').localeCompare(studentB?.last_name || '')
            : (studentB?.last_name || '').localeCompare(studentA?.last_name || '');
        case 'firstName':
          return sortDirection === 'asc'
            ? (studentA?.first_name || '').localeCompare(studentB?.first_name || '')
            : (studentB?.first_name || '').localeCompare(studentA?.first_name || '');
        case 'grade':
          // Calcul des notes avec pénalité si elle existe
          const gradeValueA = a.grade ?? 0; // Default to 0 if grade is undefined
          const gradeValueB = b.grade ?? 0; // Default to 0 if grade is undefined
          const penaltyA = a.penalty ?? 0; // Default to 0 if penalty is undefined
          const penaltyB = b.penalty ?? 0; // Default to 0 if penalty is undefined
          
          const gradeA = (a.penalty !== undefined && a.penalty !== null) ? 
            Math.max(0, gradeValueA - penaltyA) : gradeValueA;
          const gradeB = (b.penalty !== undefined && b.penalty !== null) ? 
            Math.max(0, gradeValueB - penaltyB) : gradeValueB;
            
          return sortDirection === 'asc' ? 
            (gradeA || 0) - (gradeB || 0) : 
            (gradeB || 0) - (gradeA || 0);
        case 'activity':
          return sortDirection === 'asc'
            ? (activityA?.name || '').localeCompare(activityB?.name || '')
            : (activityB?.name || '').localeCompare(activityA?.name || '');
        case 'date':
          // Assuming we have a date field, otherwise use ID as proxy for chronology
          return sortDirection === 'asc' ? a.id - b.id : b.id - a.id;
        default:
          return 0;
      }
    });
    
    return result;
  }, [corrections, filterActivity, filterSubClass, filterGradeRange, searchTerm, sortField, sortDirection, students]);

  // Group corrections by the selected grouping option
  const groupedCorrections = useMemo(() => {
    if (groupBy === 'none') return { ungrouped: filteredCorrections };
    
    if (groupBy === 'activity') {
      const grouped: Record<string | number, ProviderCorrection[]> = {};
      
      filteredCorrections.forEach(correction => {
        const key = correction.activity_id;
        if (!grouped[key]) {
          grouped[key] = [];
        }
        grouped[key].push(correction);
      });
      
      return grouped;
    }
    
    if (groupBy === 'student') {
      const grouped: Record<string, ProviderCorrection[]> = {};
      
      filteredCorrections.forEach(correction => {
        const key = getStudentFullName(correction.student_id);
        if (!grouped[key]) {
          grouped[key] = [];
        }
        grouped[key].push(correction);
      });
      
      return grouped;
    }
    
    return { ungrouped: filteredCorrections };
  }, [filteredCorrections, groupBy]);

  // Toggle sort direction or change sort field
  const handleSortChange = (field: 'lastName' | 'firstName' | 'grade' | 'activity' | 'date') => {
    if (field === sortField) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc'); // Default to descending when changing fields
    }
  };

  // Function to save edited correction
  const saveCorrection = async (correction: ProviderCorrection) => {
    if (!correction.id) return;
    
    const editedData = editedCorrections[correction.id];
    if (!editedData) return;
    
    // Set saving state for this correction
    setSavingCorrections(prev => ({ ...prev, [correction.id]: true }));
    
    try {
      // Convertir explicitement en nombres avec parseFloat pour éviter les problèmes de type
      const experimental = parseFloat(editedData.experimental.toString());
      const theoretical = parseFloat(editedData.theoretical.toString());
      
      const response = await fetch(`/api/corrections/${correction.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          experimental_points_earned: experimental,
          theoretical_points_earned: theoretical
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update correction');
      }
      
      // Update local data
      const updatedCorrection = await response.json();
      setCorrections(prev => prev.map(c => 
        c.id === correction.id ? { ...c, ...updatedCorrection } : c
      ));
      
      // Exit edit mode for this row
      setEditingRows(prev => ({ ...prev, [correction.id]: false }));
      
    } catch (error) {
      console.error('Error updating correction:', error);
      // Show error message if needed
    } finally {
      // Clear saving state
      setSavingCorrections(prev => ({ ...prev, [correction.id]: false }));
    }
  };
  
  // Function to toggle edit mode for all rows
  const toggleTableEditMode = () => {
    if (tableEditMode) {
      // Exit edit mode for all rows
      setTableEditMode(false);
      setEditingRows({});
    } else {
      // Enter edit mode for all rows
      setTableEditMode(true);
      const newEditingRows: Record<number, boolean> = {};
      filteredCorrections.forEach(c => {
        if (c.id) newEditingRows[c.id] = true;
      });
      setEditingRows(newEditingRows);
      
      // Initialize edited grades with current values
      const newEditedCorrections: Record<number, { experimental: number; theoretical: number }> = {};
      filteredCorrections.forEach(c => {
        if (c.id) {
          newEditedCorrections[c.id] = {
            experimental: c.experimental_points_earned || 0,
            theoretical: c.theoretical_points_earned || 0
          };
        }
      });
      setEditedCorrections(newEditedCorrections);
    }
  };
  
  // Function to toggle edit mode for a specific row
  const toggleRowEditMode = (correction: ProviderCorrection) => {
    if (!correction.id) return;
    
    const isCurrentlyEditing = editingRows[correction.id] || false;
    
    setEditingRows(prev => ({ ...prev, [correction.id]: !isCurrentlyEditing }));
    
    // Initialize edited grades if entering edit mode
    if (!isCurrentlyEditing) {
      setEditedCorrections(prev => ({
        ...prev,
        [correction.id]: {
          experimental: correction.experimental_points_earned || 0,
          theoretical: correction.theoretical_points_earned || 0
        }
      }));
    }
  };
  
  // Function to handle grade changes
  const handleGradeChange = (
    correctionId: number, 
    type: 'experimental' | 'theoretical', 
    value: number | number[]
  ) => {
    const newValue = typeof value === 'number' ? value : value[0];
    
    setEditedCorrections(prev => ({
      ...prev,
      [correctionId]: {
        ...prev[correctionId],
        [type]: newValue
      }
    }));
  };
  
  // Function to save all edited corrections
  const saveAllCorrections = async () => {
    const correctionIds = Object.keys(editingRows).filter(id => editingRows[Number(id)]);
    
    for (const idStr of correctionIds) {
      const id = Number(idStr);
      const correction = corrections.find(c => c.id === id);
      if (correction) {
        await saveCorrection(correction);
      }
    }
    
    setTableEditMode(false);
    setEditingRows({});
  };

  // State for storing share codes
  const [shareCodesMap, setShareCodesMap] = useState<Map<string, string>>(new Map());
  
  // The useEffect for loading shareCodes
  useEffect(() => {
    const loadShareCodes = async () => {
      if (corrections.length > 0) {
        try {
          const correctionIds = corrections.map(c => c.id.toString());
          const response = await fetch('/api/share/batch', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ correctionIds }),
          });
          
          if (response.ok) {
            const data = await response.json();
            const codesMap = new Map<string, string>();
            
            // Convert array of { correctionId, shareCode } to Map
            data.forEach((item: { correctionId: string, shareCode: string }) => {
              codesMap.set(item.correctionId, item.shareCode);
            });
            
            setShareCodesMap(codesMap);
          }
        } catch (error) {
          console.error('Error loading share codes:', error);
        }
      }
    };
    
    loadShareCodes();
  }, [corrections]);

  // Conserver la fonction handleChipClick telle quelle, mais assurez-vous qu'elle utilise updateUrlFragment
  const handleChipClick = (tabIndex: number) => {
    // This will update the URL without full page reload
    // Note: You can't use query params with app router, 
    // but we can store tab state in localStorage if needed for persistence
    // window.history.pushState({}, '', `#tab=${tabIndex}`);
    setTabValue(tabIndex);
    updateUrlFragment(tabIndex);
  };

  // Check for tab parameter in URL hash on component mount
  useEffect(() => {
    // Read tab from URL hash fragment
    const hash = window.location.hash;
    const tabMatch = hash.match(/#tab=(\d+)/);
    if (tabMatch && tabMatch[1]) {
      const tabIndex = parseInt(tabMatch[1], 10);
      if (tabIndex >= 0 && tabIndex <= 2) { // Validate tab index
        setTabValue(tabIndex);
      }
    }
  }, []);

  if (loading) {
    return (
      <div className="container max-w-[400px] mx-auto px-4 py-8 flex justify-center">
        <LoadingSpinner size="lg" text="Chargement des données de la classe " />
      </div>
    );
  }

  if (error || !classData || classId === null) {
    return (
      <Container maxWidth="md" className="py-8">
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3,
            border: 1,
            borderColor: 'error.main',
            '& .MuiAlert-icon': {
              color: 'error.main'
            }
          }}
        >
          {error || 'Impossible de charger les informations de la classe'}
        </Alert>
        <Button 
          variant="contained" 
          startIcon={<ArrowBackIcon />} 
          onClick={() => window.history.back()}
        >
          Retour
        </Button>
      </Container>
    );
  }



  return (
    <Container maxWidth="lg" className="py-8">
      {/* Header with gradient */}
      <Paper 
        elevation={3} 
        sx={{ 
          borderRadius: 3,
          overflow: 'hidden',
          mb: 4,
        }}
      >
        <GradientBackground variant="primary" sx={{ p: 0 }}>
          <PatternBackground 
            pattern="dots" 
            opacity={0.05} 
            color="black" 
            size={100}
            sx={{ p: 4, borderRadius: 2 }}
          >
            {isEditing && classData && classId ? (
              <ClassEditForm 
                id={classId.toString()}
                initialData={{
                  name: classData?.name || '',
                  description: classData?.description || '',
                  academic_year: classData?.academic_year || '',
                  nbre_subclasses: classData?.nbre_subclasses || 0
                }}
                onCancel={() => setIsEditing(false)}
                onSuccess={(updatedClass) => {
                  setClassData(updatedClass);
                  setIsEditing(false);
                }}
              />
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box 
                    sx={{ 
                      background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                      p: 1.5, 
                      borderRadius: '50%',
                      display: 'flex',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                    }}
                  >
                    <SchoolIcon sx={{ fontSize: 50, color: (theme) => theme.palette.text.primary }} />
                  </Box>
                  
                  <Box>
                    <Typography variant="h4" fontWeight={700} color="text.primary">{classData.name}</Typography>
                    <Typography variant="subtitle1" color="text.secondary" sx={{ opacity: 0.9 }}>
                      Année académique : {classData.academic_year}
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button 
                    variant="contained" 
                    color="secondary" 
                    startIcon={<ArrowBackIcon />} 
                    component={Link} 
                    href="/classes"
                  >
                    Retour
                  </Button>
                  
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<EditIcon />}
                    onClick={() => setIsEditing(true)}
                  >
                    Modifier
                  </Button>
                </Box>
              </Box>
            )}

            {!isEditing && classData.description && (
              <Typography variant="body1" color='text.primary' className="mt-4 bg-white/20 p-3 rounded-lg italic">
                {classData.description}
              </Typography>
            )}
            {!isEditing && !classData.description && (
              <Typography variant="body1" color='text.primary' className="mt-4 bg-white/20 p-3 rounded-lg italic">
                Aucune description n'a été fournie pour cette classe.
              </Typography>
            )}
          </PatternBackground>
        </GradientBackground>
        
        {/* Stats cards grid */}
        <Box sx={{ p: 2 }}>
          <Grid container spacing={2} sx={{ display: 'flex', justifyContent: 'space-around' }}>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <Paper sx={{ 
                p: 2, 
                textAlign: 'center', 
                height: '100%',
                bgcolor: (theme) => alpha(theme.palette.myBoxes.primary, 0.5),
                backdropFilter: 'blur(5px)',
                borderRadius: 2,
                cursor: 'pointer',
                '&:hover': { transform: 'translateY(-2px)' },
                transition: 'all 0.2s ease'
              }}
              onClick={() => handleChipClick(1)}>
                <PeopleIcon color="primary" fontSize="large" sx={{ mb: 1 }} />
                <Typography variant="h3" fontWeight="bold" color="text.primary">
                  {classData.student_count}
                </Typography>
                <Typography variant="overline" color="text.secondary">étudiants</Typography>
              </Paper>
            </Grid>
            
            {classData?.nbre_subclasses && classData.nbre_subclasses > 0 && (
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <Paper sx={{ 
                  p: 2, 
                  textAlign: 'center', 
                  height: '100%',
                  bgcolor: (theme) => alpha(theme.palette.myBoxes.primary, 0.5),
                  backdropFilter: 'blur(5px)',
                  borderRadius: 2,
                  cursor: 'pointer',
                  '&:hover': { transform: 'translateY(-2px)' },
                  transition: 'all 0.2s ease'
                }}
                onClick={() => handleChipClick(1)}>
                  <RecentActorsIcon color="info" fontSize="large" sx={{ mb: 1 }} />
                  <Typography variant="h3" fontWeight="bold" color="text.primary">
                    {classData.nbre_subclasses}
                  </Typography>
                  <Typography color="text.secondary" variant="overline">sous-classes</Typography>
                </Paper>
              </Grid>
            )}

            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <Paper sx={{ 
                p: 2, 
                textAlign: 'center', 
                height: '100%',
                bgcolor: (theme) => alpha(theme.palette.myBoxes.primary, 0.5),
                backdropFilter: 'blur(5px)',
                borderRadius: 2,
                cursor: 'pointer',
                '&:hover': { transform: 'translateY(-2px)' },
                transition: 'all 0.2s ease'
              }}
              onClick={() => handleChipClick(0)}>
                <MenuBookIcon color="secondary" fontSize="large" sx={{ mb: 1 }} />
                <Typography variant="h3" fontWeight="bold" color="text.primary">
                  {classData.activity_count}
                </Typography>
                <Typography variant="overline" color="text.secondary">activités</Typography>
              </Paper>
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <Paper sx={{ 
                p: 2, 
                textAlign: 'center', 
                height: '100%',
                bgcolor: (theme) => alpha(theme.palette.myBoxes.primary, 0.5),
                backdropFilter: 'blur(5px)',
                borderRadius: 2,
                cursor: 'pointer',
                '&:hover': { transform: 'translateY(-2px)' },
                transition: 'all 0.2s ease'
              }}
              onClick={() => handleChipClick(2)}>
                <AssignmentTurnedInIcon color="success" fontSize="large" sx={{ mb: 1 }} />
                <Typography variant="h3" fontWeight="bold" color="text.primary">
                  {corrections.length}
                </Typography>
                <Typography variant="overline" color="text.secondary">corrections</Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Tabs for different sections */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="class tabs">
          <Tab label="Activités" icon={<MenuBookIcon />} iconPosition="start" />
          <Tab label="Étudiants" icon={<PeopleIcon />} iconPosition="start" />
          <Tab label="Corrections" icon={<AssignmentTurnedInIcon />} iconPosition="start" />
          <Tab icon={<QrCodeIcon />} label="Export PDF" />
        </Tabs>
      </Box>

      {/* Activities Tab */}
      <TabPanel value={tabValue} index={0}>
      <Paper sx={{ p: 2, mb: 3 }} elevation={1}>

        <Box className="mb-4 flex justify-end items-center gap-4">
        <Button 
            variant="outlined" 
            startIcon={<MenuBookIcon />}
            disabled={loadingAssociate}
            component={Link} 
            href="/activities/new"
          >
            Nouvelle activité
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<MenuBookIcon />}
            onClick={handleOpenAssociateModal}
            disabled={loadingAssociate}
          >
            Associer des activités
          </Button>
        </Box>

        {activities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activities.map((activity) => {
              // Count corrections for this activity
              const correctionCount = corrections.filter(
                c => c.activity_id === activity.id
              ).length;
              
              return (
                <Card key={activity.id} className="hover:shadow-lg transition-shadow">
                  <CardContent>
                    <Typography variant="h6" component="h3">
                      {activity.name}
                    </Typography>
                    <Box className="flex gap-2 mt-2 flex-wrap">
                      <Chip 
                        label={`${activity.experimental_points} points exp.`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      <Chip 
                        label={`${activity.theoretical_points} points théo.`}
                        size="small"
                        sx={{color:"secondary.dark"}}
                        variant="outlined"
                      />
                      <Chip 
                        label={`${correctionCount} correction${correctionCount !== 1 ? 's' : ''}`}
                        size="small"
                        color="info"
                        variant="outlined"
                        icon={<AssignmentTurnedInIcon fontSize="small" />}
                      />
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button 
                      size="small" 
                      component={Link}
                      href={`/activities/${activity.id}`}
                    >
                      Voir détails
                    </Button>
                    <Button 
                      size="small"
                      onClick={() => handleOpenCreateCorrections(activity.id)}
                    >
                      Nouvelles corrections
                    </Button>
                  </CardActions>
                </Card>
              );
            })}
          </div>
        ) : (
          <Paper className="p-8 text-center">
            <Typography variant="h6" className="mb-2">Aucune activité</Typography>
            <Typography variant="body2" sx={{mb: 2, color: 'text.secondary' }}>
              Associez des activités à cette classe pour commencer
            </Typography>
            <Button
              variant="contained"
              startIcon={<MenuBookIcon />}
              onClick={handleOpenAssociateModal}
              disabled={loadingAssociate}
            >
              Associer des activités
            </Button>
          </Paper>
        )}
        </Paper> 
      </TabPanel>
      
      {/* Students Tab - Now using the ClassStudentsManager component */}
      <TabPanel value={tabValue} index={1}>
        {classId && (
          <ClassStudentsManager 
            classId={classId}
            classData={classData ? {
              id: classData.id,
              name: classData.name,
              academic_year: classData.academic_year || '', // Assurez-vous que c'est toujours une chaîne
              nbre_subclasses: classData.nbre_subclasses
            } : null}
            embedded={true}
          />
        )}
      </TabPanel>

      {/* Corrections Tab */}
      <TabPanel value={tabValue} index={2}>
        {/* Filters and controls */}
        <Paper sx={{ p: 2, mb: 3 }} elevation={1}>
        <Box display="flex" justifyContent="end" alignItems="center" mb={3}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {activities.length > 0 && (
              <Button
                variant="outlined"
                color='success'
                startIcon={<AssignmentTurnedInIcon />}
                onClick={() => handleOpenCreateCorrections(activities[0].id)}
              >
                Ajouter des corrections
              </Button>
            )}
          </Box>
        </Box>
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
              {/* Activity filter */}
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Activité</InputLabel>
                <Select
                  value={filterActivity}
                  onChange={(e) => setFilterActivity(e.target.value as number | 'all')}
                  label="Activité"
                >
                  <MenuItem value="all">Toutes les activités</MenuItem>
                  {uniqueActivities.map(activity => (
                    <MenuItem key={activity.id} value={activity.id}>
                      {activity.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl size="small" sx={{ minWidth: 130 }}>
                  <InputLabel>Regrouper par</InputLabel>
                  <Select
                    value={groupBy}
                    onChange={(e) => setGroupBy(e.target.value as 'none' | 'activity' | 'student')}
                    label="Regrouper par"
                  >
                    <MenuItem value="none">Aucun</MenuItem>
                    <MenuItem value="activity">Activité</MenuItem>
                    <MenuItem value="student">Étudiant</MenuItem>
                  </Select>
                </FormControl>

              {/* Subclass filter (if class has subclasses) */}
              {classData?.nbre_subclasses && classData.nbre_subclasses > 0 && (
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Groupe</InputLabel>
                  <Select
                    value={filterSubClass}
                    onChange={(e) => setFilterSubClass(e.target.value)}
                    label="Groupe"
                  >
                    <MenuItem value="all">Tous les groupes</MenuItem>
                    {uniqueSubClasses.map(group => (
                      <MenuItem key={group.id} value={group.id.toString()}>
                        {group.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
              
              {/* Grade range filter */}
              <Box sx={{ width: 200, px: 1 }}>
                <Typography variant="caption" color="textSecondary">
                  Notes: {filterGradeRange[0]} - {filterGradeRange[1]}
                </Typography>
                <Slider
                  value={filterGradeRange}
                  onChange={(_, newValue) => setFilterGradeRange(newValue as [number, number])}
                  valueLabelDisplay="auto"
                  min={0}
                  max={20}
                  size="small"
                />
              </Box>
              
              {/* Search box */}
              <TextField
                size="small"
                label="Rechercher"
                variant="outlined"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ flexGrow: 1, minWidth: 150 }}
                slotProps={{
                  input: { 'aria-label': 'Rechercher par nom ou activité' }
                }}
              />
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
              {/* Sort options */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" sx={{ mr: 1 }}>
                  Trier par:
                </Typography>
                <Button 
                  size="small" 
                  variant={sortField === 'lastName' ? 'contained' : 'outlined'}
                  onClick={() => handleSortChange('lastName')}
                  endIcon={sortField === 'lastName' ? (sortDirection === 'asc' ? '↑' : '↓') : undefined}
                >
                  Nom
                </Button>
                <Button 
                  size="small" 
                  variant={sortField === 'firstName' ? 'contained' : 'outlined'}
                  onClick={() => handleSortChange('firstName')}
                  endIcon={sortField === 'firstName' ? (sortDirection === 'asc' ? '↑' : '↓') : undefined}
                >
                  Prénom
                </Button>
                <Button 
                  size="small" 
                  variant={sortField === 'grade' ? 'contained' : 'outlined'}
                  onClick={() => handleSortChange('grade')}
                  endIcon={sortField === 'grade' ? (sortDirection === 'asc' ? '↑' : '↓') : undefined}
                >
                  Note
                </Button>
                <Button 
                  size="small" 
                  variant={sortField === 'activity' ? 'contained' : 'outlined'}
                  onClick={() => handleSortChange('activity')}
                  endIcon={sortField === 'activity' ? (sortDirection === 'asc' ? '↑' : '↓') : undefined}
                >
                  Activité
                </Button>
                <Button 
                  size="small" 
                  variant={sortField === 'date' ? 'contained' : 'outlined'}
                  onClick={() => handleSortChange('date')}
                  endIcon={sortField === 'date' ? (sortDirection === 'asc' ? '↑' : '↓') : undefined}
                >
                  Date
                </Button>
              </Box>
              {/* Grouping and view options */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>                
                {/* View mode switcher */}
                <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, display: 'flex' }}>
                  <Button
                    size="small"
                    variant={viewMode === 'card' ? 'contained' : 'text'}
                    onClick={() => setViewMode('card')}
                  >
                    Cartes
                  </Button>
                  <Button
                    size="small"
                    variant={viewMode === 'table' ? 'contained' : 'text'}
                    onClick={() => setViewMode('table')}
                  >
                    Table
                  </Button>
                </Box>
              </Box>
            </Box>
            
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="textSecondary">
              {filteredCorrections.length === 0
              ? "Aucune correction trouvée"
              : filteredCorrections.length === 1
              ? "1 correction trouvée"
              : `${filteredCorrections.length} corrections trouvées`}
            </Typography>
            {filteredCorrections.length > 0 && (
              <Box>
                <Typography variant="body2">
                  Moyenne : <strong>
                    {(filteredCorrections.reduce((sum, c) => sum + (parseFloat(c.grade?.toString() || "0")), 0) / filteredCorrections.length || 0).toFixed(1)}
                  </strong>/20
                </Typography>
              </Box>
            )}
          </Box>
        </Paper>

        {corrections.length > 0 ? (
          <div>
            {/* Display corrections based on grouping and view mode */}
            {groupBy === 'none' ? (
              // Ungrouped corrections
              renderCorrectionsView(groupedCorrections.ungrouped, viewMode)
            ) : (
              // Grouped corrections
              Object.entries(groupedCorrections).map(([key, items]) => (
                <Box key={key} sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom>
                  {groupBy === 'activity' ? (
                    // Use getActivityById to get the activity name
                    (() => {
                      const activityId = items[0]?.activity_id;
                      const activity = activityId ? getActivityById(activityId) : null;
                      return activity?.name || `Activité ${activityId}`;
                    })()
                  ) : (
                      // Display student name as group title
                      key
                    )}
                    <Typography component="span" variant="body2" sx={{ ml: 2 }}>
                      ({items.length} correction{items.length > 1 ? 's' : ''})
                    </Typography>
                  </Typography>
                  {renderCorrectionsView(items, viewMode)}
                </Box>
              ))
            )}
          </div>
        ) : (
          <Paper className="p-8 text-center">
            <Typography variant="h6" className="mb-2">Aucune correction</Typography>
            <Typography variant="body2" sx={{mb: 2, color: 'text.secondary'}}>
              Ajoutez des corrections pour les activités de cette classe
            </Typography>
            {activities.length > 0 ? (
              <Button
                startIcon={<AssignmentTurnedInIcon />}
                color='success'
                variant="outlined"
                onClick={() => handleOpenCreateCorrections(activities[0].id)}
              >
                Nouvelles des corrections
              </Button>
            ) : (
                      <Alert 
                        severity="warning" 
                        sx={{ 
                          mb: 3,
                          border: 1,
                          borderColor: 'warning.main',
                          '& .MuiAlert-icon': {
                            color: 'warning.main'
                          }
                        }}
                      >
                Associez d'abord des activités à cette classe.
              </Alert>
            )}
          </Paper>
        )}
      </TabPanel>

      {/* Associate Activities Modal */}
      <AssociateActivitiesModal
        open={associateModalOpen}
        availableActivities={availableActivities}
        currentActivities={activities} // Pass the current activities
        onClose={() => setAssociateModalOpen(false)}
        onAssociate={handleAssociateActivities}
      />

      {/* Create Corrections Modal */}
      {selectedActivityForCorrections !== null && (
        <CreateCorrectionsModal
          open={createCorrectionsModalOpen}
          activityId={selectedActivityForCorrections}
          onClose={() => {
            setCreateCorrectionsModalOpen(false);
            setSelectedActivityForCorrections(null);
          }}
          onSuccess={handleCreateCorrectionsSuccess}
        />
      )}
      <TabPanel value={tabValue} index={3}>
        <ExportPDFComponent 
          classData={classData}
          corrections={corrections}
          activities={activities}
          students={students}
          filterActivity={filterActivity}
          setFilterActivity={setFilterActivity}
          filterSubClass={filterSubClass}
          setFilterSubClass={setFilterSubClass}
          uniqueSubClasses={uniqueSubClasses}
          uniqueActivities={uniqueActivities}
          getActivityById={getActivityById}
          getStudentById={getStudentById}
        />
      </TabPanel>
    </Container>
  );

  // Helper function to render corrections based on view mode
  function renderCorrectionsView(items: ProviderCorrection[], mode: 'card' | 'table') {
    switch (mode) {
      /* case 'list':
        return (
          <Paper>
            <List>
              {items.map((correction, index) => {
              const activityData = getActivityById(correction.activity_id);
              const studentFullName = getStudentFullName(correction.student_id);
              return (<React.Fragment key={correction.id}>
                  {index > 0 && <Divider />}
                  <ListItem
                    secondaryAction={
                      <IconButton 
                        edge="end" 
                        component={Link}
                        href={`/corrections/${correction.id}`}
                      >
                        <AssignmentIcon />
                      </IconButton>
                    }
                  >
                    <ListItemText
                      primary={studentFullName}
                      secondary={
                        <>
                          <Typography component="span" variant="body2" color="text.primary">
                            {activityData?.name}
                          </Typography>
                          {" — "}
                          Note: {correction.grade} / 20 (Exp: {correction.experimental_points_earned}, Théo: {correction.theoretical_points_earned})
                        </>
                      }
                    />
                  </ListItem>
                </React.Fragment>
              
              )}
              )}
            </List>
          </Paper>
        );
       */

      case 'card':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {items.map((correction) => {
              const activityData = getActivityById(correction.activity_id);
              const studentData = getStudentById(correction.student_id);
              const studentSubClass = getStudentSubClass(correction.student_id);
              
              // Préparer l'objet de correction à passer au CorrectionCard
              const correctionForCard = {
                ...correction,
                activity_name: activityData?.name || 'Activité inconnue',
                student_name: studentData ? `${studentData.first_name} ${studentData.last_name}` : 'Étudiant inconnu',
                class_name: classData?.name || '',
                student_sub_class: studentSubClass ? `${studentSubClass}` : undefined,
                theoretical_points: activityData?.theoretical_points || 0,
                experimental_points: activityData?.experimental_points || 0
              };

              // Fonction pour obtenir la couleur de la note
              const getGradeColor = (grade: number) => {
                if (grade < 5) return "error";
                if (grade < 10) return "warning";
                if (grade < 15) return "info";
                return "success";
              };

              // Fonctions de gestion du changement de statut
              const handleToggleActive = async (correctionId: number, newActiveState: boolean) => {
                try {
                  const response = await fetch(`/api/corrections/${correctionId}/status`, {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 
                      active: newActiveState,
                      status: newActiveState ? 'ACTIVE' : 'DEACTIVATED'
                    }),
                  });
                  
                  if (!response.ok) {
                    throw new Error('Échec de la mise à jour du statut');
                  }
                  
                  // Mettre à jour les corrections dans l'état local
                  setCorrections(prev => prev.map(c => 
                    c.id === correctionId 
                      ? { ...c, active: newActiveState ? 1 : 0, status: newActiveState ? 'ACTIVE' : 'DEACTIVATED' } 
                      : c
                  ));
                  
                  // Afficher un message de succès
                  enqueueSnackbar(`Correction ${newActiveState ? 'activée' : 'désactivée'} avec succès`, {
                    variant: 'success',
                    autoHideDuration: 3000,
                  });
                } catch (error) {
                  console.error('Erreur lors du changement de statut:', error);
                  enqueueSnackbar(`Erreur: ${error instanceof Error ? error.message : 'Échec de la mise à jour'}`, {
                    variant: 'error',
                    autoHideDuration: 5000,
                  });
                  throw error;
                }
              };
              
              const handleChangeStatus = async (correctionId: number, newStatus: string) => {
                try {
                  const response = await fetch(`/api/corrections/${correctionId}/status`, {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ status: newStatus }),
                  });
                  
                  if (!response.ok) {
                    throw new Error('Échec de la mise à jour du statut');
                  }
                  
                  // Mettre à jour les corrections dans l'état local
                  setCorrections(prev => prev.map(c => 
                    c.id === correctionId 
                      ? { 
                          ...c, 
                          status: newStatus,
                          active: newStatus === 'ACTIVE' ? 1 : 0 
                        } 
                      : c
                  ));
                  
                  // Map status to readable name for the toast message
                  const statusNames: Record<string, string> = {
                    'ACTIVE': 'activée',
                    'DEACTIVATED': 'désactivée',
                    'ABSENT': 'marquée comme absent',
                    'NON_RENDU': 'marquée comme non rendue',
                    'NON_NOTE': 'marquée comme non notée'
                  };
                  
                  // Afficher un message de succès
                  enqueueSnackbar(`Correction ${statusNames[newStatus] || 'mise à jour'} avec succès`, {
                    variant: 'success',
                    autoHideDuration: 3000,
                  });
                } catch (error) {
                  console.error('Erreur lors du changement de statut:', error);
                  enqueueSnackbar(`Erreur: ${error instanceof Error ? error.message : 'Échec de la mise à jour'}`, {
                    variant: 'error',
                    autoHideDuration: 5000,
                  });
                  throw error;
                }
              };

              return (
                <CorrectionCard
                  key={correction.id}
                  correction={correctionForCard}
                  getGradeColor={getGradeColor}
                  showStudent={true}
                  showActivity={true}
                  showClass={false}
                  onToggleActive={handleToggleActive}
                  onChangeStatus={handleChangeStatus}
                />
              );
            })}
          </div>
        );
      
      case 'table':
        return (
          <Box>
            {/* Sticky Delete Mode Controls */}
            {deleteMode && (
              <Box 
                sx={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 1,
                  position: tableScrolled ? 'fixed' : 'static',
                  top: tableScrolled ? '15px' : 'auto',
                  right: tableScrolled ? '15px' : 'auto',
                  zIndex: 1100,
                  transition: 'all 0.3s ease',
                  py: 1,
                  px: 2,
                  bgcolor: theme => tableScrolled ? alpha(theme.palette.background.paper, 0.9) : 'transparent',
                  backdropFilter: tableScrolled ? 'blur(8px)' : 'none',
                  borderRadius: tableScrolled ? 2 : 0,
                  boxShadow: tableScrolled ? 3 : 0,
                }}
              >
                {showDeleteConfirm ? (
                  <>
                    <Button
                      variant="contained"
                      color="success"
                      onClick={deleteSelectedCorrections}
                      startIcon={isDeleting ? <CircularProgress size={18} color="inherit" /> : <CheckIcon />}
                      size="small"
                      disabled={isDeleting}
                    >
                      Confirmer ({Object.values(selectedForDelete).filter(Boolean).length})
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={cancelDeleteConfirmation}
                      startIcon={<CloseIcon />}
                      size="small"
                      disabled={isDeleting}
                    >
                      Annuler
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="contained"
                      color="error"
                      onClick={deleteSelectedCorrections}
                      startIcon={isDeleting ? <CircularProgress size={18} color="inherit" /> : <DeleteIcon />}
                      size="small"
                      disabled={isDeleting || !Object.values(selectedForDelete).some(selected => selected)}
                    >
                      Supprimer ({Object.values(selectedForDelete).filter(Boolean).length})
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={toggleDeleteMode}
                      startIcon={<CloseIcon />}
                      size="small"
                      disabled={isDeleting}
                    >
                      Annuler
                    </Button>
                  </>
                )}
              </Box>
            )}
            {/* Edit mode toggle button */}
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              {deleteMode && (
                <>
                  {showDeleteConfirm ? (
                    <>
                      <Button
                        variant="contained"
                        color="success"
                        onClick={deleteSelectedCorrections}
                        startIcon={isDeleting ? <CircularProgress size={18} color="inherit" /> : <CheckIcon />}
                        size="small"
                        disabled={isDeleting}
                      >
                        Confirmer ({Object.values(selectedForDelete).filter(Boolean).length})
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={cancelDeleteConfirmation}
                        startIcon={<CloseIcon />}
                        size="small"
                        disabled={isDeleting}
                      >
                        Annuler
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="contained"
                        color="error"
                        onClick={deleteSelectedCorrections}
                        startIcon={isDeleting ? <CircularProgress size={18} color="inherit" /> : <DeleteIcon />}
                        size="small"
                        disabled={isDeleting || !Object.values(selectedForDelete).some(selected => selected)}
                      >
                        Supprimer ({Object.values(selectedForDelete).filter(Boolean).length})
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={toggleDeleteMode}
                        startIcon={<CloseIcon />}
                        size="small"
                        disabled={isDeleting}
                      >
                        Annuler
                      </Button>
                    </>
                  )}
                </>
              )}
              
              {tableEditMode && (
                <Button
                  variant="outlined"
                  color="success"
                  onClick={saveAllCorrections}
                  startIcon={<SaveIcon />}
                  size="small"
                >
                  Enregistrer toutes les modifications
                </Button>
              )}
              
              {!deleteMode && (
                <Button
                  variant={tableEditMode ? "outlined" : "outlined"}
                  color={tableEditMode ? "error" : "primary"}
                  onClick={toggleTableEditMode}
                  startIcon={tableEditMode ? <CloseIcon /> : <EditIcon />}
                  size="small"
                  disabled={deleteMode}
                >
                  {tableEditMode ? "Annuler" : "Modifier les notes"}
                </Button>
              )}
              
              {!tableEditMode && !deleteMode && (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={toggleDeleteMode}
                  startIcon={<DeleteIcon />}
                  size="small"
                >
                  Supprimer plusieurs corrections
                </Button>
              )}
            </Box>
            
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {deleteMode && (
                      <TableCell padding="checkbox" width="48px">
                        <Checkbox
                          checked={items.length > 0 && items.every(correction => selectedForDelete[correction.id])}
                          indeterminate={items.some(correction => selectedForDelete[correction.id]) && 
                                      !items.every(correction => selectedForDelete[correction.id])}
                          onChange={() => {
                            const allSelected = items.every(correction => selectedForDelete[correction.id]);
                            const newSelectedState = { ...selectedForDelete };
                            items.forEach(correction => {
                              newSelectedState[correction.id] = !allSelected;
                            });
                            setSelectedForDelete(newSelectedState);
                          }}
                          color="error"
                          size="small"
                        />
                      </TableCell>
                    )}
                    <TableCell>Nom</TableCell>
                    <TableCell>Prénom</TableCell>
                    <TableCell>Activité</TableCell>
                    <TableCell align="center">Note exp.</TableCell>
                    <TableCell align="center">Note théo.</TableCell>
                    <TableCell align="center">Total</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((correction) => {
                    const activityData = getActivityById(correction.activity_id);
                    const student = getStudentById(correction.student_id);
                    
                    const isEditing = editingRows[correction.id] || false;
                    const isSaving = savingCorrections[correction.id] || false;
                    const editedValues = editedCorrections[correction.id] || {
                      experimental: correction.experimental_points_earned || 0,
                      theoretical: correction.theoretical_points_earned || 0
                    };
                    
                    // Calculate total grade
                    const totalPoints = (
                      parseFloat((isEditing ? editedValues.experimental : correction.experimental_points_earned || 0).toString()) + 
                      parseFloat((isEditing ? editedValues.theoretical : correction.theoretical_points_earned || 0).toString())
                    );
                    const maxPoints = (
                      parseFloat((activityData?.experimental_points || 5).toString()) + 
                      parseFloat((activityData?.theoretical_points || 15).toString())
                    );
                    const calculatedGrade = (totalPoints / maxPoints) * 20;
                    
                    return (
                      <TableRow 
                        key={correction.id}
                        sx={{ 
                          '&:last-child td, &:last-child th': { border: 0 },
                          backgroundColor: isEditing ? 'rgba(25, 118, 210, 0.08)' : 
                                        (deleteMode && selectedForDelete[correction.id]) ? 'rgba(244, 67, 54, 0.08)' : 'inherit'
                        }}
                        hover
                      >
                        {deleteMode && (
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={!!selectedForDelete[correction.id]}
                            onChange={() => toggleCorrectionSelection(correction.id)}
                            color="error"
                            size="small"
                          />
                        </TableCell>
                        )}
                        <TableCell>{student?.last_name || "N/A"}</TableCell>
                        <TableCell>{student?.first_name || "N/A"}</TableCell>
                        <TableCell>{activityData?.name}</TableCell>
                        
                        {/* Experimental points cell */}
                        <TableCell align="center">
                          {isEditing ? (
                            <Box sx={{ px: 1, width: '100%', maxWidth: 180 }}>
                              <Slider
                                value={editedValues.experimental}
                                onChange={(_, value) => 
                                  handleGradeChange(correction.id, 'experimental', value)
                                }
                                step={0.5}
                                min={0}
                                max={activityData?.experimental_points || 5}
                                valueLabelDisplay="auto"
                                size="small"
                                disabled={isSaving}
                              />
                              <Typography variant="caption" color="text.secondary" display="block" textAlign="center">
                                {editedValues.experimental} / {activityData?.experimental_points || 5}
                              </Typography>
                            </Box>
                          ) : (
                            `${correction.experimental_points_earned || 0} / ${activityData?.experimental_points || 5}`
                          )}
                        </TableCell>
                        
                        {/* Theoretical points cell */}
                        <TableCell align="center">
                          {isEditing ? (
                            <Box sx={{ px: 1, width: '100%', maxWidth: 180 }}>
                              <Slider
                                value={editedValues.theoretical}
                                onChange={(_, value) => 
                                  handleGradeChange(correction.id, 'theoretical', value)
                                }
                                step={0.5}
                                min={0}
                                max={activityData?.theoretical_points || 15}
                                valueLabelDisplay="auto"
                                size="small"
                                disabled={isSaving}
                              />
                              <Typography variant="caption" color="text.secondary" display="block" textAlign="center">
                                {editedValues.theoretical} / {activityData?.theoretical_points || 15}
                              </Typography>
                            </Box>
                          ) : (
                            `${correction.theoretical_points_earned || 0} / ${activityData?.theoretical_points || 15}`
                          )}
                        </TableCell>
                        
                        {/* Total grade cell */}
                        <TableCell align="center">
                          <Chip 
                            label={isEditing 
                              ? `${Number(calculatedGrade.toFixed(1))} / 20` 
                              : correction.active !== 0 
                                ? `${correction.grade} / 20`
                                : "inactive"}
                            color={
                              correction.active === 0 ? "default" :
                              (isEditing ? calculatedGrade : (correction.grade || 0)) < 5 ? "error" :
                              (isEditing ? calculatedGrade : (correction.grade || 0)) < 10 ? "warning" :
                              (isEditing ? calculatedGrade : (correction.grade || 0)) < 15 ? "info" : "success"
                            }
                            size="small"
                            variant={correction.active === 0 ? "outlined" : "filled"}
                            {...(correction.active === 0 && { 
                              sx: { 
                                fontVariant: 'all-small-caps',
                                letterSpacing: '0.5px',
                                opacity: 0.7
                              } 
                            })}
                          />
                        </TableCell>
                        
                        {/* Actions cell */}
                        <TableCell align="center">
                          {isEditing ? (
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                              <IconButton 
                                size="small"
                                color="primary"
                                onClick={() => saveCorrection(correction)}
                                disabled={isSaving}
                                title="Enregistrer"
                              >
                                {isSaving ? <CircularProgress size={18} /> : <SaveIcon fontSize="small" />}
                              </IconButton>
                              <IconButton 
                                size="small"
                                color="error"
                                onClick={() => toggleRowEditMode(correction)}
                                title="Annuler"
                                disabled={isSaving}
                              >
                                <CloseIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          ) : (
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                              
                              <IconButton 
                                size="small"
                                onClick={() => toggleRowEditMode(correction)}
                                title="Modifier"
                                disabled={tableEditMode || deleteMode}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton 
                                size="small" 
                                component={Link}
                                href={`/corrections/${correction.id}`}
                                title="Voir détails"
                                disabled={tableEditMode || deleteMode}
                              >
                                <AssignmentIcon fontSize="small" />
                              </IconButton>
                              <IconButton 
                                size="small"
                                onClick={() => handleDeleteCorrection(correction)}
                                title="Supprimer"
                                color="error"
                                disabled={tableEditMode || deleteMode}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        );
        
      default:
        return null;
    }
  }
}
