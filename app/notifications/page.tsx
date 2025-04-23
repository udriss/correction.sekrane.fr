'use client';

import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Paper, 
  Box, 
  Tabs, 
  Tab, 
  List, 
  Divider,
  ListItem, 
  ListItemAvatar, 
  ListItemText, 
  Avatar, 
  Button,
  IconButton,
  Tooltip,
  MenuItem,
  Badge,
  Alert,
  CircularProgress,
  Chip,
  Grid
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import NotificationsIcon from '@mui/icons-material/Notifications';
import FeedbackIcon from '@mui/icons-material/Feedback';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import RefreshIcon from '@mui/icons-material/Refresh';
import GradientBackground from '@/components/ui/GradientBackground';
import PatternBackground from '@/components/ui/PatternBackground';
import { FeedbackNotification } from '@/lib/services/notificationService';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/lib/contexts/NotificationContext';

// Configurer dayjs pour afficher les dates relatives en français
dayjs.locale('fr');
dayjs.extend(relativeTime);

export default function NotificationsPage() {
  const { 
    unreadCount,
    totalCount, // Utilisation du totalCount depuis le contexte
    fetchNotificationCounts, // Remplacement des deux fonctions par la nouvelle fonction combinée
    markAsRead: markNotificationAsRead, 
    markAllAsRead: markAllNotificationsAsRead,
    fetchNotifications: fetchContextNotifications
  } = useNotifications();
  
  const [notifications, setNotifications] = useState<FeedbackNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [error, setError] = useState<{ code: number; message: string } | null>(null);
  const [readCount, setReadCount] = useState<number>(0);
  const theme = useTheme();
  const router = useRouter();

  // Messages d'erreur par code HTTP
  const errorMessages: Record<number, string> = {
    401: 'Authentification requise pour accéder aux notifications',
    403: 'Vous n\'avez pas les permissions nécessaires pour accéder aux notifications',
    404: 'Le service de notifications n\'est pas disponible',
    500: 'Erreur interne du serveur lors de la récupération des notifications',
    503: 'Service de notifications temporairement indisponible'
  };

  // Calculer et mettre à jour le compteur de notifications lues
  const updateNotificationCounters = (notifications: FeedbackNotification[]) => {
    if (!notifications || notifications.length === 0) return;
    
    const unreadNotifs = notifications.filter(n => !n.readOk);
    const readNotifs = notifications.filter(n => n.readOk);
    
    setReadCount(readNotifs.length);
    // Le compteur global est mis à jour via le contexte
  };

  // Récupérer toutes les notifications avec gestion de l'état de rafraîchissement
  const fetchNotifications = async (isRefreshing = false) => {
    if (isRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    
    try {
      const response = await fetch('/api/notifications?includeRead=true&limit=100');
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
        
        // Mettre à jour les compteurs locaux et globaux
        updateNotificationCounters(data.notifications);
        
        // Mettre à jour le contexte global
        fetchNotificationCounts();
        fetchContextNotifications();
      } else {
        // Gestion des erreurs HTTP
        const statusCode = response.status;
        const errorMessage = errorMessages[statusCode] || 'Erreur lors de la récupération des notifications';
        setError({ code: statusCode, message: errorMessage });
        console.error(`Erreur ${statusCode}: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications:', error);
      setError({ code: 0, message: 'Impossible de se connecter au serveur de notifications' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fonction pour actualiser les données
  const refreshNotifications = () => {
    fetchNotifications(true);
  };

  // Marquer une notification comme lue avec mise à jour de l'interface
  const markAsRead = async (id: number) => {
    try {
      // Marquer comme lu via l'API directement plutôt que via le contexte
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'markAsRead', id }),
      });
      
      if (response.ok) {
        // Plutôt que de mettre à jour l'état local, on recharge complètement les données
        await fetchNotifications(true);
        
        // Mettre à jour également le contexte global
        fetchNotificationCounts();
        fetchContextNotifications();
      }
    } catch (error) {
      console.error('Erreur lors du marquage de la notification comme lue:', error);
    }
  };

  // Marquer toutes les notifications comme lues
  const markAllAsRead = async () => {
    try {
      // Appeler l'API directement plutôt que via le contexte
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'markAllAsRead' }),
      });
      
      if (response.ok) {
        // Plutôt que de mettre à jour l'état local, on recharge complètement les données
        await fetchNotifications(true);
        
        // Mettre à jour également le contexte global
        fetchNotificationCounts();
        fetchContextNotifications();
      }
    } catch (error) {
      console.error('Erreur lors du marquage de toutes les notifications comme lues:', error);
    }
  };

  // Ouvrir le feedback dans un nouvel onglet
  const openFeedback = (shareCode: string, notificationId: number) => {
    if (!shareCode) return;
    
    // Marquer la notification comme lue
    if (!notifications.find(n => n.id === notificationId)?.readOk) {
      markAsRead(notificationId);
    }
    
    // Ouvrir dans un nouvel onglet
    window.open(`/feedback/${shareCode}`, '_blank');
  };

  // Changer d'onglet
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Charger les notifications au chargement de la page
  useEffect(() => {
    fetchNotifications();
  }, []);

  // Mettre à jour le contexte global et les compteurs
  useEffect(() => {
    fetchNotificationCounts();
  }, []);

  // Filtrer les notifications selon l'onglet actif
  const filteredNotifications = tabValue === 0 
    ? notifications 
    : tabValue === 1 
      ? notifications.filter(n => !n.readOk) 
      : notifications.filter(n => n.readOk);

  // Grouper les notifications par jour
  const groupedNotifications = filteredNotifications.reduce((groups, notification) => {
    const date = dayjs(notification.viewed_at).format('YYYY-MM-DD');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(notification);
    return groups;
  }, {} as Record<string, FeedbackNotification[]>);

  // Trier les dates du plus récent au plus ancien
  const sortedDates = Object.keys(groupedNotifications).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      {/* En-tête */}
      <Paper 
        elevation={3} 
        sx={{ 
          borderRadius: 3,
          overflow: 'hidden',
          mb: 4,
        }}
      >
        <GradientBackground variant="primary" sx={{ p: 0 }}>
          <PatternBackground 
            pattern="dots" 
            opacity={0.02} 
            color="black" 
            size={100}
            sx={{ p: 4, borderRadius: 2 }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    background: theme => `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                    p: 1.5,
                    borderRadius: '50%',
                    display: 'flex',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                  }}
                >
                  <NotificationsIcon sx={{ fontSize: 50, color: theme => theme.palette.background.paper }} />
                </Box>
                
                <Box>
                  <Typography variant="h4" fontWeight={700} color="text.primary">Notifications</Typography>
                  <Typography variant="subtitle1" color="text.secondary" sx={{ opacity: 0.9 }}>
                    Consultations des feedback de vos étudiants
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Tooltip title="Actualiser les notifications">
                  {refreshing || loading ? (
                    <span>
                      <IconButton 
                        disabled={true}
                        sx={{ 
                          bgcolor: 'background.paper', 
                          boxShadow: 1,
                          animation: refreshing ? 'spin 1s linear infinite' : 'none',
                          '@keyframes spin': {
                            '0%': { transform: 'rotate(0deg)' },
                            '100%': { transform: 'rotate(360deg)' }
                          }
                        }}
                      >
                        <RefreshIcon />
                      </IconButton>
                    </span>
                  ) : (
                    <IconButton 
                      onClick={refreshNotifications}
                      sx={{ 
                        bgcolor: 'background.paper', 
                        boxShadow: 1
                      }}
                    >
                      <RefreshIcon />
                    </IconButton>
                  )}
                </Tooltip>
                
                {unreadCount > 0 && (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<DoneAllIcon />}
                    onClick={markAllAsRead}
                    sx={{ borderRadius: 8 }}
                    disabled={refreshing || loading}
                  >
                    Tout marquer comme lu ({unreadCount})
                  </Button>
                )}
              </Box>
            </Box>
          </PatternBackground>
        </GradientBackground>
      </Paper>

      {/* Résumé statistique */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper sx={{ 
            p: 2, 
            textAlign: 'center', 
            bgcolor: theme => alpha(theme.palette.primary.light, 0.1) 
          }}>
            <Typography variant="overline" color="text.secondary">Total</Typography>
            <Typography variant="h3" color="text.primary" fontWeight="bold">{totalCount}</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper sx={{ 
            p: 2, 
            textAlign: 'center', 
            bgcolor: theme => alpha(theme.palette.error.light, 0.1)
          }}>
            <Typography variant="overline" color="text.secondary">Non lues</Typography>
            <Typography variant="h3" color="error.main" fontWeight="bold">{unreadCount}</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper sx={{ 
            p: 2, 
            textAlign: 'center', 
            bgcolor: theme => alpha(theme.palette.success.light, 0.1)
          }}>
            <Typography variant="overline" color="text.secondary">Lues</Typography>
            <Typography variant="h3" color="success.main" fontWeight="bold">{totalCount - unreadCount}</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Onglets */}
      <Paper sx={{ mb: 4 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          variant="fullWidth"
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab 
            label="Toutes" 
            icon={<Badge badgeContent={totalCount} color="primary" sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem' } }} />} 
            iconPosition="end"
            sx={{ '& .MuiTab-iconWrapper': { ml: 2.5 } }}
          />
          <Tab 
            label="Non lues" 
            icon={<Badge badgeContent={unreadCount} color="error" sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem' } }} />} 
            iconPosition="end"
            sx={{ '& .MuiTab-iconWrapper': { ml: 2.5 } }}
          />
          <Tab 
            label="Lues" 
            icon={<Badge badgeContent={totalCount - unreadCount} color="success" sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem' } }} />} 
            iconPosition="end"
            sx={{ '& .MuiTab-iconWrapper': { ml: 2.5 } }}
          />
        </Tabs>
      </Paper>

      {/* Liste des notifications */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
                  
                    <Box sx={{ gap: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', justifyItems: 'center', }}>
                      <Alert severity="error" sx={{ mb: 3, display: 'flex', flexDirection: 'column',
                         alignItems: 'center', justifyContent: 'center', justifyItems: 'center', }}>
                      
                      <Typography variant="subtitle1" fontWeight="bold">
                      <NotificationsIcon sx={{ fontSize: 60, color: 'text.disabled', mr:3 }} /> {error.message}
                      </Typography>
                      </Alert>
                    </Box>
                  

      ) : filteredNotifications.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <NotificationsIcon sx={{ fontSize: 60, color: 'text.disabled' }} />
            <Typography variant="h6" color="text.secondary">
              Aucune notification {tabValue === 1 ? 'non lue' : tabValue === 2 ? 'lue' : ''}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Les notifications apparaîtront ici lorsque vos étudiants consulteront leurs feedback
            </Typography>
          </Box>
        </Paper>
      ) : (
        <Paper sx={{ p: 0, borderRadius: 2, overflow: 'hidden' }}>
          {sortedDates.map(date => (
            <Box key={date}>
              <Box sx={{ 
                px: 3, 
                py: 1.5, 
                bgcolor: theme => alpha(theme.palette.primary.main, 0.05),
                borderBottom: '1px solid',
                borderColor: 'divider'
              }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  {dayjs(date).format('dddd D MMMM YYYY')}
                </Typography>
              </Box>
              <List>
                {groupedNotifications[date].map((notification) => (
                  <React.Fragment key={notification.id}>
                    <ListItem
                      sx={{ 
                        px: 3,
                        py: 2,
                        borderLeft: '4px solid',
                        borderColor: notification.readOk ? 'transparent' : 'primary.main',
                        bgcolor: notification.readOk ? 'transparent' : alpha(theme.palette.primary.main, 0.03),
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, 0.05),
                        }
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: notification.readOk ? 'action.disabled' : 'primary.main' }}>
                          <FeedbackIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1" component="span" fontWeight="600">
                              {notification.student_name}
                            </Typography>
                            <Typography variant="body2" component="span" color="text.secondary">
                              a consulté son feedback
                            </Typography>
                            <Chip 
                              size="small" 
                              label={notification.final_grade + '/20'} 
                              color={Number(notification.final_grade) >= 10 ? 'success' : 'error'}
                              variant="outlined"
                              sx={{ ml: 1 }}
                            />
                          </Box>
                        }
                        secondary={
                          <Typography component="div" variant="body2" sx={{ mt: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <MenuBookIcon fontSize="small" color="action" />
                              <Typography variant="body2" component="span">
                                {notification.activity_name}
                              </Typography>
                            </Box>
                            <Typography variant="caption" component="span" color="text.secondary" display="block">
                              {dayjs(notification.viewed_at).format('HH:mm:ss')}
                            </Typography>
                          </Typography>
                        }
                      />
                      <Box>
                        {!notification.readOk && (
                          <Tooltip title="Marquer comme lu">
                            <IconButton 
                              onClick={() => markAsRead(notification.id)}
                              sx={{ mr: 1 }}
                              size="small"
                            >
                              <DoneAllIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Voir le feedback">
                          <IconButton 
                            onClick={() => openFeedback(notification.share_code, notification.id)}
                            color="primary"
                            size="small"
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </ListItem>
                    <Divider component="li" />
                  </React.Fragment>
                ))}
              </List>
            </Box>
          ))}
        </Paper>
      )}
    </Container>
  );
}