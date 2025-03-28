import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { getUser } from '@/lib/auth';
import authOptions from '@/lib/auth';

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
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      );
    }
    
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

    return NextResponse.json(studentClasses);
  } catch (error) {
    console.error(`Erreur lors de la récupération des classes pour l'étudiant ${params}:`, error);
    return NextResponse.json(
      { message: 'Erreur serveur', error: (error as Error).message },
      { status: 500 }
    );
  }
}