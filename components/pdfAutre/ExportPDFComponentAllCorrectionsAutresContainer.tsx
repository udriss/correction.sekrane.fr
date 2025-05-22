// ExportPDFComponentAllCorrectionsAutresContainer.tsx - Composant principal pour l'export des corrections
import React, { useState, useEffect } from 'react';
import { Box, Alert, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useSnackbar } from 'notistack';
import ErrorDisplay from '@/components/ui/ErrorDisplay';
import CorrectionsPreview from './CorrectionsPreview';
import ExportOptionsPanel from './ExportOptionsPanel';
import { 
  ArrangementType, 
  SubArrangementType, 
  ExportFormat, 
  ViewType 
} from '@/components/pdfAutre/types';
import { allCorrectionsAutreDataProcessingService } from '@/components/pdfAutre/allCorrectionsAutreDataProcessingService';
import { Student, CorrectionAutreEnriched, ActivityAutre } from '@/lib/types';

// Import des services d'export
import { exportToXLSX } from './exportUtils/xlsxExportService';
import { generatePDF } from './exportUtils/pdfExportUtils';
import { qrCodesPDFUtils } from './exportUtils/qrCodeExportUtils';
import { downloadCSV, generateDetailedCSV, generateSimplifiedCSV } from './exportUtils/csvExportUtils';

interface ExportPDFComponentAllCorrectionsAutresContainerProps {
  corrections: CorrectionAutreEnriched[];
  activities: ActivityAutre[];
  students: Student[];
  uniqueActivities: { id: number; name: string }[];
  getActivityById: (activityId: number) => ActivityAutre | undefined;
  getStudentById: (studentId: number | null) => Student | undefined;
  getAllClasses: () => Promise<any[]>;
  filterClasses?: number[] | 'all'; // Ajout du filtre de classes optionnel
}

