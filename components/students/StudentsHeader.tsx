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
  Card,
  CardContent,
  Badge
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import SchoolIcon from '@mui/icons-material/School';
import AssignmentIcon from '@mui/icons-material/Assignment';
import GradientBackground from '@/components/ui/GradientBackground';
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
      <GradientBackground variant="primary" overlay={false}>
        <Box sx={{ p: 3, position: 'relative' }}>
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
                  bgcolor: 'rgba(255,255,255,0.15)',
                  p: 1.5,
                  borderRadius: '50%',
                  display: 'flex',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                }}
              >
                <PersonIcon sx={{ fontSize: 36, color: 'white' }} />
              </Box>
              
              <Box>
                <H1Title>
                  Gestion des étudiants
                </H1Title>
                <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
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
                    bgcolor: 'rgb(0, 0, 0)',
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
          
          {/* Stats bar with improved visual appeal */}
          <Box 
            sx={{ 
              display: 'flex', 
              flexWrap: 'wrap',
              gap: 2,
              justifyContent: { xs: 'center', md: 'flex-start' },
            }}
          >
            <Card 
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.15)', 
                backdropFilter: 'blur(10px)',
                borderRadius: 3,
                minWidth: { xs: '140px', md: 'auto' },
                flexGrow: { xs: 1, md: 0 },
                maxWidth: { xs: 'calc(50% - 8px)', md: 'none' },
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
                }
              }}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box 
                  sx={{ 
                    bgcolor: 'rgba(255,255,255,0.25)', 
                    p: 1, 
                    borderRadius: '50%',
                  }}
                >
                  <PersonIcon sx={{ color: 'white' }} />
                </Box>
                <Box>
                  <Typography variant="h5" component="div" fontWeight="bold" color="white">
                    {totalStudents}
                  </Typography>
                  <Typography variant="body2" color="rgba(255,255,255,0.85)">
                    {totalStudents === 0 ? "Aucun étudiant" : 
                    totalStudents === 1 ? "Étudiant" : 
                    "Étudiants"}
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            <Card 
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.15)', 
                backdropFilter: 'blur(10px)',
                borderRadius: 3,
                minWidth: { xs: '140px', md: 'auto' },
                flexGrow: { xs: 1, md: 0 },
                maxWidth: { xs: 'calc(50% - 8px)', md: 'none' },
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
                }
              }}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box 
                  sx={{ 
                    bgcolor: 'rgba(255,255,255,0.25)', 
                    p: 1, 
                    borderRadius: '50%',
                  }}
                >
                  <SchoolIcon sx={{ color: 'white' }} />
                </Box>
                <Box>
                  <Typography variant="h5" component="div" fontWeight="bold" color="white">
                    {uniqueClasses}
                  </Typography>
                  <Typography variant="body2" color="rgba(255,255,255,0.85)">
                    {uniqueClasses === 0 ? "Aucune classe" : 
                    uniqueClasses === 1 ? "Classe" : 
                    "Classes"}
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            <Card 
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.15)', 
                backdropFilter: 'blur(10px)',
                borderRadius: 3,
                minWidth: { xs: '140px', md: 'auto' },
                flexGrow: { xs: 1, md: 0 },
                maxWidth: { xs: 'calc(50% - 8px)', md: 'none' },
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
                }
              }}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box 
                  sx={{ 
                    bgcolor: 'rgba(255,255,255,0.25)', 
                    p: 1, 
                    borderRadius: '50%',
                  }}
                >
                  <AssignmentIcon sx={{ color: 'white' }} />
                </Box>
                <Box>
                  <Typography variant="h5" component="div" fontWeight="bold" color="white">
                    {totalWithCorrections}
                  </Typography>
                  <Typography variant="body2" color="rgba(255,255,255,0.85)">
                    {totalWithCorrections === 0 ? "Aucune correction" : 
                    totalWithCorrections === 1 ? "Correction" : 
                    "Corrections"}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </GradientBackground>
    </Paper>
  );
};

export default StudentsHeader;
