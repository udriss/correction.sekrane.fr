import React, { useState } from 'react';
import { 
  Typography, 
  Box, 
  Grid, 
  FormControlLabel, 
  Checkbox 
} from '@mui/material';
import { useSnackbar } from 'notistack';
import FiltersSection from './FiltersSection';
import ArrangementOptions from './ArrangementOptions';
import ExportFormatOptions from './ExportFormatOptions';
import { 
  ExportPDFComponentProps, 
  ArrangementType, 
  SubArrangementType, 
  ExportFormat, 
  ViewType,
  formatGrade,
  isCorrectionActive,
  getStatusLabel,
  escapeCSV
} from './types';
import { dataProcessingService } from './dataProcessingService';
import { getCorrectionCellValues, getCorrectionCellStyle, CellStyle } from '@/components/pdf/types';

interface NotesTabProps {
  classData: ExportPDFComponentProps['classData'];
  filteredCorrections: ExportPDFComponentProps['corrections'];
  filterActivity: ExportPDFComponentProps['filterActivity'];
  setFilterActivity: ExportPDFComponentProps['setFilterActivity'];
  filterSubClass: ExportPDFComponentProps['filterSubClass'];
  setFilterSubClass: ExportPDFComponentProps['setFilterSubClass'];
  uniqueSubClasses: ExportPDFComponentProps['uniqueSubClasses'];
  uniqueActivities: ExportPDFComponentProps['uniqueActivities'];
  students: ExportPDFComponentProps['students'];
  activities: ExportPDFComponentProps['activities'];
  getActivityById: ExportPDFComponentProps['getActivityById'];
  getStudentById: ExportPDFComponentProps['getStudentById'];
}

