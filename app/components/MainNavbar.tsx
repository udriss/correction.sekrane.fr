'use client';

import React, { useState, useEffect } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  Menu, 
  MenuItem,
  useScrollTrigger,
  Slide,
  IconButton,
  Tooltip as MuiTooltip,
  Divider,
  ListItemIcon,
  ListItemText,
  Badge,
  Avatar,
  ListItemAvatar,
  ListItemButton,
  List,
  CircularProgress,
  Dialog,
  DialogContent,
  Switch,
  Tooltip
} from '@mui/material';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ChangePasswordModal from './ChangePasswordModal';
import AccountCircle from '@mui/icons-material/AccountCircle';
import KeyboardArrowDown from '@mui/icons-material/KeyboardArrowDown';
import AddIcon from '@mui/icons-material/Add';
import HomeIcon from '@mui/icons-material/Home';
import ViewListIcon from '@mui/icons-material/ViewList';
import SchoolIcon from '@mui/icons-material/School';
import PeopleIcon from '@mui/icons-material/People';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FilterListIcon from '@mui/icons-material/FilterList';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CategoryIcon from '@mui/icons-material/Category';
import SearchIcon from '@mui/icons-material/Search';
import ThemeSwitcher from '@/components/layout/ThemeSwitcher';
import SettingsIcon from '@mui/icons-material/Settings';
import NotificationsIcon from '@mui/icons-material/Notifications';
import FeedbackIcon from '@mui/icons-material/Feedback';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import StorageIcon from '@mui/icons-material/Storage';
import ListAltIcon from '@mui/icons-material/ListAlt';
import DatabaseMonitoring from '@/components/DatabaseMonitoring';
import { alpha, useTheme } from '@mui/material/styles';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useNotifications } from '@/lib/contexts/NotificationContext';
import { useDbCleanup } from '@/lib/contexts/DbCleanupContext';
import AutoDeleteIcon from '@mui/icons-material/AutoDelete';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';


// Configurer dayjs pour afficher les dates relatives en français
dayjs.locale('fr');
dayjs.extend(relativeTime);

interface User {
  id: number;
  username: string;
  name: string;
}

// Pour créer l'effet de disparition lors du défilement
interface Props {
  window?: () => Window;
  children: React.ReactElement;
}

function HideOnScroll(props: Props) {
  const { children, window } = props;
  const trigger = useScrollTrigger({
    target: window ? window() : undefined,
  });

  return (
    <Slide appear={false} direction="down" in={!trigger}>
      {children}
    </Slide>
  );
}

