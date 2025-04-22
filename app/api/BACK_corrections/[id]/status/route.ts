import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import authOptions from "@/lib/auth";
import { getUser } from '@/lib/auth';

// API pour mettre à jour le statut d'une correction
export async function PUT(
  request: Request,
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

    // Await the params
    const { id } = await params;
    const correctionId = parseInt(id);

    const requestData = await request.json();
    
    // Handle both the new status system and the old active boolean
    let status;
    if ('status' in requestData) {
      // New system with enum status
      status = requestData.status;
      
      // Vérifier que le status est valide
      const validStatuses = ['ACTIVE', 'DEACTIVATED', 'ABSENT', 'NON_RENDU', 'NON_NOTE'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { message: 'Statut invalide' },
          { status: 400 }
        );
      }
    } else if ('active' in requestData) {
      // Old system with boolean active
      status = requestData.active ? 'ACTIVE' : 'DEACTIVATED';
    } else {
      return NextResponse.json(
        { message: 'Données manquantes, status ou active requis' },
        { status: 400 }
      );
    }

    // Mettre à jour le statut de la correction avec MySQL
    const result = await query(
      'UPDATE corrections SET status = ?, active = ? WHERE id = ?',
      [
        status, 
        status === 'ACTIVE' ? 1 : 0, 
        correctionId
      ]
    ) as { affectedRows?: number };

    if (!result || !result.affectedRows || result.affectedRows === 0) {
      return NextResponse.json(
        { message: 'Correction introuvable ou non modifiée' },
        { status: 404 }
      );
    }

    // Retourner la correction mise à jour
    return NextResponse.json({ 
      id: correctionId, 
      status,
      active: status === 'ACTIVE' ? 1 : 0
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    return NextResponse.json(
      { message: 'Erreur serveur lors de la mise à jour du statut' },
      { status: 500 }
    );
  }
}