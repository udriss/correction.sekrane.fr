import React, { useState } from 'react';
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
  CardActions, 
  Button, 
  Alert,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Paper,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
  Tabs,
  Tab,
  Grid
} from '@mui/material';
import { useSnackbar } from 'notistack';
import QrCodeIcon from '@mui/icons-material/QrCode';
import SaveIcon from '@mui/icons-material/Save';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import TableChartIcon from '@mui/icons-material/TableChart';
import GroupIcon from '@mui/icons-material/Group';
import SchoolIcon from '@mui/icons-material/School';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { Correction, Student } from '@/lib/types';
import { Correction as ProviderCorrection } from '@/app/components/CorrectionsDataProvider';

interface ExportPDFComponentProps {
  classData: any;
  corrections: ProviderCorrection[];
  activities: any[];
  students: Student[];
  filterActivity: number | 'all';
  setFilterActivity: (value: number | 'all') => void;
  filterSubClass: string | 'all';
  setFilterSubClass: (value: string | 'all') => void;
  uniqueSubClasses: { id: number; name: string }[];
  uniqueActivities: { id: number; name: string }[];
  getActivityById: (activityId: number) => any;
  getStudentById: (studentId: number | null) => Student | undefined;
}

// Types pour les options d'export
type ArrangementType = 'student' | 'class' | 'subclass' | 'activity';
type SubArrangementType = 'student' | 'class' | 'subclass' | 'activity' | 'none';
type ExportFormat = 'pdf' | 'csv' | 'xlsx';
type ViewType = 'detailed' | 'simplified';

