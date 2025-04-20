// ExportPDFComponentAllCorrectionsAutresContainer.tsx - Composant principal pour l'export des corrections
import React, { useState, useEffect } from 'react';
import { Box, Alert } from '@mui/material';
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
import { generateQRCodePDF } from './exportUtils/qrCodeExportUtils';
import { downloadCSV, generateDetailedCSV, generateSimplifiedCSV } from './exportUtils/csvExportUtils';

interface ExportPDFComponentAllCorrectionsAutresContainerProps {
  corrections: CorrectionAutreEnriched[];
  activities: ActivityAutre[];
  students: Student[];
  filterActivity: number | 'all';
  setFilterActivity: (value: number | 'all') => void;
  uniqueActivities: { id: number; name: string }[];
  getActivityById: (activityId: number) => ActivityAutre | undefined;
  getStudentById: (studentId: number | null) => Student | undefined;
  getAllClasses: () => Promise<any[]>;
}

const ExportPDFComponentAllCorrectionsAutresContainer: React.FC<ExportPDFComponentAllCorrectionsAutresContainerProps> = ({
  corrections,
  activities,
  students,
  filterActivity,
  setFilterActivity,
  uniqueActivities,
  getActivityById,
  getStudentById,
  getAllClasses
}) => {
  // États pour les options d'export
  const [arrangement, setArrangement] = useState<ArrangementType>('class');
  const [subArrangement, setSubArrangement] = useState<SubArrangementType>('student');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('pdf');
  const [viewType, setViewType] = useState<ViewType>('detailed');
  const [activeTab, setActiveTab] = useState<number>(0);
  const [includeAllStudents, setIncludeAllStudents] = useState<boolean>(false);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [classesMap, setClassesMap] = useState<Map<number | null, any>>(new Map());
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | string | null>(null);
  const [errorDetails, setErrorDetails] = useState<any | null>(null);

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

  // Effet pour charger tous les étudiants si nécessaire
  useEffect(() => {
    const loadAllStudents = async () => {
      if (includeAllStudents) {
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
      }
    };

    loadAllStudents();
  }, [includeAllStudents]);

  // Filtrer les corrections en fonction de l'activité sélectionnée
  const filteredCorrections = React.useMemo(() => {
    let result = [...corrections];
    if (filterActivity !== 'all') {
      result = result.filter(c => c.activity_id === filterActivity);
    }
    return result;
  }, [corrections, filterActivity]);

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
        // Obtenir les données organisées
        const studentsToUse = includeAllStudents && allStudents.length > 0
          ? allStudents
          : students;

        const groupedData = allCorrectionsAutreDataProcessingService.organizeAllCorrectionsData({
          corrections: filteredCorrections,
          includeAllStudents,
          filterActivity,
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

        // Générer le PDF des QR codes
        await generateQRCodePDF(
          filteredCorrections,
          uniqueActivities,
          filterActivity,
          includeAllStudents,
          allStudents,
          students,
          arrangement,
          subArrangement,
          activities,
          getActivityById,
          getStudentById,
          enqueueSnackbar,
          setError,
          setErrorDetails,
          groupedData
        );
        
        return;
      }
      
      // Sinon, procéder avec l'export normal des notes
      const studentsToUse = includeAllStudents && allStudents.length > 0
        ? allStudents
        : students;
      
      const groupedData = allCorrectionsAutreDataProcessingService.organizeAllCorrectionsData({
        corrections: filteredCorrections,
        includeAllStudents,
        filterActivity,
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

      // Exporter selon le format sélectionné
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
            enqueueSnackbar
          );
          break;
        case 'csv':
          // Export CSV - Créer un fichier par groupe
          Object.entries(groupedData).forEach(([key, value]: [string, any]) => {
            // Déterminer les données à exporter
            let csvContent = "";
            let fileName = "";
            
            // Si pas de sous-arrangement, exporter un fichier unique
            if (value.corrections) {
              fileName = `Notes_${arrangement}_${key.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
              
              if (viewType === 'simplified' && (arrangement === 'class' || arrangement === 'subclass')) {
                // Format simplifié pour l'arrangement par classe
                csvContent = generateSimplifiedCSV(
                  value.corrections,
                  getStudentById,
                  getActivityById
                );
              } else {
                // Format détaillé standard
                csvContent = generateDetailedCSV(
                  value.corrections,
                  getStudentById,
                  getActivityById,
                  classesMap
                );
              }
              
              // Déclencher le téléchargement
              downloadCSV(csvContent, fileName);
            } 
            // Sinon exporter un fichier pour chaque sous-groupe
            else if (value.items) {
              Object.entries(value.items).forEach(([subKey, subValue]: [string, any]) => {
                const safeKey = key.replace(/\s+/g, '_');
                const safeSubKey = subKey.replace(/\s+/g, '_');
                
                fileName = `Notes_${arrangement}_${subArrangement}_${safeKey}_${safeSubKey}_${new Date().toISOString().slice(0, 10)}.csv`;
                
                // Vérifier si subValue a des corrections
                if (subValue.corrections && subValue.corrections.length > 0) {
                  if (viewType === 'simplified' && (arrangement === 'class' || arrangement === 'subclass')) {
                    // Format simplifié pour l'arrangement par classe
                    csvContent = generateSimplifiedCSV(
                      subValue.corrections,
                      getStudentById,
                      getActivityById
                    );
                  } else {
                    // Format détaillé standard
                    csvContent = generateDetailedCSV(
                      subValue.corrections,
                      getStudentById,
                      getActivityById,
                      classesMap
                    );
                  }
                  
                  // Déclencher le téléchargement
                  downloadCSV(csvContent, fileName);
                }
              });
            }
          });
          
          // Afficher message de succès
          enqueueSnackbar(`Fichier(s) CSV généré(s) avec succès`, { variant: 'success' });
          break;
      }
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      setError(`Erreur lors de l'export en format ${exportFormat.toUpperCase()}`);
      setErrorDetails(error);
    } finally {
      setLoading(false);
    }
  };

  // Liste des sous-arrangements disponibles
  const availableSubArrangements = getAvailableSubArrangements();

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
        availableSubArrangements={availableSubArrangements}
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