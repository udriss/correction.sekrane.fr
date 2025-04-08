import React from 'react';
import Link from 'next/link';
import { Correction } from '@/lib/types';
import { Activity } from '@/lib/activity';
import { useRouter } from 'next/navigation';
import { 
  Button, 
  IconButton, 
  Typography, 
  Box, 
  CircularProgress, 
  Tooltip, 
} from '@mui/material';
import Grid from '@mui/material/Grid';

import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import GroupsIcon from '@mui/icons-material/Groups';

interface CorrectionsListProps {
  corrections: Correction[];
  activity: Activity | null;
  activityId: string;
  isEditing: boolean;
  isProcessing: boolean;
  correctionToDelete: number | null;
  onNewCorrection: () => void;
  onDeleteCorrection: (correctionId: number) => void;
  onConfirmDelete: (correctionId: number) => Promise<void>;
  onCancelDelete: () => void;
  // Ajouter la fonction getStudentFullName aux props
  getStudentFullName?: (studentId: number | null) => string;
}

const CorrectionsList: React.FC<CorrectionsListProps> = ({
  corrections,
  activity,
  activityId,
  isEditing,
  isProcessing,
  correctionToDelete,
  onNewCorrection,
  onDeleteCorrection,
  onConfirmDelete,
  onCancelDelete,
  // Inclure getStudentFullName avec une valeur par défaut
  getStudentFullName = (studentId) => "Sans nomnom", // Fonction par défaut si non fournie
}) => {
  return (
    <>
      <div className="flex justify-end items-center mb-4">
      <div className="flex space-x-2">
            <IconButton
              onClick={onNewCorrection}
              color="success"
              size="medium"
              title="Nouvelle correction"
            >
              <AddIcon />
            </IconButton>
            
            {/* Buttons for multiple corrections and groups */}
            <Button
              component={Link}
              href={`/corrections/multiples?activityId=${activityId}`}
              variant="outlined"
              size="small"
              color='success'
              startIcon={<PeopleAltIcon />}
            >
              Corrections en lot
            </Button>
            {activityId && (
              <Button
                variant="outlined"
                color="primary"
                startIcon={<GroupsIcon />}
                component={Link}
                href={`/activities/${activityId}/groups`}
              >
                Groupes
              </Button>
            )}
          </div>
      </div>
      
      {corrections.length === 0 ? (
        <div className=" p-4 rounded border border-gray-200 text-center">
          <Typography color="textSecondary" sx={{ mb: 2 }}>
            Aucune correction pour cette activité.
          </Typography>
          {!isEditing && (
            <Button
              onClick={onNewCorrection}
              variant="contained" 
              color="primary"
              size="small"
              className="mt-3"
              startIcon={<AddIcon />}
            >
              Ajouter une correction
            </Button>
          )}
        </div>
      ) : (
        <Grid container spacing={2}>
          {corrections.map((correction) => (
            <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }} key={correction.id}>
              <Box
                sx={{
                  position: 'relative',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  p: 2,
                  boxShadow: 1,
                  transition: 'box-shadow 0.3s',
                  '&:hover': {
                    boxShadow: 2
                  }
                }}
              >
                {/* Grade display in top right */}
                {correction.grade !== null && correction.grade !== undefined && (
                  <Box sx={{ position: 'absolute', top: 12, right: 12 }}>
                    <Typography variant="subtitle2">
                      {correction.grade} / {(activity?.experimental_points ?? 5) + (activity?.theoretical_points ?? 15)}
                    </Typography>
                  </Box>
                )}
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2, pr: 5 }}>
                  <Typography variant="subtitle1" fontWeight="bold" noWrap>
                    {/* Utiliser getStudentFullName à la place de student_name */}
                    {getStudentFullName(correction.student_id) || `${activity?.name} - Sans nom`}
                  </Typography>
                  <Typography variant="body2" color="text.primary">
                    Ajoutée le {new Date(correction.created_at!).toLocaleString('fr-FR')}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Button
                    component={Link}
                    href={`/corrections/${correction.id}`}
                    variant="outlined"
                    size="small"
                  >
                    Éditer la correction
                  </Button>
                  {correction.grade === null && (
                    <Typography variant="caption" color="text.primary" sx={{ fontStyle: 'italic' }}>
                      Non notée
                    </Typography>
                  )}
                  
                  {/* Delete confirmation buttons */}
                  {correctionToDelete === correction.id ? (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Annuler">
                        <IconButton 
                          onClick={onCancelDelete}
                          size="small"
                          disabled={isProcessing}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Confirmer la suppression">
                        <IconButton 
                          color="error"
                          onClick={() => onConfirmDelete(correction.id)}
                          size="small"
                          disabled={isProcessing}
                        >
                          {isProcessing ? <CircularProgress size={20} /> : <CheckIcon fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                    </Box>
                  ) : (
                    <Tooltip title="Supprimer cette correction">
                      <IconButton
                        onClick={() => onDeleteCorrection(correction.id)}
                        color="error"
                        size="small"
                      >
                        <DeleteForeverIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      )}
    </>
  );
};

export default CorrectionsList;
