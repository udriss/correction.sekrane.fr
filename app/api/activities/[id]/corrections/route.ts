import { NextRequest, NextResponse } from 'next/server';
import { getActivityById } from '@/lib/activity';
import { getUser } from '@/lib/auth';
import { getCorrectionsByActivityId, createCorrection } from '@/lib/correction';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Attendre la résolution de la promise params
    const { id } = await params;
    const activityId = parseInt(id);
    
    if (isNaN(activityId)) {
      return NextResponse.json({ error: 'ID d\'activité invalide' }, { status: 400 });
    }

    // Récupérer l'utilisateur connecté
    const user = await getUser(req);
    
    // Récupérer l'activité, avec gestion des cas où userId est undefined
    const activity = await getActivityById(activityId, user?.id);
    
    if (!activity) {
      return NextResponse.json({ error: 'Activité non trouvée' }, { status: 404 });
    }
    
    const corrections = await getCorrectionsByActivityId(activityId);
    return NextResponse.json(corrections);
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

    const activity = await getActivityById(activityId);
    if (!activity) {
      return NextResponse.json(
        { error: 'Activity not found' },
        { status: 404 }
      );
    }

    const { student_name, content } = await request.json();

    const correctionData = {
      activity_id: activityId,
      student_name: student_name || null,
      content: content || ''
    };

    const newId = await createCorrection(correctionData);
    return NextResponse.json({ id: newId, ...correctionData }, { status: 201 });
  } catch (error) {
    console.error('Erreur lors de la création de la correction:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}