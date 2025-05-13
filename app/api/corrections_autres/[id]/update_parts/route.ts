import { NextRequest, NextResponse } from 'next/server';
import { updateCorrectionAutre, getCorrectionAutreById } from '@/lib/correctionAutre';
import { getActivityAutreById } from '@/lib/activityAutre';
import { calculateGrade } from '@/lib/correctionAutre';
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { getUser } from '@/lib/auth';

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

    const { id } = await params;
    const correctionId = parseInt(id);
    

    if (isNaN(correctionId)) {
      return NextResponse.json({ error: 'ID de correction invalide' }, { status: 400 });
    }

    // Récupérer la correction existante
    const correction = await getCorrectionAutreById(correctionId);
    if (!correction) {
      return NextResponse.json({ error: 'Correction non trouvée' }, { status: 404 });
    }

    // Récupérer les données de la requête
    const data = await request.json();
    const { points_earned } = data;

    if (!Array.isArray(points_earned)) {
      return NextResponse.json({ error: 'Le champ points_earned doit être un tableau' }, { status: 400 });
    }

    // Récupérer l'activité associée à la correction pour obtenir les points maximums
    const activityId = correction.activity_id;
    const activity = await getActivityAutreById(activityId);
    if (!activity) {
      return NextResponse.json({ error: 'Activité associée non trouvée' }, { status: 404 });
    }

    // Synchroniser les points_earned avec les nouvelles parties de l'activité
    const updatedPointsEarned = [...points_earned];

    // Ajouter des zéros pour les nouvelles parties
    while (updatedPointsEarned.length < activity.points.length) {
      updatedPointsEarned.push(0);
    }

    // Supprimer les points excédentaires si des parties ont été supprimées
    while (updatedPointsEarned.length > activity.points.length) {
      updatedPointsEarned.pop();
    }

    // Calculer la note globale en utilisant les points synchronisés
    const { grade, final_grade } = calculateGrade(
      activity.points,
      updatedPointsEarned,
      correction.penalty
    );

    // Mettre à jour la correction avec les nouvelles valeurs synchronisées
    const success = await updateCorrectionAutre(correctionId, {
      points_earned: updatedPointsEarned,
      grade,
      final_grade
    });

    if (!success) {
      return NextResponse.json({ error: 'Erreur lors de la mise à jour de la correction' }, { status: 500 });
    }

    // Récupérer la correction mise à jour pour la renvoyer
    const updatedCorrection = await getCorrectionAutreById(correctionId);
    return NextResponse.json(updatedCorrection);

  } catch (error) {
    console.error('Erreur lors de la mise à jour des points de la correction:', error);
    return NextResponse.json({ 
      error: `Erreur serveur: ${(error as Error).message}` 
    }, { status: 500 });
  }
}