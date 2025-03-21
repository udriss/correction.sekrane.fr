import { NextRequest, NextResponse } from 'next/server';
import { withConnection } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<Record<string, string>> }
) {
  try {
    const { id } = await Promise.resolve(params);
    
    const body = await request.json();
    const { 
      grade, 
      experimental_points_earned,
      theoretical_points_earned,
      penalty 
    } = body;
    
    // S'assurer que toutes les valeurs sont des nombres valides
    const gradeValue = parseFloat(Number(grade).toFixed(1));
    const expPoints = parseFloat(Number(experimental_points_earned).toFixed(1));
    const theoPoints = parseFloat(Number(theoretical_points_earned).toFixed(1));
    const penaltyValue = parseFloat(Number(penalty).toFixed(1));
    
    console.log('Received values:', {
      grade: gradeValue,
      exp: expPoints,
      theo: theoPoints,
      penalty: penaltyValue
    });
    
    return await withConnection(async (connection) => {
      await connection.query(
        `UPDATE corrections 
         SET grade = ?, 
             experimental_points_earned = ?,
             theoretical_points_earned = ?,
             penalty = ? 
         WHERE id = ?`,
        [gradeValue, expPoints, theoPoints, penaltyValue, id]
      );
      
      // Récupérer la correction mise à jour
      const [rows] = await connection.query(
        `SELECT * FROM corrections WHERE id = ?`,
        [id]
      );
      
      if (!Array.isArray(rows) || rows.length === 0) {
        return NextResponse.json(
          { error: 'Correction non trouvée après mise à jour' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(rows[0]);
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la note:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la note' },
      { status: 500 }
    );
  }
}
