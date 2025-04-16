import { NextRequest, NextResponse } from 'next/server';
import { getActivityAutreById } from '@/lib/activityAutre';
import { getUser } from '@/lib/auth';
import { createCorrectionAutre } from '@/lib/correctionAutre';
import { withConnection } from '@/lib/db';
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";


export async function GET(
  req: NextRequest,
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

    // Attendre la résolution de la promise params
    const { id } = await params;
    const activityId = parseInt(id);
    
    if (isNaN(activityId)) {
      return NextResponse.json({ error: 'ID d\'activité invalide' }, { status: 400 });
    }

    // Récupérer l'utilisateur connecté
    const user = await getUser(req);
    
    // Récupérer l'activité - we need to handle the case where getActivityAutreById only accepts one parameter
    const activity = await getActivityAutreById(activityId);
    
    if (!activity) {
      return NextResponse.json({ error: 'Activité non trouvée' }, { status: 404 });
    }
    
    return await withConnection(async (connection) => {
      const [rows] = await connection.query(
        `SELECT c.*, a.name as activity_name, a.parts_names, a.points,
         s.first_name, s.last_name,
         sc.code as shareCode,
         cl.name as class_name
         FROM corrections_autres c 
         JOIN activities_autres a ON c.activity_id = a.id 
         LEFT JOIN students s ON c.student_id = s.id
         LEFT JOIN share_codes sc ON c.id = sc.correction_id AND sc.is_active = 1
         LEFT JOIN classes cl ON c.class_id = cl.id
         WHERE c.activity_id = ? 
         ORDER BY c.created_at DESC`,
        [activityId]
      );
      
      return NextResponse.json(rows);
    });
  } catch (error) {
    console.error('Error fetching corrections:', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération des corrections' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const activityId = parseInt(id || '');
    
    if (isNaN(activityId)) {
      return NextResponse.json(
        { error: 'Invalid activity ID' },
        { status: 400 }
      );
    }

    const activity = await getActivityAutreById(activityId);

    if (!activity) {
      return NextResponse.json(
        { error: 'Activity not found' },
        { status: 404 }
      );
    }

    const { student_id, content, class_id } = await request.json();
    

    
    const correctionData = {
      activity_id: activityId,
      student_id: student_id || null,
      content: content || '',
      class_id: class_id || null,
      group_id: 0 // Valeur par défaut pour les corrections isolées
    };

    const newId = await createCorrectionAutre(correctionData);
    return NextResponse.json({ id: newId, ...correctionData }, { status: 201 });
  } catch (error) {
    console.error('Erreur lors de la création de la correction:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: String(error) },
      { status: 500 }
    );
  }
}