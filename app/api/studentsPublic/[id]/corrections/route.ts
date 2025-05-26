import { NextRequest, NextResponse } from 'next/server';
import { withConnection } from '@/lib/db';
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { getUser } from '@/lib/auth';
import { createLogEntry } from '@/lib/services/logsService';
import { createFeedbackNotification } from '@/lib/services/notificationService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    const customUser = await getUser(request);
    
    // Use either auth system, starting with custom auth
    const userId = customUser?.id || session?.user?.id;
    
    if (!userId) {
      // Log access only for unauthenticated users
      const { id } = await params;
      const studentId = parseInt(id);
      
      await createLogEntry({
        action_type: 'GET_STUDENT_PUBLIC_CORRECTIONS',
        description: `Accès non authentifié aux corrections publiques de l'étudiant ID: ${studentId}`,
        entity_type: 'student',
        entity_id: studentId,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        metadata: {
          path: request.nextUrl.pathname,
          method: request.method
        }
      });
    }

    // Await the params
    const { id } = await params;
    const studentId = parseInt(id);
    
    if (isNaN(studentId)) {
      return NextResponse.json({ error: 'ID étudiant invalide' }, { status: 400 });
    }

    // Vérifier que l'étudiant existe
    return await withConnection(async (connection) => {
      // Vérifier si l'étudiant existe
      const [studentResult] = await connection.query(
        'SELECT id FROM students WHERE id = ?',
        [studentId]
      );

      if (!Array.isArray(studentResult) || (studentResult as any[]).length === 0) {
        return NextResponse.json({ error: 'Étudiant non trouvé' }, { status: 404 });
      }

      // Récupérer toutes les corrections pour cet étudiant avec informations sur l'activité
      const [corrections] = await connection.query(
        `SELECT 
           c.*,
           a.name AS activity_name, 
           a.points,
           a.parts_names,
           cl.name AS class_name,
           s.first_name AS student_first_name,
           s.last_name AS student_last_name,
           CONCAT(s.first_name, ' ', LEFT(s.last_name, 1), '.') as student_name
         FROM 
           corrections_autres c
         LEFT JOIN 
           activities_autres a ON c.activity_id = a.id
         LEFT JOIN
           classes cl ON c.class_id = cl.id
         LEFT JOIN
           students s ON c.student_id = s.id
         WHERE 
           c.student_id = ?
         ORDER BY 
           c.submission_date DESC, c.created_at DESC`,
        [studentId]
      );

      // Si aucune correction n'est trouvée, retourner un tableau vide
      if (!Array.isArray(corrections) || (corrections as any[]).length === 0) {
        return NextResponse.json([]);
      }

      // Log et notification pour la visite de la page corrections (hors admin)
      if (userId !== 1) {
        try {
          const userAgent = request.headers.get('user-agent') || 'unknown';
          const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
          const referer = request.headers.get('referer') || 'direct';
          const firstCorrection = Array.isArray(corrections) && corrections.length > 0 ? corrections[0] as any : null;
          const logEntry = {
            action_type: 'VIEW_STUDENT_CORRECTIONS',
            description: `Consultation de la page corrections de l'étudiant #${studentId}`,
            entity_type: 'student',
            entity_id: studentId,
            ip_address: ipAddress,
            metadata: {
              student_id: studentId,
              student_name: firstCorrection ? firstCorrection.student_name : undefined,
              browser: userAgent,
              referer: referer,
              timestamp: new Date().toISOString(),
              correction_ids: Array.isArray(corrections) ? corrections.map((c: any) => c.id) : [],
            }
          };
          // Insérer le log
          const [logResult] = await connection.query(
            `INSERT INTO system_logs (action_type, description, entity_type, entity_id, ip_address, metadata)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              logEntry.action_type,
              logEntry.description,
              logEntry.entity_type,
              logEntry.entity_id,
              logEntry.ip_address,
              JSON.stringify(logEntry.metadata)
            ]
          );
          const logId = (logResult as any).insertId;
          // Créer la notification liée à ce log
          if (logId) {
            // Attention à bien importer la fonction !
            await createFeedbackNotification(logId);
          }
        } catch (e) {
          console.error('Erreur lors du log/notification de visite corrections', e);
        }
      }

      // Formater les résultats pour le frontend avec une gestion plus robuste du content_data
      const formattedCorrections = (corrections as any[]).map(correction => {
        // Gérer le parsing de content_data de manière sécurisée
        let parsedContentData = null;
        if (correction.content_data) {
          try {
            // Vérifier si content_data est déjà un objet
            if (typeof correction.content_data === 'object') {
              parsedContentData = correction.content_data;
            } else {
              parsedContentData = JSON.parse(correction.content_data);
            }
          } catch (error) {
            console.error("Erreur de parsing JSON pour content_data:", error);
            // En cas d'erreur, conserver la donnée brute
            parsedContentData = { raw: correction.content_data };
          }
        }

        // Parser les points et parts_names qui sont stockés en JSON dans la base de données
        let points = [];
        try {
          points = correction.points ? correction.points : [];
        } catch (e) {
          console.error("Erreur lors du parsing des points:", e);
          points = [];
        }

        let partsNames = [];
        try {
          partsNames = correction.parts_names ? correction.parts_names : [];
        } catch (e) {
          console.error("Erreur lors du parsing des parts_names:", e);
          partsNames = [];
        }

        let pointsEarned = [];
        try {
          pointsEarned = correction.points_earned ? correction.points_earned : [];
        } catch (e) {
          console.error("Erreur lors du parsing des points_earned:", e);
          pointsEarned = [];
        }

        return {
          id: correction.id,
          activity_id: correction.activity_id,
          content: correction.content,
          content_data: parsedContentData,
          created_at: correction.created_at,
          updated_at: correction.updated_at,
          grade: correction.grade,
          penalty: correction.penalty,
          deadline: correction.deadline,
          submission_date: correction.submission_date,
          points: points,
          parts_names: partsNames,
          points_earned: pointsEarned,
          final_grade: correction.final_grade,
          group_id: correction.group_id,
          class_id: correction.class_id,
          student_id: correction.student_id,
          student_name: correction.student_name || 'Étudiant inconnu',
          student_first_name: correction.student_first_name || '',
          status: correction.status,
          student_last_name: correction.student_last_name ? correction.student_last_name.substring(0, 3) : '',
          activity_name: correction.activity_name || 'Activité inconnue',
          class_name: correction.class_name || 'Sans classe'
        };
      });
      
      return NextResponse.json(formattedCorrections);
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des corrections:', error);
    let errorMessage = '';
    let errorDetails = '';
    
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = error.stack || '';
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    return NextResponse.json(
      { 
        error: error,
        details: errorDetails,
        status: 500,
        statusText: 'Internal Server Error'
      }, 
      { status: 500 }
    );
  }
}
