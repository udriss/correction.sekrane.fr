import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';
import { getUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    // Authentification
    const session = await getServerSession(authOptions);
    const customUser = await getUser(req);
    const userId = customUser?.id || session?.user?.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      );
    }
    
    // Récupérer les paramètres de la requête
    const { searchParams } = new URL(req.url);
    const activityId = searchParams.get('activityId');
    const studentIdsParam = searchParams.get('studentIds');
    
    if (!activityId || !studentIdsParam) {
      return NextResponse.json(
        { error: 'Paramètres manquants: activityId et studentIds sont requis' },
        { status: 400 }
      );
    }
    
    // Convertir les IDs d'étudiants en tableau
    const studentIds = studentIdsParam.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
    
    if (studentIds.length === 0) {
      return NextResponse.json([], { status: 200 });
    }
    
    // Échapper les valeurs pour la requête SQL
    const placeholders = studentIds.map(() => '?').join(',');
    
    // Effectuer la requête pour trouver les corrections existantes
    const result = await query(
      `SELECT id as correctionId, student_id as studentId, activity_id as activityId, 
       grade, penalty, class_id as classId, group_id as groupId
       FROM corrections 
       WHERE activity_id = ? AND student_id IN (${placeholders})`,
      [activityId, ...studentIds]
    );
    const rows = result as any[];
    console.log('Corrections existantes:', rows);
    return NextResponse.json(rows);
    
  } catch (error) {
    console.error('Erreur lors de la vérification des corrections existantes:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}