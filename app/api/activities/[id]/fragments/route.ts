import { NextResponse } from 'next/server';
import { getFragmentsByActivityId } from '@/lib/fragment';
import { getActivityById } from '@/lib/activity';
import { withConnection } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params object to access its properties
    const { id } = await params;
    const activityId = parseInt(id || '');
    
    if (isNaN(activityId)) {
      return NextResponse.json(
        { error: 'Invalid activity ID' },
        { status: 400 }
      );
    }

    const activity = await getActivityById(activityId);
    if (!activity) {
      return NextResponse.json(
        { error: 'Activity not found' },
        { status: 404 }
      );
    }

    const fragments = await getFragmentsByActivityId(activityId);
    return NextResponse.json(fragments);
  } catch (error) {
    console.error('Erreur lors de la récupération des fragments:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params object to access its properties
    const { id } = await params;
    const activityId = parseInt(id || '');
    
    if (isNaN(activityId)) {
      return NextResponse.json({ error: 'Invalid activity ID' }, { status: 400 });
    }
    
    const body = await request.json();
    console.log("Création d'un fragment pour l'activité:", activityId, body);
    
    // Valider les données requises
    if (!body.title || !body.content) {
      return NextResponse.json({ 
        error: 'Le titre et le contenu sont requis' 
      }, { status: 400 });
    }
    
    // Insérer le fragment dans la base de données
    return await withConnection(async (connection) => {
      const [result] = await connection.query(
        `INSERT INTO activity_fragments (activity_id, title, content, type)
         VALUES (?, ?, ?, ?)`,
        [activityId, body.title, body.content, body.type || 'text']
      );
      
      const fragmentId = (result as any).insertId;
      
      // Récupérer le fragment complet pour le retourner
      const [rows] = await connection.query(
        `SELECT * FROM activity_fragments WHERE id = ?`,
        [fragmentId]
      );
      
      if (!Array.isArray(rows) || rows.length === 0) {
        return NextResponse.json({ 
          error: 'Erreur lors de la récupération du fragment créé' 
        }, { status: 500 });
      }
      
      return NextResponse.json(rows[0]);
    });
  } catch (error) {
    console.error('Erreur lors de la création du fragment:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la création du fragment',
      details: String(error)
    }, { status: 500 });
  }
}