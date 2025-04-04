import React from 'react';
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
  // Référence pour vérifier si un changement a eu lieu
  const originalFragmentRef = React.useRef<Fragment | null>(null);
  
  // Mettre à jour la référence quand un nouveau fragment est défini
  React.useEffect(() => {
    if (fragment && open) {
      originalFragmentRef.current = JSON.parse(JSON.stringify(fragment));
    }
  }, [fragment, open]);
  
  // Function to convert between Fragment types
  const handleFragmentUpdate = (updatedFragment: LibFragment) => {
    // Debug pour vérifier les tags reçus de FragmentEditor
    
    
    // Préserver les tags originaux si aucun tag n'a été spécifié dans la mise à jour
    const preservedTags = Array.isArray(updatedFragment.tags) && updatedFragment.tags.length === 0 && fragment
      ? fragment.tags
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
      tags: Array.isArray(preservedTags) ? [...preservedTags] : 
            (typeof preservedTags === 'string' ? 
              JSON.parse(preservedTags as string) : fragment?.tags || []),
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
    
    // Pas besoin d'ajouter un marqueur temporel, utilisons directement la copie profonde
    // qui est déjà suffisante pour déclencher une mise à jour dans React
    
    // Appeler onUpdate avec le fragment converti
    onUpdate(convertedFragment);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
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
        Modifier le fragment
        <IconButton edge="end" color="inherit" onClick={onClose} aria-label="close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {fragment && (
          <Box sx={{ pt: 2 }}>
            {editingSuccess ? (
              <Alert severity="success" sx={{ mb: 2 }}>
                Fragment mis à jour avec succès!
              </Alert>
            ) : (
              <FragmentEditor 
                fragment={{
                  ...fragment,
                  tags: Array.isArray(fragment.tags) ? fragment.tags : 
                        (typeof fragment.tags === 'string' ? 
                          JSON.parse(fragment.tags as string) : []),
                  categories: fragment.categories || [],
                  activity_name: fragment.activity_name === null ? undefined : fragment.activity_name,
                  activity_id: fragment.activity_id === null ? undefined : fragment.activity_id
                }}
                categories={categories}
                onUpdate={handleFragmentUpdate} // Use our converter function
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
