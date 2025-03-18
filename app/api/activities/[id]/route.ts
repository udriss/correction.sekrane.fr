import { NextRequest, NextResponse } from 'next/server';
import { getActivityById, updateActivity, deleteActivity } from '@/lib/activity';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Await params before accessing its properties
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID d\'activité invalide' }, { status: 400 });
    }

    const activity = await getActivityById(id);
    if (!activity) {
      return NextResponse.json({ error: 'Activité non trouvée' }, { status: 404 });
    }

    return NextResponse.json(activity);
  } catch (error) {
    console.error('Error fetching activity:', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération de l\'activité' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Await params before accessing its properties
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID d\'activité invalide' }, { status: 400 });
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
      return NextResponse.json({ error: 'Le nom de l\'activité est requis' }, { status: 400 });
    }
    
    // Validate points total to 20
    const experimentalPoints = body.experimental_points !== undefined ? Number(body.experimental_points) : 5;
    const theoreticalPoints = body.theoretical_points !== undefined ? Number(body.theoretical_points) : 15;
    
    if (experimentalPoints + theoreticalPoints !== 20) {
      return NextResponse.json(
        { error: 'Le total des points doit être égal à 20' }, 
        { status: 400 }
      );
    }

    // Check if activity exists
    const existingActivity = await getActivityById(id);
    if (!existingActivity) {
      return NextResponse.json({ error: 'Activité non trouvée' }, { status: 404 });
    }

    // Update the activity with points configuration
    const activityData = {
      name: body.name.trim(),
      content: body.content,
      experimental_points: experimentalPoints,
      theoretical_points: theoreticalPoints
    };

    const success = await updateActivity(id, activityData);
    if (!success) {
      return NextResponse.json({ error: 'Activité non trouvée ou non modifiée' }, { status: 404 });
    }

    // Get the updated activity
    const updatedActivity = await getActivityById(id);
    return NextResponse.json(updatedActivity);
  } catch (error) {
    console.error('Error updating activity:', error);
    return NextResponse.json({ error: 'Erreur lors de la mise à jour de l\'activité' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Await params before accessing its properties
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID d\'activité invalide' }, { status: 400 });
    }

    const success = await deleteActivity(id);
    if (!success) {
      return NextResponse.json({ error: 'Activité non trouvée' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting activity:', error);
    return NextResponse.json({ error: 'Erreur lors de la suppression de l\'activité' }, { status: 500 });
  }
}
