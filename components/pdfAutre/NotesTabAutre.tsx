import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  FormControlLabel, 
  Checkbox,
  Grid,
  Alert,
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  FormLabel,
  RadioGroup,
  Radio,
  CircularProgress
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { useSnackbar } from 'notistack';
import { Student, CorrectionAutreEnriched, ActivityAutre } from '@/lib/types';
import ArrangementOptions from '@/components/pdf/ArrangementOptions';
import ExportFormatOptions from '@/components/pdf/ExportFormatOptions';
import FiltersSection from '@/components/pdf/FiltersSection';
import { dataProcessingService } from '@/components/pdf/dataProcessingService';

interface NotesTabAutreProps {
  classData: any;
  filteredCorrections: CorrectionAutreEnriched[];
  filterActivity: number | 'all';
  setFilterActivity: (value: number | 'all') => void;
  filterSubClass: string | 'all';
  setFilterSubClass: (value: string | 'all') => void;
  uniqueSubClasses: { id: string; name: string }[];
  uniqueActivities: { id: number; name: string }[];
  students: Student[];
  activities: ActivityAutre[];
  getActivityById: (activityId: number) => ActivityAutre | undefined;
  getStudentById: (studentId: number | null) => Student | undefined;
}

// Types pour les options d'export
type ArrangementType = 'student' | 'class' | 'subclass' | 'activity';
type SubArrangementType = 'student' | 'class' | 'subclass' | 'activity' | 'none';
type ExportFormat = 'pdf' | 'csv' | 'xlsx';
type ViewType = 'detailed' | 'simplified';

