// xlsxExportService.ts - Service pour l'export des données en XLSX
import { createExcelWorksheet } from './xlsxExportUtils';
import { ArrangementType, SubArrangementType, ViewType } from '@/components/pdfAutre/types';
import { Student, CorrectionAutreEnriched, ActivityAutre } from '@/lib/types';

// Fonction pour exporter les données en XLSX
export const exportToXLSX = async (
  groupedData: any,
  arrangement: ArrangementType,
  subArrangement: SubArrangementType,
  viewType: ViewType,
  getStudentById: (studentId: number | null) => Student | undefined,
  getActivityById: (activityId: number) => ActivityAutre | undefined,
  classesMap: Map<number | null, any>,
  enqueueSnackbar: (message: string, options: any) => void,
  filterClasses: number[] | 'all' = 'all' // Ajout du filtre multi-classes
) => {
  try {
    // Importer la bibliothèque ExcelJS dynamiquement
    const ExcelJS = (await import('exceljs')).default;
    
    // Créer un nouveau classeur
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Système de correction';
    workbook.lastModifiedBy = 'Utilisateur';
    workbook.created = new Date();
    workbook.modified = new Date();
    
    // Ajouter des métadonnées
    workbook.properties.date1904 = false;
    
    // Générer des feuilles pour chaque section principale
    const usedSheetNames = new Set<string>();
    Object.entries(groupedData).forEach(([key, value]: [string, any]) => {
      // Génère un nom de feuille unique (max 31 caractères)
      let baseSheetName = key.substring(0, 31);
      let sheetName = baseSheetName;
      let counter = 1;
      while (usedSheetNames.has(sheetName)) {
        // Ajoute un suffixe numérique pour garantir l'unicité
        const suffix = `_${counter}`;
        sheetName = baseSheetName.substring(0, 31 - suffix.length) + suffix;
        counter++;
      }
      usedSheetNames.add(sheetName);
      // Si pas de sous-arrangement, générer une seule feuille
      if (value.corrections) {
        const worksheet = workbook.addWorksheet(sheetName);
        createExcelWorksheet(
          worksheet, 
          value.corrections, 
          viewType, 
          arrangement,
          subArrangement,
          getStudentById,
          getActivityById,
          classesMap,
          filterClasses // propagation du filtre
        );
      } 
      // Sinon générer une feuille pour chaque sous-arrangement
      else if (value.items) {
        Object.entries(value.items).forEach(([subKey, subValue]: [string, any]) => {
          let baseSubSheetName;
          if (arrangement === 'subclass') {
            // Récupérer le nom de la classe principale si possible
            let className = key;
            let subclassName = subKey;
            // Ajout du type de sous-arrangement (ex: 'student', 'activity', etc.)
            let subArrLabel = subArrangement ? String(subArrangement) : '';
            baseSubSheetName = `${className} - ${subclassName} - ${subArrLabel}`.substring(0, 31);
          } else {
            baseSubSheetName = `${key.substring(0, 15)}-${subKey.substring(0, 15)}`;
          }
          let subSheetName = baseSubSheetName.substring(0, 31);
          let subCounter = 1;
          while (usedSheetNames.has(subSheetName)) {
            const suffix = `_${subCounter}`;
            subSheetName = baseSubSheetName.substring(0, 31 - suffix.length) + suffix;
            subCounter++;
          }
          usedSheetNames.add(subSheetName);
          const worksheet = workbook.addWorksheet(subSheetName);
          createExcelWorksheet(
            worksheet, 
            subValue.corrections, 
            viewType, 
            arrangement,
            subArrangement,
            getStudentById,
            getActivityById,
            classesMap,
            filterClasses // propagation du filtre
          );
        });
      }
    });
    
    // Générer le fichier XLSX
    const buffer = await workbook.xlsx.writeBuffer();
    
    // Créer un Blob à partir du buffer
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    // Créer une URL pour le blob
    const url = URL.createObjectURL(blob);
    
    // Créer un lien de téléchargement et déclencher le téléchargement
    const fileName = `Notes_Toutes_Classes_${new Date().toISOString().slice(0, 10)}.xlsx`;
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    
    // Nettoyer
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Afficher message de succès
    enqueueSnackbar(`Fichier Excel généré avec succès: ${fileName}`, { variant: 'success' });
    
  } catch (error) {
    console.error('Erreur lors de la génération du fichier Excel:', error);
    throw error;
  }
};