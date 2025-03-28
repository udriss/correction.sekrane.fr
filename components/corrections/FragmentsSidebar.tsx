import React from 'react';
import Link from 'next/link';
import { Paper, Typography, FormControl, InputLabel, Select, MenuItem, CircularProgress, Button, TextField, Box } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FragmentItem from './FragmentItem';
import { Fragment } from '@/lib/types'; 

interface FragmentsSidebarProps {
  fragments: Fragment[];
  activities: any[];
  selectedActivityId: number | null;
  loadingActivities: boolean;
  loadingFragments: boolean;
  addingFragment: boolean;
  editingFragmentId: number | null;
  editedFragmentContent: string;
  savingFragment: boolean;
  deletingIds: number[];
  setSelectedActivityId: (id: number) => void;
  setEditedFragmentContent: (content: string) => void;
  handleActivityChange: (event: any) => void;
  handleAddFragment: (fragment: Fragment) => void;
  handleDeleteFragment: (id: number) => void;
  handleEditFragment: (id: number, content: string) => void;
  handleCancelEditFragment: () => void;
  handleSaveFragment: () => void;
  moveFragment: (dragIndex: number, hoverIndex: number) => void;
  correction: any;
  showAddFragment: boolean;
  setShowAddFragment: (show: boolean) => void;
  newFragmentContent: string;
  setNewFragmentContent: (content: string) => void;
  handleCreateNewFragmentWrapper: (e: React.FormEvent) => void;
}

const FragmentsSidebar: React.FC<FragmentsSidebarProps> = ({
  fragments,
  activities,
  selectedActivityId,
  loadingActivities,
  loadingFragments,
  addingFragment,
  editingFragmentId,
  editedFragmentContent,
  savingFragment,
  deletingIds,
  setSelectedActivityId,
  setEditedFragmentContent,
  handleActivityChange,
  handleAddFragment,
  handleDeleteFragment,
  handleEditFragment,
  handleCancelEditFragment,
  handleSaveFragment,
  moveFragment,
  correction,
  showAddFragment,
  setShowAddFragment,
  newFragmentContent,
  setNewFragmentContent,
  handleCreateNewFragmentWrapper
}) => {
  const handleFragmentEdit = (fragment: Fragment) => {
    if (fragment && fragment.id !== undefined) {
      handleEditFragment(fragment.id, fragment.content);
    }
  };

  return (
    <Paper className="p-4 shadow">
      <div className="flex flex-col space-y-2 mb-4">
        <Typography variant="h6" className="mb-0">Fragments disponibles</Typography>
        
        <FormControl fullWidth size="small" margin="normal">
          <InputLabel id="activity-select-label">Activité</InputLabel>
          <Select
            labelId="activity-select-label"
            value={selectedActivityId || ''}
            onChange={handleActivityChange}
            label="Activité"
            disabled={loadingActivities}
          >
            {activities.map((activity) => (
              <MenuItem key={activity.id} value={activity.id}>
                {activity.name} 
                {correction && activity.id === correction.activity_id ? ' (courante)' : ''}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>

      {loadingFragments ? (
        <div className="flex justify-center p-4">
          <CircularProgress size={24} />
        </div>
      ) : fragments.length === 0 ? (
        <Typography color="textSecondary" className="p-4 text-center italic">
          Aucun fragment disponible pour cette activité.
        </Typography>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto p-1">
          {fragments.map((fragment, index) => (
            <FragmentItem
              key={fragment.id}
              fragment={fragment}
              index={index}
              editingFragmentId={editingFragmentId}
              editedFragmentContent={editedFragmentContent}
              savingFragment={savingFragment}
              deletingIds={deletingIds}
              handleAddFragment={handleAddFragment}
              handleDeleteFragment={handleDeleteFragment}
              handleEditFragment={(id) => handleFragmentEdit({id, content: ''} as Fragment)}
              handleCancelEditFragment={handleCancelEditFragment}
              handleSaveFragment={handleSaveFragment}
              setEditedFragmentContent={setEditedFragmentContent}
              moveFragment={moveFragment}
            />
          ))}
        </div>
      )}
      
      <Box className="flex flex-col space-y-4 my-4">
        <Box className="flex items-center justify-between">
          {selectedActivityId === correction?.activity_id && (
            <Button
              onClick={() => setShowAddFragment(!showAddFragment)}
              color="primary"
              variant="text"
              size="small"
            >
              {showAddFragment ? 'Annuler' : 'Nouveau'}
            </Button>
          )}
          <Button
            component={Link}
            href={`/activities/${selectedActivityId}/fragments`}
            color="primary"
            variant="text"
            size="small"
          >
            Gérer les fragments
          </Button>
        </Box>

        {showAddFragment && selectedActivityId === correction?.activity_id && (
          <Paper variant="outlined" className="p-4">
            <form onSubmit={handleCreateNewFragmentWrapper}>
              <div className="mb-3">
                <TextField
                  value={newFragmentContent}
                  onChange={(e) => setNewFragmentContent(e.target.value)}
                  className="w-full"
                  multiline
                  rows={3}
                  placeholder="Contenu du nouveau fragment..."
                  variant="outlined"
                  required
                  size="small"
                />
              </div>
              <Button
                type="submit"
                disabled={addingFragment || !newFragmentContent.trim()}
                variant="contained"
                color="success"
                size="small"
              >
                <AddIcon sx={{ mr: 0.2 }} />
                {addingFragment ? 'Ajout en cours...' : 'Ajouter le fragment'}
              </Button>
            </form>
          </Paper>
        )}
      </Box>
    </Paper>
  );
};

export default FragmentsSidebar;
