import React from 'react';
import Link from 'next/link';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Button
} from '@mui/material';
import Domain from '@mui/icons-material/Domain';
import CalendarToday from '@mui/icons-material/CalendarToday';
import Description from '@mui/icons-material/Description';
import Groups from '@mui/icons-material/Groups';
import Event from '@mui/icons-material/Event';
import Share from '@mui/icons-material/Share';
import PictureAsPdf from '@mui/icons-material/PictureAsPdf';
import ArrowForwardIos from '@mui/icons-material/ArrowForwardIos';
import PersonAddAlt from '@mui/icons-material/PersonAddAlt';

type InfoCardsProps = {
  group: {
    name: string;
    activity_name?: string;
    created_at: string;
    description?: string;
  } | null;
  activityId: string;
  corrections: Array<any>;
  activity: {
    experimental_points: number;
    theoretical_points: number;
  } | null;
  isSharing: boolean;
  handleShareCorrections: () => void;
  generatePdfLoading: boolean;
  handleGeneratePdfReport: () => void;
  setAddCorrectionsModalOpen: (open: boolean) => void;
  calculateAverage: () => string;
};

const InfoCards: React.FC<InfoCardsProps> = ({
  group,
  activityId,
  corrections,
  activity,
  isSharing,
  handleShareCorrections,
  generatePdfLoading,
  handleGeneratePdfReport,
  setAddCorrectionsModalOpen,
  calculateAverage
}) => {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1.5fr' }, gap: 3, mb: 4 }}>
      {/* Carte des infos du groupe */}
      <Card sx={{ 
        height: '100%', 
        display: 'flex',
        flexDirection: 'column',
        borderTop: '4px solid #3f51b5'
      }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Domain color="primary" />
            <Typography variant="h6" fontWeight="bold">
              Informations
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <CalendarToday fontSize="small" color="action" />
            <Typography variant="body1">
              {group ? new Date(group.created_at).toLocaleDateString() : '-'}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <Description fontSize="small" color="action" sx={{ mt: 0.5 }} />
            <Box>
              <Typography variant="body2" color="text.secondary">
                Description:
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {group?.description || "Aucune description disponible"}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Carte des statistiques */}
      <Card sx={{ 
        height: '100%',
        borderTop: '4px solid #4caf50'
      }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Groups color="success" />
            <Typography variant="h6" fontWeight="bold">
              Statistiques
            </Typography>
          </Box>
          
          <Box sx={{ textAlign: 'center', py: 1 }}>
            <Typography variant="h3" color="primary" fontWeight="bold">
              {corrections.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {corrections.length > 1 ? 'Corrections' : 'Correction'}
            </Typography>
          </Box>
          
          {corrections.length > 0 && (
            <Box sx={{ textAlign: 'center', mt: 2, py: 1, bgcolor: 'background.default', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Note moyenne
              </Typography>
              <Typography variant="h5" color="primary" fontWeight="bold" sx={{ mt: '4px' }}>
                {calculateAverage()} / {(activity?.experimental_points || 5) + (activity?.theoretical_points || 15)}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Carte des actions */}
      <Card sx={{ 
        height: '100%',
        borderTop: '4px solid #ff9800'
      }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Event color="warning" />
            <Typography variant="h6" fontWeight="bold">
              Actions
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Share />}
              onClick={handleShareCorrections}
              disabled={isSharing || corrections.length === 0}
              fullWidth
            >
              {isSharing ? 'Partage en cours...' : 'Partager tout'}
            </Button>
            
            <Button
              variant="contained"
              color="warning"
              startIcon={<PictureAsPdf />}
              onClick={handleGeneratePdfReport}
              disabled={generatePdfLoading || corrections.length === 0}
              fullWidth
            >
              {generatePdfLoading ? 'Génération...' : 'Rapport PDF'}
            </Button>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => setAddCorrectionsModalOpen(true)}
              startIcon={<PersonAddAlt />}
              >
              Ajouter des corrections
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              component={Link}
              endIcon={<ArrowForwardIos />}
              fullWidth
            >
              Nouveau groupe
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default InfoCards;
