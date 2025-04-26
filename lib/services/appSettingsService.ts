import { withConnection, query } from '@/lib/db';

/**
 * Interface pour les paramètres d'application
 */
export interface AppSetting {
  id: number;
  setting_key: string;
  setting_value: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Récupère un paramètre d'application par sa clé
 * @param key Clé du paramètre
 * @returns Valeur du paramètre ou null si non trouvé
 */
export async function getAppSetting(key: string): Promise<string | null> {
  try {
    const result = await query<AppSetting[]>(
      'SELECT setting_value FROM app_settings WHERE setting_key = ?',
      [key]
    );
    
    if (!Array.isArray(result) || result.length === 0) {
      return null;
    }
    
    return result[0].setting_value;
  } catch (error) {
    console.error(`Error getting app setting ${key}:`, error);
    return null;
  }
}

/**
 * Met à jour ou crée un paramètre d'application
 * @param key Clé du paramètre
 * @param value Valeur du paramètre
 * @returns Succès de l'opération
 */
export async function setAppSetting(key: string, value: string): Promise<boolean> {
  try {
    // Vérifier si le paramètre existe
    const existing = await getAppSetting(key);
    
    if (existing !== null) {
      // Mettre à jour le paramètre existant
      await query(
        'UPDATE app_settings SET setting_value = ?, updated_at = NOW() WHERE setting_key = ?',
        [value, key]
      );
    } else {
      // Créer un nouveau paramètre
      await query(
        'INSERT INTO app_settings (setting_key, setting_value) VALUES (?, ?)',
        [key, value]
      );
    }
    
    return true;
  } catch (error) {
    console.error(`Error setting app setting ${key}:`, error);
    return false;
  }
}

/**
 * Récupère l'état actuel du job de nettoyage automatique
 * @returns État du job (true si actif, false sinon)
 */
export async function getCronCleanupEnabled(): Promise<boolean> {
  const value = await getAppSetting('cron_cleanup_enabled');
  return value === 'true';
}

/**
 * Active ou désactive le job de nettoyage automatique
 * @param enabled État du job (true pour activer, false pour désactiver)
 * @returns Succès de l'opération
 */
export async function setCronCleanupEnabled(enabled: boolean): Promise<boolean> {
  return await setAppSetting('cron_cleanup_enabled', enabled ? 'true' : 'false');
}

/**
 * Met à jour l'horodatage de la dernière exécution du job de nettoyage
 * @returns Succès de l'opération
 */
export async function updateCronCleanupLastRun(): Promise<boolean> {
  return await setAppSetting('cron_cleanup_last_run', Date.now().toString());
}

/**
 * Récupère l'horodatage de la dernière exécution du job de nettoyage
 * @returns Horodatage de la dernière exécution (timestamp) ou 0 si jamais exécuté
 */
export async function getCronCleanupLastRun(): Promise<number> {
  const value = await getAppSetting('cron_cleanup_last_run');
  return value ? parseInt(value, 10) : 0;
}

/**
 * Fonction d'utilitaire pour formater une date relative
 * @param timestamp Horodatage à formatter
 * @returns Chaîne formatée (ex: "il y a 5 minutes")
 */
export function formatRelativeTime(timestamp: number): string {
  if (!timestamp) return 'jamais';
  
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffSec = Math.floor(diffMs / 1000);
  
  if (diffSec < 60) return `il y a ${diffSec} seconde${diffSec > 1 ? 's' : ''}`;
  
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `il y a ${diffMin} minute${diffMin > 1 ? 's' : ''}`;
  
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `il y a ${diffHour} heure${diffHour > 1 ? 's' : ''}`;
  
  const diffDay = Math.floor(diffHour / 24);
  return `il y a ${diffDay} jour${diffDay > 1 ? 's' : ''}`;
}