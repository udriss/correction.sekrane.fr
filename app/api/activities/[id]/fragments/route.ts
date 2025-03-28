import { NextResponse } from 'next/server';
import { getFragmentsByActivityId } from '@/lib/fragment';
import { getActivityById } from '@/lib/activity';
import { withConnection } from '@/lib/db';
import authOptions from "@/lib/auth";
import { getUser } from '@/lib/auth'; // Add import for custom auth
import { getServerSession } from "next-auth/next";

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

    // Get the user from both auth systems
    const session = await getServerSession(authOptions);
    const customUser = await getUser();
    
    // Use either auth system, starting with custom auth
    const userId = customUser?.id || session?.user?.id;

  try {
    // Await the params object to access its properties
    const { id } = await params;
    const activityId = parseInt(id || '');
    
    if (isNaN(activityId)) {
      return NextResponse.json({ error: 'Invalid activity ID' }, { status: 400 });
    }
    
    const body = await request.json();
    
    // Validate required fields - now using content and category instead of title and content
    if (!body.content) {
      return NextResponse.json({ 
        error: 'Le contenu est requis' 
      }, { status: 400 });
    }
    
    // Insérer le fragment dans la base de données
    return await withConnection(async (connection) => {
      // Updated fields to match our Fragment model
      const [result] = await connection.query(
        `INSERT INTO fragments (activity_id, content, category, user_id)
         VALUES (?, ?, ?, ?)`,
        [activityId, body.content, body.category || 'Général', userId]
      );
      
      const fragmentId = (result as any).insertId;
      
      // Récupérer le fragment complet pour le retourner
      const [rows] = await connection.query(
        `SELECT * FROM fragments WHERE id = ?`,
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