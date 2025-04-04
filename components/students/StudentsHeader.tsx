import React from 'react';
import Link from 'next/link';
import {
  Paper,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Box,
  Chip,
  Grid,
  Badge
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import SchoolIcon from '@mui/icons-material/School';
import AssignmentIcon from '@mui/icons-material/Assignment';
import GradientBackground from '@/components/ui/GradientBackground';
import PatternBackground from '@/components/ui/PatternBackground';
import H1Title from '@/components/ui/H1Title';

interface StudentsHeaderProps {
  totalStudents: number;
  uniqueClasses: number;
  totalWithCorrections: number;
  onShowTutorial: () => void;
}

const StudentsHeader: React.FC<StudentsHeaderProps> = ({
  totalStudents,
  uniqueClasses,
  totalWithCorrections,
  onShowTutorial
}) => {
  return (
    <Paper 
      elevation={3} 
      className="mb-8 rounded-xl overflow-hidden transform hover:scale-[1.01] transition-transform"
      sx={{
        position: 'relative',
        overflow: 'hidden',
        boxShadow: (theme) => theme.palette.mode === 'dark' 
          ? '0 8px 32px rgba(0,0,0,0.4)' 
          : '0 8px 32px rgba(0,0,0,0.1)'
      }}
    >
      <GradientBackground variant="primary" sx={{ position: 'relative' }}>
        <PatternBackground 
          pattern="cross" 
          opacity={0.25} 
          color="ffffff"
          size={120}
          sx={{ p: 4, borderRadius: 2 }}
        >
          <Box sx={{ position: 'relative' }}>
            {/* Header content with improved layout */}
            <Box 
              sx={{
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between', 
                alignItems: { xs: 'flex-start', sm: 'center' },
                mb: 4
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: { xs: 3, sm: 0 } }}>
              <Box 
                sx={{ 
                  background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  p: 1.5, 
                  borderRadius: '50%',
                  display: 'flex',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                }}
              >
                <PersonIcon sx={{ fontSize: 50, color: (theme) => theme.palette.text.primary }} />
              </Box>
                
                <Box>
                  <Typography color='text.primary' fontWeight={'700'} variant="h4" component="h1" className="font-bold mb-1">
                    Gestion des étudiants
                  </Typography>
                  <Typography variant="subtitle1" color='text.secondary'>
                    Consultez et gérez les informations des étudiants
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <Tooltip title="Afficher le guide">
                  <IconButton
                    onClick={onShowTutorial}
                    sx={{
                      color: 'secondary.light',
                      bgcolor: 'rgba(0, 0, 0, 0.3)',
                      backdropFilter: 'blur(10px)',
                      '&:hover': {
                        bgcolor: 'rgba(0, 0, 0, 0.48)',
                        color: 'secondary',
                      }
                    }}
                  >
                    <HelpOutlineIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            
            {/* Stats cards grid - restructured like ClassesPage */}
            <Box sx={{ mt: 5 }}>
              <Grid container spacing={2} justifyContent="space-around">
                <Grid size={{ xs: 12, sm: 4, md: 3, lg: 3 }}>
                  <Paper sx={{ 
                    p: 2, 
                    textAlign: 'center', 
                    height: '100%', 
                    bgcolor: 'rgba(182, 182, 182, 0.15)',
                    backdropFilter: 'blur(1px)',
                    borderRadius: 2,
                  }}>
                    <Typography variant="h3" fontWeight="bold">
                      {totalStudents}
                    </Typography>
                    <Typography variant="overline">
                      {totalStudents === 0 ? "Aucun étudiant" : 
                      totalStudents === 1 ? "étudiant enregistré" : 
                      "étudiants enregistrés"}
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid size={{ xs: 12, sm: 4, md: 3, lg: 3 }}>
                  <Paper sx={{ 
                    p: 2, 
                    textAlign: 'center', 
                    height: '100%',
                    bgcolor: 'rgba(182, 182, 182, 0.15)',
                    backdropFilter: 'blur(1px)',
                    borderRadius: 2,
                  }}>
                    <Typography variant="h3" fontWeight="bold">
                      {uniqueClasses}
                    </Typography>
                    <Typography variant="overline">
                      {uniqueClasses === 0 ? "Aucune classe" : 
                      uniqueClasses === 1 ? "classe associée" : 
                      "classes associées"}
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid size={{ xs: 12, sm: 4, md: 3, lg: 3 }}>
                  <Paper sx={{ 
                    p: 2, 
                    textAlign: 'center', 
                    height: '100%',
                    bgcolor: 'rgba(182, 182, 182, 0.15)',
                    backdropFilter: 'blur(1px)',
                    borderRadius: 2,
                  }}>
                    <Typography variant="h3" fontWeight="bold">
                      {totalWithCorrections}
                    </Typography>
                    <Typography variant="overline">
                      {totalWithCorrections === 0 ? "Aucune correction" : 
                      totalWithCorrections === 1 ? "étudiant avec correction" : 
                      "étudiants avec corrections"}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          </Box>
        </PatternBackground>
      </GradientBackground>
    </Paper>
  );
};

export default StudentsHeader;
