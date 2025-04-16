'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CorrectionAutre, ActivityAutre } from '@/lib/types';
import { Student as BaseStudent } from '@/lib/types';
import { useSnackbar } from 'notistack';

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
  dateFrom?: Date | null;
  dateTo?: Date | null;
  minGrade?: string;
  maxGrade?: string;
  correctionId?: string;
}

interface ContextValue {
  corrections: CorrectionAutre[];
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
  isLoading: boolean; // Ajout de la propriété isLoading
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
  const [corrections, setCorrections] = useState<CorrectionAutre[]>([]);
  const [metaData, setMetaData] = useState<MetaData>({ activities: [], students: [], classes: [] });
  const [errorString, setErrorString] = useState('');
  const [isLoading, setIsLoading] = useState<boolean>(true); // Ajout de l'état isLoading
  const [sortOptions, setSortOptions] = useState<SortOptions>(initialSort || {
    field: 'submission_date',
    direction: 'desc'
  });

  const [filters, setFilters] = useState<Filters>({
    search: initialFilters?.search || '',
    classId: initialFilters?.classId || '',
    studentId: initialFilters?.studentId || '',
    activityId: initialFilters?.activityId || '',
    dateFrom: null,
    dateTo: null,
    minGrade: '',
    maxGrade: '',
    correctionId: ''
  });

  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const fetchCorrections = useCallback(async () => {
    setIsLoading(true); // Activation de l'état de chargement
    try {
      const response = await fetch('/api/corrections_autres');
      if (!response.ok) throw new Error('Failed to fetch corrections');
      const data = await response.json();
      setCorrections(data);
    } catch (error) {
      console.error('Error fetching corrections:', error);
      setErrorString('Erreur lors du chargement des corrections');
      enqueueSnackbar('Erreur lors du chargement des corrections', { variant: 'error' });
    } finally {
      setIsLoading(false); // Désactivation de l'état de chargement une fois terminé
    }
  }, [enqueueSnackbar]);

  const fetchMetaData = useCallback(async () => {
    setIsLoading(true); // Activation de l'état de chargement
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
    } finally {
      setIsLoading(false); // Désactivation de l'état de chargement une fois terminé
    }
  }, [enqueueSnackbar]);

  const refreshCorrections = useCallback(async () => {
    await fetchCorrections();
  }, [fetchCorrections]);

  useEffect(() => {
    fetchCorrections();
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
      correctionId: ''
    });
  };

  const value = {
    corrections,
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
    isLoading // Référence à l'état isLoading au lieu d'une valeur en dur
  };

  return (
    <CorrectionsAutresContext.Provider value={value}>
      {children}
    </CorrectionsAutresContext.Provider>
  );
}