import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Alert,
  Button,
  Card,
  CardContent,
  Avatar,
  Chip,
  Grid
} from '@mui/material';
import Link from 'next/link';
import SchoolIcon from '@mui/icons-material/School';
import EventIcon from '@mui/icons-material/Event';
import AddIcon from '@mui/icons-material/Add';
import { Student, Class } from './types';

interface StudentClassesProps {
  student: Student;
  classes: Class[];
  onAddClassClick: () => void; // Nouvelle prop pour ouvrir le modal
}

export default function StudentClasses({ student, classes, onAddClassClick }: StudentClassesProps) {
  return (
    <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          Classes de {student.first_name}
        </Typography>
        
        <Button
          variant="outlined"
          color="primary"
          startIcon={<AddIcon />}
          onClick={onAddClassClick}  // Utiliser la fonction plutôt que href
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
            <Grid size={{ xs: 12, md: 4, sm: 6 }} key={cls.id}>
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
                    variant="outlined"
                    fullWidth
                    component={Link}
                    href={`/classes_autres/${cls.id}`}
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
  );
}
