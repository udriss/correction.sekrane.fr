import React, { useState } from 'react';
import { Switch, FormControlLabel, Typography, Tooltip, CircularProgress } from '@mui/material';

interface CorrectionStatusToggleProps {
  correctionId: number;
  initialActive: boolean;
  onToggle: (correctionId: number, newActiveState: boolean) => Promise<void>;
}

const CorrectionStatusToggle: React.FC<CorrectionStatusToggleProps> = ({
  correctionId,
  initialActive,
  onToggle
}) => {
  const [isActive, setIsActive] = useState<boolean>(initialActive);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleToggle = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const newState = event.target.checked;
    setIsLoading(true);
    
    try {
      await onToggle(correctionId, newState);
      setIsActive(newState);
    } catch (error) {
      // If there was an error, revert back to previous state
      console.error("Toggle failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Tooltip title={isActive ? "Désactiver cette correction" : "Activer cette correction"}>
      <FormControlLabel
        control={
          <Switch
            checked={isActive}
            onChange={handleToggle}
            disabled={isLoading}
            color="primary"
          />
        }
        label={
          <Typography variant="body2" color="textSecondary">
            {isLoading ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              isActive ? "Actif" : "Inactif"
            )}
          </Typography>
        }
        labelPlacement="start"
      />
    </Tooltip>
  );
};

export default CorrectionStatusToggle;
