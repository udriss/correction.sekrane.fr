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
import NotesTab from './NotesTab';
import QRCodeTab from './QRCodeTab';

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
          <QRCodeTab
            classData={classData}
            filteredCorrections={filteredCorrections}
            filterActivity={filterActivity}
            setFilterActivity={setFilterActivity}
            filterSubClass={filterSubClass}
            setFilterSubClass={setFilterSubClass}
            uniqueSubClasses={uniqueSubClasses}
            uniqueActivities={uniqueActivities}
            students={students}
            activities={activities}
          />
        )}
        
        {activeTab === 1 && (
          <NotesTab
            classData={classData}
            filteredCorrections={filteredCorrections}
            filterActivity={filterActivity}
            setFilterActivity={setFilterActivity}
            filterSubClass={filterSubClass}
            setFilterSubClass={setFilterSubClass}
            uniqueSubClasses={uniqueSubClasses}
            uniqueActivities={uniqueActivities}
            students={students}
            activities={activities}
            getActivityById={getActivityById}
            getStudentById={getStudentById}
          />
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