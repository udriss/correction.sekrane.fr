import { NextRequest, NextResponse } from 'next/server';
import { query, withConnection } from '@/lib/db';
import { Class } from '@/lib/types';


// Get a single class with all relevant information
export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
    return NextResponse.json({ error: 'Failed to fetch class data' }, { status: 500 });
  }
}

// Update a class
export async function PUT(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
    return NextResponse.json({ error: 'Failed to update class' }, { status: 500 });
  }
}

// Delete a class
export async function DELETE(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
    return NextResponse.json({ error: 'Failed to delete class' }, { status: 500 });
  }
}

// Update a class with PATCH (for partial updates)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params
    const { id } = await params;
    const classId = parseInt(id);
    
    if (isNaN(classId)) {
      return NextResponse.json({ error: 'Invalid class ID' }, { status: 400 });
    }

    const data = await request.json();
    const { name } = data;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Check if class exists
    const existingClass: Class[] = await query(`SELECT * FROM classes WHERE id = ?`, [classId]);
    if (!existingClass.length) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    // Update just the name of the class
    await query(`
      UPDATE classes 
      SET name = ?, updated_at = NOW()
      WHERE id = ?
    `, [name, classId]);

    // Get the updated class
    const updatedClass: Class[] = await query(`SELECT * FROM classes WHERE id = ?`, [classId]);

    return NextResponse.json(updatedClass[0]);
  } catch (error) {
    console.error('Error updating class:', error);
    return NextResponse.json({ error: 'Failed to update class' }, { status: 500 });
  }
}
