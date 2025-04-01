'use client';

import React, { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import dayjs from 'dayjs';

// Types
export interface Correction {
  id: number;
  activity_id: number;
  activity_name: string;
  student_id: number;
  student_name: string;
  class_id: number | null;
  class_name: string;
  grade: number;
  submission_date: string;
  experimental_points_earned: number;
  theoretical_points_earned: number;
  status: string;
  experimental_points?: number;
  theoretical_points?: number;
  created_at: string; // Correction de "crated_at" à "created_at"
  updated_at: string;
  sub_class?: string | null; // Ajout de la propriété sub_class
}

interface FilterState {
  search: string;
  classId: string;
  studentId: string;
  activityId: string;
  dateFrom: dayjs.Dayjs | null;
  dateTo: dayjs.Dayjs | null;
  minGrade: string;
  maxGrade: string;
  recent: boolean;
  correctionId: string; // Nouvel ajout pour filtrer par ID de correction
}

interface SortOption {
  field: 'submission_date' | 'grade' | 'student_name' | 'activity_name' | 'class_name';
  direction: 'asc' | 'desc';
}

interface MetaData {
  classes: { id: number; name: string }[];
  students: { id: number; name: string }[];
  activities: { id: number; name: string }[];
}

interface ContextData {
  corrections: Correction[];
  filteredCorrections: Correction[];
  loading: boolean;
  error: string | null;
  metaData: MetaData;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  sortOptions: SortOption;
  setSortOptions: React.Dispatch<React.SetStateAction<SortOption>>;
  activeFilters: string[];
  setActiveFilters: React.Dispatch<React.SetStateAction<string[]>>;
  applyFilter: (filterName: string) => void;
  removeFilter: (filterName: string) => void;
  clearAllFilters: () => void;
  refreshData: () => Promise<void>;
}

// Créer le contexte
const CorrectionsContext = createContext<ContextData | undefined>(undefined);

// Hook personnalisé pour utiliser le contexte
export const useCorrections = () => {
  const context = useContext(CorrectionsContext);
  if (context === undefined) {
    throw new Error('useCorrections doit être utilisé avec CorrectionsProvider');
  }
  return context;
};

// Props du provider
interface CorrectionsProviderProps {
  children: ReactNode;
  initialFilters?: Partial<FilterState>;
  initialSort?: Partial<SortOption>;
}

// Composant Provider
export const CorrectionsProvider: React.FC<CorrectionsProviderProps> = ({ 
  children, 
  initialFilters = {}, 
  initialSort = {} 
}) => {
  // États
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [filteredCorrections, setFilteredCorrections] = useState<Correction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Meta-données
  const [metaData, setMetaData] = useState<MetaData>({
    classes: [],
    students: [],
    activities: []
  });
  
  // Filtres et tri
  const [filters, setFilters] = useState<FilterState>({
    search: initialFilters.search || '',
    classId: initialFilters.classId || '',
    studentId: initialFilters.studentId || '',
    activityId: initialFilters.activityId || '',
    dateFrom: initialFilters.dateFrom || null,
    dateTo: initialFilters.dateTo || null,
    minGrade: initialFilters.minGrade || '',
    maxGrade: initialFilters.maxGrade || '',
    recent: initialFilters.recent || false,
    correctionId: initialFilters.correctionId || '' // Initialiser avec la valeur fournie ou vide
  });
  
  const [sortOptions, setSortOptions] = useState<SortOption>({
    field: initialSort.field || 'submission_date',
    direction: initialSort.direction || 'desc'
  });
  
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  
  // Charger les données initiales
  useEffect(() => {
    fetchCorrections();
  }, []);
  
  // Appliquer les filtres et le tri
  useEffect(() => {
    if (!corrections.length) return;
    
    let filtered = [...corrections];
    
    // Appliquer tous les filtres actifs
    if (filters.search && activeFilters.includes('search')) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(correction =>
        correction.student_name.toLowerCase().includes(searchLower) ||
        correction.activity_name.toLowerCase().includes(searchLower) ||
        correction.class_name.toLowerCase().includes(searchLower)
      );
    }
    
    if (filters.classId && activeFilters.includes('classId')) {
      filtered = filtered.filter(correction => 
        correction.class_id === parseInt(filters.classId)
      );
    }
    
    if (filters.studentId && activeFilters.includes('studentId')) {
      filtered = filtered.filter(correction => 
        correction.student_id === parseInt(filters.studentId)
      );
    }
    
    if (filters.activityId && activeFilters.includes('activityId')) {
      filtered = filtered.filter(correction => 
        correction.activity_id === parseInt(filters.activityId)
      );
    }
    
    if (filters.dateFrom && activeFilters.includes('dateFrom')) {
      filtered = filtered.filter(correction => 
        dayjs(correction.submission_date).isAfter(filters.dateFrom)
      );
    }
    
    if (filters.dateTo && activeFilters.includes('dateTo')) {
      filtered = filtered.filter(correction => 
        dayjs(correction.submission_date).isBefore(filters.dateTo)
      );
    }
    
    if (filters.minGrade && activeFilters.includes('minGrade')) {
      filtered = filtered.filter(correction => 
        correction.grade >= parseFloat(filters.minGrade)
      );
    }
    
    if (filters.maxGrade && activeFilters.includes('maxGrade')) {
      filtered = filtered.filter(correction => 
        correction.grade <= parseFloat(filters.maxGrade)
      );
    }

    // Filtre par ID de correction
    if (filters.correctionId && activeFilters.includes('correctionId')) {
      // Si l'ID contient des virgules, c'est une liste d'IDs
      if (filters.correctionId.includes(',')) {
        const ids = filters.correctionId.split(',').map(id => id.trim());
        filtered = filtered.filter(correction => 
          ids.includes(correction.id.toString())
        );
      } else {
        filtered = filtered.filter(correction => 
          correction.id.toString() === filters.correctionId
        );
      }
    }
    
    // Filtre des corrections récentes
    if (activeFilters.includes('recent')) {
      // Obtenir la date de maintenant et soustraire 24 heures
      const recentDate = new Date();
      recentDate.setHours(recentDate.getHours() - 24);
      
      filtered = filtered.filter(correction => {
        // Si la correction a une date de création/soumission
        if (correction.created_at || correction.submission_date) {
          const correctionDate = new Date(correction.created_at || correction.submission_date);
          return correctionDate >= recentDate;
        }
        return false;
      });
    }
    
    // Appliquer le tri
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortOptions.field) {
        case 'student_name':
          comparison = a.student_name.localeCompare(b.student_name);
          break;
        case 'activity_name':
          comparison = a.activity_name.localeCompare(b.activity_name);
          break;
        case 'class_name':
          comparison = a.class_name.localeCompare(b.class_name);
          break;
        case 'grade':
          comparison = a.grade - b.grade;
          break;
        case 'submission_date':
        default:
          comparison = dayjs(a.submission_date).unix() - dayjs(b.submission_date).unix();
          break;
      }
      
      return sortOptions.direction === 'asc' ? comparison : -comparison;
    });
    
    setFilteredCorrections(filtered);
  }, [corrections, filters, activeFilters, sortOptions]);
  
  // Appliquer un filtre
  const applyFilter = (filterName: string) => {
    if (!activeFilters.includes(filterName)) {
      setActiveFilters([...activeFilters, filterName]);
    }
  };
  
  // Retirer un filtre
  const removeFilter = (filterName: string) => {
    setActiveFilters(activeFilters.filter(f => f !== filterName));
    
    // Aussi effacer la valeur du filtre
    setFilters(prev => ({
      ...prev,
      [filterName]: filterName.includes('date') ? null : ''
    }));
  };
  
  // Effacer tous les filtres
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
      recent: false,
      correctionId: ''
    });
  };
  
  // Récupérer les données
  const fetchCorrections = async () => {
    setLoading(true);
    try {
      // Récupérer les corrections
      const response = await fetch('/api/corrections/all');
      if (!response.ok) throw new Error('Erreur lors du chargement des corrections');
      const data = await response.json();
      setCorrections(data);

      // Extraire les métadonnées des corrections
      const classes = new Map();
      const students = new Map();
      const activities = new Map();
      
      data.forEach((correction: Correction) => {
        // Classes
        if (correction.class_id) {
          classes.set(correction.class_id, {
            id: correction.class_id,
            name: correction.class_name
          });
        }
        
        // Étudiants
        if (correction.student_id) {
          students.set(correction.student_id, {
            id: correction.student_id,
            name: correction.student_name
          });
        }
        
        // Activités
        if (correction.activity_id) {
          activities.set(correction.activity_id, {
            id: correction.activity_id,
            name: correction.activity_name
          });
        }
      });
      
      setMetaData({
        classes: Array.from(classes.values()),
        students: Array.from(students.values()),
        activities: Array.from(activities.values())
      });
      
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };
  
  // Rafraîchir les données
  const refreshData = async () => {
    await fetchCorrections();
  };
  
  // Valeur du contexte
  const contextValue: ContextData = {
    corrections,
    filteredCorrections,
    loading,
    error,
    metaData,
    filters,
    setFilters,
    sortOptions,
    setSortOptions,
    activeFilters,
    setActiveFilters,
    applyFilter,
    removeFilter,
    clearAllFilters,
    refreshData
  };
  
  return (
    <CorrectionsContext.Provider value={contextValue}>
      {children}
    </CorrectionsContext.Provider>
  );
};

export default CorrectionsProvider;
