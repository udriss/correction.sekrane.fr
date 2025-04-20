'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSnackbar } from 'notistack';
import { 
  Typography, Paper, Button, Alert, Container, Tabs, Tab, Box,
   Card, CardContent, CardActions, Chip, List, ListItem, ListItemText,
    IconButton, Divider, FormControl, InputLabel, Select, MenuItem, Slider, TextField, TableContainer, 
    Table, TableHead, TableRow, TableCell, TableBody, Checkbox, CircularProgress, Tooltip,
    Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText, LinearProgress,
    Switch, FormControlLabel
} from '@mui/material';
import Grid from '@mui/material/Grid';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import BarChartIcon from '@mui/icons-material/BarChart';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import EmailIcon from '@mui/icons-material/Email';
import { alpha } from '@mui/material/styles';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorDisplay from '@/components/ui/ErrorDisplay';
import GradientBackground from '@/components/ui/GradientBackground';
import PatternBackground from '@/components/ui/PatternBackground';
import AssociateActivitiesModal, { Activity as ModalActivity } from "@/components/classes/AssociateActivitiesModal";
import CreateCorrectionsModalAutre from "@/components/corrections/CreateCorrectionsModalAutre";
import { CorrectionAutreEnriched, Class, Student, ActivityAutre } from '@/lib/types';
import ExportPDFComponentAllCorrectionsAutresContainer from '@/components/pdfAutre/ExportPDFComponentAllCorrectionsAutresContainer';
import CorrectionCardAutre from '@/components/allCorrectionsAutres/CorrectionCard';
import { getBatchShareCodes } from '@/lib/services/shareService';
import { changeCorrectionAutreStatus } from '@/lib/services/correctionsAutresService';
import StudentEditDialog from '@/components/students/StudentEditDialog';
import BulkEmailDialog from '@/components/students/BulkEmailDialog';

