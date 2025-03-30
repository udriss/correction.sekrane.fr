import React, { useState, useRef, useEffect } from 'react';
import { 
  Card, CardContent, CardActions, Box, Typography, IconButton, 
  TextField, Button, Divider, Chip, alpha, useTheme, Tooltip,
  Fade
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useDrag, useDrop } from 'react-dnd';
import { Fragment } from '@/lib/types';
import CategorySelect from '@/components/fragments/CategorySelect';

// Type constant for drag and drop
const FRAGMENT_ITEM_TYPE = 'fragment';

interface FragmentCardProps {
  fragment: Fragment;
  index: number;
  isEditing: boolean;
  categories: Array<{id: number, name: string}>;
  onEdit: () => void;
  onCancelEdit: () => void;
  onUpdate: (fragment: Fragment) => void;
  onDelete: () => void;
  onAddToCorrection?: () => void;
  moveFragment: (dragIndex: number, hoverIndex: number) => void;
  refreshCategories: () => Promise<void>;
}

const FragmentCard: React.FC<FragmentCardProps> = ({
  fragment,
  index,
  isEditing,
  categories,
  onEdit,
  onCancelEdit,
  onUpdate,
  onDelete,
  onAddToCorrection,
  moveFragment,
  refreshCategories
}) => {
  const theme = useTheme();
  const ref = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Initialize form data when editing starts
  useEffect(() => {
    if (isEditing) {
      setEditedContent(fragment.content || '');
      setSelectedCategories(extractCategoriesFromFragment(fragment));
    }
  }, [isEditing, fragment]);

  // Extract categories from fragment with different possible formats
  const extractCategoriesFromFragment = (fragment: any): number[] => {
    if (fragment.categories) {
      // Case 1: categories is an array of objects with id property
      if (Array.isArray(fragment.categories) && fragment.categories.length > 0 && 
          typeof fragment.categories[0] === 'object' && 'id' in fragment.categories[0]) {
        return fragment.categories.map((cat: any) => cat.id);
      } 
      // Case 2: categories is already an array of numbers
      else if (Array.isArray(fragment.categories)) {
        return fragment.categories as number[];
      }
    } 
    // Suppression de la référence à category_id qui n'existe plus
    return [];
  };

  // Save the fragment
  const handleSave = async () => {
    if (!editedContent.trim()) return;
    
    setIsSaving(true);
    
    try {
      const response = await fetch(`/api/fragments`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          id: fragment.id,
          content: editedContent,
          categories: selectedCategories
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save fragment');
      }
      
      const updatedFragment = await response.json();
      
      // Create a properly formatted updated fragment
      const formattedCategories = selectedCategories.length > 0 
        ? selectedCategories.map(id => {
            const cat = categories.find(c => c.id === id);
            return cat ? { id: cat.id, name: cat.name } : { id, name: `Category ${id}` };
          })
        : [];
      
      const formattedFragment = {
        ...updatedFragment,
        categories: formattedCategories
      };
      
      onUpdate(formattedFragment);
      onCancelEdit();
    } catch (error) {
      console.error('Error saving fragment:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete the fragment
  const handleDelete = async () => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce fragment ?")) {
      setIsDeleting(true);
      
      try {
        const response = await fetch(`/api/fragments/${fragment.id}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete fragment');
        }
        
        onDelete();
      } catch (error) {
        console.error('Error deleting fragment:', error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  // Handle category change
  const handleCategoryChange = (newCategories: number[]) => {
    setSelectedCategories(newCategories);
  };

  // Toggle expanded state
  const toggleExpanded = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  // Setup drag and drop
  const [{ isDragging }, drag] = useDrag({
    type: FRAGMENT_ITEM_TYPE,
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ handlerId }, drop] = useDrop({
    accept: FRAGMENT_ITEM_TYPE,
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item: any, monitor) {
      if (!ref.current) return;
      
      const dragIndex = item.index;
      const hoverIndex = index;

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) return;

      // Determine rectangle on screen
      const hoverBoundingRect = ref.current?.getBoundingClientRect();

      // Get vertical middle
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

      // Determine mouse position
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;

      // Get pixels to the top
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      // Only perform the move when the mouse has crossed half of the items height
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;

      // Time to actually perform the action
      moveFragment(dragIndex, hoverIndex);

      // Note: we're mutating the monitor item here for performance
      // to avoid expensive index searches
      item.index = hoverIndex;
    },
  });

  drag(drop(ref));

  // Render category chips
  const renderCategoryChips = () => {
    if (!fragment.categories) return null;
    
    // Determine what data to render based on the fragment's categories
    const categoriesToRender = Array.isArray(fragment.categories) ? 
      fragment.categories : [fragment.categories];
      
    return categoriesToRender.map((category: any) => {
      // Handle both object format and ID-only format
      const categoryId = typeof category === 'object' && category !== null ? category.id : category;
      const categoryName = typeof category === 'object' && category !== null ? 
        category.name : 
        categories.find(c => c.id === categoryId)?.name || "Catégorie";
        
      return (
        <Chip 
          key={categoryId}
          label={categoryName} 
          size="small" 
          variant="outlined"
          sx={{ 
            height: 20, 
            fontSize: '0.7rem', 
            borderRadius: 1,
            bgcolor: alpha(theme.palette.primary.light, 0.1),
            borderColor: alpha(theme.palette.primary.light, 0.3),
            color: theme.palette.primary.light
          }} 
        />
      );
    });
  };

  return (
    <Fade in={true} timeout={300}>
      <Card
        ref={ref}
        data-handler-id={handlerId}
        sx={{
          mb: 2,
          borderRadius: 2,
          position: 'relative',
          opacity: isDragging ? 0.4 : 1,
          boxShadow: isEditing 
            ? `0 0 0 1px ${theme.palette.primary.dark}`
            : isDeleting
              ? `0 0 0 1px ${theme.palette.error.main}`
              : `0 1px 3px ${alpha(theme.palette.text.primary, 0.1)}`,
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: isEditing 
              ? `0 0 0 2px ${theme.palette.secondary.dark}` 
              : isDeleting 
                ? `0 0 0 2px ${theme.palette.error.main}`
                : `0 3px 4px ${alpha(theme.palette.text.primary, 0.15)}`,
            '& .fragment-actions': {
              opacity: 1,
            }
          },
          bgcolor: isEditing 
            ? alpha(theme.palette.primary.main, 0.05)
            : isDeleting
              ? alpha(theme.palette.error.main, 0.05)
              : theme.palette.background.paper,
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            left: 6,
            cursor: 'move',
            color: theme.palette.text.secondary,
            opacity: 0.7,
            transition: 'color 0.2s ease',
            '&:hover': {
              color: theme.palette.primary.main,
            }
          }}
        >
          <DragIndicatorIcon fontSize="small" />
        </Box>

        <CardContent 
          sx={{ 
            pt: 2, 
            pb: 1,
            px: 2,
            ml: 3,
            '&:last-child': {
              pb: 1
            }
          }}
        >
          {/* Date and category tag */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            
            {!isEditing && (
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                {renderCategoryChips()}
              </Box>
            )}
          </Box>

          {isEditing ? (
            <>
              <TextField
                fullWidth
                multiline
                minRows={2}
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                variant="outlined"
                size="small"
                sx={{
                  mt: 1,
                  backgroundColor: 'background.paper',
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'background.paper',
                    '&:hover, &.Mui-focused': {
                      backgroundColor: 'background.default',
                    }
                  }
                }}
              />
              
              <CategorySelect
                selectedCategories={selectedCategories}
                availableCategories={categories}
                onChange={handleCategoryChange}
                refreshCategories={refreshCategories}
              />
            </>
          ) : (
            <>
              <Typography 
                variant="body2" 
                component="div"
                sx={{ 
                  whiteSpace: 'pre-wrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxHeight: expanded ? 'none' : '4.5em',
                  lineHeight: 1.5,
                  cursor: 'pointer'
                }}
                onClick={toggleExpanded}
              >
                {fragment.content}
              </Typography>
              
              {fragment.content && fragment.content.length > 100 && (
                <Button
                  variant="text"
                  size="small"
                  onClick={toggleExpanded}
                  endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  sx={{ 
                    mt: 1, 
                    fontSize: '0.7rem',
                    textTransform: 'none',
                    p: 0,
                    minWidth: 'auto',
                    color: theme.palette.text.secondary,
                    '&:hover': {
                      bgcolor: 'transparent',
                      color: theme.palette.primary.main,
                    }
                  }}
                >
                  {expanded ? 'Réduire' : 'Voir plus'}
                </Button>
              )}
            </>
          )}
        </CardContent>

        <Divider sx={{ opacity: 0.6 }} />

        <CardActions 
          className="fragment-actions"
          sx={{
            justifyContent: 'flex-end',
            px: 2,
            py: 0.5,
            opacity: {xs: 1, sm: 0.3},
            transition: 'opacity 0.2s ease',
          }}
        >
          {isEditing ? (
            <>
              <Tooltip title="Annuler">
                <IconButton 
                  size="medium" 
                  onClick={onCancelEdit}
                  sx={{ 
                    color: theme.palette.grey[600],
                    '&:hover': {
                      color: theme.palette.warning.main,
                      bgcolor: alpha(theme.palette.warning.main, 0.1)
                    }
                  }}
                >
                  <CancelIcon fontSize="medium" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Enregistrer">
                <IconButton 
                  size="medium" 
                  onClick={handleSave}
                  disabled={isSaving}
                  sx={{ 
                    color: theme.palette.secondary.light,
                    ml: 1,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.light, 0.1),
                      color: theme.palette.primary.light
                    }
                  }}
                >
                  <SaveIcon fontSize="medium" />
                </IconButton>
              </Tooltip>
            </>
          ) : (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <Typography 
              variant="caption" 
              color="text.secondary" 
              sx={{ fontStyle: 'italic' }}
            >
              {new Date(fragment.created_at).toLocaleDateString('fr-FR')}
              {fragment.isModified && ' (modifié)'}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            {onAddToCorrection && (
                <Tooltip title="Ajouter à la correction">
                  <IconButton 
                    size="small" 
                    onClick={onAddToCorrection}
                    sx={{ 
                      color: theme.palette.success.main,
                      '&:hover': {
                        bgcolor: alpha(theme.palette.success.light, 0.1)
                      }
                    }}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title="Modifier">
                <IconButton 
                  size="small" 
                  onClick={onEdit}
                  sx={{ 
                    ml: 1,
                    color: theme.palette.info.light,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.info.light, 0.1)
                    }
                  }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Supprimer">
                <IconButton 
                  size="small"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  sx={{ 
                    ml: 1,
                    color: theme.palette.grey[600],
                    '&:hover': {
                      color: theme.palette.error.main,
                      bgcolor: alpha(theme.palette.error.main, 0.1)
                    }
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>

            </Box>
          )}
        </CardActions>
      </Card>
    </Fade>
  );
};

export default FragmentCard;
