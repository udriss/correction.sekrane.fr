import { useState, useEffect } from 'react';
import { ArrangementType, SubArrangementType, ExportFormat, ViewType } from '@/components/pdf/types';

export interface ExportState {
  arrangement: ArrangementType;
  subArrangement: SubArrangementType;
  exportFormat: ExportFormat;
  viewType: ViewType;
  activeTab: number;
  includeAllStudents: boolean;
  allStudents: any[];
  classesMap: Map<number | null, any>;
  loading: boolean;
  error: Error | string | null;
  errorDetails: any | null;
  page: number;
  rowsPerPage: number;
}

export const useExportState = (getAllClasses: () => Promise<any[]>) => {
  const [state, setState] = useState<ExportState>({
    arrangement: 'class',
    subArrangement: 'student',
    exportFormat: 'pdf',
    viewType: 'detailed',
    activeTab: 0,
    includeAllStudents: false,
    allStudents: [],
    classesMap: new Map(),
    loading: false,
    error: null,
    errorDetails: null,
    page: 0,
    rowsPerPage: 10
  });

  const setPartialState = (partial: Partial<ExportState>) => {
    setState(prev => ({ ...prev, ...partial }));
  };

  // Effet pour charger les classes
  useEffect(() => {
    const loadClasses = async () => {
      if (!getAllClasses) return;
      
      setPartialState({ loading: true });
      try {
        const classes = await getAllClasses();
        const newClassesMap = new Map();
        classes.forEach((cls: any) => {
          newClassesMap.set(cls.id, cls);
        });
        setPartialState({ classesMap: newClassesMap });
      } catch (error) {
        setPartialState({
          error: 'Erreur lors du chargement des classes',
          errorDetails: error
        });
      } finally {
        setPartialState({ loading: false });
      }
    };

    loadClasses();
  }, [getAllClasses]);

  // Effet pour charger tous les étudiants
  useEffect(() => {
    const loadAllStudents = async () => {
      if (!state.includeAllStudents) return;
      
      setPartialState({ loading: true });
      try {
        const response = await fetch('/api/students');
        if (!response.ok) {
          throw new Error('Erreur lors du chargement des étudiants');
        }
        const allStudentsData = await response.json();
        setPartialState({ allStudents: allStudentsData });
      } catch (error) {
        setPartialState({
          error: 'Erreur lors du chargement de tous les étudiants',
          errorDetails: error
        });
      } finally {
        setPartialState({ loading: false });
      }
    };

    loadAllStudents();
  }, [state.includeAllStudents]);

  const clearError = () => {
    setPartialState({ error: null, errorDetails: null });
  };

  return {
    state,
    setPartialState,
    clearError
  };
};