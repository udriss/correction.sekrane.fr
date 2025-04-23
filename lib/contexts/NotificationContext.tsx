'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { FeedbackNotification } from '@/lib/services/notificationService';

interface NotificationContextType {
  unreadCount: number;
  totalCount: number;
  notifications: FeedbackNotification[];
  loading: boolean;
  fetchNotificationCounts: () => Promise<void>; // Nouvelle fonction combinée
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

// Valeur par défaut du contexte
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0); // État pour le nombre total de notifications
  const [notifications, setNotifications] = useState<FeedbackNotification[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [lastCheck, setLastCheck] = useState<number>(Date.now());

  // Récupérer le nombre de notifications non lues et le nombre total de notifications
  const fetchNotificationCounts = async () => {
    try {
      const response = await fetch('/api/notifications?action=counts');
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count);
        setTotalCount(data.total);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des nombres de notifications:', error);
    }
  };

  // Récupérer les notifications récentes
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/notifications?includeRead=true&limit=20');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Marquer une notification comme lue
  const markAsRead = async (id: number) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'markAsRead', id }),
      });
      
      if (response.ok) {
        // Mettre à jour la liste des notifications localement
        setNotifications(prev => prev.map(notif => 
          notif.id === id ? { ...notif, readOk: true } : notif
        ));
        
        // Mettre à jour le compteur de notifications non lues
        setUnreadCount(prev => Math.max(0, prev - 1));
        
        // Récupérer le nombre total à jour
        fetchNotificationCounts();
      }
    } catch (error) {
      console.error('Erreur lors du marquage de la notification comme lue:', error);
    }
  };

  // Marquer toutes les notifications comme lues
  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'markAllAsRead' }),
      });
      
      if (response.ok) {
        // Mettre à jour la liste des notifications localement
        setNotifications(prev => prev.map(notif => ({ ...notif, readOk: true })));
        
        // Réinitialiser le compteur de notifications non lues
        setUnreadCount(0);
        
        // Récupérer le nombre total à jour
        fetchNotificationCounts();
      }
    } catch (error) {
      console.error('Erreur lors du marquage de toutes les notifications comme lues:', error);
    }
  };

  // Effet pour récupérer le nombre de notifications au chargement
  // et configurer une vérification périodique
  useEffect(() => {
    // Charger les données initiales
    fetchNotificationCounts();
    
    // Configurer l'intervalle de vérification périodique (toutes les 30 secondes)
    const intervalId = setInterval(() => {
      const now = Date.now();
      // Vérifier seulement si la dernière vérification date de plus de 30 secondes
      if (now - lastCheck > 30000) {
        fetchNotificationCounts();
        setLastCheck(now);
      }
    }, 30000);
    
    // Nettoyer l'intervalle lors du démontage du composant
    return () => clearInterval(intervalId);
  }, [lastCheck]);

  return (
    <NotificationContext.Provider 
      value={{ 
        unreadCount, 
        totalCount, 
        notifications, 
        loading, 
        fetchNotificationCounts, 
        fetchNotifications, 
        markAsRead, 
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

// Hook personnalisé pour accéder au contexte des notifications
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications doit être utilisé à l\'intérieur d\'un NotificationProvider');
  }
  return context;
}