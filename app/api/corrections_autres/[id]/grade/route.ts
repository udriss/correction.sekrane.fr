import { NextRequest, NextResponse } from 'next/server';
import { withConnection } from '@/lib/db';
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { getUser } from '@/lib/auth';
import { updateCorrectionAutre, getCorrectionAutreById } from '@/lib/correctionAutre';
import { getActivityAutreById } from '@/lib/activityAutre';

interface GradeData {
  points_earned?: number[];
  grade?: number;
  final_grade?: number;
  penalty?: number;
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
    const activityId = parseInt(id);

    const data: GradeData = await request.json();
    
    // Make sure we can parse the ID
    if (isNaN(activityId)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }
    
    // Récupérer la correction actuelle pour avoir toutes les données nécessaires
    const correction = await getCorrectionAutreById(activityId);
    if (!correction) {
      return NextResponse.json({ error: 'Correction not found' }, { status: 404 });
    }
    
    // Récupérer l'activité pour avoir le barème
    const activity = await getActivityAutreById(correction.activity_id);
    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
    }
    
    // Déterminer les points_earned à utiliser
    const pointsEarned = data.points_earned !== null && data.points_earned !== undefined 
      ? data.points_earned 
      : correction.points_earned || [];
    
    // Calculer la note totale
    // Si points_earned est null (travail non rendu), on utilise directement la note fournie
    const totalPoints = data.points_earned === null
      ? (data.grade || activity.points.reduce((sum, point) => sum + point, 0) * 0.25)
      : pointsEarned.reduce((sum, point) => sum + (point || 0), 0);
    
    const penaltyValue = data.penalty !== undefined ? data.penalty : (correction.penalty || 0);
    
    // Calculer la note finale selon les règles
    let finalGrade;
    if (totalPoints < 5) {
      // Si la note est inférieure à 5, on conserve cette note
      finalGrade = totalPoints;
    } else {
      // Sinon, on prend le maximum entre (note-pénalité) et 5
      finalGrade = Math.max(5, totalPoints - penaltyValue);
    }
    
    // Valeurs à mettre à jour
    const updateData: GradeData = {
      points_earned: pointsEarned,
      grade: totalPoints,
      final_grade: finalGrade,
      penalty: penaltyValue
    };
    
    // Mettre à jour la correction
    const updated = await updateCorrectionAutre(activityId, updateData);
    
    if (!updated) {
      return NextResponse.json({ error: 'No update was made' }, { status: 400 });
    }
    
    // Récupérer la correction mise à jour
    const updatedCorrection = await getCorrectionAutreById(activityId);
    
    return NextResponse.json({
      message: 'Grade updated successfully',
      points_earned: updatedCorrection?.points_earned,
      grade: updatedCorrection?.grade,
      final_grade: updatedCorrection?.final_grade,
      penalty: updatedCorrection?.penalty
    });
  } catch (error) {
    console.error('Error updating grade:', error);
    return NextResponse.json(
      { error: 'Failed to update grade' },
      { status: 500 }
    );
  }
}