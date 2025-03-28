import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth';
import { getUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  // Authentication check
  const session = await getServerSession(authOptions);
  const customUser = await getUser(request);
  const userId = customUser?.id || session?.user?.id;
  
  if (!userId) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const categories = await query<any[]>(`
      SELECT id, name, created_at, updated_at
      FROM categories 
      ORDER BY name ASC
    `);
    
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Erreur lors de la récupération des catégories:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des catégories' }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Authentication check
  const session = await getServerSession(authOptions);
  const customUser = await getUser(request);
  const userId = customUser?.id || session?.user?.id;
  
  if (!userId) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  // Parse the request body
  const { name } = await request.json();

  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: 'Le nom de la catégorie est requis' }, { status: 400 });
  }

  try {
    const result = await query<any>(`
      INSERT INTO categories (name) 
      VALUES (?)
    `, [name]);

    const newCategory = await query<any[]>(`
      SELECT id, name, created_at, updated_at 
      FROM categories 
      WHERE id = ?
    `, [result.insertId]);

    return NextResponse.json(newCategory[0], { status: 201 });
  } catch (error) {
    console.error('Erreur lors de la création de la catégorie:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de la catégorie' }, 
      { status: 500 }
    );
  }
}
