// Création d'un nouvel endpoint d'API pour le nettoyage des connexions dormantes

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getUser } from '@/lib/auth';
// Importer explicitement depuis le fichier TypeScript pour éviter d'utiliser la version JS
import { cleanupIdleConnections } from '@/lib/db';

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
    
    // Récupérer le temps minimum d'inactivité en secondes
    const data = await request.json();
    const minIdleTimeSeconds = data.minIdleTimeSeconds || 30; // Par défaut 30 secondes
    
    // Nettoyer les connexions dormantes
    const killedCount = await cleanupIdleConnections(minIdleTimeSeconds);
    
    return NextResponse.json({ 
      success: true, 
      message: `${killedCount} connexion(s) dormante(s) fermée(s)`,
      killedCount
    });
    
  } catch (error) {
    console.error('Erreur lors du nettoyage des connexions dormantes:', error);
    
    return NextResponse.json({
      error: 'Erreur lors du nettoyage des connexions dormantes',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}