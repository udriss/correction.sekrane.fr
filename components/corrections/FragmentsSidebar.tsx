import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Paper, Typography, FormControl, InputLabel, Select, MenuItem, CircularProgress, Button, TextField, Box, Dialog, DialogTitle, DialogContent, DialogActions, Chip, IconButton, SelectChangeEvent } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
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
  handleSaveFragment: (categories: number[]) => void;
  moveFragment: (dragIndex: number, hoverIndex: number) => void;
  correction: any;
  showAddFragment: boolean;
  setShowAddFragment: (show: boolean) => void;
  newFragmentContent: string;
  setNewFragmentContent: (content: string) => void;
  handleCreateNewFragmentWrapper: (e: React.FormEvent, categories?: number[]) => void;
  // Make the new props optional
  categories?: { id: number, name: string }[];
  loadingCategories?: boolean;
  fetchCategories?: () => void;
  handleDeleteCategory?: (id: number) => void;
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
  handleCreateNewFragmentWrapper,
  categories = [],
  loadingCategories = false,
  fetchCategories = () => {},
  handleDeleteCategory = () => {},
}) => {
  const [newFragmentCategories, setNewFragmentCategories] = useState<number[]>([]);
  const [showNewCategoryDialog, setShowNewCategoryDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  const handleFragmentEdit = (fragment: Fragment) => {
    if (fragment && fragment.id !== undefined) {
      handleEditFragment(fragment.id, fragment.content);
    }
  };

  const handleNewCategorySubmit = async () => {
    if (!newCategoryName.trim()) return;
    
    try {
      // Appel API pour créer une nouvelle catégorie
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newCategoryName }),
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la création de la catégorie');
      }
      
      // Récupérer la nouvelle catégorie créée
      const newCategory = await response.json();
      
      // Rafraîchir la liste des catégories
      fetchCategories();
      
      // Ajouter la nouvelle catégorie à la sélection actuelle
      setNewFragmentCategories(prev => [...prev, newCategory.id]);
      
      // Réinitialiser et fermer le dialogue
      setNewCategoryName('');
      setShowNewCategoryDialog(false);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  // Update the type signature to match Material-UI's SelectChangeEvent
  const handleFragmentCategoryChange = (event: SelectChangeEvent<number[]>) => {
    setNewFragmentCategories(event.target.value as number[]);
  };

  return (
    <Paper className="p-4 shadow">
      <Box className="flex flex-col space-y-2 mb-4">
        
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
      </Box>

      {loadingFragments ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <CircularProgress size={24} />
        </Box>
      ) : fragments.length === 0 ? (
        <Typography color="textSecondary" sx={{ p: 2, textAlign: 'center', fontStyle: 'italic' }}>
          Aucun fragment disponible pour cette activité.
        </Typography>
      ) : (
        <Box sx={{ maxHeight: 500, overflowY: 'auto', p: 0.5, '& > *': { mb: 1.5 } }}>
          {fragments.map((fragment, index) => (
            <FragmentItem
              key={fragment.id}
              fragment={fragment}
              index={index}
              editingFragmentId={editingFragmentId}
              editedFragmentContent={editedFragmentContent}
              savingFragment={savingFragment}
              deletingIds={deletingIds}
              categories={categories}
              handleAddFragment={handleAddFragment}
              handleDeleteFragment={handleDeleteFragment}
              handleEditFragment={(id) => handleFragmentEdit({id, content: ''} as Fragment)}
              handleCancelEditFragment={handleCancelEditFragment}
              handleSaveFragment={handleSaveFragment}
              setEditedFragmentContent={setEditedFragmentContent}
              moveFragment={moveFragment}
              handleDeleteCategory={handleDeleteCategory}
            />
          ))}
        </Box>
      )}
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, my: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
          <Paper variant="outlined" sx={{ p: 2 }}>
            <form onSubmit={(e) => handleCreateNewFragmentWrapper(e, newFragmentCategories)}>
              <Box sx={{ mb: 2 }}>
                <TextField
                  value={newFragmentContent}
                  onChange={(e) => setNewFragmentContent(e.target.value)}
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Contenu du nouveau fragment..."
                  variant="outlined"
                  required
                  size="small"
                />
              </Box>

              {/* Sélection des catégories pour le nouveau fragment */}
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel id="new-fragment-categories-label">Catégories</InputLabel>
                <Select
                  labelId="new-fragment-categories-label"
                  multiple
                  value={newFragmentCategories}
                  onChange={handleFragmentCategoryChange}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as number[]).map((value) => {
                        const category = categories.find(cat => cat.id === value);
                        return (
                          <Chip 
                            key={value} 
                            label={category ? category.name : 'Inconnu'} 
                            size="small" 
                          />
                        );
                      })}
                    </Box>
                  )}
                >
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      {category.name}
                      <IconButton 
                        size="small" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCategory(category.id);
                        }}
                        sx={{ ml: 1, color: 'error.main' }}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </MenuItem>
                  ))}
                  <MenuItem onClick={() => setShowNewCategoryDialog(true)}>
                    <Box sx={{ display: 'flex', alignItems: 'center', color: 'primary.main' }}>
                      <AddIcon fontSize="small" sx={{ mr: 1 }} />
                      Nouvelle catégorie
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>

              <Button
                type="submit"
                disabled={addingFragment || !newFragmentContent.trim()}
                variant="contained"
                color="success"
                size="small"
                startIcon={<AddIcon />}
              >
                {addingFragment ? 'Ajout en cours...' : 'Ajouter le fragment'}
              </Button>
            </form>
          </Paper>
        )}
      </Box>

      {/* Dialog pour ajouter une nouvelle catégorie */}
      <Dialog open={showNewCategoryDialog} onClose={() => setShowNewCategoryDialog(false)}>
        <DialogTitle>Ajouter une nouvelle catégorie</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nom de la catégorie"
            type="text"
            fullWidth
            variant="outlined"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowNewCategoryDialog(false)} color="inherit">
            Annuler
          </Button>
          <Button onClick={handleNewCategorySubmit} color="primary" disabled={!newCategoryName.trim()}>
            Ajouter
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default FragmentsSidebar;
