// filepath: /var/www/correction.sekrane.fr/components/pdfAutre/ArrangementOptionsAutre.tsx
import React from 'react';
import { 
  Typography, 
  Box, 
  Paper, 
  FormControl, 
  FormLabel,
  Grid,
  Card,
  CardContent,
  alpha,
  useTheme
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ListAltIcon from '@mui/icons-material/ListAlt';
import TableChartIcon from '@mui/icons-material/TableChart';
import { ArrangementType, SubArrangementType, ViewType } from './types';
import GroupsIcon from '@mui/icons-material/Groups';
import PersonIcon from '@mui/icons-material/Person';

interface ArrangementOptionsProps {
  arrangement: ArrangementType;
  setArrangement: (value: ArrangementType) => void;
  subArrangement: SubArrangementType;
  setSubArrangement: (value: SubArrangementType) => void;
  viewType: ViewType;
  setViewType: (value: ViewType) => void;
  availableSubArrangements: SubArrangementType[];
}

const ArrangementOptionsAutre: React.FC<ArrangementOptionsProps> = ({
  arrangement,
  setArrangement,
  subArrangement,
  setSubArrangement,
  viewType,
  setViewType,
  availableSubArrangements
}) => {
  const theme = useTheme();
  
  // Fonction pour générer un libellé pour chaque option
  const getArrangementLabel = (type: ArrangementType | SubArrangementType): string => {
    switch (type) {
      case 'student': return 'Par étudiant';
      case 'class': return 'Par classe';
      case 'subclass': return 'Par groupe';
      case 'activity': return 'Par activité';
      case 'none': return 'Aucun sous-arrangement';
      default: return '';
    }
  };
  
  // Fonction pour obtenir une icône pour chaque option
  const getArrangementIcon = (type: ArrangementType | SubArrangementType) => {
    switch (type) {
      case 'student': return <PersonIcon sx={{ fontSize: '1.8rem' }} />;
      case 'class': return <SchoolIcon sx={{ fontSize: '1.8rem' }} />;
      case 'subclass': return <GroupsIcon sx={{ fontSize: '1.8rem' }} />; // Icône mise à jour pour groupe
      case 'activity': return <MenuBookIcon sx={{ fontSize: '1.8rem' }} />;
      case 'none': return null;
      default: return null;
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
        Organisation des données
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <FormControl component="fieldset" sx={{ width: '100%' }}>
          <FormLabel component="legend" sx={{ mb: 2, fontWeight: 'medium' }}>Organisation principale</FormLabel>
          <Grid container spacing={2}>
            {['student', 'class', 'subclass', 'activity'].map((type) => (
              <Grid size={{ xs: 6, md: 3 }} key={type}>
                <Card 
                  elevation={0}
                  onClick={() => setArrangement(type as ArrangementType)}
                  sx={{
                    cursor: 'pointer',
                    height: '100%',
                    border: '1px solid',
                    borderColor: arrangement === type 
                      ? theme.palette.primary.main 
                      : theme.palette.divider,
                    backgroundColor: arrangement === type 
                      ? alpha(theme.palette.primary.main, 0.08)
                      : 'background.paper',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      borderColor: arrangement === type 
                        ? theme.palette.primary.main 
                        : theme.palette.primary.light,
                      transform: 'translateY(-3px)',
                      boxShadow: arrangement === type
                        ? `0 5px 10px ${alpha(theme.palette.primary.main, 0.15)}`
                        : `0 5px 10px ${alpha(theme.palette.grey[500], 0.15)}`,
                    },
                    position: 'relative',
                    overflow: 'visible',
                  }}
                >
                  {arrangement === type && (
                    <CheckCircleIcon 
                      color="primary" 
                      sx={{
                        position: 'absolute',
                        top: -8,
                        right: -8,
                        backgroundColor: 'white',
                        borderRadius: '50%',
                        fontSize: '1.2rem',
                      }}
                    />
                  )}
                  <CardContent sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    padding: 2,
                    "&:last-child": { pb: 2 }
                  }}>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'center',
                      alignItems: 'center',
                      color: arrangement === type ? 'primary.main' : 'text.secondary',
                      mb: 1
                    }}>
                      {getArrangementIcon(type as ArrangementType)}
                    </Box>
                    <Typography 
                      variant="body2" 
                      align="center"
                      color={arrangement === type ? 'primary.main' : 'text.primary'}
                      fontWeight={arrangement === type ? 'bold' : 'regular'}
                    >
                      {getArrangementLabel(type as ArrangementType)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </FormControl>
      </Box>
      
      <Box sx={{ mb: 3 }}>
        <FormControl component="fieldset" sx={{ width: '100%' }}>
          <FormLabel component="legend" sx={{ mb: 2, fontWeight: 'medium' }}>Sous-organisation</FormLabel>
          <Grid container spacing={2}>
            {availableSubArrangements.map((type) => (
                <Grid size={{ xs: 6, sm: type === 'none' ? 12 : (12 / Math.min(availableSubArrangements.length, 4)) }} key={type}>
                <Card
                  elevation={0}
                  onClick={() => setSubArrangement(type)}
                  sx={{
                  cursor: 'pointer',
                  height: '100%',
                  border: '1px solid',
                  borderColor: subArrangement === type
                    ? theme.palette.primary.main
                    : theme.palette.divider,
                  backgroundColor: subArrangement === type
                    ? alpha(theme.palette.primary.main, 0.08)
                    : 'background.paper',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    borderColor: subArrangement === type
                    ? theme.palette.primary.main
                    : theme.palette.primary.light,
                    transform: 'translateY(-3px)',
                    boxShadow: subArrangement === type
                    ? `0 5px 10px ${alpha(theme.palette.primary.main, 0.15)}`
                    : `0 5px 10px ${alpha(theme.palette.grey[500], 0.15)}`,
                  },
                  position: 'relative',
                  overflow: 'visible',
                  }}
                >
                  {subArrangement === type && (
                  <CheckCircleIcon
                    color="primary"
                    sx={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    backgroundColor: 'white',
                    borderRadius: '50%',
                    fontSize: '1.2rem',
                    }}
                  />
                  )}
                  <CardContent sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: 2,
                  "&:last-child": { pb: 2 }
                  }}>
                  <Box sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: subArrangement === type ? 'primary.main' : 'text.secondary',
                    mb: 1
                  }}>
                    {getArrangementIcon(type)}
                  </Box>
                  <Typography
                    variant="body2"
                    align="center"
                    color={subArrangement === type ? 'primary.main' : 'text.primary'}
                    fontWeight={subArrangement === type ? 'bold' : 'regular'}
                  >
                    {getArrangementLabel(type)}
                  </Typography>
                  </CardContent>
                </Card>
                </Grid>
            ))}
          </Grid>
        </FormControl>
      </Box>
      
      {(arrangement === 'class' || arrangement === 'subclass') && (
        <Box sx={{ mt: 3 }}>
          <FormControl component="fieldset" sx={{ width: '100%' }}>
            <FormLabel component="legend" sx={{ mb: 2, fontWeight: 'medium' }}>Type d'affichage</FormLabel>
            <Grid container spacing={2}>
              <Grid size={{ xs: 6, md: 6 }}>
                <Card 
                  elevation={0}
                  onClick={() => setViewType('detailed')}
                  sx={{
                    cursor: 'pointer',
                    height: '100%',
                    border: '1px solid',
                    borderColor: viewType === 'detailed' 
                      ? theme.palette.primary.main 
                      : theme.palette.divider,
                    backgroundColor: viewType === 'detailed' 
                      ? alpha(theme.palette.primary.main, 0.08)
                      : 'background.paper',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      borderColor: viewType === 'detailed' 
                        ? theme.palette.primary.main 
                        : theme.palette.primary.light,
                      transform: 'translateY(-3px)',
                      boxShadow: viewType === 'detailed'
                        ? `0 5px 10px ${alpha(theme.palette.primary.main, 0.15)}`
                        : `0 5px 10px ${alpha(theme.palette.grey[500], 0.15)}`,
                    },
                    position: 'relative',
                    overflow: 'visible',
                  }}
                >
                  {viewType === 'detailed' && (
                    <CheckCircleIcon 
                      color="primary" 
                      sx={{
                        position: 'absolute',
                        top: -8,
                        right: -8,
                        backgroundColor: 'white',
                        borderRadius: '50%',
                        fontSize: '1.2rem',
                      }}
                    />
                  )}
                  <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 1,
                      color: viewType === 'detailed' ? 'primary.main' : 'text.secondary'
                    }}>
                      <ListAltIcon sx={{ fontSize: '1.8rem' }} />
                    </Box>
                    <Typography 
                      variant="body2" 
                      align="center"
                      color={viewType === 'detailed' ? 'primary.main' : 'text.primary'}
                      fontWeight={viewType === 'detailed' ? 'bold' : 'regular'}
                      gutterBottom
                    >
                      Détaillé
                    </Typography>
                    <Typography variant="caption" align="center" color="text.secondary" display="block">
                      Avec notes détaillées par partie
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 6, md: 6 }}>
                <Card 
                  elevation={0}
                  onClick={() => setViewType('simplified')}
                  sx={{
                    cursor: 'pointer',
                    height: '100%',
                    border: '1px solid',
                    borderColor: viewType === 'simplified' 
                      ? theme.palette.primary.main 
                      : theme.palette.divider,
                    backgroundColor: viewType === 'simplified' 
                      ? alpha(theme.palette.primary.main, 0.08)
                      : 'background.paper',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      borderColor: viewType === 'simplified' 
                        ? theme.palette.primary.main 
                        : theme.palette.primary.light,
                      transform: 'translateY(-3px)',
                      boxShadow: viewType === 'simplified'
                        ? `0 5px 10px ${alpha(theme.palette.primary.main, 0.15)}`
                        : `0 5px 10px ${alpha(theme.palette.grey[500], 0.15)}`,
                    },
                    position: 'relative',
                    overflow: 'visible',
                  }}
                >
                  {viewType === 'simplified' && (
                    <CheckCircleIcon 
                      color="primary" 
                      sx={{
                        position: 'absolute',
                        top: -8,
                        right: -8,
                        backgroundColor: 'white',
                        borderRadius: '50%',
                        fontSize: '1.2rem',
                      }}
                    />
                  )}
                  <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 1,
                      color: viewType === 'simplified' ? 'primary.main' : 'text.secondary'
                    }}>
                      <TableChartIcon sx={{ fontSize: '1.8rem' }} />
                    </Box>
                    <Typography 
                      variant="body2" 
                      align="center"
                      color={viewType === 'simplified' ? 'primary.main' : 'text.primary'}
                      fontWeight={viewType === 'simplified' ? 'bold' : 'regular'}
                      gutterBottom
                    >
                      Simplifié
                    </Typography>
                    <Typography variant="caption" align="center" color="text.secondary" display="block">
                      Tableau avec étudiants et activités
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </FormControl>
        </Box>
      )}
    </Paper>
  );
};

export default ArrangementOptionsAutre;