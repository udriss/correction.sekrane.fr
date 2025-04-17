import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  FormControlLabel,
  Checkbox,
  Paper,
  Tabs,
  Tab,
  Grid,
  Alert,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  TablePagination
} from '@mui/material';
import { useSnackbar } from 'notistack';
import TableChartIcon from '@mui/icons-material/TableChart';
import ArrangementOptions from './ArrangementOptions';
import ExportFormatOptions from './ExportFormatOptions';
import QRCodeExportOptions from './QRCodeExportOptions';
import ErrorDisplay from '@/components/ui/ErrorDisplay';
import { 
  ArrangementType, 
  SubArrangementType, 
  ExportFormat, 
  ViewType,
  escapeCSV
} from './types';
import { allCorrectionsAutreDataProcessingService } from '@/components/pdfAutre/allCorrectionsAutreDataProcessingService';
import { Student, CorrectionAutreEnriched } from '@/lib/types';

interface Activity {
  id: number;
  name: string;
}

interface Class {
  id: number;
  name: string;
}

const ExportPDFComponentAllCorrectionsAutres: React.FC<any> = ({
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
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

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
          classes.forEach((cls: Class) => {
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

  // Gérer le changement de page dans la prévisualisation
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
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
      // Si l'onglet QR Codes est actif, générer le PDF de QR codes
      if (activeTab === 0) {
        await generateQRCodePDF();
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



      switch (exportFormat) {
        case 'pdf':
          await generatePDF(groupedData);
          break;
        case 'xlsx':
          await exportToXLSX(groupedData);
          break;
        case 'csv':
          await exportToCSV(groupedData);
          break;
      }
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      setError(`Erreur lors de l'export en format ${exportFormat.toUpperCase()}`);
      setErrorDetails(error);
    }
  };

  // Fonction utilitaire pour formater la note
  const formatGrade = (grade: any) => {
    let formattedGrade = '';
    if (grade !== undefined) {
    if (typeof grade === 'number') {
      formattedGrade = grade.toFixed(1);
    } else if (!isNaN(Number(grade))) {
      formattedGrade = Number(grade).toFixed(1);
    } else {
      formattedGrade = grade;
    }
    // Remove trailing .0 or .00 and replace '.' by ','
    if (typeof formattedGrade === 'string') {
      formattedGrade = formattedGrade.replace(/\.?0+$/, '').replace('.', ',');
    }
    return formattedGrade;
    }
    return '';
  };

  // Fonction pour générer le PDF
  const generatePDF = async (groupedData: any) => {
    try {
      // Importer les modules nécessaires
      const jsPDFModule = await import('jspdf');
      const jsPDF = jsPDFModule.jsPDF;
      const doc = new jsPDF();
      
      // Configurer l'en-tête du document
      doc.setFont('helvetica');
      doc.setFontSize(16);
      doc.text('Récapitulatif des notes — Corrections avec barème dynamique', 20, 20);
      
      // Informations de filtrage
      doc.setFontSize(12);
      doc.text(`Date d'export : ${new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}`, 20, 30);
      doc.text(`Activité : ${filterActivity === 'all' ? 'Toutes' : uniqueActivities.find((a: Activity) => a.id === filterActivity)?.name}`, 20, 40);
      
      // Position de départ pour le contenu du PDF
      let yPosition = 50;
      
      // Ajouter un rectangle décoratif en haut
      doc.setFillColor(66, 135, 245); // Bleu, couleur cohérente avec les tableaux
      doc.rect(0, 0, doc.internal.pageSize.width, 12, 'F');
      
      // Ajouter un rectangle décoratif en bas pour le pied de page
      doc.setFillColor(240, 240, 240); // Gris clair
      doc.rect(0, doc.internal.pageSize.height - 15, doc.internal.pageSize.width, 15, 'F');

      // Générer le contenu selon l'organisation choisie
      Object.entries(groupedData).forEach(([key, value]: [string, any]) => {
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(key, 20, yPosition);
        yPosition += 10;
        
        // Ligne de séparation sous le titre principal
        doc.setDrawColor(66, 135, 245); // Bleu
        doc.setLineWidth(0.5);
        doc.line(20, yPosition, doc.internal.pageSize.width - 20, yPosition);
        yPosition += 5;
        
        if (value.corrections) {
          // Cas 1: Corrections disponibles directement au niveau principal
          // Tableau pour ce groupe
          const tableData = value.corrections.map((c: any) => {
            const activity = getActivityById(c.activity_id);
            const student = getStudentById(c.student_id);
            
            // Vérifier si c'est une correction fictive avec status NON_NOTE
            const isPlaceholder = (c.placeholder && c.status === 'NON_NOTE');
            
            // Déterminer le statut et la représentation visuelle
            let statusDisplay = 'ACTIVE';
            let gradeDisplay = '';
            let pointsDisplay = '';
            
            if (isPlaceholder) {
              statusDisplay = 'NON NOTÉ';
              gradeDisplay = 'N/A';
              pointsDisplay = 'N/A';
            } else if (c.status) {
              switch (c.status) {
                case 'NON_NOTE':
                  statusDisplay = 'NON NOTÉ';
                  gradeDisplay = 'NON NOTÉ';
                  pointsDisplay = 'NON NOTÉ';
                  break;
                case 'ABSENT':
                  statusDisplay = 'ABSENT';
                  gradeDisplay = 'ABSENT';
                  pointsDisplay = 'ABSENT';
                  break;
                case 'NON_RENDU':
                  statusDisplay = 'NON RENDU';
                  gradeDisplay = 'NON RENDU';
                  pointsDisplay = 'NON RENDU';
                  break;
                case 'DEACTIVATED':
                  statusDisplay = 'DÉSACTIVÉ';
                  gradeDisplay = 'DÉSACTIVÉ';
                  pointsDisplay = 'DÉSACTIVÉ';
                  break;
                case 'ACTIVE':
                default:
                  // Pour les corrections actives normales
                  statusDisplay = 'ACTIVE';
                    gradeDisplay = c.grade !== undefined ? `${formatGrade(c.grade)} / 20` : 'Non noté';
                  pointsDisplay = Array.isArray(c.points_earned) ? 
                    '[' + c.points_earned.join(' ; ') + ']' : 
                    'N/A';
              }
            } else if (c.active === 0) {
              statusDisplay = 'DÉSACTIVÉ';
              gradeDisplay = 'DÉSACTIVÉ';
              pointsDisplay = 'DÉSACTIVÉ';
            } else {
              // Cas standard pour les corrections actives
              gradeDisplay = c.grade !== undefined ? 
                `${formatGrade(c.grade)} / 20` : 
                'Non noté';
              pointsDisplay = Array.isArray(c.points_earned) ? 
                '[' + c.points_earned.join(' ; ') + ']' : 
                'N/A';
            }
            
            return [
              student ? `${student.first_name} ${student.last_name}` : 'N/A',
              activity?.name || `Activité ${c.activity_id}`,
              pointsDisplay,
              gradeDisplay,
              statusDisplay
            ];
          });
          
          const autoTable = require('jspdf-autotable').default;
          autoTable(doc, {
            head: [['Étudiant', 'Activité', 'Points par partie', 'Note', 'Statut']],
            body: tableData,
            startY: yPosition,
            styles: { fontSize: 10 },
            headStyles: { fillColor: [41, 128, 185] },
            didParseCell: function(data: any) {
              // Style pour les cellules des étudiants
              if (data.column.index === 0) {
                data.cell.styles.fontStyle = 'bold';
              }
              
              // Styles basés sur le statut (indice 4)
              if (data.column.index === 4) {
                const statusValue = data.cell.raw;
                switch (statusValue) {
                  case 'NON NOTÉ':
                    data.cell.styles.fillColor = [255, 238, 238]; // Rouge très pâle
                    data.cell.styles.fontStyle = 'italic';
                    break;
                  case 'ABSENT':
                    data.cell.styles.fillColor = [238, 255, 238]; // Vert très pâle
                    data.cell.styles.fontStyle = 'bolditalic';
                    break;
                  case 'NON RENDU':
                    data.cell.styles.fillColor = [255, 242, 230]; // Orange très pâle
                    data.cell.styles.fontStyle = 'italic';
                    break;
                  case 'DÉSACTIVÉ':
                    data.cell.styles.fillColor = [242, 242, 242]; // Gris très pâle
                    data.cell.styles.fontStyle = 'italic';
                    break;
                }
              }
              
              // Style pour les points (colonne 2) et les notes (colonne 3)
              if (data.column.index === 2 || data.column.index === 3) {
                const cellValue = data.cell.raw;
                
                // Si c'est un statut spécial, appliquer le même style que pour la colonne de statut
                if (cellValue === 'NON NOTÉ') {
                  data.cell.styles.fillColor = [255, 238, 238]; // Rouge très pâle
                  data.cell.styles.fontStyle = 'italic';
                } else if (cellValue === 'ABSENT') {
                  data.cell.styles.fillColor = [238, 255, 238]; // Vert très pâle
                  data.cell.styles.fontStyle = 'bolditalic';
                } else if (cellValue === 'NON RENDU') {
                  data.cell.styles.fillColor = [255, 242, 230]; // Orange très pâle
                  data.cell.styles.fontStyle = 'italic';
                } else if (cellValue === 'DÉSACTIVÉ') {
                    data.cell.styles.fillColor = [242, 242, 242]; // Gris très pâle
                    data.cell.styles.fontStyle = 'italic';
                    
                } else if (cellValue === 'N/A') {
                  data.cell.styles.fillColor = [238, 238, 238]; // Gris clair
                  data.cell.styles.fontStyle = 'italic';
                } else if (typeof cellValue === 'string' && cellValue.includes('/')) {
                  // Pour les notes et points, dégradé de couleur basé sur la valeur
                  const match = cellValue.match(/^(\d+(\.\d+)?)\//);
                  if (match && data.column.index === 3) {  // Uniquement pour les notes
                    const grade = parseFloat(match[1]);
                    if (grade < 5) {
                      data.cell.styles.fillColor = [255, 204, 204]; // Rouge clair
                    } else if (grade < 10) {
                      data.cell.styles.fillColor = [255, 238, 204]; // Orange clair
                    } else if (grade < 15) {
                      data.cell.styles.fillColor = [238, 255, 238]; // Vert clair
                    } else {
                      data.cell.styles.fillColor = [204, 255, 204]; // Vert plus intense
                      data.cell.styles.fontStyle = 'bold';
                    }
                  }
                }
              }
            },
            // Add didDrawCell hook to draw custom content
            didDrawCell: function(data: any) {
              // Check if the cell is in the relevant columns (Points, Note, Statut)
              if (data.column.index >= 2 && data.column.index <= 4) {
                const cellValue = data.cell.raw;
                if (cellValue === 'DÉSACTIVÉ') {
                  // Draw a diagonal line (strikethrough)
                  doc.setDrawColor(230, 230, 230); // Set line color (e.g., gray)
                  doc.setLineWidth(0.2);
                  doc.line(
                    data.cell.x, 
                    data.cell.y, 
                    data.cell.x + data.cell.width, 
                    data.cell.y + data.cell.height
                  );
                  doc.line(
                    data.cell.x + data.cell.width, 
                    data.cell.y, 
                    data.cell.x , 
                    data.cell.y + data.cell.height
                  );
                }
              }
            }
          });
          
          yPosition = (doc as any).lastAutoTable.finalY + 10;
        } 
        else if (value.items) {
          // Cas 2: Les corrections sont dans les sous-objets (sous-arrangement)
          Object.entries(value.items).forEach(([subKey, subValue]: [string, any]) => {
            // Vérification pour nouvelle page si l'espace est insuffisant
            if (yPosition > doc.internal.pageSize.height - 50) {
              doc.addPage();
              yPosition = 20;
              
              // Ajouter un rectangle décoratif en haut de la nouvelle page
              doc.setFillColor(66, 135, 245);
              doc.rect(0, 0, doc.internal.pageSize.width, 12, 'F');
              
              // Ajouter un rectangle décoratif en bas pour le pied de page
              doc.setFillColor(240, 240, 240);
              doc.rect(0, doc.internal.pageSize.height - 15, doc.internal.pageSize.width, 15, 'F');
            }
            
            // Ajouter un titre bien mis en évidence pour ce sous-arrangement avec un fond coloré
            
            // Créer un dégradé pour le fond du titre du sous-arrangement
            doc.setFillColor(230, 240, 255); // Bleu très pâle pour le fond de base
            doc.rect(20, yPosition - 7, doc.internal.pageSize.width - 40, 16, 'F');
            
            // Ajouter une bande colorée sur le côté gauche pour plus de visibilité
            doc.setFillColor(66, 135, 245); // Bleu plus vif
            doc.rect(20, yPosition - 7, 5, 16, 'F');
            
            // Ajouter une bordure plus prononcée autour du titre
            doc.setDrawColor(41, 98, 255); // Bleu plus foncé pour la bordure
            doc.setLineWidth(0.5);
            doc.rect(20, yPosition - 7, doc.internal.pageSize.width - 40, 16);
            
            // Ajouter un effet d'ombre légère (en dessinant un rectangle gris en dessous)
            doc.setFillColor(250, 250, 250);
            doc.rect(18, yPosition - 9, doc.internal.pageSize.width - 40, 16, 'F');
            doc.setFillColor(240, 240, 245);
            doc.rect(20, yPosition - 7, doc.internal.pageSize.width - 40, 16, 'F');
            
            // Déterminer le type de sous-arrangement (classe, groupe ou activité)
            let subArrangementType = '';
            if (subArrangement === 'class') subArrangementType = 'Classe';
            else if (subArrangement === 'activity') subArrangementType = 'Activité';
            else if (subArrangement === 'student') subArrangementType = 'Étudiant';
            else if (subArrangement === 'subclass') subArrangementType = 'Groupe';
            else subArrangementType = 'Groupe';
            
            // Texte du titre avec style amélioré
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 51, 153); // Bleu foncé pour le texte
            
            // Ajouter un emoji ou indicateur visuel selon le type de sous-arrangement
            // Icônes Unicode accessibles pour le PDF (compatibles PDF, pas d'emoji couleur)
            let prefixIcon = '';
            if (subArrangement === 'class') prefixIcon = '\u{1F393} ';      // 🎓
            else if (subArrangement === 'activity') prefixIcon = '\u{1F4D6} '; // 📖
            else if (subArrangement === 'student') prefixIcon = '\u{1F464} ';  // 👤
            else if (subArrangement === 'subclass') prefixIcon = '\u{1F465} '; // 👥
            
            // doc.text(`${prefixIcon}${subArrangementType}: ${subKey}`, 30, yPosition + 2);
            doc.text(`${subArrangementType} : ${subKey}`, 30, yPosition + 2);
            
            // Réinitialiser la couleur du texte
            doc.setTextColor(0, 0, 0);
            
            yPosition += 13; // Espace après le titre du sous-arrangement
            
            // Vérifier que subValue a des corrections
            if (subValue.corrections && subValue.corrections.length > 0) {

              // --- Ajout du tri par nom d'étudiant ---
              subValue.corrections.sort((a: CorrectionAutreEnriched, b: CorrectionAutreEnriched) => {
                const studentA = getStudentById(a.student_id) as Student | undefined;
                const studentB = getStudentById(b.student_id) as Student | undefined;

                const nameA = studentA ? `${studentA.last_name} ${studentA.first_name}` : '';
                const nameB = studentB ? `${studentB.last_name} ${studentB.first_name}` : '';

                // Handle cases where student might not be found
                if (!nameA && !nameB) return 0;
                if (!nameA) return 1; // Put corrections without student info last
                if (!nameB) return -1; // Put corrections without student info last

                return nameA.localeCompare(nameB, 'fr', { sensitivity: 'base' });
              });
              // --- Fin de l'ajout du tri ---

              const tableData = subValue.corrections.map((c: any) => {
                const activity = getActivityById(c.activity_id);
                const student = getStudentById(c.student_id);
                
                // Vérifier si c'est une correction fictive avec status NON_NOTE
                const isPlaceholder = (c.placeholder && c.status === 'NON_NOTE');
                
                // Déterminer le statut et la représentation visuelle
                let statusDisplay = 'ACTIVE';
                let gradeDisplay = '';
                let pointsDisplay = '';
                
                if (isPlaceholder) {
                  statusDisplay = 'NON NOTÉ';
                  gradeDisplay = 'N/A';
                  pointsDisplay = 'N/A';
                } else if (c.status) {
                  switch (c.status) {
                    case 'NON_NOTE':
                      statusDisplay = 'NON NOTÉ';
                      gradeDisplay = 'NON NOTÉ';
                      pointsDisplay = 'NON NOTÉ';
                      break;
                    case 'ABSENT':
                      statusDisplay = 'ABSENT';
                      gradeDisplay = 'ABSENT';
                      pointsDisplay = 'ABSENT';
                      break;
                    case 'NON_RENDU':
                      statusDisplay = 'NON RENDU';
                      gradeDisplay = 'NON RENDU';
                      pointsDisplay = 'NON RENDU';
                      break;
                    case 'DEACTIVATED':
                      statusDisplay = 'DÉSACTIVÉ';
                      gradeDisplay = 'DÉSACTIVÉ';
                      pointsDisplay = 'DÉSACTIVÉ';
                      break;
                    case 'ACTIVE':
                    default:
                      // Pour les corrections actives normales
                      statusDisplay = 'ACTIVE';
                      gradeDisplay = c.grade !== undefined ? 
                        `${formatGrade(c.grade)} / 20` : 
                        'Non noté';
                      pointsDisplay = Array.isArray(c.points_earned) ? 
                        '[' + c.points_earned.join(' ; ') + ']' : 
                        'N/A';
                  }
                } else if (c.active === 0) {
                  statusDisplay = 'DÉSACTIVÉ';
                  gradeDisplay = 'DÉSACTIVÉ';
                  pointsDisplay = 'DÉSACTIVÉ';
                } else {
                  // Cas standard pour les corrections actives
                  gradeDisplay = c.grade !== undefined ? 
                    `${formatGrade(c.grade)} / 20` : 
                    'Non noté';
                  pointsDisplay = Array.isArray(c.points_earned) ? 
                    '[' + c.points_earned.join(' ; ') + ']' : 
                    'N/A';
                }
                
                return [
                  student ? `${student.first_name} ${student.last_name ? student.last_name.substring(0, 2).toUpperCase()+'.' : ''}` : 'N/A',
                  activity?.name || `Activité ${c.activity_id}`,
                  pointsDisplay,
                  gradeDisplay,
                  statusDisplay
                ];
              });
              
                const autoTable = require('jspdf-autotable').default;
                autoTable(doc, {
                head: [['Étudiant', 'Activité', 'Points par partie', 'Note', 'Statut']],
                body: tableData,
                startY: yPosition,
                styles: { fontSize: 10 },
                headStyles: { fillColor: [41, 128, 185], halign: 'center' },
                columnStyles: {
                  0: { halign: 'left' }, // Première colonne (Étudiant) alignée à gauche
                  1: { halign: 'center' },
                  2: { halign: 'center' },
                  3: { halign: 'center' },
                  4: { halign: 'center' },
                },
                margin: { left: 10, right: 10 }, // Marge indentée pour les sous-tableaux
                didParseCell: function(data: any) {
                  // Style pour les cellules des étudiants
                  if (data.column.index === 0) {
                  data.cell.styles.fontStyle = 'bold';
                  }
                  
                  // Styles basés sur le statut (indice 4)
                  if (data.column.index === 4) {
                  const statusValue = data.cell.raw;
                  switch (statusValue) {
                    case 'NON NOTÉ':
                    data.cell.styles.fillColor = [255, 238, 238]; // Rouge très pâle
                    data.cell.styles.fontStyle = 'italic';
                    break;
                    case 'ABSENT':
                    data.cell.styles.fillColor = [238, 255, 238]; // Vert très pâle
                    data.cell.styles.fontStyle = 'bolditalic';
                    break;
                    case 'NON RENDU':
                    data.cell.styles.fillColor = [255, 242, 230]; // Orange très pâle
                    data.cell.styles.fontStyle = 'italic';
                    break;
                    case 'DÉSACTIVÉ':
                    data.cell.styles.fillColor = [252, 252, 252]; // Gris très pâle
                    data.cell.styles.fontStyle = 'italic';
                    break;
                  }
                  }
                  
                  // Style pour les points (colonne 2) et les notes (colonne 3)
                  if (data.column.index === 2 || data.column.index === 3) {
                  const cellValue = data.cell.raw;
                  
                  // Si c'est un statut spécial, appliquer le même style que pour la colonne de statut
                  if (cellValue === 'NON NOTÉ') {
                    data.cell.styles.fillColor = [255, 238, 238]; // Rouge très pâle
                    data.cell.styles.fontStyle = 'italic';
                  } else if (cellValue === 'ABSENT') {
                    data.cell.styles.fillColor = [238, 255, 238]; // Vert très pâle
                    data.cell.styles.fontStyle = 'bolditalic';
                  } else if (cellValue === 'NON RENDU') {
                    data.cell.styles.fillColor = [255, 242, 230]; // Orange très pâle
                    data.cell.styles.fontStyle = 'italic';
                  } else if (cellValue === 'DÉSACTIVÉ') {
                    data.cell.styles.fillColor = [252, 252, 252]; // Gris très pâle
                    data.cell.styles.fontStyle = 'italic';
                  } else if (cellValue === 'N/A') {
                    data.cell.styles.fillColor = [238, 238, 238]; // Gris clair
                    data.cell.styles.fontStyle = 'italic';
                  } else if (typeof cellValue === 'string' && cellValue.includes('/')) {
                    // Pour les notes et points, dégradé de couleur basé sur la valeur
                    const match = cellValue.match(/^(\d+(\.\d+)?)\//);
                    if (match && data.column.index === 3) {  // Uniquement pour les notes
                    const grade = parseFloat(match[1]);
                    if (grade < 5) {
                      data.cell.styles.fillColor = [255, 204, 204]; // Rouge clair
                    } else if (grade < 10) {
                      data.cell.styles.fillColor = [255, 238, 204]; // Orange clair
                    } else if (grade < 15) {
                      data.cell.styles.fillColor = [238, 255, 238]; // Vert clair
                    } else {
                      data.cell.styles.fillColor = [204, 255, 204]; // Vert plus intense
                      data.cell.styles.fontStyle = 'bold';
                    }
                    }
                  }
                  }
                },
                // Add didDrawCell hook to draw custom content for sub-tables
                didDrawCell: function(data: any) {
                  // Check if the cell is in the relevant columns (Points, Note, Statut)
                  if (data.column.index >= 2 && data.column.index <= 4) { 
                  const cellValue = data.cell.raw;
                  if (cellValue === 'DÉSACTIVÉ') {
                    // Draw a diagonal line (strikethrough)
                    doc.setDrawColor(200, 200, 200); // Set line color (e.g., gray)
                    doc.setLineWidth(0.2);
                    doc.line(
                    data.cell.x, 
                    data.cell.y, 
                    data.cell.x + data.cell.width, 
                    data.cell.y + data.cell.height
                    );
                    doc.line(
                    data.cell.x + data.cell.width, 
                    data.cell.y, 
                    data.cell.x , 
                    data.cell.y + data.cell.height
                    );
                  }
                  }
                }
                });
              yPosition = (doc as any).lastAutoTable.finalY + 15; // Espace supplémentaire entre les sous-tableaux
            } else {
              // Aucune correction pour ce sous-groupe
              doc.setFontSize(10);
              doc.text('Aucune correction disponible', 40, yPosition);
              yPosition += 10;
            }
            
            // Espace après chaque sous-section
            yPosition += 5;
          });
        }
        
        if (yPosition > doc.internal.pageSize.height - 30) {
          doc.addPage();
          yPosition = 20;
          
          // Ajouter un rectangle décoratif en haut de chaque nouvelle page
          doc.setFillColor(66, 135, 245);
          doc.rect(0, 0, doc.internal.pageSize.width, 12, 'F');
          
          // Ajouter un rectangle décoratif en bas pour le pied de page
          doc.setFillColor(240, 240, 240);
          doc.rect(0, doc.internal.pageSize.height - 15, doc.internal.pageSize.width, 15, 'F');
        }
      });
      
      // Finaliser avec numéro de page et informations
      const totalPages = doc.getNumberOfPages();
      
      // Ajouter les pieds de page à toutes les pages
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        
        // Numérotation des pages
        const pageInfo = `Page ${i}/${totalPages}`;
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text(pageInfo, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 7, { align: 'center' });
        
        // Petit texte d'information
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text('Document construit automatiquement — correction.sekrane.fr', 100, doc.internal.pageSize.height - 7, { align: 'right' });
      }
      
      // Sauvegarder le PDF
      const fileName = `Corrections_${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(fileName);
      enqueueSnackbar('PDF construit avec succès', { variant: 'success' });
      
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      throw error;
    }
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
          fileName = `Notes_${arrangement}_${key.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
          
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
            const safeKey = key.replace(/\s+/g, '_');
            const safeSubKey = subKey.replace(/\s+/g, '_');
            
            fileName = `Notes_${arrangement}_${subArrangement}_${safeKey}_${safeSubKey}_${new Date().toISOString().slice(0, 10)}.csv`;
            
            // Vérifier si subValue a des corrections
            if (subValue.corrections && subValue.corrections.length > 0) {
              if (viewType === 'simplified' && (arrangement === 'class' || arrangement === 'subclass')) {
                // Format simplifié pour l'arrangement par classe
                csvContent = generateSimplifiedCSV(subValue.corrections);
              } else {
                // Format détaillé standard
                csvContent = generateDetailedCSV(subValue.corrections);
              }
              
              // Déclencher le téléchargement
              downloadCSV(csvContent, fileName);
            } else if (subValue.items) {
              // Gérer les sous-sous-arrangements (structure à trois niveaux)
              Object.entries(subValue.items).forEach(([subSubKey, subSubValue]: [string, any]) => {
                const safeSubSubKey = subSubKey.replace(/\s+/g, '_');
                
                fileName = `Notes_${arrangement}_${subArrangement}_${safeKey}_${safeSubKey}_${safeSubSubKey}_${new Date().toISOString().slice(0, 10)}.csv`;
                
                if (subSubValue.corrections && subSubValue.corrections.length > 0) {
                  if (viewType === 'simplified') {
                    csvContent = generateSimplifiedCSV(subSubValue.corrections);
                  } else {
                    csvContent = generateDetailedCSV(subSubValue.corrections);
                  }
                  
                  // Déclencher le téléchargement
                  downloadCSV(csvContent, fileName);
                }
              });
            }
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
  const generateDetailedCSV = (correctionsInput: any[]): string => {
    // Create a mutable copy to sort
    const corrections = [...correctionsInput];

    // --- Ajout du tri par nom d'étudiant ---
    corrections.sort((a: CorrectionAutreEnriched, b: CorrectionAutreEnriched) => {
      const studentA = getStudentById(a.student_id) as Student | undefined;
      const studentB = getStudentById(b.student_id) as Student | undefined;
      const nameA = studentA ? `${studentA.last_name} ${studentA.first_name}` : '';
      const nameB = studentB ? `${studentB.last_name} ${studentB.first_name}` : '';
      if (!nameA && !nameB) return 0;
      if (!nameA) return 1;
      if (!nameB) return -1;
      return nameA.localeCompare(nameB, 'fr', { sensitivity: 'base' });
    });
    // --- Fin de l'ajout du tri ---

    // En-tête du CSV
    const headers = ['Étudiant', 'Classe', 'Activité', 'Points par partie', 'Note', 'Statut'];
    let content = headers.join(',') + '\n';
    
    // Ajouter les données (maintenant triées)
    corrections.forEach(c => {
      const activity = getActivityById(c.activity_id);
      const student = getStudentById(c.student_id);
      const className = classesMap.get(c.class_id)?.name || `Classe ${c.class_id}`;
      
      // Déterminer le statut
      let statusDisplay = 'ACTIVE';
      if (c.status) {
        switch (c.status) {
          case 'NON_NOTE': statusDisplay = 'NON NOTÉ'; break;
          case 'ABSENT': statusDisplay = 'ABSENT'; break;
          case 'NON_RENDU': statusDisplay = 'NON RENDU'; break;
          case 'DEACTIVATED': statusDisplay = 'DÉSACTIVÉ'; break;
          default: statusDisplay = c.status;
        }
      } else if (c.active === 0) {
        statusDisplay = 'DÉSACTIVÉ';
      }
      
      // Formater les points
      let pointsDisplay = 'N/A';
      if (Array.isArray(c.points_earned) && c.points_earned.length > 0) {
        pointsDisplay = '[' + c.points_earned.join(' ; ') + ']';
      }
      
      // Formater la note
      let gradeDisplay = 'N/A';
      if (c.grade !== undefined) {
        if (statusDisplay === 'ACTIVE') {
          gradeDisplay = `${formatGrade(c.grade)} / 20`;
        } else {
          gradeDisplay = statusDisplay;
        }
      }
      
      const row = [
        escapeCSV(student ? `${student.first_name} ${student.last_name}` : 'N/A'),
        escapeCSV(className),
        escapeCSV(activity?.name || `Activité ${c.activity_id}`),
        escapeCSV(pointsDisplay),
        escapeCSV(gradeDisplay),
        escapeCSV(statusDisplay)
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
      
      // Déterminer la valeur à afficher
      let displayValue = 'NON NOTÉ';
      
      if (c.status) {
        switch (c.status) {
          case 'ACTIVE':
            displayValue = c.grade !== undefined ? `${formatGrade(c.grade)}/20` : 'NON NOTÉ';
            break;
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
            displayValue = c.grade !== undefined ? `${formatGrade(c.grade)}/20` : 'NON NOTÉ';
        }
      } else if (c.active === 0) {
        displayValue = 'DÉSACTIVÉ';
      } else if (c.grade !== undefined) {
        displayValue = `${formatGrade(c.grade)}/20`;
      }
      
      studentMap[studentKey][activityKey] = displayValue;
    });
    
    // Convertir les activités en tableau pour les colonnes
    const activityArray = Array.from(activitySet);
    
    // En-tête du CSV
    const headers = ['Étudiant', ...activityArray];
    let content = headers.map(h => escapeCSV(h)).join(',') + '\n';
    
    // --- Tri des entrées de la map par nom d'étudiant --- 
    const sortedStudentEntries = Object.entries(studentMap).sort(([studentNameA], [studentNameB]) => {
      return studentNameA.localeCompare(studentNameB, 'fr', { sensitivity: 'base' });
    });
    // --- Fin du tri ---

    // Ajouter les données (maintenant triées par étudiant)
    sortedStudentEntries.forEach(([student, grades]) => {
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
    correctionsInput: any[], // Rename input to avoid shadowing
    viewType: ViewType, 
    arrangement: ArrangementType
  ) => {
    // Create a mutable copy to sort
    const corrections = [...correctionsInput];

    if (viewType === 'simplified' && (arrangement === 'class' || arrangement === 'subclass')) {
      // Format simplifié pour l'arrangement par classe
      // Regrouper les étudiants (lignes) et les activités (colonnes)
      const studentMap: Record<string, Record<string, any>> = {};
      const activitySet = new Set<string>();
      const activityStatusMap: Record<string, string> = {}; // Pour stocker les statuts des activités
      
      // --- Tri des corrections initiales (optionnel mais peut aider à la cohérence si la map est utilisée ailleurs) ---
      corrections.sort((a: CorrectionAutreEnriched, b: CorrectionAutreEnriched) => {
        const studentA = getStudentById(a.student_id) as Student | undefined;
        const studentB = getStudentById(b.student_id) as Student | undefined;
        const nameA = studentA ? `${studentA.last_name} ${studentA.first_name}` : '';
        const nameB = studentB ? `${studentB.last_name} ${studentB.first_name}` : '';
        if (!nameA && !nameB) return 0;
        if (!nameA) return 1;
        if (!nameB) return -1;
        return nameA.localeCompare(nameB, 'fr', { sensitivity: 'base' });
      });
      // --- Fin du tri ---

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
        
        // Vérifier si c'est une correction fictive avec status NON_NOTE
        const isPlaceholder = (c.placeholder && c.status === 'NON_NOTE');
        
        // Déterminer la valeur à afficher
        let displayValue = 'NON NOTÉ XLSX';
        
        if (isPlaceholder) {
          displayValue = 'N/A XLSX';
        } else if (c.status) {
          switch (c.status) {
            case 'ACTIVE':
              
              displayValue = c.grade !== undefined ? 
              `${formatGrade(c.grade)} / 20`
               : 'NON NOTÉ';
              break;
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
              displayValue = c.grade !== undefined ? 
              `${formatGrade(c.grade)} / 20`
               : 'NON NOTÉ';
          }
        } else if (c.active === 0) {
          displayValue = 'DÉSACTIVÉ';
        } else if (c.grade !== undefined) {
          displayValue = `${c.grade}/20`;
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
      // --- Tri des entrées de la map par nom d'étudiant --- 
      const sortedStudentEntries = Object.entries(studentMap).sort(([studentNameA], [studentNameB]) => {
        return studentNameA.localeCompare(studentNameB, 'fr', { sensitivity: 'base' });
      });
      // --- Fin du tri ---

      // Iterate over the sorted entries
      sortedStudentEntries.forEach(([studentName, grades]) => {
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
      // Format détaillé standard pour corrections_autres
      worksheet.columns = [
        { header: 'Étudiant', key: 'student', width: 30 },
        { header: 'Classe', key: 'class', width: 20 },
        { header: 'Activité', key: 'activity', width: 30 },
        { header: 'Points par partie', key: 'points', width: 30 },
        { header: 'Note', key: 'grade', width: 15 },
        { header: 'Statut', key: 'status', width: 15 }
      ];
      
      // --- Ajout du tri par nom d'étudiant pour la vue détaillée ---
      corrections.sort((a: CorrectionAutreEnriched, b: CorrectionAutreEnriched) => {
        const studentA = getStudentById(a.student_id) as Student | undefined;
        const studentB = getStudentById(b.student_id) as Student | undefined;
        const nameA = studentA ? `${studentA.last_name} ${studentA.first_name}` : '';
        const nameB = studentB ? `${studentB.last_name} ${studentB.first_name}` : '';
        if (!nameA && !nameB) return 0;
        if (!nameA) return 1;
        if (!nameB) return -1;
        return nameA.localeCompare(nameB, 'fr', { sensitivity: 'base' });
      });
      // --- Fin de l'ajout du tri ---

      // Ajouter les données des corrections (maintenant triées)
      corrections.forEach(c => {
        const activity = getActivityById(c.activity_id);
        const student = getStudentById(c.student_id);
        const className = classesMap.get(c.class_id)?.name || `Classe ${c.class_id}`;
        
        // Vérifier si c'est une correction fictive avec status NON_NOTE
        const isPlaceholder = (c.placeholder && c.status === 'NON_NOTE');
        
        // Déterminer le statut
        let statusDisplay = 'ACTIVE';
        if (c.status) {
          switch (c.status) {
            case 'NON_NOTE': statusDisplay = 'NON NOTÉ'; break;
            case 'ABSENT': statusDisplay = 'ABSENT'; break;
            case 'NON_RENDU': statusDisplay = 'NON RENDU'; break;
            case 'DEACTIVATED': statusDisplay = 'DÉSACTIVÉ'; break;
            default: statusDisplay = c.status;
          }
        } else if (c.active === 0) {
          statusDisplay = 'DÉSACTIVÉ';
        }
        
        // Formater les points
        let pointsDisplay = isPlaceholder ? 'N/A' : 'N/A';
        if (!isPlaceholder && Array.isArray(c.points_earned) && c.points_earned.length > 0) {
          pointsDisplay = '[' + c.points_earned.join(' ; ') + ']';
        }
        
        // Formater la note
        let gradeDisplay;
        if (isPlaceholder) {
          gradeDisplay = 'N/A';
        } else if (c.grade !== undefined) {
          if (statusDisplay === 'ACTIVE') {
            gradeDisplay = `${formatGrade(c.grade)} / 20`;
          } else {
            gradeDisplay = statusDisplay;
          }
        } else {
          gradeDisplay = 'NON NOTÉ';
        }
        
        const row = worksheet.addRow({
          student: student ? `${student.first_name} ${student.last_name}` : 'N/A',
          class: className,
          activity: activity?.name || `Activité ${c.activity_id}`,
          points: pointsDisplay,
          grade: gradeDisplay,
          status: statusDisplay
        });
        
        // Appliquer des styles aux cellules
        applyExcelCellStyle(row.getCell('grade'), gradeDisplay);
        applyExcelCellStyle(row.getCell('status'), statusDisplay);
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

  // Fonction d'aide pour convertir les styles vers les styles ExcelJS
  const applyExcelCellStyle = (cell: any, cellValue: any) => {
    if (!cell) return;
    
    // Déterminer le style en fonction de la valeur
    if (typeof cellValue === 'string') {
      // Pour les statuts spéciaux
      if (cellValue === 'NON NOTÉ') {
        cell.font = { color: { argb: 'FFCC0000' }, italic: true }; // Rouge
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFEEEE' } // Rouge très pâle
        };
      } else if (cellValue === 'ABSENT') {
        cell.font = { color: { argb: 'FF006600' }, bold: true, italic: true }; // Vert foncé
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFEEFFEE' } // Vert très pâle
        };
      } else if (cellValue === 'NON RENDU') {
        cell.font = { color: { argb: 'FFCC6600' }, italic: true }; // Orange foncé
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFF2E6' } // Orange très pâle
        };
      } else if (cellValue === 'DÉSACTIVÉ') {
        cell.font = { color: { argb: 'FF666666' }, italic: true }; // Gris
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF2F2F2' } // Gris très pâle
        };
      } else if (cellValue.includes('/')) {
        // Pour les notes avec format "X/20"
        const match = cellValue.match(/^(\d+(\.\d+)?)\//);
        if (match) {
          const grade = parseFloat(match[1]);
          if (grade < 5) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFFCCCC' } // Rouge clair
            };
          } else if (grade < 10) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFFEECC' } // Orange clair
            };
          } else if (grade < 15) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFEEFFEE' } // Vert clair
            };
          } else {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFCCFFCC' } // Vert clair
            };
            cell.font = { bold: true };
          }
        }
      }
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
        ? uniqueActivities.find((a: Activity) => a.id === filterActivity)?.name
        : 'Toutes les activités';
      
      // Préparer les données d'étudiants à utiliser
      const studentsToUse = includeAllStudents && allStudents.length > 0
        ? allStudents
        : students;
      
      // Si includeAllStudents est activé, nous créons une liste de corrections qui inclut tous les étudiants
      let correctionsList = [...filteredCorrections];
      
      if (includeAllStudents && allStudents.length > 0) {
        // Créer un Map des corrections existantes pour faciliter la recherche
        const correctionsMap = new Map();
        
        filteredCorrections.forEach(correction => {
          const key = `${correction.student_id}-${correction.activity_id}`;
          correctionsMap.set(key, correction);
        });
        
        // Pour chaque étudiant, s'assurer qu'il a une correction pour chaque activité
        const activitiesToProcess = filterActivity === 'all' 
          ? uniqueActivities
          : uniqueActivities.filter((a: any) => a.id === filterActivity);
        
        // Typer explicitement le tableau
        const placeholderCorrections: Array<{
          id: string;
          student_id: number;
          activity_id: number;
          class_id: number | null;
          sub_class: string | null;
          grade: null;
          status: string;
          placeholder: boolean;
          noQRCode: boolean;
          student_name: string;
          activity_name: string;
          class_name: string;
        }> = [];
        
        allStudents.forEach(student => {
          activitiesToProcess.forEach((activity: any) => {
            const key = `${student.id}-${activity.id}`;
            
            // Vérifier si l'étudiant a déjà une correction pour cette activité
            if (!correctionsMap.has(key)) {
              // Créer une correction "placeholder" pour cet étudiant et cette activité
              placeholderCorrections.push({
                id: `placeholder-${key}`,
                student_id: student.id,
                activity_id: activity.id,
                class_id: student.allClasses && student.allClasses.length > 0 
                  ? student.allClasses[0].classId
                  : null,
                sub_class: student.sub_class || null,
                grade: null,
                status: 'NON_NOTE',
                placeholder: true, // Marquer comme placeholder pour identifier facilement
                noQRCode: true, // Indicateur pour ne pas générer de QR code
                student_name: `${student.first_name} ${student.last_name}`,
                activity_name: activity.name || `Activité ${activity.id}`,
                class_name: student.allClasses && student.allClasses.length > 0 
                  ? student.allClasses[0].className || `Classe ${student.allClasses[0].classId}`
                  : 'Classe non attribuée'
              });
            }
          });
        });
        
        // Ajouter les corrections placeholder à la liste principale
        correctionsList = [...filteredCorrections, ...placeholderCorrections];
      }
      
      // Organiser les données selon l'arrangement et le sous-arrangement sélectionnés
      const groupedData = allCorrectionsAutreDataProcessingService.organizeAllCorrectionsData({
        corrections: correctionsList,
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
      
      // Importer la fonction de génération de QR codes
      const { generateQRCodePDF } = await import('@/utils/qrGeneratorPDFAutre');
      
      // Générer le PDF avec les paramètres d'organisation
      await generateQRCodePDF({
        corrections: correctionsList,
        group: {
          name: 'Toutes les classes',
          activity_name: activityName || 'Activité'
        },
        students: studentsToUse,
        activities,
        includeDetails: true,
        // Nouveaux paramètres pour l'organisation
        arrangement,
        subArrangement,
        groupedData,
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
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="QR Codes" icon={<TableChartIcon />} />
            <Tab label="Notes" icon={<TableChartIcon />} />
          </Tabs>
        </Box>
        
        <Box sx={{ mt: 3 }}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Activité</InputLabel>
            <Select
              value={filterActivity}
              onChange={(e) => setFilterActivity(e.target.value as number | 'all')}
              label="Activité"
            >
              <MenuItem value="all">Toutes les activités</MenuItem>
              {uniqueActivities.map((activity: Activity) => (
                <MenuItem key={activity.id} value={activity.id}>
                  {activity.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Checkbox
                checked={includeAllStudents}
                onChange={(e) => setIncludeAllStudents(e.target.checked)}
              />
            }
            label="Inclure tous les étudiants"
          />

          <Grid container spacing={3} sx={{ mt: 2 }}>
            {/* Arrangment Options - Visible pour les deux onglets */}
            <Grid size={{ xs: 12, }}>
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
            
            <Grid size={{ xs: 12, }}>
              {activeTab === 0 ? (
                <QRCodeExportOptions
                  onExport={handleExport}
                  disabled={filteredCorrections.length === 0 || loading}
                />
              ) : (
                <ExportFormatOptions
                  exportFormat={exportFormat}
                  setExportFormat={setExportFormat}
                  onExport={handleExport}
                  disabled={filteredCorrections.length === 0 || loading}
                />
              )}
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Aperçu des corrections */}
      <Paper sx={{ p: 2 }} elevation={1}>
        <Typography variant="h6" gutterBottom>
          Aperçu ({filteredCorrections.length} corrections)
        </Typography>
        
        {loading ? (
          <Typography>Chargement...</Typography>
        ) : filteredCorrections.length > 0 ? (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Étudiant</TableCell>
                  <TableCell>Classe</TableCell>
                  <TableCell>Activité</TableCell>
                  <TableCell>Points par partie</TableCell>
                  <TableCell align="center">Note</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCorrections
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map(correction => {
                    const activity = getActivityById(correction.activity_id);
                    const student = getStudentById(correction.student_id);
                    const className = classesMap.get(correction.class_id)?.name || 
                                    `Classe ${correction.class_id}`;
                    
                    return (
                      <TableRow key={correction.id}>
                        <TableCell>{student ? `${student.first_name} ${student.last_name}` : 'N/A'}</TableCell>
                        <TableCell>{className}</TableCell>
                        <TableCell>{activity?.name}</TableCell>
                        <TableCell>{Array.isArray(correction.points_earned) ? '[' + correction.points_earned.join(' ; ') + ']' : 'N/A'}</TableCell>
                        <TableCell align="center">
                          <Chip
                            label={correction.grade ? 
                               `${formatGrade(correction.grade)} / 20` 
                               : 'Non noté'}
                            color={correction.grade >= 10 ? 'success' : 'error'}
                            variant="outlined"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
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
            Aucune correction ne correspond aux critères sélectionnés
          </Alert>
        )}
      </Paper>
    </>
  );
};

export default ExportPDFComponentAllCorrectionsAutres;