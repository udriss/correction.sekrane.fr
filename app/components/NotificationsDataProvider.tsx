'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { FeedbackNotification } from '@/lib/services/notificationService';
import { useSnackbar } from 'notistack';
import dayjs from 'dayjs';

interface PaginationOptions {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

interface Filters {
  search: string;
  read: 'all' | 'read' | 'unread';
  dateFrom: any | null;
  dateTo: any | null;
}

interface SortOptions {
  field: 'viewed_at' | 'created_at' | 'feedback_title';
  direction: 'asc' | 'desc';
}

interface ContextValue {
  notifications: FeedbackNotification[];
  allNotifications: FeedbackNotification[]; // Toutes les notifications (pour le cache)
  isLoading: boolean;
  error: { code: number; message: string } | null;
  pagination: PaginationOptions;
  goToPage: (page: number) => void;
  setItemsPerPage: (itemsPerPage: number) => void;
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  activeFilters: string[];
  setActiveFilters: React.Dispatch<React.SetStateAction<string[]>>;
  sortOptions: SortOptions;
  setSortOptions: (options: SortOptions) => void;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  openFeedback: (shareCode: string, notificationId: number) => void;
  clearAllFilters: () => void;
  unreadCount: number;
  readCount: number;
}

interface ProviderProps {
  children: React.ReactNode;
}

const NotificationsDataContext = createContext<ContextValue | undefined>(undefined);

export function useNotificationsData() {
  const context = useContext(NotificationsDataContext);
  if (!context) {
    throw new Error('useNotificationsData must be used within a NotificationsDataProvider');
  }
  return context;
}

export default function NotificationsDataProvider({ children }: ProviderProps) {
  const { enqueueSnackbar } = useSnackbar();
  
  // États principaux
  const [allNotifications, setAllNotifications] = useState<FeedbackNotification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<{ code: number; message: string } | null>(null);
  
  // État de pagination
  const [pagination, setPagination] = useState<PaginationOptions>({
    currentPage: 1,
    itemsPerPage: 20,
    totalItems: 0,
    totalPages: 0
  });

  // États des filtres
  const [filters, setFilters] = useState<Filters>({
    search: '',
    read: 'all',
    dateFrom: null,
    dateTo: null
  });

  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  // État du tri
  const [sortOptions, setSortOptions] = useState<SortOptions>({
    field: 'viewed_at',
    direction: 'desc'
  });

  // Messages d'erreur par code HTTP
  const errorMessages: Record<number, string> = {
    401: 'Authentification requise pour accéder aux notifications',
    403: 'Vous n\'avez pas les permissions nécessaires pour accéder aux notifications',
    404: 'Le service de notifications n\'est pas disponible',
    500: 'Erreur interne du serveur lors de la récupération des notifications',
    503: 'Service de notifications temporairement indisponible'
  };

  // Récupérer les notifications
  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/notifications?includeRead=true&limit=1000');
      
      if (response.ok) {
        const data = await response.json();
        setAllNotifications(data.notifications || []);
      } else {
        const statusCode = response.status;
        const errorMessage = errorMessages[statusCode] || 'Erreur lors de la récupération des notifications';
        setError({ code: statusCode, message: errorMessage });
        console.error(`Erreur ${statusCode}: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications:', error);
      setError({ code: 0, message: 'Impossible de se connecter au serveur de notifications' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fonctions de pagination
  const goToPage = useCallback((page: number) => {
    setPagination(prev => ({
      ...prev,
      currentPage: Math.max(1, Math.min(page, prev.totalPages))
    }));
  }, []);

  const setItemsPerPage = useCallback((itemsPerPage: number) => {
    setPagination(prev => ({
      ...prev,
      itemsPerPage,
      currentPage: 1,
      totalPages: Math.ceil(prev.totalItems / itemsPerPage)
    }));
  }, []);

  // Notifications filtrées et triées
  const filteredAndSortedNotifications = useMemo(() => {
    let result = allNotifications.filter((notification: FeedbackNotification) => {
      // Filtre par recherche
      if (activeFilters.includes('search') && filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          notification.activity_name?.toLowerCase().includes(searchLower) ||
          notification.student_name?.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      // Filtre par statut de lecture
      if (activeFilters.includes('read') && filters.read !== 'all') {
        if (filters.read === 'read' && !notification.readOk) return false;
        if (filters.read === 'unread' && notification.readOk) return false;
      }

      // Filtre par date de début
      if (activeFilters.includes('dateFrom') && filters.dateFrom) {
        const notificationDate = dayjs(notification.viewed_at);
        if (notificationDate.isBefore(filters.dateFrom, 'day')) return false;
      }

      // Filtre par date de fin
      if (activeFilters.includes('dateTo') && filters.dateTo) {
        const notificationDate = dayjs(notification.viewed_at);
        if (notificationDate.isAfter(filters.dateTo, 'day')) return false;
      }

      return true;
    });

    // Tri
    result.sort((a, b) => {
      switch (sortOptions.field) {
        case 'viewed_at':
          const dateA = new Date(a.viewed_at).getTime();
          const dateB = new Date(b.viewed_at).getTime();
          return sortOptions.direction === 'asc' ? dateA - dateB : dateB - dateA;
        
        case 'created_at':
          const createdA = new Date(a.viewed_at).getTime();
          const createdB = new Date(b.viewed_at).getTime();
          return sortOptions.direction === 'asc' ? createdA - createdB : createdB - createdA;
        
        case 'feedback_title':
          const titleA = a.activity_name || '';
          const titleB = b.activity_name || '';
          return sortOptions.direction === 'asc' 
            ? titleA.localeCompare(titleB)
            : titleB.localeCompare(titleA);
        
        default:
          return 0;
      }
    });

    return result;
  }, [allNotifications, filters, activeFilters, sortOptions]);

  // Mise à jour de la pagination quand les données changent
  useEffect(() => {
    const totalItems = filteredAndSortedNotifications.length;
    const totalPages = Math.ceil(totalItems / pagination.itemsPerPage);
    
    setPagination(prev => ({
      ...prev,
      totalItems,
      totalPages,
      currentPage: Math.max(1, Math.min(prev.currentPage, totalPages || 1))
    }));
  }, [filteredAndSortedNotifications.length, pagination.itemsPerPage]);

  // Notifications paginées pour l'affichage
  const paginatedNotifications = useMemo(() => {
    const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
    const endIndex = startIndex + pagination.itemsPerPage;
    return filteredAndSortedNotifications.slice(startIndex, endIndex);
  }, [filteredAndSortedNotifications, pagination.currentPage, pagination.itemsPerPage]);

  // Compteurs
  const unreadCount = useMemo(() => {
    return allNotifications.filter(n => !n.readOk).length;
  }, [allNotifications]);

  const readCount = useMemo(() => {
    return allNotifications.filter(n => n.readOk).length;
  }, [allNotifications]);

  // Marquer une notification comme lue
  const markAsRead = useCallback(async (id: number) => {
    // Mise à jour optimiste : mettre à jour l'état local immédiatement
    setAllNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, readOk: true }
          : notification
      )
    );

    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'markAsRead', id }),
      });
      
      if (response.ok) {
        enqueueSnackbar('Notification marquée comme lue', { variant: 'success' });
      } else {
        // En cas d'erreur, revenir à l'état précédent
        setAllNotifications(prev => 
          prev.map(notification => 
            notification.id === id 
              ? { ...notification, readOk: false }
              : notification
          )
        );
        enqueueSnackbar('Erreur lors du marquage de la notification', { variant: 'error' });
      }
    } catch (error) {
      console.error('Erreur lors du marquage de la notification comme lue:', error);
      // En cas d'erreur, revenir à l'état précédent
      setAllNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, readOk: false }
            : notification
        )
      );
      enqueueSnackbar('Erreur lors du marquage de la notification', { variant: 'error' });
    }
  }, [enqueueSnackbar]);

  // Marquer toutes les notifications comme lues
  const markAllAsRead = useCallback(async () => {
    // Sauvegarder l'état actuel pour pouvoir revenir en arrière en cas d'erreur
    const previousNotifications = allNotifications;
    
    // Mise à jour optimiste : marquer toutes les notifications comme lues
    setAllNotifications(prev => 
      prev.map(notification => ({ ...notification, readOk: true }))
    );

    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'markAllAsRead' }),
      });
      
      if (response.ok) {
        enqueueSnackbar('Toutes les notifications marquées comme lues', { variant: 'success' });
      } else {
        // En cas d'erreur, revenir à l'état précédent
        setAllNotifications(previousNotifications);
        enqueueSnackbar('Erreur lors du marquage des notifications', { variant: 'error' });
      }
    } catch (error) {
      console.error('Erreur lors du marquage de toutes les notifications comme lues:', error);
      // En cas d'erreur, revenir à l'état précédent
      setAllNotifications(previousNotifications);
      enqueueSnackbar('Erreur lors du marquage des notifications', { variant: 'error' });
    }
  }, [allNotifications, enqueueSnackbar]);

  // Ouvrir un feedback
  const openFeedback = useCallback((shareCode: string, notificationId: number) => {
    if (!shareCode) return;
    
    // Marquer la notification comme lue si elle ne l'est pas déjà
    const notification = allNotifications.find(n => n.id === notificationId);
    if (notification && !notification.readOk) {
      markAsRead(notificationId);
    }
    
    // Ouvrir dans un nouvel onglet
    window.open(`/feedback/${shareCode}`, '_blank');
  }, [allNotifications, markAsRead]);

  // Rafraîchir les notifications
  const refreshNotifications = useCallback(async () => {
    await fetchNotifications();
  }, [fetchNotifications]);

  // Effacer tous les filtres
  const clearAllFilters = useCallback(() => {
    setActiveFilters([]);
    setFilters({
      search: '',
      read: 'all',
      dateFrom: null,
      dateTo: null
    });
  }, []);

  // Charger les notifications au montage
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const value = {
    notifications: paginatedNotifications,
    allNotifications: filteredAndSortedNotifications,
    isLoading,
    error,
    pagination,
    goToPage,
    setItemsPerPage,
    filters,
    setFilters,
    activeFilters,
    setActiveFilters,
    sortOptions,
    setSortOptions,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    openFeedback,
    clearAllFilters,
    unreadCount,
    readCount
  };

  return (
    <NotificationsDataContext.Provider value={value}>
      {children}
    </NotificationsDataContext.Provider>
  );
}
