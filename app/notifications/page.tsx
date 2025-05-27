'use client';

import React, { useState } from 'react';
import { 
  Container, 
  Typography, 
  Paper, 
  Box, 
  Tabs, 
  Tab, 
  Button,
  IconButton,
  Tooltip,
  Badge,
  Grid
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import NotificationsIcon from '@mui/icons-material/Notifications';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import RefreshIcon from '@mui/icons-material/Refresh';
import FilterListIcon from '@mui/icons-material/FilterList';
import GradientBackground from '@/components/ui/GradientBackground';
import PatternBackground from '@/components/ui/PatternBackground';
import NotificationsDataProvider, { useNotificationsData } from '@/app/components/NotificationsDataProvider';
import NotificationList from '@/components/notifications/NotificationList';
import NotificationFilters from '@/components/notifications/NotificationFilters';

function NotificationsPageContent() {
  const [tabValue, setTabValue] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const theme = useTheme();
  const {
    isLoading,
    refreshNotifications,
    markAllAsRead,
    unreadCount,
    readCount,
    pagination
  } = useNotificationsData();

  // Changer d'onglet
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Fonction pour actualiser les données
  const handleRefresh = async () => {
    await refreshNotifications();
  };

  // Marquer toutes les notifications comme lues
  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  // Obtenir le filtre basé sur l'onglet
  const getFilterForTab = (tab: number): 'all' | 'unread' | 'read' => {
    switch (tab) {
      case 1: return 'unread';
      case 2: return 'read';
      default: return 'all';
    }
  };

  const totalCount = pagination.totalItems;

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      {/* En-tête */}
      <Paper elevation={3} sx={{ borderRadius: 3, overflow: 'hidden', mb: 4 }}>
        <GradientBackground variant="primary" sx={{ p: 0 }}>
          <PatternBackground pattern="dots" opacity={0.02} color="black" size={100} sx={{ p: 4, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ background: theme => `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`, p: 1.5, borderRadius: '50%', display: 'flex', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                  <NotificationsIcon sx={{ fontSize: 50, color: theme => theme.palette.background.paper }} />
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight={700} color="text.primary">Notifications</Typography>
                  <Typography variant="subtitle1" color="text.secondary" sx={{ opacity: 0.9 }}>
                    Consultations des feedback de vos étudiants (20 par page)
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Tooltip title="Filtres">
                  <IconButton onClick={() => setShowFilters(!showFilters)} 
                  color='primary'
                  sx={{
                   boxShadow: 1, color: showFilters ? 
                   theme => theme.palette.primary.main :
                   theme => theme.palette.primary.dark }}>
                    <FilterListIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Actualiser les notifications">
                  <span>
                    <IconButton onClick={handleRefresh} disabled={isLoading}
                    color='primary'
                    sx={{ boxShadow: 1, animation: isLoading ? 'spin 1s linear infinite' : 'none',
                     '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } } }}>
                      <RefreshIcon />
                    </IconButton>
                  </span>
                </Tooltip>
                {unreadCount > 0 && (
                  <Button variant="contained" color="primary" startIcon={<DoneAllIcon />} onClick={handleMarkAllAsRead} sx={{ borderRadius: 8 }} disabled={isLoading}>
                    Tout marquer comme lu ({unreadCount})
                  </Button>
                )}
              </Box>
            </Box>
          </PatternBackground>
        </GradientBackground>
      </Paper>
      {/* Filtres */}
      {showFilters && (
        <Box sx={{ mb: 4 }}>
          <NotificationFilters />
        </Box>
      )}
      {/* Résumé statistique */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: theme => alpha(theme.palette.primary.light, 0.1) }}>
            <Typography variant="overline" color="text.secondary">Total</Typography>
            <Typography variant="h3" color="text.primary" fontWeight="bold">{totalCount}</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: theme => alpha(theme.palette.error.light, 0.1) }}>
            <Typography variant="overline" color="text.secondary">Non lues</Typography>
            <Typography variant="h3" color="error.main" fontWeight="bold">{unreadCount}</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: theme => alpha(theme.palette.success.light, 0.1) }}>
            <Typography variant="overline" color="text.secondary">Lues</Typography>
            <Typography variant="h3" color="success.main" fontWeight="bold">{readCount}</Typography>
          </Paper>
        </Grid>
      </Grid>
      {/* Onglets */}
      <Paper sx={{ mb: 4 }}>
        <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth" textColor="primary" indicatorColor="primary">
          <Tab label="Toutes" icon={<Badge badgeContent={totalCount} color="primary" sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem' } }} />} iconPosition="end" sx={{ '& .MuiTab-iconWrapper': { ml: 2.5 } }} />
          <Tab label="Non lues" icon={<Badge badgeContent={unreadCount} color="error" sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem' } }} />} iconPosition="end" sx={{ '& .MuiTab-iconWrapper': { ml: 2.5 } }} />
          <Tab label="Lues" icon={<Badge badgeContent={readCount} color="success" sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem' } }} />} iconPosition="end" sx={{ '& .MuiTab-iconWrapper': { ml: 2.5 } }} />
        </Tabs>
      </Paper>
      {/* Liste paginée des notifications */}
      <NotificationList filter={getFilterForTab(tabValue)} />
    </Container>
  );
}

export default function NotificationsPage() {
  return (
    <NotificationsDataProvider>
      <NotificationsPageContent />
    </NotificationsDataProvider>
  );
}
