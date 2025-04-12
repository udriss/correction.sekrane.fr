import React, { useState } from 'react';
import { Button, IconButton } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import AssignmentLateIcon from '@mui/icons-material/AssignmentLate';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { useSnackbar } from 'notistack';

// Types possibles de statut
const STATUS_TYPES = {
  ACTIVE: 'ACTIVE',
  DEACTIVATED: 'DEACTIVATED',
  ABSENT: 'ABSENT',
  NON_RENDU: 'NON_RENDU',
  NON_NOTE: 'NON_NOTE'
} as const;

type StatusType = typeof STATUS_TYPES[keyof typeof STATUS_TYPES];

interface CorrectionStatusToggleProps {
  correctionId: number | string;
  initialStatus?: StatusType;
  initialActive?: number;
  onStatusChange?: (newStatus: StatusType) => void;
  variant?: 'icon' | 'text';
  size?: 'small' | 'medium' | 'large';
}

// Composant pour basculer le statut d'une correction
const CorrectionStatusToggle: React.FC<CorrectionStatusToggleProps> = ({ 
  correctionId, 
  initialStatus, 
  initialActive, 
  onStatusChange, 
  variant = 'icon',
  size = 'medium' 
}) => {
  const { enqueueSnackbar } = useSnackbar();
  // Déterminer le statut initial
  const getInitialStatus = () => {
    if (initialStatus) {
      return initialStatus;
    }
    // Compatibilité avec l'ancien système
    return initialActive === 1 ? STATUS_TYPES.ACTIVE : STATUS_TYPES.DEACTIVATED;
  };
  
  const [status, setStatus] = useState<StatusType>(getInitialStatus());
  const [loading, setLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Ouvrir le menu de statuts
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  // Fermer le menu de statuts
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Mettre à jour le statut
  const handleStatusChange = async (newStatus: StatusType) => {
    if (newStatus === status) {
      handleMenuClose();
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/corrections/${correctionId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour du statut');
      }

      setStatus(newStatus);
      
      if (onStatusChange) {
        onStatusChange(newStatus);
      }
      
      // Message de confirmation
      const statusMessages = {
        [STATUS_TYPES.ACTIVE]: 'Correction activée',
        [STATUS_TYPES.DEACTIVATED]: 'Correction désactivée',
        [STATUS_TYPES.ABSENT]: 'Élève marqué comme absent',
        [STATUS_TYPES.NON_RENDU]: 'Devoir marqué comme non rendu',
        [STATUS_TYPES.NON_NOTE]: 'Correction marquée comme non notée',
      };
      
      enqueueSnackbar(statusMessages[newStatus] || 'Statut mis à jour', { 
        variant: 'success' 
      });
      
    } catch (error) {
      console.error('Erreur:', error);
      enqueueSnackbar('Erreur lors de la mise à jour du statut', { 
        variant: 'error' 
      });
    } finally {
      setLoading(false);
      handleMenuClose();
    }
  };

  // Basculer simplement entre actif et inactif (pour la compatibilité)
  const toggleActiveStatus = async () => {
    const newStatus = status === STATUS_TYPES.ACTIVE ? 
      STATUS_TYPES.DEACTIVATED : STATUS_TYPES.ACTIVE;
    
    handleStatusChange(newStatus);
  };

  // Rendre les icônes et textes en fonction du statut
  const getStatusIcon = (statusType: StatusType) => {
    switch (statusType) {
      case STATUS_TYPES.ACTIVE:
        return <CheckCircleOutlineIcon />;
      case STATUS_TYPES.DEACTIVATED:
        return <HighlightOffIcon />;
      case STATUS_TYPES.ABSENT:
        return <PersonOffIcon />;
      case STATUS_TYPES.NON_RENDU:
        return <AssignmentLateIcon />;
      case STATUS_TYPES.NON_NOTE:
        return <HelpOutlineIcon />;
      default:
        return <HighlightOffIcon />;
    }
  };

  const getStatusText = (statusType: StatusType) => {
    switch (statusType) {
      case STATUS_TYPES.ACTIVE:
        return 'Active';
      case STATUS_TYPES.DEACTIVATED:
        return 'Désactivée';
      case STATUS_TYPES.ABSENT:
        return 'Absent';
      case STATUS_TYPES.NON_RENDU:
        return 'Non rendu';
      case STATUS_TYPES.NON_NOTE:
        return 'Non noté';
      default:
        return 'Inconnu';
    }
  };

  // Obtenir la couleur en fonction du statut
  const getStatusColor = (statusType: StatusType) => {
    switch (statusType) {
      case STATUS_TYPES.ACTIVE:
        return 'success';
      case STATUS_TYPES.DEACTIVATED:
        return 'error';
      case STATUS_TYPES.ABSENT:
        return 'info';
      case STATUS_TYPES.NON_RENDU:
        return 'warning';
      case STATUS_TYPES.NON_NOTE:
        return 'default';
      default:
        return 'default';
    }
  };

  // Si c'est un bouton icône
  if (variant === 'icon') {
    return (
      <>
        <IconButton
          color={getStatusColor(status)}
          onClick={handleMenuOpen}
          disabled={loading}
          size={size}
        >
          {getStatusIcon(status)}
        </IconButton>
        
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => handleStatusChange(STATUS_TYPES.ACTIVE)}>
            <ListItemIcon>
              <CheckCircleOutlineIcon fontSize="small" color="success" />
            </ListItemIcon>
            <ListItemText>Active</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleStatusChange(STATUS_TYPES.DEACTIVATED)}>
            <ListItemIcon>
              <HighlightOffIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Désactivée</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleStatusChange(STATUS_TYPES.ABSENT)}>
            <ListItemIcon>
              <PersonOffIcon fontSize="small" color="info" />
            </ListItemIcon>
            <ListItemText>Absent</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleStatusChange(STATUS_TYPES.NON_RENDU)}>
            <ListItemIcon>
              <AssignmentLateIcon fontSize="small" color="warning" />
            </ListItemIcon>
            <ListItemText>Non rendu</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleStatusChange(STATUS_TYPES.NON_NOTE)}>
            <ListItemIcon>
              <HelpOutlineIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Non noté</ListItemText>
          </MenuItem>
        </Menu>
      </>
    );
  }

  // Si c'est un bouton texte
  return (
    <>
      <Button
        variant="outlined"
        sx={{
            color: getStatusColor(status),
            borderColor: getStatusColor(status),
            '&:hover': {
                backgroundColor: getStatusColor(status),
                color: 'white',
            },
        }}
        onClick={handleMenuOpen}
        disabled={loading}
        startIcon={getStatusIcon(status)}
        size={size}
      >
        {getStatusText(status)}
      </Button>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleStatusChange(STATUS_TYPES.ACTIVE)}>
          <ListItemIcon>
            <CheckCircleOutlineIcon fontSize="small" color="success" />
          </ListItemIcon>
          <ListItemText>Active</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleStatusChange(STATUS_TYPES.DEACTIVATED)}>
          <ListItemIcon>
            <HighlightOffIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Désactivée</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleStatusChange(STATUS_TYPES.ABSENT)}>
          <ListItemIcon>
            <PersonOffIcon fontSize="small" color="info" />
          </ListItemIcon>
          <ListItemText>Absent</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleStatusChange(STATUS_TYPES.NON_RENDU)}>
          <ListItemIcon>
            <AssignmentLateIcon fontSize="small" color="warning" />
          </ListItemIcon>
          <ListItemText>Non rendu</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleStatusChange(STATUS_TYPES.NON_NOTE)}>
          <ListItemIcon>
            <HelpOutlineIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Non noté</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

export default CorrectionStatusToggle;