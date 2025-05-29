import { NextRequest, NextResponse } from 'next/server';
import { withConnection } from '@/lib/db';
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { getUser } from '@/lib/auth';
import { createLogEntry } from '@/lib/services/logsService';
import { RowDataPacket } from 'mysql2';
import { getCorrectionAutreById, updateCorrectionAutre, calculateGrade } from '@/lib/correctionAutre';
import { getActivityAutreById } from '@/lib/activityAutre';

// Définir une interface pour le type CorrectionAutre
interface CorrectionAutreRow extends RowDataPacket {
  id: number;
  activity_id?: number;
  student_id?: number;
  bonus?: number | null;
  points_earned?: string | null;
  grade?: number | null;
  [key: string]: any; // Pour les autres propriétés
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

    // Récupérer l'ID de la correction à mettre à jour
    const { id } = await params;
    const correctionId = parseInt(id);
    
    const data = await request.json();
    const { bonus } = data;

    // Vérifier si bonus est un nombre valide
    if (bonus === undefined || isNaN(parseFloat(String(bonus)))) {
      return NextResponse.json({ error: 'Bonus invalide' }, { status: 400 });
    }

    const bonusValue = parseFloat(String(bonus));

    return await withConnection(async (connection) => {
      // Récupérer l'ancienne correction pour le logging
      const [oldCorrectionResult] = await connection.query<CorrectionAutreRow[]>(
        'SELECT * FROM corrections_autres WHERE id = ?',
        [id]
      );
      
      const oldCorrection = Array.isArray(oldCorrectionResult) && oldCorrectionResult.length > 0
        ? oldCorrectionResult[0]
        : null;
        
      if (!oldCorrection) {
        return NextResponse.json({ error: 'Correction autre non trouvée' }, { status: 404 });
      }

      // Récupérer les points actuels
      let points_earned = [];
      try {
        if (oldCorrection.points_earned) {
          if (typeof oldCorrection.points_earned === 'string') {
            points_earned = JSON.parse(oldCorrection.points_earned);
          } else if (Array.isArray(oldCorrection.points_earned)) {
            points_earned = oldCorrection.points_earned;
          }
        }
      } catch (e) {
        console.warn('Failed to parse points_earned:', e);
        points_earned = [];
      }

      // Récupérer l'activité pour obtenir le barème
      const activity = await getActivityAutreById(oldCorrection.activity_id || 0);
      if (!activity) {
        return NextResponse.json({ error: 'Activité associée non trouvée' }, { status: 404 });
      }

      // Calculer la nouvelle note en prenant en compte le bonus ET la pénalité existante
      const currentPenalty = oldCorrection.penalty || 0;
      const newGrade = calculateGrade(activity.points, points_earned, currentPenalty, bonusValue);
      
      // Mettre à jour le bonus
      await updateCorrectionAutre(correctionId, {
        bonus: bonusValue,
        grade: newGrade.grade,
        final_grade: newGrade.final_grade,
      });

      // Créer un log pour la mise à jour du bonus
      await createLogEntry({
        action_type: 'UPDATE_BONUS_AUTRE',
        description: `Modification du bonus pour la correction autre #${id}`,
        entity_type: 'correction_autre',
        entity_id: parseInt(id),
        user_id: customUser?.id,
        username: customUser?.username,
        metadata: {
          old_bonus: oldCorrection.bonus,
          new_bonus: bonusValue,
          old_grade: oldCorrection.grade,
          new_grade: newGrade,
          activity_id: oldCorrection.activity_id,
          student_id: oldCorrection.student_id
        }
      });
      
      // Récupérer la correction mise à jour
      const updatedCorrection = await getCorrectionAutreById(correctionId);

      return NextResponse.json({
        success: true,
        data: updatedCorrection
      });
    });
  } catch (error) {
    console.error('Error updating bonus for correction_autre:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du bonus' },
      { status: 500 }
    );
  }
}
