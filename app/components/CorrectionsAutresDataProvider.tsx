'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { CorrectionAutre, CorrectionAutreEnriched, ActivityAutre } from '@/lib/types';
import { Student as BaseStudent } from '@/lib/types';
import { useSnackbar } from 'notistack';
import dayjs from 'dayjs';

interface SortOptions {
  field: 'submission_date' | 'grade' | 'student_name' | 'activity_name';
  direction: 'asc' | 'desc';
}

interface ProviderProps {
  children: React.ReactNode;
  initialFilters?: {
    search?: string;
    classId?: string;
    studentId?: string;
    activityId?: string;
    correctionId?: string;
    subClassId?: string;
    recent?: boolean;
    selectedCorrectionIds?: string;
    dateFrom?: string; // Ajout des propriétés dateFrom et dateTo
    dateTo?: string;
  };
  initialSort?: SortOptions;
}

interface MetaData {
  activities: ActivityAutre[];
  students: BaseStudent[];
  classes: {
    id: number;
    name: string;
  }[];
}

interface Filters {
  search: string;
  classId: string;
  studentId: string;
  activityId: string;
  dateFrom: any | null; // Changé à any pour supporter dayjs
  dateTo: any | null; // Changé à any pour supporter dayjs
  minGrade: string;
  maxGrade: string;
  correctionId: string;
  hideInactive: boolean;
  showOnlyInactive: boolean;
  subClassId: string;
  recent: boolean;
  selectedCorrectionIds: string; // Ajout de la propriété selectedCorrectionIds
}

interface PaginationOptions {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

interface ContextValue {
  corrections: CorrectionAutreEnriched[];
  allCorrections: CorrectionAutreEnriched[]; // Toutes les corrections (pour le cache)
  metaData: MetaData;
  sortOptions: SortOptions;
  setSortOptions: (options: SortOptions) => void;
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  activeFilters: string[];
  setActiveFilters: React.Dispatch<React.SetStateAction<string[]>>;
  applyFilter: (filterName: string) => void;
  removeFilter: (filterName: string) => void;
  clearAllFilters: () => void;
  refreshCorrections: () => Promise<void>;
  errorString: string;
  isLoading: boolean;
  // Pagination
  pagination: PaginationOptions;
  setPagination: React.Dispatch<React.SetStateAction<PaginationOptions>>;
  goToPage: (page: number) => void;
  setItemsPerPage: (itemsPerPage: number) => void;
}

const CorrectionsAutresContext = createContext<ContextValue | undefined>(undefined);

export function useCorrectionsAutres() {
  const context = useContext(CorrectionsAutresContext);
  if (!context) {
    throw new Error('useCorrectionsAutres must be used within a CorrectionsAutresProvider');
  }
  return context;
}

export default function CorrectionsAutresProvider({ children, initialFilters, initialSort }: ProviderProps) {
  const { enqueueSnackbar } = useSnackbar();
  const [allCorrections, setAllCorrections] = useState<CorrectionAutre[]>([]);
  const [metaData, setMetaData] = useState<MetaData>({ activities: [], students: [], classes: [] });
  const [errorString, setErrorString] = useState('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [sortOptions, setSortOptions] = useState<SortOptions>(initialSort || {
    field: 'submission_date',
    direction: 'desc'
  });

  // État de pagination
  const [pagination, setPagination] = useState<PaginationOptions>({
    currentPage: 1,
    itemsPerPage: 20,
    totalItems: 0,
    totalPages: 0
  });

  const [filters, setFilters] = useState<Filters>({
    search: initialFilters?.search || '',
    classId: initialFilters?.classId || '',
    studentId: initialFilters?.studentId || '',
    activityId: initialFilters?.activityId || '',
    dateFrom: initialFilters?.dateFrom ? dayjs(initialFilters.dateFrom) : null,
    dateTo: initialFilters?.dateTo ? dayjs(initialFilters.dateTo) : null,
    minGrade: '',
    maxGrade: '',
    correctionId: initialFilters?.correctionId || '',
    hideInactive: false,
    showOnlyInactive: false,
    subClassId: initialFilters?.subClassId || '',
    recent: initialFilters?.recent === true,
    selectedCorrectionIds: initialFilters?.selectedCorrectionIds || '' // S'assurer que cette valeur est initialisée
  });

  // Modification ici pour inclure selectedCorrectionIds dans les filtres actifs initiaux
  const [activeFilters, setActiveFilters] = useState<string[]>(
    Object.entries(initialFilters || {})
      .filter(([key, value]) => value && value !== '')
      .map(([key, _]) => key)
  );

