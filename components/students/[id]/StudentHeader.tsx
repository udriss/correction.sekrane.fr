import React, { useState } from 'react';
import { 
  Box, 
  Avatar, 
  Typography, 
  Badge, 
  Button, 
  Chip, 
  useTheme,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  IconButton
} from '@mui/material';
import Link from 'next/link';
import dayjs from 'dayjs';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import EmailIcon from '@mui/icons-material/Email';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SchoolIcon from '@mui/icons-material/School';
import MaleIcon from '@mui/icons-material/Male';
import FemaleIcon from '@mui/icons-material/Female';
import NeutralIcon from '@mui/icons-material/RemoveCircleOutline';
import WarningIcon from '@mui/icons-material/Warning';
import GradientBackground from '@/components/ui/GradientBackground';
import PatternBackground from '@/components/ui/PatternBackground';
import { Student, Class } from './types';
import EmailCorrectionPage from '@/components/students/EmailCorrectionPage';
import AlertDialog from '@/components/AlertDialog';
import { useRouter } from 'next/navigation';

interface StudentHeaderProps {
  student: Student;
  classes: Class[];
  onEditClick: () => void;
}

export default function StudentHeader({ student, classes, onEditClick }: StudentHeaderProps) {
  const theme = useTheme();
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteProcessing, setDeleteProcessing] = useState(false);
  const [relatedCorrections, setRelatedCorrections] = useState<any[]>([]);

  const getGenderIcon = (gender: string | undefined) => {
    switch(gender) {
      case 'M': return <MaleIcon color="info" />;
      case 'F': return <FemaleIcon color="secondary" />;
      default: return <NeutralIcon />;
    }
  };

  const handleDeleteClick = async () => {
    try {
      // Utiliser la route API existante pour récupérer les corrections
      const res = await fetch(`/api/students/${student.id}/corrections`);
      if (res.ok) {
        const corrections = await res.json();
        setRelatedCorrections(Array.isArray(corrections) ? corrections : []);
      }
      setDeleteDialogOpen(true);
    } catch (error) {
      console.error('Error fetching related corrections:', error);
      // Show dialog anyway, but with empty corrections list
      setRelatedCorrections([]);
      setDeleteDialogOpen(true);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      setDeleteProcessing(true);
      const res = await fetch(`/api/students/${student.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        // Redirect to students list after successful deletion
        router.push('/students');
      } else {
        console.error('Failed to delete student:', await res.text());
        setDeleteProcessing(false);
        setDeleteDialogOpen(false);
      }
    } catch (error) {
      console.error('Error deleting student:', error);
      setDeleteProcessing(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
  };

  // Content for the delete confirmation modal
  const deleteDialogContent = (
    <Box>
      <Typography variant="body1" gutterBottom>
        Êtes-vous sûr de vouloir supprimer l'étudiant <strong>{student.first_name} {student.last_name}</strong> ?
      </Typography>
      <Typography variant="body1" gutterBottom sx={{ mt: 2 }}>
        Cette action est irréversible et supprimera également :
      </Typography>
      
      {relatedCorrections.length > 0 ? (
        <List sx={{ 
          bgcolor: 'background.paper', 
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'divider',
          my: 2,
          maxHeight: '300px',
          overflow: 'auto'
        }}>
          {relatedCorrections.map((correction, index) => (
            <ListItem key={correction.id || index} divider={index < relatedCorrections.length - 1}>
              <ListItemText
                primary={correction.activity_name || 'Activité sans nom'}
                secondary={
                  <React.Fragment>
                    <Typography component="span" variant="body2" color="text.primary">
                      {correction.class_name || 'Sans classe'}
                    </Typography>
                    {' — '}
                    {correction.final_grade !== null && correction.final_grade !== undefined 
                      ? `Note: ${correction.final_grade}`
                      : correction.grade !== null && correction.grade !== undefined
                      ? `Note: ${correction.grade}`
                      : 'Non noté'}
                    {correction.submission_date && 
                      ` - Soumis le ${dayjs(correction.submission_date).format('DD/MM/YYYY')}`}
                  </React.Fragment>
                }
              />
            </ListItem>
          ))}
        </List>
      ) : (
        <Typography variant="body2" sx={{ 
          py: 2, 
          px: 3, 
          bgcolor: 'background.paper',
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'divider',
          fontStyle: 'italic',
          my: 2
        }}>
          Aucune correction associée trouvée
        </Typography>
      )}

      <Typography variant="body2" color="error" sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningIcon fontSize="small" />
        Toutes les données associées à cet étudiant seront définitivement supprimées.
      </Typography>
    </Box>
  );

  return (
    <>
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
                
                <Box sx={{ mt: { xs: 2, md: 0 }, display: 'flex', gap: 1 }}>
                  <EmailCorrectionPage student={student} />
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
                  <Button
                    variant="contained"
                    startIcon={<DeleteIcon />}
                    onClick={handleDeleteClick}
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.15)',
                      color: 'error.main',
                      '&:hover': { 
                        bgcolor: 'error.main',
                        color: 'white'
                      }
                    }}
                  >
                    Supprimer
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

      {/* Modal de confirmation de suppression */}
      <AlertDialog
        open={deleteDialogOpen}
        title="Confirmation de suppression"
        content={deleteDialogContent}
        confirmText="Supprimer définitivement"
        confirmColor="error"
        cancelText="Annuler"
        isProcessing={deleteProcessing}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        icon={<WarningIcon />}
      />
    </>
  );
}
