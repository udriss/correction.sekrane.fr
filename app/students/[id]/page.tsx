'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Container,
  Typography,
  Paper,
  Box,
  Chip,
  Button,
  Card,
  CardContent,
  Avatar,
  Tab,
  Tabs,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Badge,
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  useTheme
} from '@mui/material';
import Grid from '@mui/material/Grid';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import AssignmentIcon from '@mui/icons-material/Assignment';
import EmailIcon from '@mui/icons-material/Email';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import GradeIcon from '@mui/icons-material/Grade';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import MaleIcon from '@mui/icons-material/Male';
import FemaleIcon from '@mui/icons-material/Female';
import NeutralIcon from '@mui/icons-material/RemoveCircleOutline';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import EventIcon from '@mui/icons-material/Event';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import GradientBackground from '@/components/ui/GradientBackground';
import H1Title from '@/components/ui/H1Title';
import LoadingSpinner from '@/components/LoadingSpinner';
import StudentEditDialog from '@/components/students/StudentEditDialog';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Cell
} from 'recharts';
import StudentEditDialogForDetail from '@/components/students/StudentEditDialogForDetail';

dayjs.locale('fr');

// Interface pour un étudiant selon la table students 
interface Student {
  id: number;
  email: string | null;
  first_name: string;
  last_name: string;
  gender: 'M' | 'F' | 'N';
  created_at: string;
  updated_at: string;
  phone?: string;
  code?: string;
  classId?: number;
  group?: string;
}

// Interface pour une correction selon la table corrections
interface Correction {
  id: number;
  activity_id: number;
  content: string | null;
  content_data: any | null;
  created_at: string;
  updated_at: string;
  grade: number | null;
  penalty: number | null;
  deadline: string | null;
  submission_date: string | null;
  experimental_points_earned: number | null;
  theoretical_points_earned: number | null;
  group_id: number | null;
  class_id: number | null;
  student_id: number | null;
  activity_name?: string;
  class_name?: string;
  experimental_points?: number;
  theoretical_points?: number;
}

// Interface pour une classe selon la structure existante
interface Class {
  id: number;
  name: string;
  description: string | null;
  academic_year: string;
  created_at: string;
  updated_at: string;
  nbre_subclasses: number | null;
  student_count?: number;
  sub_class?: number | null;
  year?: string;
}

// Interface pour les statistiques d'un étudiant
interface StudentStats {
  averageGrade: number;
  totalCorrections: number;
  bestGrade: number;
  worstGrade: number;
  latestSubmission: string;
  totalActivities: number;
  classesCount: number;
}