// Définition des interfaces nécessaires
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// Composant TabPanel pour afficher le contenu des onglets
function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`class-tabpanel-${index}`}
      aria-labelledby={`class-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: { xs: 1, sm: 2 }, pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}
export default function ClassAutreDetailPage({ params }: { params: Promise<{ id: string }> }) {
    // Unwrap the params Promise using React.use()
    const unwrappedParams = React.use(params);
    const { id } = unwrappedParams;
    const classId = id;
  
    const router = useRouter();
    const searchParams = useSearchParams();
    const { enqueueSnackbar } = useSnackbar();
  
    
    // États pour les données de la classe
    const [classData, setClassData] = useState<Class | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [activities, setActivities] = useState<ActivityAutre[]>([]);
    const [corrections, setCorrections] = useState<CorrectionAutreEnriched[]>([]);
    
    // États pour le chargement et les erreurs
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | string | null>(null);
    
    // État pour le dialogue de modification de la classe
    const [editClassDialogOpen, setEditClassDialogOpen] = useState(false);
    const [editingClass, setEditingClass] = useState<{name: string, academic_year: string} | null>(null);
    
    const [associateModalOpen, setAssociateModalOpen] = useState(false);
    const [createCorrectionsModalOpen, setCreateCorrectionsModalOpen] = useState(false);
    
    // États pour l'édition et la suppression d'étudiant
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [confirmingDelete, setConfirmingDelete] = useState<number | null>(null);
    const [selectedClasses, setSelectedClasses] = useState<{id: number, name: string}[]>([]);
    const [availableSubgroups, setAvailableSubgroups] = useState<string[]>([]);
    const [loadingSubgroups, setLoadingSubgroups] = useState(false);
    const [allAvailableClasses, setAllAvailableClasses] = useState<Class[]>([]);
    const [loadingClasses, setLoadingClasses] = useState(false);
    const [subgroupsByClass, setSubgroupsByClass] = useState<Record<number, string[]>>({});
    
    // État pour l'envoi d'emails groupés
    const [bulkEmailDialogOpen, setBulkEmailDialogOpen] = useState(false);
    
    // État pour la mise à jour des données
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    
    // État pour l'onglet actif - récupérer depuis l'URL si disponible
    const [tabValue, setTabValue] = useState(() => {
      const tabParam = searchParams.get('tab');
      return tabParam ? parseInt(tabParam, 10) : 0;
    });
    
    // États pour les filtres et groupements
    const [filterActivity, setFilterActivity] = useState<number | 'all'>('all');
    const [filterSubClass, setFilterSubClass] = useState<string | 'all'>('all');
    const [groupBy, setGroupBy] = useState<'student' | 'activity'>('student');

    // État pour le dialogue de suppression de la classe
    const [deleteClassDialogOpen, setDeleteClassDialogOpen] = useState(false);
    const [deleteOptions, setDeleteOptions] = useState({
      deleteStudents: true,
      deleteCorrections: true
    });
    const [deleteProgress, setDeleteProgress] = useState({
      isDeleting: false,
      total: 0,
      current: 0,
      step: '',
      error: null as string | null
    });
  
  // Fonction pour gérer le changement d'onglet
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    
    // Mettre à jour l'URL avec le numéro d'onglet actif
    const url = new URL(window.location.href);
    url.searchParams.set('tab', newValue.toString());
    
    // Mettre à jour l'URL sans rafraîchir la page
    window.history.pushState({}, '', url.toString());
  };
  

  
  // Fonction pour gérer la fermeture du dialogue d'édition
  const handleEditClose = () => {
    setOpenEditDialog(false);
    setEditingStudent(null);
    setSelectedClasses([]);
  };
  
  // Fonction pour enregistrer les modifications d'un étudiant
  const handleEditSave = async () => {
    if (!editingStudent || !editingStudent.id) return;
    
    try {
      // Préparation des données pour la mise à jour de l'étudiant
      const studentUpdate = {
        ...editingStudent,
        classId: classData?.id,
        // Si la classe a des sous-groupes, utiliser le sous-groupe sélectionné
        sub_class: editingStudent.group || editingStudent.sub_class
      };
      
      // Appel API pour mettre à jour l'étudiant
      const response = await fetch(`/api/students/${editingStudent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(studentUpdate),
      });
      
      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour de l'étudiant");
      }
      
      // Succès
      enqueueSnackbar(`Étudiant ${editingStudent.first_name} mis à jour avec succès`, { variant: 'success' });
      
      // Fermer le dialogue et rafraîchir les données
      handleEditClose();
      refreshClass();
    } catch (err) {
      console.error('Erreur:', err);
      enqueueSnackbar(err instanceof Error ? err.message : 'Une erreur est survenue', { variant: 'error' });
    }
  };
  
  // Fonction pour supprimer un étudiant (afficher confirmation)
  const handleDeleteClick = (studentId: number) => {
    setConfirmingDelete(studentId);
  };
  
  // Fonction pour annuler la suppression
  const handleCancelDelete = () => {
    setConfirmingDelete(null);
  };
  
  // Fonction pour confirmer la suppression d'un étudiant
  const handleConfirmDelete = async (studentId: number) => {
    try {
      const response = await fetch(`/api/students/${studentId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error("Erreur lors de la suppression de l'étudiant");
      }
      
      // Succès
      enqueueSnackbar('Étudiant supprimé avec succès', { variant: 'success' });
      
      // Réinitialiser et rafraîchir
      setConfirmingDelete(null);
      refreshClass();
    } catch (err) {
      console.error('Erreur:', err);
      enqueueSnackbar(err instanceof Error ? err.message : 'Une erreur est survenue', { variant: 'error' });
    }
  };
  
  // Fonction pour récupérer les sous-groupes d'une classe
  const fetchClassSubgroups = async (classId: number) => {
    setLoadingSubgroups(true);
    try {
      const response = await fetch(`/api/classes/${classId}`);
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des données de la classe");
      }
      
      const classData = await response.json();
      if (classData && classData.nbre_subclasses) {
        const subgroups = Array.from(
          { length: classData.nbre_subclasses },
          (_, i) => (i + 1).toString()
        );
        setAvailableSubgroups(subgroups);
      } else {
        setAvailableSubgroups([]);
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des sous-groupes:', err);
      setAvailableSubgroups([]);
    } finally {
      setLoadingSubgroups(false);
    }
  };
  
  // Effet pour charger les données de la classe
  useEffect(() => {
    const fetchClassData = async () => {
      try {
        setLoading(true);
        
        // Récupérer les détails de la classe
        const classResponse = await fetch(`/api/classes/${classId}`);
        if (!classResponse.ok) {
          const errorData = await classResponse.json().catch(() => ({ error: 'Erreur lors du chargement des données de la classe' }));
          // Créer une instance d'Error et y attacher les détails
          const error = new Error('Erreur lors du chargement des données de la classe : ' + errorData.error || 'Erreur lors du chargement des données de la classe');
          (error as any).details = errorData.details || {};
          setError(error);
          throw error;
        }
        const classDataResponse = await classResponse.json();
        setClassData(classDataResponse);
        
        // Récupérer les étudiants de la classe
        const studentsResponse = await fetch(`/api/classes/${classId}/students`);
        if (!studentsResponse.ok) {
          const errorData = await studentsResponse.json().catch(() => ({ error: 'Erreur lors du chargement des étudiants' }));
          // Créer une instance d'Error et y attacher les détails
          const error = new Error('Erreur lors du chargement des étudiants : ' + errorData.error || 'Erreur lors du chargement des étudiants');
          (error as any).details = errorData.details || {};
          setError(error);
          throw error;
        }
        const studentsData = await studentsResponse.json();
        setStudents(studentsData);
        
        // Récupérer les activités associées à la classe
        const activitiesResponse = await fetch(`/api/classes/${classId}/activities`);
        if (!activitiesResponse.ok) {
          const errorData = await activitiesResponse.json().catch(() => ({ error: 'Erreur lors du chargement des activités' }));
          // Créer une instance d'Error et y attacher les détails
          const error = new Error('Erreur lors du chargement des activités : ' + errorData.error || 'Erreur lors du chargement des activités');
          (error as any).details = errorData.details || {};
          setError(error);
          throw error;
        }
        const activitiesData = await activitiesResponse.json();
        setActivities(activitiesData);
        
        // Récupérer les corrections de la classe
        const correctionsResponse = await fetch(`/api/classes/${classId}/corrections`);
        if (!correctionsResponse.ok) {
          const errorData = await correctionsResponse.json().catch(() => ({ error: 'Erreur lors du chargement des corrections' }));
          // Créer une instance d'Error et y attacher les détails
          const error = new Error('Erreur lors du chargement des corrections : ' + errorData.error || 'Erreur lors du chargement des corrections');
          (error as any).details = errorData.details || {};
          setError(error);
          throw error;
        }
        const correctionsData = await correctionsResponse.json();
        setCorrections(correctionsData);
        
      } catch (err) {
        console.error('Error fetching class:', err);
        // Si nous n'avons pas déjà défini l'erreur (avec des détails) ci-dessus
        if (!error) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchClassData();
  }, [classId, refreshTrigger]);
  
  // Rafraîchir les données de la classe
  const refreshClass = () => {
    setRefreshTrigger(prev => prev + 1);
  };
  
  // Fonction pour changer le statut d'une correction
  const handleChangeStatus = async (correctionId: number, newStatus: string): Promise<void> => {
    try {
      await changeCorrectionAutreStatus(correctionId, newStatus);
      enqueueSnackbar(`Statut de la correction mis à jour avec succès`, { variant: 'success' });
      refreshClass();
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
      enqueueSnackbar(`Erreur lors de la mise à jour du statut: ${error instanceof Error ? error.message : 'Erreur inconnue'}`, { variant: 'error' });
    }
  };
  
  // Fonction pour associer une activité à la classe
  const handleAssociateActivity = async (activitiesToAdd: ModalActivity[], activitiesToRemove: ModalActivity[]): Promise<void> => {
    try {
      // Gérer les ajouts d'activités
      if (activitiesToAdd.length > 0) {
        const activityIdsToAdd = activitiesToAdd.map(a => a.id);
        const response = await fetch(`/api/classes/${classId}/activities`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ activity_ids: activityIdsToAdd }),
        });
        
        if (!response.ok) {
          throw new Error("Erreur lors de l'association des activités");
        }
      }
      
      // Gérer les suppressions d'activités
      for (const activity of activitiesToRemove) {
        const response = await fetch(`/api/classes/${classId}/activities/${activity.id}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error(`Erreur lors de la dissociation de l'activité ${activity.name}`);
        }
      }
      
      enqueueSnackbar(
        `${activitiesToAdd.length} activité(s) ajoutée(s), ${activitiesToRemove.length} activité(s) supprimée(s)`, 
        { variant: 'success' }
      );
      refreshClass();
      setAssociateModalOpen(false);
    } catch (err) {
      console.error('Erreur:', err);
      enqueueSnackbar(err instanceof Error ? err.message : 'Une erreur est survenue', { variant: 'error' });
    }
  };
  // Fonction pour dissocier une activité de la classe
  const handleDisassociateActivity = async (activityId: number) => {
    try {
      const response = await fetch(`/api/classes/${classId}/activities`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ activityId }),
      });
      
      if (!response.ok) {
        throw new Error("Erreur lors de la dissociation de l'activité");
      }
      
      enqueueSnackbar('Activité dissociée avec succès', { variant: 'success' });
      refreshClass();
    } catch (err) {
      console.error('Erreur:', err);
      enqueueSnackbar(err instanceof Error ? err.message : 'Une erreur est survenue', { variant: 'error' });
    }
  };
  
  // Fonction pour créer des corrections en masse
  const handleCreateCorrections = async (data: { 
    activityId: number; 
    studentIds: number[]; 
    createGroup: boolean; 
    groupName?: string;
  }) => {
    try {
      const response = await fetch('/api/corrections_autres/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activity_id: data.activityId,
          student_ids: data.studentIds,
          class_id: parseInt(classId),
          create_group: data.createGroup,
          group_name: data.groupName,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur lors de la création des corrections");
      }
      
      const result = await response.json();
      enqueueSnackbar(`${result.count} corrections créées avec succès`, { variant: 'success' });
      
      refreshClass();
      setCreateCorrectionsModalOpen(false);
    } catch (err) {
      console.error('Erreur:', err);
      enqueueSnackbar(err instanceof Error ? err.message : 'Une erreur est survenue', { variant: 'error' });
    }
  };
  
  // Calcul des statistiques pour la classe
  const classStats = useMemo(() => {
    if (!corrections || corrections.length === 0) {
      return {
        totalCorrections: 0,
        averageGrade: 0,
        studentsCovered: 0,
        activitiesCovered: 0,
      };
    }
    
    // Calculer les statistiques de base
    const validGrades = corrections.filter(c => c.grade !== null && c.grade !== undefined);
    const totalGrade = validGrades.reduce((sum, c) => {
      // Convertir les grades de type string en nombre
      const gradeValue = typeof c.grade === 'string' 
        ? parseFloat(c.grade) 
        : (c.grade || 0);
      
      // Utiliser 0 si la conversion échoue (NaN)
      return sum + (isNaN(gradeValue) ? 0 : gradeValue);
    }, 0);
    
    const averageGrade = validGrades.length > 0 ? totalGrade / validGrades.length : 0;
    
    // Compter les étudiants et activités uniques
    const uniqueStudents = new Set(corrections.map(c => c.student_id));
    const uniqueActivities = new Set(corrections.map(c => c.activity_id));
    
    return {
      totalCorrections: corrections.length,
      averageGrade: averageGrade,
      studentsCovered: uniqueStudents.size,
      activitiesCovered: uniqueActivities.size,
    };
  }, [corrections]);
  
  // Filtrer les corrections selon les critères actuels
  const filteredCorrections = useMemo(() => {
    if (!corrections) return [];
    
    return corrections.filter(correction => {
      // Filtrer par activité
      if (filterActivity !== 'all' && correction.activity_id !== filterActivity) {
        return false;
      }
      
      // Filtrer par sous-classe en utilisant les données des étudiants
      if (filterSubClass !== 'all') {
        // Trouver l'étudiant associé à cette correction
        const student = students.find(s => s.id === correction.student_id);
        // Vérifier si l'étudiant appartient au groupe de filtrage
        if (!student || student.sub_class?.toString() !== filterSubClass) {
          return false;
        }
      }
      
      return true;
    });
  }, [corrections, filterActivity, filterSubClass, students]);
  
  // Grouper les corrections selon le critère choisi
  const groupedCorrections = useMemo(() => {
    if (!filteredCorrections || filteredCorrections.length === 0) {
      return [];
    }
    
    if (groupBy === 'student') {
      // Grouper par étudiant
      const studentGroups = new Map<number, CorrectionAutreEnriched[]>();
      
      filteredCorrections.forEach(correction => {
        // Vérifier que student_id n'est pas null
        const studentId = correction.student_id ?? 0; // Utiliser 0 comme fallback si null
        
        if (!studentGroups.has(studentId)) {
          studentGroups.set(studentId, []);
        }
        studentGroups.get(studentId)?.push(correction);
      });
      
      return Array.from(studentGroups.entries()).map(([studentId, studentCorrections]) => {
        const firstCorrection = studentCorrections[0];
        
        // Calculer la moyenne des notes pour cet étudiant
        const validGrades = studentCorrections
          .filter(c => c.grade !== null && c.grade !== undefined)
          .map(c => {
            // Convertir les grades de type string en nombre
            if (typeof c.grade === 'string') {
              const parsedGrade = parseFloat(c.grade);
              return isNaN(parsedGrade) ? 0 : parsedGrade;
            }
            return c.grade as number;
          });
          
        const averageGrade = validGrades.length > 0
          ? validGrades.reduce((sum, grade) => sum + grade, 0) / validGrades.length
          : 0;
        
        return {
          id: studentId,
          name: firstCorrection.student_name || 'Étudiant inconnu',
          corrections: studentCorrections,
          averageGrade,
          count: studentCorrections.length,
        };
      });
    } else {
      // Grouper par activité
      const activityGroups = new Map<number, CorrectionAutreEnriched[]>();
      
      filteredCorrections.forEach(correction => {
        if (!activityGroups.has(correction.activity_id)) {
          activityGroups.set(correction.activity_id, []);
        }
        activityGroups.get(correction.activity_id)?.push(correction);
      });
      
      return Array.from(activityGroups.entries()).map(([activityId, activityCorrections]) => {
        const firstCorrection = activityCorrections[0];
        
        // Calculer la moyenne des notes pour cette activité
        const validGrades = activityCorrections
          .filter(c => c.grade !== null && c.grade !== undefined)
          .map(c => {
            // Convertir les grades de type string en nombre
            if (typeof c.grade === 'string') {
              const parsedGrade = parseFloat(c.grade);
              return isNaN(parsedGrade) ? 0 : parsedGrade;
            }
            return c.grade as number;
          });
          
        const averageGrade = validGrades.length > 0
          ? validGrades.reduce((sum, grade) => sum + grade, 0) / validGrades.length
          : 0;
        
        return {
          id: activityId,
          name: firstCorrection.activity_name || 'Activité inconnue',
          corrections: activityCorrections,
          averageGrade,
          count: activityCorrections.length,
        };
      });
    }
  }, [filteredCorrections, groupBy]);
  
  // Obtenir les sous-classes disponibles
  const availableSubClasses = useMemo(() => {
    if (!classData || !classData.nbre_subclasses) return [];
    
    return Array.from(
      { length: classData.nbre_subclasses },
      (_, index) => ({
        id: (index + 1).toString(),
        name: `Groupe ${index + 1}`
      })
    );
  }, [classData]);
  
  // Extract unique activities for the PDF export component
  const uniqueActivities = useMemo(() => {
    return activities.map(activity => ({
      id: activity.id,
      name: activity.name
    }));
  }, [activities]);
  
  // Déterminer la couleur selon la note
  const getGradeColor = (grade: number): "success" | "info" | "primary" | "warning" | "error" => {
    if (grade >= 16) return 'success';
    if (grade >= 12) return 'info';
    if (grade >= 10) return 'primary';
    if (grade >= 8) return 'warning';
    return 'error';
  };
  

