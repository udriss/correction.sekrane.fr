import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth';
import { getUser } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    const customUser = await getUser(request);
    const userId = customUser?.id || session?.user?.id;
    
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Await the params
    const { id } = await params;
    const activityId = parseInt(id);

    if (isNaN(activityId)) {
      return NextResponse.json({ error: 'ID d\'activité invalide' }, { status: 400 });
    }

    // Récupérer les fragments
    const fragments = await query<any[]>(`
      SELECT * FROM fragments 
      WHERE activity_id = ? 
      ORDER BY position_order ASC
    `, [activityId]);

    // Pour chaque fragment, récupérer ses catégories
    const fragmentsWithCategories = await Promise.all(
      fragments.map(async (fragment) => {
        const categories = await query<any[]>(`
          SELECT c.id, c.name 
          FROM categories c
          JOIN fragments_categories fc ON c.id = fc.category_id
          WHERE fc.fragment_id = ?
        `, [fragment.id]);

        return {
          ...fragment,
          categories
        };
      })
    );

    return NextResponse.json(fragmentsWithCategories);
  } catch (error) {
    console.error('Erreur lors de la récupération des fragments:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des fragments' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    const customUser = await getUser(request);
    const userId = customUser?.id || session?.user?.id;
    
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Await the params
    const { id } = await params;
    const activityId = parseInt(id);

    if (isNaN(activityId)) {
      return NextResponse.json({ error: 'ID d\'activité invalide' }, { status: 400 });
    }

    // Parse the request body
    const { content, categories } = await request.json();

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Le contenu du fragment est requis' }, { status: 400 });
    }

    // Calculer la position maximale actuelle
    const maxPositionResult = await query<any[]>(`
      SELECT MAX(position_order) as max_position 
      FROM fragments 
      WHERE activity_id = ?
    `, [activityId]);
    
    const maxPosition = maxPositionResult[0].max_position || 0;
    const newPosition = maxPosition + 1;

    // Créer le fragment
    const result = await query<any>(`
      INSERT INTO fragments (content, activity_id, position_order, user_id) 
      VALUES (?, ?, ?, ?)
    `, [content, activityId, newPosition, userId]);

    const fragmentId = result.insertId;

    // Ajouter les catégories si spécifiées
    if (categories && categories.length > 0) {
      const values = categories.map((categoryId: number) => [fragmentId, categoryId]);
      const placeholders = categories.map(() => '(?, ?)').join(', ');
      
      // Aplatir les valeurs pour le format attendu par mysql2
      const flatValues = values.flat();
      
      await query(`
        INSERT INTO fragments_categories (fragment_id, category_id) 
        VALUES ${placeholders}
      `, flatValues);
    }

    // Récupérer le fragment créé
    const fragment = await query<any[]>(`
      SELECT * FROM fragments WHERE id = ?
    `, [fragmentId]);

    // Récupérer les catégories associées
    const fragmentCategories = await query<any[]>(`
      SELECT c.id, c.name 
      FROM categories c
      JOIN fragments_categories fc ON c.id = fc.category_id
      WHERE fc.fragment_id = ?
    `, [fragmentId]);

    // Construire la réponse
    const newFragment = {
      ...fragment[0],
      categories: fragmentCategories
    };

    return NextResponse.json(newFragment, { status: 201 });
  } catch (error) {
    console.error('Erreur lors de la création du fragment:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du fragment' }, 
      { status: 500 }
    );
  }
}