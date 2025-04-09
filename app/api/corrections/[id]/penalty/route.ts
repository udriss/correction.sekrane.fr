import { NextRequest, NextResponse } from 'next/server';
import { withConnection } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { createLogEntry } from '@/lib/services/logsService';
import { RowDataPacket } from 'mysql2';

// Définir une interface pour le type Correction
interface CorrectionRow extends RowDataPacket {
  id: number;
  activity_id?: number;
  student_id?: number;
  penalty?: number | null;
  experimental_points_earned?: number | null;
  theoretical_points_earned?: number | null;
  grade?: number | null;
  [key: string]: any; // Pour les autres propriétés
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Récupérer l'ID de la correction à dupliquer
    const { id } = await params;
    const correctionId = parseInt(id);
    
    const data = await request.json();
    const { penalty } = data;

    // Vérifier si penalty est un nombre valide
    if (penalty === undefined || isNaN(parseFloat(String(penalty)))) {
      return NextResponse.json({ error: 'Pénalité invalide' }, { status: 400 });
    }

    const penaltyValue = parseFloat(String(penalty));

    return await withConnection(async (connection) => {
      // Récupérer l'ancienne correction pour le logging et le calcul de la note finale
      const [oldCorrectionResult] = await connection.query<CorrectionRow[]>(
        'SELECT * FROM corrections WHERE id = ?',
        [id]
      );
      
      const oldCorrection = Array.isArray(oldCorrectionResult) && oldCorrectionResult.length > 0
        ? oldCorrectionResult[0]
        : null;
        
      if (!oldCorrection) {
        return NextResponse.json({ error: 'Correction non trouvée' }, { status: 404 });
      }

      // Fonction utilitaire pour extraire un nombre depuis une valeur potentiellement null
      const parseNumberSafely = (value: number | string | null | undefined): number => {
        if (value === null || value === undefined) return 0;
        return typeof value === 'number' ? value : parseFloat(String(value)) || 0;
      };

      // Récupérer les notes actuelles pour recalculer la note totale
      const experimental = parseNumberSafely(oldCorrection.experimental_points_earned);
      const theoretical = parseNumberSafely(oldCorrection.theoretical_points_earned);
      
      // Calculer la nouvelle note totale en appliquant la pénalité
      const totalWithoutPenalty = experimental + theoretical;
      const finalGrade = Math.max(0, totalWithoutPenalty - penaltyValue);

      // Mettre à jour uniquement la pénalité et la note finale
      await connection.query(
        'UPDATE corrections SET penalty = ? WHERE id = ?',
        [penaltyValue, id]
      );

      // Créer un log pour la mise à jour de la pénalité
      await createLogEntry({
        action_type: 'UPDATE_PENALTY',
        description: `Modification de la pénalité pour la correction #${id}`,
        entity_type: 'correction',
        entity_id: parseInt(id),
        user_id: user.id,
        username: user.username,
        metadata: {
          old_penalty: oldCorrection.penalty,
          new_penalty: penaltyValue,
          old_grade: oldCorrection.grade,
          //new_grade: finalGrade,
          activity_id: oldCorrection.activity_id,
          student_id: oldCorrection.student_id
        }
      });
      
      // Récupérer la correction mise à jour
      const [updatedResult] = await connection.query<CorrectionRow[]>(
        'SELECT * FROM corrections WHERE id = ?',
        [id]
      );
      
      const updatedCorrection = Array.isArray(updatedResult) && updatedResult.length > 0
        ? updatedResult[0]
        : null;

      return NextResponse.json({
        success: true,
        data: updatedCorrection
      });
    });
  } catch (error) {
    console.error('Error updating penalty:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la pénalité' },
      { status: 500 }
    );
  }
}
