import { NextResponse } from 'next/server';
import { withConnection } from '@/lib/db';

export async function GET(
  req: NextResponse,
  { params }: { params: Promise<{ id: string }> }
) {
  return withConnection(async (connection) => {
    try {
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
