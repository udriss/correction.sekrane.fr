// filepath: /var/www/correction.sekrane.fr/app/api/activities_autres/[id]/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCorrectionAutreStatsByActivity, getCorrectionAutreStatsByGroups } from '@/lib/correctionAutre';
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { getUser } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get the user from both auth systems
    const session = await getServerSession(authOptions);
    const customUser = await getUser();
    
    // Use either auth system, starting with custom auth
    const userId = customUser?.id || session?.user?.id;
    
    if (!userId) {
      return NextResponse.json({ error: 'utilisateur non authentifié' }, { status: 401 });
    }

    // Get the activity ID from parameters
    const { id } = await params;
    const activityId = parseInt(id);
    
    if (isNaN(activityId)) {
      return NextResponse.json(
        { error: 'ID d\'activité invalide' },
        { status: 400 }
      );
    }
    
    // Get query parameters
    const url = new URL(request.url);
    const includeInactive = url.searchParams.get('includeInactive') === 'true';
    
    // Récupérer les statistiques globales ET les statistiques par groupe
    const globalStats = await getCorrectionAutreStatsByActivity(activityId, includeInactive);
    const groupStats = await getCorrectionAutreStatsByGroups(activityId, includeInactive);
    
    // Log pour le débogage

    // 
    
    // Renvoyer uniquement les statistiques par groupe, car c'est ce qu'attend le composant
    return NextResponse.json(globalStats);
  } catch (error: any) {
    console.error('Error fetching activity stats:', error);
    
    // Préparer les détails d'erreur pour les inclure dans la réponse
    const errorDetails = {
      message: error.message || 'Error fetching activity statistics',
      code: error.code || 'UNKNOWN_ERROR',
      sql: error.sql,
      sqlMessage: error.sqlMessage,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };
    
    return NextResponse.json(
      { 
        error: 'Error fetching activity statistics', 
        details: errorDetails
      },
      { status: 500 }
    );
  }
}