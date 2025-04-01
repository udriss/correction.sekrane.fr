import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';
import { getUser } from '@/lib/auth';

// GET - Récupérer tous les groupes
export async function GET(req: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    const customUser = await getUser(req);
    const userId = customUser?.id || session?.user?.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      );
    }
    
    // Récupérer les groupes avec le nombre d'étudiants
    const groups = await query<any[]>(`
      SELECT g.*, COUNT(gs.student_id) as student_count
      FROM groups g
      LEFT JOIN group_students gs ON g.id = gs.group_id
      GROUP BY g.id
      ORDER BY g.name
    `);
    
    return NextResponse.json(groups);
  } catch (error) {
    console.error('Erreur lors de la récupération des groupes:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Créer un nouveau groupe
export async function POST(req: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    const customUser = await getUser(req);
    const userId = customUser?.id || session?.user?.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      );
    }
    
    const body = await req.json();
    const { name, description } = body;
    
    if (!name) {
      return NextResponse.json(
        { error: 'Nom du groupe requis' },
        { status: 400 }
      );
    }
    
    // Vérifier si le groupe existe déjà
    const existingGroups = await query<any[]>(`
      SELECT * FROM groups WHERE name = ?
    `, [name]);
    
    if (existingGroups.length > 0) {
      return NextResponse.json(
        { error: 'Un groupe avec ce nom existe déjà' },
        { status: 409 }
      );
    }
    
    // Créer le groupe
    const result = await query<any>(`
      INSERT INTO groups (name, description, created_at, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [name, description || null]);
    
    return NextResponse.json({
      id: result.insertId,
      name,
      description,
      student_count: 0
    }, { status: 201 });
  } catch (error) {
    console.error('Erreur lors de la création du groupe:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
