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
  deadline?: string | null;
  submission_date?: string | null;
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
    const { deadline, submission_date } = data;

    return await withConnection(async (connection) => {
      // Récupérer l'ancienne correction pour le logging et les calculs
      const [oldCorrectionResult] = await connection.query<CorrectionRow[]>(
        'SELECT * FROM corrections WHERE id = ?',
        [correctionId]
      );
      
      const oldCorrection = Array.isArray(oldCorrectionResult) && oldCorrectionResult.length > 0
        ? oldCorrectionResult[0]
        : null;
        
      if (!oldCorrection) {
        return NextResponse.json({ error: 'Correction introuvable' }, { status: 404 });
      }

      // Construire la requête SQL pour mettre à jour uniquement les dates
      const fieldsToUpdate: string[] = [];
      const params: any[] = [];
      
      if (deadline !== undefined) {
        fieldsToUpdate.push('deadline = ?');
        params.push(deadline);
      }
      
      if (submission_date !== undefined) {
        fieldsToUpdate.push('submission_date = ?');
        params.push(submission_date);
      }
      
      if (fieldsToUpdate.length === 0) {
        return NextResponse.json({ error: 'Aucune date à mettre à jour' }, { status: 400 });
      }
      
      params.push(correctionId);
      
      // Exécuter la mise à jour des dates uniquement
      await connection.query(
        `UPDATE corrections SET ${fieldsToUpdate.join(', ')} WHERE id = ?`,
        params
      );

      // Créer un log pour la mise à jour des dates
      const dateChanges: Record<string, { old: any; new: any }> = {};
      
      // Utiliser des vérifications d'existence pour éviter les erreurs TypeScript
      const oldDeadline = oldCorrection.deadline;
      const oldSubmissionDate = oldCorrection.submission_date;
      
      if (deadline !== undefined && oldDeadline !== deadline) {
        dateChanges['deadline'] = {
          old: oldDeadline,
          new: deadline
        };
      }
      
      if (submission_date !== undefined && oldSubmissionDate !== submission_date) {
        dateChanges['submission_date'] = {
          old: oldSubmissionDate,
          new: submission_date
        };
      }
      
      if (Object.keys(dateChanges).length > 0) {
        await createLogEntry({
          action_type: 'UPDATE_DATES',
          description: `Modification des dates pour la correction #${id}`,
          entity_type: 'correction',
          entity_id: parseInt(id),
          user_id: user.id,
          username: user.username,
          metadata: {
            changes: dateChanges,
            activity_id: oldCorrection.activity_id,
            student_id: oldCorrection.student_id
          }
        });
      }
      
      // Récupérer la correction mise à jour
      const [updatedResult] = await connection.query<CorrectionRow[]>(
        'SELECT * FROM corrections WHERE id = ?',
        [correctionId]
      );
      
      const updatedCorrection = Array.isArray(updatedResult) && updatedResult.length > 0
        ? updatedResult[0]
        : null;

      return NextResponse.json({
        success: true,
        data: updatedCorrection,
        changes: dateChanges
      });
    });
  } catch (error) {
    console.error('Error updating dates:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour des dates' },
      { status: 500 }
    );
  }
}
