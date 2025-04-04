import { NextRequest, NextResponse } from 'next/server';
import { query, withConnection } from '@/lib/db';
import { Student, Class } from '@/lib/types';
import { getServerSession } from 'next-auth';
import { getUser } from '@/lib/auth';
import authOptions from '@/lib/auth';

// Get students for a class
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params
    const { id } = await params;
    const classId = parseInt(id);
    
    // Authentication check
    const session = await getServerSession(authOptions);
    const customUser = await getUser(request);
    const userId = customUser?.id || session?.user?.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'authentification requise' },
        { status: 401 }
      );
    }

    
    if (!classId) {
      return NextResponse.json(
        { error: 'ID de classe manquant' },
        { status: 400 }
      );
    }

    // Récupérer tous les étudiants de cette classe
    const students = await query<any[]>(`
      SELECT 
        s.id, 
        s.gender,
        s.email,
        s.first_name, 
        s.last_name,
        CONCAT(s.first_name, ' ', s.last_name) as name,
        cs.sub_class
      FROM 
        students s
      JOIN 
        class_students cs ON s.id = cs.student_id
      WHERE 
        cs.class_id = ?
      ORDER BY 
        s.last_name, s.first_name
    `, [classId]);

    return NextResponse.json(students);
  } catch (error) {
    console.error('Erreur lors de la récupération des étudiants:', error);
    return NextResponse.json(
      { message: 'Erreur serveur', error: (error as Error).message },
      { status: 500 }
    );
  }
}

// Add a student to a class
export async function POST(
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
    const classExists: Class[] = await query(
      'SELECT id FROM classes WHERE id = ?',
      [classId]
    );

    if (!classExists.length) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    const data = await request.json();
    const { first_name, last_name, email, gender, sub_class } = data;

    if (!first_name) {
      return NextResponse.json(
        { error: 'First name is required' },
        { status: 400 }
      );
    }

    // Use withConnection for transaction
    const result = await withConnection(async (connection) => {
      // First create or get the student
      const defaultEmail = email || `${first_name.toLowerCase()}.${last_name ? last_name.toLowerCase() : 'student'}@example.com`;
      
      // Check if student already exists
      const [existingStudents] = await connection.query(
        'SELECT id FROM students WHERE email = ?',
        [defaultEmail]
      );
      
      let studentId;
      
      if ((existingStudents as any[]).length > 0) {
        // Use existing student
        studentId = (existingStudents as any[])[0].id;
        
        // Update the student data
        await connection.query(
          'UPDATE students SET first_name = ?, last_name = ?, gender = ? WHERE id = ?',
          [first_name, last_name || null, gender || 'N', studentId]
        );
      } else {
        // Create new student
        const [insertResult] = await connection.query(
          'INSERT INTO students (email, first_name, last_name, gender) VALUES (?, ?, ?, ?)',
          [defaultEmail, first_name, last_name || null, gender || 'N']
        );
        studentId = (insertResult as any).insertId;
      }
      
      // Vérifier si l'association existe déjà
      const [existingAssociation] = await connection.query(
        'SELECT * FROM class_students WHERE student_id = ? AND class_id = ?',
        [studentId, classId]
      );

      
      if ((existingAssociation as any[]).length > 0) {
        // Association existe déjà, mettre à jour uniquement le sous-groupe
        await connection.query(
          'UPDATE class_students SET sub_class = ?, updated_at = CURRENT_TIMESTAMP WHERE student_id = ? AND class_id = ?',
          [sub_class || null, studentId, classId]
        );
      } else {
        // Créer une nouvelle association
        await connection.query(
          'INSERT INTO class_students (student_id, class_id, sub_class, created_at, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
          [studentId, classId, sub_class || null]
        );
      }
      
      // Get the full student data for response
      const [studentData] = await connection.query(
        `SELECT cs.id, s.id AS student_id, s.first_name, s.last_name, s.email, s.gender, cs.sub_class
         FROM class_students cs
         JOIN students s ON cs.student_id = s.id
         WHERE cs.student_id = ? AND cs.class_id = ?`,
        [studentId, classId]
      );
      
      return (studentData as any[])[0];
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error adding student:', error);
    return NextResponse.json(
      { error: 'Failed to add student' },
      { status: 500 }
    );
  }
}

// Update a student in a class
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
    const { student_id, email, first_name, last_name, gender } = data;
    
    if (!student_id) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }
    
    if (!first_name || !gender) {
      return NextResponse.json({ error: 'First name and gender are required' }, { status: 400 });
    }
    
    // Use withConnection to handle transaction
    const result = await withConnection(async (connection) => {
      // Check if the student exists
      const [studentRows] = await connection.query(
        'SELECT * FROM students WHERE id = ?',
        [student_id]
      );
      
      if (!studentRows || (studentRows as any[]).length === 0) {
        throw new Error('Student not found');
      }
      
      // Check if the student is in the specified class
      const [classStudentRows] = await connection.query(
        'SELECT * FROM class_students WHERE class_id = ? AND student_id = ?',
        [classId, student_id]
      );
      
      if (!classStudentRows || (classStudentRows as any[]).length === 0) {
        throw new Error('Student is not in this class');
      }
      
      // Generate a default email if not provided
      const finalEmail = email || `${first_name.toLowerCase().replace(/\s+/g, '.')}.${(last_name || 'student').toLowerCase().replace(/\s+/g, '.')}@example.com`;
      const finalLastName = last_name || '';
      
      // Update the student information
      await connection.query(
        'UPDATE students SET email = ?, first_name = ?, last_name = ?, gender = ? WHERE id = ?',
        [finalEmail, first_name, finalLastName, gender, student_id]
      );
      
      // Get the updated student record
      const [updatedStudentRows] = await connection.query(
        'SELECT id, email, first_name, last_name, gender FROM students WHERE id = ?',
        [student_id]
      );
      
      return (updatedStudentRows as any[])[0];
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating student:', error);
    const message = error instanceof Error ? error.message : 'Failed to update student';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Create endpoint to delete a student from a class
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params
    const { id } = await params;
    const classId = parseInt(id);
    const url = new URL(request.url);
    const studentId = parseInt(url.searchParams.get('studentId') || '');
    
    if (isNaN(classId) || isNaN(studentId)) {
      return NextResponse.json({ 
        error: 'Invalid class ID or student ID' 
      }, { status: 400 });
    }
    
    // Delete the class_student relationship (not the student itself)
    await query(
      'DELETE FROM class_students WHERE class_id = ? AND student_id = ?', 
      [classId, studentId]
    );
    
    return NextResponse.json({ message: 'Student removed from class' });
  } catch (error) {
    console.error('Error removing student from class:', error);
    return NextResponse.json({ 
      error: 'Failed to remove student from class' 
    }, { status: 500 });
  }
}