const NotesTab: React.FC<NotesTabProps> = ({
  classData,
  filteredCorrections,
  filterActivity,
  setFilterActivity,
  filterSubClass,
  setFilterSubClass,
  uniqueSubClasses,
  uniqueActivities,
  students,
  activities,
  getActivityById,
  getStudentById
}) => {
  const [arrangement, setArrangement] = useState<ArrangementType>('student');
  const [subArrangement, setSubArrangement] = useState<SubArrangementType>('activity');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('pdf');
  const [viewType, setViewType] = useState<ViewType>('detailed');
  const [includeAllStudents, setIncludeAllStudents] = useState<boolean>(false);
  const { enqueueSnackbar } = useSnackbar();

  // Fonction pour obtenir les sous-arrangements disponibles
  const getAvailableSubArrangements = (): SubArrangementType[] => {
    switch (arrangement) {
      case 'student':
        return ['activity', 'class', 'subclass', 'none'];
      case 'class':
        return ['student', 'activity', 'subclass', 'none'];
      case 'subclass':
        return ['student', 'activity', 'class', 'none'];
      case 'activity':
        return ['student', 'class', 'subclass', 'none'];
      default:
        return ['none'];
    }
  };

  // Fonction pour gérer l'export en fonction du format sélectionné
  const handleExport = () => {
    const groupedData = dataProcessingService.organizeData({
      corrections: filteredCorrections,
      includeAllStudents,
      filterActivity,
      filterSubClass,
      arrangement,
      subArrangement,
      classData,
      uniqueSubClasses,
      uniqueActivities,
      students,
      getActivityById,
      getStudentById
    });

    if (exportFormat === 'pdf') {
      generateGradesPDF(groupedData);
    } else if (exportFormat === 'csv') {
      exportToCSV(groupedData);
    } else if (exportFormat === 'xlsx') {
      exportToXLSX(groupedData);
    }
  };

  // Fonction pour générer un PDF avec les notes
  const generateGradesPDF = async (groupedData: any) => {
    try {
      // Utiliser jspdf pour générer le PDF
      const jsPDFModule = await import('jspdf');
      const jsPDF = jsPDFModule.jsPDF;
      
      // Importer et configurer jspdf-autotable correctement
      const autoTableModule = await import('jspdf-autotable');
      
      // Créer un nouveau document PDF avec une police type LaTeX
      const doc = new jsPDF();
      
      // Ajouter une police similaire à LaTeX (Times New Roman est proche de Computer Modern)
      doc.setFont('times', 'normal');
      
      // Données pour l'en-tête
      const title = `Récapitulatif des notes - ${classData.name}`;
      const subtitle = filterSubClass !== 'all' 
        ? `Groupe: ${uniqueSubClasses.find(g => g.id.toString() === filterSubClass)?.name}`
        : 'Tous les groupes';
      const activityTitle = filterActivity !== 'all'
        ? `Activité: ${uniqueActivities.find(a => a.id === filterActivity)?.name}`
        : 'Toutes les activités';
      const dateStr = new Date().toLocaleDateString('fr-FR', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      // Ajouter un rectangle décoratif en haut
      doc.setFillColor(66, 135, 245); // Bleu, couleur cohérente avec les tableaux
      doc.rect(0, 0, doc.internal.pageSize.width, 20, 'F');
      
      // Ajouter un rectangle décoratif en bas pour le pied de page
      doc.setFillColor(240, 240, 240); // Gris clair
      doc.rect(0, doc.internal.pageSize.height - 15, doc.internal.pageSize.width, 15, 'F');
      
      // Titre principal
      doc.setFontSize(22);
      doc.setTextColor(0, 0, 0);
      doc.setFont('times', 'bold');
      doc.text(title, doc.internal.pageSize.width / 2, 35, { align: 'center' });
      
      // Ligne de séparation
      doc.setDrawColor(66, 135, 245); // Bleu
      doc.setLineWidth(0.5);
      doc.line(50, 40, doc.internal.pageSize.width - 50, 40);
      
      // Informations sous le titre
      doc.setFontSize(12);
      doc.setFont('times', 'normal');
      
      const leftX = 20;
      let currentY = 50;
      const lineHeight = 7;
      
      // Colonne de gauche
      doc.text(subtitle, leftX, currentY);
      currentY += lineHeight;
      doc.text(activityTitle, leftX, currentY);
      
      // Colonne de droite
      const rightX = doc.internal.pageSize.width - 20;
      currentY = 50;
      
      // Fonction pour générer un libellé pour chaque option
      const getArrangementLabel = (type: ArrangementType | SubArrangementType): string => {
        switch (type) {
          case 'student': return 'Par étudiant';
          case 'class': return 'Par classe';
          case 'subclass': return 'Par groupe';
          case 'activity': return 'Par activité';
          case 'none': return 'Aucun sous-arrangement';
          default: return '';
        }
      };
      
      doc.text(`Date: ${dateStr}`, rightX, currentY, { align: 'right' });
      currentY += lineHeight;
      doc.text(`Organisation: ${getArrangementLabel(arrangement)} > ${getArrangementLabel(subArrangement)}`, rightX, currentY, { align: 'right' });
      
      // Position de départ pour le contenu du PDF
      let yPosition = currentY + 15;
      
      // Générer le PDF selon l'arrangement choisi
      generatePDFContent(doc, groupedData, yPosition);
      
      // Une fois que tout le contenu est ajouté, on peut obtenir le nombre total de pages
      const totalPages = doc.getNumberOfPages();
      
      // Ajouter les pieds de page à toutes les pages
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        
        // Ajouter un rectangle décoratif en bas pour le pied de page sur chaque page
        doc.setFillColor(240, 240, 240); // Gris clair
        doc.rect(0, doc.internal.pageSize.height - 15, doc.internal.pageSize.width, 15, 'F');
        
        // Numérotation des pages
        const pageInfo = `Page ${i}/${totalPages}`;
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text(pageInfo, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 7, { align: 'center' });
        
        // Petite note informative
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text('Document généré automatiquement - Correction.sekrane.fr', doc.internal.pageSize.width - 20, doc.internal.pageSize.height - 7, { align: 'right' });
      }
      
      // Sauvegarder le PDF
      const fileName = `Notes_${classData.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(fileName);
      
      // Afficher message de succès
      enqueueSnackbar(`PDF des notes généré avec succès: ${fileName}`, { variant: 'success' });
      
    } catch (error) {
      console.error('Erreur lors de la génération du PDF des notes:', error);
      enqueueSnackbar('Erreur lors de la génération du PDF des notes', { variant: 'error' });
    }
  };

  // Fonction pour générer le contenu du PDF selon les données organisées
  const generatePDFContent = (doc: any, data: any, startY: number) => {
    let yPosition = startY;
    const autoTableModule = require('jspdf-autotable').default;
    
    // Parcourir les entrées du premier niveau
    Object.entries(data).forEach(([key, value]: [string, any]) => {
      // Vérifier si on doit passer à une nouvelle page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      // Titre du premier niveau
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text(key, 14, yPosition);
      yPosition += 8;
      doc.setFont(undefined, 'normal');
      
      // Si pas de sous-arrangement, afficher un tableau unique
      if (value.corrections) {
        if (viewType === 'simplified' && arrangement === 'class') {
          // Tableau simplifié pour l'arrangement par classe
          generateSimplifiedTable(doc, value.corrections, yPosition);
        } else {
          // Tableau détaillé standard
          generateDetailedTable(doc, value.corrections, yPosition);
        }
        
        // Mettre à jour la position Y
        yPosition = (doc as any).lastAutoTable.finalY + 15;
      } 
      // Sinon parcourir les sous-arrangements
      else if (value.items) {
        Object.entries(value.items).forEach(([subKey, subValue]: [string, any]) => {
          // Vérifier si on doit passer à une nouvelle page
          if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
          }
          
          // Titre du sous-niveau
          doc.setFontSize(12);
          doc.text(`${subKey}`, 20, yPosition);
          yPosition += 6;
          
          // Générer le tableau pour ce sous-niveau
          if (viewType === 'simplified' && arrangement === 'class') {
            // Tableau simplifié pour l'arrangement par classe
            generateSimplifiedTable(doc, subValue.corrections, yPosition);
          } else {
            // Tableau détaillé standard
            generateDetailedTable(doc, subValue.corrections, yPosition);
          }
          
          // Mettre à jour la position Y
          yPosition = (doc as any).lastAutoTable.finalY + 15;
        });
      }
    });
  };

  // Fonction pour générer un tableau détaillé
  const generateDetailedTable = (doc: any, corrections: any[], yPosition: number) => {
    const tableData = corrections.map(c => {
      const activity = getActivityById(c.activity_id);
      const student = getStudentById(c.student_id);
      
      // Utiliser getCorrectionCellValues pour obtenir les valeurs formatées
      const cellValues = getCorrectionCellValues(c, activity);
      
      // Déterminer les valeurs à afficher
      let totalGradeDisplay, expGradeDisplay, theoGradeDisplay;
      
      if (typeof cellValues.totalGradeDisplay === 'number') {
        totalGradeDisplay = `${formatGrade(cellValues.totalGradeDisplay)} / 20`;
      } else {
        totalGradeDisplay = cellValues.totalGradeDisplay;
      }
      
      if (typeof cellValues.expGradeDisplay === 'number') {
        expGradeDisplay = `${formatGrade(cellValues.expGradeDisplay)} / ${activity?.experimental_points || 0}`;
      } else {
        expGradeDisplay = cellValues.expGradeDisplay;
      }
      
      if (typeof cellValues.theoGradeDisplay === 'number') {
        theoGradeDisplay = `${formatGrade(cellValues.theoGradeDisplay)} / ${activity?.theoretical_points || 0}`;
      } else {
        theoGradeDisplay = cellValues.theoGradeDisplay;
      }
      
      return [
        student ? `${student.first_name} ${student.last_name}` : 'N/A',
        activity?.name || `Activité ${c.activity_id}`,
        expGradeDisplay,
        theoGradeDisplay,
        totalGradeDisplay
      ];
    });
    
    const headers = [
      'Étudiant',
      'Activité',
      'Note Exp.',
      'Note Théo.',
      'Total'
    ];
    
    // Ajouter le tableau
    const autoTableModule = require('jspdf-autotable').default;
    autoTableModule(doc, {
      head: [headers],
      body: tableData,
      startY: yPosition,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [66, 135, 245] },
      columnStyles: {
        0: { cellWidth: 'auto' }, // Largeur augmentée pour la colonne des étudiants
        1: { cellWidth: 'auto' },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 'auto' },
        4: { cellWidth: 'auto' }
      },
      margin: { left: 10, right: 10 }, // Marges réduites pour donner plus d'espace au tableau
      didParseCell: function(data: any) {
        // Optimiser le style des cellules d'étudiants pour éviter les coupures de mots
        if (data.column.index === 0) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.overflow = 'ellipsize'; // Plutôt que couper le texte, ajouter "..." si trop long
        }
        
        // Appliquer des styles spéciaux en utilisant getCorrectionCellStyle
        if (data.column.index >= 2 && data.column.index <= 4) {
          const cellValue = data.cell.raw;
          const cellStyle = getCorrectionCellStyle(cellValue);
          
          // Convertir les couleurs hexadécimales en RGB pour jsPDF
          const hexToRgb = (hex: string) => {
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            return [r, g, b];
          };
          
          // Appliquer la couleur du texte
          if (cellStyle.color !== '000000') {
            data.cell.styles.textColor = hexToRgb(cellStyle.color);
          }
          
          // Appliquer la couleur de fond
          if (cellStyle.backgroundColor !== 'FFFFFF') {
            data.cell.styles.fillColor = hexToRgb(cellStyle.backgroundColor);
          }
          
          // Appliquer le style de police
          switch (cellStyle.fontStyle) {
            case 'italic':
              data.cell.styles.fontStyle = 'italic';
              break;
            case 'bold':
              data.cell.styles.fontStyle = 'bold';
              break;
            case 'bolditalic':
              data.cell.styles.fontStyle = 'bolditalic';
              break;
            default:
              data.cell.styles.fontStyle = 'normal';
          }
        }
      }
    });
  };

  // Fonction pour générer un tableau simplifié (pour l'arrangement par classe)
  const generateSimplifiedTable = (doc: any, corrections: any[], yPosition: number) => {
    // Regrouper les étudiants (lignes) et les activités (colonnes)
    const studentMap: Record<string, Record<string, any>> = {};
    const activitySet = new Set<string>();
    
    corrections.forEach(c => {
      const student = getStudentById(c.student_id);
      const activity = getActivityById(c.activity_id);
      
      if (!student) return;
      
      const studentKey = `${student.last_name} ${student.first_name}`;
      const activityKey = activity?.name || `Activité ${c.activity_id}`;
      
      activitySet.add(activityKey);
      
      if (!studentMap[studentKey]) {
        studentMap[studentKey] = {};
      }
      
      // Utiliser getCorrectionCellValues pour obtenir les valeurs formatées
      const cellValues = getCorrectionCellValues(c, activity);
      let displayValue;
      
      // Formater la valeur de la cellule selon son type
      if (typeof cellValues.totalGradeDisplay === 'number') {
        displayValue = `${formatGrade(cellValues.totalGradeDisplay)} / 20`;
      } else {
        displayValue = cellValues.totalGradeDisplay;
      }
      
      studentMap[studentKey][activityKey] = displayValue;
    });
    
    // Convertir en tableau pour jspdf-autotable
    const activityArray = Array.from(activitySet);
    const tableData = Object.entries(studentMap).map(([student, grades]) => {
      const row = [student];
      activityArray.forEach(activity => {
        row.push(grades[activity] !== undefined ? grades[activity] : 'NON NOTÉ');
      });
      return row;
    });
    
    // Préparer les en-têtes
    const headers = ['Étudiant', ...activityArray];
    
    // Ajouter le tableau
    const autoTableModule = require('jspdf-autotable').default;
    autoTableModule(doc, {
      head: [headers],
      body: tableData,
      startY: yPosition,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [66, 135, 245] },
      columnStyles: {
        0: { cellWidth: 'auto' }
      },
      didParseCell: function(data: any) {
        // Styliser les cellules d'étudiant
        if (data.column.index === 0) {
          data.cell.styles.fontStyle = 'bold';
        }
        
        // Appliquer des styles spéciaux en utilisant getCorrectionCellStyle pour les colonnes de notes
        if (data.column.index > 0) {
          const cellValue = data.cell.raw;
          const cellStyle = getCorrectionCellStyle(cellValue);
          
          // Convertir les couleurs hexadécimales en RGB pour jsPDF
          const hexToRgb = (hex: string) => {
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            return [r, g, b];
          };
          
          // Appliquer la couleur du texte
          if (cellStyle.color !== '000000') {
            data.cell.styles.textColor = hexToRgb(cellStyle.color);
          }
          
          // Appliquer la couleur de fond
          if (cellStyle.backgroundColor !== 'FFFFFF') {
            data.cell.styles.fillColor = hexToRgb(cellStyle.backgroundColor);
          }
          
          // Appliquer le style de police
          switch (cellStyle.fontStyle) {
            case 'italic':
              data.cell.styles.fontStyle = 'italic';
              break;
            case 'bold':
              data.cell.styles.fontStyle = 'bold';
              break;
            case 'bolditalic':
              data.cell.styles.fontStyle = 'bolditalic';
              break;
            default:
              data.cell.styles.fontStyle = 'normal';
          }
        }
      }
    });
  };

  // Fonction pour exporter les données en CSV
  const exportToCSV = (groupedData: any) => {
    try {
      // Pour chaque groupe principal, créer un fichier CSV séparé
      Object.entries(groupedData).forEach(([key, value]: [string, any]) => {
        // Déterminer les données à exporter
        let csvContent = "";
        let fileName = "";
        
        // Si pas de sous-arrangement, exporter un fichier unique
        if (value.corrections) {
          fileName = `Notes_${classData.name.replace(/\s+/g, '_')}_${key.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
          
          if (viewType === 'simplified' && arrangement === 'class') {
            // Format simplifié pour l'arrangement par classe
            csvContent = generateSimplifiedCSV(value.corrections);
          } else {
            // Format détaillé standard
            csvContent = generateDetailedCSV(value.corrections);
          }
          
          // Déclencher le téléchargement
          downloadCSV(csvContent, fileName);
        } 
        // Sinon exporter un fichier pour chaque sous-groupe
        else if (value.items) {
          Object.entries(value.items).forEach(([subKey, subValue]: [string, any]) => {
            fileName = `Notes_${classData.name.replace(/\s+/g, '_')}_${key.replace(/\s+/g, '_')}_${subKey.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
            
            if (viewType === 'simplified' && arrangement === 'class') {
              // Format simplifié pour l'arrangement par classe
              csvContent = generateSimplifiedCSV(subValue.corrections);
            } else {
              // Format détaillé standard
              csvContent = generateDetailedCSV(subValue.corrections);
            }
            
            // Déclencher le téléchargement
            downloadCSV(csvContent, fileName);
          });
        }
      });
      
      // Afficher message de succès
      enqueueSnackbar(`Fichier(s) CSV généré(s) avec succès`, { variant: 'success' });
      
    } catch (error) {
      console.error('Erreur lors de la génération du fichier CSV:', error);
      enqueueSnackbar('Erreur lors de la génération du fichier CSV', { variant: 'error' });
    }
  };

  // Fonction pour générer le contenu CSV détaillé
  const generateDetailedCSV = (corrections: any[]): string => {
    // En-tête du CSV
    const headers = ['Étudiant', 'Activité', 'Note Exp.', 'Max Exp.', 'Note Théo.', 'Max Théo.', 'Total', 'Max'];
    let content = headers.join(',') + '\n';
    
    // Ajouter les données
    corrections.forEach(c => {
      const activity = getActivityById(c.activity_id);
      const student = getStudentById(c.student_id);
      
      const row = [
        escapeCSV(student ? `${student.first_name} ${student.last_name}` : 'N/A'),
        escapeCSV(activity?.name || `Activité ${c.activity_id}`),
        escapeCSV(c.experimental_points_earned || 0),
        escapeCSV(activity?.experimental_points || 0),
        escapeCSV(c.theoretical_points_earned || 0),
        escapeCSV(activity?.theoretical_points || 0),
        escapeCSV(c.grade || 0),
        escapeCSV(20)
      ];
      
      content += row.join(',') + '\n';
    });
    
    return content;
  };

  // Fonction pour générer le contenu CSV simplifié
  const generateSimplifiedCSV = (corrections: any[]): string => {
    // Regrouper les étudiants (lignes) et les activités (colonnes)
    const studentMap: Record<string, Record<string, any>> = {};
    const activitySet = new Set<string>();
    
    corrections.forEach(c => {
      const student = getStudentById(c.student_id);
      const activity = getActivityById(c.activity_id);
      
      if (!student) return;
      
      const studentKey = `${student.last_name} ${student.first_name}`;
      const activityKey = activity?.name || `Activité ${c.activity_id}`;
      
      activitySet.add(activityKey);
      
      if (!studentMap[studentKey]) {
        studentMap[studentKey] = {};
      }
      
      // Utiliser le statut pour déterminer l'affichage de la note
      studentMap[studentKey][activityKey] = getStatusLabel(c);
    });
    
    // Convertir les activités en tableau pour les colonnes
    const activityArray = Array.from(activitySet);
    
    // En-tête du CSV
    const headers = ['Étudiant', ...activityArray];
    let content = headers.map(h => escapeCSV(h)).join(',') + '\n';
    
    // Ajouter les données
    Object.entries(studentMap).forEach(([student, grades]) => {
      const row = [escapeCSV(student)];
      
      activityArray.forEach(activity => {
        row.push(escapeCSV(grades[activity] || "NON NOTÉ"));
      });
      
      content += row.join(',') + '\n';
    });
    
    return content;
  };

  // Fonction pour déclencher le téléchargement d'un fichier CSV
  const downloadCSV = (content: string, fileName: string) => {
    // Ajouter le BOM pour que Excel reconnaisse correctement l'UTF-8
    const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Nettoyer l'URL de l'objet
    URL.revokeObjectURL(url);
  };

  // Fonction pour exporter les données en XLSX avec ExcelJS
  const exportToXLSX = async (groupedData: any) => {
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
      Object.entries(groupedData).forEach(([key, value]: [string, any]) => {
        // Si pas de sous-arrangement, générer une seule feuille
        if (value.corrections) {
          const sheetName = key.substring(0, 31); // Excel limite les noms de feuille à 31 caractères
          const worksheet = workbook.addWorksheet(sheetName);
          createExcelWorksheet(worksheet, value.corrections, viewType, arrangement);
        } 
        // Sinon générer une feuille pour chaque sous-arrangement
        else if (value.items) {
          // Créer une feuille pour chaque sous-section
          Object.entries(value.items).forEach(([subKey, subValue]: [string, any]) => {
            const sheetName = `${key.substring(0, 15)}-${subKey.substring(0, 15)}`;
            const worksheet = workbook.addWorksheet(sheetName.substring(0, 31));
            createExcelWorksheet(worksheet, subValue.corrections, viewType, arrangement);
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
      const fileName = `Notes_${classData.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
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
      enqueueSnackbar('Erreur lors de la génération du fichier Excel', { variant: 'error' });
    }
  };

  // Fonction pour créer une feuille Excel avec ExcelJS
  const createExcelWorksheet = (
    worksheet: any, 
    corrections: any[], 
    viewType: ViewType, 
    arrangement: ArrangementType
  ) => {
    if (viewType === 'simplified' && arrangement === 'class') {
      // Format simplifié pour l'arrangement par classe
      // Regrouper les étudiants (lignes) et les activités (colonnes)
      const studentMap: Record<string, Record<string, any>> = {};
      const activitySet = new Set<string>();
      
      corrections.forEach(c => {
        const student = getStudentById(c.student_id);
        const activity = getActivityById(c.activity_id);
        
        if (!student) return;
        
        const studentKey = `${student.last_name} ${student.first_name}`;
        const activityKey = activity?.name || `Activité ${c.activity_id}`;
        
        activitySet.add(activityKey);
        
        if (!studentMap[studentKey]) {
          studentMap[studentKey] = {};
        }
        
        // Utiliser les nouveaux statuts
        studentMap[studentKey][activityKey] = getStatusLabel(c);
      });
      
      // Convertir les activités en tableau pour les colonnes
      const activityArray = Array.from(activitySet);
      
      // Définir les colonnes avec les en-têtes
      worksheet.columns = [
        { header: 'Étudiant', key: 'student', width: 30 },
        ...activityArray.map(activity => ({
          header: activity,
          key: activity,
          width: 15
        }))
      ];
      
      // Ajouter les données
      Object.entries(studentMap).forEach(([studentName, grades]) => {
        const rowData: any = { student: studentName };
        
        activityArray.forEach(activity => {
          rowData[activity] = grades[activity] !== undefined ? grades[activity] : '-';
        });
        
        worksheet.addRow(rowData);
      });
      
    } else {
      // Format détaillé standard
      worksheet.columns = [
        { header: 'Étudiant', key: 'student', width: 30 },
        { header: 'Activité', key: 'activity', width: 30 },
        { header: 'Note Exp.', key: 'expGrade', width: 15 },
        { header: 'Max Exp.', key: 'expMax', width: 15 },
        { header: 'Note Théo.', key: 'theoGrade', width: 15 },
        { header: 'Max Théo.', key: 'theoMax', width: 15 },
        { header: 'Total', key: 'total', width: 15 },
        { header: 'Max', key: 'max', width: 10 },
        { header: 'Statut', key: 'status', width: 15 }
      ];
      
      // Ajouter les données des corrections
      corrections.forEach(c => {
        const activity = getActivityById(c.activity_id);
        const student = getStudentById(c.student_id);
        
        // Utiliser la fonction utilitaire pour obtenir les valeurs à afficher
        const cellValues = getCorrectionCellValues(c, activity);
        
        worksheet.addRow({
          student: student ? `${student.first_name} ${student.last_name}` : 'N/A',
          activity: activity?.name || `Activité ${c.activity_id}`,
          expGrade: cellValues.expGradeDisplay,
          expMax: activity?.experimental_points || 0,
          theoGrade: cellValues.theoGradeDisplay,
          theoMax: activity?.theoretical_points || 0,
          total: cellValues.totalGradeDisplay,
          max: 20,
          status: cellValues.statusDisplay
        });
      });
    }
    
    // Styliser l'en-tête
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '4287F5' } // Bleu
    };
    
    // Ajouter des bordures
    worksheet.eachRow((row: any) => {
      row.eachCell((cell: any) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });
    
    // Mise en forme conditionnelle pour les notes
    if (!viewType.includes('simplified')) {
      worksheet.eachRow((row: any, rowNumber: number) => {
        if (rowNumber > 1) { // Ignorer l'en-tête
          const statusCell = row.getCell('status');
          const totalCell = row.getCell('total');
          const expGradeCell = row.getCell('expGrade');
          const theoGradeCell = row.getCell('theoGrade');
          
          // Récupérer les styles en fonction du statut ou de la note
          const statusStyle = getCorrectionCellStyle(statusCell.value);
          
          // Appliquer le style à la cellule de statut
          statusCell.font = { 
            color: { argb: statusStyle.color }, 
            bold: statusStyle.fontStyle.includes('bold'),
            italic: statusStyle.fontStyle.includes('italic')
          };
          statusCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: statusStyle.backgroundColor }
          };
          
          // Si c'est un statut spécial, appliquer le même style aux cellules de notes
          if (typeof statusCell.value === 'string' && 
              ['NON NOTÉ', 'ABSENT', 'NON RENDU', 'DÉSACTIVÉ'].includes(statusCell.value)) {
            
            // Appliquer le style aux cellules de notes
            [totalCell, expGradeCell, theoGradeCell].forEach(cell => {
              cell.font = { 
                color: { argb: statusStyle.color }, 
                bold: statusStyle.fontStyle.includes('bold'),
                italic: statusStyle.fontStyle.includes('italic')
              };
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: statusStyle.backgroundColor }
              };
            });
          } 
          // Sinon, si c'est une note numérique, appliquer un style basé sur la valeur
          else if (typeof totalCell.value === 'number') {
            const totalStyle = getCorrectionCellStyle(totalCell.value);
            
            totalCell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: totalStyle.backgroundColor }
            };
            
            if (totalStyle.fontStyle === 'bold') {
              totalCell.font = { bold: true };
            }
          }
        }
      });
    } else {
      // Mise en forme conditionnelle pour les notes dans le cas simplifié
      worksheet.eachRow((row: any, rowNumber: number) => {
        if (rowNumber > 1) { // Ignorer l'en-tête
          // Dans le format simplifié, chaque colonne à partir de l'index 1 représente une activité
          for (let colIndex = 1; colIndex < row.cellCount; colIndex++) {
            const cell = row.getCell(colIndex + 1); // +1 car l'index des cellules commence à 1
            const cellValue = cell.value;
            
            // Appliquer le style en fonction de la valeur de la cellule
            const cellStyle = getCorrectionCellStyle(cellValue);
            
            // Appliquer les styles à la cellule
            cell.font = { 
              color: { argb: cellStyle.color }, 
              bold: cellStyle.fontStyle.includes('bold'),
              italic: cellStyle.fontStyle.includes('italic')
            };
            
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: cellStyle.backgroundColor }
            };
          }
        }
      });
    }
    
    // Geler la première ligne
    worksheet.views = [
      { state: 'frozen', xSplit: 0, ySplit: 1, activeCell: 'A2' }
    ];
  };

  return (
    <Box>
      <Typography variant="body2">
        Exportez les notes des étudiants sous différents formats et organisations.
      </Typography>
      
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>Options d'export</Typography>
        
        <FiltersSection
          filterActivity={filterActivity}
          setFilterActivity={setFilterActivity}
          filterSubClass={filterSubClass}
          setFilterSubClass={setFilterSubClass}
          uniqueSubClasses={uniqueSubClasses.map(subClass => ({
            ...subClass,
            id: typeof subClass.id === 'string' ? Number(subClass.id) : subClass.id
          }))}
          uniqueActivities={uniqueActivities.map(activity => ({
            ...activity,
            id: typeof activity.id === 'string' ? Number(activity.id) : activity.id
          }))}
          classData={classData}
        />
        
        <FormControlLabel
          control={
            <Checkbox
              checked={includeAllStudents}
              onChange={(e) => setIncludeAllStudents(e.target.checked)}
              color="primary"
            />
          }
          label="Inclure tous les étudiants de la classe (même ceux sans correction)"
          sx={{ mt: 1, mb: 2 }}
        />
        
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <ArrangementOptions
              arrangement={arrangement}
              setArrangement={setArrangement}
              subArrangement={subArrangement}
              setSubArrangement={setSubArrangement}
              viewType={viewType}
              setViewType={setViewType}
              availableSubArrangements={getAvailableSubArrangements()}
            />
          </Grid>
          
          <Grid size={{ xs: 12, md: 6 }}>
            <ExportFormatOptions
              exportFormat={exportFormat}
              setExportFormat={setExportFormat}
              onExport={handleExport}
              disabled={filteredCorrections.length === 0}
            />
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default NotesTab;