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
      return NextResponse.json({ error: 'InvalidActivityID: ID invalide' }, { status: 400 });
    }

    // Récupérer l'utilisateur connecté
    const user = await getUser(req);
    
    // Valeur par défaut pour user.id si user est null
    const userId = user?.id; 
    
    // Récupérer l'activité, avec ou sans filtrage par utilisateur
    const activity = await getActivityById(activityId, userId);
    
    if (!activity) {
      return NextResponse.json({ error: 'ActivityNotFound: activité non trouvée' }, { status: 404 });
    }
    
    return NextResponse.json(activity);
  } catch (error) {
    console.error('ActivityFetchError:', error);
    return NextResponse.json({ error: 'ActivityFetchError: erreur lors de la récupération de l\'activité', details: String(error) }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params
    const { id } = await params;
    const activityId = parseInt(id);
    
    
    if (isNaN(activityId)) {
      return NextResponse.json({ error: 'InvalidActivityID: ID invalide' }, { status: 400 });
    }
    
    const data = await request.json();
    
    // Vérifier que les valeurs sont valides
    const experimentalPoints = data.experimental_points !== undefined 
      ? Number(data.experimental_points) 
      : 5;
      
    const theoreticalPoints = data.theoretical_points !== undefined 
      ? Number(data.theoretical_points) 
      : 15;
      
    // S'assurer que les valeurs sont des nombres valides
    if (isNaN(experimentalPoints) || isNaN(theoreticalPoints)) {
      return NextResponse.json(
        { error: "InvalidPointsValues: les valeurs de points doivent être des nombres valides" },
        { status: 400 }
      );
    }
    
    // Vérifier que le total est égal à 20
    // if (experimentalPoints + theoreticalPoints !== 20) {
    //   return NextResponse.json(
    //     { error: "le total des points doit être égal à 20" },
    //     { status: 400 }
    //   );
    // }

    // Récupérer l'utilisateur connecté (si nécessaire pour les permissions)
    const user = await getUser(request);
    
    // Mettre à jour l'activité en utilisant la fonction importée
    // Correction: modifier l'appel à updateActivity pour ne passer que 2 paramètres
    const success = await updateActivity(activityId, {
      name: data.name,
      content: data.content || '',
      experimental_points: experimentalPoints,
      theoretical_points: theoreticalPoints,
      user_id: user?.id ?? 0,
    });

    if (!success) {
      return NextResponse.json(
        { error: "ActivityUpdateFailed: Échec de la mise à jour de l'activité" },
        { status: 500 }
      );
    }
    
    // Récupérer l'activité mise à jour pour la renvoyer
    const userId = user?.id; // Définir userId ici pour l'utiliser avec getActivityById
    const updatedActivity = await getActivityById(activityId, userId);
    
    if (!updatedActivity) {
      return NextResponse.json(
        { error: "ActivityNotFound: Activité non trouvée après la mise à jour" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(updatedActivity);
  } catch (error) {
    console.error('ActivityUpdateError:', error);
    return NextResponse.json(
      { error: "ActivityUpdateError: Erreur serveur lors de la mise à jour de l'activité", details: String(error) },
      { status: 500 }
    );
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
      return NextResponse.json({ error: 'InvalidActivityID: ID invalide' }, { status: 400 });
    }

    // Récupérer l'utilisateur connecté
    const user = await getUser(req);
    
    if (!user) {
      return NextResponse.json({ error: 'AuthenticationRequired: utilisateur non authentifié' }, { status: 401 });
    }

    // Vérifier que l'activité existe et appartient à l'utilisateur
    const existingActivity = await getActivityById(activityId, user.id);
    
    if (!existingActivity) {
      return NextResponse.json({ error: 'ActivityNotFound: Activité non trouvée' }, { status: 404 });
    }

    const deleted = await deleteActivity(activityId);
    
    if (deleted) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'ActivityDeletionFailed: Échec de la suppression' }, { status: 500 });
    }
  } catch (error) {
    console.error('ActivityDeleteError:', error);
    return NextResponse.json({ error: 'ActivityDeleteError: Erreur lors de la suppression de l\'activité', details: String(error) }, { status: 500 });
  }
}