// Fonction pour récupérer les sous-groupes d'une classe spécifique
const fetchSubgroupsForClass = async (classId: number) => {
  try {
    setLoadingSubgroups(true);
    const response = await fetch(`/api/classes/${classId}`);
    if (!response.ok) {
      throw new Error(`Erreur lors de la récupération des données de la classe ${classId}`);
    }
    
    const fetchedClassData = await response.json();
    if (fetchedClassData && fetchedClassData.nbre_subclasses) {
      const subgroups = Array.from(
        { length: fetchedClassData.nbre_subclasses },
        (_, i) => (i + 1).toString()
      );
      
      // Mettre à jour le dictionnaire des sous-groupes par classe
      setSubgroupsByClass(prev => ({
        ...prev,
        [classId]: subgroups
      }));
      
      // Si c'est la classe actuelle, mettre à jour aussi les sous-groupes disponibles
      if (classId === parseInt(id)) {
        setAvailableSubgroups(subgroups);
      }
      
      return subgroups;
    }
    
    return [];
  } catch (err) {
    console.error(`Erreur lors de la récupération des sous-groupes pour la classe ${classId}:`, err);
    return [];
  } finally {
    setLoadingSubgroups(false);
  }
};

// Fonction pour préparer l'édition d'un étudiant avec toutes les classes disponibles
const handleOpenEditDialog = async (student: Student) => {
  try {
    setLoadingClasses(true);
    
    // Récupérer toutes les classes disponibles
    const allClassesResponse = await fetch('/api/classes');
    if (!allClassesResponse.ok) {
      throw new Error("Erreur lors de la récupération des classes disponibles");
    }
    
    const allClassesData = await allClassesResponse.json();
    setAllAvailableClasses(allClassesData);
    
    // Créer un objet student enrichi avec des informations supplémentaires
    const studentToEdit = {
      ...student,
      // Initialiser allClasses si nécessaire
      allClasses: student.allClasses || [{
        classId: parseInt(classId),
        className: classData?.name || 'Classe actuelle',
        // Convertir sub_class en string si c'est un nombre
        sub_class: student.sub_class ? String(student.sub_class) : null
      }]
    };
    
    setEditingStudent(studentToEdit);
    
    // Par défaut, l'étudiant est dans la classe actuelle
    const initialSelectedClasses = [{ 
      id: parseInt(classId), 
      name: classData?.name || 'Classe actuelle' 
    }];
    
    setSelectedClasses(initialSelectedClasses);
    
    // Charger les sous-groupes pour la classe actuelle
    if (classData?.nbre_subclasses) {
      const subgroups = Array.from({ length: classData.nbre_subclasses }, (_, i) => (i + 1).toString());
      setAvailableSubgroups(subgroups);
      
      // Initialiser le dictionnaire des sous-groupes
      setSubgroupsByClass({
        [parseInt(classId)]: subgroups
      });
    }
    
    // Charger les sous-groupes pour toutes les classes auxquelles l'étudiant appartient
    if (student.allClasses && Array.isArray(student.allClasses)) {
      for (const cls of student.allClasses) {
        if (cls.classId !== parseInt(classId)) {
          await fetchSubgroupsForClass(cls.classId);
        }
      }
    }
    
    setOpenEditDialog(true);
  } catch (err) {
    console.error('Erreur lors de la préparation du dialogue d\'édition:', err);
    enqueueSnackbar('Erreur lors de la préparation du formulaire d\'édition', { variant: 'error' });
  } finally {
    setLoadingClasses(false);
  }
};

