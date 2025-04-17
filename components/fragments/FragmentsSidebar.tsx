import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Paper, Typography, FormControl, InputLabel, Select, MenuItem, 
  Box, Button, Divider, CircularProgress, Alert, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import ReorderIcon from '@mui/icons-material/Reorder';

import FragmentList from '@/components/fragments/FragmentList';
import FragmentForm from '@/components/fragments/FragmentForm';
import PositionModal from '@/components/fragments/PositionModal';
import { fetchCategories, fetchAllActivities, fetchFragmentsForActivity } from '@/lib/services/fragmentService';
import { Fragment } from '@/lib/types';

interface FragmentsSidebarProps {
  correctionActivityId?: number; // Au lieu de l'objet correction entier
  onAddFragmentToCorrection?: (fragment: Fragment) => void;
  inCorrectionContext?: boolean;
  activityId?: number;
}

const FragmentsSidebar: React.FC<FragmentsSidebarProps> = ({
  correctionActivityId,
  onAddFragmentToCorrection,
  inCorrectionContext = false,
  activityId: externalActivityId
}) => {
  // État général
  const [fragments, setFragments] = useState<Fragment[]>([]);
  const [activities, setActivities] = useState<Array<{id: number, name: string}>>([]);
  const [categories, setCategories] = useState<Array<{id: number, name: string}>>([]);
  
  // État d'affichage
  const [showAddForm, setShowAddForm] = useState(false);
  const [addFragmentDialogOpen, setAddFragmentDialogOpen] = useState(false); // Nouvel état pour le dialogue modal
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(null);
  const [editingFragmentId, setEditingFragmentId] = useState<number | null>(null);
  
  // État pour le modal de position
  const [positionModalOpen, setPositionModalOpen] = useState(false);
  const [selectedFragment, setSelectedFragment] = useState<Fragment | null>(null);
  
  // État de chargement
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [loadingFragments, setLoadingFragments] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Messages
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Effet pour charger les activités
  useEffect(() => {
    const loadActivities = async () => {
      try {
        setLoadingActivities(true);
        const data = await fetchAllActivities();
        setActivities(data);
      } catch (error) {
        console.error('Error loading activities:', error);
        setError('Erreur lors du chargement des activités');
      } finally {
        setLoadingActivities(false);
      }
    };
    
    loadActivities();
  }, []);

  // Effet pour charger les catégories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoadingCategories(true);
        const data = await fetchCategories();
        setCategories(data);
      } catch (error) {
        console.error('Error loading categories:', error);
        setError('Erreur lors du chargement des catégories');
      } finally {
        setLoadingCategories(false);
      }
    };
    
    loadCategories();
  }, []);

  // Effet pour initialiser l'activité sélectionnée et charger les fragments
  useEffect(() => {
    if (activities.length === 0) return;
    
    // Déterminer l'ID d'activité à utiliser
    let activityIdToUse = null;
    
    if (inCorrectionContext && correctionActivityId) {
      activityIdToUse = correctionActivityId;
    } else if (externalActivityId) {
      activityIdToUse = externalActivityId;
    } else if (activities.length > 0) {
      activityIdToUse = activities[0].id;
    }
    
    if (activityIdToUse) {
      setSelectedActivityId(activityIdToUse);
      loadFragmentsForActivity(activityIdToUse);
    }
  }, [activities, correctionActivityId, inCorrectionContext, externalActivityId]);

  // Charger les fragments pour une activité spécifique
  const loadFragmentsForActivity = async (activityId: number) => {
    if (!activityId) return;
    
    try {
      setLoadingFragments(true);
      const data = await fetchFragmentsForActivity(activityId);
      setFragments(data);
    } catch (error) {
      console.error('Error loading fragments:', error);
      setError('Erreur lors du chargement des fragments');
    } finally {
      setLoadingFragments(false);
    }
  };

  // Gérer le changement d'activité
  const handleActivityChange = (event: any) => {
    const newActivityId = Number(event.target.value);
    setSelectedActivityId(newActivityId);
    loadFragmentsForActivity(newActivityId);
    setShowAddForm(false);
    setEditingFragmentId(null);
  };

  // Ajouter un fragment à la liste
  const addFragmentToList = (newFragment: Fragment) => {
    setFragments(prev => [newFragment, ...prev]);
    setSuccessMessage('Fragment ajouté avec succès');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Mettre à jour un fragment dans la liste
  const updateFragmentInList = async (updatedFragment: Fragment) => {
    try {
      // Sauvegarder les modifications dans la base de données
      const response = await fetch(`/api/fragments/${updatedFragment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedFragment),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour du fragment');
      }

      const processedFragment = {
        ...JSON.parse(JSON.stringify(updatedFragment)),
        tags: Array.isArray(updatedFragment.tags) 
              ? [...updatedFragment.tags] 
              : (typeof updatedFragment.tags === 'string' 
                  ? JSON.parse(updatedFragment.tags) 
                  : []),
        _updateKey: Date.now()
      };
      
      // Mettre à jour l'état local après la sauvegarde réussie
      setFragments(prev => prev.map(fragment => 
        fragment.id === processedFragment.id ? processedFragment : fragment
      ));
      
      setSuccessMessage('Fragment modifié avec succès');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error updating fragment:', error);
      setError('Erreur lors de la mise à jour du fragment');
    }
  };

  // Supprimer un fragment de la liste
  const removeFragmentFromList = (fragmentId: number) => {
    setFragments(prev => prev.filter(fragment => fragment.id !== fragmentId));
    setSuccessMessage('Fragment supprimé avec succès');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Ouvrir le modal pour régler la position
  const handleOpenPositionModal = (fragment: Fragment) => {
    setSelectedFragment(fragment);
    setPositionModalOpen(true);
  };

  // Fermer le modal de position
  const handleClosePositionModal = () => {
    setPositionModalOpen(false);
    setSelectedFragment(null);
  };

  // Mettre à jour la liste de fragments après le changement de position
  const handlePositionUpdateSuccess = (updatedFragments: Fragment[]) => {
    setFragments(updatedFragments);
    setSuccessMessage('Position mise à jour avec succès');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Rafraîchir les catégories après modification
  const refreshCategories = async () => {
    try {
      const data = await fetchCategories();
      setCategories(data);
    } catch (error) {
      console.error('fragments:', fragments);
    }
  };



  const canAddNewFragments = inCorrectionContext ? 
    selectedActivityId === correctionActivityId : true;

  return (
    <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
      {/* Sélecteur d'activité */}
      <Box sx={{ mb: 3 }}>      
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
                {correctionActivityId && activity.id === correctionActivityId ? ' (courante)' : ''}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Messages d'erreur ou de succès */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      {/* Liste des fragments ou message de chargement */}
      {loadingFragments ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <CircularProgress size={24} />
        </Box>
      ) : fragments.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <Typography color="textSecondary" sx={{ mb: 2, fontStyle: 'italic' }}>
            Aucun fragment disponible pour cette activité.
          </Typography>
          {canAddNewFragments && (
            <Button 
              variant="outlined" 
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => setShowAddForm(true)}
            >
              Ajouter un fragment
            </Button>
          )}
        </Box>
      ) : (
        <>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
              Cliquez sur la puce de position pour la modifier manuellement
            </Typography>
          </Box>
          
          <FragmentList 
            fragments={fragments}
            editingFragmentId={editingFragmentId}
            categories={categories}
            onEdit={id => setEditingFragmentId(id)}
            onCancelEdit={() => setEditingFragmentId(null)}
            onUpdate={updateFragmentInList}
            onDelete={removeFragmentFromList}
            onAddToCorrection={onAddFragmentToCorrection}
            refreshCategories={refreshCategories}
            renderPositionChip={(fragment) => (
              <Chip
                icon={<ReorderIcon fontSize="small" />}
                label={`Position : ${fragment.position_order || 0}`}
                size="small"
                color="primary"
                variant="outlined"
                onClick={() => handleOpenPositionModal(fragment)}
                sx={{ 
                  top: 0,
                  right: 0,
                  position: 'absolute',
                  mt: 1,
                  mr: 1, 
                  cursor: 'pointer',
                  '&:hover': { 
                    backgroundColor: 'rgba(0, 0, 0, 0.04)'
                  }
                }}
              />
            )}
          />
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
            {canAddNewFragments && (
              <Button
                onClick={() => setAddFragmentDialogOpen(true)}
                color="primary"
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
              >
                Nouveau fragment
              </Button>
            )}
            
            <Button
              component={Link}
              href="/fragments"
              color="secondary"
              variant="contained"
              size="small"
            >
              Gérer les fragments
            </Button>
          </Box>
        </>
      )}

      {/* Dialogue modal pour l'ajout de fragment */}
      <Dialog 
        open={addFragmentDialogOpen} 
        onClose={() => setAddFragmentDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Ajouter un nouveau fragment</DialogTitle>
        <DialogContent>
          {canAddNewFragments && (
            <FragmentForm
              activityId={selectedActivityId || undefined}
              categories={categories}
              onSuccess={(newFragment) => {
                addFragmentToList(newFragment);
                setAddFragmentDialogOpen(false);
              }}
              onCancel={() => setAddFragmentDialogOpen(false)}
              refreshCategories={refreshCategories}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Désactivé: ancien formulaire d'ajout de fragment (remplacé par le modal) */}
      {false && showAddForm && canAddNewFragments && (
        <FragmentForm
          activityId={selectedActivityId || undefined}
          categories={categories}
          onSuccess={(newFragment) => {
            addFragmentToList(newFragment);
            setShowAddForm(false);
          }}
          onCancel={() => setShowAddForm(false)}
          refreshCategories={refreshCategories}
        />
      )}

      {/* Modal pour définir la position */}
      <PositionModal
        open={positionModalOpen}
        onClose={handleClosePositionModal}
        fragment={selectedFragment}
        onSuccess={handlePositionUpdateSuccess}
      />
    </Paper>
  );
};

export default FragmentsSidebar;
