'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface DbCleanupContextType {
  autoCleanupEnabled: boolean;
  setAutoCleanupEnabled: (enabled: boolean) => void;
  lastRunFormatted: string;
  isLoading: boolean;
  isCronJob: boolean;
}

const DbCleanupContext = createContext<DbCleanupContextType | undefined>(undefined);

export function DbCleanupProvider({ children }: { children: ReactNode }) {
  const [autoCleanupEnabled, setAutoCleanupEnabled] = useState<boolean>(false);
  const [lastRunFormatted, setLastRunFormatted] = useState<string>('jamais');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCronJob, setIsCronJob] = useState<boolean>(true); // Par défaut, on utilise le cron job

  // Fetch the server state for the cron job
  const fetchCronState = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/db-status/cron-cleanup', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setAutoCleanupEnabled(data.enabled);
        setLastRunFormatted(data.lastRunFormatted);
      } else {
        // Si l'API échoue, revenir à l'état local
        setIsCronJob(false);
        const savedState = localStorage.getItem('autoCleanupEnabled');
        setAutoCleanupEnabled(savedState === 'true');
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'état du cron job:', error);
      // Si l'API échoue, revenir à l'état local
      setIsCronJob(false);
      const savedState = localStorage.getItem('autoCleanupEnabled');
      setAutoCleanupEnabled(savedState === 'true');
    } finally {
      setIsLoading(false);
    }
  };

  // Charger l'état initial depuis le serveur
  useEffect(() => {
    fetchCronState();
    
    // Rafraîchir l'état toutes les 60 secondes
    const intervalId = setInterval(fetchCronState, 60000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Handler pour mettre à jour l'état
  const handleSetAutoCleanupEnabled = async (enabled: boolean) => {
    setIsLoading(true);
    
    if (isCronJob) {
      try {
        // Mise à jour côté serveur via API
        const response = await fetch('/api/admin/db-status/cron-cleanup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ enabled }),
        });
        
        if (response.ok) {
          const data = await response.json();
          setAutoCleanupEnabled(data.enabled);
          // Rafraîchir pour obtenir la dernière exécution
          fetchCronState();
        } else {
          console.error('Erreur lors de la mise à jour de l\'état du cron job');
        }
      } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'état du cron job:', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Fallback en mode local/navigateur (ancienne méthode)
      try {
        localStorage.setItem('autoCleanupEnabled', enabled.toString());
        setAutoCleanupEnabled(enabled);
        
        // Si l'auto-nettoyage est activé, démarrer un intervalle pour nettoyer les connexions
        let cleanupInterval: NodeJS.Timeout | null = null;
        
        if (enabled) {
          console.log('Auto-nettoyage (navigateur) activé - nettoyage des connexions dormantes toutes les 60 secondes');
          cleanupInterval = setInterval(async () => {
            try {
              const response = await fetch('/api/admin/db-status/cleanup-sleep', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ minIdleTimeSeconds: 60 }),
              });
              
              if (response.ok) {
                const data = await response.json();
                if (data.killedCount > 0) {
                  console.log(`Auto-nettoyage: ${data.killedCount} connexion(s) dormante(s) fermée(s)`);
                }
              }
            } catch (error) {
              console.error('Erreur lors de l\'auto-nettoyage:', error);
            }
          }, 60000); // Nettoyer toutes les 60 secondes
        }
        
        // Nettoyage de l'intervalle lors du démontage du composant
        return () => {
          if (cleanupInterval) {
            clearInterval(cleanupInterval);
          }
        };
      } catch (error) {
        console.error('Erreur lors de la sauvegarde dans le localStorage:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  return (
    <DbCleanupContext.Provider 
      value={{ 
        autoCleanupEnabled, 
        setAutoCleanupEnabled: handleSetAutoCleanupEnabled,
        lastRunFormatted,
        isLoading,
        isCronJob
      }}
    >
      {children}
    </DbCleanupContext.Provider>
  );
}

export function useDbCleanup() {
  const context = useContext(DbCleanupContext);
  if (context === undefined) {
    throw new Error('useDbCleanup must be used within a DbCleanupProvider');
  }
  return context;
}