const ExportPDFComponent: React.FC<ExportPDFComponentProps> = ({
  classData,
  corrections,
  activities,
  students,
  filterActivity,
  setFilterActivity,
  filterSubClass,
  setFilterSubClass,
  uniqueSubClasses,
  uniqueActivities,
  getActivityById,
  getStudentById
}) => {
  // Nouvel état pour gérer les options d'export
  const [arrangement, setArrangement] = useState<ArrangementType>('student');
  const [subArrangement, setSubArrangement] = useState<SubArrangementType>('activity');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('pdf');
  const [viewType, setViewType] = useState<ViewType>('detailed');
  const [activeTab, setActiveTab] = useState<number>(0);
  const { enqueueSnackbar } = useSnackbar();

  // Filtrer les corrections en fonction des critères sélectionnés
  const filteredCorrections = React.useMemo(() => {
    let result = [...corrections];
    
    // Filtrer par activité
    if (filterActivity !== 'all') {
      result = result.filter(c => c.activity_id === filterActivity);
    }
    
    // Filtrer par sous-classe
    if (filterSubClass !== 'all') {
      const subClassValue = parseInt(filterSubClass);
      result = result.filter(c => {
        const student = getStudentById(c.student_id);
        return student?.sub_class === subClassValue;
      });
    }
    
    return result;
  }, [corrections, filterActivity, filterSubClass, getStudentById]);

  // Fonction pour générer un PDF avec les QR codes
  const generateQRCodePDF = async () => {
    try {
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
      
      // Générer le nom du groupe pour le titre du PDF
      const groupName = filterSubClass !== 'all' 
        ? uniqueSubClasses.find(g => g.id.toString() === filterSubClass)?.name 
        : classData.name;
      
      // Générer le nom de l'activité pour le titre du PDF
      const activityName = filterActivity !== 'all'
        ? uniqueActivities.find(a => a.id === filterActivity)?.name
        : 'Toutes les activités';
      
      const { generateQRCodePDF } = await import('@/utils/qrGeneratorPDF');
      
      await generateQRCodePDF({
        corrections: filteredCorrections,
        group: {
          name: groupName || 'Classe',
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
      enqueueSnackbar('Erreur lors de la génération du PDF', { variant: 'error' });
    }
  };

  // Nouvelle fonction pour déterminer les options de sous-arrangement disponibles en fonction de l'arrangement principal
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

  // Fonction pour obtenir une icône pour chaque option
  const getArrangementIcon = (type: ArrangementType | SubArrangementType) => {
    switch (type) {
      case 'student': return <GroupIcon sx={{ mr: 1, fontSize: '1.2rem' }} />;
      case 'class': return <SchoolIcon sx={{ mr: 1, fontSize: '1.2rem' }} />;
      case 'subclass': return <SchoolIcon sx={{ mr: 1, fontSize: '1.2rem' }} />; // Même icône pour groupe
      case 'activity': return <MenuBookIcon sx={{ mr: 1, fontSize: '1.2rem' }} />;
      case 'none': return null;
      default: return null;
    }
  };

  // Mettre à jour le sous-arrangement lorsque l'arrangement principal change
  React.useEffect(() => {
    const availableSubArrangements = getAvailableSubArrangements();
    if (!availableSubArrangements.includes(subArrangement)) {
      setSubArrangement(availableSubArrangements[0]);
    }
  }, [arrangement]);

  // Fonction pour gérer le changement d'onglet
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Fonction pour générer un PDF avec les notes (version améliorée)
  const generateGradesPDF = async () => {
    try {
      // Préparer les données en fonction de l'arrangement sélectionné
      const groupedData = organizeData(filteredCorrections);
      
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
      
      doc.text(`Date: ${dateStr}`, rightX, currentY, { align: 'right' });
      currentY += lineHeight;
      doc.text(`Organisation: ${getArrangementLabel(arrangement)} > ${getArrangementLabel(subArrangement)}`, rightX, currentY, { align: 'right' });
      
      // Numérotation des pages
      const totalPages = '1'; // À ajuster si nécessaire pour des documents multi-pages
      const pageInfo = `Page 1/${totalPages}`;
      doc.setFontSize(10);
      doc.text(pageInfo, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 7, { align: 'center' });
      
      // Petite note informative
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text('Document généré automatiquement - Correction.sekrane.fr', doc.internal.pageSize.width - 20, doc.internal.pageSize.height - 7, { align: 'right' });
      
      // Reset de la couleur du texte avant de générer le contenu
      doc.setTextColor(0, 0, 0);
      doc.setFont('times', 'normal');
      doc.setFontSize(12);
      
      // Position de départ pour le contenu du PDF
      let yPosition = currentY + 15;
      
      // Générer le PDF selon l'arrangement choisi
      generatePDFContent(doc, groupedData, yPosition);
      
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

  // Fonction pour organiser les données selon l'arrangement choisi
  const organizeData = (corrections: ProviderCorrection[]) => {
    const result: any = {};
    
    // Premier niveau d'organisation (arrangement principal)
    switch (arrangement) {
      case 'student':
        corrections.forEach(correction => {
          const student = getStudentById(correction.student_id);
          if (!student) return;
          
          const studentKey = `${student.last_name} ${student.first_name}`;
          if (!result[studentKey]) {
            result[studentKey] = {
              info: { student },
              items: {}
            };
          }
          
          // Deuxième niveau (sous-arrangement)
          if (subArrangement === 'activity') {
            const activity = getActivityById(correction.activity_id);
            const activityKey = activity?.name || `Activité ${correction.activity_id}`;
            
            if (!result[studentKey].items[activityKey]) {
              result[studentKey].items[activityKey] = {
                info: { activity },
                corrections: []
              };
            }
            
            result[studentKey].items[activityKey].corrections.push(correction);
          } 
          else if (subArrangement === 'class') {
            // Déterminer la classe de l'étudiant (on utilise la classe générale)
            const classKey = classData.name || 'Classe';
            
            if (!result[studentKey].items[classKey]) {
              result[studentKey].items[classKey] = {
                info: { className: classData.name },
                corrections: []
              };
            }
            
            result[studentKey].items[classKey].corrections.push(correction);
          }
          else if (subArrangement === 'subclass') {
            // Déterminer le groupe de l'étudiant
            const subClass = student.sub_class;
            const subClassName = subClass 
              ? uniqueSubClasses.find(sc => sc.id === subClass)?.name || `Groupe ${subClass}`
              : 'Sans groupe';
            
            if (!result[studentKey].items[subClassName]) {
              result[studentKey].items[subClassName] = {
                info: { subClass },
                corrections: []
              };
            }
            
            result[studentKey].items[subClassName].corrections.push(correction);
          }
          else {
            // Pas de sous-arrangement, mettre directement les corrections
            if (!result[studentKey].corrections) {
              result[studentKey].corrections = [];
            }
            result[studentKey].corrections.push(correction);
          }
        });
        break;
        
      case 'class':
        // Par classe principale (tous les étudiants sont dans la même classe)
        const className = classData.name || 'Classe';
        
        if (!result[className]) {
          result[className] = {
            info: { className: classData.name },
            items: {}
          };
        }
        
        // Deuxième niveau (sous-arrangement)
        corrections.forEach(correction => {
          const student = getStudentById(correction.student_id);
          if (!student) return;
          
          if (subArrangement === 'student') {
            const studentKey = `${student.last_name} ${student.first_name}`;
            
            if (!result[className].items[studentKey]) {
              result[className].items[studentKey] = {
                info: { student },
                corrections: []
              };
            }
            
            result[className].items[studentKey].corrections.push(correction);
          } 
          else if (subArrangement === 'activity') {
            const activity = getActivityById(correction.activity_id);
            const activityKey = activity?.name || `Activité ${correction.activity_id}`;
            
            if (!result[className].items[activityKey]) {
              result[className].items[activityKey] = {
                info: { activity },
                corrections: []
              };
            }
            
            result[className].items[activityKey].corrections.push(correction);
          }
          else if (subArrangement === 'subclass') {
            // Sous-arrangement par groupe au sein de la classe
            const subClass = student.sub_class;
            const subClassName = subClass 
              ? uniqueSubClasses.find(sc => sc.id === subClass)?.name || `Groupe ${subClass}`
              : 'Sans groupe';
            
            if (!result[className].items[subClassName]) {
              result[className].items[subClassName] = {
                info: { subClass },
                corrections: []
              };
            }
            
            result[className].items[subClassName].corrections.push(correction);
          }
          else {
            // Pas de sous-arrangement
            if (!result[className].corrections) {
              result[className].corrections = [];
            }
            result[className].corrections.push(correction);
          }
        });
        break;
        
      case 'subclass':
        // Par groupe/sous-classe
        corrections.forEach(correction => {
          const student = getStudentById(correction.student_id);
          if (!student) return;
          
          const subClass = student.sub_class;
          const subClassName = subClass 
            ? uniqueSubClasses.find(sc => sc.id === subClass)?.name || `Groupe ${subClass}`
            : 'Sans groupe';
          
          if (!result[subClassName]) {
            result[subClassName] = {
              info: { subClass },
              items: {}
            };
          }
          
          // Deuxième niveau (sous-arrangement)
          if (subArrangement === 'student') {
            const studentKey = `${student.last_name} ${student.first_name}`;
            
            if (!result[subClassName].items[studentKey]) {
              result[subClassName].items[studentKey] = {
                info: { student },
                corrections: []
              };
            }
            
            result[subClassName].items[studentKey].corrections.push(correction);
          } 
          else if (subArrangement === 'activity') {
            const activity = getActivityById(correction.activity_id);
            const activityKey = activity?.name || `Activité ${correction.activity_id}`;
            
            if (!result[subClassName].items[activityKey]) {
              result[subClassName].items[activityKey] = {
                info: { activity },
                corrections: []
              };
            }
            
            result[subClassName].items[activityKey].corrections.push(correction);
          }
          else if (subArrangement === 'class') {
            // Sous-arrangement par classe principale
            const className = classData.name || 'Classe';
            
            if (!result[subClassName].items[className]) {
              result[subClassName].items[className] = {
                info: { className: classData.name },
                corrections: []
              };
            }
            
            result[subClassName].items[className].corrections.push(correction);
          }
          else {
            // Pas de sous-arrangement
            if (!result[subClassName].corrections) {
              result[subClassName].corrections = [];
            }
            result[subClassName].corrections.push(correction);
          }
        });
        break;
        
      case 'activity':
        corrections.forEach(correction => {
          const activity = getActivityById(correction.activity_id);
          const activityKey = activity?.name || `Activité ${correction.activity_id}`;
          
          if (!result[activityKey]) {
            result[activityKey] = {
              info: { activity },
              items: {}
            };
          }
          
          // Deuxième niveau (sous-arrangement)
          if (subArrangement === 'student') {
            const student = getStudentById(correction.student_id);
            if (!student) return;
            
            const studentKey = `${student.last_name} ${student.first_name}`;
            
            if (!result[activityKey].items[studentKey]) {
              result[activityKey].items[studentKey] = {
                info: { student },
                corrections: []
              };
            }
            
            result[activityKey].items[studentKey].corrections.push(correction);
          } 
          else if (subArrangement === 'class') {
            // Sous-arrangement par classe principale
            const className = classData.name || 'Classe';
            
            if (!result[activityKey].items[className]) {
              result[activityKey].items[className] = {
                info: { className: classData.name },
                corrections: []
              };
            }
            
            result[activityKey].items[className].corrections.push(correction);
          }
          else if (subArrangement === 'subclass') {
            // Sous-arrangement par groupe
            const student = getStudentById(correction.student_id);
            if (!student) return;
            
            const subClass = student.sub_class;
            const subClassName = subClass 
              ? uniqueSubClasses.find(sc => sc.id === subClass)?.name || `Groupe ${subClass}`
              : 'Sans groupe';
            
            if (!result[activityKey].items[subClassName]) {
              result[activityKey].items[subClassName] = {
                info: { subClass },
                corrections: []
              };
            }
            
            result[activityKey].items[subClassName].corrections.push(correction);
          }
          else {
            // Pas de sous-arrangement
            if (!result[activityKey].corrections) {
              result[activityKey].corrections = [];
            }
            result[activityKey].corrections.push(correction);
          }
        });
        break;
    }
    
    return result;
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
  const generateDetailedTable = (doc: any, corrections: ProviderCorrection[], yPosition: number) => {
    const tableData = corrections.map(c => {
      const activity = getActivityById(c.activity_id);
      const student = getStudentById(c.student_id);
      
      // Marquer explicitement les notes inactives
      const isActive = c.active !== 0;
      const totalGrade = isActive ? `${c.grade || 0} / 20` : "Non rendu / ABS";
      const expGrade = isActive ? `${c.experimental_points_earned || 0} / ${activity?.experimental_points || 0}` : "Non rendu / ABS";
      const theoGrade = isActive ? `${c.theoretical_points_earned || 0} / ${activity?.theoretical_points || 0}` : "Non rendu / ABS";
      
      return [
        student ? `${student.first_name} ${student.last_name}` : 'N/A',
        activity?.name || `Activité ${c.activity_id}`,
        expGrade,
        theoGrade,
        totalGrade
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
        0: { cellWidth: 50 }, // Largeur augmentée pour la colonne des étudiants
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
      }
    });
  };

  // Fonction pour générer un tableau simplifié (pour l'arrangement par classe)
  const generateSimplifiedTable = (doc: any, corrections: ProviderCorrection[], yPosition: number) => {
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
      
      studentMap[studentKey][activityKey] = c.grade || 0;
    });
    
    // Convertir en tableau pour jspdf-autotable
    const activityArray = Array.from(activitySet);
    const tableData = Object.entries(studentMap).map(([student, grades]) => {
      const row = [student];
      activityArray.forEach(activity => {
        row.push(grades[activity]?.toString() || '-');
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
        0: { cellWidth: 40 }
      }
    });
  };

  // Fonction pour exporter les données en CSV
  const exportToCSV = () => {
    try {
      // Préparer les données en fonction de l'arrangement sélectionné
      const groupedData = organizeData(filteredCorrections);
      
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

  // Fonction utilitaire pour échapper les caractères spéciaux dans le CSV
  const escapeCSV = (value: any): string => {
    if (value === null || value === undefined) return '';
    
    const stringValue = String(value);
    // Si la valeur contient des virgules, des guillemets ou des sauts de ligne, l'entourer de guillemets
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      // Remplacer les guillemets par des guillemets doublés (standard CSV)
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  // Fonction pour générer le contenu CSV détaillé
  const generateDetailedCSV = (corrections: ProviderCorrection[]): string => {
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
  const generateSimplifiedCSV = (corrections: ProviderCorrection[]): string => {
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
      
      studentMap[studentKey][activityKey] = c.grade || 0;
    });
    
    // Convertir en format CSV
    const activityArray = Array.from(activitySet);
    
    // En-tête du CSV
    const headers = ['Étudiant', ...activityArray];
    let content = headers.map(h => escapeCSV(h)).join(',') + '\n';
    
    // Ajouter les données
    Object.entries(studentMap).forEach(([student, grades]) => {
      const row = [escapeCSV(student)];
      
      activityArray.forEach(activity => {
        row.push(escapeCSV(grades[activity] || '-'));
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
  const exportToXLSX = async () => {
    try {
      // Préparer les données en fonction de l'arrangement sélectionné
      const groupedData = organizeData(filteredCorrections);
      
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
    corrections: ProviderCorrection[], 
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
        
        // Marquer les notes inactives
        const isActive = c.active !== 0;
        studentMap[studentKey][activityKey] = isActive ? (c.grade || 0) : "Non rendu / ABS";
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
        const isActive = c.active !== 0;
        
        // Préparer les valeurs en fonction du statut (active/inactive)
        const expGrade = isActive ? (c.experimental_points_earned || 0) : "Non rendu / ABS";
        const theoGrade = isActive ? (c.theoretical_points_earned || 0) : "Non rendu / ABS"; 
        const totalGrade = isActive ? (c.grade || 0) : "Non rendu / ABS";
        
        worksheet.addRow({
          student: student ? `${student.first_name} ${student.last_name}` : 'N/A',
          activity: activity?.name || `Activité ${c.activity_id}`,
          expGrade: expGrade,
          expMax: activity?.experimental_points || 0,
          theoGrade: theoGrade,
          theoMax: activity?.theoretical_points || 0,
          total: totalGrade,
          max: 20,
          status: isActive ? "Rendu" : "Non rendu / ABS"
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
          const totalCell = row.getCell('total');
          const totalValue = totalCell.value;
          const statusCell = row.getCell('status');
          
          // Mettre en évidence les statuts "Non rendu / ABS"
          if (statusCell.value === "Non rendu / ABS") {
            statusCell.font = { color: { argb: 'FF0000' }, bold: true }; // Rouge
            
            // Appliquer un style distinct aux cellules des notes non rendues
            row.getCell('expGrade').font = { color: { argb: 'FF0000' }, italic: true };
            row.getCell('theoGrade').font = { color: { argb: 'FF0000' }, italic: true };
            row.getCell('total').font = { color: { argb: 'FF0000' }, italic: true };
            
            // Fond grisé pour les notes non rendues
            const nonSubmittedFill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'F2F2F2' } // Gris très clair
            };
            
            row.getCell('expGrade').fill = nonSubmittedFill;
            row.getCell('theoGrade').fill = nonSubmittedFill;
            row.getCell('total').fill = nonSubmittedFill;
          }
          // Coloration en fonction de la note (seulement pour les notes actives)
          else if (typeof totalValue === 'number') {
            if (totalValue < 5) {
              totalCell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFCCCC' } // Rouge clair
              };
            } else if (totalValue < 10) {
              totalCell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFEECC' } // Orange clair
              };
            } else if (totalValue < 15) {
              totalCell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'CCFFCC' } // Vert clair
              };
            } else {
              totalCell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'CCFFCC' } // Vert clair
              };
              totalCell.font = { bold: true };
            }
          }
        }
      });
    }
    
    // Geler la première ligne
    worksheet.views = [
      { state: 'frozen', xSplit: 0, ySplit: 1, activeCell: 'A2' }
    ];
  };

  // Fonction pour gérer l'export en fonction du format sélectionné
  const handleExport = () => {
    if (exportFormat === 'pdf') {
      generateGradesPDF();
    } else if (exportFormat === 'csv') {
      exportToCSV();
    } else if (exportFormat === 'xlsx') {
      exportToXLSX();
    }
  };

  return (
    <>
      <Paper sx={{ p: 2, mb: 3 }} elevation={1}>
        <Typography variant="h5" gutterBottom>Export des données</Typography>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="export options tabs">
            <Tab label="QR Codes" icon={<QrCodeIcon />} iconPosition="start" />
            <Tab label="Notes" icon={<TableChartIcon />} iconPosition="start" />
          </Tabs>
        </Box>
        
        {activeTab === 0 && (
          <Box>
            <Typography variant="body2" paragraph>
              Générez des PDFs contenant les QR codes d'accès aux corrections pour les étudiants.
            </Typography>
            
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>Options d'export</Typography>
              
              {classData?.nbre_subclasses && classData.nbre_subclasses > 0 && (
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Groupe</InputLabel>
                  <Select
                    value={filterSubClass}
                    onChange={(e) => setFilterSubClass(e.target.value as string)}
                    label="Groupe"
                  >
                    <MenuItem value="all">Tous les groupes</MenuItem>
                    {uniqueSubClasses.map(group => (
                      <MenuItem key={group.id} value={group.id.toString()}>
                        {group.name}
                      </MenuItem>
                    ))}
                  </Select>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                    Sélectionnez un groupe spécifique ou exportez pour tous les groupes
                  </Typography>
                </FormControl>
              )}

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
                  disabled={filteredCorrections.length === 0}
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
            <Typography variant="body2" paragraph>
              Exportez les notes des étudiants sous différents formats et organisations.
            </Typography>
            
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>Options d'export</Typography>
              
              {classData?.nbre_subclasses && classData.nbre_subclasses > 0 && (
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Groupe</InputLabel>
                  <Select
                    value={filterSubClass}
                    onChange={(e) => setFilterSubClass(e.target.value as string)}
                    label="Groupe"
                  >
                    <MenuItem value="all">Tous les groupes</MenuItem>
                    {uniqueSubClasses.map(group => (
                      <MenuItem key={group.id} value={group.id.toString()}>
                        {group.name}
                      </MenuItem>
                    ))}
                  </Select>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                    Sélectionnez un groupe spécifique ou exportez pour tous les groupes
                  </Typography>
                </FormControl>
              )}

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
              
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      Organisation des données
                    </Typography>
                    
                    <FormControl component="fieldset" sx={{ mb: 2 }}>
                      <FormLabel component="legend">Organisation principale</FormLabel>
                      <RadioGroup
                        value={arrangement}
                        onChange={(e) => setArrangement(e.target.value as ArrangementType)}
                      >
                        <FormControlLabel 
                          value="student" 
                          control={<Radio />} 
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {getArrangementIcon('student')}
                              {getArrangementLabel('student')}
                            </Box>
                          } 
                        />
                        <FormControlLabel 
                          value="class" 
                          control={<Radio />} 
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {getArrangementIcon('class')}
                              {getArrangementLabel('class')}
                            </Box>
                          } 
                        />
                        <FormControlLabel 
                          value="subclass" 
                          control={<Radio />} 
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {getArrangementIcon('subclass')}
                              {getArrangementLabel('subclass')}
                            </Box>
                          } 
                        />
                        <FormControlLabel 
                          value="activity" 
                          control={<Radio />} 
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {getArrangementIcon('activity')}
                              {getArrangementLabel('activity')}
                            </Box>
                          } 
                        />
                      </RadioGroup>
                    </FormControl>
                    
                    <FormControl component="fieldset">
                      <FormLabel component="legend">Sous-organisation</FormLabel>
                      <RadioGroup
                        value={subArrangement}
                        onChange={(e) => setSubArrangement(e.target.value as SubArrangementType)}
                      >
                        {getAvailableSubArrangements().map((type) => (
                          <FormControlLabel 
                            key={type}
                            value={type} 
                            control={<Radio />} 
                            label={
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                {getArrangementIcon(type)}
                                {getArrangementLabel(type)}
                              </Box>
                            }
                          />
                        ))}
                      </RadioGroup>
                    </FormControl>
                    
                    {arrangement === 'class' && (
                      <Box sx={{ mt: 2 }}>
                        <FormControl component="fieldset">
                          <FormLabel component="legend">Type d'affichage</FormLabel>
                          <RadioGroup
                            value={viewType}
                            onChange={(e) => setViewType(e.target.value as ViewType)}
                          >
                            <FormControlLabel 
                              value="detailed" 
                              control={<Radio />} 
                              label="Détaillé (avec notes expérimentales et théoriques)" 
                            />
                            <FormControlLabel 
                              value="simplified" 
                              control={<Radio />} 
                              label="Simplifié (tableau avec étudiants et activités)" 
                            />
                          </RadioGroup>
                        </FormControl>
                      </Box>
                    )}
                  </Paper>
                </Grid>
                
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      Format d'export
                    </Typography>
                    
                    <FormControl component="fieldset" sx={{ mb: 3 }}>
                      <RadioGroup
                        value={exportFormat}
                        onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
                      >
                        <FormControlLabel 
                          value="pdf" 
                          control={<Radio />} 
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <SaveIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
                              PDF (document portable)
                            </Box>
                          } 
                        />
                        <FormControlLabel 
                          value="xlsx" 
                          control={<Radio />} 
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <FileDownloadIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
                              Excel (XLSX)
                            </Box>
                          } 
                        />
                        <FormControlLabel 
                          value="csv" 
                          control={<Radio />} 
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <FileDownloadIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
                              CSV (compatible Excel)
                            </Box>
                          } 
                        />
                      </RadioGroup>
                    </FormControl>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                      <Button
                        variant="contained"
                        startIcon={exportFormat === 'pdf' ? <SaveIcon /> : <FileDownloadIcon />}
                        disabled={filteredCorrections.length === 0}
                        onClick={handleExport}
                        size="large"
                        color="primary"
                        sx={{ px: 4 }}
                      >
                        {exportFormat === 'pdf' 
                          ? 'Générer PDF' 
                          : exportFormat === 'xlsx'
                            ? 'Exporter en Excel'
                            : 'Exporter en CSV'
                        }
                      </Button>
                    </Box>
                  </Paper>
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
        
        {filteredCorrections.length > 0 ? (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Étudiant</TableCell>
                  <TableCell>Activité</TableCell>
                  <TableCell align="right">Note Exp.</TableCell>
                  <TableCell align="right">Note Théo.</TableCell>
                  <TableCell align="center">Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCorrections.slice(0, 10).map(correction => {
                  const activity = getActivityById(correction.activity_id);
                  const student = getStudentById(correction.student_id);
                  return (
                    <TableRow key={correction.id}>
                      <TableCell>{student?.first_name} {student?.last_name}</TableCell>
                      <TableCell>{activity?.name}</TableCell>
                      <TableCell align="right">
                        {correction.experimental_points_earned} / {activity?.experimental_points}
                      </TableCell>
                      <TableCell align="right">
                        {correction.theoretical_points_earned} / {activity?.theoretical_points}
                      </TableCell>
                      <TableCell align="center">
                        <Chip 
                        
                          label={correction.active === 0 ?
                            <Typography variant="overline" color="text.secondary">Non rendu / ABS</Typography> 
                            : 
                             `${correction.grade} / 20`}
                            // Get card status color based on grade
                          size="small"
                          variant={correction.active === 0 ? "outlined" : "filled"}
                          sx={correction.active === 0 ? { 
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
                    <TableCell colSpan={5} align="center">
                      <Typography variant="body2" color="text.secondary">
                        ... et {filteredCorrections.length - 10} autres corrections
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
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

export default ExportPDFComponent;