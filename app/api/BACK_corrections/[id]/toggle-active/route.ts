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
    const active = !!data.active; // Conversion en booléen
    
    return await withConnection(async (connection) => {
      // Récupérer d'abord l'état actuel de la correction
      const [currentState] = await connection.query(
        'SELECT active, grade, experimental_points_earned, theoretical_points_earned, penalty, submission_date, final_grade FROM corrections WHERE id = ?',
        [correctionId]
      );
      
      if (!Array.isArray(currentState) || currentState.length === 0) {
        return NextResponse.json({ error: 'Correction introuvable' }, { status: 404 });
      }
      
      const oldState = (currentState[0] as any).active === 1;
      
      // Mettre à jour la condition de désactivation pour gérer à la fois active et status
      if (!active) {
        const [result] = await connection.query(
          `UPDATE corrections SET 
           active = 0,
           status = 'DEACTIVATED',
           experimental_points_earned = NULL,
           theoretical_points_earned = NULL, 
           penalty = NULL,
           submission_date = NULL,
           final_grade = NULL,
           grade = NULL,
           updated_at = NOW()
           WHERE id = ?`,
          [correctionId]
        );
        
        // Log de la désactivation
        await createLogEntry({
          action_type: 'DEACTIVATE_CORRECTION',
          description: `Désactivation de la correction #${correctionId}`,
          entity_type: 'correction',
          entity_id: correctionId,
          user_id: user.id,
          username: user.username,
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          metadata: {
            previous_state: currentState[0],
          }
        });
        
        return NextResponse.json({ 
          success: true, 
          message: 'Correction désactivée avec succès',
          active: 0,
          status: 'DEACTIVATED'
        });
      } else {
        // Réactivation - mettre les valeurs numériques à 0 au lieu de NULL
        const [result] = await connection.query(
          `UPDATE corrections SET 
           active = 1,
           status = 'ACTIVE',
           experimental_points_earned = 0,
           theoretical_points_earned = 0, 
           penalty = 0,
           submission_date = NOW(),
           final_grade = 0,
           grade = 0,
           updated_at = NOW()
           WHERE id = ?`,
          [correctionId]
        );
        
        // Log de la réactivation
        await createLogEntry({
          action_type: 'ACTIVATE_CORRECTION',
          description: `Réactivation de la correction #${correctionId}`,
          entity_type: 'correction',
          entity_id: correctionId,
          user_id: user.id,
          username: user.username,
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
        });
        
        return NextResponse.json({ 
          success: true, 
          message: 'Correction activée avec succès',
          active: 1,
          status: 'ACTIVE'
        });
      }
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut de la correction:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la mise à jour du statut' },
      { status: 500 }
    );
  }
}
