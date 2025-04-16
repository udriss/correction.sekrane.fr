import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Alert,
  alpha,
  Theme
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { FragmentEditor } from '@/components/fragments';
import { Fragment as LibFragment } from '@/lib/types';  // Import the Fragment type from lib/types
import { Fragment, Category } from '@/types/fragments';  // Import our local Fragment type

interface EditFragmentDialogProps {
  open: boolean;
  onClose: () => void;
  fragment: Fragment | null;
  categories: Category[];
  editingSuccess: boolean;
  onUpdate: (fragment: Fragment) => void;
  fetchCategories: () => Promise<void>;
  theme: Theme;
}

export const EditFragmentDialog: React.FC<EditFragmentDialogProps> = ({
  open,
  onClose,
  fragment,
  categories,
  editingSuccess,
  onUpdate,
  fetchCategories,
  theme
}) => {
  // État local pour stocker le fragment en cours d'édition
  const [currentFragment, setCurrentFragment] = useState<Fragment | null>(null);
  
  // Référence pour vérifier si un changement a eu lieu
  const originalFragmentRef = React.useRef<Fragment | null>(null);
  
  // Mettre à jour le fragment local quand un nouveau fragment est reçu
  useEffect(() => {
    if (fragment && open) {
      // Créer une copie profonde pour éviter les problèmes de référence
      const fragmentCopy = JSON.parse(JSON.stringify(fragment));
      setCurrentFragment(fragmentCopy);
      originalFragmentRef.current = fragmentCopy;
    }
  }, [fragment, open]);
  
  // Function to convert between Fragment types
  const handleFragmentUpdate = (updatedFragment: LibFragment) => {
    // Debug pour vérifier les tags reçus de FragmentEditor
    
    
    
    // Préserver les tags originaux si aucun tag n'a été spécifié dans la mise à jour
    const preservedTags = Array.isArray(updatedFragment.tags) && updatedFragment.tags.length === 0 && currentFragment
      ? currentFragment.tags
      : updatedFragment.tags;
    
    
    
    // Forcer une copie totalement nouvelle de l'objet
    const randomKey = Math.floor(Math.random() * 10000000);
    
    // Créer un nouvel objet avec deep clone pour garantir de nouvelles références
    const convertedFragment: Fragment = JSON.parse(JSON.stringify({
      ...updatedFragment,
      // Conserver explicitement les valeurs null si présentes
      activity_id: updatedFragment.activity_id,
      activity_name: updatedFragment.activity_name,
      // Garantir que tags est toujours un tableau valide, en préservant les tags originaux si nécessaire
      tags: Array.isArray(preservedTags) && preservedTags.length > 0 
            ? [...preservedTags] 
            : (currentFragment && Array.isArray(currentFragment.tags) 
                ? [...currentFragment.tags] 
                : []),
      created_at: updatedFragment.created_at || '',
      updated_at: new Date().toISOString(), // Ajouter un timestamp pour l'horodatage
      _updateKey: randomKey,
      _forceUpdate: Date.now(),
    }));
    
    // Debug pour vérifier la conversion
    
    
    // Vérifier si des modifications ont été apportées
    const hasChanges = !originalFragmentRef.current || 
                        convertedFragment.content !== originalFragmentRef.current.content ||
                        JSON.stringify(convertedFragment.tags) !== JSON.stringify(originalFragmentRef.current.tags) ||
                        JSON.stringify(convertedFragment.categories) !== JSON.stringify(originalFragmentRef.current.categories);
    
    // Si aucune modification, afficher un message et ne pas envoyer la mise à jour
    if (!hasChanges) {
      
    }
    
    // Mettre à jour l'état local pour refléter les changements immédiatement
    setCurrentFragment(convertedFragment);
    
    // Appeler onUpdate avec le fragment converti
    onUpdate(convertedFragment);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
            boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.2)}`
          }
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Modifier le fragment
        <IconButton edge="end" color="inherit" onClick={onClose} aria-label="close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {currentFragment && (
          <Box sx={{ pt: 2 }}>
            {editingSuccess ? (
              <Alert severity="success" sx={{ mb: 2 }}>
                Fragment mis à jour avec succès!
              </Alert>
            ) : (
              <FragmentEditor 
                fragment={{
                  ...currentFragment,
                  tags: Array.isArray(currentFragment.tags) ? currentFragment.tags : 
                        (typeof currentFragment.tags === 'string' ? 
                          JSON.parse(currentFragment.tags as string) : []),
                  categories: Array.isArray(currentFragment.categories) ? 
                    currentFragment.categories.map(cat => 
                      // Si c'est déjà un objet avec id et name, le garder tel quel
                      typeof cat === 'object' && cat !== null && 'id' in cat && 'name' in cat ? 
                        cat as {id: number, name: string} :
                        // Sinon, si c'est un number, chercher la catégorie correspondante
                        categories.find(c => c.id === (typeof cat === 'number' ? cat : parseInt(cat as string))) || 
                        { id: typeof cat === 'number' ? cat : parseInt(cat as string), name: `Category ${cat}` }
                    ) : [],
                  activity_name: currentFragment.activity_name === null ? undefined : currentFragment.activity_name,
                  activity_id: currentFragment.activity_id === null ? undefined : currentFragment.activity_id
                }}
                categories={categories}
                onUpdate={handleFragmentUpdate}
                onCancel={onClose}
                refreshCategories={fetchCategories}
              />
            )}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};
