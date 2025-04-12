import React from 'react';
import { 
  Typography, 
  Box, 
  Paper, 
  FormControl, 
  FormLabel, 
  RadioGroup, 
  FormControlLabel, 
  Radio 
} from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';
import SchoolIcon from '@mui/icons-material/School';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { ArrangementType, SubArrangementType, ViewType } from './types';

interface ArrangementOptionsProps {
  arrangement: ArrangementType;
  setArrangement: (value: ArrangementType) => void;
  subArrangement: SubArrangementType;
  setSubArrangement: (value: SubArrangementType) => void;
  viewType: ViewType;
  setViewType: (value: ViewType) => void;
  availableSubArrangements: SubArrangementType[];
}

const ArrangementOptions: React.FC<ArrangementOptionsProps> = ({
  arrangement,
  setArrangement,
  subArrangement,
  setSubArrangement,
  viewType,
  setViewType,
  availableSubArrangements
}) => {
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
      case 'student': return <GroupIcon sx={{ mr: 1, fontSize: '1.2rem' }} />;
      case 'class': return <SchoolIcon sx={{ mr: 1, fontSize: '1.2rem' }} />;
      case 'subclass': return <SchoolIcon sx={{ mr: 1, fontSize: '1.2rem' }} />; // Même icône pour groupe
      case 'activity': return <MenuBookIcon sx={{ mr: 1, fontSize: '1.2rem' }} />;
      case 'none': return null;
      default: return null;
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
        Organisation des données
      </Typography>
      
      <FormControl component="fieldset" sx={{ mb: 2 }}>
        <FormLabel component="legend">Organisation principale</FormLabel>
        <RadioGroup
          value={arrangement}
          onChange={(e) => setArrangement(e.target.value as ArrangementType)}
        >
          <FormControlLabel 
            value="student" 
            control={<Radio />} 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {getArrangementIcon('student')}
                {getArrangementLabel('student')}
              </Box>
            } 
          />
          <FormControlLabel 
            value="class" 
            control={<Radio />} 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {getArrangementIcon('class')}
                {getArrangementLabel('class')}
              </Box>
            } 
          />
          <FormControlLabel 
            value="subclass" 
            control={<Radio />} 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {getArrangementIcon('subclass')}
                {getArrangementLabel('subclass')}
              </Box>
            } 
          />
          <FormControlLabel 
            value="activity" 
            control={<Radio />} 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {getArrangementIcon('activity')}
                {getArrangementLabel('activity')}
              </Box>
            } 
          />
        </RadioGroup>
      </FormControl>
      
      <FormControl component="fieldset">
        <FormLabel component="legend">Sous-organisation</FormLabel>
        <RadioGroup
          value={subArrangement}
          onChange={(e) => setSubArrangement(e.target.value as SubArrangementType)}
        >
          {availableSubArrangements.map((type) => (
            <FormControlLabel 
              key={type}
              value={type} 
              control={<Radio />} 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {getArrangementIcon(type)}
                  {getArrangementLabel(type)}
                </Box>
              }
            />
          ))}
        </RadioGroup>
      </FormControl>
      
      {arrangement === 'class' && (
        <Box sx={{ mt: 2 }}>
          <FormControl component="fieldset">
            <FormLabel component="legend">Type d'affichage</FormLabel>
            <RadioGroup
              value={viewType}
              onChange={(e) => setViewType(e.target.value as ViewType)}
            >
              <FormControlLabel 
                value="detailed" 
                control={<Radio />} 
                label="Détaillé (avec notes expérimentales et théoriques)" 
              />
              <FormControlLabel 
                value="simplified" 
                control={<Radio />} 
                label="Simplifié (tableau avec étudiants et activités)" 
              />
            </RadioGroup>
          </FormControl>
        </Box>
      )}
    </Paper>
  );
};

export default ArrangementOptions;