  const fetchCorrections = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/corrections_autres');
      if (!response.ok) throw new Error('Failed to fetch corrections');
      const data = await response.json();
      setAllCorrections(data);
    } catch (error) {
      console.error('Error fetching corrections:', error);
      setErrorString('Erreur lors du chargement des corrections');
      enqueueSnackbar('Erreur lors du chargement des corrections', { variant: 'error' });
      setIsLoading(false);
    }
  }, [enqueueSnackbar]);

  const fetchMetaData = useCallback(async () => {
    setIsLoading(true); // Activation de l'état de chargement

    fetchCorrections();
    
    try {
      const [activitiesRes, studentsRes, classesRes] = await Promise.all([
        fetch('/api/activities_autres'),
        fetch('/api/students'),
        fetch('/api/classes')
      ]);

      if (!activitiesRes.ok) throw new Error('Failed to fetch activities');
      if (!studentsRes.ok) throw new Error('Failed to fetch students');
      if (!classesRes.ok) throw new Error('Failed to fetch classes');

      const [activities, students, classes] = await Promise.all([
        activitiesRes.json(),
        studentsRes.json(),
        classesRes.json()
      ]);

      setMetaData({ activities, students, classes });
    } catch (error) {
      console.error('Error fetching metadata:', error);
      setErrorString('Erreur lors du chargement des données');
      enqueueSnackbar('Erreur lors du chargement des données', { variant: 'error' });
      setIsLoading(false); // Désactiver l'état de chargement en cas d'erreur
    }
    // Ne pas désactiver l'état de chargement ici, il sera désactivé dans le useMemo après filtrage
  }, [enqueueSnackbar, fetchCorrections]);

  const refreshCorrections = useCallback(async () => {
    await fetchCorrections();
  }, [fetchCorrections]);

  useEffect(() => {
    fetchMetaData();
  }, [fetchCorrections, fetchMetaData]);

  const applyFilter = (filterName: string) => {
    if (!activeFilters.includes(filterName)) {
      setActiveFilters(prev => [...prev, filterName]);
    }
  };

  const removeFilter = (filterName: string) => {
    setActiveFilters(prev => prev.filter(f => f !== filterName));
    setFilters(prev => ({
      ...prev,
      [filterName]: typeof prev[filterName as keyof Filters] === 'string' ? '' : null
    }));
  };

  const clearAllFilters = () => {
    setActiveFilters([]);
    setFilters({
      search: '',
      classId: '',
      studentId: '',
      activityId: '',
      dateFrom: null,
      dateTo: null,
      minGrade: '',
      maxGrade: '',
      correctionId: '',
      hideInactive: false,
      showOnlyInactive: false,
      subClassId: '',
      recent: false,
      selectedCorrectionIds: '' // Ajout de la propriété selectedCorrectionIds
    });
  };

  // Fonctions de pagination
  const goToPage = useCallback((page: number) => {
    setPagination(prev => ({
      ...prev,
      currentPage: Math.max(1, Math.min(page, prev.totalPages))
    }));
  }, []);

  const setItemsPerPage = useCallback((itemsPerPage: number) => {
    setPagination(prev => ({
      ...prev,
      itemsPerPage,
      currentPage: 1, // Reset to first page when changing items per page
      totalPages: Math.ceil(prev.totalItems / itemsPerPage)
    }));
  }, []);

  // Fonction pour enrichir les corrections avec les informations liées
  const enrichCorrection = useCallback((correction: CorrectionAutre): CorrectionAutreEnriched => {
    const activity = metaData.activities.find(a => a.id === correction.activity_id);
    const student = metaData.students.find(s => s.id === correction.student_id);
    const class_info = metaData.classes.find(c => c.id === correction.class_id);
    
    const totalPoints = activity?.points.reduce((sum: number, p: number) => sum + p, 0) || 0;
    const earnedPoints = correction.points_earned 
      ? correction.points_earned.reduce((sum: number, p: number) => sum + p, 0) 
      : 0;
    const score_percentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
    const grade = totalPoints > 0 ? (earnedPoints / totalPoints) * 20 : 0;
    
    return {
      ...correction,
      activity_name: activity?.name || 'Activité inconnue',
      student_name: student ? `${student.last_name} ${student.first_name}` : 'Étudiant inconnu',
      class_name: class_info?.name || 'Classe inconnue',
      score_percentage,
      grade: grade,
      sub_class: student?.sub_class || null
    };
  }, [metaData]);

  // Corrections filtrées avec tous les filtres appliqués
  const filteredAndSortedCorrections = useMemo(() => {
    let result = allCorrections.filter((correction: CorrectionAutre) => {
      // Filtre par recherche (dans le nom d'activité, étudiant ou classe)
      if (activeFilters.includes('search') && filters.search) {
        const searchLower = filters.search.toLowerCase();
        const activityName = metaData.activities.find(a => a.id === correction.activity_id)?.name.toLowerCase() || '';
        const student = metaData.students.find(s => s.id === correction.student_id);
        const studentName = student ? 
          `${student.first_name} ${student.last_name}`.toLowerCase() : '';
        const className = metaData.classes.find(c => c.id === correction.class_id)?.name.toLowerCase() || '';
        
        const searchMatches = activityName.includes(searchLower) || 
                              studentName.includes(searchLower) || 
                              className.includes(searchLower) ||
                              (correction.id?.toString() || '').includes(searchLower);
        
        if (!searchMatches) return false;
      }

      // Filtre par ID de correction
      if (activeFilters.includes('correctionId') && filters.correctionId) {
        if (correction.id?.toString() !== filters.correctionId) return false;
      }

      // Filtrage par plusieurs IDs de correction
      if (activeFilters.includes('selectedCorrectionIds') && filters.selectedCorrectionIds) {
        const idsString = filters.selectedCorrectionIds.toString().trim();
        
        // Vérifier si la chaîne est vide
        if (idsString === '') return true;
        
        // Si un seul ID sans virgule (cas qui posait problème)
        if (!idsString.includes(',')) {
          // Comparer directement l'ID de la correction avec la chaîne
          if (correction.id?.toString() !== idsString) return false;
        } else {
          // Traiter comme une liste d'IDs séparés par des virgules
          const ids = idsString.split(',').map(id => id.trim());
          if (!ids.includes(correction.id?.toString())) return false;
        }
      }

      // Filtre par classe
      if (activeFilters.includes('classId') && filters.classId) {
        if (correction.class_id?.toString() !== filters.classId) return false;
      }

      // Filtre par sous-classe
      if (activeFilters.includes('subClassId') && filters.subClassId) {
        const student = metaData.students.find(s => s.id === correction.student_id);
        if (!student || student.sub_class?.toString() !== filters.subClassId) return false;
      }

      // Filtre par étudiant
      if (activeFilters.includes('studentId') && filters.studentId) {
        if (correction.student_id?.toString() !== filters.studentId) return false;
      }

      // Filtre par activité
      if (activeFilters.includes('activityId') && filters.activityId) {
        if (correction.activity_id?.toString() !== filters.activityId) return false;
      }

      // Filtre par date de début
      if (activeFilters.includes('dateFrom') && filters.dateFrom) {
        // Vérification que submission_date existe
        if (!correction.submission_date) return false;
        const submissionDate = new Date(correction.submission_date);
        const dateFrom = new Date(filters.dateFrom);
        dateFrom.setHours(0, 0, 0, 0); // Début de la journée
        if (submissionDate < dateFrom) return false;
      }

      // Filtre par date de fin
      if (activeFilters.includes('dateTo') && filters.dateTo) {
        // Vérification que submission_date existe
        if (!correction.submission_date) return false;
        const submissionDate = new Date(correction.submission_date);
        const dateTo = new Date(filters.dateTo);
        dateTo.setHours(23, 59, 59, 999); // Fin de la journée
        if (submissionDate > dateTo) return false;
      }

      // Filtre par note minimale
      if (activeFilters.includes('minGrade') && filters.minGrade) {
        const activity = metaData.activities.find(a => a.id === correction.activity_id);
        if (!activity) return false;
        
        const totalPoints = activity.points.reduce((sum: number, p: number) => sum + p, 0);
        const earnedPoints = correction.points_earned 
          ? correction.points_earned.reduce((sum: number, p: number) => sum + p, 0) 
          : 0;
        const grade = (earnedPoints / totalPoints) * 20;
        
        if (grade < parseFloat(filters.minGrade)) return false;
      }

      // Filtre par note maximale
      if (activeFilters.includes('maxGrade') && filters.maxGrade) {
        const activity = metaData.activities.find(a => a.id === correction.activity_id);
        if (!activity) return false;
        
        const totalPoints = activity.points.reduce((sum: number, p: number) => sum + p, 0);
        const earnedPoints = correction.points_earned 
          ? correction.points_earned.reduce((sum: number, p: number) => sum + p, 0) 
          : 0;
        const grade = (earnedPoints / totalPoints) * 20;
        
        if (grade > parseFloat(filters.maxGrade)) return false;
      }

      // Filtre des dernières 24h
      if (activeFilters.includes('recent') && filters.recent) {
        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        
        // Vérification que submission_date existe avant de créer la Date
        if (!correction.submission_date) return false;
        const submissionDate = new Date(correction.submission_date);
        if (submissionDate < yesterday) return false;
      }

      // Filtre par statut actif/inactif
      if (activeFilters.includes('hideInactive') && filters.hideInactive) {
        if (correction.status !== 'ACTIVE') return false;
      }

      if (activeFilters.includes('showOnlyInactive') && filters.showOnlyInactive) {
        if (correction.status === 'ACTIVE') return false;
      }

      return true;
    });
    
    // Tri des résultats filtrés
    result = result.sort((a: CorrectionAutre, b: CorrectionAutre) => {
      switch (sortOptions.field) {
        case 'submission_date':
          if (!a.submission_date && !b.submission_date) return 0;
          if (!a.submission_date) return sortOptions.direction === 'asc' ? -1 : 1;
          if (!b.submission_date) return sortOptions.direction === 'asc' ? 1 : -1;
          
          const dateA = new Date(a.submission_date).getTime();
          const dateB = new Date(b.submission_date).getTime();
          return sortOptions.direction === 'asc' ? dateA - dateB : dateB - dateA;
        
        case 'grade':
          const activityA = metaData.activities.find(act => act.id === a.activity_id);
          const activityB = metaData.activities.find(act => act.id === b.activity_id);
          
          if (!activityA || !activityB) return 0;
          
          const totalPointsA = activityA.points.reduce((sum: number, p: number) => sum + p, 0);
          const totalPointsB = activityB.points.reduce((sum: number, p: number) => sum + p, 0);
          
          const earnedPointsA = a.points_earned ? a.points_earned.reduce((sum: number, p: number) => sum + p, 0) : 0;
          const earnedPointsB = b.points_earned ? b.points_earned.reduce((sum: number, p: number) => sum + p, 0) : 0;
          
          const gradeA = (earnedPointsA / totalPointsA) * 20;
          const gradeB = (earnedPointsB / totalPointsB) * 20;
          
          return sortOptions.direction === 'asc' ? gradeA - gradeB : gradeB - gradeA;
        
        case 'student_name':
          const studentA = metaData.students.find(s => s.id === a.student_id);
          const studentB = metaData.students.find(s => s.id === b.student_id);
          
          const nameA = studentA ? `${studentA.last_name} ${studentA.first_name}`.toLowerCase() : '';
          const nameB = studentB ? `${studentB.last_name} ${studentB.first_name}`.toLowerCase() : '';
          
          return sortOptions.direction === 'asc' 
            ? nameA.localeCompare(nameB)
            : nameB.localeCompare(nameA);
        
        case 'activity_name':
          const actNameA = metaData.activities.find(act => act.id === a.activity_id)?.name.toLowerCase() || '';
          const actNameB = metaData.activities.find(act => act.id === b.activity_id)?.name.toLowerCase() || '';
          
          return sortOptions.direction === 'asc'
            ? actNameA.localeCompare(actNameB)
            : actNameB.localeCompare(actNameA);
        
        default:
          return 0;
      }
    });
    
    return result.map(enrichCorrection);
  }, [allCorrections, metaData, filters, activeFilters, sortOptions, enrichCorrection]);

  // Mise à jour de la pagination quand les données filtrées changent
  useEffect(() => {
    const totalItems = filteredAndSortedCorrections.length;
    const totalPages = Math.ceil(totalItems / pagination.itemsPerPage);
    
    setPagination(prev => ({
      ...prev,
      totalItems,
      totalPages,
      currentPage: Math.max(1, Math.min(prev.currentPage, totalPages || 1))
    }));
  }, [filteredAndSortedCorrections.length, pagination.itemsPerPage]);

  // Corrections paginées pour l'affichage
  const paginatedCorrections = useMemo(() => {
    const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
    const endIndex = startIndex + pagination.itemsPerPage;
    return filteredAndSortedCorrections.slice(startIndex, endIndex);
  }, [filteredAndSortedCorrections, pagination.currentPage, pagination.itemsPerPage]);

  // Gestion de l'état de chargement
  useEffect(() => {
    if (allCorrections.length > 0) {
      setIsLoading(false);
    }
  }, [allCorrections.length]);

  const value = {
    corrections: paginatedCorrections,
    allCorrections: filteredAndSortedCorrections,
    metaData,
    sortOptions,
    setSortOptions,
    filters,
    setFilters,
    activeFilters,
    setActiveFilters,
    applyFilter,
    removeFilter,
    clearAllFilters,
    refreshCorrections,
    errorString,
    isLoading,
    pagination,
    setPagination,
    goToPage,
    setItemsPerPage
  };

  return (
    <CorrectionsAutresContext.Provider value={value}>
      {children}
    </CorrectionsAutresContext.Provider>
  );
}