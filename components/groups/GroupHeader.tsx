import React from 'react';
import Link from 'next/link';
import {
  Typography,
  Paper,
  Box,
  Button,
  IconButton
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import GroupsIcon from '@mui/icons-material/Groups';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

type GroupHeaderProps = {
  group: {
    name: string;
    activity_name: string;
  } | null;
  activityId: string;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  setGroupDeleteDialogOpen: (open: boolean) => void;
};

const GroupHeader: React.FC<GroupHeaderProps> = ({
  group,
  activityId,
  isEditing,
  setIsEditing,
  setGroupDeleteDialogOpen
}) => {
  return (
    <Paper 
      elevation={3} 
      sx={{ 
        borderRadius: '10px', 
        overflow: 'hidden',
        marginBottom: '24px',
        background: 'linear-gradient(90deg,rgb(10, 68, 125) 0%, #2c387e 100%)' // Dégradé bleu plus distinct
      }}
    >
      <Box 
        className="p-6 relative" 
        sx={{
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Motif de fond décoratif avec opacité augmentée */}
        <Box 
          sx={{ 
            position: 'absolute', 
            inset: 0, 
            opacity: 0.15, // Opacité légèrement augmentée pour meilleure visibilité
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            backgroundSize: '60px 60px'
          }}
        />
        
        {/* Contenu de l'en-tête */}
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <GroupsIcon sx={{ fontSize: 32, color: '#f0f4ff' }} /> {/* Bleu très clair pour l'icône */}
            <Typography variant="h4" fontWeight="bold" sx={{ color: '#f0f4ff' }}> {/* Bleu très clair pour le titre */}
              {group?.name || "Groupe sans nom"}
            </Typography>
            
            {/* IconButtons pour les actions principales */}
            <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
              {!isEditing && (
                <>
                  <IconButton
                    sx={{ 
                      color: '#f0f4ff', // Bleu très clair pour l'icône
                      bgcolor: 'rgba(255, 255, 255, 0.15)', // Semi-transparent pour le fond
                      '&:hover': { 
                        bgcolor: 'rgba(255, 255, 255, 0.25)',  // Plus visible au survol
                        boxShadow: '0 0 5px rgba(255,255,255,0.3)' // Effet de lueur
                      }
                    }}
                    onClick={() => setIsEditing(true)}
                    title="Modifier le groupe"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    sx={{ 
                      color: '#ffdddd', // Rouge pâle pour indiquer une action de suppression
                      bgcolor: 'rgba(255, 100, 100, 0.35)', // Fond légèrement rouge
                      '&:hover': { 
                        bgcolor: 'rgba(255, 100, 100, 0.55)',  // Plus rouge au survol
                        boxShadow: '0 0 5px rgba(255,150,150,0.8)' // Effet de lueur rouge
                      }
                    }}
                    onClick={() => setGroupDeleteDialogOpen(true)}
                    title="Supprimer le groupe"
                  >
                    <DeleteIcon />
                  </IconButton>
                </>
              )}
            </Box>
          </Box>
          
          <Typography variant="subtitle1" sx={{ color: '#d0e3ff', opacity: 0.95, mb: 2 }}> 
            {group?.activity_name || "Activité non spécifiée"}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 3 }}>
            <Button
              component={Link}
              href={`/activities/${activityId}/groups`}
              startIcon={<ArrowBackIcon />}
              variant="outlined"
              size="small"
              sx={{ 
                color: '#f0f4ff', // Bleu très clair
                borderColor: 'rgba(240,244,255,0.6)',
                '&:hover': { 
                  borderColor: '#f0f4ff',
                  backgroundColor: 'rgba(240,244,255,0.15)'
                }
              }}
            >
              Retour aux groupes
            </Button>
            
            <Button
              component={Link}
              href={`/activities/${activityId}`}
              variant="outlined"
              size="small"
              sx={{ 
                color: '#ddecff', // Bleu très clair légèrement différent
                borderColor: 'rgba(221,236,255,0.4)',
                '&:hover': { 
                  borderColor: '#ddecff',
                  backgroundColor: 'rgba(221,236,255,0.1)'
                }
              }}
            >
              Activité
            </Button>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

export default GroupHeader;
