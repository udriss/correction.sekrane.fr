import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getUser } from '@/lib/auth';
import { 
  getCronCleanupEnabled, 
  setCronCleanupEnabled,
  getCronCleanupLastRun,
  formatRelativeTime 
} from '@/lib/services/appSettingsService';

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    const customUser = await getUser();
    
    const userId = customUser?.id || session?.user?.id;
    
    if (!userId) {
      return NextResponse.json({ error: 'Utilisateur non authentifié' }, { status: 401 });
    }
    
    // Vérifier si l'utilisateur est admin
    if (customUser?.id !== 1) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }
    
    // Récupérer l'état actuel du cron job
    const isEnabled = await getCronCleanupEnabled();
    const lastRunTimestamp = await getCronCleanupLastRun();
    
    return NextResponse.json({ 
      success: true,
      enabled: isEnabled,
      lastRun: lastRunTimestamp,
      lastRunFormatted: formatRelativeTime(lastRunTimestamp)
    });
    
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'état du cron job:', error);
    
    return NextResponse.json({
      error: 'Erreur lors de la récupération de l\'état du cron job',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    const customUser = await getUser();
    
    const userId = customUser?.id || session?.user?.id;
    
    if (!userId) {
      return NextResponse.json({ error: 'Utilisateur non authentifié' }, { status: 401 });
    }
    
    // Vérifier si l'utilisateur est admin
    if (customUser?.id !== 1) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }
    
    // Récupérer l'état souhaité du cron job
    const data = await request.json();
    const enabled = Boolean(data.enabled);
    
    // Mettre à jour l'état du cron job
    const success = await setCronCleanupEnabled(enabled);
    
    if (!success) {
      return NextResponse.json({ 
        error: 'Échec de mise à jour de l\'état du cron job' 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true,
      enabled: enabled,
      message: `Le cron job de nettoyage des connexions a été ${enabled ? 'activé' : 'désactivé'}`
    });
    
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'état du cron job:', error);
    
    return NextResponse.json({
      error: 'Erreur lors de la mise à jour de l\'état du cron job',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}