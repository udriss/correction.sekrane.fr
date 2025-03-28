import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
