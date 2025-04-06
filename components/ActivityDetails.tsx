import React from 'react';
import { Activity } from '@/lib/activity';
import { 
  IconButton, 
  Typography, 
  TextField, 
  Paper,
  Box,
  Chip,
} from '@mui/material';

import EditIcon from '@mui/icons-material/Edit';
import BarChartIcon from '@mui/icons-material/BarChart';
import Grid from '@mui/material/Grid';

interface ActivityDetailsProps {
  activity: Activity;
  isEditing: boolean;
  content: string;
  experimentalPoints: number;
  theoreticalPoints: number;
  onEditClick: () => void;
  onContentChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handlePointsChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    setter: React.Dispatch<React.SetStateAction<number>>,
    otherValue: number,
    isExperimental: boolean
  ) => void;
  setExperimentalPoints: React.Dispatch<React.SetStateAction<number>>;
  setTheoreticalPoints: React.Dispatch<React.SetStateAction<number>>;
}

const ActivityDetails: React.FC<ActivityDetailsProps> = ({
  activity,
  isEditing,
  content,
  experimentalPoints,
  theoreticalPoints,
  onEditClick,
  onContentChange,
  handlePointsChange,
  setExperimentalPoints,
  setTheoreticalPoints
}) => {
  return (
    <>
      {/* Description de l'activité */}
      <Paper className="p-4 rounded-lg mb-8">
        <div className="flex items-center justify-between mb-2">
        <Box display="flex" alignItems="center" className="mb-2">
          <Typography variant="h6" component="h6" sx={{ fontWeight: 'bold'}}>
            Description de l'activité
          </Typography>
          </Box>
          {!isEditing && (
            <IconButton
              onClick={onEditClick}
              size="small"
              color="primary"
              aria-label="edit"
            >
              <EditIcon fontSize="small" />
            </IconButton>
          )}
        </div>
        {isEditing ? (
          <TextField
            value={content}
            onChange={onContentChange}
            multiline
            rows={4}
            variant="outlined"
            fullWidth
            placeholder="Description de l'activité (facultative)"
            size="small"
          />
        ) : activity.content ? (

            `${activity.content}`
          
        ) : (
          
            "Aucune description fournie"
          
        )}
      </Paper>
      
      {/* Barème de notation */}
      <Paper className="p-4 rounded-lg mb-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <BarChartIcon className="mr-2 text-blue-500" />
            <h2 className="text-xl font-semibold">Barème de notation</h2>
          </div>
          {!isEditing && (
            <IconButton
              onClick={onEditClick}
              size="small"
              color="primary"
              aria-label="edit"
            >
              <EditIcon fontSize="small" />
            </IconButton>
          )}
        </div>
        {isEditing ? (
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <div className="flex flex-col md:flex-row gap-4 mb-2">
              <div className="flex-1">
                <TextField
                  label="Points partie expérimentale"
                  type="number"
                  slotProps={{
                    input: { 
                      inputProps: { min: 0 }
                    }
                  }}
                  value={experimentalPoints}
                  onChange={(e) => handlePointsChange(e, setExperimentalPoints, theoreticalPoints, true)}
                  variant="outlined"
                  size="small"
                  fullWidth
                />
              </div>
              <div className="flex-1">
                <TextField
                  label="Points partie théorique"
                  type="number"
                  slotProps={{
                    input: { 
                      inputProps: { min: 0 }
                    }
                  }}
                  value={theoreticalPoints}
                  onChange={(e) => handlePointsChange(e, setTheoreticalPoints, experimentalPoints, false)}
                  variant="outlined"
                  size="small"
                  fullWidth
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Définissez le nombre de points pour chaque partie
              </div>
              <div className="font-medium">
                Total: <span className="font-bold">{experimentalPoints + theoreticalPoints} points</span>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <div className="p-3 rounded border border-gray-200">
                  <p className="font-medium">Partie expérimentale :</p>
                  <p className="text-2xl font-bold text-blue-600">{activity.experimental_points || 5} points</p>
                </div>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <div className="p-3 rounded border border-gray-200">
                  <p className="font-medium">Partie théorique :</p>
                  <p className="text-2xl font-bold text-blue-600">{activity.theoretical_points || 15} points</p>
                </div>
              </Grid>
            </Grid>
            <div className="text-right mt-3">
              <Chip
              label={`Total : ${experimentalPoints + theoreticalPoints} points`}
              color={(experimentalPoints + theoreticalPoints) > 0 ? "success" : "warning"}
              sx={{ fontWeight: 'bold', fontSize: '1rem' }}
            />
            </div>
          </div>
        )}
      </Paper>
    </>
  );
};

export default ActivityDetails;
