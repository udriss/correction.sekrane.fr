import { NextRequest, NextResponse } from 'next/server';
import { withConnection } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { createLogEntry } from '@/lib/services/logsService';
import { RowDataPacket } from 'mysql2';

// Définir une interface pour le type Correction
interface CorrectionRow extends RowDataPacket {
  id: number;
  experimental_points_earned: number | null | string;
  theoretical_points_earned: number | null | string;
  penalty: number | null | string;
  grade: number | null | string;
  activity_id?: number;
  student_id?: number;
  [key: string]: any;
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
    const { experimental_points_earned, theoretical_points_earned, penalty, grade } = data;

    // Vérifier que les valeurs sont valides
    if ((experimental_points_earned === undefined || isNaN(parseFloat(String(experimental_points_earned)))) && 
        (theoretical_points_earned === undefined || isNaN(parseFloat(String(theoretical_points_earned)))) &&
        (grade === undefined || isNaN(parseFloat(String(grade))))) {
      return NextResponse.json({ error: 'Données de notation invalides' }, { status: 400 });
    }

    return await withConnection(async (connection) => {
      // Récupérer l'ancienne correction pour le logging et les calculs
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

      // Déterminer les champs à mettre à jour
      const fieldsToUpdate: string[] = [];
      const params: any[] = [];
      
      // Fonction utilitaire pour extraire un nombre depuis une valeur potentiellement null
      const parseNumberSafely = (value: number | string | null | undefined): number => {
        if (value === null || value === undefined) return 0;
        return typeof value === 'number' ? value : parseFloat(String(value)) || 0;
      };
      
      // Note expérimentale
      if (experimental_points_earned !== undefined && !isNaN(parseFloat(String(experimental_points_earned)))) {
        fieldsToUpdate.push('experimental_points_earned = ?');
        params.push(parseFloat(String(experimental_points_earned)));
      }
      
      // Note théorique
      if (theoretical_points_earned !== undefined && !isNaN(parseFloat(String(theoretical_points_earned)))) {
        fieldsToUpdate.push('theoretical_points_earned = ?');
        params.push(parseFloat(String(theoretical_points_earned)));
      }
      
      // Pénalité
      if (penalty !== undefined && !isNaN(parseFloat(String(penalty)))) {
        fieldsToUpdate.push('penalty = ?');
        params.push(parseFloat(String(penalty)));
      }
      
      // Calculer la note finale en utilisant notre fonction utilitaire
      const expPoints = experimental_points_earned !== undefined 
        ? parseNumberSafely(experimental_points_earned) 
        : parseNumberSafely(oldCorrection.experimental_points_earned);
      
      const theoPoints = theoretical_points_earned !== undefined 
        ? parseNumberSafely(theoretical_points_earned)
        : parseNumberSafely(oldCorrection.theoretical_points_earned);
      
      const penaltyPoints = penalty !== undefined 
        ? parseNumberSafely(penalty)
        : parseNumberSafely(oldCorrection.penalty);
      
      // Calculer la note totale (minimum 0)
      const finalGrade = Math.max(0, expPoints + theoPoints - penaltyPoints);
      
      fieldsToUpdate.push('grade = ?');
      params.push(finalGrade);
      
      // Ajouter l'ID à la fin des paramètres
      params.push(id);
      
      // Exécuter la mise à jour si des champs sont à modifier
      if (fieldsToUpdate.length === 0) {
        return NextResponse.json({ error: 'Aucune donnée à mettre à jour' }, { status: 400 });
      }

      await connection.query(
        `UPDATE corrections SET ${fieldsToUpdate.join(', ')} WHERE id = ?`,
        params
      );

      // Créer un log pour la mise à jour des notes
      await createLogEntry({
        action_type: 'UPDATE_GRADE',
        description: `Modification des notes pour la correction #${id}`,
        entity_type: 'correction',
        entity_id: parseInt(id),
        user_id: user.id,
        username: user.username,
        metadata: {
          old_experimental: oldCorrection.experimental_points_earned,
          new_experimental: experimental_points_earned !== undefined ? experimental_points_earned : oldCorrection.experimental_points_earned,
          old_theoretical: oldCorrection.theoretical_points_earned,
          new_theoretical: theoretical_points_earned !== undefined ? theoretical_points_earned : oldCorrection.theoretical_points_earned,
          old_penalty: oldCorrection.penalty,
          new_penalty: penalty !== undefined ? penalty : oldCorrection.penalty,
          old_total: oldCorrection.grade,
          new_total: finalGrade
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
    console.error('Error updating grade:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour des notes' },
      { status: 500 }
    );
  }
}
