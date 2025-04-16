import { NextRequest, NextResponse } from 'next/server';
import { withConnection } from '@/lib/db';
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { getUser } from '@/lib/auth';
import { createLogEntry } from '@/lib/services/logsService';

// API pour mettre à jour le statut d'une correction autre
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
    let status;
    let activeValue;
    
    if ('status' in requestData) {
      // Nouveau système avec énumération status
      status = requestData.status;
      
      // Vérifier que le status est valide
      const validStatuses = ['ACTIVE', 'DEACTIVATED', 'ABSENT', 'NON_RENDU', 'NON_NOTE'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Statut invalide' },
          { status: 400 }
        );
      }
      
      // Définir active en fonction du statut
      activeValue = status === 'ACTIVE' ? 1 : 0;
    } else if ('active' in requestData) {
      // Ancien système avec booléen active
      activeValue = requestData.active ? 1 : 0;
      status = activeValue ? 'ACTIVE' : 'DEACTIVATED';
    } else {
      return NextResponse.json(
        { error: 'Données manquantes, status ou active requis' },
        { status: 400 }
      );
    }

    return await withConnection(async (connection) => {
      // Récupérer l'état actuel pour logging
      const [currentState] = await connection.query(
        'SELECT status, active, activity_id, student_id FROM corrections_autres WHERE id = ?',
        [correctionId]
      );
      
      if (!Array.isArray(currentState) || currentState.length === 0) {
        return NextResponse.json(
          { error: 'Correction autre non trouvée' },
          { status: 404 }
        );
      }
      
      const currentData = currentState[0] as any;
      
      // Mettre à jour le statut de la correction
      const [result] = await connection.query(
        'UPDATE corrections_autres SET status = ?, active = ? WHERE id = ?',
        [
          status, 
          activeValue, 
          correctionId
        ]
      );
      
      const updateResult = result as any;
      if (!updateResult || !updateResult.affectedRows || updateResult.affectedRows === 0) {
        return NextResponse.json(
          { error: 'Correction autre non modifiée' },
          { status: 404 }
        );
      }

      // Créer un log pour le changement de statut
      await createLogEntry({
        action_type: 'UPDATE_STATUS_CORRECTION_AUTRE',
        description: `Changement de statut de la correction autre #${correctionId} : ${currentData.status || 'Non défini'} -> ${status}`,
        entity_type: 'correction_autre',
        entity_id: correctionId,
        user_id: customUser?.id,
        username: customUser?.username,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        metadata: {
          old_status: currentData.status,
          new_status: status,
          old_active: currentData.active,
          new_active: activeValue,
          activity_id: currentData.activity_id,
          student_id: currentData.student_id
        }
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
      
      // Retourner la correction mise à jour avec des infos supplémentaires
      return NextResponse.json({ 
        id: correctionId, 
        status,
        active: activeValue,
        ...(Array.isArray(activityInfo) && activityInfo.length > 0 ? activityInfo[0] : {})
      });
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    
    // Logger l'erreur
    try {
      const user = await getUser(request);
      await createLogEntry({
        action_type: 'UPDATE_STATUS_ERROR_CORRECTION_AUTRE',
        description: `Erreur lors de la mise à jour du statut d'une correction autre: ${(error as Error).message}`,
        user_id: user?.id,
        username: user?.username,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
      });
    } catch (logError) {
      console.error('Erreur lors de la création du log:', logError);
    }
    
    return NextResponse.json(
      { error: 'Erreur serveur lors de la mise à jour du statut' },
      { status: 500 }
    );
  }
}