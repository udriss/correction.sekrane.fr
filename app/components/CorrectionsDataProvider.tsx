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
  penalty?: number | null; // Correction: utilisation correcte de penalty avec un type number | null
  created_at: string;
  updated_at: string;
  sub_class?: string | null;
  student_sub_class?: string | null; // Ajout de la propriété student_sub_class
  active?: number; // Ajout du champ active pour identifier les corrections actives/inactives
  final_grade?: number | null; // Note finale: si (grade-penalty) < 6 et grade >= 6 alors 6, si grade < 6 alors grade, sinon (grade-penalty)
}

// Définition de l'interface Student pour typer correctement les étudiants
interface Student {
  id: number;
  first_name: string;
  last_name: string;
  name: string;
  email?: string;
  gender?: string;
  sub_class: string | null;
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
  subClassId: string; // Add this property
  showInactive: boolean; // Ajout du filtre pour afficher les corrections inactives
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
  error: Error | null;
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
  refreshCorrections: () => Promise<void>; // Add this new method
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
  const [error, setError] = useState<Error | null>(null);
  
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
    correctionId: initialFilters.correctionId || '', // Initialiser avec la valeur fournie ou vide
    subClassId: initialFilters.subClassId || '', // Initialiser avec la valeur fournie ou vide
    showInactive: initialFilters.showInactive !== undefined ? initialFilters.showInactive : true // Par défaut, afficher les corrections inactives
  });
  
  const [sortOptions, setSortOptions] = useState<SortOption>({
    field: initialSort.field || 'submission_date',
    direction: initialSort.direction || 'desc'
  });
  
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [subClassStudentIds, setSubClassStudentIds] = useState<number[]>([]); // Pour stocker les IDs des étudiants du sous-groupe
  
  // Charger les données initiales
  useEffect(() => {
    // Initialiser les filtres actifs en premier si des filtres initiaux sont fournis
    const initialActiveFilters = [];
    if (initialFilters.search) initialActiveFilters.push('search');
    if (initialFilters.classId) initialActiveFilters.push('classId');
    if (initialFilters.studentId) initialActiveFilters.push('studentId');
    if (initialFilters.activityId) initialActiveFilters.push('activityId');
    if (initialFilters.dateFrom) initialActiveFilters.push('dateFrom');
    if (initialFilters.dateTo) initialActiveFilters.push('dateTo');
    if (initialFilters.minGrade) initialActiveFilters.push('minGrade');
    if (initialFilters.maxGrade) initialActiveFilters.push('maxGrade');
    if (initialFilters.recent) initialActiveFilters.push('recent');
    if (initialFilters.correctionId) initialActiveFilters.push('correctionId');
    if (initialFilters.subClassId) initialActiveFilters.push('subClassId');
    if (initialFilters.showInactive !== undefined) {
      initialActiveFilters.push('showInactive');
    } else {
      // Par défaut, afficher toutes les corrections (y compris inactives)
      initialActiveFilters.push('showInactive');
    }
    
    setActiveFilters(initialActiveFilters);
    
    // Puis charger les corrections
    fetchCorrections();
  }, []);
  
  // Fonction pour appliquer tous les filtres (sauf subClassId qui est traité séparément)
  const applyAllFiltersExceptSubClass = (data: Correction[]) => {
    let filtered = [...data];
    
    
    // Filtrer les corrections inactives, sauf si showInactive est activé
    if (!filters.showInactive || !activeFilters.includes('showInactive')) {
      
      filtered = filtered.filter(correction => {
        // Avec tinyint(1), la valeur 1 est représentée comme 1 (number) et non true (boolean)
        // La valeur 0 est représentée comme 0 (number) et non false (boolean)
        // Considérer la correction comme active si active est 1 ou undefined/null
        return correction.active === 1 || correction.active === undefined || correction.active === null;
      });
      
    } else {
      
    }
    
    if (filters.search && activeFilters.includes('search')) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(correction =>
        correction.student_name.toLowerCase().includes(searchLower) ||
        correction.activity_name.toLowerCase().includes(searchLower) ||
        correction.class_name.toLowerCase().includes(searchLower)
      );
    }
    
    if (filters.classId && activeFilters.includes('classId')) {
      
      
      
      // Convertir en string pour la comparaison afin d'éviter les problèmes de type
      const classIdStr = filters.classId.toString();
      
      filtered = filtered.filter(correction => {
        // Vérifier si class_id est null et le convertir en string pour la comparaison
        const correctionClassId = correction.class_id !== null ? correction.class_id.toString() : null;
        return correctionClassId === classIdStr;
      });
      
      
      
    }
    
    if (filters.studentId && activeFilters.includes('studentId')) {
      
      
      
      // Convertir en string pour la comparaison
      const studentIdStr = filters.studentId.toString();
      
      filtered = filtered.filter(correction => 
        correction.student_id.toString() === studentIdStr
      );
      
      
    }
    
    if (filters.activityId && activeFilters.includes('activityId')) {
      
      
      
      // Convertir en string pour la comparaison
      const activityIdStr = filters.activityId.toString();
      
      filtered = filtered.filter(correction => 
        correction.activity_id.toString() === activityIdStr
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

    if (filters.correctionId && activeFilters.includes('correctionId')) {
      
      
      
      if (filters.correctionId.includes(',')) {
        // Si plusieurs IDs séparés par des virgules
        const ids = filters.correctionId.split(',').map(id => id.trim());
        filtered = filtered.filter(correction => 
          ids.includes(correction.id.toString())
        );
      } else {
        // Si un seul ID
        const correctionIdStr = filters.correctionId.toString();
        filtered = filtered.filter(correction => 
          correction.id.toString() === correctionIdStr
        );
      }
      
      
    }
    
    if (activeFilters.includes('recent')) {
      const recentDate = new Date();
      recentDate.setHours(recentDate.getHours() - 24);
      
      filtered = filtered.filter(correction => {
        if (correction.created_at || correction.submission_date) {
          const correctionDate = new Date(correction.created_at || correction.submission_date);
          return correctionDate >= recentDate;
        }
        return false;
      });
    }
    
    return filtered;
  };
  
  // Fonction pour appliquer le tri
  const applySorting = (data: Correction[]) => {
    return [...data].sort((a, b) => {
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
          const gradeA = a.penalty !== undefined && a.penalty !== null ? 
            Math.max(0, a.grade - a.penalty) : a.grade;
          const gradeB = b.penalty !== undefined && b.penalty !== null ? 
            Math.max(0, b.grade - b.penalty) : b.grade;
          comparison = gradeA - gradeB;
          break;
        case 'submission_date':
        default:
          comparison = dayjs(a.submission_date).unix() - dayjs(b.submission_date).unix();
          break;
      }
      
      return sortOptions.direction === 'asc' ? comparison : -comparison;
    });
  };
  
  // Effet principal pour le filtrage et le tri
  useEffect(() => {
    if (!corrections.length) return;
    
    // Étape 1: Appliquer tous les filtres sauf le filtre par sous-classe
    let filtered = applyAllFiltersExceptSubClass(corrections);
    // Étape 2: Appliquer le filtre de sous-classe si nécessaire
    if (filters.subClassId && activeFilters.includes('subClassId') && subClassStudentIds.length > 0) {
      filtered = filtered.filter(correction => 
        subClassStudentIds.includes(correction.student_id)
      );
    }
    
    // Étape 3: Appliquer le tri
    filtered = applySorting(filtered);
    
    // Mettre à jour l'état des corrections filtrées
    setFilteredCorrections(filtered);
    
    // Mise à jour des métadonnées basée sur les corrections filtrées
    // Cela garantit que les listes déroulantes de filtres contiennent uniquement les valeurs pertinentes
    if (activeFilters.includes('classId') && !activeFilters.includes('studentId')) {
      // Si un filtre de classe est actif mais pas de filtre étudiant,
      // mettre à jour la liste des étudiants disponibles pour cette classe
      const students = new Map();
      
      
      filtered.forEach((correction: Correction) => {
        if (correction.student_id) {
          students.set(correction.student_id, {
            id: correction.student_id,
            name: correction.student_name
          });
        }
      });
      
      // Mettre à jour seulement la liste des étudiants, garder les autres métadonnées inchangées
      setMetaData(prev => ({
        ...prev,
        students: Array.from(students.values())
      }));
    }
  }, [corrections, filters, activeFilters, sortOptions, subClassStudentIds]);

  // Effet pour récupérer les étudiants du sous-groupe
  useEffect(() => {
    if (filters.subClassId && activeFilters.includes('subClassId') && filters.classId) {
      const groupNumber = parseInt(filters.subClassId);
      
      fetch(`/api/classes/${filters.classId}/students`)
        .then(response => response.json())
        .then(students => {
          // Filtrer les étudiants appartenant au sous-groupe spécifié
          const studentsInGroup = students.filter((student: Student) => 
            student.sub_class && parseInt(student.sub_class) === groupNumber
          );
          
          // Récupérer les IDs des étudiants dans ce sous-groupe
          const studentIdsInGroup = studentsInGroup.map((student: Student) => student.id);
          
          // Stocker ces IDs pour être utilisés dans l'effet principal
          setSubClassStudentIds(studentIdsInGroup);
        })
        .catch(err => console.error('Erreur lors de la récupération des étudiants:', err));
    } else {
      // Réinitialiser si le filtre est désactivé
      setSubClassStudentIds([]);
    }
  }, [filters.subClassId, filters.classId, activeFilters]);
  
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
      [filterName]: filterName.includes('date') ? null : 
                   filterName === 'showInactive' ? false : ''
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
      correctionId: '',
      subClassId: '',
      showInactive: false
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
      setError(err instanceof Error ? err : new Error('Erreur inconnue'));
    } finally {
      setLoading(false);
    }
  };
  
  // Rafraîchir les données
  const refreshData = async () => {
    await fetchCorrections();
  };

  // Implement the refresh function
  const refreshCorrections = useCallback(async () => {
    try {
      setLoading(true);
      await fetchCorrections();
      setError(null);
    } catch (err) {
      setError(err as Error);
      console.error('Error refreshing corrections:', err);
    } finally {
      setLoading(false);
    }
  }, []);
  
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
    refreshData,
    refreshCorrections
  };
  
  return (
    <CorrectionsContext.Provider value={contextValue}>
      {children}
    </CorrectionsContext.Provider>
  );
};

export default CorrectionsProvider;
