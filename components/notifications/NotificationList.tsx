'use client';

import React from 'react';
import {
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Box,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Button
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { alpha, useTheme } from '@mui/material/styles';
import NotificationsIcon from '@mui/icons-material/Notifications';
import FeedbackIcon from '@mui/icons-material/Feedback';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import PersonIcon from '@mui/icons-material/Person';
import Pagination from '@/components/Pagination';
import { useNotificationsData } from '@/app/components/NotificationsDataProvider';
import { FeedbackNotification } from '@/lib/services/notificationService';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import relativeTime from 'dayjs/plugin/relativeTime';

// Configurer dayjs
dayjs.locale('fr');
dayjs.extend(relativeTime);

interface NotificationListProps {
  filter: 'all' | 'unread' | 'read';
}

export default function NotificationList({ filter }: NotificationListProps) {
  const theme = useTheme();
  const router = useRouter();
  const {
    notifications,
    isLoading,
    error,
    pagination,
    goToPage,
    setItemsPerPage,
    markAsRead,
    markAllAsRead,
    openFeedback,
    unreadCount,
    readCount
  } = useNotificationsData();

  // Filtrer les notifications selon le type demandé
  const filteredNotifications = React.useMemo(() => {
    switch (filter) {
      case 'unread':
        return notifications.filter(n => !n.readOk);
      case 'read':
        return notifications.filter(n => n.readOk);
      default:
        return notifications;
    }
  }, [notifications, filter]);

  // Grouper les notifications par jour
  const groupedNotifications = React.useMemo(() => {
    return filteredNotifications.reduce((groups, notification) => {
      const date = dayjs(notification.viewed_at).format('YYYY-MM-DD');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(notification);
      return groups;
    }, {} as Record<string, FeedbackNotification[]>);
  }, [filteredNotifications]);

  // Trier les dates du plus récent au plus ancien
  const sortedDates = React.useMemo(() => {
    return Object.keys(groupedNotifications).sort((a, b) => 
      new Date(b).getTime() - new Date(a).getTime()
    );
  }, [groupedNotifications]);

  // Obtenir l'icône selon le type de notification
  const getNotificationIcon = (notification: FeedbackNotification) => {
    if (notification.action_type === 'VIEW_STUDENT_CORRECTIONS') {
      return <AssignmentTurnedInIcon />;
    }
    return <FeedbackIcon />;
  };

  // Obtenir la couleur de l'avatar
  const getAvatarColor = (notification: FeedbackNotification) => {
    const baseColor = notification.action_type === 'VIEW_STUDENT_CORRECTIONS' 
      ? theme.palette.secondary.main 
      : theme.palette.primary.main;
    
    return notification.readOk 
      ? alpha(baseColor, 0.1)
      : baseColor;
  };

  // Obtenir la couleur de l'icône
  const getIconColor = (notification: FeedbackNotification) => {
    return notification.readOk 
      ? (notification.action_type === 'VIEW_STUDENT_CORRECTIONS' ? 'secondary' : 'primary')
      : 'inherit';
  };

  // Formater le titre de la notification
  const formatNotificationTitle = (notification: FeedbackNotification) => {
    if (notification.action_type === 'VIEW_STUDENT_CORRECTIONS') {
      return `${notification.student_name} a visité sa page de correction`;
    }
    return `${notification.student_name} a consulté son feedback`;
  };

  // Formater la description de la notification
  const formatNotificationDescription = (notification: FeedbackNotification) => {
    const timeAgo = dayjs(notification.viewed_at).fromNow();
    if (notification.action_type === 'VIEW_STUDENT_CORRECTIONS') {
      return `${timeAgo}`;
    }
    return `Activité: ${notification.activity_name} • ${timeAgo}`;
  };

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error.message}
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (filteredNotifications.length === 0) {
    const messages = {
      all: 'Aucune notification',
      unread: 'Aucune notification non lue',
      read: 'Aucune notification lue'
    };

    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        {messages[filter]}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Pagination en haut */}
      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        totalItems={pagination.totalItems}
        itemsPerPage={pagination.itemsPerPage}
        onPageChange={goToPage}
        onItemsPerPageChange={setItemsPerPage}
        disabled={isLoading}
      />

      {/* Bouton "Marquer tout comme lu" si on affiche les non lues */}
      {filter === 'unread' && unreadCount > 0 && (
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            startIcon={<DoneAllIcon />}
            onClick={markAllAsRead}
            size="small"
          >
            Marquer tout comme lu ({unreadCount})
          </Button>
        </Box>
      )}

      {/* Liste des notifications groupées par date */}
      {sortedDates.map(date => {
        const dateNotifications = groupedNotifications[date];
        const formattedDate = dayjs(date).format('dddd D MMMM YYYY');
        const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

        return (
          <Paper key={date} elevation={1} sx={{ mb: 3 }}>
            <Box sx={{ 
              p: 2, 
              borderBottom: `1px solid ${theme.palette.divider}`,
              bgcolor: alpha(theme.palette.primary.main, 0.05)
            }}>
              <Typography variant="h6" color="primary">
                {capitalizedDate}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {dateNotifications.length} notification{dateNotifications.length > 1 ? 's' : ''}
              </Typography>
            </Box>
            
            <List sx={{ p: 0 }}>
              {dateNotifications.map((notification, index) => (
                <ListItem
                  key={notification.id}
                  sx={{
                    borderBottom: index < dateNotifications.length - 1 
                      ? `1px solid ${theme.palette.divider}` 
                      : 'none',
                    bgcolor: notification.readOk 
                      ? 'transparent' 
                      : alpha(theme.palette.primary.main, 0.05),
                    transition: 'background-color 0.2s',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.08)
                    },
                    cursor: notification.action_type === 'VIEW_FEEDBACK' ? 'pointer' : 'default'
                  }}
                  onClick={() => {
                    // Ouvrir le feedback seulement pour VIEW_FEEDBACK
                    if (notification.action_type === 'VIEW_FEEDBACK') {
                      openFeedback(notification.share_code, notification.id);
                    }
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ 
                      bgcolor: getAvatarColor(notification),
                      color: notification.readOk 
                        ? (notification.action_type === 'VIEW_STUDENT_CORRECTIONS' ? theme.palette.secondary.main : theme.palette.primary.main)
                        : 'white'
                    }}>
                      {React.cloneElement(getNotificationIcon(notification), {
                        color: getIconColor(notification)
                      })}
                    </Avatar>
                  </ListItemAvatar>
                  
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography 
                          variant="subtitle1" 
                          fontWeight={notification.readOk ? 'normal' : 'medium'}
                        >
                          {formatNotificationTitle(notification)}
                        </Typography>
                        {!notification.readOk && (
                          <Chip 
                            label="Nouveau" 
                            size="small" 
                            color="primary" 
                            variant="filled"
                            sx={{ height: 20, fontSize: '0.7rem' }}
                          />
                        )}
                        {/* Afficher la note et l'activité seulement pour VIEW_FEEDBACK */}
                        {notification.action_type === 'VIEW_FEEDBACK' && (
                          <>
                            {notification.grade !== undefined && notification.grade !== null && (
                              <Chip
                                label={`${notification.grade}/20`}
                                size="small"
                                color="success"
                                variant="outlined"
                                sx={{ height: 20, fontSize: '0.7rem' }}
                              />
                            )}
                            {notification.activity_name && (
                              <Chip
                                label={notification.activity_name}
                                size="small"
                                color="info"
                                variant="outlined"
                                sx={{ height: 20, fontSize: '0.7rem' }}
                              />
                            )}
                          </>
                        )}
                      </Box>
                    }
                    secondary={
                      <Typography variant="body2" color="text.secondary">
                        {formatNotificationDescription(notification)}
                      </Typography>
                    }
                  />
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {/* Bouton "Voir le feedback" seulement pour VIEW_FEEDBACK */}
                    {notification.action_type === 'VIEW_FEEDBACK' && (
                      <Tooltip title="Voir le feedback">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            openFeedback(notification.share_code, notification.id);
                          }}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    
                    {/* Bouton "Voir la page des corrections" seulement pour VIEW_STUDENT_CORRECTIONS */}
                    {notification.action_type === 'VIEW_STUDENT_CORRECTIONS' && (
                      <Tooltip title="Voir la page des corrections">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/students/${notification.student_id}`);
                          }}
                        >
                          <PersonIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    
                    {!notification.readOk && (
                      <Tooltip title="Marquer comme lu">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                        >
                          <DoneAllIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </ListItem>
              ))}
            </List>
          </Paper>
        );
      })}

      {/* Pagination en bas */}
      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        totalItems={pagination.totalItems}
        itemsPerPage={pagination.itemsPerPage}
        onPageChange={goToPage}
        onItemsPerPageChange={setItemsPerPage}
        disabled={isLoading}
      />
    </Box>
  );
}
