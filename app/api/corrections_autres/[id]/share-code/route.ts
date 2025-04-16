// filepath: /var/www/correction.sekrane.fr/app/api/corrections_autres/[id]/share-code/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { withConnection } from '@/lib/db';
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { getUser } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withConnection(async (connection) => {
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

      // Rechercher un code existant
      const [shareCodeRecords] = await connection.query(
        'SELECT code FROM share_codes WHERE correction_id = ?',
        [correctionId]
      );

      if (Array.isArray(shareCodeRecords) && shareCodeRecords.length > 0) {
        return NextResponse.json({ code: (shareCodeRecords[0] as any).code });
      }

      // Créer un nouveau code si aucun n'existe
      const newCode = Math.random().toString(36).substring(2, 10);
      await connection.query(
        'INSERT INTO share_codes (correction_id, code, created_at) VALUES (?, ?, NOW())',
        [correctionId, newCode]
      );

      return NextResponse.json({ code: newCode });
    } catch (error) {
      console.error('Error managing share code:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la gestion du code de partage' },
        { status: 500 }
      );
    }
  });
}