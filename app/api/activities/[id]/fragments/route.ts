import { NextResponse } from 'next/server';
import { getFragmentsByActivityId } from '@/lib/fragment';
import { getActivityById } from '@/lib/activity';

export async function GET(
  request: Request,
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

    const fragments = await getFragmentsByActivityId(activityId);
    return NextResponse.json(fragments);
  } catch (error) {
    console.error('Erreur lors de la récupération des fragments:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
