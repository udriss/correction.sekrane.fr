import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  alpha,
  Paper,
  Pagination,
  Grid,
  Alert,
  Fade,
  Theme
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonIcon from '@mui/icons-material/Person';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

interface Fragment {
  id: number;
  content: string;
  category?: string;
  tags: string[];
  activity_id?: number | null;  
  activity_name?: string;
  created_at: string;
  usage_count?: number;
  isOwner?: boolean;
  user_id?: string;
  categories?: Array<{id: number, name: string}> | number[];
  _renderKey?: number;
}

interface FragmentsListProps {
  fragments: Fragment[];
  formatFragmentCategories: (fragment: Fragment) => React.ReactNode;
  copyToClipboard: (text: string) => void;
  handleEditFragment: (fragment: Fragment) => void;
  openDeleteDialog: (fragment: Fragment) => void;
  totalPages: number;
  page: number;
  setPage: (page: number) => void;
  theme: Theme;
  lastUpdated?: number; // Ajouter cette prop pour forcer le rendu
}

// Composant non-mémorisé pour la carte de fragment individuelle afin d'assurer les mises à jour
const FragmentCard = ({ 
  fragment, 
  formatFragmentCategories, 
  copyToClipboard, 
  handleEditFragment, 
  openDeleteDialog,
  theme
}: {
  fragment: Fragment;
  formatFragmentCategories: (fragment: Fragment) => React.ReactNode;
  copyToClipboard: (text: string) => void;
  handleEditFragment: (fragment: Fragment) => void;
  openDeleteDialog: (fragment: Fragment) => void;
  theme: Theme;
}) => {
  // Utiliser un clé unique pour forcer le rendu des tags
  const uniqueKey = useRef(Date.now()).current;

  return (
    <Fade in={true} timeout={300} style={{ transitionDelay: '50ms' }}>
      <Card 
        sx={{ 
          borderRadius: 3,
          overflow: 'hidden',
          transition: 'all 0.3s ease',
          '&:hover': { 
            boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.15)}`,
            transform: 'translateY(-2px)'
          },
          border: '1px solid',
          borderColor: alpha(theme.palette.divider, 0.1)
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {fragment.activity_id === null ? (
                <Tooltip title="Aucune activité associée">
                  <Chip
                    icon={<HelpOutlineIcon fontSize="small" />}
                    label="Sans activité"
                    size="small"
                    variant="outlined"
                    sx={{ 
                      py: 0.5, 
                      px: 1,
                      bgcolor: alpha(theme.palette.grey[500], 0.1),
                      color: "text.secondary",
                      borderStyle: "dashed"
                    }}
                  />
                </Tooltip>
              ) : (
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ 
                    py: 0.5, 
                    px: 1.5, 
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    borderRadius: 5,
                    fontSize: '0.75rem'
                  }}
                >
                  {fragment.activity_name || 'Général'}
                </Typography>
              )}
              {fragment.isOwner && (
                <Chip
                  label="Mon fragment"
                  size="small"
                  color="primary"
                  variant="filled"
                  icon={<PersonIcon fontSize="small" />}
                  sx={{ height: 24 }}
                />
              )}
            </Box>
            <Box>
              <Tooltip title="Copier">
                <IconButton 
                  size="small" 
                  onClick={() => copyToClipboard(fragment.content)}
                  sx={{ 
                    color: theme.palette.primary.main,
                    '&:hover': { 
                      bgcolor: alpha(theme.palette.primary.main, 0.1)
                    }
                  }}
                >
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              
              {fragment.isOwner === true && (
                <>
                  <Tooltip title="Modifier">
                    <IconButton 
                      size="small" 
                      onClick={() => handleEditFragment(fragment)}
                      color="primary"
                      sx={{ 
                        '&:hover': { 
                          bgcolor: alpha(theme.palette.primary.main, 0.1)
                        }
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Supprimer">
                    <IconButton 
                      size="small" 
                      color="error"
                      onClick={() => openDeleteDialog(fragment)}
                      sx={{ 
                        '&:hover': { 
                          bgcolor: alpha(theme.palette.error.main, 0.1)
                        }
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </>
              )}
            </Box>
          </Box>
          
          <Typography 
            variant="body1" 
            gutterBottom
            sx={{ 
              py: 2, 
              px: 0.5, 
              lineHeight: 1.6,
              color: theme.palette.text.primary
            }}
          >
            {fragment.content}
          </Typography>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
            {formatFragmentCategories(fragment)}
            
            {/* Rendu direct des tags pour assurer la mise à jour */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {Array.isArray(fragment.tags) && fragment.tags.length > 0 ? (
                fragment.tags.map((tag, index) => (
                  <Chip 
                    key={`tag-${uniqueKey}-${index}-${tag}`}
                    label={tag} 
                    size="small" 
                    variant="filled"
                    color="info"
                    sx={{ 
                      borderRadius: 1.5,
                      bgcolor: alpha(theme.palette.info.main, 0.1),
                      color: theme.palette.info.dark,
                      fontWeight: 500,
                      '& .MuiChip-label': {
                        px: 1
                      }
                    }}
                  />
                ))
              ) : (
                <Tooltip title="Aucun tag associé">
                  <Chip 
                    key={`notags-${uniqueKey}`}
                    label="Sans tags" 
                    size="small" 
                    variant="outlined"
                    sx={{ 
                      borderRadius: 1.5, 
                      borderStyle: 'dashed',
                      color: 'text.secondary'
                    }}
                  />
                </Tooltip>
              )}
            </Box>
            
            {fragment.usage_count !== undefined && fragment.usage_count > 0 && (
              <Chip 
                label={`Utilisé ${fragment.usage_count} fois`} 
                size="small" 
                variant="filled"
                color="secondary"
                sx={{ borderRadius: 1.5 }}
              />
            )}
          </Box>
        </CardContent>
      </Card>
    </Fade>
  );
};

export const FragmentsList: React.FC<FragmentsListProps> = ({
  fragments,
  formatFragmentCategories,
  copyToClipboard,
  handleEditFragment,
  openDeleteDialog,
  totalPages,
  page,
  setPage,
  theme,
  lastUpdated
}) => {
  // Utiliser un compteur pour forcer le rendu
  const [renderCount, setRenderCount] = useState(0);
  
  // Force un nouveau rendu quand fragments ou lastUpdated changent
  useEffect(() => {
    setRenderCount(prev => prev + 1);
    
  }, [fragments, lastUpdated]);

  // Générer une clé pour forcer le rendu à chaque mise à jour
  const renderKey = `fragments-list-${lastUpdated || Date.now()}`;

  
  if (fragments.length === 0) {
    return (
      <Fade in={true} timeout={500}>
        <Alert 
          severity="info" 
          sx={{ 
            borderRadius: 2, 
            boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.1)}`,
            backgroundColor: alpha(theme.palette.info.light, 0.1)
          }}
        >
          Aucun fragment ne correspond à vos critères de recherche.
        </Alert>
      </Fade>
    );
  }

  return (
    <Box sx={{ mb: 5 }} key={renderKey}>
      <Grid container spacing={2}>
        {fragments.map((fragment) => (
          // Utiliser un identifiant unique qui change à chaque mise à jour
          <Grid size={{ xs: 12 }} key={`fragment-${fragment.id}-${renderCount}-${Date.now()}`}>
            <FragmentCard
              fragment={JSON.parse(JSON.stringify(fragment))} // Deep copy pour couper tout lien avec l'objet original
              formatFragmentCategories={formatFragmentCategories}
              copyToClipboard={copyToClipboard}
              handleEditFragment={handleEditFragment}
              openDeleteDialog={openDeleteDialog}
              theme={theme}
            />
          </Grid>
        ))}
      </Grid>
      
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
          <Paper 
            elevation={2} 
            sx={{ 
              p: 1, 
              borderRadius: 3,
              backgroundColor: alpha(theme.palette.background.paper, 0.8),
              backdropFilter: 'blur(8px)'
            }}
          >
            <Pagination 
              count={totalPages} 
              page={page} 
              onChange={(_, newPage) => setPage(newPage)}
              color="primary"
              size="large"
              shape="rounded"
              sx={{ '& .MuiPaginationItem-root': { mx: 0.5 } }}
            />
          </Paper>
        </Box>
      )}
    </Box>
  );
};
