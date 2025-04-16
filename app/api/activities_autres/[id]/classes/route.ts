import { NextRequest, NextResponse } from 'next/server';
import { withConnection } from '@/lib/db';
import { PoolConnection } from 'mysql2/promise';
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { getUser } from '@/lib/auth';
import { ActivityAutre, Class } from '@/lib/types';



// Récupérer les classes associées à une activité autre
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get the user from both auth systems
    const session = await getServerSession(authOptions);
    const customUser = await getUser();
    
    // Use either auth system, starting with custom auth
    const userId = customUser?.id || session?.user?.id;
    
    if (!userId) {
      return NextResponse.json({ error: 'utilisateur non authentifié' }, { status: 401 });
    }

    // Await the params
    const { id } = await params;
    const activityId = parseInt(id);

    if (isNaN(activityId)) {
      return NextResponse.json({ message: 'ID d\'activité invalide' }, { status: 400 });
    }

    return await withConnection(async (connection: PoolConnection) => {
      // Vérifier si l'activité autre existe
      const [activityRows] = await connection.execute(
        'SELECT * FROM activities_autres WHERE id = ?',
        [activityId]
      );

      const activities = activityRows as ActivityAutre[];
      if (activities.length === 0) {
        return NextResponse.json({ message: 'activité non trouvée' }, { status: 404 });
      }
      // Récupérer toutes les classes associées à cette activité autre en utilisant une jointure sur le champ activity_id
      const [classRows] = await connection.execute(
        `SELECT c.id, c.name, c.nbre_subclasses 
         FROM classes c
         JOIN class_activities ca ON c.id = ca.class_id
         WHERE ca.activity_id = ?
         ORDER BY c.name`,
        [activityId]
      );

      return NextResponse.json(classRows);
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des classes:', error);
    return NextResponse.json(
      { message: 'erreur serveur lors de la récupération des classes' },
      { status: 500 }
    );
  }
}

// Associer une classe à une activité autre
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get the user from both auth systems
    const session = await getServerSession(authOptions);
    const customUser = await getUser();
    
    // Use either auth system, starting with custom auth
    const userId = customUser?.id || session?.user?.id;
    
    if (!userId) {
      return NextResponse.json({ error: 'utilisateur non authentifié' }, { status: 401 });
    }

    // Await the params
    const { id } = await params;
    const activityId = parseInt(id);

    
    if (isNaN(activityId)) {
      return NextResponse.json({ message: 'ID d\'activité invalide' }, { status: 400 });
    }

    const body = await request.json();
    const classId = body.class_id;

    if (!classId || typeof classId !== 'number') {
      return NextResponse.json({ message: 'ID de classe invalide' }, { status: 400 });
    }

    return await withConnection(async (connection: PoolConnection) => {
      // Vérifier si l'activité autre existe
      const [activityRows] = await connection.execute(
        'SELECT * FROM activities_autres WHERE id = ?',
        [activityId]
      );

      const activities = activityRows as ActivityAutre[];
      if (activities.length === 0) {
        return NextResponse.json({ message: 'activité non trouvée' }, { status: 404 });
      }

      // Vérifier si la classe existe
      const [classRows] = await connection.execute(
        'SELECT * FROM classes WHERE id = ?',
        [classId]
      );
      
      const classes = classRows as Class[];
      if (classes.length === 0) {
        return NextResponse.json({ message: 'classe non trouvée' }, { status: 404 });
      }

      // Vérifier si l'association existe déjà en cherchant dans activity_id au lieu de activity_id
      const [existingRows] = await connection.execute(
        'SELECT * FROM class_activities WHERE class_id = ? AND activity_id = ?',
        [classId, activityId]
      );

      interface Association {
        id: number;
        class_id: number;
        activity_id: number;
      }

      const existingAssociations = existingRows as Association[];
      
      // Si l'association existe déjà, retourner un succès sans rien faire
      if (existingAssociations.length > 0) {
        return NextResponse.json({ 
          message: 'association classe-activité déjà existante',
          exists: true,
          association: existingAssociations[0]
        });
      }

      // Utiliser la table class_activities mais avec le champ activity_id pour éviter la contrainte de clé étrangère
      const [result] = await connection.execute(
        'INSERT INTO class_activities (class_id, activity_id) VALUES (?, ?)',
        [classId, activityId]
      );

      const insertResult = result as { insertId: number };
      
      // Récupérer l'association ajoutée
      const [newAssociation] = await connection.execute(
        'SELECT * FROM class_activities WHERE id = ?',
        [insertResult.insertId]
      );

      return NextResponse.json({ 
        message: 'association classe-activité ajoutée avec succès',
        exists: false,
        association: (newAssociation as any[])[0]
      });
    });
  } catch (error) {
    console.error('Erreur lors de l\'association de la classe à l\'activité:', error);
    return NextResponse.json(
      { message: 'erreur serveur lors de l\'association' },
      { status: 500 }
    );
  }
}