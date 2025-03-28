'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Typography, 
  Paper, 
  Box, 
  List, 
  ListItemButton,
  ListItemText, 
  Tooltip,
  IconButton,
  Divider,
  Chip,
  Button,
  ListItem,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Card,
  CardContent
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ArrowBack from '@mui/icons-material/ArrowBack';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import GroupsIcon from '@mui/icons-material/Groups';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Activity } from '@/lib/activity';
import GroupAddIcon from '@mui/icons-material/GroupAdd';

// Définition du type pour un groupe
interface CorrectionGroup {
  id: number;
  name: string;
  created_at: string;
  correction_count: number;
  activity_name?: string;
  description?: string;
}

export default function ActivityGroupsPage() {
  const router = useRouter();
  const params = useParams();
  const activityId = params?.id as string;
  
  const [activity, setActivity] = useState<Activity | null>(null);
  const [groups, setGroups] = useState<CorrectionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Ajouter des états pour la suppression
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<CorrectionGroup | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  // État pour les notifications
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  

  useEffect(() => {

    if (!activityId) return;

    async function fetchData() {
      setLoading(true);
      try {
        // Charger les informations sur l'activité
        const activityResponse = await fetch(`/api/activities/${activityId}`);
        if (!activityResponse.ok) {
          throw new Error("Erreur lors du chargement de l'activité");
        }
        const activityData = await activityResponse.json();
        setActivity(activityData);

        console.log('activityData:', activityData);
        
        // Charger les groupes associés à cette activité
        const groupsResponse = await fetch(`/api/activities/${activityId}/groups`);
        if (!groupsResponse.ok) {
          throw new Error('Erreur lors de la récupération des groupes de corrections');
        }
        
        const groupsData = await groupsResponse.json();
        console.log('Groups data received:', groupsData);
        
        // Handle both array and single object responses properly
        if (Array.isArray(groupsData)) {
          setGroups(groupsData);
        } else if (groupsData && typeof groupsData === 'object' && groupsData.id) {
          // If a single object with an id is returned, wrap it in an array
          setGroups([groupsData]);
          console.log('Converted single group to array:', [groupsData]);
        } else {
          console.warn('API returned unexpected data format for groups:', groupsData);
          setGroups([]); // Default to empty array for any other case
        }
      } catch (err) {
        console.error('Erreur:', err);
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [activityId]);

  // Fonction pour supprimer un groupe
  const handleDeleteGroup = async () => {
    if (!groupToDelete) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/correction-groups/${groupToDelete.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la suppression du groupe');
      }
      
      // Supprimer le groupe de la liste locale
      setGroups(groups.filter(group => group.id !== groupToDelete.id));
      
      setNotification({
        open: true,
        message: 'Groupe supprimé avec succès',
        severity: 'success'
      });
    } catch (err) {
      console.error('Erreur:', err);
      setNotification({
        open: true,
        message: err instanceof Error ? err.message : 'Erreur lors de la suppression',
        severity: 'error'
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setGroupToDelete(null);
    }
  };

  // Fonction pour ouvrir le dialogue de confirmation de suppression
  const openDeleteDialog = (group: CorrectionGroup, e: React.MouseEvent) => {
    e.stopPropagation(); // Éviter la navigation vers la page de détails
    setGroupToDelete(group);
    setDeleteDialogOpen(true);
  };

  // Gestion de la fermeture des notifications
  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };
  
  // Add debug rendering to check what's happening with groups
  console.log('Current groups state:', groups);
  
  if (loading) {
    return <div className="py-10 flex justify-center max-w-[400px] mx-auto">
      <LoadingSpinner text="Chargement des groupes de corrections " />
    </div>;
  }

  // Always set a default value for groups if it's null or undefined
  const safeGroups = Array.isArray(groups) ? groups : [];
  const hasGroups = safeGroups.length > 0;
  
  return (
    <div className="flex justify-start items-center min-h-screen bg-gray-50 py-10 px-4">
      <div className="container max-w-4xl mx-auto">
        {/* Header Section with Attractive Design */}
        <Card elevation={3} className="mb-8 bg-gradient-to-r from-blue-600 to-indigo-700 text-white overflow-hidden relative">
          {/* Background decorative element */}
          <Box className="absolute top-0 right-0 opacity-10 transform -translate-y-6 translate-x-6">
            <GroupsIcon style={{ fontSize: 180 }} />
          </Box>
          
          <Box className="relative z-10 p-6">
            <Box display="flex" flexDirection="row" gap="4px" alignItems="center" justifyItems="center" className="mb-2">
                <IconButton
                  component={Link}
                  href={`/activities/${activityId}`}
                  className="mr-2 bg-white/20 hover:bg-white/30"
                  sx={{ transform: 'translateX(-10px)' }}
                >
                  <ArrowBack color="primary" sx={{ fontSize: 30, padding: 0,  }} />
                </IconButton>
              {activity && (
                <Typography variant="h4" component="h1" className="font-bold" sx={{ transform: 'translateX(-10px)' }}>
                  {activity.name}
                </Typography>
              )}
            </Box>
            
            <Box className="mt-4 mb-6">
              <Typography variant="h6" className="font-medium mb-1">
                Groupes de corrections
              </Typography>
              <Typography variant="body1" className="opacity-80 max-w-2xl">
                Gérez vos groupes d'évaluation et accédez aux résultats collectifs pour cette activité.
              </Typography>
            </Box>
            
            <div className="flex justify-end">
                <Tooltip title="Ajouter mon premier groupe">
                <Button 
                  variant="contained" 
                  color="primary"
                  size="large"
                  className="font-bold shadow-lg hover:shadow-xl transition-all"
                  onClick={() => router.push(`/corrections/multiples?activityId=${activityId}`)}
                >
                  <AddIcon />
                </Button>
                </Tooltip>
            </div>
          </Box>
        </Card>
        
        {error && (
          <Alert severity="error" variant="filled" className="mb-6">
            {error}
          </Alert>
        )}
        
        {!hasGroups && !error ? (
          <Card className="text-center p-10 border-2 border-dashed border-gray-300 bg-white">
            <Box sx={{ mb: 1 }}>
              <GroupAddIcon style={{ fontSize: 120, margin: '0 auto', display: 'block', color: '#9ca3af' }} />
            </Box>
            <Typography variant="h6" className="mb-4 text-gray-700">
              Aucun groupe d'évaluation
            </Typography>
            <Typography sx={{ mb: 1 }} variant="body1" className="mb-6 text-gray-500">
              Ajoutez un premier groupe pour organiser les corrections et analyser les résultats collectifs
            </Typography>
            <Tooltip title="Cliquer pour ajouter un groupe">
              <Button 
                variant="contained" 
                onClick={() => router.push(`/corrections/multiples?activityId=${activityId}`)}
                startIcon={<AddIcon />}
                color="primary"
                size="large"
              >
                Ajouter mon premier groupe
              </Button>
            </Tooltip>
          </Card>
        ) : (
          <Card elevation={2} className="overflow-hidden">
            <Box className="bg-gray-100 p-4 border-b border-gray-200 flex justify-between items-center">
              <Typography variant="subtitle1" className="font-medium">
                {safeGroups.length} {safeGroups.length > 1 ? 'groupes disponibles' : 'groupe disponible'}
              </Typography>
              <Chip 
              sx={{ p: 1 }}
              icon={<CalendarTodayIcon fontSize="small" />} 
              label=" Tri par date de création" 
              size="small" 
              variant="outlined" 
              color="primary"
              />
            </Box>
            
            <List className="bg-white">
              {safeGroups.map((group, index) => (
                <React.Fragment key={group.id}>
                  {index > 0 && <Divider />}
                  <ListItem 
                    disablePadding 
                    className="hover:bg-blue-50 transition-colors"
                  >
                    <ListItemButton 
                      onClick={() => router.push(`/activities/${activityId}/groups/${group.id}`)}
                      className="py-4"
                    >
                      <ListItemText
                        primary={
                          <Typography variant="h6" className="font-medium">{group.name}</Typography>
                        }
                        secondary={
                          <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 2, mt: 1 }}>
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                              <CalendarTodayIcon fontSize="small" className="mr-1 text-gray-500" />
                              <Typography variant="body2" className="text-gray-600">
                                {new Date(group.created_at).toLocaleDateString('fr-FR', { 
                                  day: 'numeric', 
                                  month: 'short', 
                                  year: 'numeric' 
                                })}
                              </Typography>
                            </Box>
                            <Chip 
                              size="small" 
                              label={`${group.correction_count || 0} correction${group.correction_count !== 1 ? 's' : ''}`} 
                              color="primary" 
                              className="font-medium"
                            />
                            {group.description && (
                              <Typography variant="body2" className="text-gray-500 mt-1">
                                {group.description.length > 60 ? 
                                  `${group.description.substring(0, 60)}...` : 
                                  group.description}
                              </Typography>
                            )}
                          </Box>
                        }
                        slotProps={{
                          secondary: { component: 'div' }
                        }}
                      />
                    </ListItemButton>
                    <Box sx={{ display: 'flex', pr: 2 }}>
                      <IconButton 
                        edge="end" 
                        onClick={() => router.push(`/activities/${activityId}/groups/${group.id}`)}
                        title="Voir les détails et les statistiques"
                        className="text-blue-600 hover:bg-blue-100"
                      >
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton 
                        edge="end" 
                        onClick={(e) => openDeleteDialog(group, e)}
                        color="error"
                        title="Supprimer le groupe"
                        className="ml-1 hover:bg-red-100"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </ListItem>
                </React.Fragment>
              ))}
              {safeGroups.length === 0 && (
                <ListItem>
                  <ListItemText primary="Aucun groupe trouvé" />
                </ListItem>
              )}
            </List>
          </Card>
        )}
        
        {/* Modal de confirmation de suppression */}
        <Dialog
          slotProps={{
            paper: {
              elevation: 3,
              sx: { 
                borderRadius: 2,
                maxWidth: '750px',  // Définir la largeur maximale ici
                width: '100%'       // Assurer qu'il prend 100% jusqu'à maxWidth
              }
            }
          }}
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
            <DialogTitle sx={{ bgcolor: '#f8f9fa', borderBottom: '1px solid #e0e0e0', py: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DeleteIcon color="error" />
                <Typography variant="h6">Confirmation de suppression</Typography>
              </Box>
            </DialogTitle>
            <DialogContent sx={{ pt: 3 }}>
              <DialogContentText>
                <br />
                Êtes-vous sûr de vouloir supprimer le groupe&nbsp;
                <Typography variant="body1" color="secondary" component="span" sx={{ fontWeight: 'bold' }}>
                {groupToDelete?.name}&nbsp;
                </Typography>?&nbsp;<strong>Cette action est irréversible</strong>.
              </DialogContentText>
              
              {/* Ajouter un espace entre le texte et l'alerte */}
              <Box sx={{ mt: 2, mb: 2 }}></Box>
              
              {/* L'alerte est maintenant à l'extérieur du DialogContentText */}
              <Alert severity="warning">
                Attention : cela supprimera uniquement le groupe, pas les corrections individuelles.
              </Alert>
            </DialogContent>
            <DialogActions sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button onClick={() => setDeleteDialogOpen(false)} color="primary" disabled={isDeleting}>
              Annuler
            </Button>
            <Button 
              onClick={handleDeleteGroup} 
              color="error" 
              autoFocus
              disabled={isDeleting}
            >
              {isDeleting ? (
                <LoadingSpinner text="Suppression " size="sm" />
              ) : (
                'Supprimer'
              )}
            </Button>
            </DialogActions>
        </Dialog>

        {/* Notifications */}
        <Snackbar 
          open={notification.open} 
          autoHideDuration={6000}
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleCloseNotification} 
            severity={notification.severity}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </div>
    </div>
  );
}
