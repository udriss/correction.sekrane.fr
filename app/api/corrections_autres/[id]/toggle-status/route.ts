import { NextRequest, NextResponse } from 'next/server';
import { withConnection } from '@/lib/db';
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { getUser } from '@/lib/auth';
import { createLogEntry } from '@/lib/services/logsService';

export async function POST(
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
    
    
    const data = await request.json();
    const requestedStatus = data.status || 'ACTIVE'; // Default to ACTIVE if not specified

    return await withConnection(async (connection) => {
      // Récupérer d'abord l'état actuel de la correction
      const [currentState] = await connection.query(
        'SELECT status, grade, penalty, submission_date, final_grade FROM corrections_autres WHERE id = ?',
        [correctionId]
      );
      
      if (!Array.isArray(currentState) || currentState.length === 0) {
        return NextResponse.json({ error: 'Correction non trouvée' }, { status: 404 });
      }
      
      const currentStatus = (currentState[0] as any).status || 'ACTIVE';
      
      // Définir les actions appropriées en fonction du statut demandé
      let query = '';
      let actionType = '';
      let actionDescription = '';
      
      switch(requestedStatus) {
        case 'ACTIVE':
          query = `UPDATE corrections_autres SET 
                   status = 'ACTIVE',
                   penalty = 0,
                   submission_date = NOW(),
                   final_grade = 0,
                   grade = 0,
                   updated_at = NOW()
                   WHERE id = ?`;
          actionType = 'ACTIVATE_CORRECTION_AUTRE';
          actionDescription = `Activation de la correction autre #${correctionId}`;
          break;
          
        case 'DEACTIVATED':
          query = `UPDATE corrections_autres SET 
                   status = 'DEACTIVATED',
                   penalty = NULL,
                   submission_date = NULL,
                   final_grade = NULL,
                   grade = NULL,
                   updated_at = NOW()
                   WHERE id = ?`;
          actionType = 'DEACTIVATE_CORRECTION_AUTRE';
          actionDescription = `Désactivation de la correction autre #${correctionId}`;
          break;
          
        case 'ABSENT':
          query = `UPDATE corrections_autres SET 
                   status = 'ABSENT',
                   penalty = 0,
                   grade = 0,
                   final_grade = 0,
                   updated_at = NOW()
                   WHERE id = ?`;
          actionType = 'MARK_ABSENT_CORRECTION_AUTRE';
          actionDescription = `Marquage comme absent pour la correction autre #${correctionId}`;
          break;
          
        case 'NON_RENDU':
          query = `UPDATE corrections_autres SET 
                   status = 'NON_RENDU',
                   penalty = 0,
                   grade = 0,
                   final_grade = 0,
                   updated_at = NOW()
                   WHERE id = ?`;
          actionType = 'MARK_NOT_SUBMITTED_CORRECTION_AUTRE';
          actionDescription = `Marquage comme non rendu pour la correction autre #${correctionId}`;
          break;
          
        default:
          return NextResponse.json({ error: 'Statut invalide' }, { status: 400 });
      }
      
      // Exécuter la requête de mise à jour
      const [result] = await connection.query(query, [correctionId]);
      
      // Journaliser l'action
      await createLogEntry({
        action_type: actionType,
        description: actionDescription,
        entity_type: 'correction_autre',
        entity_id: correctionId,
        user_id: customUser?.id,
        username: customUser?.username,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        metadata: {
          previous_state: currentState[0],
          new_status: requestedStatus
        }
      });
      
      // Préparation du message de réponse
      let statusMessage = '';
      switch(requestedStatus) {
        case 'ACTIVE':
          statusMessage = 'activée';
          break;
        case 'DEACTIVATED':
          statusMessage = 'désactivée';
          break;
        case 'ABSENT':
          statusMessage = 'marquée comme absent';
          break;
        case 'NON_RENDU':
          statusMessage = 'marquée comme non rendue';
          break;
        case 'DISPENSE':
          statusMessage = 'marquée comme dispensée';
          break;
      }
      
      return NextResponse.json({ 
        success: true, 
        message: `Correction ${statusMessage} avec succès`,
        status: requestedStatus
      });
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut de la correction:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la mise à jour du statut' },
      { status: 500 }
    );
  }
}