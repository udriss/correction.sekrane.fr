import React from 'react';
import {
  Typography,
  Paper,
  Box,
  TextField,
  Button,
  Divider
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';

type GroupEditFormProps = {
  editedName: string;
  setEditedName: (name: string) => void;
  editedDescription: string;
  setEditedDescription: (desc: string) => void;
  handleSaveChanges: () => void;
  handleCancelEdit: () => void;
  isSaving: boolean;
};

const GroupEditForm: React.FC<GroupEditFormProps> = ({
  editedName,
  setEditedName,
  editedDescription,
  setEditedDescription,
  handleSaveChanges,
  handleCancelEdit,
  isSaving
}) => {
  return (
    <Paper className="p-4 mb-6">
      <div className="space-y-4">
        <Typography variant="h6" className="mb-2">Modifier le groupe</Typography>
        <Divider className="mb-3" />
        
        <TextField
          label="Nom du groupe"
          value={editedName}
          onChange={(e) => setEditedName(e.target.value)}
          fullWidth
          margin="normal"
          required
          error={!editedName.trim()}
          helperText={!editedName.trim() && "Le nom du groupe est requis"}
        />
        
        <TextField
          label="Description (optionnelle)"
          value={editedDescription}
          onChange={(e) => setEditedDescription(e.target.value)}
          fullWidth
          margin="normal"
          multiline
          rows={3}
        />
        
        <Box display="flex" justifyContent="flex-end" gap={2} mt={2}>
          <Button
            variant="outlined"
            color="inherit"
            onClick={handleCancelEdit}
            disabled={isSaving}
          >
            <CloseIcon />
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveChanges}
            disabled={isSaving || !editedName.trim()}
          >
            {isSaving ? 'Enregistrement ...' : <SaveIcon />}
          </Button>
        </Box>
      </div>
    </Paper>
  );
};

export default GroupEditForm;
