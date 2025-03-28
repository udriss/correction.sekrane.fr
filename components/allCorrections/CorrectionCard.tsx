import React from 'react';
import { 
  Box, Card, CardContent, Typography, Button 
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import CalendarIcon from '@mui/icons-material/CalendarMonth';
import Link from 'next/link';
import dayjs from 'dayjs';
import Grid from '@mui/material/Grid';
import { Correction } from '@/app/components/CorrectionsDataProvider';

interface CorrectionCardProps {
  correction: Correction;
  getGradeColor: (grade: number) => string;
}

const CorrectionCard: React.FC<CorrectionCardProps> = ({ correction, getGradeColor }) => {
  return (
    <Grid size={{ xs: 12, sm:6, md: 4, lg: 3 }} >
      <Card 
        sx={{ 
          height: '100%',
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: 6
          }
        }}
      >
        <Box sx={{ 
          p: 1, 
          bgcolor: `${getGradeColor(correction.grade)}.main`, 
          color: 'white',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontWeight: 'bold'
        }}>
          <Typography variant="h5" fontWeight="bold">{correction.grade} / 20</Typography>
        </Box>
        
        <CardContent>
          <Typography 
            variant="subtitle1" 
            fontWeight="bold" 
            noWrap 
            title={correction.activity_name}
          >
            {correction.activity_name}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, mb: 0.5 }}>
            <PersonIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
            <Typography 
              variant="body2" 
              component={Link} 
              href={`/students/${correction.student_id}`}
              sx={{ 
                textDecoration: 'none',
                color: 'primary.main',
                '&:hover': {
                  textDecoration: 'underline'
                }
              }}
            >
              {correction.student_name}
            </Typography>
          </Box>
          
          {correction.class_id && (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <SchoolIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography 
                variant="body2" 
                noWrap
                component={Link}
                href={`/classes/${correction.class_id}`}
                sx={{ 
                  textDecoration: 'none',
                  color: 'primary.main',
                  '&:hover': {
                    textDecoration: 'underline'
                  }
                }}
              >
                {correction.class_name}
              </Typography>
            </Box>
          )}
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CalendarIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {dayjs(correction.submission_date).format('DD/MM/YYYY')}
            </Typography>
          </Box>
          
          <Button
            variant="outlined"
            fullWidth
            component={Link}
            href={`/corrections/${correction.id}`}
            sx={{ mt: 2 }}
          >
            Voir détails
          </Button>
        </CardContent>
      </Card>
    </Grid>
  );
};

export default CorrectionCard;