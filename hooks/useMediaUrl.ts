import { useMemo } from 'react';

/**
 * Hook pour gérer les URLs de médias de manière adaptée à l'environnement
 * En développement: utilise le dossier public directement
 * En production: utilise l'API média pour servir les fichiers
 */
export const useMediaUrl = (originalUrl?: string): string | null => {
  return useMemo(() => {
    if (!originalUrl) return null;
    
    // Si l'URL commence déjà par /api/media, la retourner telle quelle
    if (originalUrl.startsWith('/api/media/')) {
      return originalUrl;
    }
    
    // Si c'est une URL absolue (http:// ou https://), la retourner telle quelle
    if (originalUrl.startsWith('http://') || originalUrl.startsWith('https://')) {
      return originalUrl;
    }
    
    // Si l'URL commence par /uploads/, la transformer selon l'environnement
    if (originalUrl.startsWith('/uploads/')) {
      // Côté client, on préfère toujours utiliser l'API média pour la cohérence
      // et pour éviter les problèmes de cache en production
      const pathParts = originalUrl.split('/');
      if (pathParts.length >= 4) {
        const activityId = pathParts[2];
        const fileName = pathParts[3];
        return `/api/media/${activityId}/${fileName}`;
      }
    }
    
    // Pour les autres URLs relatives, les retourner telles quelles
    return originalUrl;
  }, [originalUrl]);
};

/**
 * Fonction utilitaire pour convertir une URL de média selon l'environnement
 * Peut être utilisée dans des composants non-React ou des fonctions utilitaires
 */
export const getMediaUrl = (originalUrl?: string): string | null => {
  if (!originalUrl) return null;
  
  // Si l'URL commence déjà par /api/media, la retourner telle quelle
  if (originalUrl.startsWith('/api/media/')) {
    return originalUrl;
  }
  
  // Si c'est une URL absolue (http:// ou https://), la retourner telle quelle
  if (originalUrl.startsWith('http://') || originalUrl.startsWith('https://')) {
    return originalUrl;
  }
  
  // Si l'URL commence par /uploads/, la transformer selon l'environnement
  if (originalUrl.startsWith('/uploads/')) {
    // En développement, on peut utiliser le dossier public directement
    if (process.env.NODE_ENV === 'development') {
      return originalUrl;
    }
    
    // En production, rediriger vers l'API média
    // Format: /uploads/{activityId}/{fileName} -> /api/media/{activityId}/{fileName}
    const pathParts = originalUrl.split('/');
    if (pathParts.length >= 4) {
      const activityId = pathParts[2];
      const fileName = pathParts[3];
      return `/api/media/${activityId}/${fileName}`;
    }
  }
  
  // Pour les autres URLs relatives, les retourner telles quelles
  return originalUrl;
};
