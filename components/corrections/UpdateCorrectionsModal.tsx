import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Checkbox,
  FormControlLabel,
  Alert,
  CircularProgress
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import WarningIcon from '@mui/icons-material/Warning';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import { CorrectionAutreEnriched, Student } from '@/lib/types';

interface UpdateCorrectionsModalProps {
  open: boolean;
  onClose: () => void;
  corrections: CorrectionAutreEnriched[];
  selectedCorrectionIds: number[];
  setSelectedCorrectionIds: (ids: number[]) => void;
  partsChanges: {
    added: { name: string; points: number }[];
    removed: { index: number; name: string; points: number }[];
  };
  isUpdating: boolean;
  onUpdateCorrections: () => Promise<void>;
  updateSuccess: boolean;
  updateError: string | null;
  students: Student[];
}

const UpdateCorrectionsModal: React.FC<UpdateCorrectionsModalProps> = ({
  open,
  onClose,
  corrections,
  selectedCorrectionIds,
  setSelectedCorrectionIds,
  partsChanges,
  isUpdating,
  onUpdateCorrections,
  updateSuccess,
  updateError,
  students
}) => {
  // État local pour gérer les sélections
  const [selectAll, setSelectAll] = useState(true);

  // Effet pour sélectionner/désélectionner toutes les corrections
  useEffect(() => {
    if (selectAll) {
      setSelectedCorrectionIds(corrections.map(c => c.id));
    } else {
      setSelectedCorrectionIds([]);
    }
  }, [selectAll, corrections, setSelectedCorrectionIds]);

  // Gérer la sélection/désélection d'une correction spécifique
  const handleCorrectionToggle = (correctionId: number) => {
    if (selectedCorrectionIds.includes(correctionId)) {
      setSelectedCorrectionIds(selectedCorrectionIds.filter(id => id !== correctionId));
      setSelectAll(false);
    } else {
      setSelectedCorrectionIds([...selectedCorrectionIds, correctionId]);
      if (selectedCorrectionIds.length + 1 === corrections.length) {
        setSelectAll(true);
      }
    }
  };

  // Formater les informations sur les étudiants
  const getStudentInfo = (correction: CorrectionAutreEnriched) => {
    const student = students.find(s => s.id === correction.student_id);
    if (student) {
      return `${student.first_name} ${student.last_name}`;
    }
    return `Étudiant #${correction.student_id}`;
  };

  return (
    <Dialog
      open={open}
      onClose={!isUpdating ? onClose : undefined}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="warning" />
          <Typography variant="h6">Mise à jour des corrections</Typography>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        {updateSuccess ? (
          <Alert severity="success" sx={{ mb: 2 }}>
            Les corrections ont été mises à jour avec succès !
          </Alert>
        ) : (
          <>
            <Typography variant="body1" gutterBottom>
              L'activité a été modifiée. Souhaitez-vous mettre à jour les corrections associées ?
            </Typography>

            <Box sx={{ mt: 2, mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                Changements détectés :
              </Typography>

              {partsChanges.added.length > 0 && (
                <Box sx={{ mt: 1, mb: 2 }}>
                  <Typography variant="subtitle2" color="success.main">
                    Parties ajoutées :
                  </Typography>
                  <List dense disablePadding>
                    {partsChanges.added.map((part, idx) => (
                      <ListItem key={`added-${idx}`} sx={{ py: 0.5 }}>
                        <ListItemIcon>
                          <AddCircleIcon color="success" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={`${part.name} (${part.points} points)`} 
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {partsChanges.removed.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="subtitle2" color="error.main">
                    Parties supprimées :
                  </Typography>
                  <List dense disablePadding>
                    {partsChanges.removed.map((part, idx) => (
                      <ListItem key={`removed-${idx}`} sx={{ py: 0.5 }}>
                        <ListItemIcon>
                          <RemoveCircleIcon color="error" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={`${part.name} (${part.points} points)`} 
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Box>

            <Alert severity="info" sx={{ mb: 3 }}>
              {partsChanges.added.length > 0 && !partsChanges.removed.length && (
                <Typography variant="body2">
                  Pour les parties ajoutées, une valeur de <strong>0</strong> sera attribuée aux nouvelles parties dans chaque correction sélectionnée.
                </Typography>
              )}
              {!partsChanges.added.length && partsChanges.removed.length > 0 && (
                <Typography variant="body2">
                  Pour les parties supprimées, les points correspondants seront retirés de chaque correction sélectionnée.
                </Typography>
              )}
              {partsChanges.added.length > 0 && partsChanges.removed.length > 0 && (
                <Typography variant="body2">
                  Les points des parties supprimées seront retirés et une valeur de <strong>0</strong> sera attribuée aux nouvelles parties dans chaque correction sélectionnée.
                </Typography>
              )}
            </Alert>

            {updateError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {updateError}
              </Alert>
            )}

            <Typography variant="subtitle1" gutterBottom>
              Sélectionner les corrections à mettre à jour :
            </Typography>

            <FormControlLabel
              control={
                <Checkbox
                  checked={selectAll}
                  onChange={(e) => setSelectAll(e.target.checked)}
                  disabled={isUpdating}
                />
              }
              label="Tout sélectionner/désélectionner"
            />

            <Box sx={{ mt: 1, maxHeight: '300px', overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <List dense>
                {corrections.map((correction) => (
                  <ListItem key={correction.id} divider>
                    <ListItemIcon>
                      <Checkbox
                        edge="start"
                        checked={selectedCorrectionIds.includes(correction.id)}
                        onChange={() => handleCorrectionToggle(correction.id)}
                        disabled={isUpdating}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={getStudentInfo(correction)}
                      secondary={`Note: ${correction.final_grade !== null ? correction.final_grade : 'Non noté'} / 20`}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
            
            {selectedCorrectionIds.length === 0 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                Aucune correction sélectionnée. Veuillez sélectionner au moins une correction à mettre à jour.
              </Alert>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isUpdating}>
          {updateSuccess ? 'Fermer' : 'Annuler'}
        </Button>
        {!updateSuccess && (
          <Button
            variant="contained"
            color="primary"
            onClick={onUpdateCorrections}
            disabled={isUpdating || selectedCorrectionIds.length === 0}
            startIcon={isUpdating ? <CircularProgress size={24} /> : <SaveIcon />}
          >
            {isUpdating ? 'Mise à jour en cours...' : 'Mettre à jour les corrections'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default UpdateCorrectionsModal;