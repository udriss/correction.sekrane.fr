import React from 'react';
import { Typography, Box, Button, Paper } from '@mui/material';
import { alpha } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SchoolIcon from '@mui/icons-material/School';
import EditIcon from '@mui/icons-material/Edit';

import Link from 'next/link';
import GradientBackground from '@/components/ui/GradientBackground';
import PatternBackground from '@/components/ui/PatternBackground';
import { ClassEditForm } from '@/components/ClassEditForm';
import { Class } from '@/lib/types';

interface ClassHeaderProps {
  classData: Class;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  classId: number;
  description?: string;
  onUpdateClass: (updatedClass: Class) => void;
}

export function ClassHeader({ 
  classData, 
  isEditing, 
  setIsEditing, 
  classId,
  description,
  onUpdateClass
}: ClassHeaderProps) {
  return (
    <Paper elevation={3} sx={{ borderRadius: 3, overflow: 'hidden', mb: 4 }}>
      <GradientBackground variant="primary" sx={{ p: 0 }}>
        <PatternBackground 
          pattern="dots" 
          opacity={0.05} 
          color="black" 
          size={100}
          sx={{ p: 4, borderRadius: 2 }}
        >
          {isEditing && classData ? (
            <ClassEditForm 
              id={classId.toString()}
              initialData={{
                name: classData?.name || '',
                description: classData?.description || '',
                academic_year: classData?.academic_year || '',
                nbre_subclasses: classData?.nbre_subclasses || 0
              }}
              onCancel={() => setIsEditing(false)}
              onSuccess={onUpdateClass}
            />
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
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
                  <SchoolIcon sx={{ fontSize: 50, color: 'text.primary' }} />
                </Box>
                
                <Box>
                  <Typography variant="h4" fontWeight={700} color="text.primary">
                    {classData.name}
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary" sx={{ opacity: 0.9 }}>
                    Année académique : {classData.academic_year}
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button 
                  variant="contained" 
                  color="secondary" 
                  startIcon={<ArrowBackIcon />} 
                  component={Link} 
                  href="/classes"
                >
                  Retour
                </Button>
                
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<EditIcon />}
                  onClick={() => setIsEditing(true)}
                >
                  Modifier
                </Button>
              </Box>
            </Box>
          )}

          {!isEditing && classData.description && (
            <Typography variant="body1" color='text.primary' className="mt-4 bg-white/20 p-3 rounded-lg italic">
              {description || classData.description}
            </Typography>
          )}
          {!isEditing && !classData.description && (
            <Typography variant="body1" color='text.primary' className="mt-4 bg-white/20 p-3 rounded-lg italic">
              Aucune description n'a été fournie pour cette classe.
            </Typography>
          )}
        </PatternBackground>
      </GradientBackground>
    </Paper>
  );
}