import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Divider, 
  Card, 
  CardContent,
  Alert,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Paper,
  Tabs,
  Tab,
  Grid,
  FormControlLabel,
  Checkbox,
  Button,
  TablePagination
} from '@mui/material';
import { useSnackbar } from 'notistack';
import QrCodeIcon from '@mui/icons-material/QrCode';
import TableChartIcon from '@mui/icons-material/TableChart';
import GroupIcon from '@mui/icons-material/Group';
import SchoolIcon from '@mui/icons-material/School';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { Student } from '@/lib/types';
import { Correction as ProviderCorrection } from '@/app/components/CorrectionsDataProvider';
import ArrangementOptions from './ArrangementOptions';
import ExportFormatOptions from './ExportFormatOptions';
import ErrorDisplay from '@/components/ui/ErrorDisplay';
import { 
  ExportPDFComponentAllCorrectionsProps, 
  ArrangementType, 
  SubArrangementType, 
  ExportFormat, 
  ViewType,
  formatGrade,
  getCorrectionCellValues,
  getCorrectionCellStyle,
  getStatusLabel,
  escapeCSV
} from './types';
import { allCorrectionsDataProcessingService } from './allCorrectionsDataProcessingService';

// Composant pour exporter toutes les corrections sans nécessiter une classe spécifique
const ExportPDFComponentAllCorrections: React.FC<ExportPDFComponentAllCorrectionsProps> = ({
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
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [classesMap, setClassesMap] = useState<Map<number | null, any>>(new Map());
  const [loading, setLoading] = useState<boolean>(false);
  
  // État pour la gestion des erreurs
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<any | null>(null);
  
  const { enqueueSnackbar } = useSnackbar();

  // Fonction pour effacer les erreurs
  const clearError = () => {
    setError(null);
    setErrorDetails(null);
  };

  // État pour la pagination
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);

  // Gérer le changement de page
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  // Gérer le changement du nombre d'éléments par page
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Filtrer les corrections en fonction de l'activité sélectionnée
  const filteredCorrections = React.useMemo(() => {
    let result = [...corrections];
    // Filtrer par activité
    if (filterActivity !== 'all') {
      result = result.filter(c => c.activity_id === filterActivity);
    }
    
    return result;
  }, [corrections, filterActivity]);

  // Effet pour charger les classes au chargement du composant
  useEffect(() => {
    const loadClasses = async () => {
      if (getAllClasses) {
        setLoading(true);
        try {
          const classes = await getAllClasses();
          const newClassesMap = new Map();
          classes.forEach(cls => {
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
      } else {
        // Si getAllClasses n'est pas fourni, essayer de charger les classes via l'API
        setLoading(true);
        try {
          const response = await fetch('/api/classes');
          if (response.ok) {
            const classes = await response.json();
            const newClassesMap = new Map();
            classes.forEach((cls: any) => {
              newClassesMap.set(cls.id, cls);
            });
            setClassesMap(newClassesMap);
          } else {
            throw new Error('Erreur lors du chargement des classes');
          }
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

  // Effet pour charger tous les étudiants lorsque includeAllStudents change
  useEffect(() => {
    const loadAllStudents = async () => {
      if (includeAllStudents) {
        setLoading(true);
        try {
          const allStudentsResponse = await fetch('/api/students');
          if (!allStudentsResponse.ok) {
            throw new Error('Erreur lors du chargement des étudiants');
          }
          const allStudentsData = await allStudentsResponse.json();
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

  // Fonction pour obtenir les sous-arrangements disponibles
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
  }, [arrangement, subArrangement]);

  // Fonction pour gérer le changement d'onglet
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Fonction pour gérer l'export en fonction du format sélectionné
  const handleExport = () => {
    // Utiliser la liste complète d'étudiants si includeAllStudents est activé
    const studentsToUse = includeAllStudents && allStudents.length > 0
      ? allStudents
      : students;
    
    const groupedData = allCorrectionsDataProcessingService.organizeAllCorrectionsData({
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
        
        // Si nous utilisons tous les étudiants, chercher d'abord dans allStudents
        if (includeAllStudents && allStudents.length > 0) {
          const student = allStudents.find(s => s.id === studentId);
          if (student) return student;
        }
        
        // Sinon, utiliser la fonction getStudentById fournie par les props
        return getStudentById(studentId);
      },
      classesMap
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
      const title = `Récapitulatif des notes - Toutes les corrections`;
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
      const fileName = `Notes_Toutes_Classes_${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(fileName);
      
      // Afficher message de succès
      enqueueSnackbar(`PDF des notes généré avec succès: ${fileName}`, { variant: 'success' });
      
    } catch (error) {
      console.error('Erreur lors de la génération du PDF des notes:', error);
      setError('Erreur lors de la génération du PDF des notes');
      setErrorDetails(error);
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
        if (viewType === 'simplified' && (arrangement === 'class' || arrangement === 'subclass')) {
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
          if (viewType === 'simplified' && (arrangement === 'class' || arrangement === 'subclass')) {
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
      
      // Obtenir le nom de la classe à partir de classesMap
      const className = classesMap.get(c.class_id)?.name || `Classe ${c.class_id}`;
      
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
        className,
        activity?.name || `Activité ${c.activity_id}`,
        expGradeDisplay,
        theoGradeDisplay,
        totalGradeDisplay
      ];
    });
    
    const headers = [
      'Étudiant',
      'Classe',
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
        1: { cellWidth: 'auto' }, // Largeur pour la colonne des classes
        2: { cellWidth: 'auto' },
        3: { cellWidth: 'auto' },
        4: { cellWidth: 'auto' },
        5: { cellWidth: 'auto' }
      },
      margin: { left: 10, right: 10 }, // Marges réduites pour donner plus d'espace au tableau
      didParseCell: function(data: any) {
        // Optimiser le style des cellules d'étudiants pour éviter les coupures de mots
        if (data.column.index === 0) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.overflow = 'ellipsize'; // Plutôt que couper le texte, ajouter "..." si trop long
        }
        
        // Appliquer des styles spéciaux en utilisant getCorrectionCellStyle
        if (data.column.index >= 3 && data.column.index <= 5) {
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
          fileName = `Notes_Toutes_Classes_${key.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
          
          if (viewType === 'simplified' && (arrangement === 'class' || arrangement === 'subclass')) {
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
            fileName = `Notes_Toutes_Classes_${key.replace(/\s+/g, '_')}_${subKey.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
            
            if (viewType === 'simplified' && (arrangement === 'class' || arrangement === 'subclass')) {
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
      setError('Erreur lors de la génération du fichier CSV');
      setErrorDetails(error);
    }
  };

  // Fonction pour générer le contenu CSV détaillé
  const generateDetailedCSV = (corrections: any[]): string => {
    // En-tête du CSV
    const headers = ['Étudiant', 'Classe', 'Activité', 'Note Exp.', 'Max Exp.', 'Note Théo.', 'Max Théo.', 'Total', 'Max'];
    let content = headers.join(',') + '\n';
    
    // Ajouter les données
    corrections.forEach(c => {
      const activity = getActivityById(c.activity_id);
      const student = getStudentById(c.student_id);
      const className = classesMap.get(c.class_id)?.name || `Classe ${c.class_id}`;
      
      // Utiliser les cellValues avec le format virgule pour l'export CSV
      const cellValues = getCorrectionCellValues(c, activity, true);
      
      // Formater les valeurs pour l'export
      const row = [
        escapeCSV(student ? `${student.first_name} ${student.last_name}` : 'N/A'),
        escapeCSV(className),
        escapeCSV(activity?.name || `Activité ${c.activity_id}`),
        escapeCSV(typeof cellValues.experimentalDisplay === 'string' ? cellValues.experimentalDisplay : formatGrade(c.experimental_points_earned || 0, true)),
        escapeCSV(activity?.experimental_points || 0),
        escapeCSV(typeof cellValues.theoreticalDisplay === 'string' ? cellValues.theoreticalDisplay : formatGrade(c.theoretical_points_earned || 0, true)),
        escapeCSV(activity?.theoretical_points || 0),
        escapeCSV(typeof cellValues.totalGradeDisplay === 'string' ? cellValues.totalGradeDisplay : formatGrade(c.grade || 0, true)),
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
      setError('Erreur lors de la génération du fichier Excel');
      setErrorDetails(error);
    }
  };

  // Fonction pour créer une feuille Excel avec ExcelJS
  const createExcelWorksheet = (
    worksheet: any, 
    corrections: any[], 
    viewType: ViewType, 
    arrangement: ArrangementType
  ) => {
    if (viewType === 'simplified' && (arrangement === 'class' || arrangement === 'subclass')) {
      // Format simplifié pour l'arrangement par classe
      // Regrouper les étudiants (lignes) et les activités (colonnes)
      const studentMap: Record<string, Record<string, any>> = {};
      const activitySet = new Set<string>();
      const activityStatusMap: Record<string, string> = {}; // Pour stocker les statuts des activités
      
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
        
        // Stocker le statut de l'activité pour cet étudiant
        if (c.status) {
          activityStatusMap[`${studentKey}-${activityKey}`] = c.status;
        }
        
        // Utiliser les cellValues avec le format virgule
        const cellValues = getCorrectionCellValues(c, activity, true);
        studentMap[studentKey][activityKey] = cellValues.totalGradeDisplay;
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
          // Déterminer la valeur à afficher en fonction du statut
          const status = activityStatusMap[`${studentName}-${activity}`];
          let displayValue;
          
          if (grades[activity] !== undefined) {
            displayValue = grades[activity];
          } else {
            // Utiliser le statut de l'activité pour cet étudiant si disponible
            switch (status) {
              case 'NON_NOTE':
                displayValue = 'NON NOTÉ';
                break;
              case 'ABSENT':
                displayValue = 'ABSENT';
                break;
              case 'NON_RENDU':
                displayValue = 'NON RENDU';
                break;
              case 'DEACTIVATED':
                displayValue = 'DÉSACTIVÉ';
                break;
              default:
                displayValue = 'NON ÉVALUÉ';
            }
          }
          
          rowData[activity] = displayValue;
        });

        const row = worksheet.addRow(rowData);
        
        // Appliquer des styles aux cellules de notes (commençant à l'index 1 car la première colonne est l'étudiant)
        activityArray.forEach((activity, index) => {
          const cellValue = rowData[activity];
          if (cellValue) {
            const cell = row.getCell(index + 2); // +2 car 1 est l'index de l'étudiant et les index Excel commencent à 1
            applyExcelCellStyle(cell, cellValue);
          }
        });
      });
      
    } else {
      // Format détaillé standard
      worksheet.columns = [
        { header: 'Étudiant', key: 'student', width: 30 },
        { header: 'Classe', key: 'class', width: 20 },
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
        const className = classesMap.get(c.class_id)?.name || `Classe ${c.class_id}`;
        
        // Utiliser la fonction utilitaire pour obtenir les valeurs à afficher avec le format virgule
        const cellValues = getCorrectionCellValues(c, activity, true);
        
        const row = worksheet.addRow({
          student: student ? `${student.first_name} ${student.last_name}` : 'N/A',
          class: className,
          activity: activity?.name || `Activité ${c.activity_id}`,
          expGrade: cellValues.experimentalDisplay,
          expMax: activity?.experimental_points || 0,
          theoGrade: cellValues.theoreticalDisplay,
          theoMax: activity?.theoretical_points || 0,
          total: cellValues.totalGradeDisplay,
          max: 20,
          status: cellValues.statusDisplay
        });
        
        // Appliquer des styles aux cellules de notes
        applyExcelCellStyle(row.getCell('expGrade'), cellValues.experimentalDisplay);
        applyExcelCellStyle(row.getCell('theoGrade'), cellValues.theoreticalDisplay);
        applyExcelCellStyle(row.getCell('total'), cellValues.totalGradeDisplay);
        applyExcelCellStyle(row.getCell('status'), cellValues.statusDisplay);
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
    
    // Geler la première ligne
    worksheet.views = [
      { state: 'frozen', xSplit: 0, ySplit: 1, activeCell: 'A2' }
    ];
  };

  // Fonction d'aide pour convertir les styles de getCorrectionCellStyle vers les styles ExcelJS
  const applyExcelCellStyle = (cell: any, cellValue: any) => {
    if (!cell) return;
    
    // Obtenir le style recommandé pour cette valeur de cellule
    const cellStyle = getCorrectionCellStyle(cellValue);
    
    // Convertir les couleurs hexadécimales en format ARGB pour ExcelJS
    const hexToArgb = (hex: string) => {
      // Ajouter l'alpha (FF pour opaque) devant la couleur hexadécimale
      return `FF${hex.toUpperCase()}`;
    };
    
    // Appliquer la couleur de texte
    if (cellStyle.color !== '000000') {
      cell.font = cell.font || {};
      cell.font.color = { argb: hexToArgb(cellStyle.color) };
    }
    
    // Appliquer la couleur d'arrière-plan
    if (cellStyle.backgroundColor !== 'FFFFFF') {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: hexToArgb(cellStyle.backgroundColor) }
      };
    }
    
    // Appliquer le style de police
    cell.font = cell.font || {};
    switch (cellStyle.fontStyle) {
      case 'italic':
        cell.font.italic = true;
        break;
      case 'bold':
        cell.font.bold = true;
        break;
      case 'bolditalic':
        cell.font.bold = true;
        cell.font.italic = true;
        break;
    }
    
    // Centrer les cellules de notes
    cell.alignment = {
      horizontal: 'center',
      vertical: 'middle'
    };
  };

  // Fonction pour générer un PDF de QR codes pour toutes les corrections
  const generateQRCodePDF = async () => {
    try {
      enqueueSnackbar('Génération du PDF de QR codes en cours...', { variant: 'info' });
      
      // Récupérer d'abord les codes de partage pour les corrections qui n'en ont pas
      const correctionsWithoutQR = filteredCorrections.filter(c => 
        !('shareCode' in c) || !(c as any).shareCode
      );
    
      if (correctionsWithoutQR.length > 0) {
        // Créer des codes de partage en lot
        const correctionIds = correctionsWithoutQR.map(c => c.id);
        await fetch('/api/share/batch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ correctionIds }),
        });
      }
      
      // Générer le titre du PDF
      const activityName = filterActivity !== 'all'
        ? uniqueActivities.find(a => a.id === filterActivity)?.name
        : 'Toutes les activités';
      
      // Importer la fonction de génération de QR codes
      const { generateQRCodePDF } = await import('@/utils/qrGeneratorPDF');
      
      // Générer le PDF
      await generateQRCodePDF({
        corrections: filteredCorrections,
        group: {
          name: 'Toutes les classes',
          activity_name: activityName || 'Activité'
        },
        generateShareCode: async (correctionId) => {
          const response = await fetch(`/api/corrections/${correctionId}/share`, {
            method: 'POST',
          });
          const data = await response.json();
          return { isNew: true, code: data.code };
        },
        getExistingShareCode: async (correctionId) => {
          const response = await fetch(`/api/corrections/${correctionId}/share`);
          const data = await response.json();
          return { exists: data.exists, code: data.code };
        },
        students,
        activities
      });
      
      // Afficher message de succès
      enqueueSnackbar('PDF des QR codes généré avec succès', { variant: 'success' });
      
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      setError('Erreur lors de la génération du PDF de QR codes');
      setErrorDetails(error);
    }
  };

  return (
    <>
      {error && (
        <ErrorDisplay 
          error={error}
          errorDetails={errorDetails}
          withRefreshButton={true}
          onRefresh={clearError}
        />
      )}
      
      <Paper sx={{ p: 2, mb: 3 }} elevation={1}>
        <Typography variant="h5" gutterBottom>Export des données - Toutes les corrections</Typography>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="export options tabs">
            <Tab label="QR Codes" icon={<QrCodeIcon />} iconPosition="start" />
            <Tab label="Notes" icon={<TableChartIcon />} iconPosition="start" />
          </Tabs>
        </Box>
        
        {activeTab === 0 && (
          <Box>
            <Typography variant="body2" paragraph>
              Générez des PDFs contenant les QR codes d'accès aux corrections pour les étudiants de toutes les classes.
            </Typography>
            
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>Options d'export</Typography>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Activité</InputLabel>
                <Select
                  value={filterActivity}
                  onChange={(e) => setFilterActivity(e.target.value as number | 'all')}
                  label="Activité"
                >
                  <MenuItem value="all">Toutes les activités</MenuItem>
                  {uniqueActivities.map(activity => (
                    <MenuItem key={activity.id} value={activity.id}>
                      {activity.name}
                    </MenuItem>
                  ))}
                </Select>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                  Sélectionnez une activité spécifique ou exportez pour toutes les activités
                </Typography>
              </FormControl>
          
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Button
                  variant="contained"
                  startIcon={<QrCodeIcon />}
                  disabled={filteredCorrections.length === 0 || loading}
                  onClick={generateQRCodePDF}
                  size="large"
                >
                  Générer PDF des QR codes
                </Button>
              </Box>
            </Box>
          </Box>
        )}
        
        {activeTab === 1 && (
          <Box>
            <Typography variant="body2">
              Exportez les notes des étudiants de toutes les classes sous différents formats et organisations.
            </Typography>
            
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>Options d'export</Typography>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Activité</InputLabel>
                <Select
                  value={filterActivity}
                  onChange={(e) => setFilterActivity(e.target.value as number | 'all')}
                  label="Activité"
                >
                  <MenuItem value="all">Toutes les activités</MenuItem>
                  {uniqueActivities.map(activity => (
                    <MenuItem key={activity.id} value={activity.id}>
                      {activity.name}
                    </MenuItem>
                  ))}
                </Select>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                  Sélectionnez une activité spécifique ou exportez pour toutes les activités
                </Typography>
              </FormControl>
              
              <FormControlLabel
                control={
                  <Checkbox
                    checked={includeAllStudents}
                    onChange={(e) => setIncludeAllStudents(e.target.checked)}
                    color="primary"
                  />
                }
                label="Inclure tous les étudiants (même ceux sans correction)"
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
                    disabled={filteredCorrections.length === 0 || loading}
                  />
                </Grid>
              </Grid>
            </Box>
          </Box>
        )}
      </Paper>
      
      {/* Aperçu des corrections qui seront incluses dans l'export */}
      <Paper sx={{ p: 2 }} elevation={1}>
        <Typography variant="h6" gutterBottom>
          Aperçu des corrections ({filteredCorrections.length})
        </Typography>
        
        {loading ? (
          <Typography>Chargement des données...</Typography>
        ) : filteredCorrections.length > 0 ? (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Étudiant</TableCell>
                  <TableCell>Classe</TableCell>
                  <TableCell>Activité</TableCell>
                  <TableCell align="right">Note Exp.</TableCell>
                  <TableCell align="right">Note Théo.</TableCell>
                  <TableCell align="center">Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCorrections.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(correction => {
                  const activity = getActivityById(correction.activity_id);
                  const student = getStudentById(correction.student_id);
                  const className = classesMap.get(correction.class_id)?.name || `Classe ${correction.class_id}`;
                  
                  return (
                    <TableRow key={correction.id}>
                      <TableCell>{student?.first_name} {student?.last_name}</TableCell>
                      <TableCell>{className}</TableCell>
                      <TableCell>{activity?.name}</TableCell>
                      <TableCell align="right">
                        {correction.experimental_points_earned} / {activity?.experimental_points}
                      </TableCell>
                      <TableCell align="right">
                        {correction.theoretical_points_earned} / {activity?.theoretical_points}
                      </TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={correction.status !== 'ACTIVE' ?
                            <Typography variant="overline" color="text.secondary">
                              {(() => {
                                if (!correction.status) return 'Non rendu / ABS';
                                switch (correction.status) {
                                  case 'NON_NOTE': return 'NON NOTÉ';
                                  case 'ABSENT': return 'ABSENT';
                                  case 'NON_RENDU': return 'NON RENDU';
                                  case 'DEACTIVATED': return 'DÉSACTIVÉ';
                                  default: return 'Non rendu / ABS';
                                }
                              })()}
                            </Typography> 
                            : 
                            `${correction.grade} / 20`}
                          size="small"
                          variant={correction.status !== 'ACTIVE' ? "outlined" : "filled"}
                          sx={correction.status !== 'ACTIVE'? { 
                            letterSpacing: '0.5px', 
                            opacity: 0.7,
                            textAlign: 'center',
                            justifyContent: 'center',
                          } : {
                            fontWeight: 700,
                            color: theme => theme.palette.text.primary,
                            backgroundColor:
                              (correction.grade || 0) < 8 ? theme => theme.palette.error.light :
                              (correction.grade || 0) < 10 ? theme => theme.palette.warning.light :
                              (correction.grade || 0) < 12 ? theme => theme.palette.primary.light :
                              (correction.grade || 0) < 16 ? theme => theme.palette.info.light :
                              theme => theme.palette.success.light, 
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredCorrections.length > 10 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body2" color="text.secondary">
                        ... et {filteredCorrections.length - 10} autres corrections
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredCorrections.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </TableContainer>
        ) : (
          <Alert severity="info">
            Aucune correction correspondant aux critères sélectionnés
          </Alert>
        )}
      </Paper>
    </>
  );
};

export default ExportPDFComponentAllCorrections;