export default function StudentDetailPage() {
  const params = useParams();
  const studentId = params?.id as string;
  const theme = useTheme();

  const [student, setStudent] = useState<Student | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActivity, setFilterActivity] = useState('');
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [selectedClasses, setSelectedClasses] = useState<{ id: number, name: string }[]>([]);
  const [availableSubgroups, setAvailableSubgroups] = useState<string[]>([]);
  const [loadingSubgroups, setLoadingSubgroups] = useState(false);

  const CHART_COLORS = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.info.main,
    theme.palette.error.main
  ];
  
  useEffect(() => {
    if (!studentId) return;

    const fetchStudentData = async () => {
      try {
        setLoading(true);
        const studentResponse = await fetch(`/api/students/${studentId}`);
        if (!studentResponse.ok) {
          throw new Error("Erreur lors du chargement des informations de l'étudiant");
        }
        const studentData = await studentResponse.json();
        setStudent(studentData);
        setEditingStudent(studentData);

        const classesResponse = await fetch(`/api/students/${studentId}/classes`);
        if (classesResponse.ok) {
          const classesData = await classesResponse.json();
          
          // Adapter le traitement en fonction de la structure réelle des données
          // Vérifions d'abord la structure pour décider comment traiter les données
          console.log('Classes data structure:', classesData);
          
          let formattedClasses;
          
          // Si classesData est un tableau d'objets avec une propriété 'class'
          if (Array.isArray(classesData) && classesData.length > 0 && classesData[0].class) {
            formattedClasses = classesData.map((c: any) => ({
              ...c.class,
              sub_class: c.sub_class,
              year: c.class.academic_year
            }));
            
            setSelectedClasses(classesData.map((c: any) => ({
              id: c.class.id,
              name: c.class.name
            })));
          } 
          // Si classesData est un tableau d'objets plats
          else if (Array.isArray(classesData)) {
            formattedClasses = classesData.map((c: any) => ({
              ...c,
              sub_class: c.sub_class || c.subclass,
              year: c.academic_year
            }));
            
            setSelectedClasses(classesData.map((c: any) => ({
              id: c.id,
              name: c.name
            })));
          }
          
          setClasses(formattedClasses || []);
          
          if (studentData.classId) {
            fetchClassSubgroups(studentData.classId);
          }
        }

        const correctionsResponse = await fetch(`/api/students/${studentId}/corrections`);
        if (correctionsResponse.ok) {
          const correctionsData = await correctionsResponse.json();
          setCorrections(correctionsData);

          const grades = correctionsData
            .filter((c: Correction) => c.grade !== null)
            .map((c: Correction) => c.grade || 0);
            
          const averageGrade = grades.length > 0 
            ? grades.reduce((sum: number, grade: number) => sum + grade, 0) / grades.length 
            : 0;
          
          setStats({
            averageGrade: parseFloat(averageGrade.toFixed(2)),
            totalCorrections: correctionsData.length,
            bestGrade: grades.length > 0 ? Math.max(...grades) : 0,
            worstGrade: grades.length > 0 ? Math.min(...grades) : 0,
            latestSubmission: correctionsData.length > 0 && correctionsData[0].submission_date
              ? dayjs(correctionsData[0].submission_date).format('DD/MM/YYYY') 
              : 'Aucune',
            totalActivities: new Set(correctionsData.map((c: Correction) => c.activity_id)).size,
            classesCount: new Set(correctionsData.filter((c: Correction) => c.class_id !== null).map((c: Correction) => c.class_id)).size
          });
        }
      } catch (err) {
        console.error("Erreur:", err);
        setError(err instanceof Error ? err.message : "Une erreur est survenue");
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [studentId]);

  const fetchClassSubgroups = async (classId: number) => {
    setLoadingSubgroups(true);
    try {
      const response = await fetch(`/api/classes/${classId}/subgroups`);
      if (response.ok) {
        const data = await response.json();
        setAvailableSubgroups(data.subgroups || []);
      } else {
        setAvailableSubgroups([]);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des sous-groupes:", error);
      setAvailableSubgroups([]);
    } finally {
      setLoadingSubgroups(false);
    }
  };

  const handleOpenEditDialog = () => {
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    if (student) {
      setEditingStudent({ ...student });
    }
  };

  const handleSaveStudent = async () => {
    if (!editingStudent) return;
    
    try {
      const studentData = {
        ...editingStudent,
        classes: selectedClasses.map(cls => ({
          id: cls.id,
          group: cls.id === editingStudent.classId ? editingStudent.group : undefined
        }))
      };
      
      const response = await fetch(`/api/students/${studentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(studentData),
      });
      
      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour de l'étudiant");
      }
      
      setStudent(editingStudent);
      
      const updatedClasses = await fetch(`/api/students/${studentId}/classes`).then(res => res.json());
      setClasses(updatedClasses.map((c: any) => ({
        ...c.class,
        sub_class: c.sub_class
      })));
      
      setEditDialogOpen(false);
      
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
    }
  };

  const handleStudentChange = (updatedStudent: Student | null) => {
    setEditingStudent(updatedStudent);
  };

  const handleSelectedClassesChange = (classes: { id: number, name: string }[]) => {
    setSelectedClasses(classes);
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getFilteredCorrections = () => {
    let filtered = [...corrections];
    
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(c => 
        (c.activity_name?.toLowerCase().includes(search) || false) ||
        (c.class_name?.toLowerCase().includes(search) || false)
      );
    }
    
    if (filterActivity) {
      filtered = filtered.filter(c => c.activity_id === parseInt(filterActivity));
    }
    
    return filtered;
  };

  const getUniqueActivities = () => {
    const activityMap = new Map();
    
    corrections.forEach(c => {
      if (c.activity_id && c.activity_name) {
        activityMap.set(c.activity_id, {
          id: c.activity_id,
          name: c.activity_name
        });
      }
    });
    
    return Array.from(activityMap.values());
  };

  const getGradeEvolutionData = () => {
    return corrections
      .filter(c => c.submission_date && c.grade !== null)
      .slice()
      .sort((a, b) => {
        const dateA = a.submission_date ? new Date(a.submission_date).getTime() : 0;
        const dateB = b.submission_date ? new Date(b.submission_date).getTime() : 0;
        return dateA - dateB;
      })
      .map(c => ({
        id: c.id,
        date: c.submission_date ? dayjs(c.submission_date).format('DD/MM/YY') : 'Sans date',
        note: c.grade || 0,
        activity: c.activity_name || 'Activité inconnue'
      }));
  };

  const getGradeDistributionData = () => {
    const ranges = [
      { name: '0-5', count: 0 },
      { name: '5-10', count: 0 },
      { name: '10-12', count: 0 },
      { name: '12-14', count: 0 },
      { name: '14-16', count: 0 },
      { name: '16-20', count: 0 },
    ];

    corrections
      .filter(c => c.grade !== null)
      .forEach(c => {
        const grade = c.grade || 0;
        if (grade < 5) ranges[0].count++;
        else if (grade < 10) ranges[1].count++;
        else if (grade < 12) ranges[2].count++;
        else if (grade < 14) ranges[3].count++;
        else if (grade < 16) ranges[4].count++;
        else ranges[5].count++;
      });

    return ranges;
  };

  const getActivityDistributionData = () => {
    const activityMap = new Map();
    
    corrections
      .filter(c => c.grade !== null && c.activity_id)
      .forEach(c => {
        const activityName = c.activity_name || `Activité ${c.activity_id}`;
        if (!activityMap.has(activityName)) {
          activityMap.set(activityName, {
            id: c.activity_id,
            name: activityName,
            count: 0,
            totalGrade: 0
          });
        }
        
        const activityData = activityMap.get(activityName);
        activityData.count++;
        activityData.totalGrade += c.grade || 0;
      });
    
    return Array.from(activityMap.values()).map(activity => ({
      ...activity,
      averageGrade: activity.count > 0 ? (activity.totalGrade / activity.count).toFixed(1) : 0
    }));
  };

  const getGradeColor = (grade: number) => {
    if (grade >= 16) return 'success';
    if (grade >= 12) return 'info';
    if (grade >= 10) return 'primary';
    if (grade >= 8) return 'warning';
    return 'error';
  };

  const getGenderIcon = (gender: string | undefined) => {
    switch(gender) {
      case 'M': return <MaleIcon color="info" />;
      case 'F': return <FemaleIcon color="secondary" />;
      default: return <NeutralIcon />;
    }
  };

  const getGenderText = (gender: string | undefined) => {
    switch(gender) {
      case 'M': return 'Masculin';
      case 'F': return 'Féminin';
      default: return 'Non spécifié';
    }
  };

  if (loading) {
    return (
      <Container sx={{ py: 4, minHeight: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <LoadingSpinner size="lg" text="Chargement des données de l'étudiant" />
      </Container>
    );
  }

  if (error || !student) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3,
            border: 1,
            borderColor: 'error.main',
            '& .MuiAlert-icon': {
              color: 'error.main'
            }
          }}
        >
          {error || "Étudiant non trouvé"}
        </Alert>
        <Button 
          variant="outlined" 
          startIcon={<ArrowBackIcon />} 
          component={Link} 
          href="/students"
          color="primary"
        >
          Retour à la liste des étudiants
        </Button>
      </Container>
    );
  }

  const filteredCorrections = getFilteredCorrections();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          borderRadius: 3, 
          overflow: 'hidden',
          mb: 4,
          transform: 'translateY(0)',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          '&:hover': {
            transform: 'translateY(-5px)',
            boxShadow: (theme) => `0 15px 50px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.15)'}`,
          }
        }}
      >
        <GradientBackground variant="primary"  sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { xs: 'center', md: 'flex-start' }, gap: 3 }}>
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              badgeContent={getGenderIcon(student.gender)}
            >
              <Avatar 
                sx={{ 
                  width: 100, 
                  height: 100, 
                  bgcolor: 'secondary.main',
                  border: '4px solid rgba(255,255,255,0.2)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                  fontSize: '2.5rem'
                }}
              >
                {student.first_name.charAt(0).toUpperCase()}{student.last_name.charAt(0).toUpperCase()}
              </Avatar>
            </Badge>
            
            <Box sx={{ flex: 1, textAlign: { xs: 'center', md: 'left' } }}>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { xs: 'center', md: 'flex-start' }, justifyContent: 'space-between' }}>
                <Box>
                  <H1Title>
                    {student.first_name} {student.last_name}
                  </H1Title>
                  
                  {student.code && (
                    <Typography variant="subtitle1" sx={{ opacity: 0.9, mb: 2 }}>
                      #{student.code}
                    </Typography>
                  )}
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: { xs: 'center', md: 'flex-start' } }}>
                    {classes.map(c => (
                      <Chip
                        key={c.id}
                        icon={<SchoolIcon />}
                        label={c.sub_class ? `${c.name} (Groupe ${c.sub_class})` : c.name}
                        component={Link}
                        href={`/classes/${c.id}`}
                        clickable
                        sx={{ 
                          bgcolor: 'rgba(255,255,255,0.15)', 
                          color: 'white',
                          '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' }
                        }}
                      />
                    ))}
                  </Box>
                </Box>
                
                <Box sx={{ mt: { xs: 2, md: 0 } }}>
                  <Button
                    variant="contained"
                    startIcon={<EditIcon />}
                    onClick={handleOpenEditDialog}
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.15)',
                      color: 'white',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' }
                    }}
                  >
                    Modifier
                  </Button>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mt: 2, justifyContent: { xs: 'center', md: 'flex-start' } }}>
                {student.email && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmailIcon fontSize="small" />
                    <Typography variant="body2">{student.email}</Typography>
                  </Box>
                )}
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarTodayIcon fontSize="small" />
                  <Typography variant="body2">
                    Inscrit le {dayjs(student.created_at).format('DD/MM/YYYY')}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonIcon fontSize="small" />
                  <Typography variant="body2">
                    {getGenderText(student.gender)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </GradientBackground>
        
        {stats && (
          <Box sx={{ bgcolor: 'background.paper', p: 3 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 6, md: 2, sm:4 }} key="average-stat">
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="overline" color="text.secondary">Moyenne</Typography>
                  <Typography 
                    variant="h4" 
                    color={`${getGradeColor(stats.averageGrade)}.main`} 
                    fontWeight="bold"
                  >
                    {stats.averageGrade} / 20
                  </Typography>
                </Box>
              </Grid>
              
              <Grid size={{ xs: 6, md: 2, sm:4 }} key="best-grade-stat">
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="overline" color="text.secondary">Meilleure note</Typography>
                  <Typography 
                    variant="h4" 
                    color={`${getGradeColor(stats.bestGrade)}.main`} 
                    fontWeight="bold"
                  >
                    {stats.bestGrade}/20
                  </Typography>
                </Box>
              </Grid>
              
              <Grid size={{ xs: 6, md: 2, sm:4 }} key="worst-grade-stat">
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="overline" color="text.secondary">Pire note</Typography>
                  <Typography 
                    variant="h4" 
                    color={`${getGradeColor(stats.worstGrade)}.main`} 
                    fontWeight="bold"
                  >
                    {stats.worstGrade}/20
                  </Typography>
                </Box>
              </Grid>
              
              <Grid size={{ xs: 6, md: 2, sm:4 }} key="corrections-count-stat">
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="overline" color="text.secondary">Corrections</Typography>
                  <Typography variant="h4" color="primary.main" fontWeight="bold">
                    {stats.totalCorrections}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid size={{ xs: 6, md: 2, sm:4 }} key="activities-count-stat">
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="overline" color="text.secondary">Activités</Typography>
                  <Typography variant="h4" color="primary.main" fontWeight="bold">
                    {stats.totalActivities}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid size={{ xs: 6, md: 2, sm:4 }} key="latest-submission-stat">
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="overline" color="text.secondary">Dernière</Typography>
                  <Typography variant="h6" color="text.primary" fontWeight="bold">
                    {stats.latestSubmission}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>
      
      <Box sx={{ mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '1rem',
            }
          }}
        >
          <Tab icon={<AssignmentIcon />} label="Corrections" />
          <Tab icon={<GradeIcon />} label="Statistiques" />
          <Tab icon={<TrendingUpIcon />} label="Évolution" />
          <Tab icon={<SchoolIcon />} label="Classes" />
        </Tabs>
      </Box>
      
      {tabValue === 0 && (
        <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              Corrections de {student.first_name}
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                placeholder="Rechercher..."
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
                }}
                variant="outlined"
                sx={{ width: 200 }}
              />
              
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel id="filter-activity-label">Filtrer par activité</InputLabel>
                <Select
                  labelId="filter-activity-label"
                  value={filterActivity}
                  onChange={(e) => setFilterActivity(e.target.value)}
                  label="Filtrer par activité"
                >
                  <MenuItem value="">Toutes les activités</MenuItem>
                  {getUniqueActivities().map(activity => (
                    <MenuItem key={activity.id} value={activity.id.toString()}>
                      {activity.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>
          
          {corrections.length === 0 ? (
            <Alert 
              severity="info" 
              sx={{ 
                border: 1,
                borderColor: 'info.main',
                '& .MuiAlert-icon': {
                  color: 'info.main'
                }
              }}
            >
              Aucune correction trouvée pour cet étudiant.
            </Alert>
          ) : filteredCorrections.length === 0 ? (
            <Alert 
              severity="warning"
              sx={{ 
                border: 1,
                borderColor: 'warning.main',
                '& .MuiAlert-icon': {
                  color: 'warning.main'
                }
              }}
            >
              Aucune correction ne correspond aux filtres appliqués.
            </Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Activité</TableCell>
                    <TableCell>Classe</TableCell>
                    <TableCell>Date de rendu</TableCell>
                    <TableCell>Note</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredCorrections.map((correction) => (
                    <TableRow key={correction.id} hover>
                      <TableCell>{correction.activity_name}</TableCell>
                      <TableCell>{correction.class_name}</TableCell>
                      <TableCell>
                        {correction.submission_date 
                          ? dayjs(correction.submission_date).format('DD/MM/YYYY')
                          : 'Non soumis'}
                      </TableCell>
                      <TableCell>
                        {correction.grade !== null ? (
                          <Chip 
                            label={`${correction.grade}/20`}
                            color={getGradeColor(correction.grade)}
                            size="small"
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Non notée
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="contained"
                          component={Link}
                          href={`/corrections/${correction.id}`}
                          color="primary"
                          sx={{ boxShadow: 'none' }}
                        >
                          Détails
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}
      
      {tabValue === 1 && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 6, md: 2, sm:4 }}>
            <Paper elevation={2} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Distribution des notes
              </Typography>
              
              {getGradeDistributionData().some(range => range.count > 0) ? (
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={getGradeDistributionData()}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip />
                      <Bar dataKey="count" fill={theme.palette.primary.main}>
                        {getGradeDistributionData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              ) : (
                <Alert 
                  severity="info" 
                  sx={{ 
                    mt: 3,
                    border: 1,
                    borderColor: 'info.main',
                    '& .MuiAlert-icon': {
                      color: 'info.main'
                    }
                  }}
                >
                  Aucune note disponible pour générer une distribution.
                </Alert>
              )}
            </Paper>
          </Grid>
          
          <Grid size={{ xs: 12 }}>
            <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>
                Détails par activité
              </Typography>
              
              {getActivityDistributionData().length > 0 ? (
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1 }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Activité</TableCell>
                        <TableCell align="center">Nombre de corrections</TableCell>
                        <TableCell align="center">Note moyenne</TableCell>
                        <TableCell>Écart par rapport à la moyenne</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {getActivityDistributionData().map((activity) => (
                        <TableRow key={`activity-${activity.id}`} hover>
                          <TableCell>{activity.name}</TableCell>
                          <TableCell align="center">{activity.count}</TableCell>
                          <TableCell align="center">
                            <Chip 
                              label={`${activity.averageGrade}/20`}
                              color={getGradeColor(parseFloat(activity.averageGrade))}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {stats && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {parseFloat(activity.averageGrade) > stats.averageGrade ? (
                                  <TrendingUpIcon color="success" />
                                ) : parseFloat(activity.averageGrade) < stats.averageGrade ? (
                                  <TrendingDownIcon color="error" />
                                ) : (
                                  <span>⟺</span>
                                )}
                                <Typography variant="body2">
                                  {(parseFloat(activity.averageGrade) - stats.averageGrade).toFixed(1)} pts
                                </Typography>
                              </Box>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info">
                  Aucune activité disponible pour afficher les détails.
                </Alert>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}
      
      {tabValue === 2 && (
        <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Évolution des notes
          </Typography>
          
          {getGradeEvolutionData().length < 2 ? (
            <Alert severity="info">
              Il faut au moins deux corrections avec notes pour afficher l'évolution.
            </Alert>
          ) : (
            <Box sx={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={getGradeEvolutionData()}
                  margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" angle={-45} textAnchor="end" />
                  <YAxis domain={[0, 20]} />
                  <RechartsTooltip 
                    formatter={(value, name) => [
                      `${value}/20`,
                      'Note'
                    ]}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="note" 
                    stroke={theme.palette.primary.main} 
                    strokeWidth={2}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          )}
          
          {getGradeEvolutionData().length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Détail des activités
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {getGradeEvolutionData().map((item) => (
                  <Chip
                    key={`${item.id}`}
                    label={`${item.date}: ${item.activity}`}
                    size="small"
                    variant="outlined"
                    color="primary"
                  />
                ))}
              </Box>
            </Box>
          )}
        </Paper>
      )}
      
      {tabValue === 3 && (
        <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              Classes de {student.first_name}
            </Typography>
            
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              component={Link}
              href={`/students/${student.id}/add-class`}
              sx={{ boxShadow: 'none' }}
            >
              Ajouter à une classe
            </Button>
          </Box>
          
          {classes.length === 0 ? (
            <Alert severity="info">
              Cet étudiant n'est inscrit dans aucune classe.
            </Alert>
          ) : (
            <Grid container spacing={3}>
              {classes.map((cls) => (
                <Grid size={{ xs: 12, md: 4, sm:6 }} key={cls.id}>
                  <Card 
                    elevation={2} 
                    sx={{ 
                      height: '100%',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 6
                      }
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <SchoolIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="h6">{cls.name}</Typography>
                          {cls.sub_class && (
                            <Chip 
                              size="small" 
                              label={`Groupe ${cls.sub_class}`} 
                              color="primary"
                              sx={{ mt: 0.5 }}
                            />
                          )}
                        </Box>
                      </Box>
                      
                      {cls.academic_year && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                          <EventIcon fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            Année: {cls.academic_year}
                          </Typography>
                        </Box>
                      )}
                      
                      <Button
                        variant="contained"
                        fullWidth
                        component={Link}
                        href={`/classes/${cls.id}`}
                        sx={{ mt: 1 }}
                        color="primary"
                      >
                        Voir la classe
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Paper>
      )}
      
      <StudentEditDialogForDetail
        open={editDialogOpen}
        student={editingStudent}
        classes={classes}
        selectedClasses={selectedClasses}
        availableSubgroups={availableSubgroups}
        loadingSubgroups={loadingSubgroups}
        onClose={handleCloseEditDialog}
        onSave={handleSaveStudent}
        onStudentChange={handleStudentChange}
        onSelectedClassesChange={handleSelectedClassesChange}
        fetchClassSubgroups={fetchClassSubgroups}
      />
    </Container>
  );
}
