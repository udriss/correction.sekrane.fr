'use client';

import React, { useState, useEffect, createContext, useContext, ReactNode, useCallback, useMemo } from 'react';
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
  bonus?: number | null; // Bonus appliqué à la correction
  created_at: string;
  updated_at: string;
  sub_class?: string | null;
  student_sub_class?: string | null; // Ajout de la propriété student_sub_class
  active?: number; // Ajout du champ active pour identifier les corrections actives/inactives
  final_grade?: number | null; // Note finale avec règle unifiée: si note < 5, max(note + bonus, note), sinon max(note - penalty + bonus, 5)
  points?: number[] | null; // Points de la correction
  points_earned : number[]; // Points obtenus, 
  content: string | null; // Contenu de la correction, 
  group_id: number | null; // ID du groupe
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
  hideInactive: boolean; // Changé de showInactive à hideInactive pour la cohérence
  showOnlyInactive: boolean; // Ajout d'une option pour n'afficher que les inactives
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
  errorDetails: any;
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
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<any>(null);
  
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
    correctionId: initialFilters.correctionId || '',
    subClassId: initialFilters.subClassId || '',
    hideInactive: initialFilters.hideInactive ?? true, // Par défaut, masquer les corrections inactives
    showOnlyInactive: initialFilters.showOnlyInactive || false
  });
  
  const [sortOptions, setSortOptions] = useState<SortOption>({
    field: initialSort.field || 'submission_date',
    direction: initialSort.direction || 'desc'
  });
  
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [subClassStudentIds, setSubClassStudentIds] = useState<number[]>([]);
  
  // Initialisation des filtres actifs
  useEffect(() => {
    const initialActiveFilters: string[] = [];
    
    // Parcourir les filtres initiaux et ajouter aux filtres actifs ceux qui ont une valeur
    // Cette logique doit être cohérente avec l'initialisation des filtres dans /app/corrections/page.tsx
    Object.entries(initialFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        // Pour les valeurs booléennes, ajouter uniquement si true
        if (typeof value === 'boolean') {
          if (value) initialActiveFilters.push(key);
        } 
        // Pour les chaînes, ajouter si non vide
        else if (typeof value === 'string' && value.trim().length > 0) {
          initialActiveFilters.push(key);
        } 
        // Pour les objets dayjs, ajouter si valide
        else if (value instanceof dayjs && value.isValid()) {
          initialActiveFilters.push(key);
        } 
        // Pour les tableaux, ajouter si non vide
        else if (Array.isArray(value) && value.length > 0) {
          initialActiveFilters.push(key);
        }
      }
    });
    
    // Si hideInactive n'est pas explicitement défini à false et showOnlyInactive n'est pas actif,
    // afficher uniquement les corrections actives par défaut
    if (initialFilters.hideInactive !== false && !initialActiveFilters.includes('showOnlyInactive')) {
      initialActiveFilters.push('hideInactive');
      setFilters(prev => ({ ...prev, hideInactive: true }));
    }
    
    // Définir les filtres actifs initiaux
    setActiveFilters(initialActiveFilters);
    
    // Charger les données
    fetchCorrections();
  }, []);
  
  // Fonction pour appliquer tous les filtres
  const applyFilters = useCallback((data: Correction[]) => {
    if (!data.length) return [];
    
    let filtered = [...data];
    
    // Application des filtres en fonction des filtres actifs
    if (activeFilters.includes('hideInactive')) {
      filtered = filtered.filter(correction => {
        // Priorité à correction.status si disponible
        if (correction.status) {
          return correction.status === 'ACTIVE';
        }
        // Compatibilité avec l'ancien système
        return correction.active === 1;
      });
    } else if (activeFilters.includes('showOnlyInactive')) {
      filtered = filtered.filter(correction => {
        // Priorité à correction.status si disponible
        if (correction.status) {
          return correction.status !== 'ACTIVE';
        }
        // Compatibilité avec l'ancien système
        return correction.active === 0;
      });
    }
    
    if (activeFilters.includes('search') && filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(correction =>
        correction.student_name.toLowerCase().includes(searchLower) ||
        correction.activity_name.toLowerCase().includes(searchLower) ||
        correction.class_name.toLowerCase().includes(searchLower)
      );
    }
    
    if (activeFilters.includes('classId') && filters.classId) {
      const classIdStr = filters.classId.toString();
      filtered = filtered.filter(correction => {
        const correctionClassId = correction.class_id !== null ? correction.class_id.toString() : null;
        return correctionClassId === classIdStr;
      });
    }
    
    if (activeFilters.includes('studentId') && filters.studentId) {
      const studentIdStr = filters.studentId.toString();
      filtered = filtered.filter(correction => 
        correction.student_id.toString() === studentIdStr
      );
    }
    
    if (activeFilters.includes('activityId') && filters.activityId) {
      const activityIdStr = filters.activityId.toString();
      filtered = filtered.filter(correction => 
        correction.activity_id.toString() === activityIdStr
      );
    }
    
    if (activeFilters.includes('dateFrom') && filters.dateFrom) {
      filtered = filtered.filter(correction => 
        dayjs(correction.submission_date).isAfter(filters.dateFrom)
      );
    }
    
    if (activeFilters.includes('dateTo') && filters.dateTo) {
      filtered = filtered.filter(correction => 
        dayjs(correction.submission_date).isBefore(filters.dateTo)
      );
    }
    
    if (activeFilters.includes('minGrade') && filters.minGrade) {
      filtered = filtered.filter(correction => 
        correction.grade >= parseFloat(filters.minGrade)
      );
    }
    
    if (activeFilters.includes('maxGrade') && filters.maxGrade) {
      filtered = filtered.filter(correction => 
        correction.grade <= parseFloat(filters.maxGrade)
      );
    }
    
    if (activeFilters.includes('correctionId') && filters.correctionId) {
      if (filters.correctionId.includes(',')) {
        const ids = filters.correctionId.split(',').map(id => id.trim());
        filtered = filtered.filter(correction => 
          ids.includes(correction.id.toString())
        );
      } else {
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
    
    // Application du filtre par sous-classe
    if (activeFilters.includes('subClassId') && filters.subClassId && subClassStudentIds.length > 0) {
      filtered = filtered.filter(correction => 
        subClassStudentIds.includes(correction.student_id)
      );
    }
    
    return filtered;
  }, [activeFilters, filters, subClassStudentIds]);
  
  // Fonction pour appliquer le tri
  const applySorting = useCallback((data: Correction[]) => {
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
          // Appliquer la règle unifiée bonus/pénalité pour le calcul des grades dans le tri
          const calculateFinalGradeForSort = (correction: Correction): number => {
            const grade = correction.grade;
            const penalty = correction.penalty || 0;
            const bonus = correction.bonus || 0;
            
            if (grade < 5) {
              // Si note < 5, on conserve la note mais on peut appliquer le bonus
              return Math.max(grade + bonus, grade);
            } else {
              // Sinon on prend max(note-pénalité+bonus, 5)
              return Math.max(grade - penalty + bonus, 5);
            }
          };
          
          const gradeA = calculateFinalGradeForSort(a);
          const gradeB = calculateFinalGradeForSort(b);
          comparison = gradeA - gradeB;
          break;
        case 'submission_date':
        default:
          comparison = dayjs(a.submission_date).unix() - dayjs(b.submission_date).unix();
          break;
      }
      
      return sortOptions.direction === 'asc' ? comparison : -comparison;
    });
  }, [sortOptions]);
  
  // Effet pour mettre à jour les corrections filtrées
  useEffect(() => {
    if (!corrections.length) return;
    
    // Appliquer les filtres puis le tri
    const filtered = applyFilters(corrections);
    const sortedFiltered = applySorting(filtered);
    
    setFilteredCorrections(sortedFiltered);
    
    // Mise à jour des métadonnées basée sur les corrections filtrées si nécessaire
    if (activeFilters.includes('classId') && !activeFilters.includes('studentId')) {
      // Mettre à jour la liste des étudiants disponibles pour cette classe
      const students = new Map();
      
      sortedFiltered.forEach((correction: Correction) => {
        if (correction.student_id) {
          students.set(correction.student_id, {
            id: correction.student_id,
            name: correction.student_name
          });
        }
      });
      
      setMetaData(prev => ({
        ...prev,
        students: Array.from(students.values())
      }));
    }
  }, [corrections, applyFilters, applySorting, activeFilters]);
  
  // Effet pour gérer la cohérence des filtres actif/inactif
  useEffect(() => {
    // Empêcher d'avoir les deux filtres d'état actifs en même temps
    if (activeFilters.includes('hideInactive') && activeFilters.includes('showOnlyInactive')) {
      // Priorité à showOnlyInactive
      setActiveFilters(prev => prev.filter(f => f !== 'hideInactive'));
    }
    
    // Mettre à jour les valeurs des filtres en fonction des filtres actifs
    setFilters(prev => ({
      ...prev,
      hideInactive: activeFilters.includes('hideInactive'),
      showOnlyInactive: activeFilters.includes('showOnlyInactive')
    }));
  }, [activeFilters]);
  
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
    // Cas spécial pour les filtres d'état (actif/inactif)
    if (filterName === 'hideInactive' && activeFilters.includes('showOnlyInactive')) {
      // Retirer showOnlyInactive si on active hideInactive
      setActiveFilters(prev => [...prev.filter(f => f !== 'showOnlyInactive'), 'hideInactive']);
      setFilters(prev => ({
        ...prev,
        hideInactive: true,
        showOnlyInactive: false
      }));
    } else if (filterName === 'showOnlyInactive' && activeFilters.includes('hideInactive')) {
      // Retirer hideInactive si on active showOnlyInactive
      setActiveFilters(prev => [...prev.filter(f => f !== 'hideInactive'), 'showOnlyInactive']);
      setFilters(prev => ({
        ...prev,
        hideInactive: false,
        showOnlyInactive: true
      }));
    } else if (!activeFilters.includes(filterName)) {
      // Cas normal: ajouter le filtre s'il n'est pas déjà actif
      setActiveFilters(prev => [...prev, filterName]);
      
      // Pour les filtres booléens, s'assurer que l'état du filtre est bien mis à jour
      if (filterName === 'hideInactive' || filterName === 'showOnlyInactive' || filterName === 'recent') {
        setFilters(prev => ({
          ...prev,
          [filterName]: true
        }));
      }
    }
  };
  
  // Retirer un filtre
  const removeFilter = (filterName: string) => {
    // Retirer d'abord le filtre des filtres actifs
    setActiveFilters(prev => prev.filter(f => f !== filterName));
    
    // Traitement spécial pour les filtres d'état des corrections (actif/inactif)
    if (filterName === 'hideInactive' || filterName === 'showOnlyInactive') {
      // Mettre à jour l'état des filtres booléens
      setFilters(prev => ({
        ...prev,
        [filterName]: false
      }));
    } else {
      // Pour les autres filtres, réinitialiser la valeur en fonction du type
      setFilters(prev => ({
        ...prev,
        [filterName]: filterName.includes('date') 
          ? null 
          : filterName === 'recent'
            ? false
            : ''
      }));
    }
  };
  
  // Effacer tous les filtres
  const clearAllFilters = () => {
    // Réinitialiser la liste des filtres actifs
    setActiveFilters([]);
    
    // Réinitialiser tous les filtres à leurs valeurs par défaut
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
      hideInactive: false, // Explicitement mettre à false pour désactiver
      showOnlyInactive: false
    });
  };
  
  // Récupérer les données
  const fetchCorrections = async () => {
    setLoading(true);
    setError(null);
    setErrorDetails(null);
    
    try {
      // Récupérer les corrections
      const response = await fetch('/api/corrections/all');
      if (!response.ok) {
        const errorText = await response.text();
        setError('Erreur lors du chargement des corrections');
        setErrorDetails({
          status: response.status,
          statusText: response.statusText,
          responseText: errorText
        });
        setLoading(false);
        return;
      }
      
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

  // Implement the refresh function
  const refreshCorrections = useCallback(async () => {
    try {
      setLoading(true);
      await fetchCorrections();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur inconnue est survenue');
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
    errorDetails,
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
