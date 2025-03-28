import React from 'react';
import {
  Paper,
  Box,
  Typography,
  IconButton,
  Divider,
  Collapse
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import CloseIcon from '@mui/icons-material/Close';
import ClassStudentsManager from '@/components/classes/ClassStudentsManager';
import LoadingSpinner from '@/components/LoadingSpinner';

interface ClassManagerSectionProps {
  expanded: boolean;
  loading: boolean;
  selectedClassId: number | null;
  selectedClassData: any | null;
  onClose: () => void;
}

const ClassManagerSection: React.FC<ClassManagerSectionProps> = ({
  expanded,
  loading,
  selectedClassId,
  selectedClassData,
  onClose
}) => {
  return (
    <Collapse in={expanded} timeout="auto">
      {loading ? (
        <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <LoadingSpinner size="md" text="Chargement des données de classe" />
          </Box>
        </Paper>
      ) : (
        <Paper 
          elevation={3} 
          sx={{ 
            mb: 4,
            overflow: 'hidden',
            borderRadius: '8px'
          }}
        >
          {/* En-tête avec gradient et statistiques */}
          <Box
            sx={{ 
              p: 0,
              background: 'linear-gradient(to right, #581c87, rgb(7, 0, 193))'
            }}
          >
            <Box sx={{ p: 3 }}>
              <Box sx={{ 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'relative',
                zIndex: 1 
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SchoolIcon fontSize="large" sx={{ color: 'white' }} />
                  <Box>
                    <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', color: 'white' }}>
                      {selectedClassData?.name}
                    </Typography>
                    <Typography variant="subtitle1" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                      {`Année ${selectedClassData?.academic_year || ''}`}
                    </Typography>
                  </Box>
                </Box>
                
                <IconButton 
                  onClick={onClose}
                  sx={{ color: 'white', backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                >
                  <CloseIcon />
                </IconButton>
              </Box>
            </Box>
          </Box>

          <Divider />
          
          <Box sx={{ p: 3 }}>
            {selectedClassId && (
              <ClassStudentsManager 
                classId={selectedClassId}
                classData={selectedClassData}
                embedded={true}
              />
            )}
          </Box>
        </Paper>
      )}
    </Collapse>
  );
};

export default ClassManagerSection;