const NotesTabAutre: React.FC<NotesTabAutreProps> = ({
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
  const { enqueueSnackbar } = useSnackbar();
  const [arrangement, setArrangement] = useState<ArrangementType>('student');
  const [subArrangement, setSubArrangement] = useState<SubArrangementType>('activity');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('xlsx');
  const [viewType, setViewType] = useState<ViewType>('detailed');
  const [exporting, setExporting] = useState(false);
  const [includeAllStudents, setIncludeAllStudents] = useState<boolean>(false);

  // Déterminer les options de sous-arrangement disponibles
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
  const handleExport = async () => {
    try {
      setExporting(true);
      
      // Organiser les données selon l'arrangement choisi
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
        await generateGradesPDF(groupedData);
      } else if (exportFormat === 'csv') {
        exportToCSV(groupedData);
      } else if (exportFormat === 'xlsx') {
        await exportToXLSX(groupedData);
      }
      
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      enqueueSnackbar('Erreur lors de l\'export', { variant: 'error' });
    } finally {
      setExporting(false);
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

  // Fonction pour générer un tableau détaillé adapté au nouveau système de notation
  const generateDetailedTable = (doc: any, corrections: any[], yPosition: number) => {
    const tableData = corrections.map(c => {
      const activity = getActivityById(c.activity_id);
      const student = getStudentById(c.student_id);
      
      // Déterminer les valeurs à afficher
      const isPlaceholder = (c.placeholder && c.status === 'NON_NOTE');
      const totalGradeDisplay = isPlaceholder ? 
        'N/A' : 
        (c.grade !== undefined ? `${formatGrade(c.grade)} / 20` : 'Non noté');
      
      // Construire la ligne du tableau avec les colonnes de base
      const row = [
        student ? `${student.first_name} ${student.last_name}` : 'N/A',
        activity?.name || `Activité ${c.activity_id}`,
        totalGradeDisplay
      ];
      
      // Ajouter des colonnes pour chaque partie de l'activité (si détaillé)
      if (viewType === 'detailed' && activity?.parts_names) {
        for (let i = 0; i < activity.parts_names.length; i++) {
          const pointsEarned = isPlaceholder ? 
            'N/A' : 
            (c.points_earned && c.points_earned[i] !== undefined ? c.points_earned[i] : 'N/A');
          const maxPoints = activity.points && activity.points[i] !== undefined ? 
            activity.points[i] : 0;
          
          row.push(isPlaceholder ? 'N/A' : `${pointsEarned} / ${maxPoints}`);
        }
      }
      
      return row;
    });
    
    // Construire les en-têtes en fonction du type de vue
    const baseHeaders = ['Étudiant', 'Activité', 'Note Totale'];
    let headers = [...baseHeaders];
    
    // Ajouter les en-têtes pour chaque partie si vue détaillée
    if (viewType === 'detailed') {
      // Récupérer toutes les parties possibles de toutes les activités
      const allPartNames = new Set<string>();
      corrections.forEach(c => {
        const activity = getActivityById(c.activity_id);
        if (activity?.parts_names) {
          activity.parts_names.forEach(name => allPartNames.add(name));
        }
      });
      
      // Ajouter une colonne pour chaque partie
      allPartNames.forEach(partName => {
        headers.push(`${partName}`);
      });
    }
    
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
        2: { cellWidth: 'auto' }
      },
      margin: { left: 10, right: 10 }, // Marges réduites pour donner plus d'espace au tableau
      didParseCell: function(data: any) {
        // Optimiser le style des cellules d'étudiants pour éviter les coupures de mots
        if (data.column.index === 0) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.overflow = 'ellipsize'; // Plutôt que couper le texte, ajouter "..." si trop long
        }
        
        // Appliquer des styles spéciaux pour les notes
        if (data.column.index >= 2) {
          const cellValue = data.cell.raw;
          
          // Définir des couleurs selon la valeur
          if (typeof cellValue === 'string' && cellValue.includes('/')) {
            const numValue = parseFloat(cellValue.split('/')[0].trim());
            const maxValue = parseFloat(cellValue.split('/')[1].trim());
            const percentage = numValue / maxValue;
            
            if (percentage >= 0.8) {
              data.cell.styles.fillColor = [200, 230, 201]; // Vert clair
              data.cell.styles.fontStyle = 'bold';
            } else if (percentage >= 0.7) {
              data.cell.styles.fillColor = [187, 222, 251]; // Bleu clair
            } else if (percentage >= 0.5) {
              data.cell.styles.fillColor = [227, 242, 253]; // Bleu très clair
            } else if (percentage >= 0.4) {
              data.cell.styles.fillColor = [255, 224, 178]; // Orange clair
            } else if (percentage > 0) {
              data.cell.styles.fillColor = [255, 205, 210]; // Rouge clair
            }
            
            // Si non noté ou autre valeur spéciale
            if (isNaN(numValue) || isNaN(maxValue)) {
              data.cell.styles.fillColor = [238, 238, 238]; // Gris clair
              data.cell.styles.fontStyle = 'italic';
            }
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
      
      // Déterminer le statut ou la note à afficher
      let displayValue;
      if (c.status && c.status !== 'ACTIVE') {
        // Afficher le statut spécial
        displayValue = c.status;
      } else if (c.grade !== undefined) {
        // Afficher la note
        displayValue = `${formatGrade(c.grade)} / 20`;
      } else {
        displayValue = 'NON NOTÉ';
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
        
        // Appliquer des styles spéciaux pour les notes
        if (data.column.index > 0) {
          const cellValue = data.cell.raw;
          
          // Définir des couleurs selon la valeur
          if (typeof cellValue === 'string' && cellValue.includes('/')) {
            const numValue = parseFloat(cellValue.split('/')[0].trim());
            const maxValue = parseFloat(cellValue.split('/')[1].trim());
            const percentage = numValue / maxValue;
            
            if (percentage >= 0.8) {
              data.cell.styles.fillColor = [200, 230, 201]; // Vert clair
              data.cell.styles.fontStyle = 'bold';
            } else if (percentage >= 0.7) {
              data.cell.styles.fillColor = [187, 222, 251]; // Bleu clair
            } else if (percentage >= 0.5) {
              data.cell.styles.fillColor = [227, 242, 253]; // Bleu très clair
            } else if (percentage >= 0.4) {
              data.cell.styles.fillColor = [255, 224, 178]; // Orange clair
            } else if (percentage > 0) {
              data.cell.styles.fillColor = [255, 205, 210]; // Rouge clair
            }
          } else if (cellValue === 'NON NOTÉ') {
            data.cell.styles.fillColor = [238, 238, 238]; // Gris clair
            data.cell.styles.fontStyle = 'italic';
          } else if (cellValue === 'INACTIVE' || cellValue === 'ABSENT') {
            data.cell.styles.fillColor = [224, 224, 224]; // Gris plus foncé
            data.cell.styles.fontStyle = 'italic';
          }
        }
      }
    });
  };

  // Fonction utilitaire pour formater les notes
  const formatGrade = (grade: number | string | null | undefined): string => {
    if (grade === null || grade === undefined) return 'N/A';
    if (typeof grade === 'string') return grade;
    return grade.toFixed(1).replace(/\.0$/, '');
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

  // Fonction pour générer le contenu CSV détaillé adapté au nouveau système de notation
  const generateDetailedCSV = (corrections: any[]): string => {
    // Récupérer toutes les parties possibles de toutes les activités
    const allPartNames = new Set<string>();
    corrections.forEach(c => {
      const activity = getActivityById(c.activity_id);
      if (activity?.parts_names) {
        activity.parts_names.forEach(name => allPartNames.add(name));
      }
    });
    
    // En-tête du CSV
    const baseHeaders = ['Étudiant', 'Activité', 'Note Totale', 'Maximum'];
    const partHeaders = Array.from(allPartNames).map(name => `${name}`);
    const partMaxHeaders = Array.from(allPartNames).map(name => `${name} (max)`);
    const headers = [...baseHeaders, ...partHeaders, ...partMaxHeaders];
    
    let content = headers.join(',') + '\n';
    
    // Ajouter les données
    corrections.forEach(c => {
      const activity = getActivityById(c.activity_id);
      const student = getStudentById(c.student_id);
      
      // Données de base
      const baseData = [
        escapeCSV(student ? `${student.first_name} ${student.last_name}` : 'N/A'),
        escapeCSV(activity?.name || `Activité ${c.activity_id}`),
        escapeCSV(c.grade !== undefined ? c.grade : 'Non noté'),
        escapeCSV(20)
      ];
      
      // Données pour chaque partie
      const partData: string[] = [];
      const partMaxData: string[] = [];
      
      // Pour chaque partie possible
      Array.from(allPartNames).forEach(partName => {
        // Trouver l'index de cette partie dans l'activité
        let partIndex = -1;
        if (activity?.parts_names) {
          partIndex = activity.parts_names.findIndex(name => name === partName);
        }
        
        if (partIndex !== -1 && c.points_earned && partIndex < c.points_earned.length) {
          // La partie existe dans cette activité
          partData.push(escapeCSV(c.points_earned[partIndex]));
          partMaxData.push(escapeCSV(activity?.points?.[partIndex] || 0));
        } else {
          // La partie n'existe pas dans cette activité
          partData.push(escapeCSV('N/A'));
          partMaxData.push(escapeCSV('N/A'));
        }
      });
      
      // Combiner toutes les données
      const rowData = [...baseData, ...partData, ...partMaxData];
      content += rowData.join(',') + '\n';
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
      
      // Déterminer la valeur à afficher
      let displayValue;
      if (c.status && c.status !== 'ACTIVE') {
        displayValue = c.status;
      } else if (c.grade !== undefined) {
        displayValue = `${formatGrade(c.grade)}/20`;
      } else {
        displayValue = 'NON NOTÉ';
      }
      
      studentMap[studentKey][activityKey] = displayValue;
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

  // Fonction utilitaire pour échapper les caractères spéciaux dans les CSV
  const escapeCSV = (value: any): string => {
    if (value === null || value === undefined) return '';
    
    const stringValue = String(value);
    
    // Si la valeur contient des virgules, des guillemets ou des sauts de ligne, l'entourer de guillemets
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
      // Doubler les guillemets dans la valeur
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    
    return stringValue;
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

  // Fonction pour créer une feuille Excel avec ExcelJS adaptée au nouveau système de notation
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
        
        // Déterminer la valeur à afficher en fonction du statut
        let displayValue;
        if (c.status && c.status !== 'ACTIVE') {
          displayValue = c.status;
        } else if (c.grade !== undefined) {
          displayValue = `${formatGrade(c.grade)} / 20`;
        } else {
          displayValue = 'NON NOTÉ';
        }
        
        studentMap[studentKey][activityKey] = displayValue;
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
          rowData[activity] = grades[activity] !== undefined ? grades[activity] : 'NON NOTÉ';
        });
        
        worksheet.addRow(rowData);
      });
      
    } else {
      // Format détaillé adapté au nouveau système de notation
      
      // Récupérer toutes les parties possibles
      const allPartNames = new Set<string>();
      corrections.forEach(c => {
        const activity = getActivityById(c.activity_id);
        if (activity?.parts_names) {
          activity.parts_names.forEach(name => allPartNames.add(name));
        }
      });
      
      // Définir les colonnes avec les en-têtes de base
      const columns: any[] = [
        { header: 'Étudiant', key: 'student', width: 30 },
        { header: 'Groupe', key: 'group', width: 15 },
        { header: 'Activité', key: 'activity', width: 30 },
        { header: 'Note Totale', key: 'grade', width: 15 },
        { header: 'Maximum', key: 'max', width: 10 },
        { header: 'Statut', key: 'status', width: 15 }
      ];
      
      // Ajouter des colonnes pour chaque partie de l'activité si vue détaillée
      if (viewType === 'detailed') {
        Array.from(allPartNames).forEach(partName => {
          columns.push({ 
            header: `${partName}`, 
            key: `part_${partName.replace(/\s+/g, '_')}`,
            width: 15 
          });
          columns.push({ 
            header: `${partName} (max)`, 
            key: `part_${partName.replace(/\s+/g, '_')}_max`, 
            width: 10 
          });
        });
      }
      
      worksheet.columns = columns;
      
      // Ajouter les données des corrections
      corrections.forEach(c => {
        const activity = getActivityById(c.activity_id);
        const student = getStudentById(c.student_id);
        
        // Préparer les données de base de la ligne
        const rowData: any = {
          student: student ? `${student.first_name} ${student.last_name}` : 'N/A',
          group: student?.sub_class || '',
          activity: activity?.name || `Activité ${c.activity_id}`,
          grade: c.grade !== undefined ? c.grade : 'Non noté',
          max: 20,
          status: c.status || 'ACTIVE'
        };
        
        // Ajouter les données pour chaque partie de l'activité si vue détaillée
        if (viewType === 'detailed' && activity?.parts_names) {
          activity.parts_names.forEach((partName, index) => {
            const key = `part_${partName.replace(/\s+/g, '_')}`;
            const maxKey = `${key}_max`;
            
            // Points gagnés pour cette partie (ou N/A si non disponible)
            rowData[key] = c.points_earned && index < c.points_earned.length 
              ? c.points_earned[index] 
              : 'N/A';
            
            // Points maximum pour cette partie
            rowData[maxKey] = activity.points && index < activity.points.length 
              ? activity.points[index] 
              : 0;
          });
        }
        
        worksheet.addRow(rowData);
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
    worksheet.eachRow((row: any, rowNumber: number) => {
      if (rowNumber > 1) { // Ignorer l'en-tête
        const gradeCell = row.getCell('grade');
        const statusCell = row.getCell('status');
        
        // Styles en fonction du statut
        if (statusCell.value !== 'ACTIVE') {
          statusCell.font = { italic: true };
          statusCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'F5F5F5' } // Gris clair
          };
          
          // Si statut spécial, appliquer la même couleur à la note
          gradeCell.font = { italic: true };
          gradeCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'F5F5F5' } // Gris clair
          };
        } 
        // Sinon, styles en fonction de la note
        else if (typeof gradeCell.value === 'number') {
          const grade = gradeCell.value;
          
          if (grade >= 16) {
            gradeCell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'C8E6C9' } // Vert clair
            };
            gradeCell.font = { bold: true };
          } else if (grade >= 12) {
            gradeCell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'BBDEFB' } // Bleu clair
            };
          } else if (grade >= 10) {
            gradeCell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'E3F2FD' } // Bleu très clair
            };
          } else if (grade >= 8) {
            gradeCell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFE0B2' } // Orange clair
            };
          } else {
            gradeCell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFCDD2' } // Rouge clair
            };
          }
        }
        
        // Appliquer des styles aux cellules des parties (si vue détaillée)
        if (viewType === 'detailed') {
          row.eachCell({ includeEmpty: false }, (cell: any, colNumber: number) => {
            const header = worksheet.getRow(1).getCell(colNumber).value;
            
            // Si c'est une cellule de points pour une partie
            if (typeof header === 'string' && 
                header !== 'Étudiant' && 
                header !== 'Groupe' && 
                header !== 'Activité' && 
                header !== 'Note Totale' && 
                header !== 'Maximum' && 
                header !== 'Statut' && 
                !header.includes('(max)')) {
              
              // Déterminer si c'est un nombre
              if (typeof cell.value === 'number') {
                // Récupérer la valeur maximale correspondante
                const maxHeader = `${header} (max)`;
                // Get the column index by iterating through the headers row
                let maxColIndex = -1;
                worksheet.getRow(1).eachCell({ includeEmpty: false }, (headerCell: any, colNum: number) => {
                  if (headerCell.value === maxHeader) {
                    maxColIndex = colNum;
                  }
                });
                const maxValue = maxColIndex !== -1 ? row.getCell(maxColIndex).value : 0;
                
                if (maxValue > 0) {
                  const percentage = cell.value / maxValue;
                  
                  // Appliquer des styles en fonction du pourcentage
                  if (percentage >= 0.8) {
                    cell.fill = {
                      type: 'pattern',
                      pattern: 'solid',
                      fgColor: { argb: 'C8E6C9' } // Vert clair
                    };
                    cell.font = { bold: true };
                  } else if (percentage >= 0.7) {
                    cell.fill = {
                      type: 'pattern',
                      pattern: 'solid',
                      fgColor: { argb: 'BBDEFB' } // Bleu clair
                    };
                  } else if (percentage >= 0.5) {
                    cell.fill = {
                      type: 'pattern',
                      pattern: 'solid',
                      fgColor: { argb: 'E3F2FD' } // Bleu très clair
                    };
                  } else if (percentage >= 0.4) {
                    cell.fill = {
                      type: 'pattern',
                      pattern: 'solid',
                      fgColor: { argb: 'FFE0B2' } // Orange clair
                    };
                  } else {
                    cell.fill = {
                      type: 'pattern',
                      pattern: 'solid',
                      fgColor: { argb: 'FFCDD2' } // Rouge clair
                    };
                  }
                }
              }
            }
          });
        }
      }
    });
    
    // Geler la première ligne
    worksheet.views = [
      { state: 'frozen', xSplit: 0, ySplit: 1, activeCell: 'A2' }
    ];
  };

  return (
    <Box>
      <Typography variant="body2" sx={{ mb: 3 }}>
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
            id: typeof subClass.id === 'string' ? subClass.id : String(subClass.id)
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
              disabled={filteredCorrections.length === 0 || exporting}
            />
          </Grid>
        </Grid>
      </Box>
      
      {filteredCorrections.length === 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Aucune correction à exporter avec les filtres actuels
        </Alert>
      )}
    </Box>
  );
};

export default NotesTabAutre;