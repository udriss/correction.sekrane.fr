import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params
    const { id } = await params;
    const correctionId = parseInt(id);

    const { studentId } = await request.json();

    // Récupérer les données de la correction originale
    const [originalCorrection] = await query(
      `SELECT * FROM corrections WHERE id = ?`,
      [correctionId]
    ) as any[];
    

    if (!originalCorrection) {
      return NextResponse.json({ error: 'Correction non trouvée' }, { status: 404 });
    }

    // Créer une nouvelle correction avec les mêmes données mais un student_id différent
    const result = await query(
      `INSERT INTO corrections 
       (activity_id, student_id, content, content_data, grade, 
        experimental_points_earned, theoretical_points_earned, penalty,
        deadline, submission_date, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        originalCorrection.activity_id,
        studentId,
        originalCorrection.content,
        typeof originalCorrection.content_data === 'string' 
          ? originalCorrection.content_data 
          : JSON.stringify(originalCorrection.content_data),
        originalCorrection.grade,
        originalCorrection.experimental_points_earned,
        originalCorrection.theoretical_points_earned,
        originalCorrection.penalty,
        originalCorrection.deadline,
        originalCorrection.submission_date
      ]
    ) as any;

    // Après avoir créé la nouvelle correction, créer un nouveau code de partage
    const shareCode = Math.random().toString(36).substring(2, 10);
    await query(
      `INSERT INTO share_codes (correction_id, code, created_at) 
       VALUES (?, ?, NOW())`,
      [result.insertId, shareCode]
    );

    return NextResponse.json({ 
      correctionId: result.insertId,
      message: 'Correction dupliquée avec succès' 
    });

  } catch (error) {
    console.error('Erreur lors de la duplication:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la duplication de la correction' },
      { status: 500 }
    );
  }
}
