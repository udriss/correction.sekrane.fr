import { NextRequest, NextResponse } from 'next/server';
import { withConnection } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { getUser } from '@/lib/auth';
import { authOptions } from '@/lib/auth';
import { getCorrectionAutreById, updateCorrectionAutre } from '@/lib/correctionAutre';
import { getActivityAutreById } from '@/lib/activityAutre';

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
    const correctionId = parseInt(id);
    
    if (isNaN(correctionId)) {
      return NextResponse.json({ error: 'Format d\'ID invalide' }, { status: 400 });
    }
    
    // Récupérer la correction existante avec l'activité associée
    const correction = await getCorrectionAutreById(correctionId);
    if (!correction) {
      return NextResponse.json({ message: 'Correction non trouvée' }, { status: 404 });
    }
    
    // Récupérer l'activité pour avoir le barème
    const activity = await getActivityAutreById(correction.activity_id);
    if (!activity) {
      return NextResponse.json({ error: 'Activité non trouvée' }, { status: 404 });
    }

    // Extraire les données nécessaires pour le calcul
    const { points_earned, penalty, status } = correction;
    
    // Calculer la note finale en fonction du statut
    let finalGrade;
    
    if (status === 'NON_RENDU') {
      // Pour un travail non rendu, calculer 25% du total des points
      const totalMaxPoints = activity.points.reduce((sum, points) => sum + points, 0);
      finalGrade = Math.round(totalMaxPoints * 0.25 * 100) / 100; // Arrondir à 2 décimales
    } else {
      // Calculer la note totale
      const totalGrade = points_earned.reduce((sum, points) => sum + (points || 0), 0);
      
      // Appliquer la règle de calcul de note finale
      if (totalGrade < 5) {
        // Si la note est inférieure à 5, on garde la note originale
        finalGrade = totalGrade;
      } else {
        // Sinon, on prend le maximum entre (note-pénalité) et 5
        finalGrade = Math.max(totalGrade - (penalty || 0), 5);
      }
    }

    // Mettre à jour la note finale dans la base de données
    const updateData = {
      final_grade: finalGrade,
      grade: points_earned.reduce((sum, points) => sum + (points || 0), 0)
    };
    
    const updated = await updateCorrectionAutre(correctionId, updateData);
    
    if (!updated) {
      return NextResponse.json({ error: 'Aucune mise à jour effectuée' }, { status: 400 });
    }

    // Récupérer la correction mise à jour
    const updatedCorrection = await getCorrectionAutreById(correctionId);

    return NextResponse.json({
      message: 'Note finale recalculée avec succès',
      points_earned: updatedCorrection?.points_earned,
      grade: updatedCorrection?.grade,
      final_grade: updatedCorrection?.final_grade,
      penalty: updatedCorrection?.penalty,
      status: updatedCorrection?.status
    });
  } catch (error: any) {
    console.error('Erreur lors du recalcul de la note finale:', error);
    return NextResponse.json(
      { message: error.message || 'Erreur serveur', details: error },
      { status: 500 }
    );
  }
}