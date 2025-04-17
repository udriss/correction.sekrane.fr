import React, { useState } from 'react';
import { 
  Typography, 
  Box,
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
  TablePagination, 
  useTheme
} from '@mui/material';
import QrCodeIcon from '@mui/icons-material/QrCode';
import TableChartIcon from '@mui/icons-material/TableChart';
import { Student, CorrectionAutreEnriched, ActivityAutre } from '@/lib/types';
import NotesTabAutre from './NotesTabAutre';
import QRCodeTabAutre from './QRCodeTabAutre';

interface ExportPDFComponentAutreProps {
  classData: any;
  corrections: CorrectionAutreEnriched[];
  activities: ActivityAutre[];
  students: Student[];
  filterActivity: number | 'all';
  setFilterActivity: (value: number | 'all') => void;
  filterSubClass: string | 'all';
  setFilterSubClass: (value: string | 'all') => void;
  uniqueSubClasses: { id: string; name: string }[];
  uniqueActivities: { id: number; name: string }[];
  getActivityById: (activityId: number) => ActivityAutre | undefined;
  getStudentById: (studentId: number | null) => Student | undefined;
  showQRCodes?: boolean;
  getBatchShareCodes?: (correctionIds: (string | number)[]) => Promise<Map<string, string> | Record<string, string>>;
}

// Types pour les options d'export
type ArrangementType = 'student' | 'class' | 'subclass' | 'activity';
type SubArrangementType = 'student' | 'class' | 'subclass' | 'activity' | 'none';

const ExportPDFComponentAutre: React.FC<ExportPDFComponentAutreProps> = ({
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
  getStudentById,
  showQRCodes = true,
  getBatchShareCodes
}) => {
  const theme = useTheme();
  // Nouvel état pour gérer les options d'export
  const [arrangement, setArrangement] = useState<ArrangementType>('student');
  const [subArrangement, setSubArrangement] = useState<SubArrangementType>('activity');
  const [activeTab, setActiveTab] = useState<number>(0);

  // États pour la pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Gestionnaires d'événements pour la pagination
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Filtrer les corrections en fonction des critères sélectionnés
  const filteredCorrections = React.useMemo(() => {
    let result = [...corrections];
    
    // Filtrer par activité
    if (filterActivity !== 'all') {
      result = result.filter(c => c.activity_id === filterActivity);
    }
    
    // Filtrer par sous-classe
    if (filterSubClass !== 'all') {
      result = result.filter(c => {
        const student = getStudentById(c.student_id);
        return student?.sub_class?.toString() === filterSubClass;
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
  }, [arrangement, subArrangement]);

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
            {showQRCodes && <Tab label="QR Codes" icon={<QrCodeIcon />} iconPosition="start" />}
            <Tab label="Notes" icon={<TableChartIcon />} iconPosition="start" />
          </Tabs>
        </Box>
        
        {activeTab === 0 && showQRCodes && (
          <QRCodeTabAutre
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
            getBatchShareCodes={getBatchShareCodes}
          />
        )}
        
        {(activeTab === 1 || (activeTab === 0 && !showQRCodes)) && (
          <NotesTabAutre
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
                  <TableCell align="right">Points</TableCell>
                  <TableCell align="center">Note</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCorrections.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(correction => {
                  const activity = getActivityById(correction.activity_id);
                  const student = getStudentById(correction.student_id);
                  
                  // Vérifier si c'est une correction fictive avec status NON_NOTE
                  const isPlaceholder = (correction.placeholder && correction.status === 'NON_NOTE');
                  
                  // Calculer le total des points gagnés et disponibles
                  const totalPointsEarned = isPlaceholder ? 
                    'N/A' : 
                    (correction.points_earned 
                      ? correction.points_earned.reduce((sum, p) => sum + p, 0) 
                      : 0);
                  
                  const totalPointsAvailable = activity?.points 
                    ? activity.points.reduce((sum, p) => sum + p, 0) 
                    : 0;
                  
                  return (
                    <TableRow key={correction.id}>
                      <TableCell>{student?.first_name} {student?.last_name}</TableCell>
                      <TableCell>{activity?.name}</TableCell>
                      <TableCell align="right">
                        {isPlaceholder ? 
                          'N/A' : 
                          `${totalPointsEarned} / ${totalPointsAvailable}`}
                      </TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={correction.status !== 'ACTIVE' ?
                            <Typography variant="overline" color="text.secondary">
                              {(() => {
                                if (isPlaceholder) return 'N/A';
                                if (!correction.status) return 'Non rendu / ABS';
                                switch (correction.status) {
                                  case 'NON_NOTE': return 'NON NOTÉ';
                                  case 'ABSENT': return 'ABSENT';
                                  case 'NON_RENDU': return 'NON RENDU';
                                  case 'VATED': return 'DÉSACTIVÉ';
                                  default: return 'Non rendu / ABS';
                                }
                              })()}
                            </Typography> 
                            : 
                            (isPlaceholder ? 
                              'N/A' : 
                              `${correction.grade !== null && correction.grade !== undefined ? 
                                (typeof correction.grade === 'string' ? parseFloat(correction.grade).toFixed(1) : correction.grade.toFixed(1)) 
                                : 'NaN'} / 20`)}
                          size="small"
                          variant={correction.status !== 'ACTIVE' ? "outlined" : "filled"}
                          sx={correction.status !== 'ACTIVE' ? { 
                            letterSpacing: '0.5px', 
                            opacity: 0.7,
                            textAlign: 'center',
                            justifyContent: 'center',
                          } : {
                            fontWeight: 700,
                            color: theme.palette.text.primary,
                            backgroundColor:
                              (correction.grade || 0) < 8 ? theme.palette.error.light :
                              (correction.grade || 0) < 10 ? theme.palette.warning.light :
                              (correction.grade || 0) < 12 ? theme.palette.primary.light :
                              (correction.grade || 0) < 16 ? theme.palette.info.light :
                              theme.palette.success.light, 
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
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

export default ExportPDFComponentAutre;