// Fonction pour ouvrir le dialogue de modification de la classe
const handleEditClassOpen = () => {
  if (classData) {
    setEditingClass({
      name: classData.name,
      academic_year: classData.academic_year || ''
    });
    setEditClassDialogOpen(true);
  }
};

// Fonction pour fermer le dialogue de modification de la classe
const handleEditClassClose = () => {
  setEditClassDialogOpen(false);
  setEditingClass(null);
};

// Fonction pour sauvegarder les modifications de la classe
const handleEditClassSave = async () => {
  if (!editingClass) return;
  
  try {
    const response = await fetch(`/api/classes/${classId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: editingClass.name,
        academic_year: editingClass.academic_year
      }),
    });
    
    if (!response.ok) {
      throw new Error("Erreur lors de la mise à jour de la classe");
    }
    
    // Succès
    enqueueSnackbar("Classe mise à jour avec succès", { variant: 'success' });
    
    // Fermer le dialogue et rafraîchir les données
    handleEditClassClose();
    refreshClass();
  } catch (err) {
    console.error('Erreur:', err);
    enqueueSnackbar(err instanceof Error ? err.message : 'Une erreur est survenue', { variant: 'error' });
  }
};

// Fonction pour ouvrir le dialogue de suppression de la classe
const handleOpenDeleteClassDialog = () => {
  setDeleteClassDialogOpen(true);
  setDeleteProgress({
    isDeleting: false,
    total: 0,
    current: 0,
    step: '',
    error: null
  });
};

// Fonction pour fermer le dialogue de suppression de la classe
const handleCloseDeleteClassDialog = () => {
  if (!deleteProgress.isDeleting) {
    setDeleteClassDialogOpen(false);
  }
};

// Fonction pour gérer les changements d'options de suppression
const handleDeleteOptionChange = (option: 'deleteStudents' | 'deleteCorrections') => {
  setDeleteOptions(prev => ({
    ...prev,
    [option]: !prev[option]
  }));
};

// Fonction pour supprimer la classe
const handleDeleteClass = async () => {
  // Mettre à jour l'état de suppression
  setDeleteProgress({
    isDeleting: true,
    total: 1 + (deleteOptions.deleteStudents ? students.length : 0) + (deleteOptions.deleteCorrections ? corrections.length : 0),
    current: 0,
    step: 'Préparation de la suppression...',
    error: null
  });

  try {
    // Étape 1: Supprimer les corrections si l'option est sélectionnée
    if (deleteOptions.deleteCorrections && corrections.length > 0) {
      setDeleteProgress(prev => ({
        ...prev,
        step: 'Suppression des corrections...'
      }));

      // Supprimer les corrections une par une pour pouvoir suivre la progression
      for (let i = 0; i < corrections.length; i++) {
        const correction = corrections[i];
        try {
          await fetch(`/api/corrections_autres/${correction.id}`, {
            method: 'DELETE'
          });
          
          // Mettre à jour la progression
          setDeleteProgress(prev => ({
            ...prev,
            current: prev.current + 1,
            step: `Suppression des corrections (${i + 1}/${corrections.length})...`
          }));
        } catch (error) {
          console.error(`Erreur lors de la suppression de la correction ${correction.id}:`, error);
          // Continuer malgré l'erreur
        }

        // Petite pause pour éviter de surcharger l'API
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    // Étape 2: Supprimer les étudiants si l'option est sélectionnée
    if (deleteOptions.deleteStudents && students.length > 0) {
      setDeleteProgress(prev => ({
        ...prev,
        step: 'Suppression des étudiants...'
      }));

      // Supprimer les étudiants un par un pour pouvoir suivre la progression
      for (let i = 0; i < students.length; i++) {
        const student = students[i];
        try {
          await fetch(`/api/classes/${classId}/students/${student.id}`, {
            method: 'DELETE'
          });
          
          // Mettre à jour la progression
          setDeleteProgress(prev => ({
            ...prev,
            current: prev.current + 1,
            step: `Suppression des étudiants (${i + 1}/${students.length})...`
          }));
        } catch (error) {
          console.error(`Erreur lors de la suppression de l'étudiant ${student.id}:`, error);
          // Continuer malgré l'erreur
        }

        // Petite pause pour éviter de surcharger l'API
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    // Étape 3: Supprimer la classe
    setDeleteProgress(prev => ({
      ...prev,
      step: 'Suppression de la classe...'
    }));

    const response = await fetch(`/api/classes/${classId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Erreur lors de la suppression de la classe');
    }

    // Mettre à jour la progression
    setDeleteProgress(prev => ({
      ...prev,
      current: prev.current + 1,
      step: 'Classe supprimée avec succès !'
    }));

    // Afficher un message de succès
    enqueueSnackbar('La classe a été supprimée avec succès', { variant: 'success' });

    // Rediriger vers la liste des classes après 1 seconde
    setTimeout(() => {
      router.push('/classes');
    }, 1000);
  } catch (error) {
    console.error('Erreur lors de la suppression de la classe:', error);
    
    // Mettre à jour la progression avec l'erreur
    setDeleteProgress(prev => ({
      ...prev,
      isDeleting: false,
      error: error instanceof Error ? error.message : 'Une erreur est survenue lors de la suppression'
    }));

    // Afficher un message d'erreur
    enqueueSnackbar(
      error instanceof Error ? error.message : 'Une erreur est survenue lors de la suppression', 
      { variant: 'error' }
    );
  }
};

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <LoadingSpinner size="lg" text="Chargement des données de la classe..." />
        </Box>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <ErrorDisplay
          error={error}
          errorDetails={
            error && typeof error === 'object' && 'details' in error
              ? (error as any).details
              : undefined
          }
          onRefresh={() => {
            setError('');
            window.location.reload();
          }}
          withRefreshButton={true}
        />
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="contained"
            component={Link}
            href="/classes"
            startIcon={<ArrowBackIcon />}
          >
            Retour à la liste des classes
          </Button>
        </Box>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* En-tête avec informations de la classe */}
      <Paper elevation={3} sx={{ borderRadius: 3, overflow: 'hidden', mb: 4 }}>
        <GradientBackground variant="primary">
          <PatternBackground
            pattern="dots"
            opacity={0.05}
            sx={{ p: 4, borderRadius: 0 }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
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
                  <Typography variant="h4" fontWeight={700} color="text.primary">
                    {classData?.name || 'Classe'}
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary" sx={{ opacity: 0.9 }}>
                    Année scolaire: {classData?.academic_year || '-'} | {students.length} étudiants
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  color="primary"
                  sx={{ alignSelf: 'flex-start',
                    fontWeight: 700,
                   }}
                  startIcon={<EditIcon />}
                  onClick={handleEditClassOpen}
                >
                  Modifier
                </Button>
                
                <Button
                  variant="contained"
                  color="error"
                  sx={{ alignSelf: 'flex-start',
                    fontWeight: 700,
                   }}
                  startIcon={<DeleteIcon />}
                  onClick={handleOpenDeleteClassDialog}
                >
                  Supprimer
                </Button>
                
                <Button
                  sx={{ alignSelf: 'flex-start',
                    fontWeight: 700,
                   }}
                  variant="contained"
                  color="secondary"
                  startIcon={<PeopleAltIcon />}
                  component={Link}
                  href={`/classes/${classId}/students`}
                >
                  Gérer les étudiants
                </Button>
              </Box>
            </Box>
          </PatternBackground>
        </GradientBackground>
      </Paper>
      
      {/* Statistiques de la classe */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BarChartIcon color="primary" />
            Statistiques de la classe
          </Typography>
          
          <Button
            variant="outlined"
            color="primary"
            startIcon={<EmailIcon />}
            onClick={() => setBulkEmailDialogOpen(true)}
            disabled={students.length === 0}
          >
            Envoyer les corrections
          </Button>
        </Box>
        
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper sx={{ 
              p: 2, 
              textAlign: 'center', 
              height: '100%',
              bgcolor: (theme) => alpha(theme.palette.myBoxes.primary, 0.5),
              backdropFilter: 'blur(5px)',
              borderRadius: 2,
            }}>
              <Typography variant="overline" color="text.secondary">Total</Typography>
              <Typography variant="h3" fontWeight="bold" color="text.primary">
                {classStats.totalCorrections}
              </Typography>
              <Typography variant="overline" color="text.secondary">
                corrections
              </Typography>
            </Paper>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper sx={{ 
              p: 2, 
              textAlign: 'center', 
              height: '100%',
              bgcolor: (theme) => alpha(theme.palette.myBoxes.primary, 0.5),
              backdropFilter: 'blur(5px)',
              borderRadius: 2,
            }}>
              <Typography variant="overline" color="text.secondary">Moyenne</Typography>
              <Typography variant="h3" fontWeight="bold" color="text.primary">
                {classStats.totalCorrections > 0 
                  ? classStats.averageGrade.toFixed(1) 
                  : '-'}
              </Typography>
              <Typography variant="overline" color="text.secondary">sur 20</Typography>
            </Paper>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper sx={{ 
              p: 2, 
              textAlign: 'center', 
              height: '100%',
              bgcolor: (theme) => alpha(theme.palette.myBoxes.primary, 0.5),
              backdropFilter: 'blur(5px)',
              borderRadius: 2,
            }}>
              <Typography variant="overline" color="text.secondary">Étudiants</Typography>
              <Typography variant="h3" fontWeight="bold" color="text.primary">
                {classStats.studentsCovered} / {students.length}
              </Typography>
              <Typography variant="overline" color="text.secondary">
                avec corrections
              </Typography>
            </Paper>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper sx={{ 
              p: 2, 
              textAlign: 'center', 
              height: '100%',
              bgcolor: (theme) => alpha(theme.palette.myBoxes.primary, 0.5),
              backdropFilter: 'blur(5px)',
              borderRadius: 2,
            }}>
              <Typography variant="overline" color="text.secondary">Activités</Typography>
              <Typography variant="h3" fontWeight="bold" color="text.primary">
                {classStats.activitiesCovered} / {activities.length}
              </Typography>
              <Typography variant="overline" color="text.secondary">
                avec corrections
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Onglets pour les différentes sections */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 1 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          aria-label="class tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Activités" />
          <Tab label="Étudiants" />
          <Tab label="Toutes les corrections" />
          <Tab label="Export PDF" />
        </Tabs>
      </Box>
      
      {/* Contenu pour l'onglet Activités */}
      <TabPanel value={tabValue} index={0}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h6">
            Activités associées ({activities.length})
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setAssociateModalOpen(true)}
          >
            Associer des activités
          </Button>
        </Box>
        
        {activities.length === 0 ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            Aucune activité n'est associée à cette classe.
          </Alert>
        ) : (
          <Grid container spacing={2}>
            {activities.map((activity) => {
              // Compter les corrections pour cette activité
              const activityCorrections = corrections.filter(c => c.activity_id === activity.id);
              const totalStudentsWithCorrections = new Set(activityCorrections.map(c => c.student_id)).size;
              
              // Calculer la note moyenne pour cette activité
              const validGrades = activityCorrections
                .filter(c => c.grade !== null && c.grade !== undefined)
                .map(c => {
                  // Convertir les grades de type string en nombre
                  if (typeof c.grade === 'string') {
                    const parsedGrade = parseFloat(c.grade);
                    return isNaN(parsedGrade) ? 0 : parsedGrade;
                  }
                  return c.grade as number;
                });
                
              const averageGrade = validGrades.length > 0
                ? validGrades.reduce((sum, grade) => sum + grade, 0) / validGrades.length
                : null;
              
              return (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={activity.id}>
                  <Card 
                    elevation={2}
                    sx={{ 
                      height: '100%', 
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 8
                      }
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" component="div" gutterBottom>
                        {activity.name}
                      </Typography>
                      
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {activity.parts_names && activity.parts_names.length > 0 ? (
                            <>Parties: {activity.parts_names.join(', ')}</>
                          ) : (
                            <>Activité sans parties spécifiées</>
                          )}
                        </Typography>
                        
                        <Typography variant="body2" color="text.secondary">
                          Points: {activity.points ? activity.points.reduce((sum, p) => sum + p, 0) : 0} points
                        </Typography>
                      </Box>
                      
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" gutterBottom>
                          <strong>{totalStudentsWithCorrections}</strong> / {students.length} étudiants ont des corrections
                        </Typography>
                        
                        {averageGrade !== null && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2">
                              Note moyenne:
                            </Typography>
                            <Chip 
                              label={`${averageGrade.toFixed(1)}/20`}
                              color={getGradeColor(averageGrade)}
                              size="small"
                            />
                          </Box>
                        )}
                      </Box>
                    </CardContent>
                    
                    <Divider />
                    
                    <CardActions>
                      <Button 
                        size="small" 
                        component={Link}
                        href={`/activities/${activity.id}`}
                      >
                        Voir
                      </Button>
                      <Button 
                        size="small" 
                        color="primary"
                        component={Link}
                        href={`/activities/${activity.id}/corrections/multiples?classId=${classId}`}
                      >
                        Ajouter corrections
                      </Button>
                      <Button 
                        size="small" 
                        color="error"
                        onClick={() => handleDisassociateActivity(activity.id)}
                      >
                        Dissocier
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </TabPanel>
      
      {/* Contenu pour l'onglet Étudiants */}
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h6">
            Étudiants de la classe ({students.length})
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            component={Link}
            href={`/classes/${classId}/students`}
            startIcon={<PeopleAltIcon />}
          >
            Gérer les étudiants
          </Button>
        </Box>
        
        {students.length === 0 ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            Aucun étudiant n'est inscrit dans cette classe.
          </Alert>
        ) : (
          <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nom</TableCell>
                  <TableCell>Groupe</TableCell>
                  <TableCell>Corrections</TableCell>
                  <TableCell>Note moyenne</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students.map((student) => {
                  // Trouver les corrections pour cet étudiant
                  const studentCorrections = corrections.filter(c => c.student_id === student.id);
                  
                  // Calculer la moyenne des notes pour cet étudiant
                  const validGrades = studentCorrections
                    .filter(c => c.grade !== null && c.grade !== undefined)
                    .map(c => {
                      // Convertir les grades de type string en nombre
                      if (typeof c.grade === 'string') {
                        const parsedGrade = parseFloat(c.grade);
                        return isNaN(parsedGrade) ? 0 : parsedGrade;
                      }
                      return c.grade as number;
                    });
                    
                  const averageGrade = validGrades.length > 0
                    ? validGrades.reduce((sum, grade) => sum + grade, 0) / validGrades.length
                    : 0;
                  
                  return (
                    <TableRow key={student.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PersonIcon color="action" fontSize="small" />
                          <Typography>
                            {`${student.first_name} ${student.last_name}`}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {student.sub_class ? (
                          <Chip 
                            size="small" 
                            label={`Groupe ${student.sub_class}`} 
                            color="info" 
                            variant="outlined"
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            -
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {studentCorrections.length > 0 ? (
                          <Chip 
                            size="small"
                            label={studentCorrections.length}
                            color="success"
                            component={Link}
                            href={`/students/${student.id}`}
                            clickable
                            sx={{ 
                              cursor: 'pointer',
                              '&:hover': { 
                                boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                                backgroundColor: 'rgba(46, 125, 50, 0.08)'
                              }
                            }}
                          />
                        ) : (
                          <Chip 
                            size="small"
                            label="0"
                            color="default"
                            variant="outlined"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {averageGrade !== null ? (
                          <Chip 
                            label={`${averageGrade.toFixed(1)}/20`}
                            color={getGradeColor(averageGrade)}
                            size="small"
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            -
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                          <Tooltip title="Modifier étudiant">
                            <IconButton
                              size="small"
                              sx={{ color: theme => theme.palette.text.secondary }}
                              onClick={() => handleOpenEditDialog(student)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Consulter étudiant">
                                <IconButton
                                size="small"
                                color="info"
                                component={student?.id ? Link : 'button'}
                                href={student?.id ? `/students/${student.id}` : undefined}
                                target="_blank"
                                rel="noopener noreferrer"
                                disabled={!student?.id}
                                >
                                {student?.id ? (
                                  <OpenInNewIcon fontSize="small" />
                                ) : (
                                  <LinkOffIcon fontSize="small" />
                                )}
                                </IconButton>
                          </Tooltip>

                          
                          {confirmingDelete === student.id ? (
                            <>
                              <Tooltip title="Confirmer la suppression">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => handleConfirmDelete(student.id!)}
                                >
                                  <CheckIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Annuler">
                                <IconButton
                                  size="small"
                                  color="inherit"
                                  onClick={handleCancelDelete}
                                >
                                  <CloseIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          ) : (
                            <Tooltip title="Effacer étudiant">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteClick(student.id!)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </TabPanel>
      
      {/* Contenu pour l'onglet Toutes les corrections */}
      <TabPanel value={tabValue} index={2}>
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Typography variant="h6">
              Corrections filtrées ({filteredCorrections.length} sur {corrections.length})
            </Typography>
            {filteredCorrections.length > 0 && (
              <Chip
                label={`Moyenne: ${(() => {
                  const validGrades = filteredCorrections
                    .filter(c => c.grade !== null && c.grade !== undefined)
                    .map(c => {
                      if (typeof c.grade === 'string') {
                        const parsedGrade = parseFloat(c.grade);
                        return isNaN(parsedGrade) ? 0 : parsedGrade;
                      }
                      return c.grade as number;
                    });
                  
                  if (validGrades.length === 0) return '0.0';
                  
                  const avg = validGrades.reduce((sum, grade) => sum + grade, 0) / validGrades.length;
                  return avg.toFixed(1);
                })()} / 20`}
                color={(() => {
                  const validGrades = filteredCorrections
                    .filter(c => c.grade !== null && c.grade !== undefined)
                    .map(c => {
                      if (typeof c.grade === 'string') {
                        const parsedGrade = parseFloat(c.grade);
                        return isNaN(parsedGrade) ? 0 : parsedGrade;
                      }
                      return c.grade as number;
                    });
                  
                  if (validGrades.length === 0) return 'default';
                  
                  const avg = validGrades.reduce((sum, grade) => sum + grade, 0) / validGrades.length;
                  return getGradeColor(avg);
                })()}
                size="medium"
                sx={{ fontWeight: 'bold' }}
              />
            )}
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel id="activity-filter-label">Filtrer par activité</InputLabel>
              <Select
                labelId="activity-filter-label"
                value={filterActivity}
                label="Filtrer par activité"
                onChange={(e) => setFilterActivity(e.target.value as number | 'all')}
              >
                <MenuItem value="all">Toutes les activités</MenuItem>
                {activities.map(activity => (
                  <MenuItem key={activity.id} value={activity.id}>
                    {activity.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {availableSubClasses.length > 0 && (
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel id="subclass-filter-label">Filtrer par groupe</InputLabel>
                <Select
                  labelId="subclass-filter-label"
                  value={filterSubClass}
                  label="Filtrer par groupe"
                  onChange={(e) => setFilterSubClass(e.target.value)}
                >
                  <MenuItem value="all">Tous les groupes</MenuItem>
                  {availableSubClasses.map(subClass => (
                    <MenuItem key={subClass.id} value={subClass.id}>
                      {subClass.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel id="group-by-label">Grouper par</InputLabel>
              <Select
                labelId="group-by-label"
                value={groupBy}
                label="Grouper par"
                onChange={(e) => setGroupBy(e.target.value as 'student' | 'activity')}
              >
                <MenuItem value="student">Étudiant</MenuItem>
                <MenuItem value="activity">Activité</MenuItem>
              </Select>
            </FormControl>
            
            <Button
              variant="contained"
              color="primary"
              onClick={() => setCreateCorrectionsModalOpen(true)}
              startIcon={<AddIcon />}
            >
              Ajouter des corrections
            </Button>
          </Box>
          
          {filteredCorrections.length === 0 ? (
            <Alert severity="info">
              Aucune correction trouvée avec les filtres actuels.
            </Alert>
          ) : (
            <Box>
              {groupedCorrections.map(group => (
                <Paper key={`${groupBy}-${group.id}`} sx={{ mb: 3, overflow: 'hidden', borderRadius: 2 }}>
                  <Box sx={{ 
                    p: 2, 
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <Typography variant="subtitle1" fontWeight="medium">
                      {group.name} ({group.count})
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2">
                        Moyenne:
                      </Typography>
                      <Chip 
                        label={`${group.averageGrade.toFixed(1)} / 20`}
                        color={getGradeColor(group.averageGrade)}
                        size="small"
                      />
                    </Box>
                  </Box>
                  
                  <Divider />
                  
                  <Box sx={{ p: 2 }}>
                    <Grid container spacing={2}>
                      {group.corrections.map(correction => {                        
                        return (
                          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={correction.id}>
                            <CorrectionCardAutre
                              correction={correction}
                              getGradeColor={getGradeColor}
                              showStudent={groupBy === 'activity'}
                              showActivity={groupBy === 'student'}
                              showClass={false}
                              onChangeStatus={handleChangeStatus}
                              standalone={false}
                            />
                          </Grid>
                        );
                      })}
                    </Grid>
                  </Box>
                </Paper>
              ))}
            </Box>
          )}
        </Box>
      </TabPanel>
      
      {/* Contenu pour l'onglet Export PDF */}
      <TabPanel value={tabValue} index={3}>
        <Box>
          <Typography variant="h6" gutterBottom>
            Export PDF des corrections
          </Typography>
          
          {classData && (
            <ExportPDFComponentAllCorrectionsAutresContainer
              corrections={filteredCorrections}
              activities={activities}
              students={students}
              filterActivity={'all'} // On autorise toutes les activités dans ce contexte
              setFilterActivity={setFilterActivity}
              uniqueActivities={uniqueActivities}
              getActivityById={(activityId: number) => activities.find(a => a.id === activityId)}
              getStudentById={(studentId: number | null) => studentId === null ? undefined : students.find(s => s.id === studentId)}
              getAllClasses={async () => {
                // Instead of fetching all classes, just return the current class
                if (classData) {
                  // Return an array with only the current class
                  return [classData];
                }
                return [];
              }}
            />
          )}
        </Box>
      </TabPanel>
      
      {/* Modal pour associer des activités */}
      {associateModalOpen && (
        <AssociateActivitiesModal
          open={associateModalOpen}
          onClose={() => setAssociateModalOpen(false)}
          onAssociate={handleAssociateActivity}
          availableActivities={activities.map(a => ({
            id: a.id,
            name: a.name,
            points: a.points,
            parts_names: a.parts_names
          }))}
          currentActivities={activities.map(a => ({
            id: a.id,
            name: a.name,
            points: a.points,
            parts_names: a.parts_names
          }))}
        />
      )}
      
      {/* Modal pour créer des corrections en masse */}
      {createCorrectionsModalOpen && (
        <CreateCorrectionsModalAutre
          open={createCorrectionsModalOpen}
          onClose={() => setCreateCorrectionsModalOpen(false)}
          onCreateCorrections={handleCreateCorrections}
          students={students}
          activities={activities}
          isCorrectionAutre={true}
        />
      )}
      
      {/* Edit dialog */}
      <StudentEditDialog
        open={openEditDialog}
        student={editingStudent}
        classes={allAvailableClasses.length > 0 ? allAvailableClasses : (classData ? [classData] : [])}
        selectedClasses={selectedClasses}
        availableSubgroups={availableSubgroups}
        loadingSubgroups={loadingSubgroups}
        onClose={handleEditClose}
        onSave={handleEditSave}
        onStudentChange={(student: Student | null) => {
          if (student === null) {
            setEditingStudent(null);
          } else {
            setEditingStudent(student);
          }
        }}
        onSelectedClassesChange={setSelectedClasses}
        fetchClassSubgroups={fetchClassSubgroups}
      />

      {/* Dialogue de modification de la classe */}
      <Dialog 
        open={editClassDialogOpen} 
        onClose={handleEditClassClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EditIcon color="primary" />
            Modifier la classe
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              fullWidth
              label="Nom de la classe"
              value={editingClass?.name || ''}
              onChange={(e) => setEditingClass(prev => prev ? { ...prev, name: e.target.value } : null)}
              variant="outlined"
              required
            />
            <TextField
              fullWidth
              label="Année académique"
              value={editingClass?.academic_year || ''}
              onChange={(e) => setEditingClass(prev => prev ? { ...prev, academic_year: e.target.value } : null)}
              variant="outlined"
              placeholder="Ex: 2024-2025"
              required
              helperText="Format: AAAA-AAAA ou AAAA"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClassClose} color="inherit">
            Annuler
          </Button>
          <Button 
            onClick={handleEditClassSave} 
            color="primary" 
            variant="contained"
            disabled={!editingClass?.name || !editingClass?.academic_year}
          >
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialogue de suppression de la classe */}
      <Dialog 
        open={deleteClassDialogOpen} 
        onClose={handleCloseDeleteClassDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DeleteIcon color="error" />
            Supprimer la classe
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir supprimer cette classe ? Cette action est irréversible.
          </DialogContentText>
          <Box sx={{ mt: 2 }}>
            <FormControlLabel
              control={
                <Checkbox 
                  checked={deleteOptions.deleteStudents} 
                  onChange={() => handleDeleteOptionChange('deleteStudents')} 
                  color="primary" 
                />
              }
              label="Supprimer également les étudiants de cette classe"
            />
            <FormControlLabel
              control={
                <Checkbox 
                  checked={deleteOptions.deleteCorrections} 
                  onChange={() => handleDeleteOptionChange('deleteCorrections')} 
                  color="primary" 
                />
              }
              label="Supprimer également les corrections de cette classe"
            />
          </Box>
          {deleteProgress.isDeleting && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress variant="determinate" value={(deleteProgress.current / deleteProgress.total) * 100} />
              <Typography variant="body2" sx={{ mt: 1 }}>
                {deleteProgress.step}
              </Typography>
            </Box>
          )}
          {deleteProgress.error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {deleteProgress.error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteClassDialog} color="inherit" disabled={deleteProgress.isDeleting}>
            Annuler
          </Button>
          <Button 
            onClick={handleDeleteClass} 
            color="error" 
            variant="contained"
            disabled={deleteProgress.isDeleting}
          >
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialogue d'envoi d'emails groupés */}
      <BulkEmailDialog
        open={bulkEmailDialogOpen}
        onClose={() => setBulkEmailDialogOpen(false)}
        students={students}
        classId={parseInt(classId)}
        classSubgroups={classData?.nbre_subclasses || 0}
      />
    </Container>
  );
}
