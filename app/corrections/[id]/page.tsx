'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import { Correction } from '@/lib/correction';
import { Fragment } from '@/lib/fragment';
import { ContentItem } from '@/types/correction';
import DraggableItem from '@/app/components/DraggableItem';
import FragmentItem from '@/app/components/FragmentItem';
import { parseHtmlToItems, generateHtmlFromItems, extractFormattedText } from '@/utils/htmlUtils';
import { copyToClipboard } from '@/utils/clipboardUtils';
import LoadingSpinner from '@/components/LoadingSpinner';

// Add Material UI imports
import { 
  Button, 
  IconButton,
  TextField,
  Paper,
  Typography,
  Box,
  Divider,
  Snackbar,
  Alert
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import UndoIcon from '@mui/icons-material/Undo';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

export default function CorrectionDetail({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap the Promise for params using React.use in client components
  const { id } = React.use(params);
  const correctionId = id;
  
  const [correction, setCorrection] = useState<Correction | null>(null);
  const [fragments, setFragments] = useState<Fragment[]>([]);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [history, setHistory] = useState<ContentItem[][]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [newFragmentContent, setNewFragmentContent] = useState('');
  const [addingFragment, setAddingFragment] = useState(false);
  const [showAddFragment, setShowAddFragment] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState('');
  const router = useRouter();

  // État pour l'édition de fragment
  const [editingFragmentId, setEditingFragmentId] = useState<number | null>(null);
  const [editedFragmentContent, setEditedFragmentContent] = useState('');
  const [savingFragment, setSavingFragment] = useState(false);
  const [renderedHtml, setRenderedHtml] = useState<string>('');

  // Générer l'aperçu HTML chaque fois que les contentItems changent
  const [previewHtml, setPreviewHtml] = useState('');

    // Fonction pour mettre à jour l'aperçu
    const updatePreview = useCallback(() => {
      const previewHtml = generateHtmlFromItems(contentItems);
      setRenderedHtml(previewHtml);
    }, [contentItems]);

  // Mettre à jour le rendu HTML chaque fois que contentItems change
  useEffect(() => {
    const html = generateHtmlFromItems(contentItems);
    setRenderedHtml(html);
  }, [contentItems]);
  
  // Fonction pour mettre à jour un élément
  const updateItem = (index: number, content: string) => {
    setContentItems(prevItems => {
      const newItems = [...prevItems];
      newItems[index] = {
        ...newItems[index],
        content: content
      };
      return newItems;
    });
  };

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');

  useEffect(() => {
    const fetchCorrectionAndFragments = async () => {
      try {
        // Fetch correction details
        const correctionResponse = await fetch(`/api/corrections/${correctionId}`);
        if (!correctionResponse.ok) {
          throw new Error('Erreur lors du chargement de la correction');
        }
        const correctionData = await correctionResponse.json();
        setCorrection(correctionData);
        setEditedName(correctionData.student_name || '');
        
        // Utiliser les données structurées si disponibles, sinon parser le HTML
        if (correctionData.content_data && Array.isArray(correctionData.content_data.items)) {
          console.log('Chargement depuis content_data');
          setContentItems(correctionData.content_data.items);
        } else {
          console.log('Parsing du HTML content');
          const items = parseHtmlToItems(correctionData.content || '');
          setContentItems(items);
        }

        // Fetch fragments for the activity
        const fragmentsResponse = await fetch(`/api/activities/${correctionData.activity_id}/fragments`);
        if (!fragmentsResponse.ok) {
          throw new Error('Erreur lors du chargement des fragments');
        }
        const fragmentsData = await fragmentsResponse.json();
        setFragments(fragmentsData);
      } catch (err) {
        console.error('Erreur:', err);
        setError('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    fetchCorrectionAndFragments();
  }, [correctionId]);

  useEffect(() => {
    // Mettre à jour l'aperçu HTML lorsque les éléments de contenu changent
    const html = generateHtmlFromItems(contentItems);
    setPreviewHtml(html);
  }, [contentItems]);

  // Sauvegarder l'état actuel dans l'historique
  const saveToHistory = () => {
    setHistory(prev => [...prev, [...contentItems]]);
  };

  // Annuler la dernière modification
  const handleUndo = () => {
    if (history.length === 0) return;
    
    const previousState = history[history.length - 1];
    setContentItems(previousState);
    setHistory(prev => prev.slice(0, -1));
  };

  // Déplacer un élément (pour le drag and drop)
  const moveItem = (dragIndex: number, hoverIndex: number) => {
    // Sauvegarder l'état actuel avant modification
    saveToHistory();
    const newItems = [...contentItems];
    const draggedItem = newItems[dragIndex];
    // Retirer l'élément de sa position d'origine
    newItems.splice(dragIndex, 1);
    // L'insérer à la nouvelle position
    newItems.splice(hoverIndex, 0, draggedItem);
    
    setContentItems(newItems);
  };
  
  // Supprimer un élément
  const removeItem = (index: number) => {
    saveToHistory();
    
    const itemToRemove = contentItems[index];
    if (itemToRemove.type === 'list') {
      // Si c'est une liste, supprimer aussi ses enfants
      setContentItems(items => 
        items.filter(item => item.id !== itemToRemove.id && item.parentId !== itemToRemove.id)
      );
    } else {
      setContentItems(items => {
        const newItems = [...items];
        newItems.splice(index, 1);
        return newItems;
      });
    }
  };
  
  // Ajouter un nouveau paragraphe
  const addNewParagraph = () => {
    saveToHistory();
    const newItem = {
      id: `item-${Date.now()}`,
      type: 'text' as const,
      content: 'Nouveau paragraphe'
    };
    
    setContentItems(prev => [...prev, newItem]);
  };
  
  // Mettre à jour le contenu d'un élément
  const updateItemContent = (index: number, newContent: string) => {
    saveToHistory();
    setContentItems(prev => {
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], content: newContent };
      return newItems;
    });
  };

  // Copier le contenu dans le presse-papiers
  const handleCopyToClipboard = () => {
    const formattedText = extractFormattedText(contentItems);
    copyToClipboard(
      formattedText,
      (message) => {
        setCopiedMessage(message);
        setTimeout(() => setCopiedMessage(''), 3000);
      },
      (errorMsg) => setError(errorMsg)
    );
  };

  // Sauvegarder la correction
  const handleSaveCorrection = async () => {
    if (!correction) return;
    
    setSaving(true);
    setError('');
    setSuccessMessage('');
    
    // Générer le HTML pour l'affichage
    const htmlContent = generateHtmlFromItems(contentItems);

    // Préparer les données structurées à sauvegarder
    const contentData = {
      version: '1.0',
      items: contentItems
    };
    
    try {
      // Save both HTML content and structured data for maximum compatibility
      const response = await fetch(`/api/corrections/${correctionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_name: correction.student_name,
          content: htmlContent,
          content_data: contentData
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la sauvegarde de la correction');
      }

      // Recevoir les données mises à jour depuis le serveur
      const updatedData = await response.json();
      
      // Mise à jour des données locales si nécessaire
      if (updatedData.content_data && updatedData.content_data.items) {
        setContentItems(updatedData.content_data.items);
      }

      setSuccessMessage('Correction sauvegardée avec succès');
      
      // Vider l'historique après sauvegarde
      setHistory([]);
      
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors de la sauvegarde de la correction');
    } finally {
      setSaving(false);
    }
  };

  const handleAddFragment = (fragment: Fragment) => {
    // Sauvegarder l'état actuel avant modification
    saveToHistory();
    
    // Créer un nouvel identifiant unique pour la liste
    const listId = `item-${Date.now()}`;
    
    // Extraire le titre du fragment (première ligne ou début du contenu)
    const firstLine = fragment.content.trim().split('\n')[0];
    const title = firstLine; // Remove truncation to show the full title
    
    // Créer l'élément de liste avec un titre significatif et l'ID du fragment
    const listItem: ContentItem = {
      id: listId,
      type: 'list',
      content: title,
      fragmentId: fragment.id,
      fragmentName: title
    };
    
    // Créer les éléments de la liste
    const fragmentItems = fragment.content
      .split('\n')
      .filter(line => line.trim())
      .map((line, index) => ({
        id: `item-${Date.now()}-${index}`,
        content: line.trim(),
        type: 'listItem' as const,
        parentId: listId
      }));
    
    // Ajouter tous les éléments
    setContentItems(prev => [...prev, listItem, ...fragmentItems]);
  };

  const handleCreateNewFragment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFragmentContent.trim() || !correction) return;

    setAddingFragment(true);
    setError('');

    try {
      const response = await fetch('/api/fragments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activity_id: correction.activity_id,
          content: newFragmentContent.trim()
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'ajout du fragment');
      }

      const newFragment = await response.json();
      setFragments([...fragments, newFragment]);
      setNewFragmentContent('');
      setShowAddFragment(false);
      setSuccessMessage('Fragment ajouté avec succès');
      
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors de l\'ajout du fragment');
    } finally {
      setAddingFragment(false);
    }
  };

  const handleDeleteFragment = async (fragmentId: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce fragment ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/fragments/${fragmentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression du fragment');
      }

      setFragments(fragments.filter(fragment => fragment.id !== fragmentId));
      setSuccessMessage('Fragment supprimé avec succès');
      
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors de la suppression du fragment');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette correction ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/corrections/${correctionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      // Navigate back to activity page
      if (correction?.activity_id) {
        router.push(`/activities/${correction.activity_id}`);
      } else {
        router.push('/');
      }
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors de la suppression de la correction');
    }
  };

  // Commencer l'édition d'un fragment
  const handleEditFragment = (fragment: Fragment) => {
    setEditingFragmentId(fragment.id || null);
    setEditedFragmentContent(fragment.content);
  };

  // Annuler l'édition d'un fragment
  const handleCancelEditFragment = () => {
    setEditingFragmentId(null);
    setEditedFragmentContent('');
  };

  // Sauvegarder le fragment modifié
  const handleSaveFragment = async () => {
    if (!editingFragmentId) return;
    
    setSavingFragment(true);
    setError('');

    try {
      const response = await fetch(`/api/fragments/${editingFragmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: editedFragmentContent }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour du fragment');
      }

      const updatedFragment = await response.json();
      
      // Mettre à jour la liste des fragments
      setFragments(fragments.map(fragment => 
        fragment.id === editingFragmentId ? updatedFragment : fragment
      ));

      setEditingFragmentId(null);
      setEditedFragmentContent('');
      setSuccessMessage('Fragment mis à jour avec succès');
      
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors de la mise à jour du fragment');
    } finally {
      setSavingFragment(false);
    }
  };

  const handleSaveName = async () => {
    if (!correction) return;
    
    setError('');
    setSaving(true);
    
    try {
      const response = await fetch(`/api/corrections/${correctionId}/name`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ student_name: editedName }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour du nom');
      }

      const updatedData = await response.json();
      setCorrection({
        ...correction,
        student_name: updatedData.student_name
      });
      setIsEditingName(false);
      setSuccessMessage('Nom mis à jour avec succès');
      
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors de la mise à jour du nom');
    } finally {
      setSaving(false);
    }
  };

  // NEW: handler to reorder fragments
  const moveFragment = (dragIndex: number, hoverIndex: number) => {
    const newFragments = [...fragments];
    const [draggedFragment] = newFragments.splice(dragIndex, 1);
    newFragments.splice(hoverIndex, 0, draggedFragment);
    setFragments(newFragments);

    // Send the entire reordered array to the API
    fetch(`/api/fragments/reorder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newFragments.map((frag, index) => ({
        fragmentId: frag.id,
        newPosition: index + 1 // Add 1 to the index to start at 1
      })))
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to update fragment positions');
      }
      // Update the local state with the new positions
      setFragments(newFragments.map((frag, index) => ({
        ...frag,
        position_order: index + 1
      })));
    })
    .catch(error => {
      console.error('Error during batch position update:', error);
    });
  };

  const renderHTML = (html: string) => {
    return { __html: html };
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <LoadingSpinner size="lg" text="Chargement de la correction" />
      </div>
    );
  }

  if (error && !successMessage) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">{error}</div>
      </div>
    );
  }

  if (!correction) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4">
          Correction non trouvée
        </div>
      </div>
    );
  }

  const displayName = correction.student_name || `${correction.activity_name} - Sans nom`;
  
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="container mx-auto px-4 py-8 min-h-[900px]">
        <div className="flex justify-between items-center mb-6">
          <div>
            {isEditingName ? (
              <div className="flex items-center space-x-2">
                <TextField
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="text-3xl font-bold"
                  placeholder="Nom de l'étudiant"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName();
                    if (e.key === 'Escape') {
                      setIsEditingName(false);
                      setEditedName(correction?.student_name || '');
                    }
                  }}
                  autoFocus
                  variant="standard"
                />
                <IconButton
                  onClick={handleSaveName}
                  color="success"
                  title="Sauvegarder"
                  disabled={saving}
                  size="small"
                >
                  <CheckIcon />
                </IconButton>
                <IconButton
                  onClick={() => {
                    setIsEditingName(false);
                    setEditedName(correction?.student_name || '');
                  }}
                  color="error"
                  title="Annuler"
                  size="small"
                >
                  <CloseIcon />
                </IconButton>
              </div>
            ) : (
              <h1 className="text-3xl font-bold flex items-center">
                {displayName}
                <IconButton
                  onClick={() => setIsEditingName(true)}
                  color="primary"
                  title="Modifier le nom"
                  size="small"
                  className="ml-2"
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </h1>
            )}
            <p className="text-gray-600">
              Activité : <Link href={`/activities/${correction.activity_id}`} className="text-blue-600 hover:underline">
                {correction.activity_name}
              </Link>
            </p>
            {correction.created_at && (
              <p className="text-gray-500 text-sm mt-1">
                Créée le {new Date(correction.created_at).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            )}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="contained"
              color="error"
              onClick={handleDelete}
            >
              <DeleteIcon sx={{ mr: 0.2 }} />
              Supprimer
            </Button>
          </div>
        </div>



        {/* Interface à deux colonnes: éditeur et fragments */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Colonne de gauche: éditeur de correction */}
          <div className="w-full md:w-2/3">
            <Paper className="p-4 shadow">
              <div className="border rounded-md p-4 bg-gray-50 mb-4 min-h-[200px]">
                {contentItems.map((item, index) => (
                  !item.parentId && (
                    <DraggableItem
                      key={item.id}
                      item={item}
                      index={index}
                      moveItem={moveItem}
                      updateItem={updateItem}
                      removeItem={removeItem}
                    />
                  )
                ))}
                
                {/* Bouton pour ajouter un nouveau paragraphe */}
                <Button
                  onClick={addNewParagraph}
                  color="primary"
                  variant="text"
                  size="small"
                  className="mt-2"
                >
                  <AddIcon sx={{ mr: 0.2 }} />
                  Ajouter un paragraphe
                </Button>
              </div>
              
              <Divider className="my-4" />
              
              <div className="pt-4">
                <Typography variant="subtitle1" className="mb-2">Aperçu :</Typography>
                <Paper 
                  className="p-4 rounded-lg mb-4 mt-4" 
                  elevation={0}
                  variant="outlined"
                >
                  <div dangerouslySetInnerHTML={{ __html: renderedHtml }} />
                </Paper>
                
                {/* Boutons regroupés en bas de l'aperçu */}
                <div className="space-x-2 flex justify-end items-center mt-4">
                  
                    <Button
                      onClick={handleUndo}
                      variant="outlined"
                      color="inherit"
                      disabled={history.length === 0}
                      size="small"
                      title="Annuler la dernière modification"
                    >
                      <UndoIcon sx={{ mr: 0.2 }} />
                      Annuler
                    </Button>
                    <Button
                      onClick={handleSaveCorrection}
                      variant="outlined"
                      color="primary"
                      size="small"
                      disabled={saving}
                    >
                      <SaveIcon sx={{ mr: 0.2 }} />
                      {saving ? 'Sauvegarde...' : ''}
                    </Button>
                  
                  <Button
                    onClick={handleCopyToClipboard}
                    variant="outlined"
                    color="success"
                    size="small"
                  >
                    <ContentCopyIcon sx={{ m: 0.2, height: 20, width: "auto" }} />
                  </Button>
                </div>
              </div>
            </Paper>

            
            
            <div className="mt-2">
            {successMessage && (
                <Paper className="shadow mt-2">
                  <Alert severity="success">
                    {successMessage}
                  </Alert>
                </Paper>
                )}

                {copiedMessage && (
                  <Paper className="shadow mt-2">
                  <Alert severity="info" >
                    {copiedMessage}
                  </Alert>
                  </Paper>
                )}
                
                {error && (
                  <Paper className="shadow mt-2">
                  <Alert severity="error" >
                    {error}
                  </Alert>
                  </Paper>
                )}
                </div>
            

              
          </div>
          
          {/* Colonne de droite: fragments disponibles */}
          <div className="w-full md:w-1/3">
            <Paper className="p-4 shadow">
              <Typography variant="h6" className="mb-2">Fragments disponibles</Typography>

              {fragments.length === 0 ? (
                <Typography color="textSecondary">
                  Aucun fragment disponible pour cette activité.
                </Typography>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {fragments.map((fragment, index) => (
                    <FragmentItem
                      key={fragment.id}
                      index={index}
                      fragment={fragment}
                      moveFragment={moveFragment}
                      isEditing={editingFragmentId === fragment.id}
                      editedContent={editedFragmentContent}
                      onAddToCorrection={handleAddFragment}
                      savingFragment={savingFragment}
                      onEdit={handleEditFragment}
                      onDelete={handleDeleteFragment}
                      onSave={handleSaveFragment}
                      onCancel={handleCancelEditFragment}
                      onContentChange={setEditedFragmentContent}
                    />
                  ))}
                </div>
              )}
              
              <Box className="flex flex-col space-y-4 my-4">
                <Box className="flex items-center justify-between">
                  <Button
                    onClick={() => setShowAddFragment(!showAddFragment)}
                    color="primary"
                    variant="text"
                    size="small"
                  >
                    {showAddFragment ? 'Annuler' : 'Nouveau'}
                  </Button>
                  <Button
                    component={Link}
                    href={`/activities/${correction?.activity_id}/fragments`}
                    color="primary"
                    variant="text"
                    size="small"
                  >
                    Gérer tous les fragments
                  </Button>
                </Box>

                {/* Formulaire d'ajout de fragment */}
                {showAddFragment && (
                  <Paper variant="outlined" className="p-4">
                    <form onSubmit={handleCreateNewFragment}>
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
          </div>
        </div>
      </div>
    </DndProvider>
  );
}
