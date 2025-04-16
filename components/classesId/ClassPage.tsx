import React, { useState, useEffect, useMemo } from 'react';
import { Container, Paper, Box } from '@mui/material';
import { useSnackbar } from 'notistack';
import { ClassHeader } from './ClassHeader';
import { ClassStats } from './ClassStats';
import { ClassTabs } from './ClassTabs';
import { ActivitiesList } from './ActivitiesList';
import { CorrectionFilters } from './CorrectionFilters';
import { CorrectionList } from './CorrectionList';
import { CorrectionSortControls } from './CorrectionSortControls';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorDisplay from '@/components/ui/ErrorDisplay';
import ClassStudentsManager from '@/components/classes/ClassStudentsManager';
import AssociateActivitiesModal, { Activity as ModalActivity } from "@/components/classes/AssociateActivitiesModal";
import CreateCorrectionsModal from "@/components/corrections/CreateCorrectionsModal";
import ExportPDFComponent from '@/components/pdf/ExportPDFComponent';
import { Class, CorrectionAutreEnriched, Student } from '@/lib/types';

interface ClassPageProps {
  id: string;
}

export function ClassPage({ id }: ClassPageProps) {
  // États pour les données
  const [classData, setClassData] = useState<Class | null>(null);
  const [activities, setActivities] = useState<ModalActivity[]>([]);
  const [corrections, setCorrections] = useState<CorrectionAutreEnriched[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  
  // États pour l'interface
  const [tabValue, setTabValue] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [associateModalOpen, setAssociateModalOpen] = useState(false);
  const [createCorrectionsModal, setCreateCorrectionsModal] = useState({
    open: false,
    activityId: null as number | null
  });

  // États pour les filtres et le tri
  const [filterActivity, setFilterActivity] = useState<number | 'all'>('all');
  const [filterSubClass, setFilterSubClass] = useState<string | 'all'>('all');
  const [filterGradeRange, setFilterGradeRange] = useState<[number, number]>([0, 20]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'lastName' | 'firstName' | 'grade' | 'activity' | 'date'>('grade');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [groupBy, setGroupBy] = useState<'none' | 'activity' | 'student'>('none');
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');

  const { enqueueSnackbar } = useSnackbar();

  // Chargement des données
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [classResponse, activitiesResponse, correctionsResponse, studentsResponse] = await Promise.all([
          fetch(`/api/classes/${id}`),
          fetch(`/api/classes/${id}/activities`),
          fetch(`/api/classes/${id}/corrections_autres`),
          fetch(`/api/students`)
        ]);

        if (!classResponse.ok) throw new Error('Erreur lors du chargement de la classe');
        if (!activitiesResponse.ok) throw new Error('Erreur lors du chargement des activités');
        if (!correctionsResponse.ok) throw new Error('Erreur lors du chargement des corrections');
        if (!studentsResponse.ok) throw new Error('Erreur lors du chargement des étudiants');

        const [classData, activities, corrections, students] = await Promise.all([
          classResponse.json(),
          activitiesResponse.json(),
          correctionsResponse.json(),
          studentsResponse.json()
        ]);

        setClassData(classData);
        setActivities(activities);
        setCorrections(corrections);
        setStudents(students);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Une erreur est survenue');
        enqueueSnackbar('Erreur lors du chargement des données', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  // Fonctions utilitaires
  const getActivityById = (activityId: number) => activities.find(a => a.id === activityId);
  const getStudentFullName = (studentId: number | null) => {
    if (!studentId) return 'Étudiant inconnu';
    const student = students.find(s => s.id === studentId);
    return student ? `${student.first_name} ${student.last_name}` : 'Étudiant inconnu';
  };

  // Calcul des corrections filtrées et groupées
  const filteredCorrections = useMemo(() => {
    let result = corrections;

    if (filterActivity !== 'all') {
      result = result.filter(c => c.activity_id === filterActivity);
    }

    if (filterSubClass !== 'all') {
      const subClassValue = parseInt(filterSubClass);
      result = result.filter(c => {
        const student = students.find(s => s.id === c.student_id);
        return student?.sub_class === subClassValue;
      });
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(c => {
        const activity = getActivityById(c.activity_id);
        const studentName = getStudentFullName(c.student_id).toLowerCase();
        return studentName.includes(term) || activity?.name.toLowerCase().includes(term);
      });
    }

    // Tri
    result.sort((a, b) => {
      switch (sortField) {
        case 'grade':
          return sortDirection === 'asc' ? 
            (a.grade || 0) - (b.grade || 0) : 
            (b.grade || 0) - (a.grade || 0);
        case 'activity':
          const activityA = getActivityById(a.activity_id)?.name || '';
          const activityB = getActivityById(b.activity_id)?.name || '';
          return sortDirection === 'asc' ? 
            activityA.localeCompare(activityB) : 
            activityB.localeCompare(activityA);
        case 'lastName':
        case 'firstName':
          const nameA = getStudentFullName(a.student_id);
          const nameB = getStudentFullName(b.student_id);
          return sortDirection === 'asc' ? 
            nameA.localeCompare(nameB) : 
            nameB.localeCompare(nameA);
        default:
          return 0;
      }
    });

    return result;
  }, [corrections, filterActivity, filterSubClass, searchTerm, sortField, sortDirection]);

  // Gestionnaires d'événements
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleUpdateClass = (updatedClass: Class) => {
    setClassData(updatedClass);
    setIsEditing(false);
    enqueueSnackbar('Classe mise à jour avec succès', { variant: 'success' });
  };

  const handleDeleteCorrection = async (correction: CorrectionAutreEnriched) => {
    try {
      const response = await fetch(`/api/corrections_autres/${correction.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Erreur lors de la suppression');

      setCorrections(prev => prev.filter(c => c.id !== correction.id));
      enqueueSnackbar('Correction supprimée avec succès', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Erreur lors de la suppression', { variant: 'error' });
    }
  };

  const handleUpdateCorrection = async (correction: CorrectionAutreEnriched, updates: any) => {
    try {
      const response = await fetch(`/api/corrections_autres/${correction.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!response.ok) throw new Error('Erreur lors de la mise à jour');

      const updatedCorrection = await response.json();
      setCorrections(prev => prev.map(c => 
        c.id === correction.id ? { ...c, ...updatedCorrection } : c
      ));
      enqueueSnackbar('Correction mise à jour avec succès', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Erreur lors de la mise à jour', { variant: 'error' });
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" className="py-8">
        <LoadingSpinner size="lg" text="Chargement des données..." />
      </Container>
    );
  }

  if (error || !classData) {
    return (
      <Container maxWidth="lg" className="py-8">
        <ErrorDisplay error={error} onRefresh={() => window.location.reload()} />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" className="py-8">
      
    </Container>
  );
}