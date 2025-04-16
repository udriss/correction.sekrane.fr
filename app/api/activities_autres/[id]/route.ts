import { NextRequest, NextResponse } from 'next/server';
import { getActivityAutreById, updateActivityAutre, deleteActivityAutre } from '@/lib/activityAutre';
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { getUser } from '@/lib/auth';

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

    // Await the params
    const { id } = await params;
    const activityId = parseInt(id);
    
    if (isNaN(activityId)) {
      return NextResponse.json({ error: 'InvalidActivityID: ID invalide' }, { status: 400 });
    }

    // Récupérer l'utilisateur connecté
    const user = await getUser(req);
    
    // Récupérer l'activité sans passer l'userId qui n'est pas supporté par la fonction
    const activity = await getActivityAutreById(activityId);
    
    if (!activity) {
      return NextResponse.json({ error: 'ActivityNotFound: activité non trouvée' }, { status: 404 });
    }
    
    return NextResponse.json(activity);
  } catch (error) {
    console.error('ActivityFetchError:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      details: error 
    }, { status: 500 });
  }
}

export async function PUT(
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

    // Await the params
    const { id } = await params;
    const activityId = parseInt(id);
    
    if (isNaN(activityId)) {
      return NextResponse.json({ error: 'InvalidActivityID: ID invalide' }, { status: 400 });
    }
    
    const data = await request.json();
    
    // Vérifier que points est un tableau valide si fourni
    if (data.points !== undefined && (data.points.some((p: unknown) => typeof p !== 'number'))) {
      return NextResponse.json(
        { error: "InvalidPointsValues: les valeurs de points doivent être un tableau de nombres" },
        { status: 400 }
      );
    }

    // Récupérer l'utilisateur connecté (si nécessaire pour les permissions)
    const user = await getUser(request);
    
    // Mettre à jour l'activité en utilisant la fonction importée avec le nouveau modèle de données
    const success = await updateActivityAutre(activityId, {
      name: data.name,
      content: data.content || '',
      parts_names: data.parts_names,
      points: data.points,
      user_id: user?.id ?? -1,
    });

    if (!success) {
      return NextResponse.json(
        { error: "ActivityUpdateFailed: Échec de la mise à jour de l'activité" },
        { status: 500 }
      );
    }
    
    // Récupérer l'activité mise à jour sans passer l'userId
    const updatedActivity = await getActivityAutreById(activityId);
    
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
    // Get the user from both auth systems
    const session = await getServerSession(authOptions);
    const customUser = await getUser();
    
    // Use either auth system, starting with custom auth
    const userId = customUser?.id || session?.user?.id;
    
    if (!userId) {
      return NextResponse.json({ error: 'utilisateur non authentifié' }, { status: 401 });
    }
    
    const { id } = await params;
    const activityId = parseInt(id);
    
    if (isNaN(activityId)) {
      return NextResponse.json({ error: 'ID d\'activité invalide' }, { status: 400 });
    }


    // Supprimer l'activité
    const success = await deleteActivityAutre(activityId, customUser?.id);
    
    if (!success) {
      return NextResponse.json({ error: 'Échec de la suppression de l\'activité' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, message: 'Activité supprimée avec succès' });
  } catch (error) {
    console.error('ActivityDeleteError:', error);
    return NextResponse.json({ error: 'ActivityDeleteError: Erreur lors de la suppression de l\'activité', details: String(error) }, { status: 500 });
  }
}