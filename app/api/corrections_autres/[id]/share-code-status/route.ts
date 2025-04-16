// filepath: /var/www/correction.sekrane.fr/app/api/corrections_autres/[id]/share-code-status/route.ts
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { getUser } from '@/lib/auth';

export async function GET(
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

    if (!correctionId) {
      return NextResponse.json(
        { message: 'ID de correction requis' },
        { status: 400 }
      );
    }

    // Check if share code exists for this correction
    const shareCodeRecords = await query(
      'SELECT code FROM share_codes WHERE correction_id = ?',
      [correctionId]
    ) as any[];

    return NextResponse.json({
      exists: shareCodeRecords && shareCodeRecords.length > 0,
      code: shareCodeRecords && shareCodeRecords.length > 0 ? shareCodeRecords[0].code : null
    });
  } catch (error) {
    console.error('Error checking share code status:', error);
    return NextResponse.json(
      { message: 'Erreur lors de la vérification du code de partage' },
      { status: 500 }
    );
  }
}