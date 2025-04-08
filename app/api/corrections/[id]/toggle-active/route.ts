import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { Correction } from '@/app/components/CorrectionsDataProvider';

import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { getUser } from '@/lib/auth';
import { createLogEntry } from '@/lib/services/logsService';


export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
  try {

    
    // Authentication check
    const session = await getServerSession(authOptions);
    const customUser = await getUser(request);
    const userId = customUser?.id || session?.user?.id;

    if (!userId) {
        return NextResponse.json({ error: 'authentification requise' }, { status: 401 });
    }

    // Await the params
    const { id } = await params;
    const correctionId = id;
    
    
    // Get request body
    const body = await request.json();
    const { active } = body;
    
    // Validate input
    if (active === undefined) {
      return NextResponse.json({ error: 'Le statut actif est requis' }, { status: 400 });
    }
    
    // Update the correction's active status
    const updateQuery = `
      UPDATE corrections
      SET active = ?, updated_at = NOW()
      WHERE id = ?
    `;
    
    await query(updateQuery, [active ? 1 : 0, correctionId]);
    
    // Fetch the updated correction
    const correctionQuery = `
      SELECT c.*, 
        a.name as activity_name,
        CONCAT(s.first_name, ' ', s.last_name) as student_name,
        cl.name as class_name,
        cs.sub_class as student_sub_class
      FROM corrections c
      LEFT JOIN students s ON c.student_id = s.id
      LEFT JOIN activities a ON c.activity_id = a.id
      LEFT JOIN class_students cs ON c.student_id = cs.student_id
      LEFT JOIN classes cl ON cs.class_id = cl.id
      WHERE c.id = ?
    `;
    
    const correction = await query<Correction[]>(correctionQuery, [correctionId]);
    
    if (!correction || correction.length === 0) {
      return NextResponse.json({ error: 'correction introuvable' }, { status: 404 });
    }
    
    // Log the activity using createLogEntry
    const activityType = active ? 'CORRECTION_ACTIVATED' : 'CORRECTION_DEACTIVATED';
    await createLogEntry({
      action_type: activityType,
      description: `Correction ${active ? 'activée' : 'désactivée'} par ${session?.user?.email || 'un utilisateur'}`,
      entity_type: 'correction',
      entity_id: parseInt(correctionId),
      user_id: typeof userId === 'string' ? parseInt(userId) : userId,
      username: session?.user?.email,
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      metadata: {
        correction_id: correctionId,
        student_name: correction[0].student_name,
        activity_name: correction[0].activity_name,
        class_name: correction[0].class_name,
        new_status: active ? 'active' : 'inactive'
      }
    });
    
    return NextResponse.json(correction[0]);
    
  } catch (error: any) {
    console.error('Error toggling correction active status:', error);
    
    // Log the error
    try {
      const user = await getUser(request);
      await createLogEntry({
        action_type: 'TOGGLE_CORRECTION_STATUS_ERROR',
        description: `Erreur lors de la modification du statut actif: ${error.message}`,
        user_id: user?.id,
        username: user?.username,
        ip_address: request.headers.get('x-forwarded-for') || 'unknown'
      });
    } catch (logError) {
      console.error('Error creating log entry:', logError);
    }
    
    return NextResponse.json(
      { error: 'Erreur lors de la modification du statut actif', details: error.message },
      { status: 500 }
    );
  }
}
