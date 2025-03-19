import { NextRequest, NextResponse } from 'next/server';
import { getActivityById, updateActivity, deleteActivity } from '@/lib/activity';
import { getUser } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params
    const { id } = await params;
    const activityId = parseInt(id);
    
    if (isNaN(activityId)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    // Récupérer l'utilisateur connecté
    const user = await getUser(req);
    
    // Valeur par défaut pour user.id si user est null
    const userId = user?.id; 
    
    // Récupérer l'activité, avec ou sans filtrage par utilisateur
    const activity = await getActivityById(activityId, userId);
    
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
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const activityId = parseInt(id);
    
    if (isNaN(activityId)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    // Récupérer l'utilisateur connecté
    const user = await getUser(req);
    
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non authentifié' }, { status: 401 });
    }

    const body = await req.json();
    const { name, content, experimental_points, theoretical_points } = body;
    
    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Le nom est requis' }, { status: 400 });
    }

    // Vérifier que l'activité existe et appartient à l'utilisateur
    const existingActivity = await getActivityById(activityId, user.id);
    
    if (!existingActivity) {
      return NextResponse.json({ error: 'Activité non trouvée' }, { status: 404 });
    }

    const updated = await updateActivity(activityId, {
      ...existingActivity,
      name,
      content,
      experimental_points: experimental_points || existingActivity.experimental_points,
      theoretical_points: theoretical_points || existingActivity.theoretical_points,
      user_id: user.id
    });
    
    if (updated) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Échec de la mise à jour' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error updating activity:', error);
    return NextResponse.json({ error: 'Erreur lors de la mise à jour de l\'activité' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const activityId = parseInt(id);
    
    if (isNaN(activityId)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    // Récupérer l'utilisateur connecté
    const user = await getUser(req);
    
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non authentifié' }, { status: 401 });
    }

    // Vérifier que l'activité existe et appartient à l'utilisateur
    const existingActivity = await getActivityById(activityId, user.id);
    
    if (!existingActivity) {
      return NextResponse.json({ error: 'Activité non trouvée' }, { status: 404 });
    }

    const deleted = await deleteActivity(activityId);
    
    if (deleted) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Échec de la suppression' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error deleting activity:', error);
    return NextResponse.json({ error: 'Erreur lors de la suppression de l\'activité' }, { status: 500 });
  }
}
