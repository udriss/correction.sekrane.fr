import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';
import { getUser } from '@/lib/auth';

// Ajouter la méthode GET
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params
    const { id } = await params;
    const studentId = parseInt(id);
    
    // Authentication check
    const session = await getServerSession(authOptions);
    const customUser = await getUser(req);
    const userId = customUser?.id || session?.user?.id;
      
    if (!userId) {
      return NextResponse.json(
        { error: 'authentification requise' },
        { status: 401 }
      );
    }
    
    if (isNaN(studentId)) {
      return NextResponse.json({ error: 'ID étudiant invalide' }, { status: 400 });
    }

    // Récupérer les informations de l'étudiant
    const studentData = await query<any[]>(`
      SELECT s.*, cs.class_id, cs.sub_class 
      FROM students s
      LEFT JOIN class_students cs ON s.id = cs.student_id
      WHERE s.id = ?
    `, [studentId]);

    if (!studentData || studentData.length === 0) {
      return NextResponse.json({ error: 'Étudiant non trouvé' }, { status: 404 });
    }
    
    // Formater les résultats pour le client
    // Si l'étudiant a plusieurs classes, on renvoie les informations de la première classe
    const student = {
      id: studentData[0].id,
      email: studentData[0].email,
      first_name: studentData[0].first_name,
      last_name: studentData[0].last_name,
      gender: studentData[0].gender,
      created_at: studentData[0].created_at,
      updated_at: studentData[0].updated_at,
      // Informations optionnelles qui pourraient être présentes
      code: studentData[0].code || null,
      phone: studentData[0].phone || null,
      classId: studentData[0].class_id || null,
      group: studentData[0].sub_class || null
    };
    
    return NextResponse.json(student);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'étudiant:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des informations de l\'étudiant' }, 
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params as needed in Next.js 15
    const { id } = await params;
    const studentId = parseInt(id);
    
    // Authentication check - use both methods as in the stats route
    const session = await getServerSession(authOptions);
    const customUser = await getUser(req);
    const userId = customUser?.id || session?.user?.id;
      
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      );
    }
    
    if (isNaN(studentId)) {
      return NextResponse.json({ error: 'Invalid student ID' }, { status: 400 });
    }

    // Verify that student exists before deletion
    const students = await query<any[]>(`
      SELECT * FROM students WHERE id = ?
    `, [studentId]);

    if (!students || students.length === 0) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Delete student's class associations first (due to foreign key constraints)
    await query(`
      DELETE FROM class_students WHERE student_id = ?
    `, [studentId]);
    
    // Delete the student
    await query(`
      DELETE FROM students WHERE id = ?
    `, [studentId]);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting student:', error);
    return NextResponse.json(
      { error: 'Error deleting student' }, 
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params as needed in Next.js 15
    const { id } = await params;
    const studentId = parseInt(id);
    
    // Authentication check - use both methods as in the stats route
    const session = await getServerSession(authOptions);
    const customUser = await getUser(req);
    const userId = customUser?.id || session?.user?.id;
      
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      );
    }
    
    if (isNaN(studentId)) {
      return NextResponse.json({ error: 'Invalid student ID' }, { status: 400 });
    }
    
    // Parse the request body
    const studentData = await req.json();
    
    
    // Validate required fields - make these match your actual field names in the form
    if (!studentData.first_name || !studentData.last_name || !studentData.email) {
      return NextResponse.json(
        { error: 'First name, last name and email are required' }, 
        { status: 400 }
      );
    }

    // Check if the student exists
    const students = await query<any[]>(`
      SELECT * FROM students WHERE id = ?
    `, [studentId]);

    if (!students || students.length === 0) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }
    
    // Vérifier si l'email a changé avant de faire la mise à jour
    const [currentStudent] = await query<any[]>(
      'SELECT email FROM students WHERE id = ?',
      [studentId]
    );

    if (currentStudent && currentStudent.email === studentData.email) {
      // Si l'email n'a pas changé, procéder à la mise à jour sans vérification d'unicité
      await query(`
        UPDATE students 
        SET first_name = ?, last_name = ?, gender = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
        studentData.first_name, 
        studentData.last_name, 
        studentData.gender,
        studentId
      ]);
    } else {
      // Si l'email a changé, faire la mise à jour complète avec vérification d'unicité
      try {
        await query(`
          UPDATE students 
          SET first_name = ?, last_name = ?, email = ?, gender = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [
          studentData.first_name, 
          studentData.last_name, 
          studentData.email, 
          studentData.gender,
          studentId
        ]);
      } catch (error: any) {
        // Capture spécifiquement l'erreur de duplication d'email
        if (error.code === 'ER_DUP_ENTRY' && error.sqlMessage?.includes('unique_email')) {
          const [existingStudent] = await query<any[]>(
            'SELECT id, first_name, last_name, email FROM students WHERE email = ?',
            [studentData.email]
          );

          return NextResponse.json({ 
            error: 'adresse mail déjà utilisée',
            details: `L'adresse email "${studentData.email}" est déjà associée à un autre étudiant.`,
            code: 'DUPLICATE_EMAIL',
            existingStudent: existingStudent
          }, { status: 409 });
        }
        throw error;
      }
    }

    console.log('Student updated successfully:', studentData);
    
    // Handle class associations - updated to handle multiple classes
    if (studentData.classes && Array.isArray(studentData.classes) && studentData.classes.length > 0) {
      // Get current class associations
      const currentAssociations = await query<any[]>(`
        SELECT class_id, sub_class FROM class_students 
        WHERE student_id = ?
      `, [studentId]);
      
      const currentClassIds = currentAssociations.map(assoc => assoc.class_id);
      
      // Process each class in the array
      for (const classItem of studentData.classes) {
        const classId = classItem.id;
        const groupValue = classItem.group || null;
        
        // Skip if classId is missing
        if (!classId) continue;
        
        // Check if this association already exists
        const existingAssocIndex = currentClassIds.indexOf(classId);
        
        if (existingAssocIndex !== -1) {
          // Update existing association
          await query(`
            UPDATE class_students
            SET sub_class = ?, updated_at = CURRENT_TIMESTAMP
            WHERE student_id = ? AND class_id = ?
          `, [groupValue, studentId, classId]);
        } else {
          // Create new association
          await query(`
            INSERT INTO class_students (student_id, class_id, sub_class, created_at, updated_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `, [studentId, classId, groupValue]);
        }
      }
      
      // Remove associations that are no longer needed
      const newClassIds = studentData.classes.map((cls: { id: number }) => cls.id);
      const classIdsToRemove = currentClassIds.filter(id => !newClassIds.includes(id));
      
      if (classIdsToRemove.length > 0) {
        // Use parameterized query with multiple placeholders
        const placeholders = classIdsToRemove.map(() => '?').join(',');
        await query(`
          DELETE FROM class_students 
          WHERE student_id = ? AND class_id IN (${placeholders})
        `, [studentId, ...classIdsToRemove]);
      }
      
      // Update primary class if provided
      if (studentData.classId) {
        // Make sure the primary class is in the selected classes
        if (!newClassIds.includes(studentData.classId)) {
          // If not, add it
          const groupForPrimary = studentData.group || null;
          await query(`
            INSERT INTO class_students (student_id, class_id, sub_class, created_at, updated_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON DUPLICATE KEY UPDATE sub_class = ?, updated_at = CURRENT_TIMESTAMP
          `, [studentId, studentData.classId, groupForPrimary, groupForPrimary]);
        }
      }
    } else if (studentData.classId) {
      // Backward compatibility: handle single class ID
      // Vérifier d'abord si l'association étudiant-classe existe déjà
      const existingAssociation = await query<any[]>(`
        SELECT * FROM class_students 
        WHERE student_id = ? AND class_id = ?
      `, [studentId, studentData.classId]);

      if (existingAssociation.length > 0) {
        // L'association existe déjà, mettre à jour uniquement le sous-groupe
        await query(`
          UPDATE class_students
          SET sub_class = ?, updated_at = CURRENT_TIMESTAMP
          WHERE student_id = ? AND class_id = ?
        `, [studentData.group || null, studentId, studentData.classId]);
      } else {
        // Créer une nouvelle association
        await query(`
          INSERT INTO class_students (student_id, class_id, sub_class, created_at, updated_at)
          VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [studentId, studentData.classId, studentData.group || null]);
      }
    } else {
      // If no class data is provided, remove all class associations
      await query(`
        DELETE FROM class_students WHERE student_id = ?
      `, [studentId]);
    }
    
    // Return updated student data
    const updatedStudentData = await query<any[]>(`
      SELECT s.*, cs.class_id as classId, cs.sub_class as \`group\`
      FROM students s
      LEFT JOIN class_students cs ON s.id = cs.student_id
      WHERE s.id = ?
    `, [studentId]);
    
    return NextResponse.json(updatedStudentData[0] || {});
  } catch (error) {
    console.error('Error updating student:', error);
    return NextResponse.json(
      { error: 'Error updating student' }, 
      { status: 500 }
    );
  }
}