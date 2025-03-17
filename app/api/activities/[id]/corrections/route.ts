import { NextResponse } from 'next/server';
import { getCorrectionsByActivityId, createCorrection } from '@/lib/correction';
import { getActivityById } from '@/lib/activity';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params object to access its properties
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

    const corrections = await getCorrectionsByActivityId(activityId);
    return NextResponse.json(corrections);
  } catch (error) {
    console.error('Erreur lors de la récupération des corrections:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
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
