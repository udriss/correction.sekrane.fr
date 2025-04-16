import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // Récupérer toutes les activités génériques
    const genericActivities = await query<any[]>(
      `SELECT * FROM activities 
       WHERE name LIKE 'Activité générique%' 
       ORDER BY id DESC`
    );
    
    return NextResponse.json(genericActivities || []);
  } catch (error) {
    console.error('Erreur lors de la récupération des activités génériques:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des activités génériques' },
      { status: 500 }
    );
  }
}