// Composant pour le badge de notifications
function NotificationBadge() {
  const { 
    unreadCount, 
    totalCount, // Ajout de totalCount
    notifications, 
    loading, 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead,
    fetchNotificationCounts // Remplacement de fetchUnreadCount par fetchNotificationCounts
  } = useNotifications();
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const theme = useTheme();
  const router = useRouter();

  // Effet pour mettre à jour le compteur de notifications non lues quand le menu est ouvert/fermé
  useEffect(() => {
    if (!open) {
      // Quand le menu se ferme, on rafraîchit le compteur
      fetchNotificationCounts();
    } else {
      // Quand le menu est ouvert, on met à jour périodiquement le compteur
      const interval = setInterval(() => {
        fetchNotificationCounts();
      }, 1000); // Rafraîchir toutes les secondes
      
      return () => clearInterval(interval);
    }
  }, [open, fetchNotificationCounts]);

  // Ouvrir le menu des notifications
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    fetchNotifications();
    // Également mettre à jour le compteur quand on ouvre le menu
    fetchNotificationCounts();
  };

  // Fermer le menu des notifications
  const handleClose = () => {
    setAnchorEl(null);
  };

  // Rediriger vers la page de feedback dans un nouvel onglet
  const navigateToFeedback = (shareCode: string, notificationId: number) => {
    // Marquer la notification comme lue
    markAsRead(notificationId);
    // Mettre à jour immédiatement le compteur après marquage
    fetchNotificationCounts();
    // Ouvrir dans un nouvel onglet
    window.open(`/feedback/${shareCode}`, '_blank');
    handleClose();
  };

  // Fonction améliorée pour marquer toutes les notifications comme lues
  const handleMarkAllAsRead = () => {
    markAllAsRead();
    // Mise à jour immédiate du compteur
    fetchNotificationCounts();
  };

  // Rediriger vers la page complète des notifications
  const viewAllNotifications = () => {
    handleClose();
    router.push('/notifications');
  };

  // Ajouter cette fonction pour naviguer vers la page de l'étudiant
  const navigateToStudent = (studentId: number, notificationId: number) => {
    // Marquer la notification comme lue
    markAsRead(notificationId);
    // Mettre à jour immédiatement le compteur après marquage
    fetchNotificationCounts();
    // Ouvrir dans un nouvel onglet
    window.open(`/students/${studentId}`, '_blank');
    handleClose();
  };

  return (
    <>
      <MuiTooltip title={unreadCount > 0 ? `${unreadCount} notifications` : "Notifications"}>
        <IconButton
          onClick={handleClick}
          size="small"
          color="inherit"
          sx={{ 
            ml: 1,
            animation: unreadCount > 0 ? 'pulse 2s infinite' : 'none',
            '@keyframes pulse': {
              '0%': { transform: 'scale(1)' },
              '50%': { transform: 'scale(1.1)' },
              '100%': { transform: 'scale(1)' }
            }
          }}
        >
          <Badge 
            badgeContent={unreadCount} 
            color="error"
            sx={{
              '& .MuiBadge-badge': {
                fontSize: '0.7rem',
                height: 16,
                minWidth: 16,
                padding: '0 4px'
              }
            }}
          >
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </MuiTooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        slotProps={{
          paper: {
            elevation: 3,
            sx: {
              maxHeight: 450,
              width: '350px',
              maxWidth: '90vw',
              borderRadius: 2,
              mt: 1.5,
              overflow: 'visible',
              filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.15))',
              '&:before': {
                content: '""',
                display: 'block',
                position: 'absolute',
                top: 0,
                right: 14,
                width: 10,
                height: 10,
                bgcolor: 'background.paper',
                transform: 'translateY(-50%) rotate(45deg)',
                zIndex: 0,
              },
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box 
          sx={{ 
            p: 2, 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Notifications
          </Typography>
          
          {unreadCount > 0 && (
            <MuiTooltip title="Tout marquer comme lu">
              <IconButton size="small" onClick={handleMarkAllAsRead}>
                <DoneAllIcon fontSize="small" />
              </IconButton>
            </MuiTooltip>
          )}
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress size={30} />
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <FeedbackIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
            <Typography color="text.secondary">
              Aucune notification de feedback
            </Typography>
          </Box>
        ) : (
          <Box>
            <List sx={{ p: 0, maxHeight: 320, overflowY: 'auto' }}>
              {(() => {
                // Trier les notifications par date (les plus récentes d'abord)
                const sortedNotifications = [...notifications].sort((a, b) => 
                  new Date(b.viewed_at).getTime() - new Date(a.viewed_at).getTime()
                );
                
                // Séparer les notifications lues et non lues
                const unreadNotifications = sortedNotifications.filter(n => !n.readOk);
                const readNotifications = sortedNotifications.filter(n => n.readOk);
                
                // Combiner pour avoir toutes les non lues + compléter avec des lues jusqu'à 10 max
                const displayNotifications = [
                  ...unreadNotifications,
                  ...readNotifications.slice(0, Math.max(0, 10 - unreadNotifications.length))
                ];
                
                // Renvoyer le JSX pour les notifications
                return (
                  <>
                    {displayNotifications.map((notification) => {
                      return (
                        <ListItemButton
                          key={notification.id}
                          onClick={() => 
                            notification.action_type === 'VIEW_STUDENT_CORRECTIONS' 
                              ? navigateToStudent(notification.student_id, notification.id)
                              : navigateToFeedback(notification.share_code, notification.id)
                          }
                          sx={{
                            borderLeft: '3px solid',
                            borderColor: notification.readOk ? 'transparent' : 'primary.main',
                            backgroundColor: notification.readOk ? 'transparent' : alpha(theme.palette.primary.main, 0.04),
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.primary.main, 0.08),
                            },
                            py: 1,
                            cursor: 'pointer', // Toujours afficher le curseur pointer
                          }}
                        >
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: notification.readOk ? 'action.disabled' : notification.action_type === 'VIEW_STUDENT_CORRECTIONS' ? 'secondary.main' : 'primary.main' }}>
                              {notification.action_type === 'VIEW_STUDENT_CORRECTIONS' ? <VisibilityIcon /> : <FeedbackIcon />}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText 
                            primary={notification.student_name}
                            secondary={
                              <>
                                {notification.action_type === 'VIEW_STUDENT_CORRECTIONS' ? (
                                  <>
                                    <Typography variant="body2" sx={{ color: 'text.primary' }}>
                                      a visité sa page de correction
                                    </Typography>
                                    <Typography variant="caption" sx={{ display: 'block' }}>
                                      {new Date(notification.viewed_at).toLocaleString()}
                                    </Typography>
                                  </>
                                ) : (
                                  <>
                                    <Typography variant="body2" sx={{ color: 'text.primary' }}>
                                      a consulté son feedback
                                    </Typography>
                                    <Typography variant="caption" sx={{ display: 'block' }}>
                                      {notification.activity_name && (
                                        <>
                                          {notification.activity_name}<br />
                                        </>
                                      )}
                                      {notification.grade || notification.final_grade || 'N/A'}/
                                      {notification.points || 20}
                                      <br />
                                      {new Date(notification.viewed_at).toLocaleString()}
                                    </Typography>
                                  </>
                                )}
                              </>
                            }
                          />
                          {notification.action_type === 'VIEW_STUDENT_CORRECTIONS' ? (
                            <Tooltip title="Voir la page de l'étudiant">
                              <IconButton size="small" color="secondary">
                                <ArrowForwardIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Tooltip title="Voir le feedback">
                              <IconButton size="small" color="primary">
                                <ArrowForwardIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </ListItemButton>
                      );
                    })}
                    
                    {/* Message d'information sur les notifications supplémentaires */}
                    {totalCount > displayNotifications.length && (
                      <Box sx={{ 
                        p: 1.5, 
                        textAlign: 'center', 
                        borderTop: '1px dashed',
                        borderColor: 'divider',
                        bgcolor: theme => alpha(theme.palette.info.light, 0.05)
                      }}>
                        <Typography variant="caption" color="text.secondary">
                          {totalCount - displayNotifications.length} autres notifications disponibles
                        </Typography>
                      </Box>
                    )}
                  </>
                );
              })()}
            </List>
            
            <Box 
              sx={{ 
                p: 1, 
                borderTop: '1px solid', 
                borderColor: 'divider', 
                display: 'flex', 
                justifyContent: 'center' 
              }}
            >
              <Button 
                onClick={viewAllNotifications} 
                size="small" 
                sx={{ textTransform: 'none' }}
                startIcon={<FormatListBulletedIcon fontSize="small" />}
              >
                Voir toutes les notifications
              </Button>
            </Box>
          </Box>
        )}
      </Menu>
    </>
  );
}

