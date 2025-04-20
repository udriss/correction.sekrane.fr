import { NextRequest, NextResponse } from 'next/server';
import { query, withConnection } from '@/lib/db';
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { getUser } from '@/lib/auth';

// GET: Get a student by ID within a specific class
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string, studentId: string }> }
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
    const { id, studentId } = await params;
    
    const classId = parseInt(id);
    const studId = parseInt(studentId);
    
    if (isNaN(classId) || isNaN(studId)) {
      return NextResponse.json({ error: 'Invalid class ID or student ID' }, { status: 400 });
    }
    
    const classStudentRows = await query<any[]>(
      `
      SELECT cs.*, s.first_name, s.last_name, s.email, s.gender
      FROM class_students cs
      JOIN students s ON cs.student_id = s.id
      WHERE cs.class_id = ? AND cs.student_id = ?
      `,
      [classId, studId]
    );
    
    if (classStudentRows.length === 0) {
      return NextResponse.json({ error: 'Student not found in this class' }, { status: 404 });
    }
    
    return NextResponse.json(classStudentRows[0]);
    
  } catch (error) {
    console.error('Error fetching student from class:', error);
    return NextResponse.json({ error: 'Error fetching student from class' }, { status: 500 });
  }
}

// PUT: Update a student's information within a specific class
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string, studentId: string }> }
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
    const { id, studentId } = await params;
    
    const classId = parseInt(id);
    const studId = parseInt(studentId);
    
    if (isNaN(classId) || isNaN(studId)) {
      return NextResponse.json({ error: 'Invalid class ID or student ID' }, { status: 400 });
    }
    
    const body = await req.json();
    
    // Data validation
    if (!body.first_name || !body.last_name || !body.email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Check if the student exists in this class
    const classStudentRows = await query(
      `
      SELECT *
      FROM class_students
      WHERE class_id = ? AND student_id = ?
      `,
      [classId, studId]
    );
    
    // If student is not in this class yet, create the association instead of throwing an error
    if ((classStudentRows as any[]).length === 0) {
      // Create the association between student and class
      await query(
        `
        INSERT INTO class_students (class_id, student_id, sub_class, created_at, updated_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `,
        [classId, studId, body.sub_class || null]
      );
      
      // Return success message for new association
      return NextResponse.json({ 
        message: 'Student successfully associated with class',
        studentId: studId,
        classId
      });
    }
    
    // If student exists in class, update the association
    // Update class_students entry
    await query(
      `
      UPDATE class_students
      SET sub_class = ?, updated_at = CURRENT_TIMESTAMP
      WHERE class_id = ? AND student_id = ?
      `,
      [body.sub_class || null, classId, studId]
    );
    
    // Update student information in the students table
    await query(
      `
      UPDATE students
      SET first_name = ?, last_name = ?, email = ?, gender = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
      [body.first_name, body.last_name, body.email, body.gender || 'N', studId]
    );
    
    return NextResponse.json({ 
      message: 'Student updated successfully',
      studentId: studId,
      classId
    });
    
  } catch (error) {
    console.error('Error updating student:', error);
    return NextResponse.json({ error: 'Error updating student' }, { status: 500 });
  }
}

// DELETE: Remove a student from a specific class
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string, studentId: string }> }
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
    const { id, studentId } = await params;
    
    const classId = parseInt(id);
    const studId = parseInt(studentId);
    
    if (isNaN(classId) || isNaN(studId)) {
      return NextResponse.json({ error: 'Invalid class ID or student ID' }, { status: 400 });
    }
    
    // Check if the association exists
    const classStudentRows = await query(
      `
      SELECT *
      FROM class_students
      WHERE class_id = ? AND student_id = ?
      `,
      [classId, studId]
    );
    
    if ((classStudentRows as any[]).length === 0) {
      return NextResponse.json({ error: 'Student not found in this class' }, { status: 404 });
    }
    
    // Delete the association (not the student itself)
    await query(
      `
      DELETE FROM class_students
      WHERE class_id = ? AND student_id = ?
      `,
      [classId, studId]
    );
    
    return NextResponse.json({ 
      message: 'Student removed from class successfully',
      studentId: studId,
      classId
    });
    
  } catch (error) {
    console.error('Error removing student from class:', error);
    return NextResponse.json({ error: 'Error removing student from class' }, { status: 500 });
  }
}

// POST: Create an association between a student and a class
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string, studentId: string }> }
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
    const { id, studentId } = await params;
    
    const classId = parseInt(id);
    const studId = parseInt(studentId);
    
    if (isNaN(classId) || isNaN(studId)) {
      return NextResponse.json({ error: 'Invalid class ID or student ID' }, { status: 400 });
    }
    
    const body = await req.json();
    
    
    // Extract sub_class from the request body
    const subClass = body.sub_class !== undefined ? body.sub_class : null;
    
    // Check if the association already exists
    const classStudentRows = await query(
      `
      SELECT *
      FROM class_students
      WHERE class_id = ? AND student_id = ?
      `,
      [classId, studId]
    );
    
    // If association already exists, update the sub_class instead of returning conflict
    if ((classStudentRows as any[]).length > 0) {
      // Update the existing association with the new sub_class
      await query(
        `
        UPDATE class_students
        SET sub_class = ?, updated_at = CURRENT_TIMESTAMP
        WHERE class_id = ? AND student_id = ?
        `,
        [subClass, classId, studId]
      );
      
      return NextResponse.json({ 
        message: 'Student association updated with new sub_class',
        studentId: studId,
        classId,
        sub_class: subClass
      });
    }
    
    // Create the association between student and class with the sub_class
    await query(
      `
      INSERT INTO class_students (class_id, student_id, sub_class, created_at, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `,
      [classId, studId, subClass]
    );
    
    return NextResponse.json({ 
      message: 'Student successfully associated with class',
      studentId: studId,
      classId,
      sub_class: subClass
    });
    
  } catch (error) {
    console.error('Error associating student with class:', error);
    return NextResponse.json({ error: 'Error associating student with class' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; studentId: string }> }
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
    
    const { id, studentId } = await params;
    const classId = parseInt(id);
    const studentIdNumber = parseInt(studentId);

    if (isNaN(classId) || isNaN(studentIdNumber)) {
      return NextResponse.json({ error: 'Invalid IDs provided' }, { status: 400 });
    }

    const body = await request.json();
    
    
    // Utiliser sub_class du body s'il est présent, sinon chercher dans allClasses
    let subClass = body.sub_class;

    // Gérer allClasses s'il est présent
    if (body.allClasses && Array.isArray(body.allClasses)) {
      return withConnection(async (connection) => {
        // Si subClass n'est pas défini, chercher dans allClasses pour la classe courante
        if (subClass === undefined) {
          const currentClassEntry = body.allClasses.find((cls: any) => cls.classId === classId);
          if (currentClassEntry) {
            subClass = currentClassEntry.sub_class;
          }
        }

        // Mettre à jour ou créer l'association pour la classe courante
        const [existingRows] = await connection.query(
          'SELECT * FROM class_students WHERE class_id = ? AND student_id = ?',
          [classId, studentIdNumber]
        );

        if (Array.isArray(existingRows) && existingRows.length > 0) {
          // Mettre à jour l'association existante
          await connection.query(
            'UPDATE class_students SET sub_class = ?, updated_at = NOW() WHERE class_id = ? AND student_id = ?',
            [subClass, classId, studentIdNumber]
          );
        } else {
          // Créer une nouvelle association
          await connection.query(
            'INSERT INTO class_students (class_id, student_id, sub_class, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
            [classId, studentIdNumber, subClass]
          );
        }

        // Mettre à jour les autres associations de classes si présentes dans allClasses
        for (const cls of body.allClasses) {
          // Ignorer la classe courante car déjà traitée
          // if (cls.classId === classId) continue;

          const [otherExistingRows] = await connection.query(
            'SELECT * FROM class_students WHERE class_id = ? AND student_id = ?',
            [cls.classId, studentIdNumber]
          );

          if (Array.isArray(otherExistingRows) && otherExistingRows.length > 0) {
            // Mettre à jour l'association existante
            await connection.query(
              'UPDATE class_students SET sub_class = ?, updated_at = NOW() WHERE class_id = ? AND student_id = ?',
              [cls.sub_class, cls.classId, studentIdNumber]
            );
          } else {
            // Créer une nouvelle association
            await connection.query(
              'INSERT INTO class_students (class_id, student_id, sub_class, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
              [cls.classId, studentIdNumber, cls.sub_class]
            );
          }
        }

        return NextResponse.json({ 
          message: 'Student class associations updated successfully',
          class_id: classId,
          student_id: studentIdNumber,
          sub_class: subClass,
          allClassesUpdated: true
        });
      });
    } else {
      // Comportement d'origine si allClasses n'est pas présent
      return withConnection(async (connection) => {
        // Vérifier si l'association existe déjà
        const [existingRows] = await connection.query(
          'SELECT * FROM class_students WHERE class_id = ? AND student_id = ?',
          [classId, studentIdNumber]
        );

        if (Array.isArray(existingRows) && existingRows.length > 0) {
          // Mettre à jour l'association existante
          await connection.query(
            'UPDATE class_students SET sub_class = ?, updated_at = NOW() WHERE class_id = ? AND student_id = ?',
            [subClass, classId, studentIdNumber]
          );
        } else {
          // Créer une nouvelle association
          await connection.query(
            'INSERT INTO class_students (class_id, student_id, sub_class, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
            [classId, studentIdNumber, subClass]
          );
        }

        return NextResponse.json({ 
          message: 'Student class association updated successfully',
          class_id: classId,
          student_id: studentIdNumber,
          sub_class: subClass
        });
      });
    }
  } catch (error) {
    console.error('Error updating student class:', error);
    return NextResponse.json(
      { error: 'Failed to update student class association' },
      { status: 500 }
    );
  }
}
