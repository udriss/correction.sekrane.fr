import React from 'react';
import { Paper, Box, Typography, Button, Grid, alpha } from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import BarChartIcon from '@mui/icons-material/BarChart';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import GradientBackground from '@/components/ui/GradientBackground';
import PatternBackground from '@/components/ui/PatternBackground';
import Link from 'next/link';

// Types attendus pour les props
interface ClassHeaderProps {
  classId: string | number;
  classData: any;
  students: any[];
  activities: any[];
  classStats: {
    totalCorrections: number;
    averageGrade: number;
    studentsCovered: number;
    activitiesCovered: number;
  };
  handleEditClassOpen: () => void;
  handleOpenDeleteClassDialog: () => void;
  setBulkEmailDialogOpen: (open: boolean) => void;
  setSelectedStudents: (students: any[]) => void;
  setPasswordManagerOpen: (open: boolean) => void;
}

const ClassHeader: React.FC<ClassHeaderProps> = ({
  classId,
  classData,
  students,
  activities,
  classStats,
  handleEditClassOpen,
  handleOpenDeleteClassDialog,
  setBulkEmailDialogOpen,
  setSelectedStudents,
  setPasswordManagerOpen,
}) => (
  <>
    {/* En-tête avec informations de la classe */}
    <Paper elevation={3} sx={{ borderRadius: 3, overflow: 'hidden', mb: 4 }}>
      <GradientBackground variant="primary">
        <PatternBackground
          pattern="dots"
          opacity={0.05}
          sx={{ p: 4, borderRadius: 0 }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  p: 1.5,
                  borderRadius: '50%',
                  display: 'flex',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                }}
              >
                <SchoolIcon sx={{ fontSize: 50, color: (theme) => theme.palette.text.primary }} />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight={700} color="text.primary">
                  {classData?.name || 'Classe'}
                </Typography>
                <Typography variant="subtitle1" color="text.secondary" sx={{ opacity: 0.9 }}>
                  Année scolaire: {classData?.academic_year || '-'} | {students.length} étudiants
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                color="primary"
                sx={{ alignSelf: 'flex-start', fontWeight: 700 }}
                startIcon={<EditIcon />}
                onClick={handleEditClassOpen}
              >
                Modifier
              </Button>
              <Button
                variant="contained"
                color="error"
                sx={{ alignSelf: 'flex-start', fontWeight: 700 }}
                startIcon={<DeleteIcon />}
                onClick={handleOpenDeleteClassDialog}
              >
                Supprimer
              </Button>
              <Button
                sx={{ alignSelf: 'flex-start', fontWeight: 700 }}
                variant="contained"
                color="secondary"
                startIcon={<PeopleAltIcon />}
                component={Link}
                href={`/classes/${classId}/students`}
              >
                Gérer les étudiants
              </Button>
            </Box>
          </Box>
        </PatternBackground>
      </GradientBackground>
    </Paper>
    {/* Statistiques de la classe */}
    <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BarChartIcon color="primary" />
          Statistiques de la classe
        </Typography>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<EmailIcon />}
          onClick={() => setBulkEmailDialogOpen(true)}
          disabled={students.length === 0}
        >
          Envoyer les corrections
        </Button>
        {students.length > 0 && (
          <Button
            variant="contained"
            color="info"
            startIcon={<LockIcon />}
            onClick={() => {
              setSelectedStudents(students);
              setPasswordManagerOpen(true);
            }}
          >
            Gérer les mots de passe
          </Button>
        )}
      </Box>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ 
            p: 2, 
            textAlign: 'center', 
            height: '100%',
            bgcolor: (theme) => alpha(theme.palette.myBoxes.primary, 0.5),
            backdropFilter: 'blur(5px)',
            borderRadius: 2,
          }}>
            <Typography variant="overline" color="text.secondary">Total</Typography>
            <Typography variant="h3" fontWeight="bold" color="text.primary">
              {classStats.totalCorrections}
            </Typography>
            <Typography variant="overline" color="text.secondary">
              corrections
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ 
            p: 2, 
            textAlign: 'center', 
            height: '100%',
            bgcolor: (theme) => alpha(theme.palette.myBoxes.primary, 0.5),
            backdropFilter: 'blur(5px)',
            borderRadius: 2,
          }}>
            <Typography variant="overline" color="text.secondary">Moyenne</Typography>
            <Typography variant="h3" fontWeight="bold" color="text.primary">
              {classStats.totalCorrections > 0 
                ? classStats.averageGrade.toFixed(1) 
                : '-'}
            </Typography>
            <Typography variant="overline" color="text.secondary">sur 20</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ 
            p: 2, 
            textAlign: 'center', 
            height: '100%',
            bgcolor: (theme) => alpha(theme.palette.myBoxes.primary, 0.5),
            backdropFilter: 'blur(5px)',
            borderRadius: 2,
          }}>
            <Typography variant="overline" color="text.secondary">Étudiants</Typography>
            <Typography variant="h3" fontWeight="bold" color="text.primary">
              {classStats.studentsCovered} / {students.length}
            </Typography>
            <Typography variant="overline" color="text.secondary">
              avec corrections
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ 
            p: 2, 
            textAlign: 'center', 
            height: '100%',
            bgcolor: (theme) => alpha(theme.palette.myBoxes.primary, 0.5),
            backdropFilter: 'blur(5px)',
            borderRadius: 2,
          }}>
            <Typography variant="overline" color="text.secondary">Activités</Typography>
            <Typography variant="h3" fontWeight="bold" color="text.primary">
              {classStats.activitiesCovered} / {activities.length}
            </Typography>
            <Typography variant="overline" color="text.secondary">
              avec corrections
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Paper>
  </>
);

export default ClassHeader;
