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
  Button,
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
import QrCodeIcon from '@mui/icons-material/QrCode';
import TableChartIcon from '@mui/icons-material/TableChart';
import ArrangementOptions from './ArrangementOptions';
import ExportFormatOptions from './ExportFormatOptions';
import ErrorDisplay from '@/components/ui/ErrorDisplay';
import { 
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
  const [error, setError] = useState<string | null>(null);
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
        return ['student', 'activity', 'none'];
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

  // Fonction pour gérer l'export
  const handleExport = async () => {
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
        
        if (includeAllStudents && allStudents.length > 0) {
          const student = allStudents.find(s => s.id === studentId);
          if (student) return student;
        }
        
        return getStudentById(studentId);
      },
      classesMap
    });

    try {
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

  // Fonction pour générer le PDF
  const generatePDF = async (groupedData: any) => {
    try {
      const jsPDFModule = await import('jspdf');
      const jsPDF = jsPDFModule.jsPDF;
      const doc = new jsPDF();
      
      // En-tête du document
      doc.setFont('helvetica');
      doc.setFontSize(16);
      doc.text('Récapitulatif des notes - Corrections avec barème dynamique', 20, 20);
      
      // Informations de filtrage
      doc.setFontSize(12);
      doc.text(`Date d'export: ${new Date().toLocaleDateString()}`, 20, 30);
      doc.text(`Activité: ${filterActivity === 'all' ? 'Toutes' : uniqueActivities.find((a: Activity) => a.id === filterActivity)?.name}`, 20, 40);
      
      let yPosition = 50;
      
      // Générer le contenu selon l'organisation choisie
      Object.entries(groupedData).forEach(([key, value]: [string, any]) => {
        doc.setFontSize(14);
        doc.text(key, 20, yPosition);
        yPosition += 10;
        
        if (value.corrections) {
          // Tableau pour ce groupe
          const tableData = value.corrections.map((c: any) => {
            const activity = getActivityById(c.activity_id);
            const student = getStudentById(c.student_id);
            return [
              student ? `${student.first_name} ${student.last_name}` : 'N/A',
              activity?.name || `Activité ${c.activity_id}`,
              c.points_earned.join(' / '),
              c.grade ? `${c.grade}/20` : 'Non noté'
            ];
          });
          
          const autoTable = require('jspdf-autotable').default;
          autoTable(doc, {
            head: [['Étudiant', 'Activité', 'Points par partie', 'Note']],
            body: tableData,
            startY: yPosition,
            styles: { fontSize: 10 },
            headStyles: { fillColor: [41, 128, 185] }
          });
          
          yPosition = (doc as any).lastAutoTable.finalY + 10;
        }
        
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
      });
      
      // Sauvegarder le PDF
      const fileName = `Corrections_${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(fileName);
      enqueueSnackbar('PDF généré avec succès', { variant: 'success' });
      
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      throw error;
    }
  };

  // Fonction pour exporter en XLSX
  const exportToXLSX = async (groupedData: any) => {
    try {
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      
      Object.entries(groupedData).forEach(([key, value]: [string, any]) => {
        const worksheet = workbook.addWorksheet(key.substring(0, 31));
        
        worksheet.columns = [
          { header: 'Étudiant', key: 'student', width: 30 },
          { header: 'Activité', key: 'activity', width: 30 },
          { header: 'Points par partie', key: 'points', width: 30 },
          { header: 'Note', key: 'grade', width: 15 }
        ];
        
        if (value.corrections) {
          value.corrections.forEach((c: any) => {
            const activity = getActivityById(c.activity_id);
            const student = getStudentById(c.student_id);
            
            worksheet.addRow({
              student: student ? `${student.first_name} ${student.last_name}` : 'N/A',
              activity: activity?.name || `Activité ${c.activity_id}`,
              points: c.points_earned.join(' / '),
              grade: c.grade ? `${c.grade}/20` : 'Non noté'
            });
          });
        }
      });
      
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Corrections_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      enqueueSnackbar('Fichier Excel généré avec succès', { variant: 'success' });
      
    } catch (error) {
      console.error('Erreur lors de la génération du fichier Excel:', error);
      throw error;
    }
  };

  // Fonction pour exporter en CSV
  const exportToCSV = (groupedData: any) => {
    try {
      Object.entries(groupedData).forEach(([key, value]: [string, any]) => {
        if (value.corrections) {
          let csvContent = 'Étudiant,Activité,Points par partie,Note\n';
          
          value.corrections.forEach((c: any) => {
            const activity = getActivityById(c.activity_id);
            const student = getStudentById(c.student_id);
            
            csvContent += [
              escapeCSV(student ? `${student.first_name} ${student.last_name}` : 'N/A'),
              escapeCSV(activity?.name || `Activité ${c.activity_id}`),
              escapeCSV(c.points_earned.join(' / ')),
              escapeCSV(c.grade ? `${c.grade}/20` : 'Non noté')
            ].join(',') + '\n';
          });
          
          const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Corrections_${key}_${new Date().toISOString().slice(0, 10)}.csv`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      });
      
      enqueueSnackbar('Fichier(s) CSV généré(s) avec succès', { variant: 'success' });
      
    } catch (error) {
      console.error('Erreur lors de la génération du fichier CSV:', error);
      throw error;
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
        <Typography variant="h5" gutterBottom>
          Export des corrections avec barème dynamique
        </Typography>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
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
                        <TableCell>
                          {student ? `${student.first_name} ${student.last_name}` : 'N/A'}
                        </TableCell>
                        <TableCell>{className}</TableCell>
                        <TableCell>{activity?.name}</TableCell>
                        <TableCell>{correction.points_earned.join(' / ')}</TableCell>
                        <TableCell align="center">
                          <Chip
                            label={correction.grade ? `${correction.grade}/20` : 'Non noté'}
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