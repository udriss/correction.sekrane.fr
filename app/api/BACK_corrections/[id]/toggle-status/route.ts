import { NextRequest, NextResponse } from 'next/server';
import { withConnection } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { createLogEntry } from '@/lib/services/logsService';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const correctionId = parseInt(id);
    
    // Vérifier l'authentification
    const user = await getUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    
    const data = await request.json();
    const requestedStatus = data.status || 'ACTIVE'; // Default to ACTIVE if not specified

    return await withConnection(async (connection) => {
      // Récupérer d'abord l'état actuel de la correction
      const [currentState] = await connection.query(
        'SELECT status, grade, experimental_points_earned, theoretical_points_earned, penalty, submission_date, final_grade FROM corrections WHERE id = ?',
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
          query = `UPDATE corrections SET 
                   status = 'ACTIVE',
                   experimental_points_earned = 0,
                   theoretical_points_earned = 0, 
                   penalty = 0,
                   submission_date = NOW(),
                   final_grade = 0,
                   grade = 0,
                   updated_at = NOW()
                   WHERE id = ?`;
          actionType = 'ACTIVATE_CORRECTION';
          actionDescription = `Activation de la correction #${correctionId}`;
          break;
          
        case 'DEACTIVATED':
          query = `UPDATE corrections SET 
                   status = 'DEACTIVATED',
                   experimental_points_earned = NULL,
                   theoretical_points_earned = NULL, 
                   penalty = NULL,
                   submission_date = NULL,
                   final_grade = NULL,
                   grade = NULL,
                   updated_at = NOW()
                   WHERE id = ?`;
          actionType = 'DEACTIVATE_CORRECTION';
          actionDescription = `Désactivation de la correction #${correctionId}`;
          break;
          
        case 'ABSENT':
          query = `UPDATE corrections SET 
                   status = 'ABSENT',
                   experimental_points_earned = 0,
                   theoretical_points_earned = 0, 
                   penalty = 0,
                   grade = 0,
                   final_grade = 0,
                   updated_at = NOW()
                   WHERE id = ?`;
          actionType = 'MARK_ABSENT';
          actionDescription = `Marquage comme absent pour la correction #${correctionId}`;
          break;
          
        case 'NON_RENDU':
          query = `UPDATE corrections SET 
                   status = 'NON_RENDU',
                   experimental_points_earned = 0,
                   theoretical_points_earned = 0, 
                   penalty = 0,
                   grade = 0,
                   final_grade = 0,
                   updated_at = NOW()
                   WHERE id = ?`;
          actionType = 'MARK_NOT_SUBMITTED';
          actionDescription = `Marquage comme non rendu pour la correction #${correctionId}`;
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
        entity_type: 'correction',
        entity_id: correctionId,
        user_id: user.id,
        username: user.username,
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