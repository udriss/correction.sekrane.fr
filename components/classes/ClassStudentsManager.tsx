'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Typography, 
  Paper, 
  Button, 
  Alert, 
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  IconButton,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Tabs,
  Tab,
  TextField,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Link,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadIcon from '@mui/icons-material/Upload';
import CloseIcon from '@mui/icons-material/Close';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CheckIcon from '@mui/icons-material/Check';
import CancelIcon from '@mui/icons-material/Cancel';
import SaveIcon from '@mui/icons-material/Save';
import FilterListIcon from '@mui/icons-material/FilterList';
import LayersIcon from '@mui/icons-material/Layers';
import LoadingSpinner from '@/components/LoadingSpinner';
import { parseCSVContent } from '@/lib/utils/parse-csv';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import EmailIcon from '@mui/icons-material/Email';
import PersonIcon from '@mui/icons-material/Person';
import StudentEditDialogForDetail from '@/components/students/StudentEditDialogForDetail';
import StudentEditDialog from '@/components/students/StudentEditDialog';

import type { Student as ImportedStudent } from '@/lib/types';

// Define local Student type that matches the component expectations
interface Student extends Omit<ImportedStudent, 'email'> {
  email: string | null;
}

// Interface spécifiques à ce composant
interface StudentBatch {
  first_name: string;
  last_name: string;
  email?: string;
  gender: string;
  sub_class?: number | null;
  markedForDeletion?: boolean;
}

// Modifions l'interface ClassData pour qu'elle soit compatible avec Class
interface ClassData {
  id: number;
  name: string;
  academic_year: string; // Garde comme obligatoire pour la compatibilité existante
  nbre_subclasses?: number | null;
  // Ajoutez d'autres propriétés nécessaires si besoin
}

interface ClassStudentsManagerProps {
  classId: number;
  classData: ClassData | null;
  embedded?: boolean;
}

// Interface étendue pour l'état d'édition
interface EditableStudent extends Student {
  isEditing?: boolean;
  editData?: {
    first_name: string;
    last_name: string;
    email: string;
    gender: string;
    sub_class?: number | null;
  };
}

