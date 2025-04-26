import { NextRequest, NextResponse } from 'next/server';
import { cleanupIdleConnections } from '@/lib/db';
import { 
  getCronCleanupEnabled, 
  updateCronCleanupLastRun 
} from '@/lib/services/appSettingsService';

// Clé secrète pour sécuriser l'accès à l'API
const CRON_SECRET = process.env.CRON_SECRET || 'default-secret-key-change-me';

export async function POST(request: NextRequest) {
  try {
    // Vérifier que la requête contient la clé d'autorisation correcte
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1]; // Format "Bearer TOKEN"
    
    if (!token || token !== CRON_SECRET) {
      console.error('Tentative d\'accès non autorisé au cron job de nettoyage');
      
      // Retourner un code 401 pour les tentatives non autorisées
      return NextResponse.json({ 
        error: 'Accès non autorisé' 
      }, { status: 401 });
    }
    
    // Vérifier si le cron job est activé
    const isEnabled = await getCronCleanupEnabled();
    
    if (!isEnabled) {
      return NextResponse.json({ 
        success: false,
        message: 'Le cron job de nettoyage est désactivé',
        killedCount: 0
      });
    }
    
    // Récupérer le temps minimum d'inactivité en secondes
    const data = await request.json().catch(() => ({}));
    const minIdleTimeSeconds = data.minIdleTimeSeconds || 60; // Par défaut 60 secondes
    
    // Nettoyer les connexions dormantes
    const killedCount = await cleanupIdleConnections(minIdleTimeSeconds);
    
    // Mettre à jour l'horodatage de dernière exécution
    await updateCronCleanupLastRun();
    
    return NextResponse.json({ 
      success: true, 
      message: `${killedCount} connexion(s) dormante(s) fermée(s)`,
      killedCount,
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.error('Erreur lors de l\'exécution du cron job de nettoyage:', error);
    
    return NextResponse.json({
      error: 'Erreur lors de l\'exécution du cron job de nettoyage',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}