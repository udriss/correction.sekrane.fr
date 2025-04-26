import React, { useState, useEffect } from 'react';
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
  Theme,
  CircularProgress
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonIcon from '@mui/icons-material/Person';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import UpdateIcon from '@mui/icons-material/Update';

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
  updatingFragmentId?: number; // ID du fragment en cours de mise à jour
}

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
  lastUpdated,
  updatingFragmentId
}) => {
  // Ne pas déclencher de re-rendu global basé sur lastUpdated
  // Utiliser un état local uniquement pour le fragment spécifique en cours de mise à jour
  const [, setRenderCount] = useState(0);
  
  // Optimisation : Ne plus forcer de re-rendu global quand fragments ou lastUpdated changent
  // Cela permet d'éviter que tous les fragments soient re-rendus lors de la mise à jour d'un seul fragment
  
  // Formatter les tags dans un élément React - version optimisée
  const formatTags = React.useCallback((fragment: Fragment) => {
    // S'assurer que les tags sont toujours un tableau valide et créer une nouvelle référence
    const normalizedTags = Array.isArray(fragment.tags) ? [...fragment.tags] : 
                          (typeof fragment.tags === 'string' ? 
                            JSON.parse(fragment.tags as string) : []);
    
    // Utiliser l'ID du fragment et un identifiant stable pour la clé au lieu d'un nombre aléatoire
    const uniqueKey = `tags-${fragment.id}`;
    
    if (!normalizedTags || normalizedTags.length === 0) {
      return (
        <Tooltip title="Aucun tag associé" key={`empty-tags-${uniqueKey}`}>
          <Chip 
            key={`no-tags-${uniqueKey}`}
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
      );
    }
    
    return (
      <React.Fragment key={uniqueKey}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {normalizedTags.map((tag: string, index: number) => (
            <Chip 
              key={`${uniqueKey}-tag-${index}-${tag}`}
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
          ))}
        </Box>
      </React.Fragment>
    );
  }, [theme]); // Ne dépend plus du renderCount, uniquement du thème
  
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
    <Box sx={{ mb: 5 }}>
      <Grid container spacing={2}>
        {fragments.map((fragment) => {
          // Utiliser directement le fragment sans créer de copie profonde inutile
          // et sans générer de clés aléatoires qui forcent des re-rendus
          
          return (
            <Grid size={{ xs: 12 }} key={`fragment-${fragment.id}-${fragment._renderKey || ''}`}>
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
                    borderColor: alpha(theme.palette.divider, 0.1),
                    position: 'relative' // Nécessaire pour le positionnement du spinner
                  }}
                >
                  {/* Overlay spinner pour le fragment en cours de modification */}
                  {updatingFragmentId === fragment.id && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: alpha(theme.palette.background.paper, 0.7),
                        zIndex: 10,
                        backdropFilter: 'blur(3px)',
                        borderRadius: 3,
                      }}
                    >
                      <CircularProgress color="primary" size={40} sx={{ mb: 2 }} />
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                        Mise à jour en cours...
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        <UpdateIcon fontSize="small" color="primary" sx={{ mr: 0.5 }} />
                        <Typography variant="caption" color="primary">
                          Mise à jour des tags et informations
                        </Typography>
                      </Box>
                    </Box>
                  )}
                  
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
                      {formatTags(fragment)}
                      
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
            </Grid>
          );
        })}
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
