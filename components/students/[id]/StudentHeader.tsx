import React from 'react';
import { 
  Box, 
  Avatar, 
  Typography, 
  Badge, 
  Button, 
  Chip, 
  useTheme 
} from '@mui/material';
import Link from 'next/link';
import dayjs from 'dayjs';
import EditIcon from '@mui/icons-material/Edit';
import EmailIcon from '@mui/icons-material/Email';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SchoolIcon from '@mui/icons-material/School';
import MaleIcon from '@mui/icons-material/Male';
import FemaleIcon from '@mui/icons-material/Female';
import NeutralIcon from '@mui/icons-material/RemoveCircleOutline';
import GradientBackground from '@/components/ui/GradientBackground';
import PatternBackground from '@/components/ui/PatternBackground';
import { Student, Class } from './types';

interface StudentHeaderProps {
  student: Student;
  classes: Class[];
  onEditClick: () => void;
}

export default function StudentHeader({ student, classes, onEditClick }: StudentHeaderProps) {
  const theme = useTheme();

  const getGenderIcon = (gender: string | undefined) => {
    switch(gender) {
      case 'M': return <MaleIcon color="info" />;
      case 'F': return <FemaleIcon color="secondary" />;
      default: return <NeutralIcon />;
    }
  };

  return (
    <GradientBackground variant="primary" sx={{ p: 0 }}>
      <PatternBackground 
        pattern="dots" 
        opacity={0.05} 
        color="black" 
        size={100}
        sx={{ p: 4, borderRadius: 2 }}
      >
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { xs: 'center', md: 'flex-start' }, gap: 3 }}>
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          >
            <Avatar 
              sx={{ 
                color: theme => theme.palette.text.primary,
                width: 100, 
                height: 100, 
                background: student.gender === 'M'
                  ? (theme) => `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.dark} 100%)`
                  : student.gender === 'F' 
                  ? (theme) => `linear-gradient(135deg, ${theme.palette.secondary.light} 0%, ${theme.palette.secondary.dark} 100%)`
                  : 'grey.500',
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
                <Typography variant="h4" fontWeight={700} color="text.primary">
                  {student.first_name} {student.last_name}
                </Typography>
                
                {student.code && (
                  <Typography variant="subtitle1" sx={{ opacity: 0.9, mb: 2 }}>
                    #{student.code}
                  </Typography>
                )}
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: { xs: 'center', md: 'flex-start' } }}>
                  {classes.map(c => (
                    <Chip
                      key={c.id || `unknown-class-${Math.random()}`} // Provide fallback key if id is missing
                      icon={<SchoolIcon color='primary' />}
                      label={c.sub_class ? `${c.name || 'Classe'} (Groupe ${c.sub_class})` : (c.name || 'Classe')}
                      component={Link}
                      href={`/classes/${c.id || 0}`} // Provide fallback id if missing
                      clickable
                      sx={{ 
                        bgcolor: 'rgba(255,255,255,0.15)', 
                        color: 'text.primary',
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
                  onClick={onEditClick}
                  sx={{ 
                    bgcolor: 'rgba(255,255,255,0.15)',
                    color: 'text.primary',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' }
                  }}
                >
                  Modifier
                </Button>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mt: 2, justifyContent: { xs: 'center', md: 'flex-start' } }}>
              {student.email && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: { xs: 'center', md: 'flex-start' } }}>
                  <EmailIcon fontSize="small" sx={{ color : theme => theme.palette.text.secondary }}/>
                  <Typography variant="body2" color='text.primary'>{student.email}</Typography>
                </Box>
              )}
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: { xs: 'center', md: 'flex-start' } }}>
                <CalendarTodayIcon fontSize="small" sx={{ color : theme => theme.palette.text.secondary }}/>
                <Typography variant="body2" color='text.primary'>
                  Inscrit le {dayjs(student.created_at).format('DD/MM/YYYY')}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </PatternBackground>
    </GradientBackground>
  );
}
