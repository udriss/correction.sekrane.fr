// Import des fonctions requises
import { NextRequest, NextResponse } from 'next/server';
import { withConnection } from '@/lib/db';
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { getUser } from '@/lib/auth';
import { updateCorrectionAutre, getCorrectionAutreById, validateGradeConstraint, calculateGrade } from '@/lib/correctionAutre';
import { getActivityAutreById } from '@/lib/activityAutre';

interface GradeData {
  points_earned?: number[];
  grade?: number | null;
  final_grade?: number | null;
  penalty?: number | null;
  bonus?: number | null;
  status?: string; // Important pour gérer NON_RENDU
  disabledParts?: boolean[]; // Tableau des parties désactivées
  disabled_parts?: boolean[] | null; // Champ pour la base de données
}

// Route pour mettre à jour la note et pénalité d'une correction
export async function PUT(
  request: Request,
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

    const data: GradeData = await request.json();
    
    // Make sure we can parse the ID
    if (isNaN(correctionId)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }
    
    // Récupérer la correction actuelle pour avoir toutes les données nécessaires
    const correction = await getCorrectionAutreById(correctionId);
    if (!correction) {
      return NextResponse.json({ error: 'Correction not found' }, { status: 404 });
    }
    
    // Récupérer l'activité pour avoir le barème
    const activity = await getActivityAutreById(correction.activity_id);
    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
    }
    
    // Vérifier si on a un statut NON_RENDU spécifique
    const isNonRendu = data.status === 'NON_RENDU';
    
    // Récupérer les parties désactivées depuis les données
    const disabledParts = data.disabledParts as boolean[] | undefined;
    
    // Total des points maximums pour l'activité en excluant les parties désactivées
    let totalMaxPoints = 0;
    for (let i = 0; i < activity.points.length; i++) {
      if (!disabledParts || !disabledParts[i]) {
        totalMaxPoints += activity.points[i];
      }
    }
    
    // Valeurs par défaut
    let pointsEarned = data.points_earned;
    let gradeValue = data.grade;
    let finalGradeValue = data.final_grade;
    let penaltyValue = data.penalty !== undefined ? data.penalty : (correction.penalty || 0);
    let bonusValue = data.bonus !== undefined ? data.bonus : (correction.bonus || 0);
    
    // Cas spécial pour travail non rendu
    if (isNonRendu) {
      // Créer un tableau de zéros
      pointsEarned = new Array(activity.points.length).fill(0);
      
      // Calculer 25% des points max pour grade et final_grade (en excluant les parties désactivées)
      const grade25Percent = totalMaxPoints * 0.25;
      
      // Définir explicitement les valeurs pour "travail non rendu"
      gradeValue = grade25Percent;
      finalGradeValue = grade25Percent; // Note finale = note brute pour les travaux non rendus
      penaltyValue = 0; // Pas de pénalité pour travail non rendu
      bonusValue = 0; // Pas de bonus pour travail non rendu
      
      
    } 
    // Si points_earned est null (travail non rendu), on utilise directement la note fournie
    else if (data.points_earned === null && data.grade !== undefined) {
      // Considérer comme un travail non rendu si on passe points_earned=null
      pointsEarned = new Array(activity.points.length).fill(0);
      gradeValue = data.grade;
      finalGradeValue = data.grade; // final_grade = grade pour ce cas spécial
      penaltyValue = 0;
    }
    else {
      // Cas normal: utiliser les points fournis ou existants
      pointsEarned = data.points_earned !== undefined ? data.points_earned : correction.points_earned || [];
      
      // Utiliser la fonction calculateGrade centralisée pour assurer la cohérence
      // en passant les parties désactivées
      const calculatedGrades = calculateGrade(
        activity.points,
        pointsEarned,
        penaltyValue,
        bonusValue,
        disabledParts
      );
      
      // Utiliser les valeurs calculées par la fonction centralisée
      gradeValue = calculatedGrades.grade;
      finalGradeValue = calculatedGrades.final_grade;
    }
    
    // Valeurs à mettre à jour avec validation des contraintes de base de données
    const updateData: GradeData = {
      points_earned: pointsEarned,
      grade: validateGradeConstraint(gradeValue, 'grade'),
      final_grade: validateGradeConstraint(finalGradeValue, 'final_grade'),
      penalty: validateGradeConstraint(penaltyValue, 'penalty'),
      bonus: validateGradeConstraint(bonusValue, 'bonus'),
      disabled_parts: disabledParts || null // Sauvegarder les parties désactivées
    };
    
    // Ajouter le statut si fourni
    if (data.status) {
      updateData.status = data.status;
    }
    
    // Mettre à jour la correction
    const updated = await updateCorrectionAutre(correctionId, updateData);
    
    if (!updated) {
      return NextResponse.json({ error: 'No update was made' }, { status: 400 });
    }
    
    // Récupérer la correction mise à jour
    const updatedCorrection = await getCorrectionAutreById(correctionId);
    
    return NextResponse.json({
      message: 'Grade updated successfully',
      points_earned: updatedCorrection?.points_earned,
      grade: updatedCorrection?.grade,
      final_grade: updatedCorrection?.final_grade,
      penalty: updatedCorrection?.penalty,
      bonus: updatedCorrection?.bonus,
      status: updatedCorrection?.status
    });
  } catch (error) {
    console.error('Error updating grade:', error);
    return NextResponse.json(
      { error: 'Failed to update grade' },
      { status: 500 }
    );
  }
}