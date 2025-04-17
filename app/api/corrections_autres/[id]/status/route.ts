import { NextRequest, NextResponse } from 'next/server';
import { withConnection } from '@/lib/db';
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { getUser } from '@/lib/auth';
import { createLogEntry } from '@/lib/services/logsService';

// API pour mettre à jour le statut et potentiellement les notes d'une correction autre
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

    // Récupérer l'ID de la correction
    const { id } = await params;
    const correctionId = parseInt(id);
    
    if (isNaN(correctionId)) {
      return NextResponse.json({ error: 'ID de correction invalide' }, { status: 400 });
    }

    const requestData = await request.json();
    
    // Gérer à la fois le nouveau système de statut et l'ancien booléen active
    let status: string;
    let activeValue: number;
    let gradeUpdate: number | null | undefined = undefined;
    let penaltyUpdate: number | null | undefined = undefined;
    let finalGradeUpdate: number | null | undefined = undefined;
    let updateGrades = false;

    if ('status' in requestData) {
      status = requestData.status as string; // Assert type as string
      const validStatuses = ['ACTIVE', 'DEACTIVATED', 'ABSENT', 'NON_RENDU', 'NON_NOTE'];
      // Ensure status is a string before checking includes
      if (typeof status !== 'string' || !validStatuses.includes(status)) {
        return NextResponse.json({ error: 'Statut invalide' }, { status: 400 });
      }
      activeValue = status === 'ACTIVE' ? 1 : 0;

      // Check if grade updates are included in the payload (sent from the hook)
      if ('grade' in requestData && 'penalty' in requestData && 'final_grade' in requestData) {
          // Ensure the types are correct (number or null)
          gradeUpdate = requestData.grade === undefined ? undefined : (requestData.grade as number | null);
          penaltyUpdate = requestData.penalty === undefined ? undefined : (requestData.penalty as number | null);
          finalGradeUpdate = requestData.final_grade === undefined ? undefined : (requestData.final_grade as number | null);
          // Only set updateGrades to true if all values are explicitly provided (even if null)
          if (gradeUpdate !== undefined && penaltyUpdate !== undefined && finalGradeUpdate !== undefined) {
             updateGrades = true;
          }
      }

    } else if ('active' in requestData) {
      // Handle legacy active toggle if needed, though status should be preferred
      activeValue = requestData.active ? 1 : 0;
      status = activeValue ? 'ACTIVE' : 'DEACTIVATED';
    } else {
      return NextResponse.json(
        { error: 'Données manquantes, status ou active requis' },
        { status: 400 }
      );
    }

    // Ensure status and activeValue are defined before proceeding
    if (status === undefined || activeValue === undefined) {
       return NextResponse.json({ error: 'Erreur interne: status ou active non défini' }, { status: 500 });
    }

    return await withConnection(async (connection) => {
      // Récupérer l'état actuel pour logging
      const [currentState] = await connection.query(
        'SELECT status, active, grade, penalty, final_grade, activity_id, student_id FROM corrections_autres WHERE id = ?',
        [correctionId]
      );
      
      if (!Array.isArray(currentState) || currentState.length === 0) {
        return NextResponse.json(
          { error: 'Correction autre non trouvée' },
          { status: 404 }
        );
      }
      
      const currentData = currentState[0] as any;
      
      // Construire la requête SQL dynamiquement
      let sql = 'UPDATE corrections_autres SET status = ?, active = ?';
      // Ensure status and activeValue are not undefined before adding to params
      const sqlParams: (string | number | null)[] = [status, activeValue];

      if (updateGrades) {
        // Ensure grade updates are not undefined before adding
        if (gradeUpdate !== undefined && penaltyUpdate !== undefined && finalGradeUpdate !== undefined) {
            sql += ', grade = ?, penalty = ?, final_grade = ?';
            // Explicitly cast to expected types for the query
            sqlParams.push(gradeUpdate as number | null, penaltyUpdate as number | null, finalGradeUpdate as number | null);
        } else {
            // Should not happen if updateGrades is true, but good for safety
            console.warn('updateGrades is true, but grade values are undefined. Skipping grade update.');
            updateGrades = false; // Correct the flag
        }
      }

      sql += ' WHERE id = ?';
      sqlParams.push(correctionId);

      // Mettre à jour la correction
      const [result] = await connection.query(sql, sqlParams);
      
      const updateResult = result as any;
      if (!updateResult || !updateResult.affectedRows || updateResult.affectedRows === 0) {
        return NextResponse.json(
          { error: 'Correction autre non modifiée' },
          { status: 404 }
        );
      }

      // Préparer les métadonnées pour le log
      const logMetadata: any = {
        old_status: currentData.status,
        new_status: status,
        old_active: currentData.active,
        new_active: activeValue,
        activity_id: currentData.activity_id,
        student_id: currentData.student_id
      };

      if (updateGrades) {
        logMetadata.old_grade = currentData.grade;
        logMetadata.new_grade = gradeUpdate;
        logMetadata.old_penalty = currentData.penalty;
        logMetadata.new_penalty = penaltyUpdate;
        logMetadata.old_final_grade = currentData.final_grade;
        logMetadata.new_final_grade = finalGradeUpdate;
      }

      // Créer un log pour le changement de statut
      await createLogEntry({
        action_type: 'UPDATE_STATUS_CORRECTION_AUTRE',
        description: `Changement statut/notes correction autre #${correctionId}: Statut ${currentData.status || 'N/A'}->${status}${updateGrades ? ', Notes modifiées' : ''}`,
        entity_type: 'correction_autre',
        entity_id: correctionId,
        user_id: customUser?.id,
        username: customUser?.username,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        metadata: logMetadata
      });
      
      // Récupérer des informations supplémentaires pour le retour
      const [activityInfo] = await connection.query(
        `SELECT a.name as activity_name, 
         CONCAT(s.first_name, ' ', s.last_name) as student_name
         FROM corrections_autres c
         LEFT JOIN activities_autres a ON c.activity_id = a.id
         LEFT JOIN students s ON c.student_id = s.id
         WHERE c.id = ?`,
        [correctionId]
      );
      
      // Construire la réponse
      const responsePayload: any = {
        id: correctionId,
        status,
        active: activeValue,
        ...(Array.isArray(activityInfo) && activityInfo.length > 0 ? activityInfo[0] : {})
      };

      if (updateGrades) {
        // Ensure grade updates are not undefined before adding to response
        responsePayload.grade = gradeUpdate !== undefined ? gradeUpdate : null; 
        responsePayload.penalty = penaltyUpdate !== undefined ? penaltyUpdate : null;
        responsePayload.final_grade = finalGradeUpdate !== undefined ? finalGradeUpdate : null;
      }

      return NextResponse.json(responsePayload);
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut/notes:', error);
    
    // Logger l'erreur
    try {
      const user = await getUser(request);
      await createLogEntry({
        action_type: 'UPDATE_STATUS_ERROR_CORRECTION_AUTRE',
        description: `Erreur lors de la mise à jour du statut/notes d'une correction autre: ${(error as Error).message}`,
        user_id: user?.id,
        username: user?.username,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
      });
    } catch (logError) {
      console.error('Erreur lors de la création du log:', logError);
    }
    
    return NextResponse.json(
      { error: 'Erreur serveur lors de la mise à jour du statut/notes' },
      { status: 500 }
    );
  }
}