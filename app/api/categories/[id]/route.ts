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
  const body = await request.json();
  const { name, highlighted } = body;

  // Vérifier si nous avons au moins une propriété à mettre à jour
  if ((!name || typeof name !== 'string') && highlighted === undefined) {
    return NextResponse.json({ error: 'Aucune donnée valide à mettre à jour' }, { status: 400 });
  }

  try {
    // Construction dynamique de la requête SQL en fonction des paramètres présents
    let updateQuery = 'UPDATE categories SET ';
    const updateValues = [];
    
    if (name && typeof name === 'string') {
      updateQuery += 'name = ?';
      updateValues.push(name);
      
      if (highlighted !== undefined) {
        updateQuery += ', highlighted = ?';
        updateValues.push(highlighted ? 1 : 0);
      }
    } else if (highlighted !== undefined) {
      updateQuery += 'highlighted = ?';
      updateValues.push(highlighted ? 1 : 0);
    }
    
    updateQuery += ' WHERE id = ?';
    updateValues.push(categoryId);

    await query(updateQuery, updateValues);

    const updatedCategory = await query<any[]>(`
      SELECT id, name, highlighted, created_at, updated_at 
      FROM categories 
      WHERE id = ?
    `, [categoryId]);

    if (updatedCategory.length === 0) {
      return NextResponse.json({ error: 'Catégorie non trouvée' }, { status: 404 });
    }

    return NextResponse.json({
      id: updatedCategory[0].id,
      name: updatedCategory[0].name,
      highlighted: Boolean(updatedCategory[0].highlighted)
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la catégorie:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la catégorie' }, 
      { status: 500 }
    );
  }
}