export default function ClassStudentsManager({ 
  classId, 
  classData, 
  embedded = false 
}: ClassStudentsManagerProps) {
  const [students, setStudents] = useState<EditableStudent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [subClassTab, setSubClassTab] = useState<number>(0);
  const [currentFilter, setCurrentFilter] = useState<number | null>(null);
  const [manualStudentCount, setManualStudentCount] = useState<number>(1);
  const [batchStudents, setBatchStudents] = useState<StudentBatch[]>([]);
  const [csvContent, setCsvContent] = useState<string>('');
  const [savingBatch, setSavingBatch] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  
  // États pour l'affichage/masquage des colonnes
  const [showEmailColumn, setShowEmailColumn] = useState(false);
  const [showNameColumn, setShowNameColumn] = useState(false);
  
  // États pour le tri
  const [orderBy, setOrderBy] = useState<keyof Student>('last_name');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [selectedClassesForEdit, setSelectedClassesForEdit] = useState<{id: number, name: string}[]>([]);
  const [allAvailableClasses, setAllAvailableClasses] = useState<{id: number, name: string}[]>([]);
  const [subgroupsForEdit, setSubgroupsForEdit] = useState<string[]>([]);
  const [loadingSubgroupsForEdit, setLoadingSubgroupsForEdit] = useState(false);
  // Structure pour mémoriser les groupes disponibles par classe
  const [classGroupsMapping, setClassGroupsMapping] = useState<{[classId: number]: string[]}>({});

  // Fonctions pour afficher/masquer les colonnes
  const toggleEmailColumn = () => {
    setShowEmailColumn(prev => !prev);
  };
  
  const toggleNameColumn = () => {
    setShowNameColumn(prev => !prev);
  };

  // Fonction pour gérer le tri
  const handleRequestSort = (property: keyof Student) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const fetchStudents = useCallback(async () => {
    if (!classId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/classes/${classId}/students`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(`Erreur lors du chargement des étudiants : ${data.error}.`);
      }
      
      const data = await response.json();
      // Add isEditing property and initialize allClasses for each student
      const formattedStudents = data.map((student: Student) => ({
        ...student,
        isEditing: false,
        // Initialize allClasses for each student with their current class
        // Make sure sub_class is a string
        allClasses: student.allClasses || [{
          classId: classId,
          className: classData?.name || 'Class',
          sub_class: student.sub_class ? String(student.sub_class) : null,
          nbre_subclasses : classData?.nbre_subclasses || null
        }]
      }));

      
      setStudents(formattedStudents);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  }, [classId, classData]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleSubClassTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSubClassTab(newValue);
    if (newValue === 0) {
      setCurrentFilter(null);
    } else {
      setCurrentFilter(newValue);
    }
  };

  const handleManualStudentCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const count = Math.max(1, parseInt(e.target.value) || 0);
    setManualStudentCount(count);
  };

  const handleCreateManualStudents = () => {
    // Create empty student records for batch entry
    const newStudents = Array.from({ length: manualStudentCount }, (_, i) => ({
      first_name: `Étudiant ${i + 1}`,
      last_name: '',
      email: '',
      gender: 'N', // Default gender
      sub_class: currentFilter
    }));
    
    setBatchStudents(newStudents);
  };

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const handleClickUploadButton = () => {
    fileInputRef.current?.click();
  };

  const handleBatchStudentFieldChange = (index: number, field: keyof StudentBatch, value: string | number | null) => {
    setBatchStudents(prev => {
      const updated = [...prev];
      (updated[index][field] as string | number | null) = value;
      return updated;
    });
  };

  // Modifier pour marquer au lieu de supprimer
  const handleRemoveStudentFromBatch = (index: number) => {
    setBatchStudents(prevStudents => {
      const updatedStudents = [...prevStudents];
      updatedStudents[index] = {
        ...updatedStudents[index],
        markedForDeletion: true
      };
      return updatedStudents;
    });
  };
  
  // Ajouter une fonction pour restaurer
  const handleRestoreStudentToBatch = (index: number) => {
    setBatchStudents(prevStudents => {
      const updatedStudents = [...prevStudents];
      updatedStudents[index] = {
        ...updatedStudents[index],
        markedForDeletion: false
      };
      return updatedStudents;
    });
  };
  
  // Modifier pour filtrer les étudiants marqués pour suppression
  const handleAddBatchStudents = async () => {
    // Filtrer les étudiants marqués pour suppression
    const studentsToAdd = batchStudents.filter(student => !student.markedForDeletion);
    
    if (studentsToAdd.length === 0) {
      setError('Aucun étudiant à ajouter (tous sont marqués pour suppression)');
      return;
    }

    setSavingBatch(true);
    setError('');

    try {
      // Process each student in the batch
      for (const student of studentsToAdd) {
        // Email and last name are optional in our modified version
        if (!student.first_name || !student.gender) {
          continue; // Skip incomplete students
        }

        await fetch(`/api/classes/${classId}/students`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: student.email || `${student.first_name.toLowerCase()}.${student.last_name.toLowerCase()}@example.com`, // Default email if not provided
            first_name: student.first_name,
            last_name: student.last_name || '(Sans nom)', // Default last name if not provided
            gender: student.gender,
            sub_class: student.sub_class
          }),
        });
      }
      

      setSuccess(`${studentsToAdd.length} étudiants ajoutés avec succès`);
      setBatchStudents([]);
      setShowBatchForm(false);
      fetchStudents();

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      console.error('Error adding batch students:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setSavingBatch(false);
    }
  };

  // Add these new functions for inline editing
  const handleOpenEditDialog = async (student: Student) => {
    try {
      // Create a properly formatted student object with all required properties
      const studentToEdit = {
        ...student,
        // Initialize allClasses if it doesn't exist, ensure sub_class is string | null
        allClasses: student.allClasses || [{
          classId: classId,
          className: classData?.name || 'Current Class',
          // Convert sub_class to string if it's a number
          sub_class: student.sub_class ? String(student.sub_class) : null
        }]
      };
      
      setStudentToEdit(studentToEdit);
      setEditingStudent(studentToEdit);
      
      // Par défaut, l'étudiant est déjà dans la classe actuelle
      const initialSelectedClasses = [{ 
        id: classId, 
        name: classData?.name || 'Classe actuelle' 
      }];
      
      setSelectedClassesForEdit(initialSelectedClasses);
      
      // Récupérer toutes les classes disponibles
      const allClassesResponse = await fetch('/api/classes');
      if (allClassesResponse.ok) {
        const allClassesData = await allClassesResponse.json();
        setAllAvailableClasses(allClassesData);
      }
      
      // Charger les sous-groupes disponibles
      await fetchSubgroupsForEdit(classId);
      
      // Also fetch subgroups for any additional classes the student belongs to
      if (student.allClasses && Array.isArray(student.allClasses)) {
        for (const cls of student.allClasses) {
          if (cls.classId !== classId) {
            await fetchSubgroupsForClass(cls.classId);
          }
        }
      }
      
      // Ouvrir le dialog
      setEditDialogOpen(true);
    } catch (err) {
      console.error('Error preparing edit dialog:', err);
      setError('Erreur lors de la préparation du formulaire d\'édition');
    }
  };

  // Fonction pour charger les sous-groupes pour le dialog d'édition
  const fetchSubgroupsForEdit = async (classId: number) => {
    if (!classData?.nbre_subclasses) {
      setSubgroupsForEdit([]);
      return;
    }
    
    try {
      setLoadingSubgroupsForEdit(true);
      // Générer les sous-groupes basés sur nbre_subclasses
      const groups = Array.from(
        { length: classData.nbre_subclasses }, 
        (_, i) => (i + 1).toString()
      );
      setSubgroupsForEdit(groups);
    } catch (error) {
      console.error('Error loading subgroups:', error);
      setSubgroupsForEdit([]);
    } finally {
      setLoadingSubgroupsForEdit(false);
    }
  };
  
  // Fonction pour fermer le dialog d'édition
  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setStudentToEdit(null);
  };
  
  // Fonction pour sauvegarder après édition
  const handleSaveEdit = async () => {
    try {
      if (!editingStudent) {
        console.error("Aucun étudiant à modifier");
        return;
      }

      // Construire un objet étudiant complet avec tous les champs nécessaires
      const studentData = {
        id: editingStudent.id,
        first_name: editingStudent.first_name,
        last_name: editingStudent.last_name,
        email: editingStudent.email || '',
        gender: editingStudent.gender || 'N',
        // S'assurer que classId est inclus, même si aucune modification n'a été apportée
        classId: selectedClassesForEdit.length > 0 ? selectedClassesForEdit[0].id : null,
        // Conserver le groupe si disponible
        group: editingStudent.group || null,
        // Maintenir les autres propriétés importantes
        allClasses: editingStudent.allClasses || [],
        sub_class: editingStudent.sub_class,
        additionalClasses: editingStudent.additionalClasses,
      };

      // 1. Mettre à jour les informations de base de l'étudiant
      const response = await fetch(`/api/students/${editingStudent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(studentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la sauvegarde');
      }

      // 2. Mettre à jour les associations de classe
      for (const cls of selectedClassesForEdit) {
        console.log(`Mise à jour de l'étudiant ${editingStudent.id} dans la classe ${cls.id}`);
        
        // Find sub_class for this specific class in allClasses
        let subClassForThisClass = null;
        
        if (editingStudent.allClasses) {
          const classEntry = editingStudent.allClasses.find(c => c.classId === cls.id);
          if (classEntry) {
            subClassForThisClass = classEntry.sub_class;
          }
        }
        
        
        // S'assurer que l'étudiant est associé à cette classe avec le bon sub_class
        await fetch(`/api/classes/${cls.id}/students/${editingStudent.id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            student_id: editingStudent.id,
            sub_class: subClassForThisClass
          }),
        }).catch(error => {
          // Log error but continue
          console.error(`Error updating student in class ${cls.id}:`, error);
        });

      }

      // Refresh the students list
      await fetchStudents();
      setSuccess('Étudiant modifié avec succès');
      
      setTimeout(() => {
        setSuccess('');
      }, 3000);
      
      setEditDialogOpen(false);
      setStudentToEdit(null);
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    }
  };

  const handleStartEditing = (studentId: number) => {
    const student = students.find(s => s.id === studentId);
    if (student) {
      handleOpenEditDialog(student);
    }
  };

  const handleCancelEditing = (studentId: number) => {
    setStudents(prevStudents => 
      prevStudents.map(student => {
        if (student.id === studentId) {
          return {
            ...student,
            isEditing: false,
            editData: undefined
          };
        }
        return student;
      })
    );
  };
  
  const handleEditFieldChange = (studentId: number, field: string, value: string | number | null) => {
    setStudents(prevStudents => 
      prevStudents.map(student => {
        if (student.id === studentId && student.editData) {
          return {
            ...student,
            editData: {
              ...student.editData,
              [field]: value
            }
          };
        }
        return student;
      })
    );
  };
  
  const handleOpenDeleteDialog = (studentId: number) => {
    setStudentToDelete(studentId);
    setDeleteDialogOpen(true);
  };
  
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setStudentToDelete(null);
  };
  
  const handleDeleteStudent = async () => {
    if (studentToDelete === null) return;
    
    try {
      const response = await fetch(`/api/classes/${classId}/students/${studentToDelete}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la suppression');
      }
      
      setSuccess('Étudiant supprimé avec succès');
      fetchStudents();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      handleCloseDeleteDialog();
    }
  };

  // Gestionnaires d'événements pour le glisser-déposer
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      // Vérifier si c'est un fichier CSV ou TXT
      if (file.type === 'text/csv' || file.type === 'text/plain' || file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
        processFile(file);
      } else {
        setError('Seuls les fichiers CSV ou TXT sont acceptés');
      }
    }
  }, []);

  // Fonction pour traiter le fichier (utilisée à la fois pour le glisser-déposer et l'input file)
  const processFile = async (file: File) => {
    setLoading(true);
    setError('');
    
    try {
      const text = await file.text();
    
      // Utiliser l'utilitaire parseCSVContent
      const parsedData = parseCSVContent(text);
      
      // Transformer les données au format attendu
      const parsedStudents = parsedData.map(data => ({
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email || `${data.firstName.toLowerCase()}.${data.lastName.toLowerCase()}@exemple.fr`,
        gender: 'N' as const,
        sub_class: currentFilter
      }));
      
      setCsvContent(file.name); // Store the file name
      
      if (parsedStudents && parsedStudents.length > 0) {
        // Format students with default gender
        setBatchStudents(parsedStudents);
      } else {
        setError("Aucun étudiant trouvé dans le fichier CSV");
      }
    } catch (err) {
      console.error("Erreur lors de l'importation du CSV:", err);
      setError(err instanceof Error ? err.message : "Erreur lors de l'importation du fichier");
    } finally {
      setLoading(false);
    }
  };

  // Tri des étudiants
  const sortedStudents = useMemo(() => {
    // Copie pour ne pas modifier l'original
    const sortableStudents = [...students];
    
    return sortableStudents.sort((a, b) => {
      const aValue = a[orderBy] || '';
      const bValue = b[orderBy] || '';
      
      // Pour les comparaisons de chaînes de caractères
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return order === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }
      
      // Pour les comparaisons numériques
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return order === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      // Fallback
      return 0;
    });
  }, [students, orderBy, order]);

  if (loading) {
    return (
      <div className="py-10 flex justify-center max-w-[400px] mx-auto">
        <LoadingSpinner size="md" text="Chargement des étudiants" />
      </div>
    )
  }

  // Les étudiants filtrés et triés
  const filteredStudents = currentFilter === null 
    ? sortedStudents 
    : sortedStudents.filter(student => student.sub_class === currentFilter);

  const getGenderLabel = (gender: string) => {
    switch(gender) {
      case 'M': return 'Garçon';
      case 'F': return 'Fille';
      case 'N': return 'Neutre';
      default: return gender;
    }
  };
  
  const getGenderColor = (gender: string) => {
    switch(gender) {
      case 'M': return 'primary';
      case 'F': return 'secondary';
      case 'N': return 'default';
      default: return 'default';
    }
  };

  // Generate tab panels for subclasses
  const renderSubClassTabs = () => {
    if (!classData?.nbre_subclasses) return null;

    return (
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={subClassTab} 
          onChange={handleSubClassTabChange}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="sous-classes"
        >
          <Tab 
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <FilterListIcon fontSize="small" />
                <span>Tous</span>
                <Chip 
                  label={students.length} 
                  size="small" 
                  color="primary" 
                  variant="outlined"
                />
              </Box>
            } 
          />
          
          {Array.from({ length: classData.nbre_subclasses }, (_, i) => i + 1).map((subClassNum) => {
            const studentsInSubclass = students.filter(s => s.sub_class === subClassNum).length;
            
            return (
              <Tab 
                key={subClassNum}
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    <LayersIcon fontSize="small" />
                    <span>Groupe {subClassNum}</span>
                    <Chip 
                      label={studentsInSubclass} 
                      size="small" 
                      color="secondary" 
                      variant="outlined"
                    />
                  </Box>
                } 
              />
            );
          })}
        </Tabs>
      </Box>
    );
  };

  // Add this handler for selected classes changes
  const handleSelectedClassesChange = (newSelectedClasses: { id: number; name: string }[]) => {
    setSelectedClassesForEdit(newSelectedClasses);
  };

  // Fonction pour gérer les changements de l'étudiant dans le dialog d'édition
  const handleStudentChange = (updatedStudent: Student | null) => {
    if (updatedStudent === null) {
      setEditingStudent(null);
      return;
    }
    
    // Ensure allClasses exists with the correct types
    let allClassesWithCorrectTypes: {
      classId: number;
      className: string;
      sub_class?: string | null;
    }[] = [];
    
    // Ensure sub_class is properly typed in allClasses
    if (updatedStudent.allClasses) {
      allClassesWithCorrectTypes = updatedStudent.allClasses.map(cls => ({
        classId: cls.classId,
        className: cls.className,
        sub_class: cls.sub_class ? String(cls.sub_class) : null
      }));
    }
    
    // Create a copy with properly typed allClasses
    const studentCopy = {
      ...JSON.parse(JSON.stringify(updatedStudent)),
      allClasses: allClassesWithCorrectTypes
    };
    
    console.log("Student updated:", studentCopy);
    setEditingStudent(studentCopy);
    setStudentToEdit(studentCopy);
  };

  // Fonction pour charger les sous-groupes pour une classe spécifique
  const fetchSubgroupsForClass = async (classId: number) => {
    try {
      setLoadingSubgroupsForEdit(true);
      const response = await fetch(`/api/classes/${classId}`);
      
      if (!response.ok) {
        throw new Error('Error loading class data');
      }
      
      const classData = await response.json();
      
      // Si la classe a un nombre défini de sous-groupes
      if (classData.nbre_subclasses) {
        const groups = Array.from({ length: classData.nbre_subclasses }, (_, i) => (i + 1).toString());
        
        // Update class groups mapping
        setClassGroupsMapping(prev => ({
          ...prev,
          [classId]: groups
        }));
        
        return groups;
      } else {
        return [];
      }
    } catch (error) {
      console.error(`Error loading subgroups for class ${classId}:`, error);
      return [];
    } finally {
      setLoadingSubgroupsForEdit(false);
    }
  };

  // Fonction pour gérer le changement de classe (ajout/suppression)
  const handleClassSelectionChange = async (classId: number, isSelected: boolean) => {
    try {
      if (isSelected) {
        // Si la classe est sélectionnée, récupérer ses sous-groupes disponibles
        const groups = await fetchSubgroupsForClass(classId);
        setClassGroupsMapping(prev => ({
          ...prev,
          [classId]: groups
        }));
        
        console.log(`Updated class ${classId} groups:`, groups);
      }
    } catch (error) {
      console.error('Error handling class selection change:', error);
    }
  };

  return (
    <div>
    <Paper sx={{ p: embedded ? 0 : 2, mb: embedded ? 0 : 3 }} elevation={embedded ? 0 : 1}>
      {!embedded && (
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Typography variant="h5" component="h2">
            Gestion des étudiants
          </Typography>
        </Box>
      )}
      
      
      {/* SubClass tabs */}
      {renderSubClassTabs()}


      {/* Batch student form */}
      {showBatchForm && (
        <Paper className="p-6 mb-6">
          <Box className="flex justify-between items-center mb-4">
            <Typography variant="h6" component="h2">
              {currentFilter ? `Ajouter des étudiants au groupe ${currentFilter}` : 'Ajouter des étudiants'}
            </Typography>
            <IconButton onClick={() => setShowBatchForm(false)}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            variant="fullWidth"
            className="mb-4 border-b border-gray-200"
          >
            <Tab 
              label="Saisie manuelle" 
              icon={<EditIcon />} 
              iconPosition="start" 
            />
            <Tab 
              label="Importer CSV" 
              icon={<UploadIcon />} 
              iconPosition="start" 
            />
          </Tabs>
          
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            {activeTab === 0 && (
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row items-center gap-4">
                  <TextField
                    label="Nombre d'étudiants"
                    type="number"
                    value={manualStudentCount}
                    onChange={handleManualStudentCountChange}
                    InputProps={{ inputProps: { min: 1 } }}
                    variant="outlined"
                    className="md:w-1/3"
                  />
                  
                  <Button
                variant="contained"
                color="secondary"
                startIcon={<PersonAddIcon />}
                onClick={handleCreateManualStudents}
                sx={{
                  fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  background: (theme) => theme.gradients.secondary,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 15px rgba(0,0,0,0.2)',
                    background: (theme) => theme.gradients.secondary,
                    filter: 'brightness(1.3)',
                  }
                }}
                  >
                      <PersonAddIcon /> Ajouter {manualStudentCount} ligne{manualStudentCount > 1 ? 's' : ''}
                  </Button>
                </div>

                {batchStudents.length > 0 && (
                  <div className="mt-6">
                    <Typography variant="subtitle1" gutterBottom>
                      Entrez les informations des étudiants
                    </Typography>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                          <TableCell>Nom</TableCell>
                          <TableCell>Prénom*</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <EmailIcon fontSize="small" />
                              <span>Email</span>
                              <Tooltip title={showEmailColumn ? "Masquer les emails" : "Afficher les emails"}>
                                <IconButton size="small" onClick={toggleEmailColumn}>
                                  {showEmailColumn ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                            <TableCell>Genre*</TableCell>
                            {classData?.nbre_subclasses && classData?.nbre_subclasses > 0 && (
                              <TableCell>Groupe</TableCell>
                            )}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {batchStudents.map((student, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <TextField
                                  size="small"
                                  fullWidth
                                  value={student.first_name}
                                  onChange={(e) => handleBatchStudentFieldChange(index, 'first_name', e.target.value)}
                                  required
                                />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  size="small"
                                  fullWidth
                                  value={student.last_name}
                                  onChange={(e) => handleBatchStudentFieldChange(index, 'last_name', e.target.value)}
                                />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  size="small"
                                  fullWidth
                                  value={student.email || ''}
                                  onChange={(e) => handleBatchStudentFieldChange(index, 'email', e.target.value)}
                                  placeholder="Optionnel"
                                />
                              </TableCell>
                              <TableCell>
                                <FormControl fullWidth size="small">
                                  <Select
                                    value={student.gender || 'N'}
                                    onChange={(e) => handleBatchStudentFieldChange(index, 'gender', e.target.value)}
                                  >
                                    <MenuItem value="M">Garçon</MenuItem>
                                    <MenuItem value="F">Fille</MenuItem>
                                    <MenuItem value="N">Neutre</MenuItem>
                                  </Select>
                                </FormControl>
                              </TableCell>
                              {classData?.nbre_subclasses && classData?.nbre_subclasses > 0 && (
                                <TableCell>
                                  <FormControl fullWidth size="small">
                                    <Select
                                      value={student.sub_class === null ? '' : student.sub_class}
                                      onChange={(e) => handleBatchStudentFieldChange(
                                        index, 
                                        'sub_class', 
                                        e.target.value === '' ? null : Number(e.target.value)
                                      )}
                                    >
                                      <MenuItem value="">
                                        <em>Non assigné</em>
                                      </MenuItem>
                                      {Array.from({ length: classData?.nbre_subclasses }, (_, i) => i + 1).map((num) => (
                                        <MenuItem key={num} value={num}>Groupe {num}</MenuItem>
                                      ))}
                                    </Select>
                                  </FormControl>
                                </TableCell>
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    
                    <Box mt={3} display="flex" justifyContent="flex-end">
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleAddBatchStudents}
                        disabled={savingBatch}
                        startIcon={savingBatch ? <CircularProgress size={20} /> : <PersonAddIcon />}
                      >
                        {savingBatch ? 'Enregistrement...' : 'Ajouter les étudiants'}
                      </Button>
                    </Box>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 1 && (
              <div className="space-y-4">
                <Paper variant="outlined" className="p-4 bg-blue-50 border-blue-200">
                  <Typography variant="subtitle2" component="div" sx={{ mb: 2, fontWeight: 'bold', color: '#1E40AF' }}>
                    Format de fichier accepté :
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <CheckIcon fontSize="small" color="primary" />
                      <Typography variant="body2">
                        CSV ou TXT avec séparateur point-virgule (;)
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                      <CheckIcon fontSize="small" color="primary" />
                      <Typography variant="body2">
                        Format: <strong>NOM;Prénom;Email</strong> (email optionnel)
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                      <CheckIcon fontSize="small" color="primary" />
                      <Typography variant="body2">
                        Une ligne par étudiant, première colonne = NOM, deuxième = Prénom
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box mt={2} p={2} bgcolor="white" borderRadius={1} border="1px solid" borderColor="divider">
                    <Typography variant="caption" component="div" fontFamily="monospace" whiteSpace="pre-line">
                      DUPONT;Jean;jean.dupont@exemple.fr<br />
                      MARTIN;Marie;marie.martin@exemple.fr<br />
                      LEGRAND;Amélie;amelie.legrand@exemple.fr<br />
                      PETIT;Sophie;sophie.petit@exemple.fr
                    </Typography>
                  </Box>
                </Paper>
                
                <input 
                  type="file" 
                  accept=".csv,.txt" 
                  ref={fileInputRef}
                  onChange={handleCsvUpload}
                  style={{ display: 'none' }}
                />
                
                {/* Zone de dépôt pour le glisser-déposer */}
                <Box 
                  sx={{ 
                    my: 4,
                    p: 4,
                    border: '2px dashed',
                    borderColor: isDragging ? 'primary.main' : 'divider',
                    borderRadius: 2,
                    backgroundColor: isDragging ? 'primary.50' : 'background.paper',
                    textAlign: 'center',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    minHeight: '200px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 2
                  }}
                  onClick={handleClickUploadButton}
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <UploadFileIcon sx={{ fontSize: 60, color: isDragging ? 'primary.main' : 'text.secondary', opacity: 0.7 }} />
                  <Typography variant="h6" color="text.secondary">
                    {isDragging ? 'Déposez le fichier ici' : 'Glissez et déposez un fichier CSV ou TXT ici'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ou
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleClickUploadButton}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <UploadIcon />}
                    disabled={loading}
                  >
                    {loading ? 'Traitement...' : 'Importer CSV'}
                  </Button>
                </Box>
                
                {csvContent && !error && (
                  <Alert 
                    severity="success" 
                    icon={<CheckCircleIcon />}
                    variant="filled"
                    className="mt-4 animate-fadeIn"
                  >
                    Fichier <strong>{csvContent}</strong> chargé avec succès ! {batchStudents.length} étudiant(s) détecté(s).
                  </Alert>
                )}

                {batchStudents.length > 0 && (
                  <div className="mt-6">
                    <Typography variant="subtitle1" gutterBottom>
                      Vérifiez et complétez les informations
                      {batchStudents.some(s => s.markedForDeletion) && (
                        <Typography 
                          component="span" 
                          variant="body2" 
                          color="text.secondary" 
                          sx={{ ml: 1, fontStyle: 'italic' }}
                        >
                          ({batchStudents.filter(s => !s.markedForDeletion).length} actifs, {batchStudents.filter(s => s.markedForDeletion).length} ignorés)
                        </Typography>
                      )}
                    </Typography>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Prénom*</TableCell>
                            <TableCell>Nom</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Genre*</TableCell>
                            {classData?.nbre_subclasses && classData?.nbre_subclasses > 0 && (
                              <TableCell>Groupe</TableCell>
                            )}
                            <TableCell width="50px" align="center">Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {batchStudents.map((student, index) => (
                            <TableRow 
                              key={index}
                              sx={{ 
                                opacity: student.markedForDeletion ? 0.5 : 1,
                                bgcolor: student.markedForDeletion ? 'action.disabledBackground' : 'inherit',
                                textDecoration: student.markedForDeletion ? 'line-through' : 'none',
                                '& .MuiTableCell-root': {
                                  color: student.markedForDeletion ? 'text.disabled' : 'inherit'
                                }
                              }}
                            >
                              <TableCell>
                                <TextField
                                  size="small"
                                  fullWidth
                                  value={student.first_name}
                                  onChange={(e) => handleBatchStudentFieldChange(index, 'first_name', e.target.value)}
                                  required
                                  disabled={student.markedForDeletion}
                                  InputProps={{
                                    sx: { opacity: student.markedForDeletion ? 0.7 : 1 }
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  size="small"
                                  fullWidth
                                  value={student.last_name}
                                  onChange={(e) => handleBatchStudentFieldChange(index, 'last_name', e.target.value)}
                                  disabled={student.markedForDeletion}
                                  InputProps={{
                                    sx: { opacity: student.markedForDeletion ? 0.7 : 1 }
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  size="small"
                                  fullWidth
                                  value={student.email || ''}
                                  onChange={(e) => handleBatchStudentFieldChange(index, 'email', e.target.value)}
                                  placeholder="Optionnel"
                                  disabled={student.markedForDeletion}
                                  InputProps={{
                                    sx: { opacity: student.markedForDeletion ? 0.7 : 1 }
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <FormControl fullWidth size="small">
                                  <Select
                                    value={student.gender || 'N'}
                                    onChange={(e) => handleBatchStudentFieldChange(index, 'gender', e.target.value)}
                                    disabled={student.markedForDeletion}
                                    sx={{ opacity: student.markedForDeletion ? 0.7 : 1 }}
                                  >
                                    <MenuItem value="M">Garçon</MenuItem>
                                    <MenuItem value="F">Fille</MenuItem>
                                    <MenuItem value="N">Neutre</MenuItem>
                                  </Select>
                                </FormControl>
                              </TableCell>
                              {classData?.nbre_subclasses && classData?.nbre_subclasses > 0 && (
                                <TableCell>
                                  <FormControl fullWidth size="small">
                                    <Select
                                      value={student.sub_class === null ? '' : student.sub_class}
                                      onChange={(e) => handleBatchStudentFieldChange(
                                        index, 
                                        'sub_class', 
                                        e.target.value === '' ? null : Number(e.target.value)
                                      )}
                                      disabled={student.markedForDeletion}
                                      sx={{ opacity: student.markedForDeletion ? 0.7 : 1 }}
                                    >
                                      <MenuItem value="">
                                        <em>Non assigné</em>
                                      </MenuItem>
                                      {Array.from({ length: classData?.nbre_subclasses }, (_, i) => i + 1).map((num) => (
                                        <MenuItem key={num} value={num}>Groupe {num}</MenuItem>
                                      ))}
                                    </Select>
                                  </FormControl>
                                </TableCell>
                              )}
                              <TableCell align="center">
                                {student.markedForDeletion ? (
                                  <Tooltip title="Restaurer">
                                    <IconButton 
                                      size="small" 
                                      color="primary" 
                                      onClick={() => handleRestoreStudentToBatch(index)}
                                    >
                                      <CheckIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                ) : (
                                  <Tooltip title="Ignorer">
                                    <IconButton 
                                      size="small" 
                                      color="error" 
                                      onClick={() => handleRemoveStudentFromBatch(index)}
                                    >
                                      <DeleteOutlineIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    
                    {/* Afficher un message si toutes les lignes sont marquées pour suppression */}
                    {batchStudents.length > 0 && batchStudents.every(s => s.markedForDeletion) && (
                      <Alert 
                        severity="warning" 
                        sx={{ mt: 2, mb: 2 }}
                      >
                        Tous les étudiants sont marqués pour suppression. Restaurez au moins un étudiant ou importez un nouveau fichier.
                      </Alert>
                    )}
                            
                    <Box mt={3} display="flex" justifyContent="flex-end">
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleAddBatchStudents}
                        disabled={savingBatch || batchStudents.filter(s => !s.markedForDeletion).length === 0}
                        startIcon={savingBatch ? <CircularProgress size={20} /> : <PersonAddIcon />}
                      >
                        {savingBatch ? 'Enregistrement...' : `Ajouter ${batchStudents.filter(s => !s.markedForDeletion).length} étudiant(s)`}
                      </Button>
                    </Box>
                  </div>
                )}
              </div>
            )}
          </div>
        </Paper>
      )}

      {/* Display the current filter/group being shown */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">
          {currentFilter ? `Étudiants du groupe ${currentFilter}` : ''}
        </Typography>
        {!showBatchForm && (
          <Button
            variant="outlined"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setShowBatchForm(true)}
          >
            Ajouter des étudiants
          </Button>
        )}
      </Box>

      {/* Students list */}
      {filteredStudents.length > 0 ? (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <TableSortLabel
                      active={orderBy === 'last_name'}
                      direction={orderBy === 'last_name' ? order : 'asc'}
                      onClick={() => handleRequestSort('last_name')}
                    >
                      Nom
                    </TableSortLabel>
                    <Tooltip title={showNameColumn ? "Masquer les noms" : "Afficher les noms"}>
                      <IconButton size="small" onClick={toggleNameColumn}>
                        {showNameColumn ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'first_name'}
                    direction={orderBy === 'first_name' ? order : 'asc'}
                    onClick={() => handleRequestSort('first_name')}
                  >
                    Prénom
                  </TableSortLabel>
                </TableCell>               
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <EmailIcon fontSize="small" />
                    <span>Email</span>
                    <Tooltip title={showEmailColumn ? "Masquer les emails" : "Afficher les emails"}>
                      <IconButton size="small" onClick={toggleEmailColumn}>
                        {showEmailColumn ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'gender'}
                    direction={orderBy === 'gender' ? order : 'asc'}
                    onClick={() => handleRequestSort('gender')}
                  >
                    Genre
                  </TableSortLabel>
                </TableCell>
                {classData?.nbre_subclasses && classData?.nbre_subclasses > 0 && (
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'sub_class'}
                      direction={orderBy === 'sub_class' ? order : 'asc'}
                      onClick={() => handleRequestSort('sub_class')}
                    >
                      Groupe
                    </TableSortLabel>
                  </TableCell>
                )}
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    {student.isEditing ? (
                      <TextField
                        size="small"
                        fullWidth
                        value={student.editData?.last_name || ''}
                        onChange={(e) => handleEditFieldChange(student.id, 'last_name', e.target.value)}
                        placeholder="Optionnel"
                      />
                    ) : (
                      showNameColumn ? student.last_name : (
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          sx={{ 
                            cursor: 'pointer',
                            '&:hover': { textDecoration: 'underline' }
                          }}
                          onClick={toggleNameColumn}
                        >
                          •••••
                        </Typography>
                      )
                    )}
                  </TableCell>
                  <TableCell>
                    {student.isEditing ? (
                      <TextField
                        size="small"
                        fullWidth
                        value={student.editData?.first_name || ''}
                        onChange={(e) => handleEditFieldChange(student.id, 'first_name', e.target.value)}
                        required
                        error={!student.editData?.first_name}
                        helperText={!student.editData?.first_name ? "Requis" : ""}
                      />
                    ) : (
                      student.first_name
                    )}
                  </TableCell>
                  <TableCell>
                    {student.isEditing ? (
                      <TextField
                        size="small"
                        fullWidth
                        type="email"
                        value={student.editData?.email || ''}
                        onChange={(e) => handleEditFieldChange(student.id, 'email', e.target.value)}
                        placeholder="Optionnel"
                      />
                    ) : (
                      showEmailColumn ? student.email : (
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          sx={{ 
                            cursor: 'pointer',
                            '&:hover': { textDecoration: 'underline' }
                          }}
                          onClick={toggleEmailColumn}
                        >
                          ••••@••••
                        </Typography>
                      )
                    )}
                  </TableCell>
                  <TableCell>
                    {student.isEditing ? (
                      <FormControl fullWidth size="small">
                        <Select
                          value={student.editData?.gender || 'N'}
                          onChange={(e) => handleEditFieldChange(student.id, 'gender', e.target.value)}
                        >
                          <MenuItem value="M">Garçon</MenuItem>
                          <MenuItem value="F">Fille</MenuItem>
                          <MenuItem value="N">Neutre</MenuItem>
                        </Select>
                      </FormControl>
                    ) : (
                      <Chip 
                        label={getGenderLabel(student.gender)} 
                        color={getGenderColor(student.gender) as any}
                        size="small"
                      />
                    )}
                  </TableCell>
                  {classData?.nbre_subclasses && classData?.nbre_subclasses > 0 && (
                    <TableCell>
                      {student.isEditing ? (
                        <FormControl fullWidth size="small">
                          <Select
                            value={student.editData?.sub_class === null ? '' : student.editData?.sub_class}
                            onChange={(e) => handleEditFieldChange(
                              student.id, 
                              'sub_class', 
                              e.target.value === '' ? null : Number(e.target.value)
                            )}
                          >
                            <MenuItem value="">
                              <em>Non assigné</em>
                            </MenuItem>
                            {Array.from({ length: classData?.nbre_subclasses }, (_, i) => i + 1).map((num) => (
                              <MenuItem key={num} value={num}>Groupe {num}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      ) : (
                        student.sub_class ? (
                          <Tooltip title={`Filtrer le groupe ${student.sub_class}`}>
                            <Chip 
                              label={`Groupe ${student.sub_class}`} 
                              size="small" 
                              color="primary" 
                              variant="outlined"
                              onClick={() => setSubClassTab(
                                typeof student.sub_class === 'string' 
                                  ? parseInt(student.sub_class) 
                                  : (student.sub_class || 0)
                              )}
                              clickable
                              sx={{ 
                                cursor: 'pointer',
                                '&:hover': { 
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                                  backgroundColor: 'rgba(25, 118, 210, 0.08)'
                                }
                              }}
                            />
                          </Tooltip>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Non assigné
                          </Typography>
                        )
                      )}
                    </TableCell>
                  )}
                  <TableCell align="right">
                  <>
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
                        <Tooltip title="Modifier">
                          <IconButton 
                            size="small" 
                            onClick={() => handleStartEditing(student.id)}
                            color="primary"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Supprimer">
                          <IconButton 
                            size="small" 
                            onClick={() => handleOpenDeleteDialog(student.id)}
                            color="error"
                            className="ml-1"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Paper className="p-8 text-center">
          <Typography variant="h6" className="mb-2">Aucun étudiant</Typography>
          <Typography variant="body2" className="text-gray-500 mb-4" sx={{mb : 2}}>
            {currentFilter 
              ? `Commencez par ajouter des étudiants au groupe ${currentFilter}`
              : 'Commencez par ajouter des étudiants à cette classe'}
          </Typography>
          {!showBatchForm && (
            <Box display="flex" justifyContent="center" gap={2}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => setShowBatchForm(true)}
              >
                Ajouter des étudiants
              </Button>
            </Box>
          )}
        </Paper>
      )}
      
      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
      >
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir supprimer cet étudiant de la classe ? Cette action ne peut pas être annulée.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Annuler</Button>
          <Button onClick={handleDeleteStudent} color="error" autoFocus>
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
    
    {error && (
      <Alert severity="error" className="mb-4" onClose={() => setError('')}>
        {error}
      </Alert>
    )}

    {success && (
      <Alert severity="success" className="mb-4" onClose={() => setSuccess('')}>
        {success}
      </Alert>
    )}

    <StudentEditDialog
      open={editDialogOpen}
      onClose={handleCloseEditDialog}
      student={studentToEdit ? {
        ...studentToEdit,
        email: studentToEdit.email || '' // Garantir que email n'est jamais null
      } : null}
      onSave={handleSaveEdit}
      selectedClasses={selectedClassesForEdit}
      onSelectedClassesChange={handleSelectedClassesChange}
      classes={allAvailableClasses.map(cls => ({
        id: cls.id,
        name: cls.name,
        year: classData?.academic_year || new Date().getFullYear().toString() // Ajouter year obligatoire
      }))}
      availableSubgroups={subgroupsForEdit}
      loadingSubgroups={loadingSubgroupsForEdit}
      onStudentChange={handleStudentChange}
      fetchClassSubgroups={fetchSubgroupsForEdit}
      classGroupsMapping={classGroupsMapping}
      onClassSelectionChange={handleClassSelectionChange}
    />

    </div>
  );
}
