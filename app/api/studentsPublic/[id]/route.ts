import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';
import { getUser } from '@/lib/auth';
import { createLogEntry } from '@/lib/services/logsService';

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
      // Log access only for unauthenticated users
      await createLogEntry({
        action_type: 'GET_STUDENT_PUBLIC',
        description: `Accès non authentifié aux données publiques de l'étudiant ID: ${studentId}`,
        entity_type: 'student',
        entity_id: studentId,
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        metadata: {
          path: req.nextUrl.pathname,
          method: req.method
        }
      });
    }
    
    if (isNaN(studentId)) {
      return NextResponse.json({ error: 'ID étudiant invalide' }, { status: 400 });
    }

    // Récupérer les informations de l'étudiant
    const studentData = await query<any[]>(`
      SELECT s.id, s.first_name, s.last_name
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
      first_name: studentData[0].first_name,
      last_name: studentData[0].last_name.substring(0, 3),
    };
    
    return NextResponse.json(student);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'étudiant:', error);
    return NextResponse.json(
      { error: error }, 
      { status: 500 }
    );
  }
}

