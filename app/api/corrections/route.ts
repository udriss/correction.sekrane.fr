import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { createCorrection, generateCorrectionName } from '@/lib/correction';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Attendre la résolution des paramètres
    const { id } = await params;
    const pool = getPool();
    // Vérifier que l'ID est un nombre valide
    const activityId = parseInt(id, 10);
    if (isNaN(activityId)) {
      return NextResponse.json({ error: 'ID d\'activité invalide' }, { status: 400 });
    }

    // Récupérer toutes les corrections pour cette activité
    const corrections = await pool.query(
      `SELECT * FROM corrections WHERE activity_id = ? ORDER BY created_at DESC`,
      [activityId]
    );

    return NextResponse.json(corrections);
  } catch (error) {
    console.error('Erreur lors de la récupération des corrections:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des corrections' },
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
