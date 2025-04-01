import { NextRequest, NextResponse } from 'next/server';
import { query, withConnection } from '@/lib/db';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';
import { getUser } from '@/lib/auth';

// GET - Récupérer tous les étudiants d'un groupe
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    const customUser = await getUser(req);
    const userId = customUser?.id || session?.user?.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      );
    }
    
    const { id } = await params;
    const groupId = parseInt(id);
    
    if (isNaN(groupId)) {
      return NextResponse.json(
        { error: 'ID de groupe invalide' },
        { status: 400 }
      );
    }
    
    // Vérifier que le groupe existe
    const groups = await query<any[]>(`
      SELECT * FROM groups WHERE id = ?
    `, [groupId]);
    
    if (groups.length === 0) {
      return NextResponse.json(
        { error: 'Groupe non trouvé' },
        { status: 404 }
      );
    }
    
    // Récupérer les étudiants du groupe avec leurs informations
    const students = await query<any[]>(`
      SELECT s.*, gs.created_at as joined_at, c.id as class_id, c.name as class_name
      FROM students s
      JOIN group_students gs ON s.id = gs.student_id
      LEFT JOIN class_students cs ON s.id = cs.student_id
      LEFT JOIN classes c ON cs.class_id = c.id
      WHERE gs.group_id = ?
      ORDER BY s.last_name, s.first_name
    `, [groupId]);
    
    return NextResponse.json(students);
  } catch (error) {
    console.error('Erreur lors de la récupération des étudiants du groupe:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Ajouter des étudiants à un groupe
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    const customUser = await getUser(req);
    const userId = customUser?.id || session?.user?.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      );
    }
    
    const { id } = await params;
    const groupId = parseInt(id);
    
    if (isNaN(groupId)) {
      return NextResponse.json(
        { error: 'ID de groupe invalide' },
        { status: 400 }
      );
    }
    
    // Vérifier que le groupe existe
    const groups = await query<any[]>(`
      SELECT * FROM groups WHERE id = ?
    `, [groupId]);
    
    if (groups.length === 0) {
      return NextResponse.json(
        { error: 'Groupe non trouvé' },
        { status: 404 }
      );
    }
    
    const body = await req.json();
    const { studentIds } = body;
    
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json(
        { error: 'Liste d\'IDs étudiants requise' },
        { status: 400 }
      );
    }
    
    // Ajouter les étudiants au groupe
    return await withConnection(async (connection) => {
      const addedStudents = [];
      const errors = [];
      
      for (const studentId of studentIds) {
        try {
          // Vérifier que l'étudiant existe
          const [studentRows] = await connection.query(
            `SELECT * FROM students WHERE id = ?`,
            [studentId]
          );
          
          if ((studentRows as any[]).length === 0) {
            errors.push({ studentId, error: 'Étudiant non trouvé' });
            continue;
          }
          
          // Vérifier si l'association existe déjà
          const [existingAssociation] = await connection.query(
            `SELECT * FROM group_students WHERE group_id = ? AND student_id = ?`,
            [groupId, studentId]
          );
          
          if ((existingAssociation as any[]).length > 0) {
            // L'étudiant est déjà dans ce groupe
            addedStudents.push({ 
              studentId, 
              status: 'existing',
              message: 'Étudiant déjà dans ce groupe' 
            });
            continue;
          }
          
          // Ajouter l'étudiant au groupe
          await connection.query(
            `INSERT INTO group_students (group_id, student_id, created_at, updated_at)
            VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            [groupId, studentId]
          );
          
          addedStudents.push({ studentId, status: 'added' });
        } catch (error) {
          console.error(`Erreur lors de l'ajout de l'étudiant ${studentId}:`, error);
          errors.push({ studentId, error: 'Erreur lors de l\'ajout' });
        }
      }
      
      return NextResponse.json({
        success: true,
        addedStudents,
        errors: errors.length > 0 ? errors : null
      });
    });
  } catch (error) {
    console.error('Erreur lors de l\'ajout d\'étudiants au groupe:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un étudiant d'un groupe
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    const customUser = await getUser(req);
    const userId = customUser?.id || session?.user?.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      );
    }
    
    const { id } = await params;
    const groupId = parseInt(id);
    
    if (isNaN(groupId)) {
      return NextResponse.json(
        { error: 'ID de groupe invalide' },
        { status: 400 }
      );
    }
    
    // Récupérer l'ID de l'étudiant à supprimer du groupe
    const url = new URL(req.url);
    const studentId = parseInt(url.searchParams.get('studentId') || '');
    
    if (isNaN(studentId)) {
      return NextResponse.json(
        { error: 'ID étudiant invalide' },
        { status: 400 }
      );
    }
    
    // Supprimer l'association
    await query(`
      DELETE FROM group_students 
      WHERE group_id = ? AND student_id = ?
    `, [groupId, studentId]);
    
    return NextResponse.json({
      success: true,
      message: 'Étudiant retiré du groupe'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'étudiant du groupe:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
