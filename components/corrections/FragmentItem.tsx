import React, { useRef, useEffect, useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { 
  Box, IconButton, Typography, TextField, Button, 
  Card, CardContent, CardActions, Collapse, Tooltip,
  alpha, useTheme, Divider, Chip, Fade, 
  FormControl, InputLabel, Select, MenuItem, OutlinedInput, SelectChangeEvent
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CloseIcon from '@mui/icons-material/Close';

// Fragment item type for drag and drop
const FRAGMENT_ITEM_TYPE = 'fragment';

interface FragmentItemProps {
  fragment: any;
  index: number;
  editingFragmentId: number | null;
  editedFragmentContent: string;
  savingFragment: boolean;
  deletingIds: number[];
  categories?: { id: number, name: string }[]; 
  editedCategories?: number[]; // Add this prop
  onCategoriesChange?: (categories: number[]) => void; // Add this prop
  handleAddFragment: (fragment: any) => void;
  handleDeleteFragment: (id: number) => void;
  handleEditFragment: (id: number, content: string) => void;
  handleCancelEditFragment: () => void;
  handleSaveFragment: (selectedCategories: number[]) => void;
  setEditedFragmentContent: (content: string) => void;
  moveFragment: (dragIndex: number, hoverIndex: number) => void;
  handleDeleteCategory?: (categoryId: number) => void;
}

const FragmentItem: React.FC<FragmentItemProps> = ({
  fragment,
  index,
  editingFragmentId,
  editedFragmentContent,
  savingFragment,
  deletingIds,
  categories = [], 
  editedCategories = [], // Initialize with default empty array
  onCategoriesChange = () => {}, // Initialize with default no-op function
  handleAddFragment,
  handleDeleteFragment,
  handleEditFragment,
  handleCancelEditFragment,
  handleSaveFragment,
  setEditedFragmentContent,
  moveFragment,
  handleDeleteCategory = () => {},
}) => {
  const theme = useTheme();
  const ref = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = React.useState(false);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  
  // Initialize selected categories when editing starts
  useEffect(() => {
    if (editingFragmentId === fragment.id) {
      // If editedCategories are provided from parent, use those
      if (editedCategories.length > 0) {
        setSelectedCategories(editedCategories);
        
      } else {
        // Otherwise extract from fragment
        const fragmentCategories = extractCategoriesFromFragment(fragment);
        setSelectedCategories(fragmentCategories);
        onCategoriesChange(fragmentCategories); // Update parent state
        
      }
      
      // Préremplir le contenu du fragment
      setEditedFragmentContent(fragment.content || '');
    }
  }, [editingFragmentId, fragment, editedCategories]);

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
    // Case 3: fallback to legacy category_id if no categories array
    else if (fragment.category_id) {
      return [fragment.category_id];
    }
    return [];
  };

  // Gérer le changement de catégories
  const handleCategoryChange = (event: SelectChangeEvent<typeof selectedCategories>) => {
    const {
      target: { value },
    } = event;
    
    // Update local state
    const newCategories = typeof value === 'string' ? 
      value.split(',').map(Number) : 
      value as number[];
    
    setSelectedCategories(newCategories);
    
    // Also update parent component state
    onCategoriesChange(newCategories);
    
    
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
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }

      // Determine rectangle on screen
      const hoverBoundingRect = ref.current?.getBoundingClientRect();

      // Get vertical middle
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

      // Determine mouse position
      const clientOffset = monitor.getClientOffset();

      // Get pixels to the top
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top;

      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%

      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }

      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      // Time to actually perform the action
      moveFragment(dragIndex, hoverIndex);

      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex;
    },
  });

  drag(drop(ref));

  // Format fragment content for display
  const getPreviewContent = () => {
    const content = fragment.content || "";
    return content.length > 100 
      ? content.substring(0, 100) + "..." 
      : content;
  };

  // Function to toggle expanded state
  const toggleExpanded = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  const isEditing = editingFragmentId === fragment.id;
  const isDeleting = deletingIds.includes(fragment.id);
  
  // Add this function to render category chips without causing re-renders
  const renderCategoryChips = () => {
    if (!fragment.categories) return null;
    
    // Determine what data to render based on the fragment's categories
    const categoriesToRender = Array.isArray(fragment.categories) ? 
      // If categories is an array
      fragment.categories : 
      // If not an array, wrap in array for consistent handling
      [fragment.categories];
      
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
            ? `0 0 0 2px ${theme.palette.primary.main}`
            : isDeleting
              ? `0 0 0 2px ${theme.palette.error.main}`
              : `0 3px 6px ${alpha(theme.palette.text.primary, 0.1)}`,
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: isEditing 
              ? `0 0 0 2px ${theme.palette.primary.main}` 
              : isDeleting 
                ? `0 0 0 2px ${theme.palette.error.main}`
                : `0 6px 12px ${alpha(theme.palette.text.primary, 0.15)}`,
            '& .fragment-actions': {
              opacity: 1,
            }
          },
          border: '1px solid',
          borderColor: isEditing 
            ? alpha(theme.palette.primary.main, 0.5)
            : isDeleting
              ? alpha(theme.palette.error.main, 0.5)
              : alpha(theme.palette.divider, 0.8),
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
            <Typography 
              variant="caption" 
              color="text.secondary" 
              sx={{ fontStyle: 'italic' }}
            >
              {new Date(fragment.created_at).toLocaleDateString('fr-FR')}
            </Typography>
            
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
                value={editedFragmentContent}
                onChange={(e) => setEditedFragmentContent(e.target.value)}
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
              
              {/* Sélecteur de catégories multiple */}
              <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                <InputLabel id={`category-select-label-${fragment.id}`}>Catégories</InputLabel>
                <Select
                  labelId={`category-select-label-${fragment.id}`}
                  multiple
                  value={selectedCategories}
                  onChange={handleCategoryChange}
                  MenuProps={{
                    // Standard configuration for multiple selection behavior
                    keepMounted: false,
                    autoFocus: false,
                    disableAutoFocusItem: true,
                    // Most important - don't close when selecting items
                    PaperProps: {
                      style: { maxHeight: 224 }
                    },
                    // Using native behavior of multiple select not closing on selection
                    // closeOnSelect is not a valid prop for MenuProps
                  }}
                  // Add these props to ensure empty selection is possible
                  renderValue={(selected) => {
                    if (selected.length === 0) {
                      return <em>Aucune catégorie</em>;
                    }
                    return (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => {
                          const category = categories.find(cat => cat.id === value);
                          return (
                            <Chip 
                              key={value} 
                              label={category ? category.name : 'Inconnu'} 
                              size="small" 
                              sx={{ 
                                height: 24,
                                bgcolor: alpha(theme.palette.primary.dark, 0.9),
                                color: theme.palette.secondary.light
                              }}
                            />
                          );
                        })}
                      </Box>
                    );
                  }}
                >
                  {/* Add an explicit "None" option to allow deselecting all categories */}
                  <MenuItem value="" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                    <em>Aucune catégorie</em>
                  </MenuItem>
                  {categories.map((category) => (
                    <MenuItem 
                      key={category.id} 
                      value={category.id} 
                      sx={{ display: 'flex', justifyContent: 'space-between' }}
                    >
                      {category.name}
                      <IconButton 
                        size="small" 
                        onClick={(e) => {
                          e.stopPropagation(); // Keep this to prevent menu item selection when clicking delete
                          handleDeleteCategory(category.id);
                        }}
                        sx={{ 
                          ml: 1, 
                          color: theme.palette.error.main,
                          '&:hover': {
                            bgcolor: alpha(theme.palette.error.main, 0.1)
                          }
                        }}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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
                  size="small" 
                  onClick={handleCancelEditFragment}
                  sx={{ 
                    color: theme.palette.grey[600],
                    '&:hover': {
                      color: theme.palette.warning.main,
                      bgcolor: alpha(theme.palette.warning.main, 0.1)
                    }
                  }}
                >
                  <CancelIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Enregistrer">
                <IconButton 
                  size="small" 
                  onClick={() => handleSaveFragment(selectedCategories)}
                  disabled={savingFragment}
                  color="primary"
                  sx={{ 
                    ml: 1,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.light, 0.1)
                    }
                  }}
                >
                  <SaveIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          ) : (
            <>
              <Tooltip title="Ajouter à la correction">
                <IconButton 
                  size="small" 
                  onClick={() => handleAddFragment(fragment)}
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
              <Tooltip title="Modifier">
                <IconButton 
                  size="small" 
                  onClick={() => handleEditFragment(fragment.id, fragment.content)}
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
                  onClick={() => handleDeleteFragment(fragment.id)}
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
            </>
          )}
        </CardActions>
      </Card>
    </Fade>
  );
};

export default FragmentItem;
