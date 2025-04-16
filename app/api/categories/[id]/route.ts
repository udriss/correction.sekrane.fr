import { NextRequest, NextResponse } from 'next/server';
import { withConnection } from '@/lib/db';
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { getUser } from '@/lib/auth';
import { query } from '@/lib/db';


import {deleteCategoryAssociations} from '@/lib/category';
// DELETE: Delete a specific category by ID
export async function DELETE(
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
    const categoryId = parseInt(id);
    
    if (isNaN(categoryId)) {
      return NextResponse.json(
        { error: 'ID de catégorie invalide' },
        { status: 400 }
      );
    }
    
    // D'abord supprimer toutes les associations de fragments
    const associationsDeleted = await deleteCategoryAssociations(categoryId);
    
    if (!associationsDeleted) {
      return NextResponse.json(
        { error: 'Erreur lors de la suppression des associations de fragments' },
        { status: 500 }
      );
    }
    
    // Ensuite supprimer la catégorie elle-même
    return await withConnection(async (connection) => {
      const [result] = await connection.query(
        'DELETE FROM categories WHERE id = ?',
        [categoryId]
      );
      
      // Vérifier si la catégorie a été supprimée
      const affectedRows = (result as any).affectedRows;
      
      if (affectedRows === 0) {
        return NextResponse.json(
          { error: 'Catégorie non trouvée' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ 
        success: true, 
        message: 'Catégorie et associations supprimées avec succès' 
      });
    });
  } catch (error: any) {
    console.error('Erreur lors de la suppression de la catégorie:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la suppression de la catégorie' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Authentication check
  const session = await getServerSession(authOptions);
  const customUser = await getUser(request);
  const userId = customUser?.id || session?.user?.id;
  
  if (!userId) {
    return NextResponse.json({ error: 'utilisateur non authentifié' }, { status: 401 });
  }

  // Await the params
  const { id } = await params;
  const categoryId = parseInt(id);

  if (isNaN(categoryId)) {
    return NextResponse.json({ error: 'ID de catégorie invalide' }, { status: 400 });
  }

  // Parse the request body
  const { name } = await request.json();

  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: 'Le nom de la catégorie est requis' }, { status: 400 });
  }

  try {
    await query(`
      UPDATE categories 
      SET name = ? 
      WHERE id = ?
    `, [name, categoryId]);

    const updatedCategory = await query<any[]>(`
      SELECT id, name, created_at, updated_at 
      FROM categories 
      WHERE id = ?
    `, [categoryId]);

    if (updatedCategory.length === 0) {
      return NextResponse.json({ error: 'Catégorie non trouvée' }, { status: 404 });
    }

    return NextResponse.json(updatedCategory[0]);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la catégorie:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la catégorie' }, 
      { status: 500 }
    );
  }
}
