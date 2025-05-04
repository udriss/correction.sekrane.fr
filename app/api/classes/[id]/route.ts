import { NextRequest, NextResponse } from 'next/server';
import { query, withConnection } from '@/lib/db';
import { Class } from '@/lib/types';
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { getUser } from '@/lib/auth';

// Get a single class with all relevant information
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
    const classId = parseInt(id);
    
    if (isNaN(classId)) {
      return NextResponse.json({ error: 'Invalid class ID' }, { status: 400 });
    }

    // Get the class
    const classes: Class[] = await query(`SELECT * FROM classes WHERE id = ?`, [classId]);
    if (!classes.length) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    // Get student count
    const studentCountResult = await query<{ count: number }[]>(`
      SELECT COUNT(*) as count FROM class_students WHERE class_id = ?
    `, [classId]);

    // Get activity count
    const activityCountResult = await query<{ count: number }[]>(`
      SELECT COUNT(*) as count FROM class_activities WHERE class_id = ?
    `, [classId]);

    const classData = {
      ...(classes[0] as any),
      student_count: studentCountResult[0].count,
      activity_count: activityCountResult[0].count
    };

    return NextResponse.json(classData);
  } catch (error) {
    console.error('Error fetching class:', error);
    // Renvoyer l'erreur avec tous ses détails pour un meilleur débogage
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      details: error 
    }, { status: 500 });
  }
}

// Update a class
export async function PUT(
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
    const classId = parseInt(id);
    
    if (isNaN(classId)) {
      return NextResponse.json({ error: 'Invalid class ID' }, { status: 400 });
    }

    const data = await request.json();
    const { name, description, academic_year, nbre_subclasses } = data;

    if (!name || !academic_year) {
      return NextResponse.json({ error: 'Name and academic year are required' }, { status: 400 });
    }

    // Check if class exists
    const existingClass: Class[] = await query(`SELECT * FROM classes WHERE id = ?`, [classId]);
    if (!existingClass.length) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    // Update the class
    await query(`
      UPDATE classes 
      SET name = ?, description = ?, academic_year = ?, nbre_subclasses = ?, updated_at = NOW()
      WHERE id = ?
    `, [name, description || null, academic_year, nbre_subclasses || null, classId]);

    // Get the updated class
    const updatedClass: Class[] = await query(`SELECT * FROM classes WHERE id = ?`, [classId]);

    return NextResponse.json(updatedClass[0]);
  } catch (error) {
    console.error('Error updating class:', error);
    // Renvoyer l'erreur avec tous ses détails pour un meilleur débogage
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      details: error 
    }, { status: 500 });
  }
}

// Delete a class
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
    const classId = parseInt(id);
    
    if (isNaN(classId)) {
      return NextResponse.json({ error: 'Invalid class ID' }, { status: 400 });
    }

    // Check if class exists
    const existingClass: Class[] = await query(`SELECT * FROM classes WHERE id = ?`, [classId]);
    if (!existingClass.length) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    // Delete the class (you might want to handle related records differently)
    await withConnection(async (connection) => {
      // Delete related records first to respect foreign key constraints
      await connection.query('DELETE FROM class_students WHERE class_id = ?', [classId]);
      await connection.query('DELETE FROM class_activities WHERE class_id = ?', [classId]);
      
      // Then delete the class itself
      await connection.query('DELETE FROM classes WHERE id = ?', [classId]);
    });

    return NextResponse.json({ success: true, message: 'Class deleted successfully' });
  } catch (error) {
    console.error('Error deleting class:', error);
    // Renvoyer l'erreur avec tous ses détails pour un meilleur débogage
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      details: error 
    }, { status: 500 });
  }
}

// Update a class with PATCH (for partial updates)
export async function PATCH(
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
    const classId = parseInt(id);
    
    if (isNaN(classId)) {
      return NextResponse.json({ error: 'Invalid class ID' }, { status: 400 });
    }

    const data = await request.json();
    console.log(data)
    const { name, academic_year, nbre_subclasses } = data;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Check if class exists
    const existingClass: Class[] = await query(`SELECT * FROM classes WHERE id = ?`, [classId]);
    if (!existingClass.length) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    // Construction de la requête SQL et des paramètres dynamiquement en fonction des champs fournis
    let updateQuery = 'UPDATE classes SET ';
    const updateParams = [];
    const updateFields = [];

    // Ajouter le nom s'il est fourni
    if (name) {
      updateFields.push('name = ?');
      updateParams.push(name);
    }

    // Ajouter l'année académique si elle est fournie
    if (academic_year) {
      updateFields.push('academic_year = ?');
      updateParams.push(academic_year);
    }

    // Ajouter nbre_subclasses si fourni
    if (typeof nbre_subclasses !== 'undefined') {
      updateFields.push('nbre_subclasses = ?');
      updateParams.push(nbre_subclasses === null ? null : Number(nbre_subclasses));
    }

    // Ajouter updated_at
    updateFields.push('updated_at = NOW()');

    // Compléter la requête
    updateQuery += updateFields.join(', ');
    updateQuery += ' WHERE id = ?';
    updateParams.push(classId);

    // Exécuter la mise à jour
    await query(updateQuery, updateParams);

    // Get the updated class
    const updatedClass: Class[] = await query(`SELECT * FROM classes WHERE id = ?`, [classId]);

    return NextResponse.json(updatedClass[0]);
  } catch (error) {
    console.error('Error updating class:', error);
    // Renvoyer l'erreur avec tous ses détails pour un meilleur débogage
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      details: error 
    }, { status: 500 });
  }
}
