import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { getUser } from '@/lib/auth';
import authOptions from '@/lib/auth';
import { createLogEntry } from '@/lib/services/logsService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params as needed in Next.js 15
    const { id } = await params;
    const studentId = parseInt(id);
    
    // Authentication check
    const session = await getServerSession(authOptions);
    const customUser = await getUser(request);
    const userId = customUser?.id || session?.user?.id;
    
    if (isNaN(studentId)) {
      return NextResponse.json(
        { error: 'ID étudiant invalide' },
        { status: 400 }
      );
    }

    // Vérifier que l'étudiant existe
    const student = await query(`
      SELECT * FROM students WHERE id = ?
    `, [studentId]);

    if (!student || (student as any[]).length === 0) {
      await createLogEntry({
        action_type: 'GET_STUDENT_CLASSES_ERROR',
        description: `Tentative d'accès aux classes d'un étudiant inexistant (ID: ${studentId})`,
        entity_type: 'student',
        entity_id: studentId,
        user_id: customUser?.id,
        username: customUser?.username,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        metadata: {
          error: 'Étudiant non trouvé'
        }
      });
      
      return NextResponse.json(
        { error: 'Étudiant non trouvé' },
        { status: 404 }
      );
    }

    // Récupérer les classes de l'étudiant
    const studentClasses = await query(`
      SELECT 
        c.id, 
        c.name, 
        c.academic_year,
        c.nbre_subclasses,
        cs.sub_class
      FROM 
        classes c
      JOIN 
        class_students cs ON c.id = cs.class_id
      WHERE 
        cs.student_id = ?
      ORDER BY 
        c.name
    `, [studentId]);

    // Enregistrer l'accès dans les logs
    if (!userId) {
    await createLogEntry({
      action_type: 'GET_STUDENT_CLASSES',
      description: `Consultation sans authentification des classes de l'étudiant ID: ${studentId}`,
      entity_type: 'student',
      entity_id: studentId,
      user_id: customUser?.id,
      username: customUser?.username,
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      metadata: {
        student_id: studentId,
        classes_count: Array.isArray(studentClasses) ? studentClasses.length : 0,
        student_info: Array.isArray(student) && student.length > 0 ? {
          name: `${(student[0] as any).first_name || ''} ${(student[0] as any).last_name || ''}`.trim(),
          email: (student[0] as any).email
        } : null
      }
    });
  }

    return NextResponse.json(studentClasses);
  } catch (error) {
    console.error(`Erreur lors de la récupération des classes pour l'étudiant ${params}:`, error);
    
    // Enregistrer l'erreur dans les logs
    try {
      const { id } = await params;
      const studentId = parseInt(id);
      const user = await getUser(request);
      
      await createLogEntry({
        action_type: 'GET_STUDENT_CLASSES_ERROR',
        description: `Erreur lors de la récupération des classes pour l'étudiant ID: ${studentId}`,
        entity_type: 'student',
        entity_id: isNaN(studentId) ? undefined : studentId,
        user_id: user?.id,
        username: user?.username,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        metadata: {
          error: (error as Error).message,
          stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
        }
      });
    } catch (logError) {
      console.error('Erreur lors de la création du log:', logError);
    }
    
    return NextResponse.json(
      { message: 'Erreur serveur', error: (error as Error).message },
      { status: 500 }
    );
  }
}