import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  FormControlLabel, 
  Checkbox,
  Grid,
  Alert,
  CircularProgress,
  Paper,
  Card,
  CardContent,
  CardMedia,
  CardActionArea
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import QrCodeIcon from '@mui/icons-material/QrCode';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { Student, CorrectionAutreEnriched, ActivityAutre } from '@/lib/types';
import { useSnackbar } from 'notistack';
import { generateQRCodePDF } from '@/utils/qrGeneratorPDFAutre';
import ArrangementOptions from '@/components/pdf/ArrangementOptions';
import { ArrangementType, SubArrangementType, ViewType } from '@/components/pdf/types';
import { allCorrectionsAutreDataProcessingService } from '@/components/pdfAutre/allCorrectionsAutreDataProcessingService';

interface QRCodeTabAutreProps {
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
  getBatchShareCodes?: (correctionIds: (string | number)[]) => Promise<Map<string, string> | Record<string, string>>;
}

const QRCodeTabAutre: React.FC<QRCodeTabAutreProps> = ({
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
  getBatchShareCodes
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [includeDetails, setIncludeDetails] = useState(true);
  const [includeAllStudents, setIncludeAllStudents] = useState(false);
  const [loadingShareCodes, setLoadingShareCodes] = useState(false);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  
  // États pour les options d'arrangement
  const [arrangement, setArrangement] = useState<ArrangementType>('class');
  const [subArrangement, setSubArrangement] = useState<SubArrangementType>('student');
  const [viewType, setViewType] = useState<ViewType>('detailed');
  const [classesMap, setClassesMap] = useState<Map<number | null, any>>(new Map());

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
  useEffect(() => {
    const availableSubArrangements = getAvailableSubArrangements();
    if (!availableSubArrangements.includes(subArrangement)) {
      setSubArrangement(availableSubArrangements[0]);
    }
  }, [arrangement, subArrangement]);

  // Effet pour charger tous les étudiants si nécessaire
  useEffect(() => {
    const loadAllStudents = async () => {
      if (includeAllStudents) {
        setLoadingShareCodes(true);
        try {
          const response = await fetch('/api/students');
          if (!response.ok) {
            throw new Error('Erreur lors du chargement des étudiants');
          }
          const allStudentsData = await response.json();
          setAllStudents(allStudentsData);
        } catch (error) {
          console.error('Erreur lors du chargement des étudiants:', error);
          enqueueSnackbar('Erreur lors du chargement de tous les étudiants', { 
            variant: 'error' 
          });
        } finally {
          setLoadingShareCodes(false);
        }
      }
    };

    loadAllStudents();
  }, [includeAllStudents, enqueueSnackbar]);

  // Générer les codes de partage pour toutes les corrections filtrées et créer le PDF
  const generateShareCodes = async () => {
    try {
      setLoadingShareCodes(true);
      
      // Récupérer d'abord les codes de partage pour les corrections qui n'en ont pas
      const correctionsWithoutQR = filteredCorrections.filter(c => 
        !('shareCode' in c) || !c.shareCode
      );
    
      if (correctionsWithoutQR.length > 0 && getBatchShareCodes) {
        // Créer des codes de partage en lot
        const correctionIds = correctionsWithoutQR.map(c => c.id);
        const shareCodes = await getBatchShareCodes(correctionIds);
        
        // Mettre à jour les corrections avec les codes de partage
        if (shareCodes) {
          for (const correction of filteredCorrections) {
            const idStr = String(correction.id);
            let code: string | undefined;
            if (shareCodes instanceof Map) {
              code = shareCodes.get(idStr);
            } else {
              code = (shareCodes as Record<string, string>)[idStr];
            }
            if (correction.id && code) {
              correction.shareCode = code;
            }
          }
        }
      }

      // Générer le nom du groupe pour le titre du PDF
      const groupName = filterSubClass !== 'all' 
        ? uniqueSubClasses.find(g => g.id.toString() === filterSubClass)?.name 
        : classData.name;
      
      // Générer le nom de l'activité pour le titre du PDF
      const activityName = filterActivity !== 'all'
        ? uniqueActivities.find(a => a.id === filterActivity)?.name
        : 'Toutes les activités';
      
      // Si l'option "Inclure tous les étudiants" est activée, créer des corrections placeholders
      let correctionsList: CorrectionAutreEnriched[] = [...filteredCorrections];
      
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
          : uniqueActivities.filter(a => a.id === filterActivity);
        
        const placeholderCorrections: CorrectionAutreEnriched[] = [];
        
        allStudents.forEach(student => {
          // Vérifier si l'étudiant appartient à la classe actuelle ou à un groupe filtré
          let belongsToCurrentClassOrGroup = false;
          let studentClassId = null;
          let studentSubClass = null;
          let studentClassName = '';
          
          // Si l'étudiant a des classes associées
          if (student.allClasses && Array.isArray(student.allClasses) && student.allClasses.length > 0) {
            // Parcourir toutes les classes de l'étudiant
            for (const classInfo of student.allClasses) {
              // Vérifier si la classe correspond à la classe actuelle
              if (classData && classInfo.classId === classData.id) {
                belongsToCurrentClassOrGroup = true;
                studentClassId = classInfo.classId;
                studentClassName = classInfo.className || classData.name;
                studentSubClass = classInfo.sub_class || null;
                
                // Si un filtre de groupe est actif, vérifier également le groupe
                if (filterSubClass !== 'all') {
                  if (classInfo.sub_class === filterSubClass) {
                    // L'étudiant appartient au groupe filtré
                    break;
                  } else {
                    // L'étudiant appartient à la classe mais pas au groupe filtré
                    belongsToCurrentClassOrGroup = false;
                  }
                }
                
                // Si on ne filtre pas par groupe, une correspondance de classe suffit
                if (filterSubClass === 'all') {
                  break;
                }
              }
            }
          } else {
            // Fallback pour les anciens formats de données d'étudiants
            if (student.classId === classData.id) {
              belongsToCurrentClassOrGroup = true;
              studentClassId = student.classId;
              studentClassName = classData.name;
              studentSubClass = student.sub_class || null;
              
              // Vérifier le filtre de groupe si actif
              if (filterSubClass !== 'all' && student.sub_class !== filterSubClass) {
                belongsToCurrentClassOrGroup = false;
              }
            }
          }
          
          // Si l'étudiant n'appartient pas à la classe/groupe filtré, ignorer
          if (!belongsToCurrentClassOrGroup) {
            return;
          }
          
          activitiesToProcess.forEach((activity: any) => {
            const key = `${student.id}-${activity.id}`;
            
            // Vérifier si l'étudiant a déjà une correction pour cette activité
            if (!correctionsMap.has(key)) {
              // Créer une correction "placeholder" qui respecte l'interface CorrectionAutreEnriched
              placeholderCorrections.push({
                id: -1 * (placeholderCorrections.length + 1) as unknown as number, // ID négatif unique pour éviter les conflits
                student_id: student.id,
                activity_id: activity.id,
                class_id: studentClassId ?? null,
                sub_class: studentSubClass,
                grade: null,
                points_earned: [], // Tableau vide pour respecter l'interface
                group_id: null, // Champ requis par l'interface
                status: 'NON_NOTE',
                placeholder: true,
                noQRCode: true,
                active: 1, // Forcer le statut actif
                student_name: `${student.first_name} ${student.last_name}`,
                activity_name: activity.name || `Activité ${activity.id}`,
                class_name: studentClassName
              });
            }
          });
        });
        
        // Ajouter les corrections placeholder à la liste principale
        correctionsList = [...filteredCorrections, ...placeholderCorrections];
      }
      
      // Organiser les données selon l'arrangement et le sous-arrangement sélectionnés
      const studentsToUse = includeAllStudents && allStudents.length > 0
        ? allStudents
        : students;
        
      // Utiliser le service de traitement des données pour organiser les corrections
      const groupedData = allCorrectionsAutreDataProcessingService.organizeAllCorrectionsData({
        corrections: correctionsList,
        includeAllStudents,
        filterActivity,
        arrangement,
        subArrangement,
        uniqueActivities,
        students: studentsToUse,
        getActivityById: (activityId) => {
          return activities.find(a => a.id === activityId);
        },
        getStudentById: (studentId) => {
          if (studentId === null) return undefined;
          
          if (includeAllStudents && allStudents.length > 0) {
            const student = allStudents.find(s => s.id === studentId);
            if (student) return student;
          }
          
          return students.find(s => s.id === studentId);
        },
        classesMap
      });
      
      // Générer le PDF avec les paramètres d'organisation
      await generateQRCodePDF({
        corrections: correctionsList,
        group: {
          name: groupName || 'Classe indeterminée',
          activity_name: activityName || 'Activité indeterminée'
        },
        students: studentsToUse,
        activities,
        includeDetails,
        // Utiliser les options d'arrangement sélectionnées
        arrangement,
        subArrangement,
        // Passer les données organisées et indiquer qu'elles sont déjà organisées
        groupedData,
        skipGrouping: true, // Indiquer de ne pas réorganiser les données
      });
      
      // Afficher message de succès
      enqueueSnackbar('PDF des QR codes généré avec succès', { variant: 'success' });
      
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      enqueueSnackbar('Erreur lors de la génération du PDF', { variant: 'error' });
    } finally {
      setLoadingShareCodes(false);
    }
  };

  // Déterminer si le bouton doit être désactivé
  const isButtonDisabled = filteredCorrections.length === 0 || loadingShareCodes || !getBatchShareCodes;

  return (
    <Box>
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          Filtres et options
        </Typography>
        
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="filter-activity-label">Activité</InputLabel>
              <Select
                labelId="filter-activity-label"
                value={filterActivity}
                label="Activité"
                onChange={(e) => setFilterActivity(e.target.value as number | 'all')}
              >
                <MenuItem value="all">Toutes les activités</MenuItem>
                {uniqueActivities.map((activity) => (
                  <MenuItem key={activity.id} value={activity.id}>
                    {activity.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          {uniqueSubClasses.length > 0 && (
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="filter-subclass-label">Groupe</InputLabel>
                <Select
                  labelId="filter-subclass-label"
                  value={filterSubClass}
                  label="Groupe"
                  onChange={(e) => setFilterSubClass(e.target.value as string)}
                >
                  <MenuItem value="all">Tous les groupes</MenuItem>
                  {uniqueSubClasses.map((subclass) => (
                    <MenuItem key={subclass.id} value={subclass.id}>
                      {subclass.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}
        </Grid>
        
        <Box sx={{ mb: 1 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={includeDetails}
                onChange={(e) => setIncludeDetails(e.target.checked)}
              />
            }
            label="Inclure les détails (nom de l'élève, activité)"
          />
        </Box>
        
        <Box>
          <FormControlLabel
            control={
              <Checkbox
                checked={includeAllStudents}
                onChange={(e) => setIncludeAllStudents(e.target.checked)}
              />
            }
            label="Inclure tous les étudiants (même ceux sans correction)"
          />
        </Box>
      </Paper>
      
      {/* Ajout des options d'organisation */}
      <ArrangementOptions
        arrangement={arrangement}
        setArrangement={setArrangement}
        subArrangement={subArrangement}
        setSubArrangement={setSubArrangement}
        viewType={viewType}
        setViewType={setViewType}
        availableSubArrangements={getAvailableSubArrangements()}
      />
      
      <Paper variant="outlined" sx={{ p: 2, mb: 3, mt: 3 }}>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          Format d'export QR Code
        </Typography>
        
        <Card 
          variant="outlined" 
          sx={{ 
            mb: 2, 
            border: '2px solid #3f51b5',
            borderRadius: 2,
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
          }}
        >
          <CardActionArea onClick={isButtonDisabled ? undefined : generateShareCodes}>
            <Box sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
              <CardMedia
                sx={{ 
                  width: 80, 
                  height: 80, 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  backgroundColor: '#f0f4ff',
                  borderRadius: 2,
                  mr: 2
                }}
              >
                <QrCodeIcon sx={{ fontSize: 50, color: '#3f51b5' }} />
              </CardMedia>
              <CardContent sx={{ flex: '1 0 auto', p: 1 }}>
                <Typography component="div" variant="h6">
                  PDF avec QR Codes
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Document contenant les QR codes pour accéder aux corrections
                </Typography>
              </CardContent>
              <PictureAsPdfIcon sx={{ fontSize: 40, color: '#f44336', mr: 2 }} />
            </Box>
          </CardActionArea>
        </Card>
        
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Button
            variant="contained"
            startIcon={loadingShareCodes ? <CircularProgress size={20} /> : <QrCodeIcon />}
            onClick={generateShareCodes}
            disabled={isButtonDisabled}
            size="large"
            color="primary"
            sx={{ 
              px: 4,
              backgroundColor: '#3f51b5',
              '&:hover': {
                backgroundColor: '#303f9f',
              },
            }}
          >
            Générer PDF avec QR Codes
          </Button>
        </Box>
        <Typography variant="caption" align="center" color="text.secondary" display="block" sx={{ mt: 1 }}>
          PDF permettant l'accès rapide aux corrections par QR code
        </Typography>
      </Paper>
      
      {filteredCorrections.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          Aucune correction à exporter avec les filtres actuels
        </Alert>
      ) : (
        <Box sx={{ mt: 3 }}>
          <Typography variant="body2" color="text.secondary">
            {filteredCorrections.length} correction(s) prête(s) à être exportée(s)
            {includeAllStudents && allStudents.length > 0 && (
              <>, comprenant les étudiants sans correction</>
            )}
          </Typography>
          {!getBatchShareCodes && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              La fonctionnalité de génération de QR codes n'est pas disponible
            </Alert>
          )}
        </Box>
      )}
    </Box>
  );
};

export default QRCodeTabAutre;