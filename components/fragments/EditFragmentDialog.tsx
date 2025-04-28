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
    // Cette fonction est appelée uniquement lors de la soumission finale du formulaire
    // pour enregistrer toutes les modifications apportées au fragment
    
    // Ne plus utiliser la logique de préservation des tags qui était problématique
    // On respecte maintenant toujours les tags fournis, même s'ils sont vides
    
    // Forcer une copie totalement nouvelle de l'objet
    const randomKey = Math.floor(Math.random() * 10000000);
    
    // Créer un nouvel objet avec deep clone pour garantir de nouvelles références
    const convertedFragment: Fragment = JSON.parse(JSON.stringify({
      ...updatedFragment,
      // Conserver explicitement les valeurs null si présentes
      activity_id: updatedFragment.activity_id,
      activity_name: updatedFragment.activity_name,
      // Utiliser TOUJOURS les tags du formulaire, même s'ils sont vides
      // afin de respecter l'intention de l'utilisateur de supprimer tous les tags
      tags: Array.isArray(updatedFragment.tags) ? [...updatedFragment.tags] : [],
      // Assurer que les catégories sont correctement traitées (peuvent être des objets ou des IDs)
      categories: Array.isArray(updatedFragment.categories) 
          ? updatedFragment.categories.map(cat => 
              typeof cat === 'object' && cat !== null && 'id' in cat 
                ? cat 
                : { id: Number(cat), name: `Category ${cat}` }
            )
          : [],
      created_at: updatedFragment.created_at || '',
      updated_at: new Date().toISOString(), // Ajouter un timestamp pour l'horodatage
      _updateKey: randomKey,
      _forceUpdate: Date.now(),
    }));
    
    // Vérifier si des modifications ont été apportées
    // Pour les catégories, on compare désormais les IDs au lieu de comparer les objets complets
    const hasChanges = !originalFragmentRef.current || 
                       convertedFragment.content !== originalFragmentRef.current.content ||
                       haveTagsChanged(convertedFragment.tags, originalFragmentRef.current.tags) ||
                       !compareCategoriesById(convertedFragment.categories, originalFragmentRef.current.categories);
    
    // Si aucune modification, afficher un message et ne pas envoyer la mise à jour
    if (!hasChanges) {
      
      return;
    }
   
    // Mettre à jour l'état local pour refléter les changements
    setCurrentFragment(convertedFragment);
    
    
    // Appeler onUpdate avec le fragment converti
    // C'est la fonction handleEditSuccess dans app/fragments/page.tsx 
    // qui est responsable de faire l'appel API PUT /api/fragments/[id]
    onUpdate(convertedFragment);
  };
  
  // Fonction d'aide pour comparer les catégories par ID
  const compareCategoriesById = (
    categories1: Array<{ id: number } | number> | undefined, 
    categories2: Array<{ id: number } | number> | undefined
  ): boolean => {
    if (!categories1 && !categories2) return true;
    if (!categories1 || !categories2) return false;
    
    // Extraire les IDs de chaque tableau de catégories
    const getIds = (cats: Array<{ id: number } | number>): number[] => {
      return cats.map(cat => typeof cat === 'object' && cat !== null ? cat.id : Number(cat)).sort();
    };
    
    const ids1 = getIds(categories1);
    const ids2 = getIds(categories2);
    
    // Comparer les tableaux d'IDs triés
    return JSON.stringify(ids1) === JSON.stringify(ids2);
  };
  
  // Fonction pour vérifier si les tags ont changé - traite correctement les tableaux vides
  const haveTagsChanged = (newTags: string[] | undefined, originalTags: string[] | undefined): boolean => {
    // Si l'un est undefined et l'autre non, ils sont différents
    if ((!newTags && originalTags) || (newTags && !originalTags)) return true;
    
    // Si les deux sont undefined, ils sont identiques
    if (!newTags && !originalTags) return false;
    
    // Si les longueurs sont différentes, ils sont différents
    if (newTags!.length !== originalTags!.length) return true;
    
    // Si l'un des tableaux est vide et l'autre non, ils sont différents
    if ((newTags!.length === 0 && originalTags!.length > 0) || 
        (newTags!.length > 0 && originalTags!.length === 0)) return true;
    
    // Convertir en ensembles pour une comparaison insensible à l'ordre
    const set1 = new Set(newTags);
    const set2 = new Set(originalTags);
    
    // Si les tailles sont différentes, ils sont différents
    if (set1.size !== set2.size) return true;
    
    // Vérifier si chaque élément de set1 est dans set2
    return Array.from(set1).some(item => !set2.has(item));
    
    return false;
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
