import React from 'react';
import {
  Paper,
  Box,
  Typography,
  Button,
  IconButton
} from '@mui/material';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import CloseIcon from '@mui/icons-material/Close';

interface StudentsTutorialProps {
  show: boolean;
  onClose: () => void;
}

const StudentsTutorial: React.FC<StudentsTutorialProps> = ({ show, onClose }) => {
  if (!show) return null;
  
  return (
    <Paper className="mb-8 p-4 border-l-4 border-purple-500 bg-purple-50">
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <TipsAndUpdatesIcon color="secondary" sx={{ mr: 1 }} />
        <Typography variant="h6" component="h2">
          Guide des étudiants
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <IconButton size="small" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>
      
      <Typography variant="body1" >
        Cette page vous permet de gérer tous les étudiants de votre établissement :
      </Typography>
      
      <ul className="list-disc pl-6 space-y-2">
        <li>
          <Typography variant="body2">
            <strong>consulter</strong> les informations des étudiants avec leurs classes assignées
          </Typography>
        </li>
        <li>
          <Typography variant="body2">
            <strong>modifier</strong> les informations directement depuis cette page
          </Typography>
        </li>
        <li>
          <Typography variant="body2">
            <strong>filtrer</strong> par classe ou par statut de correction
          </Typography>
        </li>
        <li>
          <Typography variant="body2">
            <strong>ajouter</strong> de nouveaux étudiants individuellement
          </Typography>
        </li>
      </ul>
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
        <Button
          size="small"
          onClick={onClose}
          color="secondary"
        >
          J'ai compris
        </Button>
      </Box>
    </Paper>
  );
};

export default StudentsTutorial;
