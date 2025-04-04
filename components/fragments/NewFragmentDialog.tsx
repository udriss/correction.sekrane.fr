import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  alpha,
  Theme
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { FragmentForm } from '@/components/fragments';

interface Fragment {
  id: number;
  content: string;
  category?: string;
  tags: string[];
  activity_id?: number;
  activity_name?: string;
  created_at: string;
  usage_count?: number;
  isOwner?: boolean;
  user_id?: string;
  categories?: Array<{id: number, name: string}> | number[];
}

interface Category {
  id: number;
  name: string;
}

interface NewFragmentDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  creatingSuccess: boolean;
  selectedActivityId: number | null;
  setSelectedActivityId: (id: number | null) => void;
  activities: Array<{id: number, name: string}>;
  loadingActivities: boolean;
  categories: Category[];
  onSuccess: (fragment: Fragment) => void;
  fetchCategories: () => Promise<void>; // Modifié ici pour retourner Promise<void>
  theme: Theme;
}

export const NewFragmentDialog: React.FC<NewFragmentDialogProps> = ({
  open,
  setOpen,
  creatingSuccess,
  selectedActivityId,
  setSelectedActivityId,
  activities,
  loadingActivities,
  categories,
  onSuccess,
  fetchCategories,
  theme
}) => {
  return (
    <Dialog
      open={open}
      onClose={() => !creatingSuccess && setOpen(false)}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.2)}`
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Ajouter un nouveau fragment
        <IconButton 
          edge="end" 
          color="warning"
          onClick={() => setOpen(false)} 
          aria-label="close"
          disabled={creatingSuccess}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {creatingSuccess ? (
          <Alert severity="success" sx={{ my: 2 }}>
            Fragment ajouté avec succès!
          </Alert>
        ) : (
          <Box sx={{ pt: 2 }}>
            {/* Sélecteur d'activité avec option "Aucune activité" */}
            <FormControl fullWidth margin="normal" sx={{ mb: 3 }}>
              <InputLabel id="activity-select-label">Activité</InputLabel>
              <Select
                labelId="activity-select-label"
                value={selectedActivityId === null ? 'null' : (selectedActivityId || '')}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === 'null') {
                    setSelectedActivityId(null);
                  } else {
                    setSelectedActivityId(Number(value));
                  }
                }}
                label="Activité"
                disabled={loadingActivities}
              >
                <MenuItem value="null">
                  <em>Aucune activité</em>
                </MenuItem>
                {activities.map((activity) => (
                  <MenuItem key={activity.id} value={activity.id}>
                    {activity.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {/* Formulaire de création de fragment avec activityId qui peut être null */}
            <FragmentForm 
              activityId={selectedActivityId === null ? undefined : selectedActivityId} // Convert null to undefined
              categories={categories}
              onSuccess={onSuccess}
              onCancel={() => setOpen(false)}
              refreshCategories={fetchCategories}
            />
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};