// Composant pour le switch d'auto-nettoyage
function DbCleanupSwitch() {
  const { autoCleanupEnabled, setAutoCleanupEnabled, lastRunFormatted, isLoading, isCronJob } = useDbCleanup();
  
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {isLoading ? (
          <CircularProgress size={16} color="inherit" />
        ) : (
          <AutoDeleteIcon color={autoCleanupEnabled ? "success" : "action"} fontSize="small" />
        )}
        <Box>
          <Typography variant="body2" fontWeight="medium">
            Auto-nettoyage BDD
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {autoCleanupEnabled 
              ? `Activé ${isCronJob ? '(cron serveur)' : '(navigateur)'}`
              : 'Désactivé'}
          </Typography>
          {autoCleanupEnabled && (
            <Typography variant="caption" display="block" color="text.secondary">
              Dernière exécution: {lastRunFormatted}
            </Typography>
          )}
        </Box>
      </Box>
      <Switch
        checked={autoCleanupEnabled}
        onChange={(e) => setAutoCleanupEnabled(e.target.checked)}
        color="success"
        size="small"
        disabled={isLoading}
      />
    </Box>
  );
}

export default function MainNavbar() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  // États pour les menus
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [classMenuAnchor, setClassMenuAnchor] = useState<null | HTMLElement>(null);
  const [activitiesMenuAnchor, setActivitiesMenuAnchor] = useState<null | HTMLElement>(null);
  const [adminMenuAnchor, setAdminMenuAnchor] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const classMenuOpen = Boolean(classMenuAnchor);
  const activitiesMenuOpen = Boolean(activitiesMenuAnchor);
  const adminMenuOpen = Boolean(adminMenuAnchor);
  
  // État pour le modal de changement de mot de passe
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  // État pour le modal de monitoring de la base de données
  const [dbMonitoringOpen, setDbMonitoringOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/user');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      
      // Capturer l'URL actuelle avant la déconnexion
      const currentPath = window.location.pathname;
      // Rediriger vers la page de login avec le paramètre callbackUrl
      window.location.href = `/login?callbackUrl=${encodeURIComponent(currentPath)}`;
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };
  
  // Gestionnaires pour le menu utilisateur
  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleChangePasswordClick = () => {
    handleMenuClose(); 
    setPasswordModalOpen(true);
  };

  // Gestionnaires pour le menu classe
  const handleClassMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setClassMenuAnchor(event.currentTarget);
  };
  
  const handleClassMenuClose = () => {
    setClassMenuAnchor(null);
  };

  // Gestionnaires pour le menu activities
  const handleActivitiesMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setActivitiesMenuAnchor(event.currentTarget);
  };
  
  const handleActivitiesMenuClose = () => {
    setActivitiesMenuAnchor(null);
  };

  // Gestionnaires pour le menu admin
  const handleAdminMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAdminMenuAnchor(event.currentTarget);
  };
  
  const handleAdminMenuClose = () => {
    setAdminMenuAnchor(null);
  };

  if (loading) return null;

  return (
    <>
      {/* Conteneur externe centré */}
      <Box className="flex justify-center w-full fixed top-0 z-50">
        <HideOnScroll>
          <AppBar 
            position="relative" // Changed from fixed to relative
            elevation={0} 
            sx={{
              background: 'rgba(155, 155, 155, 0.22)',
              backdropFilter: 'blur(10px)',
              borderBottom: '1px solid rgba(0, 0, 0, 0.07)',
              color: 'text.primary',
              maxWidth: '600px',
              width: '100%',
              borderBottomLeftRadius: '16px',
              borderBottomRightRadius: '16px',
              // Removed left: 50% and transform: translateX(-50%)
            }}
          >
            <Toolbar sx={{ justifyContent: 'space-between' }}>
              {/* ThemeSwitcher and Settings icon on the left */}
              <Box sx={{ marginLeft: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <ThemeSwitcher />
                <MuiTooltip title={user?.id === 1 ? "Administration" : "Administration (accès restreint)"}>
                  <span>
                    <IconButton 
                      size="small"
                      onClick={(e) => user?.id === 1 ? setAdminMenuAnchor(e.currentTarget) : null}
                      sx={{ 
                        color: user?.id === 1 ? 'text.secondary' : 'text.disabled',
                        cursor: user?.id === 1 ? 'pointer' : 'not-allowed' 
                      }}
                      disabled={user?.id !== 1}
                    >
                      <SettingsIcon />
                    </IconButton>
                  </span>
                </MuiTooltip>
                {/* Menu pour les outils d'administration */}
                <Menu
                  anchorEl={adminMenuAnchor}
                  open={adminMenuOpen && user?.id === 1}
                  onClose={() => setAdminMenuAnchor(null)}
                  slotProps={{
                    paper: {
                      sx: {
                        mt: 1,
                        minWidth: 250,
                        borderRadius: 2,
                        '& .MuiMenuItem-root': {
                          px: 2,
                          py: 1,
                        },
                      },
                    },
                  }}
                  transformOrigin={{ horizontal: 'center', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
                >
                  {/* Titre du menu avec icône */}
                  <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SettingsIcon fontSize="small" color="primary" />
                    <Typography variant="subtitle1" fontWeight="bold">
                      Administration
                    </Typography>
                  </Box>
                  
                  <Divider />
                  
                  {/* Switch pour l'auto-nettoyage des connexions - affiché conditionnellement sans utiliser de Fragment */}
                  {user?.id === 1 ? (
                    [
                      <Box key="db-cleanup-switch" sx={{ px: 2, py: 1.5 }}>
                        <DbCleanupSwitch />
                      </Box>,
                      <Divider key="db-cleanup-divider" />
                    ]
                  ) : null}
                  
                  <MenuItem component={Link} href="/logs" onClick={() => setAdminMenuAnchor(null)}>
                    <ListItemIcon>
                      <ListAltIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Logs" />
                  </MenuItem>
                  
                  <MenuItem onClick={() => {
                    setDbMonitoringOpen(true);
                    setAdminMenuAnchor(null);
                  }}>
                    <ListItemIcon>
                      <StorageIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Base de données" />
                  </MenuItem>
                </Menu>
              </Box>
              {/* Logo et titre de l'app */}
              <Typography 
                variant="h5" 
                component={Link} 
                href="/" 
                sx={{ 
                  fontWeight: 700,
                  textDecoration: 'none',
                  color: 'primary.main',
                  letterSpacing: '-0.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                
              </Typography>
              
              {/* Navigation principale */}
              <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 2 }}>
                <Button 
                  component={Link} 
                  href="/" 
                  color="inherit" 
                  sx={{ fontWeight: 500 }}
                >
                  <HomeIcon sx={{ fontSize: '1.5rem' }} />
                </Button>
                
                {/* Modified Activities button to trigger dropdown */}
                <MuiTooltip title="Activités">
                  <Button
                    color="inherit"
                    onClick={handleActivitiesMenuClick}
                    sx={{ fontWeight: 500 }}
                  >
                    <ViewListIcon sx={{ fontSize: '1.5rem' }} />
                  </Button>
                </MuiTooltip>
                
                {/* Activities Dropdown Menu */}
                <Menu
                  anchorEl={activitiesMenuAnchor}
                  open={activitiesMenuOpen}
                  onClose={handleActivitiesMenuClose}
                  onClick={handleActivitiesMenuClose}
                  slotProps={{
                    paper: {
                      elevation: 3,
                      sx: {
                        mt: 1,
                        minWidth: 200,
                        borderRadius: 2,
                        '& .MuiMenuItem-root': {
                          px: 2,
                          py: 1,
                        },
                      },
                    },
                  }}
                  transformOrigin={{ horizontal: 'center', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
                >
                  <MenuItem component={Link} href="/activities">
                    <ListItemIcon>
                      <FormatListBulletedIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Liste des activités" />
                  </MenuItem>
                  
                  <MenuItem component={Link} href="/activities/new">
                    <ListItemIcon>
                      <AddIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Nouvelle activité" />
                  </MenuItem>
                  
                  <Divider />

                  <MenuItem component={Link} href="/corrections">
                    <ListItemIcon>
                      <AssignmentIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Liste des corrections" />
                  </MenuItem>

                  <MenuItem component={Link} href="/corrections/new">
                    <ListItemIcon>
                      <AddIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Nouvelle correction" />
                  </MenuItem>

                  <Divider />
                  
                  <MenuItem component={Link} href="/fragments">
                    <ListItemIcon>
                      <CategoryIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Fragments" />
                  </MenuItem>
                  
                  <MenuItem component={Link} href="/recherches">
                    <ListItemIcon>
                      <SearchIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Recherche avancée" />
                  </MenuItem>
                  <MenuItem component={Link} href="/stats">
                    <ListItemIcon>
                      <FilterListIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Statistiques" />
                  </MenuItem>
                </Menu>
                
                {/* Nouveau bouton pour la gestion des classes */}
                <MuiTooltip title="Gestion des classes">
                  <Button
                    color="inherit"
                    onClick={handleClassMenuClick}
                    sx={{ fontWeight: 500 }}
                  >
                    <SchoolIcon sx={{ fontSize: '1.5rem' }} />
                  </Button>
                </MuiTooltip>
                
                {/* Menu déroulant pour la gestion des classes */}
                <Menu
                  anchorEl={classMenuAnchor}
                  open={classMenuOpen}
                  onClose={handleClassMenuClose}
                  onClick={handleClassMenuClose}
                  slotProps={{
                    paper: {
                      elevation: 3,
                      sx: {
                        mt: 1,
                        minWidth: 200,
                        borderRadius: 2,
                        '& .MuiMenuItem-root': {
                          px: 2,
                          py: 1,
                        },
                      },
                    },
                  }}
                  transformOrigin={{ horizontal: 'center', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
                >
                  <MenuItem component={Link} href="/classes">
                    <ListItemIcon>
                      <FormatListBulletedIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Liste des classes" />
                  </MenuItem>
                  
                  <MenuItem component={Link} href="/classes/new">
                    <ListItemIcon>
                      <AddIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Nouvelle classe" />
                  </MenuItem>
                  
                  <Divider />
                  
                  <MenuItem component={Link} href="/students">
                    <ListItemIcon>
                      <PeopleIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Gestion des étudiants" />
                  </MenuItem>
                </Menu>
              </Box>
              
              {/* Authentification */}
              {user ? (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {/* Composant de notifications */}
                  <NotificationBadge />
                  
                  <Button
                    variant="outlined"
                    onClick={handleMenuClick}
                    endIcon={<KeyboardArrowDown />}
                    startIcon={<AccountCircle />}
                    size="small"
                    sx={{ 
                      color: 'success.main',
                      borderRadius: '24px',
                      textTransform: 'none',
                      fontWeight: 500,
                      ml: 1
                    }}
                  >
                    {user.name || user.username}
                  </Button>
                  <Menu
                    anchorEl={anchorEl}
                    open={open}
                    onClose={handleMenuClose}
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'right',
                    }}
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                    slotProps={{
                      paper: {
                        elevation: 3,
                        sx: {
                          borderRadius: 2,
                          minWidth: 180,
                          mt: 1
                        }
                      }
                    }}
                  >
                    <MenuItem onClick={handleChangePasswordClick} sx={{ py: 1.5 }}>
                      Changer le mot de passe
                    </MenuItem>
                    <MenuItem onClick={handleLogout} sx={{ py: 1.5 }}>
                      Déconnexion
                    </MenuItem>
                  </Menu>
                </Box>
              ) : (
                <Button 
                  color="primary" 
                  onClick={() => {
                    // Capturer l'URL actuelle
                    const currentPath = window.location.pathname;
                    // Construire l'URL de login avec le paramètre callbackUrl
                    const loginUrl = `/login?callbackUrl=${encodeURIComponent(currentPath)}`;
                    // Rediriger vers la page de login
                    window.location.href = loginUrl;
                  }}
                  variant="contained"
                  sx={{ borderRadius: '24px' }}
                >
                  <AccountCircle />
                </Button>
              )}
            </Toolbar>
          </AppBar>
        </HideOnScroll>
      </Box>
      
      
      {/* Modal de changement de mot de passe */}
      <ChangePasswordModal
        open={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
      />
      
      {/* Modal pour le monitoring de la base de données */}
      <Dialog
        open={dbMonitoringOpen}
        onClose={() => setDbMonitoringOpen(false)}
        maxWidth="lg"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: 2,
              pt: 2
            }
          }
        }}
      >
        <DialogContent sx={{ p: 0 }}>
          <DatabaseMonitoring expanded={true} />
        </DialogContent>
      </Dialog>
    </>
  );
}