const ExportPDFComponentAllCorrectionsAutresContainer: React.FC<ExportPDFComponentAllCorrectionsAutresContainerProps> = ({
  corrections,
  activities,
  students,
  uniqueActivities,
  getActivityById,
  getStudentById,
  getAllClasses,
  filterClasses = 'all',
}) => {
  // États pour les options d'export
  const [arrangement, setArrangement] = useState<ArrangementType>('class');
  const [subArrangement, setSubArrangement] = useState<SubArrangementType>('student');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('pdf');
  const [viewType, setViewType] = useState<ViewType>('detailed');
  const [activeTab, setActiveTab] = useState<number>(0);
  const [includeAllStudents, setIncludeAllStudents] = useState<boolean>(false);
  const [filterActivity, setFilterActivity] = useState<number[] | 'all'>('all');
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [classesMap, setClassesMap] = useState<Map<number | null, any>>(new Map());
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | string | null>(null);
  const [errorDetails, setErrorDetails] = useState<any | null>(null);
  const [filterClassesState, setFilterClassesState] = useState<'all' | number[]>(filterClasses);

  const { enqueueSnackbar } = useSnackbar();

  // Fonction pour effacer les erreurs
  const clearError = () => {
    setError(null);
    setErrorDetails(null);
  };

  // Effet pour charger les classes au chargement du composant
  useEffect(() => {
    const loadClasses = async () => {
      if (getAllClasses) {
        setLoading(true);
        try {
          const classes = await getAllClasses();
          const newClassesMap = new Map();
          classes.forEach((cls: any) => {
            newClassesMap.set(cls.id, cls);
          });
          setClassesMap(newClassesMap);
        } catch (error) {
          console.error('Erreur lors du chargement des classes:', error);
          setError('Erreur lors du chargement des classes');
          setErrorDetails(error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadClasses();
  }, [getAllClasses]);

  // Effet pour charger tous les étudiants au montage du composant
  useEffect(() => {
    const loadAllStudents = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/students');
        if (!response.ok) {
          throw new Error('Erreur lors du chargement des étudiants');
        }
        const allStudentsData = await response.json();
        setAllStudents(allStudentsData);
      } catch (error) {
        console.error('Erreur lors du chargement des étudiants:', error);
        setError('Erreur lors du chargement de tous les étudiants');
        setErrorDetails(error);
      } finally {
        setLoading(false);
      }
    };

    loadAllStudents();
  }, []);

  // Filtrer les corrections en fonction de l'activité ET de la classe sélectionnée
  const filteredCorrections = React.useMemo(() => {
    let result = [...corrections];
    if (filterActivity !== 'all' && Array.isArray(filterActivity)) {
      result = result.filter(c => filterActivity.includes(c.activity_id));
    }
    if (filterClassesState !== 'all' && Array.isArray(filterClassesState)) {
      result = result.filter(c => c.class_id !== null && filterClassesState.includes(c.class_id));
    }
    return result;
  }, [corrections, filterActivity, filterClassesState]);

  // Calculer dynamiquement les classes disponibles à partir des corrections filtrées
  const availableClassesForExport = React.useMemo(() => {
    const classIds = new Set<number>();
    corrections.forEach(c => {
      if (c.class_id !== null && c.class_id !== undefined) {
        classIds.add(c.class_id);
      }
    });
    // On construit une liste d'objets {id, name} pour toutes les classes présentes dans les corrections
    const classesFromCorrections = Array.from(classIds).map(id => ({ id, name: classesMap.get(id)?.name || `Classe ${id}` }));
    return classesFromCorrections;
  }, [corrections, classesMap]);

  // Synchroniser le filtre local et le prop parent
  useEffect(() => {
    setFilterClassesState(filterClasses);
  }, [filterClasses]);

  // Fonction pour gérer le changement d'onglet
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Obtenir les sous-arrangements disponibles
  const getAvailableSubArrangements = (): SubArrangementType[] => {
    switch (arrangement) {
      case 'student':
        return ['activity', 'class', 'none'];
      case 'class':
        return ['student', 'activity', 'subclass', 'none'];
      case 'subclass':
        return ['student', 'activity', 'class', 'none'];
      case 'activity':
        return ['student', 'class', 'none'];
      default:
        return ['none'];
    }
  };

  // Mettre à jour le sous-arrangement lorsque l'arrangement principal change
  React.useEffect(() => {
    const availableSubArrangements = getAvailableSubArrangements();
    if (!availableSubArrangements.includes(subArrangement)) {
      setSubArrangement(availableSubArrangements[0]);
    }
  }, [arrangement]);

  // Fonction pour gérer l'export en fonction de l'onglet actif et du format sélectionné
  const handleExport = async () => {
    try {
      setLoading(true);
      // Si l'onglet QR Codes est actif, générer le PDF de QR codes
      if (activeTab === 0) {
        const studentsToUse = includeAllStudents && allStudents.length > 0
          ? allStudents
          : allStudents.filter(student =>
              filteredCorrections.some(c => c.student_id === student.id)
            );
        const groupedData = allCorrectionsAutreDataProcessingService.organizeAllCorrectionsData({
          corrections: filteredCorrections,
          includeAllStudents,
          filterActivity,
          filterClasses: filterClassesState,
          arrangement,
          subArrangement,
          uniqueActivities,
          students: studentsToUse,
          getActivityById,
          getStudentById: (studentId) => {
            if (studentId === null) return undefined;
            if (includeAllStudents && allStudents.length > 0) {
              const student = allStudents.find(s => s.id === studentId);
              if (student) return student;
            }
            return getStudentById(studentId);
          },
          classesMap
        });
        await qrCodesPDFUtils(
          filteredCorrections,
          uniqueActivities,
          filterActivity,
          includeAllStudents,
          allStudents,
          studentsToUse,
          arrangement,
          subArrangement,
          activities,
          getActivityById,
          getStudentById,
          enqueueSnackbar,
          setError,
          setErrorDetails,
          groupedData,
          viewType === 'detailed'
        );
        return;
      }
      // Sinon, procéder avec l'export normal des notes
      const studentsToUse = includeAllStudents && allStudents.length > 0
        ? allStudents
        : students;
      // Les corrections sont déjà filtrées par classe dans filteredCorrections
      // On passe 'all' à exportToXLSX pour éviter tout double filtrage
      const groupedData = allCorrectionsAutreDataProcessingService.organizeAllCorrectionsData({
        corrections: filteredCorrections,
        includeAllStudents,
        filterActivity,
        filterClasses: filterClassesState, // utilisé pour PDF/CSV, mais filtrage déjà fait pour XLSX
        arrangement,
        subArrangement,
        uniqueActivities,
        students: studentsToUse,
        getActivityById,
        getStudentById: (studentId) => {
          if (studentId === null) return undefined;
          if (includeAllStudents && allStudents.length > 0) {
            const student = allStudents.find(s => s.id === studentId);
            if (student) return student;
          }
          return getStudentById(studentId);
        },
        classesMap
      });
      switch (exportFormat) {
        case 'pdf':
          await generatePDF(
            groupedData, 
            filterActivity, 
            uniqueActivities, 
            getActivityById, 
            getStudentById, 
            enqueueSnackbar
          );
          break;
        case 'xlsx':
          await exportToXLSX(
            groupedData,
            arrangement,
            subArrangement,
            viewType,
            getStudentById,
            getActivityById,
            classesMap,
            enqueueSnackbar,
            filterClassesState // transmettre la vraie sélection utilisateur
          );
          break;
        case 'csv':
          Object.entries(groupedData).forEach(([key, value]: [string, any]) => {
            let csvContent = "";
            let fileName = "";
            if (value.corrections) {
              fileName = `Notes_${arrangement}_${key.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
              if (viewType === 'simplified' && (arrangement === 'class' || arrangement === 'subclass')) {
                csvContent = generateSimplifiedCSV(
                  value.corrections,
                  getStudentById,
                  getActivityById
                );
              } else {
                csvContent = generateDetailedCSV(
                  value.corrections,
                  getStudentById,
                  getActivityById,
                  classesMap
                );
              }
              downloadCSV(csvContent, fileName);
            } else if (value.items) {
              Object.entries(value.items).forEach(([subKey, subValue]: [string, any]) => {
                const safeKey = key.replace(/\s+/g, '_');
                const safeSubKey = subKey.replace(/\s+/g, '_');
                fileName = `Notes_${arrangement}_${subArrangement}_${safeKey}_${safeSubKey}_${new Date().toISOString().slice(0, 10)}.csv`;
                if (subValue.corrections && subValue.corrections.length > 0) {
                  if (viewType === 'simplified' && (arrangement === 'class' || arrangement === 'subclass')) {
                    csvContent = generateSimplifiedCSV(
                      subValue.corrections,
                      getStudentById,
                      getActivityById
                    );
                  } else {
                    csvContent = generateDetailedCSV(
                      subValue.corrections,
                      getStudentById,
                      getActivityById,
                      classesMap
                    );
                  }
                  downloadCSV(csvContent, fileName);
                }
              });
            }
          });
          enqueueSnackbar(`Fichier(s) CSV généré(s) avec succès`, { variant: 'success' });
          break;
        default:
          throw new Error('Format d\'export inconnu');
      }
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      setError('Erreur lors de l\'export');
      setErrorDetails(error);
    } finally {
      setLoading(false);
    }
  };

  // Correction : s'assurer que getStudentById retourne bien Student | undefined
  // Correction : la fonction du composant retourne bien du JSX
  return (
    <Box sx={{ width: '100%' }}>
      {/* Afficher les erreurs si nécessaire */}
      {error && (
        <ErrorDisplay 
          error={error} 
          errorDetails={errorDetails} 
          onRefresh={() => window.location.reload()}
        />
      )}

      {/* Sélecteur multi-classes pour l'export, visible partout */}
      <FormControl size="small" sx={{ minWidth: 220, mb: 2 }}>
        <InputLabel id="class-filter-export-label">Filtrer par classe</InputLabel>
        <Select
          labelId="class-filter-export-label"
          multiple
          value={filterClassesState === 'all' ? [] : filterClassesState}
          onChange={e => {
            const value = e.target.value as (number | string)[];
            const valueAsNumbers = value.map(Number).filter(v => !isNaN(v));
            setFilterClassesState(valueAsNumbers.length === 0 ? 'all' : valueAsNumbers);
          }}
          renderValue={selected =>
            selected.length === 0
              ? 'Toutes les classes'
              : availableClassesForExport
                  .filter(cls => selected.includes(cls.id))
                  .map(cls => cls.name)
                  .join(', ')
          }
          label="Filtrer par classe"
        >
          <MenuItem value="all" disabled={filterClassesState === 'all'}>
            <em>Toutes les classes</em>
          </MenuItem>
          {availableClassesForExport.map(cls => (
            <MenuItem key={cls.id} value={cls.id}>
              {cls.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Panneau d'options d'export */}
      <ExportOptionsPanel 
        activeTab={activeTab}
        handleTabChange={handleTabChange}
        filterActivity={filterActivity}
        setFilterActivity={setFilterActivity}
        uniqueActivities={uniqueActivities}
        arrangement={arrangement}
        setArrangement={setArrangement}
        subArrangement={subArrangement}
        setSubArrangement={setSubArrangement}
        viewType={viewType}
        setViewType={setViewType}
        exportFormat={exportFormat}
        setExportFormat={setExportFormat}
        includeAllStudents={includeAllStudents}
        setIncludeAllStudents={setIncludeAllStudents}
        handleExport={handleExport}
        disabled={loading || filteredCorrections.length === 0}
        availableSubArrangements={getAvailableSubArrangements()}
      />

      {/* Aperçu des corrections */}
      <CorrectionsPreview 
        corrections={filteredCorrections}
        getActivityById={getActivityById}
        getStudentById={getStudentById}
        classesMap={classesMap}
        loading={loading}
      />

      {/* Alerte si aucune correction ne correspond */}
      {filteredCorrections.length === 0 && !loading && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          Aucune correction ne correspond aux critères sélectionnés
        </Alert>
      )}
    </Box>
  );
};

export default ExportPDFComponentAllCorrectionsAutresContainer;