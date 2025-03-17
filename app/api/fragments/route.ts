import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { createFragment } from '@/lib/fragment';

export async function POST(request: NextRequest) {
  try {
    const { activity_id, content } = await request.json();
    
    if (!activity_id) {
      return NextResponse.json(
        { error: 'Activity ID is required' },
        { status: 400 }
      );
    }

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    const id = await createFragment({ activity_id, content });
    return NextResponse.json({ id, activity_id, content }, { status: 201 });
  } catch (error) {
    console.error('Erreur lors de la création du fragment:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const activityId = url.searchParams.get('activity_id');
    
    if (!activityId) {
      return NextResponse.json(
        { error: 'L\'ID d\'activité est obligatoire' },
        { status: 400 }
      );
    }
    
    const pool = getPool();
    const [fragments] = await pool.query(
      'SELECT * FROM fragments WHERE activity_id = ? ORDER BY created_at ASC',
      [activityId]
    );
    
    return NextResponse.json(fragments);
  } catch (error) {
    console.error('Erreur lors de la récupération des fragments:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
