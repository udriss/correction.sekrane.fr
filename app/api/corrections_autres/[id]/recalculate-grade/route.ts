import { NextRequest, NextResponse } from 'next/server';
import { withConnection } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { getUser } from '@/lib/auth';
import { authOptions } from '@/lib/auth';
import { getCorrectionAutreById, updateCorrectionAutre, validateGradeConstraint, calculateGrade } from '@/lib/correctionAutre';
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
    
    // Récupérer les données du body de la requête pour les parties désactivées
    const body = await request.json().catch(() => ({}));
    const disabledParts = body.disabledParts as boolean[] | undefined;
    
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
    const { points_earned, penalty, bonus, status } = correction;
    
    // Calculer la note finale en fonction du statut
    let finalGrade;
    let grade;
    
    if (status === 'NON_RENDU') {
      // Pour un travail non rendu, calculer 25% du total des points
      // en excluant les parties désactivées
      let totalMaxPoints = 0;
      for (let i = 0; i < activity.points.length; i++) {
        if (!disabledParts || !disabledParts[i]) {
          totalMaxPoints += activity.points[i];
        }
      }
      const grade25Percent = totalMaxPoints * 0.25;
      grade = validateGradeConstraint(grade25Percent, 'grade');
      finalGrade = validateGradeConstraint(grade25Percent, 'final_grade');
    } else {
      // Utiliser la fonction centralisée calculateGrade qui inclut déjà la validation
      // en passant les parties désactivées
      const calculatedGrades = calculateGrade(
        activity.points,
        points_earned,
        penalty,
        bonus,
        disabledParts
      );
      grade = calculatedGrades.grade;
      finalGrade = calculatedGrades.final_grade;
    }

    // Mettre à jour la note finale dans la base de données
    const updateData = {
      final_grade: finalGrade,
      grade: grade,
      disabled_parts: disabledParts || null // Sauvegarder les parties désactivées
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