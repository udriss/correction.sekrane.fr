import React from 'react';
import { Box, Button, Typography, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import AddIcon from '@mui/icons-material/Add';

interface FragmentsActionsProps {
  isAuthenticated: boolean;
  userOnly: boolean;
  filteredFragmentsCount: number;
  handleUserFilterToggle: () => void;
  openNewFragmentModal: () => void;
  fragmentsPerPage: number;
  onFragmentsPerPageChange: (value: number) => void;
}

export const FragmentsActions: React.FC<FragmentsActionsProps> = ({
  isAuthenticated,
  userOnly,
  filteredFragmentsCount,
  handleUserFilterToggle,
  openNewFragmentModal,
  fragmentsPerPage,
  onFragmentsPerPageChange,
}) => {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="h6" color="text.secondary" fontWeight="medium">
          {filteredFragmentsCount === 0 
            ? "Aucun fragment trouvé" 
            : filteredFragmentsCount === 1 
            ? "1 fragment trouvé" 
            : `${filteredFragmentsCount} fragments trouvés`}
        </Typography>
        
        {/* Sélecteur du nombre de fragments par page */}
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel id="fragments-per-page-label">Par page</InputLabel>
          <Select
            labelId="fragments-per-page-label"
            value={fragmentsPerPage}
            label="Par page"
            onChange={(e) => onFragmentsPerPageChange(Number(e.target.value))}
          >
            <MenuItem value={5}>5</MenuItem>
            <MenuItem value={10}>10</MenuItem>
            <MenuItem value={20}>20</MenuItem>
            <MenuItem value={50}>50</MenuItem>
            <MenuItem value={100}>100</MenuItem>
          </Select>
        </FormControl>
      </Box>
      
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
