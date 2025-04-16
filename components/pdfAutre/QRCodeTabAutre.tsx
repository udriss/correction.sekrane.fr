import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  FormControlLabel, 
  Checkbox,
  Grid,
  Alert,
  CircularProgress
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { Student, CorrectionAutreEnriched, ActivityAutre } from '@/lib/types';
import { useSnackbar } from 'notistack';
import {generateQRCodePDF} from '@/utils/qrGeneratorPDF'


interface QRCodeTabAutreProps {
  classData: any;
  filteredCorrections: CorrectionAutreEnriched[];
  filterActivity: number | 'all';
  setFilterActivity: (value: number | 'all') => void;
  filterSubClass: string | 'all';
  setFilterSubClass: (value: string | 'all') => void;
  uniqueSubClasses: { id: string; name: string }[];
  uniqueActivities: { id: number; name: string }[];
  students: Student[];
  activities: ActivityAutre[];
  getBatchShareCodes?: (correctionIds: (string | number)[]) => Promise<Map<string, string> | Record<string, string>>;
}

const QRCodeTabAutre: React.FC<QRCodeTabAutreProps> = ({
  classData,
  filteredCorrections,
  filterActivity,
  setFilterActivity,
  filterSubClass,
  setFilterSubClass,
  uniqueSubClasses,
  uniqueActivities,
  students,
  activities,
  getBatchShareCodes
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [includeDetails, setIncludeDetails] = useState(true);
  const [loadingShareCodes, setLoadingShareCodes] = useState(false);

  // Générer les codes de partage pour toutes les corrections filtrées et créer le PDF
  const generateShareCodes = async () => {
    try {
      setLoadingShareCodes(true);

      // Générer le nom du groupe pour le titre du PDF
      const groupName = filterSubClass !== 'all' 
        ? uniqueSubClasses.find(g => g.id.toString() === filterSubClass)?.name 
        : classData.name;
      
      // Générer le nom de l'activité pour le titre du PDF
      const activityName = filterActivity !== 'all'
        ? uniqueActivities.find(a => a.id === filterActivity)?.name
        : 'Toutes les activités';
      
      await generateQRCodePDF({
        corrections: filteredCorrections,
        group: {
          name: groupName || 'Classe indeterminée',
          activity_name: activityName || 'Activité indeterminée'
        },
        // generateShareCode: async (correctionId) => {
        //   const response = await fetch(`/api/corrections_autres/${correctionId}/share`, {
        //     method: 'POST',
        //   });
        //   const data = await response.json();
        //   return { isNew: true, code: data.code };
        // },
        // getExistingShareCode: async (correctionId) => {
        //   const response = await fetch(`/api/corrections_autres/${correctionId}/share`);
        //   const data = await response.json();
        //   return { exists: data.exists, code: data.code };
        // },
        students,
        activities,
        includeDetails: includeDetails
      });
      
      // Afficher message de succès
      enqueueSnackbar('PDF des QR codes généré avec succès', { variant: 'success' });
      
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      enqueueSnackbar('Erreur lors de la génération du PDF', { variant: 'error' });
    } finally {
      setLoadingShareCodes(false);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Options d'export QR Code
        </Typography>
        
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="filter-activity-label">Activité</InputLabel>
              <Select
                labelId="filter-activity-label"
                value={filterActivity}
                label="Activité"
                onChange={(e) => setFilterActivity(e.target.value as number | 'all')}
              >
                <MenuItem value="all">Toutes les activités</MenuItem>
                {uniqueActivities.map((activity) => (
                  <MenuItem key={activity.id} value={activity.id}>
                    {activity.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          {uniqueSubClasses.length > 0 && (
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="filter-subclass-label">Groupe</InputLabel>
                <Select
                  labelId="filter-subclass-label"
                  value={filterSubClass}
                  label="Groupe"
                  onChange={(e) => setFilterSubClass(e.target.value as string)}
                >
                  <MenuItem value="all">Tous les groupes</MenuItem>
                  {uniqueSubClasses.map((subclass) => (
                    <MenuItem key={subclass.id} value={subclass.id}>
                      {subclass.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}
        </Grid>
        
        <Box>
          <FormControlLabel
            control={
              <Checkbox
                checked={includeDetails}
                onChange={(e) => setIncludeDetails(e.target.checked)}
              />
            }
            label="Inclure les détails (nom de l'élève, activité)"
          />
        </Box>
      </Box>
      
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={loadingShareCodes ? <CircularProgress size={20} /> : <FileDownloadIcon />}
          onClick={generateShareCodes}
          disabled={filteredCorrections.length === 0 || loadingShareCodes || !getBatchShareCodes}
        >
          Générer les QR codes
        </Button>
      </Box>
      
      {filteredCorrections.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          Aucune correction à exporter avec les filtres actuels
        </Alert>
      ) : (
        <Box sx={{ mt: 3 }}>
          <Typography variant="body2" color="text.secondary">
            {filteredCorrections.length} correction(s) prête(s) à être exportée(s)
          </Typography>
          {!getBatchShareCodes && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              La fonctionnalité de génération de QR codes n'est pas disponible
            </Alert>
          )}
        </Box>
      )}
    </Box>
  );
};

export default QRCodeTabAutre;