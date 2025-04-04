import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import AddIcon from '@mui/icons-material/Add';

interface FragmentsActionsProps {
  isAuthenticated: boolean;
  userOnly: boolean;
  filteredFragmentsCount: number;
  handleUserFilterToggle: () => void;
  openNewFragmentModal: () => void;
}

export const FragmentsActions: React.FC<FragmentsActionsProps> = ({
  isAuthenticated,
  userOnly,
  filteredFragmentsCount,
  handleUserFilterToggle,
  openNewFragmentModal,
}) => {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
      <Typography variant="h6" color="text.secondary" fontWeight="medium">
        {filteredFragmentsCount === 0 
          ? "Aucun fragment trouvé" 
          : filteredFragmentsCount === 1 
          ? "1 fragment trouvé" 
          : `${filteredFragmentsCount} fragments trouvés`}
      </Typography>
      <Box sx={{ display: 'flex', gap: 1 }}>
        {isAuthenticated && (
          <>
            <Button
              variant="contained"
              color={userOnly ? "primary" : "secondary"}
              startIcon={<PersonIcon />}
              onClick={handleUserFilterToggle}
              size="medium"
            >
              {userOnly ? "Mes fragments" : "Tous"}
            </Button>
            
            <Button 
              variant="contained" 
              color="primary"
              startIcon={<AddIcon />}
              onClick={openNewFragmentModal}
            >
              Nouveau
            </Button>
          </>
        )}
      </Box>
    </Box>
  );
};
