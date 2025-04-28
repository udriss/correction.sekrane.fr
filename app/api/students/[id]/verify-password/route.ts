import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { createLogEntry } from '@/lib/services/logsService';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Récupérer l'ID de l'étudiant
    const { id } = await params;
    const studentId = parseInt(id);
    
    if (isNaN(studentId)) {
      return NextResponse.json({ error: 'ID étudiant invalide' }, { status: 400 });
    }

    // Récupérer les données du corps de la requête
    const requestData = await req.json();
    const { password } = requestData;

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

    // Vérifier le mot de passe
    const passwordResults = await query<any[]>(`
      SELECT student_id FROM student_pass 
      WHERE student_id = ? AND password = ?
    `, [studentId, password]);

    if (!passwordResults || passwordResults.length === 0) {
      // Journal des tentatives de connexion échouées
      await createLogEntry({
        action_type: 'STUDENT_ACCESS_FAILURE',
        description: `Échec d'accès à la page de corrections de l'étudiant ID: ${studentId}`,
        entity_type: 'student',
        entity_id: studentId,
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        metadata: {
          student_id: studentId,
          reason: 'Mot de passe incorrect',
          user_agent: req.headers.get('user-agent') || 'unknown'
        }
      });
      
      return NextResponse.json({ 
        authenticated: false,
        error: 'Mot de passe incorrect' 
      }, { status: 401 });
    }

    // Journaliser l'accès réussi
    await createLogEntry({
      action_type: 'STUDENT_ACCESS_SUCCESS',
      description: `Accès à la page de corrections de l'étudiant ID: ${studentId}`,
      entity_type: 'student',
      entity_id: studentId,
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
      metadata: {
        student_id: studentId,
        student_name: `${students[0].first_name} ${students[0].last_name}`,
        user_agent: req.headers.get('user-agent') || 'unknown'
      }
    });

    // Retourner un token temporaire pour la session
    // Dans une implémentation réelle, on pourrait utiliser JWT ou une autre méthode de session sécurisée
    const accessToken = Buffer.from(`${studentId}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`).toString('base64');
    
    return NextResponse.json({
      authenticated: true,
      accessToken,
      studentId,
      studentName: `${students[0].first_name} ${students[0].last_name}`
    });
  } catch (error) {
    console.error('Erreur lors de la vérification du mot de passe:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' }, 
      { status: 500 }
    );
  }
}