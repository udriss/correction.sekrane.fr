import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { createCorrection, generateCorrectionName } from '@/lib/correction';

export async function GET() {
  try {
    const pool = getPool();
    const [corrections] = await pool.query(
      'SELECT * FROM corrections ORDER BY updated_at DESC'
    );
    
    return NextResponse.json(corrections);
  } catch (error) {
    console.error('Erreur lors de la récupération des corrections:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { activity_id, student_name, content } = body;
    
    if (!activity_id) {
      return NextResponse.json(
        { error: 'activity_id is required' },
        { status: 400 }
      );
    }

    // If student_name is not provided, generate a default name
    const correctionData = {
      activity_id,
      student_name: student_name || null,
      content: content || ''
    };

    const id = await createCorrection(correctionData);
    
    return NextResponse.json({ id, ...correctionData }, { status: 201 });
  } catch (error) {
    console.error('Erreur lors de la création de la correction:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de la correction' },
      { status: 500 }
    );
  }
}
