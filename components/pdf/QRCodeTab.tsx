import React from 'react';
import { 
  Typography, 
  Box, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Button
} from '@mui/material';
import { useSnackbar } from 'notistack';
import QrCodeIcon from '@mui/icons-material/QrCode';
import { Student } from '@/lib/types';
import { Correction as ProviderCorrection } from '@/app/components/CorrectionsDataProvider';
import { Correction } from '@/lib/types';
interface QRCodeTabProps {
  classData: any;
  filteredCorrections: ProviderCorrection[];
  filterActivity: number | 'all';
  setFilterActivity: (value: number | 'all') => void;
  filterSubClass: string | 'all';
  setFilterSubClass: (value: string | 'all') => void;
  uniqueSubClasses: { id: number | string; name: string }[];
  uniqueActivities: { id: number | string; name: string }[];
  students: Student[];
  activities: any[];
}

const QRCodeTab: React.FC<QRCodeTabProps> = ({
  classData,
  filteredCorrections,
  filterActivity,
  setFilterActivity,
  filterSubClass,
  setFilterSubClass,
  uniqueSubClasses,
  uniqueActivities,
  students,
  activities
}) => {
  const { enqueueSnackbar } = useSnackbar();

  // Fonction pour générer un PDF avec les QR codes
  const generateQRCodePDF = async () => {
    try {
      // Récupérer d'abord les codes de partage pour les corrections qui n'en ont pas
      const correctionsWithoutQR = filteredCorrections.filter(c => 
        !('shareCode' in c) || !(c as any).shareCode
      );
    
      if (correctionsWithoutQR.length > 0) {
        // Créer des codes de partage en lot
        const correctionIds = correctionsWithoutQR.map(c => c.id);
        await fetch('/api/share/batch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ correctionIds }),
        });
      }
      
      // Générer le nom du groupe pour le titre du PDF
      const groupName = filterSubClass !== 'all' 
        ? uniqueSubClasses.find(g => g.id.toString() === filterSubClass)?.name 
        : classData.name;
      
      // Générer le nom de l'activité pour le titre du PDF
      const activityName = filterActivity !== 'all'
        ? uniqueActivities.find(a => a.id === filterActivity)?.name
        : 'Toutes les activités';
      
      const { generateQRCodePDF } = await import('@/utils/BACK_qrGeneratorPDF');
      
      await generateQRCodePDF({
        corrections: filteredCorrections,
        group: {
          name: groupName || 'Classe',
          activity_name: activityName || 'Activité'
        },
        students,
        activities
      });
      
      // Afficher message de succès
      enqueueSnackbar('PDF des QR codes généré avec succès', { variant: 'success' });
      
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      enqueueSnackbar('Erreur lors de la génération du PDF', { variant: 'error' });
    }
  };

  return (
    <Box>
      <Typography variant="body2" paragraph>
        Générez des PDFs contenant les QR codes d'accès aux corrections pour les étudiants.
      </Typography>
      
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>Options d'export</Typography>
        
        {classData?.nbre_subclasses && classData.nbre_subclasses > 0 && (
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Groupe</InputLabel>
            <Select
              value={filterSubClass}
              onChange={(e) => setFilterSubClass(e.target.value as string)}
              label="Groupe"
            >
              <MenuItem value="all">Tous les groupes</MenuItem>
              {uniqueSubClasses.map(group => (
                <MenuItem key={group.id} value={group.id.toString()}>
                  {group.name}
                </MenuItem>
              ))}
            </Select>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              Sélectionnez un groupe spécifique ou exportez pour tous les groupes
            </Typography>
          </FormControl>
        )}

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Activité</InputLabel>
          <Select
            value={filterActivity}
            onChange={(e) => setFilterActivity(e.target.value as number | 'all')}
            label="Activité"
          >
            <MenuItem value="all">Toutes les activités</MenuItem>
            {uniqueActivities.map(activity => (
              <MenuItem key={activity.id} value={activity.id}>
                {activity.name}
              </MenuItem>
            ))}
          </Select>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
            Sélectionnez une activité spécifique ou exportez pour toutes les activités
          </Typography>
        </FormControl>
        
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Button
            variant="contained"
            startIcon={<QrCodeIcon />}
            disabled={filteredCorrections.length === 0}
            onClick={generateQRCodePDF}
            size="large"
          >
            Générer PDF des QR codes
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default QRCodeTab;