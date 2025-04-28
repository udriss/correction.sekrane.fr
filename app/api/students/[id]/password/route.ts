import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';
import { getUser } from '@/lib/auth';
import { createLogEntry } from '@/lib/services/logsService';

// API pour gérer le mot de passe d'un étudiant
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Vérification d'authentification
    const session = await getServerSession(authOptions);
    const customUser = await getUser(req);
    const userId = customUser?.id || session?.user?.id;
      
    if (!userId) {
      return NextResponse.json(
        { error: 'authentification requise' },
        { status: 401 }
      );
    }
    
    // Récupération de l'ID étudiant
    const { id } = await params;
    const studentId = parseInt(id);
    
    if (isNaN(studentId)) {
      return NextResponse.json({ error: 'ID étudiant invalide' }, { status: 400 });
    }

    // Vérifier si on doit inclure la valeur du mot de passe
    const includeValue = req.nextUrl.searchParams.get('includeValue') === 'true';

    // Vérifier que l'étudiant existe
    const students = await query<any[]>(`
      SELECT id, first_name, last_name FROM students 
      WHERE id = ?
    `, [studentId]);

    if (!students || students.length === 0) {
      return NextResponse.json({ error: 'Étudiant non trouvé' }, { status: 404 });
    }

    // Récupérer les informations sur le mot de passe
    const passwordQuery = includeValue 
      ? `SELECT student_id, password FROM student_pass WHERE student_id = ?`
      : `SELECT student_id FROM student_pass WHERE student_id = ?`;
    
    const passwordStatus = await query<any[]>(passwordQuery, [studentId]);

    const response: any = {
      studentId,
      hasPassword: passwordStatus.length > 0,
      message: passwordStatus.length > 0 
        ? 'L\'étudiant possède déjà un mot de passe.' 
        : 'L\'étudiant n\'a pas encore de mot de passe.',
    };

    // Ajouter la valeur du mot de passe si nécessaire
    if (includeValue && passwordStatus.length > 0) {
      response.passwordValue = passwordStatus[0].password;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Erreur lors de la vérification du mot de passe:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Vérification d'authentification
    const session = await getServerSession(authOptions);
    const customUser = await getUser(req);
    const userId = customUser?.id || session?.user?.id;
      
    if (!userId) {
      return NextResponse.json(
        { error: 'authentification requise' },
        { status: 401 }
      );
    }
    
    // Récupération de l'ID étudiant et des données
    const { id } = await params;
    const studentId = parseInt(id);
    
    if (isNaN(studentId)) {
      return NextResponse.json({ error: 'ID étudiant invalide' }, { status: 400 });
    }

    const { password } = await req.json();
    
    if (!password) {
      return NextResponse.json({ error: 'Mot de passe requis' }, { status: 400 });
    }

    // Vérifier que l'étudiant existe
    const students = await query<any[]>(`
      SELECT id, first_name, last_name FROM students 
      WHERE id = ?
    `, [studentId]);

    if (!students || students.length === 0) {
      return NextResponse.json({ error: 'Étudiant non trouvé' }, { status: 404 });
    }

    // Vérifier si l'étudiant a déjà un mot de passe
    const passwordExists = await query<any[]>(`
      SELECT 1 FROM student_pass 
      WHERE student_id = ?
    `, [studentId]);

    if (passwordExists.length > 0) {
      // Mettre à jour le mot de passe existant
      await query(`
        UPDATE student_pass
        SET password = ?, updated_at = CURRENT_TIMESTAMP
        WHERE student_id = ?
      `, [password, studentId]);
    } else {
      // Créer un nouveau mot de passe
      await query(`
        INSERT INTO student_pass (student_id, password)
        VALUES (?, ?)
      `, [studentId, password]);
    }

    // Journaliser l'action
    await createLogEntry({
      action_type: passwordExists.length > 0 ? 'UPDATE_STUDENT_PASSWORD' : 'CREATE_STUDENT_PASSWORD',
      description: `${passwordExists.length > 0 ? 'Mise à jour' : 'Création'} du mot de passe pour l'étudiant ID: ${studentId}`,
      entity_type: 'student',
      entity_id: studentId,
      user_id: typeof userId === 'string' ? parseInt(userId) : userId,
      username: customUser?.username || session?.user?.name,
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
      metadata: {
        student_id: studentId,
        student_name: `${students[0].first_name} ${students[0].last_name}`,
        action: passwordExists.length > 0 ? 'update' : 'create'
      }
    });

    return NextResponse.json({
      success: true,
      message: passwordExists.length > 0 
        ? 'Mot de passe mis à jour avec succès.' 
        : 'Mot de passe créé avec succès.',
      studentId
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du mot de passe:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Vérification d'authentification
    const session = await getServerSession(authOptions);
    const customUser = await getUser(req);
    const userId = customUser?.id || session?.user?.id;
      
    if (!userId) {
      return NextResponse.json(
        { error: 'authentification requise' },
        { status: 401 }
      );
    }
    
    // Récupération de l'ID étudiant
    const { id } = await params;
    const studentId = parseInt(id);
    
    if (isNaN(studentId)) {
      return NextResponse.json({ error: 'ID étudiant invalide' }, { status: 400 });
    }

    // Vérifier que l'étudiant existe
    const students = await query<any[]>(`
      SELECT id, first_name, last_name FROM students 
      WHERE id = ?
    `, [studentId]);

    if (!students || students.length === 0) {
      return NextResponse.json({ error: 'Étudiant non trouvé' }, { status: 404 });
    }

    // Supprimer le mot de passe
    const result = await query(`
      DELETE FROM student_pass
      WHERE student_id = ?
    `, [studentId]);

    const deleted = (result as any).affectedRows > 0;

    if (deleted) {
      // Journaliser l'action
      await createLogEntry({
        action_type: 'DELETE_STUDENT_PASSWORD',
        description: `Suppression du mot de passe pour l'étudiant ID: ${studentId}`,
        entity_type: 'student',
        entity_id: studentId,
        user_id: typeof userId === 'string' ? parseInt(userId) : userId,
        username: customUser?.username || session?.user?.name,
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        metadata: {
          student_id: studentId,
          student_name: `${students[0].first_name} ${students[0].last_name}`
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: deleted 
        ? 'Mot de passe supprimé avec succès.' 
        : 'Aucun mot de passe à supprimer pour cet étudiant.',
      studentId
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du mot de passe:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}