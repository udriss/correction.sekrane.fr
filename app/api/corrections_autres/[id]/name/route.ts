// filepath: /var/www/correction.sekrane.fr/app/api/corrections_autres/[id]/name/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withConnection } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth';
import { getUser } from '@/lib/auth';

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
    const correctionId = parseInt(id);
    
    if (!correctionId) {
      return NextResponse.json({ error: 'ID de correction manquant' }, { status: 400 });
    }

    // Get the request body
    const body = await request.json();
    
    
    // Check if we have the necessary data
    const studentFirstName = body.student_first_name;
    const studentLastName = body.student_last_name;
    const studentEmail = body.student_email; // Ajout de la récupération de l'email
    
    
    if (!studentFirstName && !studentLastName) {
      return NextResponse.json({ error: 'Prénom ou nom requis' }, { status: 400 });
    }
    
    // Validation du format d'email si fourni
    if (studentEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(studentEmail)) {
      return NextResponse.json({ error: 'Format d\'email invalide' }, { status: 400 });
    }

    return await withConnection(async (connection) => {
      // First, get the student_id from the correction
      const [correctionResult] = await connection.query(
        'SELECT student_id FROM corrections_autres WHERE id = ?',
        [correctionId]
      );

      if (!Array.isArray(correctionResult) || (correctionResult as any[]).length === 0) {
        return NextResponse.json({ error: 'Correction introuvable' }, { status: 404 });
      }

      const student_id = (correctionResult as any[])[0].student_id;
      
      if (!student_id) {
        return NextResponse.json({ error: "ID d'étudiant non trouvé dans la correction" }, { status: 404 });
      }

      // Check if the student exists
      const [studentResult] = await connection.query(
        'SELECT * FROM students WHERE id = ?',
        [student_id]
      );

      if (!Array.isArray(studentResult) || (studentResult as any[]).length === 0) {
        return NextResponse.json({ error: 'Étudiant non trouvé' }, { status: 404 });
      }

      // Update the student's information in the students table, including email
      await connection.query(
        'UPDATE students SET first_name = ?, last_name = ?, email = ? WHERE id = ?',
        [studentFirstName, studentLastName, studentEmail, student_id]
      );

      // Get the updated student data
      const [updatedStudentResult] = await connection.query(
        'SELECT * FROM students WHERE id = ?',
        [student_id]
      );

      if (!Array.isArray(updatedStudentResult) || (updatedStudentResult as any[]).length === 0) {
        return NextResponse.json({ error: 'Erreur lors de la récupération des données mises à jour' }, { status: 500 });
      }

      const updatedStudent = (updatedStudentResult as any[])[0];

      // Return the updated student data with additional logging and email field
      const response = {
        success: true,
        student_id: updatedStudent.id,
        student_first_name: updatedStudent.first_name,
        student_last_name: updatedStudent.last_name,
        student_email: updatedStudent.email, // Ajout de l'email dans la réponse
        student_name: `${updatedStudent.first_name || ''} ${updatedStudent.last_name || ''}`.trim()
      };
      
      
      return NextResponse.json(response);
    });
  } catch (error: any) {
    console.error('Error updating student information:', error);
    
    // Extraire les détails de l'erreur pour les inclure dans la réponse
    const errorDetails = {
      message: error.message || "Erreur inconnue",
      code: error.code,
      sqlMessage: error.sqlMessage,
      sql: error.sql,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };
    console.error('Error details:', errorDetails);
    
    return NextResponse.json({ 
      error: "Erreur lors de la mise à jour des informations de l'étudiant", 
      details: errorDetails 
    }, { status: 500 });
  }
}